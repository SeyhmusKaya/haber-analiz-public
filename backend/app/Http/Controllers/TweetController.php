<?php
namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TweetController extends Controller
{
    private string $bearerToken;

    public function __construct()
    {
        $this->bearerToken = env('TWITTER_BEARER_TOKEN', '');
    }

    private array $nitterInstances = [
        'https://nitter.poast.org',
        'https://nitter.cz',
        'https://nitter.kavin.rocks',
        'https://nitter.net',
        'https://nitter.privacydev.net',
        'https://nitter.foss.wtf',
    ];

    public function search(Request $request): JsonResponse
    {
        $query = trim($request->get('q', ''));
        if (empty($query)) {
            return response()->json(['tweets' => []]);
        }

        // 4 saat cache — quota tasarrufu için
        $cacheKey = 'tweets_v2_' . md5($query);

        $tweets = Cache::remember($cacheKey, 14400, function () use ($query) {
            // 1. Gemini Google Search grounding
            $tweets = $this->fetchWithGemini($query);
            if (!empty($tweets)) return $tweets;

            // 2. Twitter guest token API
            $tweets = $this->fetchWithGuestToken($query);
            if (!empty($tweets)) return $tweets;

            // 3. Nitter fallback
            return $this->fetchFromNitter($query);
        });

        return response()->json(['tweets' => $tweets]);
    }

    // ── Yaklaşım 1: Gemini Google Search grounding ───────────────────────────

    private function fetchWithGemini(string $query): array
    {
        $apiKey = config('services.gemini.key');
        if (empty($apiKey)) return [];

        $prompt = "Search Twitter/X for up to 4 recent real tweets about: \"{$query}\"\n\nReturn ONLY a JSON array, no markdown, no code blocks. Each item: {\"u\":\"@handle\",\"n\":\"Display Name\",\"t\":\"tweet text\",\"l\":\"likes\",\"r\":\"retweets\",\"d\":\"time ago\"}\n\nReturn [] if nothing found.";

        $models = ['gemini-2.5-flash', 'gemini-3.1-flash-lite-preview', 'gemini-2.0-flash-lite'];

        foreach ($models as $model) {
            try {
                $response = Http::timeout(20)->post(
                    "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
                    [
                        'contents'          => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
                        'tools'             => [['google_search' => (object) []]],
                        'generationConfig'  => ['temperature' => 0.1, 'maxOutputTokens' => 3000],
                    ]
                );

                if ($response->status() === 429) {
                    Log::debug("Gemini {$model} rate limited for tweet search");
                    continue;
                }

                if (!$response->successful()) {
                    Log::debug("Gemini {$model} failed: " . $response->status());
                    continue;
                }

                // Birden fazla part olabilir, hepsini birleştir
                $parts = $response->json('candidates.0.content.parts') ?? [];
                $text = implode('', array_column($parts, 'text'));
                if (empty($text)) continue;

                $tweets = $this->parseGeminiResponse($text);
                if (!empty($tweets)) {
                    Log::info("Gemini tweet search success ({$model}): " . count($tweets) . " tweets");
                    return $tweets;
                }

            } catch (\Exception $e) {
                Log::debug("Gemini tweet search error ({$model}): " . $e->getMessage());
            }
        }

        return [];
    }

    private function parseGeminiResponse(string $text): array
    {
        // Markdown code block temizle
        $text = preg_replace('/```(?:json)?\s*/i', '', $text);
        $text = preg_replace('/```\s*$/', '', $text);
        $text = trim($text);

        // JSON array bul
        $start = strpos($text, '[');
        $end   = strrpos($text, ']');
        if ($start === false || $end === false || $end <= $start) return [];

        $json = substr($text, $start, $end - $start + 1);
        $data = json_decode($json, true);
        if (!is_array($data)) return [];

        $tweets = [];
        foreach ($data as $item) {
            if (!is_array($item)) continue;

            // Hem uzun alan adlarını hem kısa (u/n/t/l/r/d) destekle
            $content  = trim($item['t'] ?? $item['content'] ?? '');
            $username = trim($item['u'] ?? $item['username'] ?? '');
            if (empty($content) || empty($username)) continue;

            $content = preg_replace('/https?:\/\/t\.co\/\S+/', '', $content);
            $content = trim($content);

            $tweets[] = [
                'username'  => $username,
                'fullname'  => $item['n']  ?? $item['fullname'] ?? ltrim($username, '@'),
                'content'   => $content,
                'url'       => $item['url']  ?? '',
                'date'      => $item['d']    ?? $item['date']  ?? '',
                'replies'   => '0',
                'retweets'  => $item['r']    ?? $item['retweets'] ?? '0',
                'likes'     => $item['l']    ?? $item['likes']    ?? '0',
            ];

            if (count($tweets) >= 6) break;
        }

        return $tweets;
    }

    // ── Yaklaşım 2: Twitter guest token API ──────────────────────────────────

    private function fetchWithGuestToken(string $query): array
    {
        try {
            $guestToken = $this->getGuestToken();
            if (!$guestToken) return [];

            $response = Http::timeout(10)->withHeaders([
                'Authorization'   => 'Bearer ' . $this->bearerToken,
                'x-guest-token'   => $guestToken,
                'User-Agent'      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language' => 'en-US,en;q=0.9',
                'Referer'         => 'https://twitter.com/',
                'Origin'          => 'https://twitter.com',
            ])->get('https://api.twitter.com/1.1/search/tweets.json', [
                'q'           => $query,
                'tweet_mode'  => 'extended',
                'count'       => 10,
                'result_type' => 'recent',
            ]);

            if (!$response->successful()) return [];

            $tweets = $this->parseApiResponse($response->json());
            if (!empty($tweets)) {
                Log::info('Twitter API success: ' . count($tweets) . ' tweets');
            }
            return $tweets;

        } catch (\Exception $e) {
            Log::debug('Twitter guest token failed: ' . $e->getMessage());
            return [];
        }
    }

    private function getGuestToken(): ?string
    {
        try {
            $response = Http::timeout(8)->withHeaders([
                'Authorization' => 'Bearer ' . $this->bearerToken,
                'User-Agent'    => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ])->post('https://api.twitter.com/1.1/guest/activate.json');

            if (!$response->successful()) return null;
            return $response->json('guest_token');

        } catch (\Exception $e) {
            return null;
        }
    }

    private function parseApiResponse(array $data): array
    {
        $statuses = $data['statuses'] ?? [];
        $tweets = [];

        foreach ($statuses as $status) {
            $screenName = $status['user']['screen_name'] ?? '';
            $tweetId    = $status['id_str'] ?? '';
            if (empty($screenName) || empty($tweetId)) continue;

            $text = $status['retweeted_status']['full_text']
                ?? $status['full_text']
                ?? $status['text']
                ?? '';
            $text = trim(preg_replace('/https:\/\/t\.co\/\w+/', '', $text));
            if (empty($text)) continue;

            $tweets[] = [
                'username'  => '@' . $screenName,
                'fullname'  => $status['user']['name'] ?? $screenName,
                'content'   => $text,
                'url'       => "https://twitter.com/{$screenName}/status/{$tweetId}",
                'date'      => $this->formatDate($status['created_at'] ?? ''),
                'replies'   => (string) ($status['reply_count']    ?? 0),
                'retweets'  => (string) ($status['retweet_count']  ?? 0),
                'likes'     => (string) ($status['favorite_count'] ?? 0),
            ];

            if (count($tweets) >= 6) break;
        }

        return $tweets;
    }

    private function formatDate(string $twitterDate): string
    {
        if (empty($twitterDate)) return '';
        try {
            return \Carbon\Carbon::createFromFormat('D M d H:i:s O Y', $twitterDate)->diffForHumans();
        } catch (\Exception $e) {
            return '';
        }
    }

    // ── Yaklaşım 3: Nitter HTML scraping ─────────────────────────────────────

    private function fetchFromNitter(string $query): array
    {
        foreach ($this->nitterInstances as $instance) {
            try {
                $url = $instance . '/search?q=' . urlencode($query) . '&f=tweets';
                $response = Http::timeout(6)->withHeaders([
                    'User-Agent'      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept-Language' => 'en-US,en;q=0.9',
                ])->get($url);

                if (!$response->successful()) continue;

                $body = $response->body();
                if (empty($body) || strlen($body) < 500) continue;

                $tweets = $this->parseNitterHtml($body);
                if (!empty($tweets)) {
                    Log::info("Nitter success: {$instance}, " . count($tweets) . " tweets");
                    return $tweets;
                }
            } catch (\Exception $e) {
                Log::debug("Nitter {$instance} failed: " . $e->getMessage());
            }
        }

        return [];
    }

    private function parseNitterHtml(string $html): array
    {
        $tweets = [];

        $doc = new \DOMDocument();
        @$doc->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
        $xpath = new \DOMXPath($doc);

        $items = $xpath->query('//div[contains(@class,"timeline-item") and not(contains(@class,"show-more"))]');
        if (!$items) return [];

        foreach ($items as $item) {
            $usernameNode = $xpath->query('.//a[contains(@class,"username")]', $item)->item(0);
            $username     = $usernameNode ? trim($usernameNode->textContent) : '';

            $fullnameNode = $xpath->query('.//a[contains(@class,"fullname")]', $item)->item(0);
            $fullname     = $fullnameNode ? trim($fullnameNode->textContent) : '';

            $contentNode  = $xpath->query('.//div[contains(@class,"tweet-content")]', $item)->item(0);
            $content      = $contentNode ? trim($contentNode->textContent) : '';

            $dateLink     = $xpath->query('.//span[contains(@class,"tweet-date")]/a', $item)->item(0);
            $tweetPath    = $dateLink ? $dateLink->getAttribute('href') : '';
            $tweetDate    = $dateLink ? $dateLink->getAttribute('title') : '';

            $statCounts   = $xpath->query('.//span[contains(@class,"tweet-stat-count")]', $item);
            $replies      = $statCounts->length > 0 ? trim($statCounts->item(0)->textContent) : '0';
            $retweets     = $statCounts->length > 1 ? trim($statCounts->item(1)->textContent) : '0';
            $likes        = $statCounts->length > 2 ? trim($statCounts->item(2)->textContent) : '0';

            if (empty($content) || empty($username)) continue;

            $tweets[] = [
                'username'  => $username,
                'fullname'  => $fullname,
                'content'   => $content,
                'url'       => 'https://twitter.com' . $tweetPath,
                'date'      => $tweetDate,
                'replies'   => $replies ?: '0',
                'retweets'  => $retweets ?: '0',
                'likes'     => $likes ?: '0',
            ];

            if (count($tweets) >= 6) break;
        }

        return $tweets;
    }
}
