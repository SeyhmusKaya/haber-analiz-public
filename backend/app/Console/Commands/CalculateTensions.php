<?php
namespace App\Console\Commands;

use App\Services\GeminiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class CalculateTensions extends Command
{
    protected $signature = 'haber:calculate-tensions';
    protected $description = 'related_countries tabanlı jeopolitik gerilim endeksini hesapla';

    private const COUNTRIES = [
        'TR' => 'Türkiye', 'US' => 'ABD', 'GB' => 'İngiltere', 'DE' => 'Almanya',
        'RU' => 'Rusya', 'CN' => 'Çin', 'IR' => 'İran', 'IL' => 'İsrail',
        'SA' => 'Suudi Arabistan', 'EG' => 'Mısır',
    ];

    // Gerilim artırıcı anahtar kelimeler
    private const TENSION_KEYWORDS = [
        'savaş', 'saldırı', 'bomba', 'füze', 'yaptırım', 'çatışma', 'askeri', 'kriz',
        'nükleer', 'tehdit', 'abluka', 'işgal', 'misilleme', 'gerilim', 'operasyon',
        'saldırdı', 'vurdu', 'öldürdü', 'drone', 'iha', 'müdahale', 'ambargo',
    ];

    // Yumuşama anahtar kelimeleri
    private const CALM_KEYWORDS = [
        'anlaşma', 'barış', 'işbirliği', 'ortaklık', 'ittifak', 'diplomatik',
        'zirve', 'müzakere', 'ateşkes', 'görüşme', 'diyalog',
    ];

    public function handle(GeminiService $gemini): void
    {
        $this->info('Gerilim hesaplaması başlıyor...');
        $today = now()->toDateString();
        $codes = array_keys(self::COUNTRIES);

        // related_countries'dan ülke çifti başına event'leri topla (son 30 gün)
        $pairEvents = $this->collectPairEvents();

        // Haber sayısı 3+ olan çiftler için Gemini skoru iste
        $geminiScores = $this->getGeminiScores($gemini, $pairEvents);

        // Tüm çiftleri DB'ye yaz
        $inserted = 0;
        for ($i = 0; $i < count($codes); $i++) {
            for ($j = $i + 1; $j < count($codes); $j++) {
                $codeA = $codes[$i];
                $codeB = $codes[$j];
                $key = "{$codeA}-{$codeB}";
                $altKey = "{$codeB}-{$codeA}";

                $events = $pairEvents[$key] ?? $pairEvents[$altKey] ?? [];
                $articleCount = count($events);

                // Skor hesapla
                if (isset($geminiScores[$key]) || isset($geminiScores[$altKey])) {
                    $score = $geminiScores[$key] ?? $geminiScores[$altKey];
                } elseif ($articleCount > 0) {
                    $score = $this->keywordScore($events);
                } else {
                    $score = 0;
                }

                $exists = DB::table('geopolitical_tensions')
                    ->where('country_a', $codeA)
                    ->where('country_b', $codeB)
                    ->whereRaw("DATE(calculated_at) = ?", [$today])
                    ->exists();

                if ($exists) {
                    DB::table('geopolitical_tensions')
                        ->where('country_a', $codeA)->where('country_b', $codeB)
                        ->whereRaw("DATE(calculated_at) = ?", [$today])
                        ->update([
                            'tension_score' => $score,
                            'article_count' => $articleCount,
                            'calculated_at' => now(),
                        ]);
                } else {
                    DB::table('geopolitical_tensions')->insert([
                        'country_a'     => $codeA,
                        'country_b'     => $codeB,
                        'tension_score' => $score,
                        'article_count' => $articleCount,
                        'calculated_at' => now(),
                    ]);
                }
                $inserted++;
            }
        }

        $this->info("✓ {$inserted} ülke çifti hesaplandı.");

        // Controller cache'ini temizle
        Cache::forget('tensions_index');
        // Tension articles cache'lerini de temizle
        foreach ($codes as $a) {
            foreach ($codes as $b) {
                if ($a !== $b) {
                    Cache::forget("tension_articles_v5_{$a}_{$b}");
                }
            }
        }
        $this->info('Cache temizlendi.');
    }

    /**
     * related_countries'dan ülke çifti başına event başlıklarını topla (son 30 gün)
     */
    private function collectPairEvents(): array
    {
        $events = DB::table('events')
            ->where('status', 'ready')
            ->whereNotNull('related_countries')
            ->where('created_at', '>=', now()->subDays(30))
            ->select('id', 'title_tr', 'summary_tr', 'related_countries')
            ->get();

        $pairs = [];
        foreach ($events as $e) {
            $countries = json_decode($e->related_countries, true);
            if (!is_array($countries)) $countries = json_decode($countries, true);
            if (!is_array($countries) || count($countries) < 2) continue;

            sort($countries);
            for ($i = 0; $i < count($countries); $i++) {
                for ($j = $i + 1; $j < count($countries); $j++) {
                    $key = $countries[$i] . '-' . $countries[$j];
                    $pairs[$key][] = [
                        'title' => $e->title_tr,
                        'summary' => mb_substr($e->summary_tr ?? '', 0, 200),
                    ];
                }
            }
        }

        return $pairs;
    }

    /**
     * Haber sayısı yeterli olan çiftler için Gemini'den gerilim skoru iste
     */
    private function getGeminiScores(GeminiService $gemini, array $pairEvents): array
    {
        // Sadece 2+ haberi olan çiftleri Gemini'ye gönder
        $pairsForGemini = [];
        foreach ($pairEvents as $key => $events) {
            if (count($events) >= 2) {
                $pairsForGemini[$key] = $events;
            }
        }

        if (empty($pairsForGemini)) {
            $this->info('Gemini için yeterli çift yok.');
            return [];
        }

        // Prompt oluştur: her çift için başlıkları göster
        $lines = [];
        foreach ($pairsForGemini as $key => $events) {
            [$codeA, $codeB] = explode('-', $key);
            $nameA = self::COUNTRIES[$codeA] ?? $codeA;
            $nameB = self::COUNTRIES[$codeB] ?? $codeB;
            $titles = array_map(fn($e) => $e['title'], array_slice($events, 0, 5));
            $titleText = implode(' | ', $titles);
            $lines[] = "{$nameA}-{$nameB} ({$key}, " . count($events) . " haber): {$titleText}";
        }
        $pairsText = implode("\n", $lines);

        $prompt = <<<PROMPT
Sen bir jeopolitik analiz uzmanısın. Aşağıdaki ülke çiftleri arasında DOĞRUDAN ilgili haberlere göre JEOPOLİTİK GERİLİM SKORUNU belirle.

Skor kriterleri (0-10):
0-2: Barışçıl, işbirliği haberleri
3-4: Hafif anlaşmazlık, rekabet
5-6: Belirgin gerilim, diplomatik kriz
7-8: Yüksek gerilim, askeri tehditler
9-10: Aktif çatışma, savaş

Her çift için haber başlıklarını analiz et ve skor ver.
SADECE aşağıdaki formatta yaz, başka hiçbir şey ekleme:
ÜLKE_KODU1-ÜLKE_KODU2:SKOR

Çiftler ve haberleri:
{$pairsText}
PROMPT;

        $response = $gemini->generate($prompt, 1024);

        $scores = [];
        if ($response) {
            foreach (explode("\n", $response) as $line) {
                $line = trim($line);
                if (preg_match('/^([A-Z]{2})-([A-Z]{2}):(\d+(?:\.\d+)?)$/', $line, $m)) {
                    $score = min(10, max(0, (float)$m[3]));
                    $key = "{$m[1]}-{$m[2]}";
                    $scores[$key] = $score;
                }
            }
            $this->info('Gemini yanıtından ' . count($scores) . ' çift skoru alındı.');
        } else {
            $this->warn('Gemini yanıt vermedi, keyword fallback kullanılacak.');
        }

        return $scores;
    }

    /**
     * Keyword tabanlı gerilim skoru (Gemini fallback)
     */
    private function keywordScore(array $events): float
    {
        $combined = mb_strtolower(implode(' ', array_map(fn($e) => $e['title'] . ' ' . $e['summary'], $events)));

        $tensionCount = 0;
        $calmCount = 0;
        foreach (self::TENSION_KEYWORDS as $kw) {
            $tensionCount += mb_substr_count($combined, $kw);
        }
        foreach (self::CALM_KEYWORDS as $kw) {
            $calmCount += mb_substr_count($combined, $kw);
        }

        // Haber sayısına göre base skor (daha çok haber = daha çok kapsam = potansiyel gerilim)
        $eventCount = count($events);
        $baseScore = min(6, $eventCount * 1.5);

        // Keyword ağırlığı
        $keywordAdjust = ($tensionCount - $calmCount * 0.5) * 0.3;

        $score = $baseScore + $keywordAdjust;
        return round(min(10, max(0, $score)), 1);
    }
}
