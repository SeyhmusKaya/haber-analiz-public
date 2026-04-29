<?php
namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class NarrativeController extends Controller
{
    private const COUNTRIES = [
        'TR' => ['name' => 'Türkiye', 'flag' => '🇹🇷'],
        'US' => ['name' => 'ABD', 'flag' => '🇺🇸'],
        'GB' => ['name' => 'İngiltere', 'flag' => '🇬🇧'],
        'DE' => ['name' => 'Almanya', 'flag' => '🇩🇪'],
        'RU' => ['name' => 'Rusya', 'flag' => '🇷🇺'],
        'CN' => ['name' => 'Çin', 'flag' => '🇨🇳'],
        'IR' => ['name' => 'İran', 'flag' => '🇮🇷'],
        'IL' => ['name' => 'İsrail', 'flag' => '🇮🇱'],
        'SA' => ['name' => 'Suudi Arabistan', 'flag' => '🇸🇦'],
        'EG' => ['name' => 'Mısır', 'flag' => '🇪🇬'],
    ];

    public function __construct(private GeminiService $gemini) {}

    public function show(int $eventId): JsonResponse
    {
        $event = Event::with(['articles.source'])->find($eventId);
        if (!$event) return response()->json(['error' => 'Event not found'], 404);

        // Mevcut kayıtları getir
        $existing = DB::table('narrative_timeline')
            ->where('event_id', $eventId)
            ->orderBy('date')
            ->orderBy('country_code')
            ->get();

        // Yeterli veri varsa direkt dön
        if ($existing->count() >= 2) {
            return $this->formatResponse($eventId, $existing->toArray());
        }

        // Yoksa Gemini ile üret
        $generated = $this->generateNarratives($event);

        $all = DB::table('narrative_timeline')
            ->where('event_id', $eventId)
            ->orderBy('date')
            ->orderBy('country_code')
            ->get()
            ->toArray();

        return $this->formatResponse($eventId, $all);
    }

    private function generateNarratives(Event $event): void
    {
        // Ülkelere göre grupla
        $byCountry = $event->articles->groupBy(fn($a) => $a->source->country_code ?? 'XX');

        foreach ($byCountry as $countryCode => $articles) {
            if (!isset(self::COUNTRIES[$countryCode])) continue;

            // Bu ülke için zaten kayıt var mı?
            $exists = DB::table('narrative_timeline')
                ->where('event_id', $event->id)
                ->where('country_code', $countryCode)
                ->exists();
            if ($exists) continue;

            $countryName = self::COUNTRIES[$countryCode]['name'];

            // Günlere göre grupla
            $byDay = $articles->groupBy(fn($a) => \Carbon\Carbon::parse($a->published_at)->toDateString());
            $byDay = $byDay->sortKeys()->take(7); // max 7 gün

            if ($byDay->count() === 0) continue;

            // Tek bir Gemini çağrısı ile tüm günlerin narratifini al
            $dayTexts = [];
            foreach ($byDay as $date => $dayArticles) {
                $titles = $dayArticles->map(fn($a) => $a->title)->implode(' | ');
                $dayTexts[] = "Tarih: {$date}\nHaberler: {$titles}";
            }
            $daysText = implode("\n\n", $dayTexts);

            $prompt = "Konu: {$event->title_tr}\n{$countryName} medyasının bu olayı günler içinde nasıl işlediğini analiz et.\n\nHer gün için şu formatta Türkçe yanıt ver:\n\nGÜN:YYYY-MM-DD\nANLATI:[O günün anlatısını 2-3 cümleyle özetle]\nSENTİMAN:[0-10 arası — 0=çok olumsuz, 5=nötr, 10=çok olumlu]\n\nGünler:\n{$daysText}";

            $response = $this->gemini->generate($prompt, 4096);
            if (!$response) continue;

            // Parse yanıt
            preg_match_all('/GÜN:(\d{4}-\d{2}-\d{2})\nANLATI:(.*?)\nSENTİMAN:(\d+(?:\.\d+)?)/s', $response, $matches, PREG_SET_ORDER);

            // Parse edilemezse basit fallback: tek satır per gün
            if (empty($matches)) {
                // Daha basit pattern dene
                preg_match_all('/(\d{4}-\d{2}-\d{2}).*?ANLATI:\s*(.*?)\s*SENTİMAN:\s*([\d.]+)/s', $response, $matches, PREG_SET_ORDER);
            }

            if (empty($matches)) {
                // En basit fallback: tüm günleri tek anlatıyla kaydet
                foreach ($byDay as $date => $dayArticles) {
                    DB::table('narrative_timeline')->updateOrInsert(
                        ['event_id' => $event->id, 'country_code' => $countryCode, 'date' => $date],
                        [
                            'narrative_summary' => "Bu tarihte {$countryName} medyası konuyu gündemine almış, ancak ayrıntılı analiz üretilemedi.",
                            'sentiment_score' => 0.5,
                            'divergence_score' => 0.0,
                            'created_at' => now(),
                        ]
                    );
                }
                continue;
            }

            foreach ($matches as $m) {
                $date = $m[1];
                $narrative = trim($m[2]);
                $sentiment = min(1.0, max(-1.0, ((float)$m[3] - 5) / 5)); // 0-10 → -1..+1

                DB::table('narrative_timeline')->updateOrInsert(
                    ['event_id' => $event->id, 'country_code' => $countryCode, 'date' => $date],
                    [
                        'narrative_summary' => $narrative,
                        'sentiment_score' => $sentiment,
                        'divergence_score' => 0.0,
                        'created_at' => now(),
                    ]
                );
            }
        }
    }

    private function formatResponse(int $eventId, array $rows): JsonResponse
    {
        // Ülke bazında grupla, her biri için günlük dizi
        $byCountry = [];
        foreach ($rows as $row) {
            $code = $row->country_code;
            $meta = self::COUNTRIES[$code] ?? ['name' => $code, 'flag' => ''];
            if (!isset($byCountry[$code])) {
                $byCountry[$code] = [
                    'country_code' => $code,
                    'country_name' => $meta['name'],
                    'flag' => $meta['flag'],
                    'entries' => [],
                ];
            }
            $byCountry[$code]['entries'][] = [
                'date' => $row->date,
                'narrative_summary' => $row->narrative_summary,
                'sentiment_score' => (float)$row->sentiment_score,
                'divergence_score' => (float)$row->divergence_score,
            ];
        }

        return response()->json([
            'event_id' => $eventId,
            'countries' => array_values($byCountry),
        ]);
    }
}
