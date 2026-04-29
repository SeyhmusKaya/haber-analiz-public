<?php
namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Source;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FetchHistory extends Command
{
    protected $signature = 'haber:fetch-history {--days=30 : Kaç gün geriye gidilecek}';
    protected $description = 'Google News RSS üzerinden geçmiş haberleri çeker (tek seferlik)';

    public function handle(): void
    {
        $days   = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $this->info("Son {$days} günün haberleri çekiliyor (cutoff: {$cutoff->toDateString()})...");

        $sources = Source::where('is_active', true)->get();
        $this->info("{$sources->count()} aktif kaynak bulundu.");

        $totalInserted = 0;
        $bar = $this->output->createProgressBar($sources->count());
        $bar->start();

        foreach ($sources as $source) {
            try {
                $inserted = $this->fetchGoogleNews($source, $cutoff);
                $totalInserted += $inserted;
            } catch (\Exception $e) {
                Log::warning("FetchHistory error for {$source->name}: " . $e->getMessage());
            }
            $bar->advance();
            // Google'ı throttle etmemek için kısa bekleme
            usleep(300000); // 300ms
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Tamamlandı. Toplam {$totalInserted} yeni makale eklendi.");
        $this->info("Şimdi şu komutları çalıştırın:");
        $this->line("  php artisan haber:embed");
        $this->line("  php artisan haber:cluster");
        $this->line("  php artisan haber:analyze");
    }

    private function fetchGoogleNews(Source $source, \Carbon\Carbon $cutoff): int
    {
        // Kaynak URL'sinden ana domain çıkar (url yoksa rss_url'den dene)
        $domain = $this->extractDomain($source->url ?? $source->rss_url ?? '');
        if (!$domain) return 0;

        // Dil/ülke mapping
        $langMap = [
            'tr' => ['hl' => 'tr', 'gl' => 'TR', 'ceid' => 'TR:tr'],
            'en' => ['hl' => 'en-US', 'gl' => 'US', 'ceid' => 'US:en'],
            'de' => ['hl' => 'de', 'gl' => 'DE', 'ceid' => 'DE:de'],
            'ru' => ['hl' => 'ru', 'gl' => 'RU', 'ceid' => 'RU:ru'],
            'zh' => ['hl' => 'zh-CN', 'gl' => 'CN', 'ceid' => 'CN:zh-Hans'],
            'ar' => ['hl' => 'ar', 'gl' => 'SA', 'ceid' => 'SA:ar'],
            'fa' => ['hl' => 'fa', 'gl' => 'IR', 'ceid' => 'IR:fa'],
            'he' => ['hl' => 'iw', 'gl' => 'IL', 'ceid' => 'IL:iw'],
        ];
        $lang = $langMap[$source->language] ?? $langMap['en'];

        $url = 'https://news.google.com/rss/search?' . http_build_query([
            'q'    => "site:{$domain}",
            'hl'   => $lang['hl'],
            'gl'   => $lang['gl'],
            'ceid' => $lang['ceid'],
        ]);

        $response = Http::timeout(20)
            ->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; NewsBot/1.0)'])
            ->get($url);

        if (!$response->successful()) return 0;

        $xml = @simplexml_load_string($response->body());
        if (!$xml) return 0;

        $items    = $xml->channel->item ?? [];
        $articles = [];
        $now      = now()->format('Y-m-d H:i:s');

        foreach ($items as $item) {
            // Google News başlık formatı: "Haber başlığı - Kaynak Adı"
            $title = (string)($item->title ?? '');
            $title = preg_replace('/\s+-\s+[^-]+$/', '', $title); // " - Kaynak" kısmını sil
            if (empty($title)) continue;

            // Google News link'i asıl URL'ye yönlendir — direkt linkli değil
            // guid içinde gerçek URL olabilir
            $rawLink = (string)($item->link ?? '');
            $guid    = (string)($item->guid ?? '');

            // Google News URL'si decode edilip asıl URL çıkarılabilir
            $url = $this->extractRealUrl($rawLink) ?? $this->extractRealUrl($guid) ?? $rawLink;
            if (empty($url) || !str_starts_with($url, 'http')) continue;

            $pubDate     = (string)($item->pubDate ?? '');
            $publishedAt = null;
            try {
                $publishedAt = $pubDate ? new \DateTime($pubDate) : new \DateTime();
            } catch (\Exception) {
                $publishedAt = new \DateTime();
            }

            if ($publishedAt < $cutoff) continue;

            $summary = strip_tags((string)($item->description ?? ''));

            $articles[] = [
                'source_id'    => $source->id,
                'title'        => mb_substr($title, 0, 1000),
                'summary'      => mb_substr($summary, 0, 2000),
                'url'          => $url,
                'url_hash'     => md5($url),
                'image_url'    => null,
                'published_at' => $publishedAt->format('Y-m-d H:i:s'),
                'created_at'   => $now,
                'updated_at'   => $now,
            ];
        }

        if (empty($articles)) return 0;

        // Deduplikasyon
        $hashes   = array_column($articles, 'url_hash');
        $existing = Article::whereIn('url_hash', $hashes)->pluck('url_hash')->flip()->toArray();
        $newOnes  = array_values(array_filter($articles, fn($a) => !isset($existing[$a['url_hash']])));

        if (empty($newOnes)) return 0;

        Article::insert($newOnes);
        return count($newOnes);
    }

    private function extractDomain(string $url): ?string
    {
        $host = parse_url($url, PHP_URL_HOST);
        if (!$host) return null;
        // www. prefix'ini kaldır
        return preg_replace('/^www\./', '', $host);
    }

    private function extractRealUrl(string $googleUrl): ?string
    {
        // Google News URL formatı: https://news.google.com/rss/articles/...?url=REAL_URL
        if (preg_match('/[?&]url=([^&]+)/', $googleUrl, $m)) {
            return urldecode($m[1]);
        }
        // Doğrudan URL ise olduğu gibi döndür
        if (str_starts_with($googleUrl, 'http') && !str_contains($googleUrl, 'news.google.com')) {
            return $googleUrl;
        }
        return null;
    }
}
