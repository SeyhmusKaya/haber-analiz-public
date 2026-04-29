<?php
namespace App\Http\Controllers;

use App\Models\Analysis;
use App\Models\Event;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class AnalysisController extends Controller
{
    private const DAILY_LIMITS = ['free' => 3, 'standart' => 20, 'pro' => -1];

    private function checkDailyLimit(): ?JsonResponse
    {
        $user = Auth::user();
        if (!$user) return null;

        $plan  = $user->plan ?? 'free';
        $limit = self::DAILY_LIMITS[$plan] ?? 3;

        if ($limit === -1) return null; // unlimited

        $key   = "analysis_usage:{$user->id}:" . now()->toDateString();
        $count = (int) Cache::get($key, 0);

        if ($count >= $limit) {
            return response()->json([
                'error'    => 'Günlük analiz limitinize ulaştınız.',
                'code'     => 'daily_limit_reached',
                'limit'    => $limit,
                'used'     => $count,
                'plan'     => $plan,
                'required' => $plan === 'free' ? 'standart' : 'pro',
            ], 429);
        }

        return null;
    }

    private function incrementDailyUsage(): void
    {
        $user = Auth::user();
        if (!$user) return;

        $key = "analysis_usage:{$user->id}:" . now()->toDateString();
        Cache::increment($key);
        // Gece yarısına kadar TTL
        $secondsUntilMidnight = now()->endOfDay()->diffInSeconds(now());
        Cache::put($key, (int) Cache::get($key, 1), $secondsUntilMidnight);
    }
    private array $COUNTRIES = [
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

    public function show(int $eventId, string $countryCode): JsonResponse
    {
        $event = Event::with(['articles.source'])->find($eventId);
        if (!$event) return response()->json(['error' => 'Event not found'], 404);

        $countryCode = strtoupper($countryCode);
        $countryMeta = $this->COUNTRIES[$countryCode] ?? null;
        if (!$countryMeta) return response()->json(['error' => 'Country not found'], 404);

        // Check cache — cached analyses don't count toward daily limit
        $cached = Analysis::where('event_id', $eventId)
            ->where('country_code', $countryCode)
            ->where('expires_at', '>', now())
            ->first();

        if ($cached) {
            return response()->json([
                'event_id' => $eventId,
                'country_code' => $countryCode,
                'country_name' => $countryMeta['name'],
                'pro_gov_summary' => $cached->pro_gov_summary,
                'opposition_summary' => $cached->opposition_summary,
                'consensus' => $cached->consensus,
                'pro_gov_sources' => $cached->pro_gov_sources ?? [],
                'opposition_sources' => $cached->opposition_sources ?? [],
                'propaganda_scores' => $cached->propaganda_scores,
                'word_frequencies' => $cached->word_frequencies ?? [],
                'cached' => true,
                'created_at' => $cached->created_at->toISOString(),
            ]);
        }

        // Get articles for this country
        $articles = $event->articles->filter(fn($a) => $a->source->country_code === $countryCode);

        $proGovArticles = $articles
            ->filter(fn($a) => $a->source->bias === 'pro_gov')
            ->map(fn($a) => ['source' => $a->source->name, 'title' => $a->title, 'summary' => $a->summary ?? ''])
            ->values()
            ->toArray();

        $oppositionArticles = $articles
            ->filter(fn($a) => $a->source->bias === 'opposition')
            ->map(fn($a) => ['source' => $a->source->name, 'title' => $a->title, 'summary' => $a->summary ?? ''])
            ->values()
            ->toArray();

        if (empty($proGovArticles) && empty($oppositionArticles)) {
            return response()->json(['error' => 'No articles for this country'], 404);
        }

        // Daily limit check — only for new Gemini calls (not cached)
        $limitError = $this->checkDailyLimit();
        if ($limitError) return $limitError;

        $result = $this->gemini->generateCountryAnalysis(
            $eventId, $countryCode, $event->title_tr, $proGovArticles, $oppositionArticles
        );

        // Increment daily usage counter
        $this->incrementDailyUsage();

        // Save to cache
        Analysis::updateOrCreate(
            ['event_id' => $eventId, 'country_code' => $countryCode],
            [
                'pro_gov_summary' => $result['proGovSummary'],
                'opposition_summary' => $result['oppositionSummary'],
                'consensus' => $result['consensus'],
                'pro_gov_sources' => array_column($proGovArticles, 'source'),
                'opposition_sources' => array_column($oppositionArticles, 'source'),
                'propaganda_scores' => $result['propagandaScores'] ?? null,
                'word_frequencies' => $result['wordFrequencies'] ?? [],
                'expires_at' => now()->addHours(24),
            ]
        );

        return response()->json([
            'event_id' => $eventId,
            'country_code' => $countryCode,
            'country_name' => $countryMeta['name'],
            'pro_gov_summary' => $result['proGovSummary'],
            'opposition_summary' => $result['oppositionSummary'],
            'consensus' => $result['consensus'],
            'pro_gov_sources' => array_column($proGovArticles, 'source'),
            'opposition_sources' => array_column($oppositionArticles, 'source'),
            'propaganda_scores' => $result['propagandaScores'] ?? null,
            'word_frequencies' => $result['wordFrequencies'] ?? [],
            'cached' => false,
            'created_at' => now()->toISOString(),
        ]);
    }
}
