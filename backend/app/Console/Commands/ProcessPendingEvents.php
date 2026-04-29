<?php
namespace App\Console\Commands;

use App\Models\Event;
use App\Services\GeminiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessPendingEvents extends Command
{
    protected $signature = 'haber:analyze {--limit=200 : Max events to process per run}';
    protected $description = 'Generate Turkish titles/summaries for pending events via Gemini';

    public function __construct(private GeminiService $gemini)
    {
        parent::__construct();
    }

    public function handle(): void
    {
        $limit = (int) $this->option('limit');

        // Sadece yeni veya son cluster'dan bu yana değişen eventleri analiz et
        $eventIds = Event::where('status', 'pending')
            ->where('retry_count', '<', 3)
            ->where(function ($q) {
                $q->whereNull('analyzed_at')
                  ->orWhereColumn('updated_at', '>', 'analyzed_at');
            })
            ->orderBy('importance_score', 'desc')
            ->limit($limit)
            ->pluck('id')
            ->toArray();

        if (empty($eventIds)) {
            $this->info('No pending events.');
            return;
        }

        $this->info("Processing " . count($eventIds) . " pending events...");
        $bar = $this->output->createProgressBar(count($eventIds));
        $bar->start();

        $done   = 0;
        $failed = 0;

        foreach ($eventIds as $id) {
            $event = Event::with('articles')->find($id);
            if ($event) {
                $this->processEvent($event) ? $done++ : $failed++;
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done. Processed: {$done}, Failed: {$failed}");

        $remaining = Event::where('status', 'pending')->where('retry_count', '<', 3)->count();
        if ($remaining > 0) {
            $this->warn("{$remaining} events still pending.");
        }
    }

    // Sequential fallback
    private function processEvent(Event $event): bool
    {
        $titles    = $event->articles->pluck('title')->toArray();
        $summaries = $event->articles->pluck('summary')->filter()->toArray();
        $result    = self::generate($titles, $summaries);

        if ($result) {
            $updateData = [
                'title_tr'    => $result['title'],
                'summary_tr'  => $result['summary'],
                'category'    => $result['category'],
                'status'      => 'ready',
                'retry_count' => 0,
            ];
            if ($result['is_turkey_related'] !== null) {
                $updateData['is_turkey_related'] = $result['is_turkey_related'];
            }
            if ($result['related_countries'] !== null) {
                $updateData['related_countries'] = json_encode($result['related_countries']);
            }
            $event->update($updateData);
            return true;
        }

        $newRetry = ($event->retry_count ?? 0) + 1;
        $event->update([
            'retry_count' => $newRetry,
            'status'      => $newRetry >= 3 ? 'failed' : 'pending',
        ]);
        Log::warning("Event {$event->id} failed, retry_count={$newRetry}");
        return false;
    }

    // Static — Concurrency process'lerinde serialize edilebilir
    private static function generate(array $titles, array $summaries): ?array
    {
        // Opus #9: Prompt sıkıştırma — başlık + max 200 char summary, %50-70 token tasarrufu
        $titlesText  = implode("\n", array_slice($titles, 0, 12));
        $summaryText = implode("\n---\n", array_map(
            fn($s) => mb_substr($s, 0, 200),
            array_slice($summaries, 0, 6)
        ));
        $categories  = 'siyaset, ekonomi, savas-catisma, diplomasi, teknoloji, saglik, cevre, spor, kultur, diger';

        $prompt = <<<PROMPT
Asagidaki haber kaynaklarini analiz et. Cevabini TAM OLARAK asagidaki formatta ver, baska hicbir sey yazma:

TITLE: [Tum haberleri kapsayan kisa TURKCE baslik, max 120 karakter]
SUMMARY: [8-10 cumleli tarafsiz TURKCE ozet, tek paragraf]
CATEGORY: [SADECE birini sec: {$categories}]
TR_RELATED: [Bu haber dogrudan Turkiye ile ilgili mi? (Turkiye'de gerceklesen, Turkiye'yi veya Turkleri dogrudan etkileyen ya da Turk hukumeti/kurumlarinin taraf oldugu haberler). SADECE "evet" veya "hayir" yaz]
RELATED_COUNTRIES: [Bu haberin DOGRUDAN ilgilendirdigi ulke kodlari, virgulla ayir. Sadece haberin konusu olan, adi gecen veya dogrudan etkilenen ulkeleri yaz. Haberi sadece haberlestirenler degil, haberin HAKKINDA oldugu ulkeler. Kullanilabilecek kodlar: TR,US,GB,DE,RU,CN,IR,IL,SA,EG. Ornek: US,CN veya IL,IR,US]

HABERLER:
{$titlesText}

OZETLER:
{$summaryText}
PROMPT;

        $gemini   = app(GeminiService::class);
        $response = $gemini->generate($prompt, 4096);
        if (!$response) return null;

        $response = trim($response);

        // Alan bazlı regex ile parse et — tırnak/satır sorunu yok
        $title    = null;
        $summary  = null;
        $category = null;

        if (preg_match('/^TITLE:\s*(.+)/m', $response, $m)) {
            $title = trim($m[1]);
        }
        // SUMMARY birden fazla satıra yayılabilir — sonraki etiket veya string sonuna kadar yakala
        // \z = absolute string end ($ ile karıştırma: m flag'i ile $ her satır sonuna denk gelir)
        if (preg_match('/^SUMMARY:\s*(.*?)(?=\n(?:CATEGORY|TR_RELATED|RELATED_COUNTRIES):|\z)/ms', $response, $m)) {
            $summary = trim($m[1]);
        }
        if (preg_match('/^CATEGORY:\s*(\S+)/m', $response, $m)) {
            $category = trim($m[1]);
        }
        $isTurkeyRelated = null;
        if (preg_match('/^TR_RELATED:\s*(\S+)/mi', $response, $m)) {
            $isTurkeyRelated = mb_strtolower(trim($m[1])) === 'evet';
        }

        $relatedCountries = null;
        if (preg_match('/^RELATED_COUNTRIES:\s*(.+)/mi', $response, $m)) {
            $validCodes = ['TR','US','GB','DE','RU','CN','IR','IL','SA','EG'];
            $cleaned = preg_replace('/[^A-Z,]/', '', strtoupper(trim($m[1])));
            $parsed = array_map('trim', explode(',', $cleaned));
            $filtered = array_values(array_intersect($parsed, $validCodes));
            if (!empty($filtered)) {
                $relatedCountries = $filtered;
            }
        }

        // Keyword enrichment: başlık/özetten eksik ülke kodlarını tamamla
        $relatedCountries = self::enrichCountriesWithKeywords(
            $title . ' ' . $summary,
            $relatedCountries ?? []
        );

        if (!$title || !$summary) {
            Log::warning("Unparseable Gemini response: " . mb_substr($response, 0, 300));
            return null;
        }

        $validCategories = ['siyaset', 'ekonomi', 'savas-catisma', 'diplomasi', 'teknoloji', 'saglik', 'cevre', 'spor', 'kultur', 'diger'];
        if (!in_array($category, $validCategories)) {
            $category = $gemini->categoryByKeywords($title);
        }

        return [
            'title'              => $title,
            'summary'            => $summary,
            'category'           => $category,
            'is_turkey_related'  => $isTurkeyRelated,
            'related_countries'  => $relatedCountries,
        ];
    }

    private static function enrichCountriesWithKeywords(string $text, array $existingCodes): array
    {
        $keywords = [
            'TR' => ['türkiye','türk','ankara','erdoğan','istanbul','izmir','tbmm','cumhurbaşkan','meclis','kayseri','hakan fidan','akp','chp','mhp'],
            'US' => ['abd','amerik','trump','washington','pentagon','beyaz saray','biden','amerika','fbi','cia'],
            'RU' => ['rusya','rus ','putin','moskova','kremlin','ukrayna'],
            'GB' => ['ingiltere','ingiliz','londra','britanya','birleşik krallık'],
            'DE' => ['almanya','alman','berlin'],
            'CN' => ['çin','çinli','pekin','tayvan'],
            'IR' => ['iran','tahran','ayetullah','hameney','husi','husiler','hürmüz'],
            'IL' => ['israil','tel aviv','netanyahu','gazze','filistin','hamas','idf','batı şeria'],
            'SA' => ['suudi','riyad','arabistan','neom'],
            'EG' => ['mısır','kahire','sisi'],
        ];

        $text = mb_strtolower($text);
        foreach ($keywords as $code => $kws) {
            if (in_array($code, $existingCodes)) continue;
            foreach ($kws as $kw) {
                if (mb_strpos($text, $kw) !== false) {
                    $existingCodes[] = $code;
                    break;
                }
            }
        }

        return !empty($existingCodes) ? array_values(array_unique($existingCodes)) : [];
    }
}
