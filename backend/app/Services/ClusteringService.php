<?php
namespace App\Services;

use App\Models\Article;
use App\Models\Event;
use Illuminate\Support\Facades\Log;

class ClusteringService
{
    private const SIMILARITY_THRESHOLD = 0.82;
    private const MIN_COUNTRIES        = 2;
    private const PYTHON_SCRIPT        = __DIR__ . '/../../clustering_service.py';
    private const BATCH_SIZE           = 2000;   // per cron run
    private const CENTROID_DAYS        = 7;      // look-back for existing events

    public function __construct(private GeminiService $gemini) {}

    public function clusterRecentArticles(): int
    {
        $lockFile = storage_path('app/clustering.lock');
        if (file_exists($lockFile) && (time() - filemtime($lockFile)) < 300) {
            Log::info('Clustering: already running, skipping');
            return 0;
        }
        touch($lockFile);

        $result = 0;
        try {
            $result = $this->doCluster(7);
        } finally {
            @unlink($lockFile);
        }
        return $result;
    }

    public function clusterHistoricalArticles(int $days = 30): int
    {
        $lockFile = storage_path('app/clustering-history.lock');
        if (file_exists($lockFile) && (time() - filemtime($lockFile)) < 600) {
            Log::info('Clustering history: already running, skipping');
            return 0;
        }
        touch($lockFile);

        $result = 0;
        try {
            $result = $this->doCluster($days);
        } finally {
            @unlink($lockFile);
        }
        return $result;
    }

    private function doCluster(int $days = 7): int
    {
        // Load unprocessed articles (batch limit to keep cron fast)
        $rows = Article::whereNotNull('articles.embedding')
            ->leftJoin('event_articles', 'articles.id', '=', 'event_articles.article_id')
            ->whereNull('event_articles.article_id')
            ->where('articles.published_at', '>=', now()->subDays($days))
            ->orderBy('articles.published_at', 'desc')
            ->limit(self::BATCH_SIZE)
            ->select(['articles.id', 'articles.source_id', 'articles.title', 'articles.summary', 'articles.embedding', 'articles.published_at'])
            ->with('source:id,country_code,bias')
            ->get();

        if ($rows->isEmpty()) {
            Log::info('Clustering: no articles to cluster');
            return 0;
        }

        Log::info("Clustering: processing {$rows->count()} articles");

        // Build article data arrays
        $embeddings  = [];  // [idx => float[]]
        $articleIds  = [];  // [idx => article_id]
        $meta        = [];  // [article_id => [...]]

        foreach ($rows as $row) {
            $emb = is_array($row->embedding) ? $row->embedding : json_decode($row->embedding, true);
            if (empty($emb)) continue;

            $idx = count($articleIds);
            $embeddings[$idx]        = $emb;
            $articleIds[$idx]        = $row->id;
            $meta[$row->id] = [
                'source_id'    => $row->source_id,
                'country_code' => $row->source->country_code ?? null,
                'bias'         => $row->source->bias ?? null,
                'published_at' => $row->published_at->timestamp,
                'title'        => $row->title,
                'summary'      => $row->summary,
            ];
        }

        if (empty($articleIds)) {
            Log::info('Clustering: no valid embeddings found');
            return 0;
        }

        // Load existing event centroids
        $centroids = [];
        Event::whereNotNull('centroid')
            ->where('created_at', '>=', now()->subDays(self::CENTROID_DAYS))
            ->get(['id', 'centroid'])
            ->each(function ($event) use (&$centroids) {
                $c = is_array($event->centroid) ? $event->centroid : json_decode($event->centroid, true);
                if (!empty($c)) {
                    $centroids[(string)$event->id] = $c;
                }
            });

        Log::info("Clustering: " . count($centroids) . " existing event centroids loaded");

        // Delegate ALL math to Python (numpy)
        $result = $this->runPython($embeddings, $centroids);

        if ($result === null) {
            Log::warning('Clustering: Python failed, aborting');
            return 0;
        }

        $matched     = $result['matched']     ?? [];   // {article_idx => event_id}
        $labels      = $result['labels']      ?? [];   // [label per article]
        $numClusters = $result['num_clusters'] ?? 0;

        Log::info("Clustering: Python matched " . count($matched) . " articles to existing events, {$numClusters} new cluster groups");

        $totalAdded = 0;

        // --- Phase 1 results: attach matched articles to existing events ---
        $byEvent = [];  // [event_id => [article_id, ...]]
        foreach ($matched as $idxStr => $eventId) {
            $idx = (int)$idxStr;
            $articleId = $articleIds[$idx] ?? null;
            if ($articleId !== null) {
                $byEvent[$eventId][] = $articleId;
            }
        }

        foreach ($byEvent as $eventId => $ids) {
            $event = Event::find($eventId);
            if (!$event) continue;
            $event->articles()->syncWithoutDetaching($ids);
            $this->recomputeCentroid($event);
            $totalAdded += count($ids);
        }

        // --- Phase 2 results: create new events from unmatched clusters ---
        $groups = [];  // [label => [article_id, ...]]
        foreach ($labels as $idx => $label) {
            if ($label < 0) continue;  // -1 = was matched in Phase 1
            $articleId = $articleIds[$idx] ?? null;
            if ($articleId !== null) {
                $groups[$label][] = $articleId;
            }
        }

        $newEvents = 0;
        foreach ($groups as $group) {
            $countries = array_unique(array_filter(array_map(fn($id) => $meta[$id]['country_code'] ?? null, $group)));
            $multiCountry = count($countries) >= self::MIN_COUNTRIES;
            $trBias       = $this->hasTrBias($group, $meta);

            if (!$multiCountry && !$trBias) continue;

            $this->createPendingEvent($group, $meta);
            $newEvents++;
        }

        Log::info("Clustering: {$totalAdded} added to existing events, {$newEvents} new events created");
        return $totalAdded + $newEvents;
    }

