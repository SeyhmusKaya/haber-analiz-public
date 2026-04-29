<?php
namespace App\Services;

use App\Models\Article;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EmbeddingService
{
    public function __construct(private GeminiService $gemini) {}

    public function embedNewArticles(): int
    {
        $count = 0;

        // Sadece embedding'i olmayan, son 24 saatte eklenen makaleler
        $articles = Article::whereNull('embedding')
            ->where('created_at', '>=', now()->subHours(24))
            ->orderBy('created_at', 'desc')
            ->limit(2000)
            ->select(['id', 'title', 'summary'])
            ->get();

        if ($articles->isEmpty()) {
            Log::info("Embedding: no new articles to embed");
            return 0;
        }

        // Metin bazlı deduplikasyon: aynı başlık+özet → aynı embedding
        $grouped = $articles->groupBy(fn($a) => md5($a->title . ($a->summary ?? '')));

        // Her unique metin grubu için tek bir embedding al
        $uniqueHashes = $grouped->keys()->toArray();
        $uniqueTexts  = $grouped->map(fn($group) => $this->prepareText($group->first()))->values()->toArray();

        foreach (array_chunk($uniqueHashes, 50) as $chunkIdx => $hashBatch) {
            $textBatch = array_slice($uniqueTexts, $chunkIdx * 50, 50);

            // Rate limit koruması: her batch arasında 5sn bekle (free tier ~15 RPM)
            if ($chunkIdx > 0) sleep(5);

            $embeddings = $this->batchEmbedWithRetry(array_values($textBatch));
            if (empty($embeddings)) continue;

            // Her embedding'i, o hash'e sahip TÜM article'lara uygula
            $pairs = [];
            foreach (array_values($hashBatch) as $i => $hash) {
                if (empty($embeddings[$i])) continue;
                foreach ($grouped[$hash] as $article) {
                    $pairs[] = [$article->id, $embeddings[$i]];
                }
            }

            if (!empty($pairs)) {
                $this->bulkUpdateEmbeddings($pairs);
                $count += count($pairs);
            }
        }

        Log::info("Embedding: processed {$count} articles");
        return $count;
    }

    // Opus'un #5 önerisi: 500 karakter truncation — embedding kalitesi korunur, token %50 azalır
    private function prepareText(Article $article): string
    {
        $title   = trim($article->title);
        $summary = mb_substr(trim($article->summary ?? ''), 0, 500);
        return $title . '. ' . $summary;
    }

    private function batchEmbedWithRetry(array $texts, int $maxRetries = 5): array
    {
        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            $embeddings = $this->gemini->batchEmbed($texts);
            if (!empty($embeddings)) return $embeddings;
            // 429 rate limit için üstel bekleme: 10s, 20s, 40s, 60s...
            $wait = min(10 * (2 ** ($attempt - 1)), 60);
            Log::warning("Embedding batch failed (attempt {$attempt}/{$maxRetries}), waiting {$wait}s...");
            sleep($wait);
        }
        return [];
    }

    private function bulkUpdateEmbeddings(array $pairs): void
    {
        if (empty($pairs)) return;

        DB::transaction(function () use ($pairs) {
            foreach (array_chunk($pairs, 10) as $chunk) {
                foreach ($chunk as [$id, $emb]) {
                    DB::table('articles')
                        ->where('id', $id)
                        ->update([
                            'embedding'  => json_encode($emb),
                            'updated_at' => now(),
                        ]);
                }
            }
        });
    }
}
