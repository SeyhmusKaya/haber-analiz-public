<?php
namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FactCheckController extends Controller
{
    public function __construct(private GeminiService $gemini) {}

    public function show(int $eventId): JsonResponse
    {
        $event = Event::find($eventId);
        if (!$event) return response()->json(['fact_checks' => []]);

        // Önce DB'ye bak
        $existing = DB::table('fact_checks')
            ->where('event_id', $eventId)
            ->orderBy('checked_at', 'desc')
            ->get();

        if ($existing->isNotEmpty()) {
            return response()->json(['fact_checks' => $existing]);
        }

        // Yoksa Gemini ile üret
        $checks = $this->generateFactChecks($event);
        return response()->json(['fact_checks' => $checks]);
    }

    private function generateFactChecks(Event $event): array
    {
        $prompt = "Haber: {$event->title_tr}\n\nÖzet: " . mb_substr($event->summary_tr ?? '', 0, 500) . "\n\nBu haber için doğrulanabilir 3 somut iddia belirle ve her biri için teyit durumu değerlendir.\n\nHer iddia için şu formatta yanıt ver:\n\nİDDİA:[İddianın kısa ve somut ifadesi]\nDEĞERLENDİRME:[Doğru|Yanlış|Kısmen Doğru|Doğrulanamadı]\nAÇIKLAMA:[1-2 cümle açıklama]\n\n3 ayrı iddia yaz.";

        $response = $this->gemini->generate($prompt, 2048);
        if (!$response) return [];

        $results = [];
        preg_match_all('/İDDİA:(.*?)\nDEĞERLENDİRME:(.*?)\nAÇIKLAMA:(.*?)(?=İDDİA:|$)/s', $response, $matches, PREG_SET_ORDER);

        $ratingMap = [
            'Doğru' => 'true',
            'Yanlış' => 'false',
            'Kısmen Doğru' => 'half-true',
            'Doğrulanamadı' => 'unverified',
        ];

        foreach ($matches as $m) {
            $claim = trim($m[1]);
            $ratingTr = trim($m[2]);
            $explanation = trim($m[3]);
            $rating = $ratingMap[$ratingTr] ?? 'unverified';

            // DB'ye kaydet
            DB::table('fact_checks')->insert([
                'event_id'   => $event->id,
                'claim'      => $claim,
                'source'     => 'Medya İzle AI',
                'rating'     => $rating,
                'explanation' => $explanation,
                'source_url' => null,
                'checked_at' => now(),
            ]);

            $results[] = (object)[
                'event_id'   => $event->id,
                'claim'      => $claim,
                'source'     => 'Medya İzle AI',
                'rating'     => $rating,
                'explanation' => $explanation,
                'source_url' => null,
                'checked_at' => now()->toISOString(),
            ];
        }

        return $results;
    }
}
