<?php
namespace App\Console\Commands;

use App\Services\LibreTranslateService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FetchFullText extends Command
{
    protected $signature   = 'haber:fulltext {--limit=50 : Tek seferde işlenecek makale sayısı}';
    protected $description = 'Pending makalelerin tam metnini çek, dil tespiti yap, Türkçe çevir';

    public function handle(LibreTranslateService $translator): void
    {
        $limit = (int) $this->option('limit');
        $this->info("Full-text scraping başlıyor (limit: {$limit})...");

        if (!$translator->isHealthy()) {
            $this->warn("LibreTranslate erişilemiyor; çeviri yapılmadan devam edilecek.");
        }

        $articles = DB::table('articles')
            ->join('sources', 'articles.source_id', '=', 'sources.id')
            ->where('articles.scrape_status', 'pending')
            ->whereNotNull('articles.url')
            ->select('articles.id', 'articles.url', 'articles.title', 'articles.summary', 'sources.language')
            ->orderBy('articles.published_at', 'desc')
            ->limit($limit)
            ->get();

        $this->info("İşlenecek: {$articles->count()} makale");
        $success = 0;
        $failed  = 0;

        foreach ($articles as $article) {
            DB::table('articles')->where('id', $article->id)->update(['scrape_status' => 'processing']);

            try {
                $text = $this->scrapeText($article->url);

                if (empty($text)) {
                    DB::table('articles')->where('id', $article->id)->update(['scrape_status' => 'failed']);
                    $failed++;
                    continue;
                }

                // Dil tespit + Türkçe çeviri
                $trText = $this->translateToTurkish($translator, $text, $article->language ?? 'en');

                DB::table('articles')->where('id', $article->id)->update([
                    'full_text'         => mb_substr($text, 0, 10000),
                    'full_text_tr'      => $trText ? mb_substr($trText, 0, 10000) : null,
                    'language_detected' => $article->language ?? 'en',
                    'scrape_status'     => 'success',
                ]);

                $success++;
                $this->line("  ✓ #{$article->id}: " . mb_substr($article->title, 0, 60));

            } catch (\Exception $e) {
                Log::error("FetchFullText #{$article->id}: " . $e->getMessage());
                DB::table('articles')->where('id', $article->id)->update(['scrape_status' => 'failed']);
                $failed++;
            }

            // Rate limit: her 3 makalede 1 saniye bekle
            if (($success + $failed) % 3 === 0) usleep(1000000);
        }

        $this->info("✓ Başarılı: {$success} | Başarısız: {$failed}");
    }

    private function scrapeText(string $url): string
    {
        $response = Http::timeout(10)
            ->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; MedyaIzle/1.0; +https://medyaizle.com)'])
            ->get($url);

        if (!$response->successful()) return '';

        $html = $response->body();

        // Temel HTML → metin dönüşümü
        // Script/style temizle
        $html = preg_replace('/<script[^>]*>.*?<\/script>/si', '', $html);
        $html = preg_replace('/<style[^>]*>.*?<\/style>/si', '', $html);

        // Yaygın article container'larını önceliklendir
        if (preg_match('/<article[^>]*>(.*?)<\/article>/si', $html, $m)) {
            $html = $m[1];
        } elseif (preg_match('/<div[^>]*class="[^"]*(?:content|body|text|article-body)[^"]*"[^>]*>(.*?)<\/div>/si', $html, $m)) {
            $html = $m[1];
        }

        // Paragrafları çıkar
        preg_match_all('/<p[^>]*>(.*?)<\/p>/si', $html, $pMatches);
        $paragraphs = array_map(fn($p) => strip_tags($p), $pMatches[1] ?? []);
        $paragraphs = array_filter($paragraphs, fn($p) => mb_strlen(trim($p)) > 30);
        $text = implode("\n\n", $paragraphs);

        // Genel temizlik
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);

        return $text;
    }

    private function translateToTurkish(LibreTranslateService $translator, string $text, string $lang): ?string
    {
        // Türkçe ise çevirme
        if ($lang === 'tr') return $text;

        $excerpt = mb_substr($text, 0, 3000);
        return $translator->translate($excerpt, $lang, 'tr');
    }
}
