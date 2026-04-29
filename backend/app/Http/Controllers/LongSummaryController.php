<?php
namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LongSummaryController extends Controller
{
    public function __construct(private GeminiService $gemini) {}

    public function show(Request $request, int $eventId): JsonResponse
    {
        $event = Event::with('articles')->find($eventId);
        if (!$event) {
            return response()->json(['error' => 'Haber bulunamadı.'], 404);
        }

        // Return cached if exists
        if ($event->long_summary_tr) {
            return response()->json(['long_summary_tr' => $event->long_summary_tr, 'cached' => true]);
        }

        // Generate — full text varsa kullan, yoksa summary'ye düş
        $titles = $event->articles->pluck('title')->take(15)->implode("\n");
        $summaries = $event->articles->map(function ($a) {
            return trim($a->full_text_tr ?? $a->summary ?? '');
        })->filter()->take(8)->implode("\n---\n");

        $prompt = <<<PROMPT
Aşağıdaki haber kaynaklarını analiz et ve kapsamlı bir Türkçe özet yaz.

KURALLAR:
- Minimum 20, maksimum 35 cümle
- Tarafsız, objektif bir dil kullan
- Konunun tüm boyutlarını (siyasi, ekonomik, insani, uluslararası) ele al
- Önemli isimleri, tarihleri ve rakamları dahil et
- Tek paragraf değil, akıcı birbiriyle bağlantılı cümleler yaz
- Sadece Türkçe kullan

HABER BAŞLIKLARI:
{$titles}

ÖZETLER:
{$summaries}

Şimdi kapsamlı Türkçe özeti yaz:
PROMPT;

        $response = $this->gemini->generate($prompt, 4096);

        if (!$response) {
            Log::warning("LongSummary generation failed for event {$eventId}");
            return response()->json(['error' => 'Özet üretilemedi, lütfen tekrar deneyin.'], 503);
        }

        $event->update(['long_summary_tr' => trim($response)]);

        return response()->json(['long_summary_tr' => trim($response), 'cached' => false]);
    }
}
