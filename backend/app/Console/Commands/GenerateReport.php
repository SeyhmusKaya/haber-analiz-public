<?php
namespace App\Console\Commands;

use App\Services\GeminiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GenerateReport extends Command
{
    protected $signature = 'haber:generate-report
        {type=weekly : weekly or monthly}
        {--focus=all : all | kutuplasmalar (TR sources) | international (non-TR)}
        {--countries= : Comma-separated country codes, e.g. TR,US,GB}
        {--categories= : Comma-separated categories, e.g. siyaset,ekonomi}
        {--current : Use current period instead of previous period}
        {--force : Overwrite existing report for this period}';

    protected $description = 'Generate a weekly or monthly media analysis report via AI';

    private const COUNTRY_NAMES = [
        'TR' => 'Türkiye', 'US' => 'ABD', 'GB' => 'İngiltere', 'DE' => 'Almanya',
        'RU' => 'Rusya',   'CN' => 'Çin', 'IR' => 'İran',      'IL' => 'İsrail',
        'SA' => 'Suudi Arabistan', 'EG' => 'Mısır',
    ];

    private const CAT_LABELS = [
        'siyaset' => 'Siyaset', 'ekonomi' => 'Ekonomi', 'savas-catisma' => 'Savaş/Çatışma',
        'diplomasi' => 'Diplomasi', 'teknoloji' => 'Teknoloji', 'saglik' => 'Sağlık',
        'cevre' => 'Çevre', 'spor' => 'Spor', 'kultur' => 'Kültür', 'diger' => 'Diğer',
    ];

    public function __construct(private GeminiService $gemini)
    {
        parent::__construct();
    }

    public function handle(): void
    {
        $type = $this->argument('type');
        if (!in_array($type, ['weekly', 'monthly'])) {
            $this->error('Type must be "weekly" or "monthly".');
            return;
        }

        $focus      = $this->option('focus') ?: 'all';
        $countries  = $this->option('countries')
            ? array_values(array_filter(explode(',', $this->option('countries'))))
            : [];
        $categories = $this->option('categories')
            ? array_values(array_filter(explode(',', $this->option('categories'))))
            : [];
        $current    = (bool) $this->option('current');
        $force      = (bool) $this->option('force');

        [$periodStart, $periodEnd] = $this->getPeriod($type, $current);

        if (!$force) {
            $exists = DB::table('reports')
                ->where('type', $type)
                ->where('period_start', $periodStart)
                ->exists();
            if ($exists) {
                $this->info("Report for {$type} {$periodStart} already exists. Use --force to overwrite.");
                return;
            }
        }

        $this->info("Generating {$type} report for {$periodStart} → {$periodEnd} (focus={$focus})...");

        // ── Event query ──────────────────────────────────────────────
        $eventQuery = DB::table('events')
            ->whereBetween('created_at', [$periodStart . ' 00:00:00', $periodEnd . ' 23:59:59'])
            ->orderByDesc('importance_score');

        if ($focus === 'kutuplasmalar') {
            $eventQuery->whereExists(fn($q) => $q->select(DB::raw(1))
                ->from('event_articles as ea')->join('articles as a', 'a.id', '=', 'ea.article_id')
                ->join('sources as s', 's.id', '=', 'a.source_id')
                ->whereRaw('ea.event_id = events.id')->where('s.country_code', 'TR')->where('s.bias', 'pro_gov')
            )->whereExists(fn($q) => $q->select(DB::raw(1))
                ->from('event_articles as ea')->join('articles as a', 'a.id', '=', 'ea.article_id')
                ->join('sources as s', 's.id', '=', 'a.source_id')
                ->whereRaw('ea.event_id = events.id')->where('s.country_code', 'TR')->where('s.bias', 'opposition')
            );
        } elseif ($focus === 'international') {
            $eventQuery->whereNotExists(fn($q) => $q->select(DB::raw(1))
                ->from('event_articles as ea')->join('articles as a', 'a.id', '=', 'ea.article_id')
                ->join('sources as s', 's.id', '=', 'a.source_id')
                ->whereRaw('ea.event_id = events.id')->where('s.country_code', 'TR')
            );
        }

        if (!empty($countries)) {
            $eventQuery->where(function ($q) use ($countries) {
                foreach ($countries as $c) {
                    $q->orWhereExists(fn($sub) => $sub->select(DB::raw(1))
                        ->from('event_articles as ea')->join('articles as a', 'a.id', '=', 'ea.article_id')
                        ->join('sources as s', 's.id', '=', 'a.source_id')
                        ->whereRaw('ea.event_id = events.id')->where('s.country_code', $c)
                    );
                }
            });
        }

        if (!empty($categories)) {
            $eventQuery->whereIn('category', $categories);
        }

        $topN   = $type === 'weekly' ? 60 : 200;
        $events = $eventQuery->limit($topN)->get(['id', 'title_tr', 'summary_tr', 'category', 'importance_score']);

        if ($events->isEmpty()) {
            $this->warn('No events found for this period with the given filters.');
            return;
        }

        $eventIds = $events->pluck('id');

        // ── İstatistikler (gerçek DB verileri) ───────────────────────
        $eventCount  = $events->count();
        $sourceCount = DB::table('articles')
            ->whereBetween('published_at', [$periodStart . ' 00:00:00', $periodEnd . ' 23:59:59'])
            ->distinct('source_id')->count('source_id');

        // Toplam makale sayısı
        $articleCount = DB::table('event_articles as ea')
            ->join('articles as a', 'a.id', '=', 'ea.article_id')
            ->whereIn('ea.event_id', $eventIds)
            ->count();

        // Kategori dağılımı
        $categoryDist = $this->getCategoryDistribution($events);

        // Ülke kapsamı
        $countryCoverage = $this->getCountryCoverage($eventIds);
        $countryCount    = count($countryCoverage) ?: 10;

        // Haftanın en önemli haberleri (top 10 for weekly, top 15 for monthly)
        $topEventLimit = $type === 'weekly' ? 10 : 15;
        $topEvents = $events->take($topEventLimit)->values();

        // TR medya kutuplaşma karşılaştırması
        $biasComparison = $this->getBiasComparison($eventIds);

        // Suskunluk: Uluslararası medyanın işlediği ama TR medyasının işlemediği haber sayısı
        $silenceCount = $this->getSilenceCount($eventIds);

        // Önceki dönemle karşılaştırma
        $prevDelta = $this->getPrevPeriodDelta($type, $periodStart, $eventCount, $sourceCount);

        // ── AI Prompt ────────────────────────────────────────────────
        $periodLabel = $type === 'weekly'
            ? date('d M Y', strtotime($periodStart)) . ' – ' . date('d M Y', strtotime($periodEnd))
            : date('F Y', strtotime($periodStart));
        $typeLabel   = $type === 'weekly' ? 'Haftalık' : 'Aylık';
        $focusNote   = match ($focus) {
            'kutuplasmalar' => ' Türkiye iç siyaset ve kutuplaşma odaklı haberler üzerine yoğunlaş.',
            'international' => ' Uluslararası haber ve diplomasi odaklı haberler üzerine yoğunlaş.',
            default         => '',
        };

        $eventList = $events->take(30)->map(fn($e) =>
            "- [{$e->category}] {$e->title_tr}" . ($e->summary_tr ? ": " . mb_substr($e->summary_tr, 0, 100) : "")
        )->implode("\n");

        $catSummary = collect($categoryDist)->take(5)->map(fn($c) => "{$c['label']}: {$c['count']} haber")->implode(', ');
        $countrySummary = collect($countryCoverage)->take(5)->map(fn($c) => "{$c['name']}: {$c['count']} haber")->implode(', ');

        $prompt = <<<PROMPT
Sen bir medya analisti yapay zekasısın. Aşağıdaki veriler için Türkçe bir {$typeLabel} Medya İzleme Raporu yaz.{$focusNote}

Dönem: {$periodLabel}
Analiz edilen olay sayısı: {$eventCount}
Aktif kaynak sayısı: {$sourceCount}
Kapsanan ülke sayısı: {$countryCount}
Öne çıkan kategoriler: {$catSummary}
En çok yer verilen ülkeler: {$countrySummary}
TR medyasının es geçtiği uluslararası haber sayısı: {$silenceCount}

Öne çıkan haberler:
{$eventList}

Lütfen aşağıdaki JSON formatında yanıt ver (başka hiçbir şey yazma, markdown kullanma):
{
  "title": "Rapor başlığı (kısa ve etkili, {$typeLabel} Rapor ifadesi içersin)",
  "summary": "Dönemin medya ortamını özetleyen 4-5 cümlelik paragraf. Öne çıkan temalar, ülkeler arası tutum farkları ve dikkat çekici eğilimleri belirt.",
  "highlights": [
    "Öne çıkan analitik bulgu 1 (somut, 1-2 cümle)",
    "Öne çıkan analitik bulgu 2 (somut, 1-2 cümle)",
    "Öne çıkan analitik bulgu 3 (somut, 1-2 cümle)",
    "Öne çıkan analitik bulgu 4 (somut, 1-2 cümle)",
    "Öne çıkan analitik bulgu 5 (somut, 1-2 cümle)"
  ],
  "trend_note": "Bu dönemin en dikkat çekici medya eğilimi veya sessizliğine dair 1-2 cümlelik not"
}
PROMPT;

        $raw = $this->gemini->generate($prompt, 4096);
        if (!$raw) {
            $this->error('AI yanıt vermedi.');
            return;
        }

        $jsonStr = $raw;
        if (preg_match('/```json\s*([\s\S]+?)\s*```/i', $raw, $m)) {
            $jsonStr = $m[1];
        } elseif (preg_match('/\{[\s\S]+\}/u', $raw, $m)) {
            $jsonStr = $m[0];
        }

        $aiContent = json_decode($jsonStr, true);
        if (!$aiContent) {
            $this->error('AI yanıtı JSON parse edilemedi: ' . mb_substr($raw, 0, 300));
            return;
        }

        // ── İçerik objesi birleştir ───────────────────────────────────
        $content = array_merge($aiContent, [
            'stats' => [
                'events'   => $eventCount,
                'sources'  => $sourceCount,
                'articles' => $articleCount,
                'countries' => $countryCount,
            ],
            'top_events'            => $topEvents->map(fn($e) => [
                'id'              => $e->id,
                'title'           => $e->title_tr,
                'category'        => $e->category,
                'importance_score' => $e->importance_score,
            ])->toArray(),
            'category_distribution' => $categoryDist,
            'country_coverage'      => $countryCoverage,
            'bias_comparison'       => $biasComparison,
            'silence_count'         => $silenceCount,
            'prev_delta'            => $prevDelta,
            'top_categories'        => array_column(array_slice($categoryDist, 0, 5), 'category'),
            'meta'                  => [
                'focus'      => $focus,
                'countries'  => $countries ?: null,
                'categories' => $categories ?: null,
            ],
        ]);

        $title       = $content['title'] ?? "{$typeLabel} Medya Analiz Raporu — {$periodLabel}";
        $htmlContent = $this->buildHtmlContent($content);

        if ($force) {
            DB::table('reports')->where('type', $type)->where('period_start', $periodStart)->delete();
        }

        DB::table('reports')->insert([
            'type'         => $type,
            'title'        => $title,
            'content'      => json_encode($content, JSON_UNESCAPED_UNICODE),
            'html_content' => $htmlContent,
            'period_start' => $periodStart,
            'period_end'   => $periodEnd,
            'created_at'   => now(),
        ]);

        $this->info("Başarıyla rapor oluşturuldu.");
        Log::info("Report generated: {$type} {$periodStart} — {$title}");
    }

    // ── Veri toplama yardımcıları ─────────────────────────────────────

    private function getCategoryDistribution($events): array
    {
        $total  = $events->count();
        $counts = $events->groupBy('category')->map->count()->sortDesc();
        $result = [];
        foreach ($counts as $cat => $count) {
            $result[] = [
                'category' => $cat,
                'label'    => self::CAT_LABELS[$cat] ?? ucfirst($cat),
                'count'    => $count,
                'pct'      => $total > 0 ? round($count / $total * 100) : 0,
            ];
        }
        return $result;
    }

    private function getCountryCoverage($eventIds): array
    {
        $rows = DB::table('event_articles as ea')
            ->join('articles as a', 'a.id', '=', 'ea.article_id')
            ->join('sources as s', 's.id', '=', 'a.source_id')
            ->whereIn('ea.event_id', $eventIds)
            ->selectRaw('s.country_code, count(distinct ea.event_id) as cnt')
            ->groupBy('s.country_code')
            ->orderByDesc('cnt')
            ->get();

        return $rows->map(fn($r) => [
            'code'  => $r->country_code,
            'name'  => self::COUNTRY_NAMES[$r->country_code] ?? $r->country_code,
            'count' => $r->cnt,
        ])->values()->toArray();
    }

    private function getBiasComparison($eventIds): array
    {
        $build = function (string $bias) use ($eventIds): array {
            $rows = DB::table('event_articles as ea')
                ->join('articles as a', 'a.id', '=', 'ea.article_id')
                ->join('sources as s', 's.id', '=', 'a.source_id')
                ->join('events as e', 'e.id', '=', 'ea.event_id')
                ->whereIn('ea.event_id', $eventIds)
                ->where('s.country_code', 'TR')
                ->where('s.bias', $bias)
                ->whereNotNull('e.category')
                ->selectRaw('e.category, count(distinct ea.event_id) as cnt')
                ->groupBy('e.category')
                ->orderByDesc('cnt')
                ->limit(4)
                ->pluck('category')
                ->map(fn($c) => self::CAT_LABELS[$c] ?? ucfirst($c))
                ->values()
                ->toArray();
            return $rows;
        };

        return [
            'pro_gov'    => $build('pro_gov'),
            'opposition' => $build('opposition'),
        ];
    }

    private function getSilenceCount($eventIds): int
    {
        // Uluslararası kaynaklardan haberdar olunan ama TR kaynakları olmayan event sayısı
        return DB::table('events as e')
            ->whereIn('e.id', $eventIds)
            ->whereExists(fn($q) => $q->select(DB::raw(1))
                ->from('event_articles as ea')->join('articles as a', 'a.id', '=', 'ea.article_id')
                ->join('sources as s', 's.id', '=', 'a.source_id')
                ->whereRaw('ea.event_id = e.id')->where('s.country_code', '!=', 'TR')
            )
            ->whereNotExists(fn($q) => $q->select(DB::raw(1))
                ->from('event_articles as ea')->join('articles as a', 'a.id', '=', 'ea.article_id')
                ->join('sources as s', 's.id', '=', 'a.source_id')
                ->whereRaw('ea.event_id = e.id')->where('s.country_code', 'TR')
            )
            ->count();
    }

    private function getPrevPeriodDelta(string $type, string $periodStart, int $curEvents, int $curSources): array
    {
        if ($type === 'weekly') {
            $prevStart = date('Y-m-d', strtotime($periodStart . ' -7 days'));
            $prevEnd   = date('Y-m-d', strtotime($periodStart . ' -1 day'));
        } else {
            $prevStart = date('Y-m-01', strtotime($periodStart . ' -1 month'));
            $prevEnd   = date('Y-m-t',  strtotime($prevStart));
        }

        $prevEvents  = DB::table('events')->whereBetween('created_at', [$prevStart . ' 00:00:00', $prevEnd . ' 23:59:59'])->count();
        $prevSources = DB::table('articles')->whereBetween('published_at', [$prevStart . ' 00:00:00', $prevEnd . ' 23:59:59'])->distinct('source_id')->count('source_id');

        return [
            'events'  => $curEvents - $prevEvents,
            'sources' => $curSources - $prevSources,
        ];
    }

    // ── HTML içerik oluşturucu ────────────────────────────────────────

    private function buildHtmlContent(array $content): string
    {
        $summary     = htmlspecialchars($content['summary'] ?? '');
        $trendNote   = htmlspecialchars($content['trend_note'] ?? '');
        $highlights  = $content['highlights'] ?? [];
        $stats       = $content['stats'] ?? [];
        $topEvents   = $content['top_events'] ?? [];
        $catDist     = $content['category_distribution'] ?? [];
        $countryList = $content['country_coverage'] ?? [];
        $biasComp    = $content['bias_comparison'] ?? [];
        $silence     = $content['silence_count'] ?? 0;
        $prevDelta   = $content['prev_delta'] ?? [];
        $meta        = $content['meta'] ?? [];
        $focus       = $meta['focus'] ?? 'all';

        // İstatistikler
        $prevEventsBadge = '';
        if (isset($prevDelta['events']) && $prevDelta['events'] !== 0) {
            $sign  = $prevDelta['events'] > 0 ? '+' : '';
            $color = $prevDelta['events'] > 0 ? '#16a34a' : '#dc2626';
            $prevEventsBadge = " <span style=\"font-size:12px;color:{$color};font-weight:600\">{$sign}{$prevDelta['events']}</span>";
        }

        $statsHtml = implode('', array_map(fn($s) =>
            "<div class=\"rpt-stat\"><div class=\"rpt-stat-icon\">{$s['icon']}</div>"
          . "<div class=\"rpt-stat-val\">{$s['value']}{$s['badge']}</div>"
          . "<div class=\"rpt-stat-lbl\">{$s['label']}</div></div>",
            [
                ['icon' => '📰', 'value' => $stats['events']    ?? 0, 'label' => 'Haber Analiz Edildi', 'badge' => $prevEventsBadge],
                ['icon' => '📡', 'value' => $stats['sources']   ?? 0, 'label' => 'Aktif Kaynak',        'badge' => ''],
                ['icon' => '🌍', 'value' => $stats['countries'] ?? 0, 'label' => 'Ülke Kapsandı',       'badge' => ''],
                ['icon' => '📄', 'value' => $stats['articles']  ?? 0, 'label' => 'Toplam Makale',        'badge' => ''],
            ]
        ));

        // Öne çıkan bulgular
        $highlightsHtml = implode('', array_map(fn($h, $i) =>
            '<div class="rpt-highlight"><span class="rpt-hl-num">' . ($i + 1) . '</span>'
          . '<span>' . htmlspecialchars($h) . '</span></div>',
            $highlights, array_keys($highlights)
        ));

        // Haftanın en önemli haberleri
        $topEventsHtml = implode('', array_map(fn($e, $i) => sprintf(
            '<div class="rpt-event-row"><span class="rpt-event-num">%d</span>'
          . '<div class="rpt-event-body">'
          . '<a href="/haber/%d" class="rpt-event-title">%s</a>'
          . '<span class="rpt-event-cat">%s</span>'
          . '</div></div>',
            $i + 1, $e['id'],
            htmlspecialchars($e['title']),
            htmlspecialchars(self::CAT_LABELS[$e['category'] ?? ''] ?? ucfirst($e['category'] ?? ''))
        ), $topEvents, array_keys($topEvents)));

        // Kategori dağılımı (bar chart - CSS)
        $catBarsHtml = implode('', array_map(fn($c) => sprintf(
            '<div class="rpt-bar-row">'
          . '<span class="rpt-bar-label">%s</span>'
          . '<div class="rpt-bar-outer"><div class="rpt-bar-fill" style="width:%d%%"></div></div>'
          . '<span class="rpt-bar-val">%d haber <span style="color:var(--color-text-3)">(%d%%)</span></span>'
          . '</div>',
            htmlspecialchars($c['label']), min($c['pct'], 100), $c['count'], $c['pct']
        ), $catDist));

        // Ülke kapsamı
        $maxCountry    = max(array_column($countryList, 'count') ?: [1]);
        $countryHtml   = implode('', array_map(fn($c) => sprintf(
            '<div class="rpt-country-row">'
          . '<span class="rpt-country-name">%s</span>'
          . '<div class="rpt-bar-outer"><div class="rpt-bar-fill rpt-bar-country" style="width:%d%%"></div></div>'
          . '<span class="rpt-bar-val">%d haber</span>'
          . '</div>',
            htmlspecialchars($c['name']),
            $maxCountry > 0 ? round($c['count'] / $maxCountry * 100) : 0,
            $c['count']
        ), array_slice($countryList, 0, 10)));

        // TR Medya Kutuplaşması
        $biasHtml = '';
        if (!empty($biasComp['pro_gov']) || !empty($biasComp['opposition'])) {
            $proList  = implode(', ', $biasComp['pro_gov'] ?? []);
            $oppList  = implode(', ', $biasComp['opposition'] ?? []);
            $biasHtml = <<<HTML
<div class="rpt-section">
<h2 class="rpt-section-title">⚖️ TR Medya Kutuplaşması</h2>
<div class="rpt-bias-grid">
  <div class="rpt-bias-card rpt-bias-pro">
    <div class="rpt-bias-label">Hükümete Yakın Medya</div>
    <div class="rpt-bias-cats">{$proList}</div>
  </div>
  <div class="rpt-bias-card rpt-bias-opp">
    <div class="rpt-bias-label">Muhalif Medya</div>
    <div class="rpt-bias-cats">{$oppList}</div>
  </div>
</div>
</div>
HTML;
        }

        // Suskunluk notu
        $silenceHtml = '';
        if ($silence > 0) {
            $silenceHtml = <<<HTML
<div class="rpt-silence">
  <span class="rpt-silence-icon">🔇</span>
  <div>
    <strong>Medya Suskunluğu:</strong> Bu dönemde uluslararası medyanın işlediği
    <strong>{$silence} haber</strong> Türk medyasında yer bulmadı.
  </div>
</div>
HTML;
        }

        // Trend notu
        $trendHtml = $trendNote ? <<<HTML
<div class="rpt-trend">
  <span class="rpt-trend-icon">📈</span>
  <div>{$trendNote}</div>
</div>
HTML : '';

        // Focus meta badge
        $metaHtml = '';
        if ($focus !== 'all') {
            $fl = $focus === 'kutuplasmalar' ? '🇹🇷 Kutuplaşmalar Odaklı' : '🌍 Uluslararası Odaklı';
            $metaHtml .= '<span class="rpt-focus-badge">' . $fl . '</span>';
        }
        $metaSection = $metaHtml ? "<div class=\"rpt-meta\">{$metaHtml}</div>" : '';

        $css = <<<CSS
<style>
.rpt-wrap{font-family:inherit;line-height:1.7;color:var(--color-text,#111)}
.rpt-meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:24px;padding:12px 16px;background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.15);border-radius:10px}
.rpt-focus-badge{font-size:12px;font-weight:700;padding:4px 12px;background:var(--color-accent,#2563eb);color:#fff;border-radius:99px}
.rpt-section{margin-bottom:28px}
.rpt-section-title{font-size:16px;font-weight:700;color:var(--color-text,#111);margin:0 0 14px;padding-bottom:8px;border-bottom:2px solid var(--color-border,#eee)}
.rpt-summary-text{font-size:15px;line-height:1.85;color:var(--color-text-2,#444);margin:0}
.rpt-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.rpt-stat{text-align:center;padding:18px 12px;background:var(--color-surface-2,#f8f8f8);border-radius:12px;border:1px solid var(--color-border,#eee)}
.rpt-stat-icon{font-size:22px;margin-bottom:6px}
.rpt-stat-val{font-size:24px;font-weight:800;color:var(--color-accent,#2563eb);margin-bottom:3px}
.rpt-stat-lbl{font-size:11px;color:var(--color-text-3,#888);font-weight:500}
.rpt-highlight{display:flex;gap:10px;align-items:flex-start;padding:11px 14px;background:var(--color-surface-2,#f8f8f8);border-radius:8px;border-left:3px solid var(--color-accent,#2563eb);margin-bottom:8px;font-size:14px;color:var(--color-text-2,#444);line-height:1.65}
.rpt-hl-num{font-size:13px;font-weight:700;color:var(--color-accent,#2563eb);flex-shrink:0;min-width:18px}
.rpt-event-row{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--color-border,#eee)}
.rpt-event-row:last-child{border-bottom:none}
.rpt-event-num{font-size:13px;font-weight:700;color:var(--color-text-3,#888);min-width:22px;padding-top:2px}
.rpt-event-body{display:flex;flex-direction:column;gap:3px}
.rpt-event-title{font-size:14px;font-weight:600;color:var(--color-text,#111);text-decoration:none;line-height:1.45}
.rpt-event-title:hover{color:var(--color-accent,#2563eb)}
.rpt-event-cat{font-size:11px;font-weight:600;color:var(--color-accent,#2563eb);background:rgba(37,99,235,0.08);padding:2px 8px;border-radius:6px;width:fit-content}
.rpt-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.rpt-bar-label{font-size:13px;font-weight:600;color:var(--color-text-2,#444);min-width:110px}
.rpt-country-name{font-size:13px;font-weight:600;color:var(--color-text-2,#444);min-width:130px}
.rpt-bar-outer{flex:1;background:var(--color-border,#eee);border-radius:4px;height:10px;overflow:hidden}
.rpt-bar-fill{height:100%;background:var(--color-accent,#2563eb);border-radius:4px;transition:width .3s}
.rpt-bar-country{background:#7c3aed}
.rpt-bar-val{font-size:12px;color:var(--color-text-3,#888);white-space:nowrap;min-width:90px;text-align:right}
.rpt-country-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.rpt-bias-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.rpt-bias-card{padding:16px;border-radius:10px;border:1px solid}
.rpt-bias-pro{background:rgba(220,38,38,0.05);border-color:rgba(220,38,38,0.2)}
.rpt-bias-opp{background:rgba(22,163,74,0.05);border-color:rgba(22,163,74,0.2)}
.rpt-bias-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-3,#888);margin-bottom:6px}
.rpt-bias-cats{font-size:14px;font-weight:600;color:var(--color-text,#111)}
.rpt-silence{display:flex;gap:12px;align-items:center;padding:14px 18px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:10px;font-size:14px;color:var(--color-text-2,#444);margin-bottom:20px}
.rpt-silence-icon{font-size:22px}
.rpt-trend{display:flex;gap:12px;align-items:center;padding:14px 18px;background:rgba(37,99,235,0.05);border:1px solid rgba(37,99,235,0.15);border-radius:10px;font-size:14px;color:var(--color-text-2,#444);margin-top:16px}
.rpt-trend-icon{font-size:22px}
@media(max-width:600px){.rpt-stats-grid{grid-template-columns:1fr 1fr}.rpt-bias-grid{grid-template-columns:1fr}}
</style>
CSS;

        return $css . <<<HTML
<div class="rpt-wrap">
{$metaSection}
<div class="rpt-section">
<h2 class="rpt-section-title">📊 Dönem İstatistikleri</h2>
<div class="rpt-stats-grid">{$statsHtml}</div>
</div>
<div class="rpt-section">
<h2 class="rpt-section-title">📝 Dönem Özeti</h2>
<p class="rpt-summary-text">{$summary}</p>
{$trendHtml}
</div>
{$silenceHtml}
<div class="rpt-section">
<h2 class="rpt-section-title">🔍 Öne Çıkan Bulgular</h2>
{$highlightsHtml}
</div>
<div class="rpt-section">
<h2 class="rpt-section-title">🗞 Dönemin En Önemli Haberleri</h2>
{$topEventsHtml}
</div>
<div class="rpt-section">
<h2 class="rpt-section-title">📂 Kategori Dağılımı</h2>
{$catBarsHtml}
</div>
<div class="rpt-section">
<h2 class="rpt-section-title">🌍 Ülke Kapsamı</h2>
{$countryHtml}
</div>
{$biasHtml}
</div>
HTML;
    }

    private function getPeriod(string $type, bool $current = false): array
    {
        if ($type === 'weekly') {
            $monday = $current ? now()->startOfWeek() : now()->startOfWeek()->subWeek();
            $sunday = $monday->copy()->endOfWeek();
            return [$monday->toDateString(), $sunday->toDateString()];
        }
        $start = $current ? now()->startOfMonth()  : now()->subMonth()->startOfMonth();
        $end   = $current ? now()->endOfMonth()    : now()->subMonth()->endOfMonth();
        return [$start->toDateString(), $end->toDateString()];
    }
}
