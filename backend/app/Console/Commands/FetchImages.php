<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FetchImages extends Command
{
    protected $signature = 'haber:images {--limit=200 : Max articles to process per phase}';
    protected $description = 'Phase 1: detect og:image/og:video/YouTube from HTML. Phase 2: download external images to local storage (WebP).';

    private string $storageDir;
    private string $storageUrl = '/storage/article-images/';

    public function handle(): void
    {
        $this->storageDir = storage_path('app/public/article-images');
        if (!is_dir($this->storageDir)) {
            mkdir($this->storageDir, 0755, true);
        }

        $limit = (int) $this->option('limit');

        $this->info('Phase 1: HTML media detection...');
        $detected = $this->detectMediaFromHtml($limit);
        $this->info("Phase 1 done: {$detected} articles updated.");

        $this->info('Phase 2: Downloading external images locally...');
        $downloaded = $this->downloadImagesToLocal($limit);
        $this->info("Phase 2 done: {$downloaded} images downloaded.");
    }

    // ─── Phase 1: HTML'den og:image / og:video / YouTube tespiti ────────────

    private function detectMediaFromHtml(int $limit): int
    {
        // video_url IS NULL = henüz taranmamış (image_url koşulu kaldırıldı;
        // RSS'ten resmi gelen makaleler de video açısından taranmalı)
        // news.google.com URL'leri atlanıyor: JS redirect kullandığı için
        // gerçek makale sayfasına erişilemiyor, sadece 300px Google thumbnail döner.
        $articles = DB::table('articles')
            ->whereNull('video_url')
            ->where('published_at', '>=', now()->subDays(7))
            ->where('url', 'NOT LIKE', '%news.google.com%')
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get(['id', 'url', 'image_url']);

        if ($articles->isEmpty()) return 0;

        $processedIds = $articles->pluck('id')->all();
        $articleMap   = $articles->keyBy('id');
        $found        = 0;

        foreach ($articles->chunk(30) as $chunk) {
            $updates = $this->fetchHtmlBatch($chunk);
            foreach ($updates as $id => $data) {
                $existing = $articleMap[$id];
                $set = [];
                // Mevcut resim yoksa HTML'den bulunanı yaz
                if (empty($existing->image_url) && !empty($data['image'])) {
                    $set['image_url'] = $data['image'];
                }
                if (!empty($data['video'])) {
                    $set['video_url'] = $data['video'];
                }
                if (!empty($set)) {
                    DB::table('articles')->where('id', $id)->update($set);
                    $found++;
                }
            }
        }

        // Video bulunamayan taranmış makaleleri '' ile işaretle → bir daha taranmasın
        DB::table('articles')
            ->whereIn('id', $processedIds)
            ->whereNull('video_url')
            ->update(['video_url' => '']);

        return $found;
    }

    private function fetchHtmlBatch($chunk): array
    {
        $responses = Http::pool(function (Pool $pool) use ($chunk) {
            foreach ($chunk as $article) {
                $pool->as((string)$article->id)
                    ->timeout(6)
                    ->withHeaders([
                        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                        'Accept'     => 'text/html,application/xhtml+xml',
                    ])
                    ->get($article->url);
            }
        });

        $updates = [];
        foreach ($chunk as $article) {
            try {
                $response = $responses[(string)$article->id];
                if ($response instanceof \Exception || !$response->successful()) continue;
                $updates[$article->id] = $this->parseHtmlMedia($response->body(), $article->url);
            } catch (\Exception) {
                // sessizce atla
            }
        }
        return $updates;
    }

    /** @return array{image: ?string, video: ?string} */
    private function parseHtmlMedia(string $html, string $pageUrl): array
    {
        $image = null;
        $video = null;

        // ── og:video tespiti ───────────────────────────────────────────────
        foreach (['og:video:secure_url', 'og:video:url', 'og:video'] as $prop) {
            if (preg_match('/<meta[^>]+property=["\']' . preg_quote($prop, '/') . '["\'][^>]+content=["\']([^"\']+)["\']/', $html, $m)
             || preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']' . preg_quote($prop, '/') . '["\']/', $html, $m)) {
                $v = $this->validUrl(trim($m[1]));
                if ($v) { $video = $v; break; }
            }
        }

        // ── YouTube tespiti (embed, watch?v=, youtu.be, nocookie) ─────────────
        if (!$video) {
            if (preg_match(
                '#(?:youtube(?:-nocookie)?\.com/(?:embed/|watch\?(?:[^"\']*&)?v=)|youtu\.be/)([A-Za-z0-9_-]{11})#',
                $html, $m
            )) {
                $videoId = $m[1];
                $video   = "https://www.youtube.com/watch?v={$videoId}";
                // YouTube thumbnail'ını image olarak kullan
                $thumb = "https://img.youtube.com/vi/{$videoId}/maxresdefault.jpg";
                $image = $thumb;
            }
        }

        // ── Rutube tespiti (RT ve Rus kaynaklar) ──────────────────────────
        if (!$video) {
            if (preg_match('#rutube\.ru/(?:video|play/embed)/([a-f0-9]{32})#', $html, $m)) {
                $video = "https://rutube.ru/video/{$m[1]}/";
            }
        }

        // ── Yerel video dosyası tespiti (mp4/m3u8/webm) ───────────────────
        // <video src="...">, <source src="...">
        if (!$video) {
            if (preg_match('/<(?:video|source)[^>]+src=["\']((https?:\/\/[^"\']+\.(?:mp4|m3u8|webm))(?:\?[^"\']*)?)["\']/', $html, $m)) {
                $v = $this->validUrl($m[1]);
                if ($v) $video = $v;
            }
        }

        // JW Player / video.js config: "file":"https://...mp4"
        if (!$video) {
            if (preg_match('/"file"\s*:\s*"(https?:\/\/[^"]+\.(?:mp4|m3u8|webm)(?:\?[^"]*)?)"/', $html, $m)) {
                $v = $this->validUrl($m[1]);
                if ($v) $video = $v;
            }
        }

        // Herhangi bir http(s) URL içindeki .mp4/.m3u8 (CDN linkleri, RT gibi)
        if (!$video) {
            if (preg_match('#(https?://[^\s"\'<>]+\.(?:mp4|m3u8)(?:\?[^\s"\'<>]*)?)#', $html, $m)) {
                $v = $this->validUrl($m[1]);
                if ($v) $video = $v;
            }
        }

        // ── og:image tespiti ──────────────────────────────────────────────
        if (!$image) {
            foreach (['og:image', 'twitter:image'] as $prop) {
                $attr = str_starts_with($prop, 'og:') ? 'property' : 'name';
                if (preg_match('/<meta[^>]+' . $attr . '=["\']' . preg_quote($prop, '/') . '["\'][^>]+content=["\']([^"\']+)["\']/', $html, $m)
                 || preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+' . $attr . '=["\']' . preg_quote($prop, '/') . '["\']/', $html, $m)) {
                    $u = $this->validUrl(trim(html_entity_decode($m[1])));
                    if ($u && $this->isAcceptableImageUrl($u, $html)) {
                        $image = $u;
                        break;
                    }
                }
            }
        }

        return ['image' => $image, 'video' => $video];
    }

    // ─── Phase 2: Harici resimleri lokal storage'a indir ────────────────────

    private function downloadImagesToLocal(int $limit): int
    {
        $articles = DB::table('articles')
            ->where('image_url', 'LIKE', 'http%')
            ->where('published_at', '>=', now()->subDays(7))
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get(['id', 'image_url']);

        if ($articles->isEmpty()) return 0;

        $downloaded = 0;
        foreach ($articles->chunk(20) as $chunk) {
            foreach ($chunk as $article) {
                $localUrl = $this->downloadImage($article->image_url);
                if ($localUrl) {
                    DB::table('articles')->where('id', $article->id)->update(['image_url' => $localUrl]);
                    $downloaded++;
                }
                usleep(100_000); // 100ms bekleme (rate limiting)
            }
        }
        return $downloaded;
    }

    private function downloadImage(string $url): ?string
    {
        // Aynı resim daha önce indirilmişse tekrar indirme
        $filename = md5($url) . '.webp';
        $localPath = $this->storageDir . '/' . $filename;
        if (file_exists($localPath)) {
            return $this->storageUrl . $filename;
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders(['User-Agent' => 'Mozilla/5.0 Chrome/120.0.0.0'])
                ->get($url);

            if (!$response->successful()) return null;

            $contentType = $response->header('Content-Type', '');
            if (!str_starts_with($contentType, 'image/')) return null;

            $body = $response->body();
            if (strlen($body) < 2000) return null; // çok küçük, muhtemelen placeholder

            return $this->saveAsWebp($body, $filename);
        } catch (\Exception $e) {
            Log::debug("Image download failed [{$url}]: " . $e->getMessage());
            return null;
        }
    }

    private function saveAsWebp(string $imageData, string $filename): ?string
    {
        $image = @imagecreatefromstring($imageData);
        if (!$image) return null;

        $w = imagesx($image);
        $h = imagesy($image);

        // 300px altı resimleri reddet
        if ($w < 300 || $h < 300) {
            imagedestroy($image);
            return null;
        }

        // Maksimum 1200px genişliğe küçült
        if ($w > 1200) {
            $newH = (int)round($h * 1200 / $w);
            $resized = imagecreatetruecolor(1200, $newH);
            // Şeffaflık koruması (PNG için)
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $image, 0, 0, 0, 0, 1200, $newH, $w, $h);
            imagedestroy($image);
            $image = $resized;
        }

        $localPath = $this->storageDir . '/' . $filename;
        $ok = imagewebp($image, $localPath, 85);
        imagedestroy($image);

        if (!$ok || !file_exists($localPath)) return null;

        return $this->storageUrl . $filename;
    }

    // ─── Yardımcı metodlar ───────────────────────────────────────────────────

    private function validUrl(string $url): ?string
    {
        if (!filter_var($url, FILTER_VALIDATE_URL) || !str_starts_with($url, 'http')) return null;
        if (str_contains($url, '/0x0/') || preg_match('#/0/0\.\w+$#i', $url)) return null;
        return $url;
    }

    private function isAcceptableImageUrl(string $url, string $html): bool
    {
        $path  = strtolower(parse_url($url, PHP_URL_PATH) ?? '');
        $query = parse_url($url, PHP_URL_QUERY) ?? '';

        if (str_contains($path, '/thumbnail')) return false;
        if (preg_match('/(?:^|&)width=(\d+)/i', $query, $m) && (int)$m[1] <= 300) return false;
        if (preg_match('/logo/', basename($path))) return false;

        // og:image:width < 300 ise reddet
        if (preg_match('/<meta[^>]+property=["\']og:image:width["\'][^>]+content=["\'](\d+)["\']/', $html, $wm)
         || preg_match('/<meta[^>]+content=["\'](\d+)["\'][^>]+property=["\']og:image:width["\']/', $html, $wm)) {
            if ((int)$wm[1] <= 300) return false;
        }

        return true;
    }
}
