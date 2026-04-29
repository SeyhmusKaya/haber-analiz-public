<?php
namespace App\Services;

use App\Models\Article;
use App\Models\Source;
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ScraperService
{
    public function fetchAll(): int
    {
        // importance_score = 0 olan kaynaklar hiç çekilmez
        $sources = Source::where('is_active', true)
            ->where('importance_score', '>', 0)
            ->orderByDesc('importance_score')
            ->get();
        $allArticles = [];
        $sourceUpdates = []; // ETag/Last-Modified güncellemeleri

        foreach ($sources->chunk(50) as $chunk) {
            $sourceMap = $chunk->keyBy('id');

            try {
                $responses = Http::pool(function (Pool $pool) use ($chunk) {
                    foreach ($chunk as $source) {
                        $headers = array_filter([
                            'If-None-Match'     => $source->last_etag,
                            'If-Modified-Since' => $source->last_modified_http,
                        ]);
                        $pool->as((string)$source->id)
                            ->timeout(15)
                            ->withHeaders($headers)
                            ->get($source->rss_url);
                    }
                });

                foreach ($sourceMap as $id => $source) {
                    try {
                        $response = $responses[(string)$id];
                        if ($response instanceof \Exception) {
                            Log::warning("Scraper fetch error for {$source->name}: " . $response->getMessage());
                            continue;
                        }

                        // 304 Not Modified — içerik değişmedi, parse etme
                        if ($response->status() === 304) {
                            continue;
                        }

                        if ($response->successful()) {
                            // ETag ve Last-Modified kaydet (conditional GET için)
                            $sourceUpdates[$id] = array_filter([
                                'last_etag'         => $response->header('ETag') ?: null,
                                'last_modified_http' => $response->header('Last-Modified') ?: null,
                                'last_fetched_at'   => now(),
                            ]);

                            // Zaman penceresini daralt: son fetch'ten bu yana olanlar
                            $cutoff = $source->last_fetched_at
                                ? $source->last_fetched_at
                                : now()->subHours(3);

                            $parsed = $this->parseRss($source, $response->body(), $cutoff);
                            $allArticles = array_merge($allArticles, $parsed);
                        }
                    } catch (\Exception $e) {
                        Log::warning("Scraper parse error for {$source->name}: " . $e->getMessage());
                    }
                }
            } catch (\Exception $e) {
                Log::warning("Scraper pool error: " . $e->getMessage());
            }
        }

        // ETag/Last-Modified bilgilerini batch güncelle
        foreach (array_chunk($sourceUpdates, 50, true) as $batch) {
            foreach ($batch as $sourceId => $updates) {
                Source::where('id', $sourceId)->update($updates);
            }
        }

        if (empty($allArticles)) {
            Log::info("Scraper: no new articles found");
            return 0;
        }

        // In-memory deduplikasyon
        $seen = [];
        $allArticles = array_values(array_filter($allArticles, function ($a) use (&$seen) {
            if (isset($seen[$a['url_hash']])) return false;
            $seen[$a['url_hash']] = true;
            return true;
        }));

        // DB deduplikasyon
        $allHashes = array_column($allArticles, 'url_hash');
        $existingHashes = Article::whereIn('url_hash', $allHashes)
            ->pluck('url_hash')->flip()->toArray();

        $newArticles = array_values(array_filter(
            $allArticles,
            fn($a) => !isset($existingHashes[$a['url_hash']])
        ));

        if (empty($newArticles)) {
            Log::info("Scraper: 0 new articles (all duplicates)");
            return 0;
        }

        foreach (array_chunk($newArticles, 500) as $insertChunk) {
            Article::insert($insertChunk);
        }

        $count = count($newArticles);
        Log::info("Scraper: inserted {$count} new articles from {$sources->count()} sources");
        return $count;
    }

    private function parseRss(Source $source, string $body, \DateTimeInterface $cutoff): array
    {
        $xml = @simplexml_load_string($body);
        if (!$xml) return [];

        $items = $xml->channel->item ?? $xml->entry ?? [];
        $articles = [];
        $now = now()->format('Y-m-d H:i:s');

        foreach ($items as $item) {
            $url = (string)($item->link ?? $item->id ?? '');
            if (empty($url)) continue;
            $url = $this->decodeGoogleNewsUrl($url);

            // Google News URL çözümlenemedi — saklamayı atla
            if (str_contains($url, 'news.google.com')) continue;

            $title = (string)($item->title ?? '');
            if (empty($title)) continue;

            $summary    = strip_tags((string)($item->description ?? $item->summary ?? ''));
            $pubDate    = (string)($item->pubDate ?? $item->published ?? $item->updated ?? '');

            $publishedAt = null;
            try {
                $publishedAt = $pubDate ? new \DateTime($pubDate) : new \DateTime();
            } catch (\Exception) {
                $publishedAt = new \DateTime();
            }

            // Cutoff: sadece son fetch'ten bu yana olanlar (veya ilk çalışmada son 3 saat)
            if ($publishedAt < $cutoff) continue;

            $media = $this->extractMedia($item);
            $imageUrl = $media['image'];
            $videoUrl = $media['video'];

            if ($imageUrl && (!filter_var($imageUrl, FILTER_VALIDATE_URL) || !str_starts_with($imageUrl, 'http'))) {
                $imageUrl = null;
            }
            if ($videoUrl && (!filter_var($videoUrl, FILTER_VALIDATE_URL) || !str_starts_with($videoUrl, 'http'))) {
                $videoUrl = null;
            }

            $articles[] = [
                'source_id'    => $source->id,
                'title'        => mb_substr($title, 0, 1000),
                'summary'      => mb_substr($summary, 0, 2000),
                'url'          => $url,
                'url_hash'     => md5($url),
                'image_url'    => $imageUrl,
                'video_url'    => $videoUrl,
                'published_at' => $publishedAt->format('Y-m-d H:i:s'),
                'created_at'   => $now,
                'updated_at'   => $now,
            ];
        }

        return $articles;
    }

    private function decodeGoogleNewsUrl(string $url): string
    {
        if (!str_contains($url, 'news.google.com')) {
            return $url;
        }
        if (!preg_match('|/rss/articles/([^?]+)|', $url, $m)) {
            return $url;
        }
        $decoded = base64_decode(strtr($m[1], '-_', '+/'));
        if ($decoded && preg_match('/(https?:\/\/[^\x00-\x1f\x7f-\x9f\s]+)/', $decoded, $u)) {
            return rtrim($u[1], '.,;');
        }
        return $url;
    }

    /** @return array{image: ?string, video: ?string} */
    private function extractMedia(\SimpleXMLElement $item): array
    {
        $imageUrl = null;
        $videoUrl = null;

        // enclosure: image veya video türüne göre ayır
        if (isset($item->enclosure)) {
            $type = (string)($item->enclosure['type'] ?? '');
            $url  = (string)($item->enclosure['url'] ?? '');
            if ($url) {
                if (str_starts_with($type, 'video')) {
                    $videoUrl = $url;
                } elseif (str_starts_with($type, 'image') || empty($type)) {
                    $imageUrl = $url;
                }
            }
        }

        // media: namespace
        $namespaces = $item->getNamespaces(true);
        if (isset($namespaces['media'])) {
            $media = $item->children($namespaces['media']);
            if (isset($media->content)) {
                $attrs = $media->content->attributes();
                $type  = (string)($attrs['type'] ?? '');
                $url   = (string)($attrs['url'] ?? '');
                if ($url) {
                    if (str_contains($type, 'video')) {
                        $videoUrl = $videoUrl ?? $url;
                    } else {
                        // type boşsa veya image ise resim
                        $imageUrl = $imageUrl ?? $url;
                    }
                }
            }
            if (!$imageUrl && isset($media->thumbnail)) {
                $url = (string)($media->thumbnail->attributes()['url'] ?? '');
                if ($url) $imageUrl = $url;
            }
        }

        // description / content:encoded içinden YouTube tespiti
        if (!$videoUrl) {
            $rawContent = '';
            $namespaces2 = $item->getNamespaces(true);
            if (isset($namespaces2['content'])) {
                $content = $item->children($namespaces2['content']);
                $rawContent = (string)($content->encoded ?? '');
            }
            if (!$rawContent) {
                $rawContent = (string)($item->description ?? '');
            }
            if ($rawContent && preg_match(
                '#(?:youtube(?:-nocookie)?\.com/(?:embed/|live/|watch\?(?:[^"\'<]*&)?v=)|youtu\.be/)([A-Za-z0-9_-]{11})#',
                $rawContent, $m
            )) {
                $videoId  = $m[1];
                $videoUrl = "https://www.youtube.com/watch?v={$videoId}";
                // YouTube thumbnail'ı henüz image yoksa kullan
                if (!$imageUrl) {
                    $imageUrl = "https://img.youtube.com/vi/{$videoId}/maxresdefault.jpg";
                }
            }
        }

        // description içindeki <img> fallback
        if (!$imageUrl) {
            $rawDesc = (string)($item->description ?? '');
            if ($rawDesc && preg_match('/<img[^>]+src=["\']([^"\']+)["\']/', $rawDesc, $m)) {
                $imageUrl = $m[1];
            }
        }

        return ['image' => $imageUrl, 'video' => $videoUrl];
    }
}
