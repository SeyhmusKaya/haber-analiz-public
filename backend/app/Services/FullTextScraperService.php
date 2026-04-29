<?php

namespace App\Services;

use App\Models\Article;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FullTextScraperService
{
    private GeminiService $gemini;
    private int $maxRetries = 3;
    private int $delayBetweenRequests = 500; // ms - respectful scraping

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    public function scrapeNewArticles(int $limit = 100): array
    {
        $articles = Article::where('scrape_status', 'pending')
            ->whereNotNull('url')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        $stats = ['total' => $articles->count(), 'success' => 0, 'failed' => 0, 'translated' => 0];

        foreach ($articles as $article) {
            try {
                $fullText = $this->fetchFullText($article->url);

                if ($fullText && strlen($fullText) > 100) {
                    $lang = $this->detectLanguage($fullText);
                    $translatedText = null;

                    if ($lang !== 'tr') {
                        $translatedText = $this->translateToTurkish($fullText, $lang);
                        if ($translatedText) $stats['translated']++;
                    }

                    $article->update([
                        'full_text' => mb_substr($fullText, 0, 10000),
                        'full_text_tr' => $translatedText ? mb_substr($translatedText, 0, 10000) : null,
                        'language_detected' => $lang,
                        'scrape_status' => 'success',
                    ]);
                    $stats['success']++;
                } else {
                    $article->update(['scrape_status' => 'failed']);
                    $stats['failed']++;
                }
            } catch (\Exception $e) {
                Log::warning("FullText scrape failed for article {$article->id}: " . $e->getMessage());
                $article->update(['scrape_status' => 'failed']);
                $stats['failed']++;
            }

            usleep($this->delayBetweenRequests * 1000);
        }

        Log::info("FullText scraping complete", $stats);
        return $stats;
    }

    private function fetchFullText(string $url): ?string
    {
        for ($attempt = 0; $attempt < $this->maxRetries; $attempt++) {
            try {
                $response = Http::timeout(15)
                    ->withHeaders([
                        'User-Agent' => 'Mozilla/5.0 (compatible; Medya İzle/1.0; +https://medyaizle.com)',
                        'Accept' => 'text/html',
                    ])
                    ->get($url);

                if (!$response->successful()) {
                    if ($response->status() === 429) {
                        sleep(5);
                        continue;
                    }
                    return null;
                }

                return $this->extractText($response->body());
            } catch (\Exception $e) {
                if ($attempt < $this->maxRetries - 1) {
                    sleep(2);
                    continue;
                }
                throw $e;
            }
        }
        return null;
    }

    private function extractText(string $html): ?string
    {
        // Remove scripts, styles, nav, header, footer
        $html = preg_replace('/<script[^>]*>.*?<\/script>/si', '', $html);
        $html = preg_replace('/<style[^>]*>.*?<\/style>/si', '', $html);
        $html = preg_replace('/<nav[^>]*>.*?<\/nav>/si', '', $html);
        $html = preg_replace('/<header[^>]*>.*?<\/header>/si', '', $html);
        $html = preg_replace('/<footer[^>]*>.*?<\/footer>/si', '', $html);
        $html = preg_replace('/<aside[^>]*>.*?<\/aside>/si', '', $html);

        // Try to find article content by common selectors
        $patterns = [
            '/<article[^>]*>(.*?)<\/article>/si',
            '/<div[^>]*class="[^"]*article[^"]*"[^>]*>(.*?)<\/div>/si',
            '/<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/si',
            '/<div[^>]*class="[^"]*post[^"]*"[^>]*>(.*?)<\/div>/si',
        ];

        $text = '';
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $html, $m)) {
                $text = $m[1];
                break;
            }
        }

        // Fallback: get all paragraph text
        if (empty($text)) {
            preg_match_all('/<p[^>]*>(.*?)<\/p>/si', $html, $matches);
            $text = implode("\n", $matches[1] ?? []);
        }

        // Strip remaining HTML tags
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);

        return strlen($text) > 50 ? $text : null;
    }

    private function detectLanguage(string $text): string
    {
        $sample = mb_substr($text, 0, 200);

        // Simple heuristic based on character patterns
        $turkishChars = preg_match_all('/[çğıöşüÇĞİÖŞÜ]/u', $sample);
        if ($turkishChars > 3) return 'tr';

        $arabicChars = preg_match_all('/[\x{0600}-\x{06FF}]/u', $sample);
        if ($arabicChars > 10) return 'ar';

        $russianChars = preg_match_all('/[\x{0400}-\x{04FF}]/u', $sample);
        if ($russianChars > 10) return 'ru';

        $chineseChars = preg_match_all('/[\x{4E00}-\x{9FFF}]/u', $sample);
        if ($chineseChars > 5) return 'zh';

        $germanChars = preg_match_all('/[äöüßÄÖÜ]/u', $sample);
        if ($germanChars > 2) return 'de';

        $hebrewChars = preg_match_all('/[\x{0590}-\x{05FF}]/u', $sample);
        if ($hebrewChars > 10) return 'he';

        $persianChars = preg_match_all('/[\x{0600}-\x{06FF}\x{FB50}-\x{FDFF}]/u', $sample);
        if ($persianChars > 10) return 'fa';

        return 'en';
    }

    private function translateToTurkish(string $text, string $fromLang): ?string
    {
        $langNames = [
            'en' => 'İngilizce', 'de' => 'Almanca', 'ru' => 'Rusça',
            'ar' => 'Arapça', 'zh' => 'Çince', 'fa' => 'Farsça',
            'he' => 'İbranice', 'fr' => 'Fransızca',
        ];

        $langName = $langNames[$fromLang] ?? 'yabancı dil';
        $truncated = mb_substr($text, 0, 3000);

        $prompt = "Aşağıdaki {$langName} metni Türkçe'ye çevir. Sadece çeviriyi yaz, başka hiçbir şey ekleme.\n\nMetin:\n{$truncated}";

        return $this->gemini->generate($prompt, 4096);
    }
}
