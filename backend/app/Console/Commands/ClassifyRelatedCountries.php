<?php
namespace App\Console\Commands;

use App\Models\Event;
use App\Services\GeminiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ClassifyRelatedCountries extends Command
{
    protected $signature = 'haber:classify-countries {--limit=20 : Max events per run}';
    protected $description = 'Gemini ile event\'lerin ilgili ülkelerini belirle (backfill)';

    private const VALID_CODES = ['TR','US','GB','DE','RU','CN','IR','IL','SA','EG'];

    // Başlık/özetten ülke tespiti için keyword haritası
    private const COUNTRY_KEYWORDS = [
        'TR' => ['türkiye','türk','ankara','erdoğan','istanbul','izmir','tbmm','cumhurbaşkan','meclis','kayseri','hakan fidan','antalya','akp','chp','mhp'],
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

    public function handle(GeminiService $gemini): void
    {
        $limit = (int) $this->option('limit');

        $events = Event::whereNull('related_countries')
            ->where('status', 'ready')
            ->whereNotNull('title_tr')
            ->orderByDesc('importance_score')
            ->limit($limit)
            ->get();

        if ($events->isEmpty()) {
            $this->info('Sınıflandırılacak event yok.');
            return;
        }

        $this->info("{$events->count()} event sınıflandırılıyor...");
        $bar = $this->output->createProgressBar($events->count());
        $bar->start();

        $success = 0;
        $failed  = 0;
        $keywordFallback = 0;

        foreach ($events as $event) {
            $prompt = "Bu haberin DOGRUDAN ilgilendirdigi ulke kodlarini yaz. Haberi sadece haberlestirenler degil, haberin HAKKINDA oldugu ulkeleri belirle.\nKullanilabilecek kodlar: TR,US,GB,DE,RU,CN,IR,IL,SA,EG\nSADECE virgullu kodlari yaz, baska bir sey yazma.\n\nBaslik: {$event->title_tr}\nOzet: " . mb_substr($event->summary_tr ?? '', 0, 300);

            $response = $gemini->generate($prompt, 50);

            $codes = [];
            if ($response) {
                // Response'tan ülke kodlarını parse et (harf ve virgül dışını temizle)
                $cleaned = preg_replace('/[^A-Z,]/', '', strtoupper(trim($response)));
                $parsed = array_map('trim', explode(',', $cleaned));
                $codes = array_values(array_intersect($parsed, self::VALID_CODES));
            }

            // Keyword enrichment: başlık/özetten ek ülke kodları ekle
            $codes = $this->enrichWithKeywords($event, $codes);

            if (!empty($codes)) {
                $event->update(['related_countries' => json_encode(array_values(array_unique($codes)))]);
                $success++;
                if (!$response) $keywordFallback++;
            } else {
                // Gemini başarısız VE keyword de bulamadı → boş array ata (null bırakma)
                $event->update(['related_countries' => '[]']);
                $failed++;
                Log::info("ClassifyCountries: #{$event->id} - no countries found. Response: " . ($response ?? 'NULL'));
            }

            $bar->advance();
            usleep(150000);
        }

        $bar->finish();
        $this->newLine();
        $this->info("Tamamlandı. Başarılı: {$success}" . ($keywordFallback ? " (keyword fallback: {$keywordFallback})" : "") . ", Başarısız: {$failed}");

        $remaining = Event::whereNull('related_countries')->where('status', 'ready')->count();
        if ($remaining > 0) {
            $this->warn("{$remaining} event daha bekliyor.");
        }
    }

    /**
     * Başlık ve özetten keyword tabanlı ülke kodları ekle
     */
    private function enrichWithKeywords(Event $event, array $existingCodes): array
    {
        $text = mb_strtolower($event->title_tr . ' ' . ($event->summary_tr ?? ''));

        foreach (self::COUNTRY_KEYWORDS as $code => $keywords) {
            if (in_array($code, $existingCodes)) continue;
            foreach ($keywords as $kw) {
                if (mb_strpos($text, $kw) !== false) {
                    $existingCodes[] = $code;
                    break;
                }
            }
        }

        return $existingCodes;
    }
}
