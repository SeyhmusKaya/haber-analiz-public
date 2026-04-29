<?php
namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SilenceController extends Controller
{
    private const ALL_COUNTRIES = ['TR', 'US', 'GB', 'DE', 'RU', 'CN', 'IR', 'IL', 'SA', 'EG'];
    private const COUNTRY_NAMES = [
        'TR' => 'Türkiye', 'US' => 'ABD', 'GB' => 'İngiltere', 'DE' => 'Almanya',
        'RU' => 'Rusya', 'CN' => 'Çin', 'IR' => 'İran', 'IL' => 'İsrail',
        'SA' => 'Suudi Arabistan', 'EG' => 'Mısır',
    ];

    public function __construct(private GeminiService $gemini) {}

    public function show(int $eventId): JsonResponse
    {
        $event = Event::with(['articles.source'])->find($eventId);
        if (!$event) return response()->json(['error' => 'Not found'], 404);

        $coveredCodes = $event->articles
            ->map(fn($a) => $a->source->country_code)
            ->unique()->filter(fn($c) => in_array($c, self::ALL_COUNTRIES))->values()->toArray();

        $missingCodes = array_values(array_diff(self::ALL_COUNTRIES, $coveredCodes));

        if (count($missingCodes) === 0 || count($coveredCodes) < 3) {
            return response()->json([
                'covered' => $coveredCodes,
                'missing' => [],
                'analysis' => null,
            ]);
        }

        // Cache: 24 saat
        $cacheKey = "silence:{$eventId}";
        $analysis = Cache::remember($cacheKey, 86400, function () use ($event, $coveredCodes, $missingCodes) {
            return $this->generateAnalysis($event->title_tr, $coveredCodes, $missingCodes);
        });

        return response()->json([
            'covered' => $coveredCodes,
            'missing' => $missingCodes,
            'analysis' => $analysis,
        ]);
    }

    private function generateAnalysis(string $title, array $covered, array $missing): ?string
    {
        $coveredNames  = implode(', ', array_map(fn($c) => self::COUNTRY_NAMES[$c] ?? $c, $covered));
        $missingNames  = implode(', ', array_map(fn($c) => self::COUNTRY_NAMES[$c] ?? $c, $missing));

        $prompt = "Haber başlığı: {$title}\n\nBu haberi kapsamlı biçimde işleyen ülkeler: {$coveredNames}\nBu haberi hiç işlemeyen veya çok az yer veren ülkeler: {$missingNames}\n\nNeden bazı ülke medyaları bu haberi görmezden gelmiş olabilir? Jeopolitik, ekonomik, siyasi veya kültürel nedenlerle açıkla. Türkçe, 3-5 cümle yaz. Yalnızca açıklamayı yaz, başka hiçbir şey ekleme.";

        return $this->gemini->generate($prompt, 512);
    }
}