    // -------------------------------------------------------------------------
    // Python runner — all math delegated here
    // -------------------------------------------------------------------------

    private function runPython(array $embeddings, array $centroids): ?array
    {
        if (!file_exists(self::PYTHON_SCRIPT) || !$this->pythonAvailable()) {
            Log::warning('Clustering: Python/script not available');
            return null;
        }

        $inputFile  = storage_path('app/cluster_input.json');
        $outputFile = storage_path('app/cluster_output.json');

        $payload = [
            'embeddings' => array_values($embeddings),
            'centroids'  => $centroids,
            'threshold'  => self::SIMILARITY_THRESHOLD,
        ];

        file_put_contents($inputFile, json_encode($payload));

        $script = escapeshellarg(self::PYTHON_SCRIPT);
        $input  = escapeshellarg($inputFile);
        $output = escapeshellarg($outputFile);

        shell_exec("python3 {$script} --input {$input} --output {$output} 2>/dev/null");

        @unlink($inputFile);

        if (!file_exists($outputFile)) {
            Log::warning('Clustering: Python produced no output file');
            return null;
        }

        $raw = file_get_contents($outputFile);
        @unlink($outputFile);

        $result = json_decode($raw, true);
        if (!is_array($result) || isset($result['error'])) {
            Log::warning('Clustering: Python error: ' . ($result['error'] ?? 'unknown'));
            return null;
        }

        return $result;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function hasTrBias(array $group, array $meta): bool
    {
        $hasProGov    = false;
        $hasOpposition = false;
        foreach ($group as $id) {
            if (($meta[$id]['country_code'] ?? '') !== 'TR') continue;
            if (($meta[$id]['bias'] ?? '') === 'pro_gov')    $hasProGov = true;
            if (($meta[$id]['bias'] ?? '') === 'opposition') $hasOpposition = true;
            if ($hasProGov && $hasOpposition) return true;
        }
        return false;
    }

    private function createPendingEvent(array $articleIds, array $meta): Event
    {
        $importance = min(10, max(1, (int)(count($articleIds) / 2)));

        $event = Event::create([
            'title_tr'         => null,
            'summary_tr'       => null,
            'category'         => null,
            'importance_score' => $importance,
            'status'           => 'pending',
        ]);

        $event->articles()->attach($articleIds);
        $this->recomputeCentroid($event);

        return $event;
    }

    private function recomputeCentroid(Event $event): void
    {
        $articleEmbeddings = Article::whereIn('id', $event->articles()->pluck('articles.id'))
            ->whereNotNull('embedding')
            ->pluck('embedding');

        if ($articleEmbeddings->isEmpty()) return;

        $vectors = $articleEmbeddings->map(function ($emb) {
            return is_array($emb) ? $emb : json_decode($emb, true);
        })->filter()->values();

        if ($vectors->isEmpty()) return;

        $dim      = count($vectors[0]);
        $centroid = array_fill(0, $dim, 0.0);

        foreach ($vectors as $v) {
            for ($i = 0; $i < $dim; $i++) {
                $centroid[$i] += $v[$i];
            }
        }

        $count = count($vectors);
        for ($i = 0; $i < $dim; $i++) {
            $centroid[$i] /= $count;
        }

        $event->update(['centroid' => $this->normalize($centroid)]);
    }

    private function normalize(array $v): array
    {
        $norm = 0.0;
        foreach ($v as $val) $norm += $val * $val;
        $norm = sqrt($norm);
        if ($norm == 0) return $v;
        return array_map(fn($x) => $x / $norm, $v);
    }

    private function pythonAvailable(): bool
    {
        return !empty(shell_exec('python3 --version 2>/dev/null'));
    }
}
