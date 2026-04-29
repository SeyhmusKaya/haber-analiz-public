<?php
namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class TensionController extends Controller
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

    public function index(): JsonResponse
    {
        $formatted = Cache::remember('tensions_index', 21600, function () {
            $tensions = DB::table('geopolitical_tensions')
                ->whereRaw("calculated_at >= NOW() - INTERVAL '7 days'")
                ->where('tension_score', '>', 0)
                ->orderBy('tension_score', 'desc')
                ->get();

            if ($tensions->isEmpty()) {
                $tensions = collect($this->defaultTensions());
            }

            return $tensions->map(function ($t) {
                $metaA = self::COUNTRIES[$t->country_a] ?? ['name' => $t->country_a, 'flag' => ''];
                $metaB = self::COUNTRIES[$t->country_b] ?? ['name' => $t->country_b, 'flag' => ''];
                return [
                    'country_a'      => $t->country_a,
                    'country_b'      => $t->country_b,
                    'country_a_name' => $metaA['name'],
                    'country_b_name' => $metaB['name'],
                    'country_a_flag' => $metaA['flag'],
                    'country_b_flag' => $metaB['flag'],
                    'tension_score'  => round((float)$t->tension_score, 1),
                    'article_count'  => $t->article_count ?? 0,
                    'calculated_at'  => $t->calculated_at ?? null,
                ];
            });
        });

        return response()->json(['tensions' => $formatted]);
    }

    public function between(string $a, string $b): JsonResponse
    {
        $a = strtoupper($a);
        $b = strtoupper($b);

        $trend = DB::table('geopolitical_tensions')
            ->where(function ($q) use ($a, $b) {
                $q->where('country_a', $a)->where('country_b', $b);
            })
            ->orWhere(function ($q) use ($a, $b) {
                $q->where('country_a', $b)->where('country_b', $a);
            })
            ->orderBy('calculated_at', 'desc')
            ->limit(30)
            ->get()
            ->map(fn($t) => [
                'tension_score' => round((float)$t->tension_score, 1),
                'calculated_at' => $t->calculated_at,
            ]);

        return response()->json(['trend' => $trend]);
    }

    public function top(): JsonResponse
    {
        $top = DB::table('geopolitical_tensions')
            ->whereRaw("calculated_at >= NOW() - INTERVAL '7 days'")
            ->orderBy('tension_score', 'desc')
            ->limit(5)
            ->get();

        if ($top->isEmpty()) {
            $top = collect(array_slice($this->defaultTensions(), 0, 5));
        }

        $formatted = $top->map(function ($t) {
            $metaA = self::COUNTRIES[$t->country_a] ?? ['name' => $t->country_a, 'flag' => ''];
            $metaB = self::COUNTRIES[$t->country_b] ?? ['name' => $t->country_b, 'flag' => ''];
            return [
                'country_a' => $t->country_a, 'country_b' => $t->country_b,
                'country_a_name' => $metaA['name'], 'country_b_name' => $metaB['name'],
                'country_a_flag' => $metaA['flag'], 'country_b_flag' => $metaB['flag'],
                'tension_score' => round((float)$t->tension_score, 1),
            ];
        });

        return response()->json(['top' => $formatted]);
    }

    // Ülke başına başlık/özette aranacak Türkçe anahtar kelimeler
    private const COUNTRY_KEYWORDS = [
        'TR' => ['türkiye', 'türk', 'ankara', 'erdoğan'],
        'US' => ['abd', 'amerikan', 'trump', 'washington', 'pentagon'],
        'RU' => ['rusya', 'rus', 'putin', 'moskova', 'kremlin'],
        'GB' => ['ingiltere', 'ingiliz', 'londra', 'britanya'],
        'DE' => ['almanya', 'alman', 'berlin'],
        'CN' => ['çin', 'çinli', 'pekin'],
        'IR' => ['iran', 'tahran'],
        'IL' => ['israil', 'tel aviv'],
        'SA' => ['suudi', 'riyad', 'neom'],
        'EG' => ['mısır', 'kahire'],
    ];

    public function articles(string $a, string $b): JsonResponse
    {
        $a = strtoupper($a);
        $b = strtoupper($b);

        $cacheKey = "tension_articles_v5_{$a}_{$b}";

        $events = Cache::remember($cacheKey, 3600, function () use ($a, $b) {
            // Öncelik 1: related_countries ile eşleşenler (Gemini sınıflandırması)
            $rcEvents = DB::table('events')
                ->where('status', 'ready')
                ->whereNotNull('related_countries')
                ->where('created_at', '>=', now()->subDays(30))
                ->whereRaw("related_countries::text LIKE ?", ['%"' . $a . '"%'])
                ->whereRaw("related_countries::text LIKE ?", ['%"' . $b . '"%'])
                ->orderByDesc('importance_score')
                ->orderByDesc('created_at')
                ->limit(20)
                ->select(
                    'id', 'title_tr', 'summary_tr', 'category', 'importance_score', 'created_at',
                    DB::raw("(SELECT ar.image_url FROM event_articles ea JOIN articles ar ON ar.id = ea.article_id WHERE ea.event_id = events.id AND ar.image_url IS NOT NULL LIMIT 1) as image_url")
                )
                ->get();

            // Henüz sınıflandırılmamış event'ler için keyword fallback
            if ($rcEvents->count() < 5) {
                $keywordsA = self::COUNTRY_KEYWORDS[$a] ?? [];
                $keywordsB = self::COUNTRY_KEYWORDS[$b] ?? [];

                $existingIds = $rcEvents->pluck('id')->toArray();

                $fallbackQuery = DB::table('events')
                    ->where('status', 'ready')
                    ->whereNull('related_countries')
                    ->where('created_at', '>=', now()->subDays(30));

                if (!empty($existingIds)) {
                    $fallbackQuery->whereNotIn('id', $existingIds);
                }

                // Her iki ülkenin de keyword'ü geçmeli
                if (!empty($keywordsA)) {
                    $fallbackQuery->where(function ($q) use ($keywordsA) {
                        foreach ($keywordsA as $kw) {
                            $q->orWhereRaw('LOWER(title_tr) LIKE ?', ['%' . $kw . '%'])
                              ->orWhereRaw('LOWER(COALESCE(summary_tr, \'\')) LIKE ?', ['%' . $kw . '%']);
                        }
                    });
                }
                if (!empty($keywordsB)) {
                    $fallbackQuery->where(function ($q) use ($keywordsB) {
                        foreach ($keywordsB as $kw) {
                            $q->orWhereRaw('LOWER(title_tr) LIKE ?', ['%' . $kw . '%'])
                              ->orWhereRaw('LOWER(COALESCE(summary_tr, \'\')) LIKE ?', ['%' . $kw . '%']);
                        }
                    });
                }

                $fallbackEvents = $fallbackQuery
                    ->orderByDesc('importance_score')
                    ->orderByDesc('created_at')
                    ->limit(20 - $rcEvents->count())
                    ->select(
                        'id', 'title_tr', 'summary_tr', 'category', 'importance_score', 'created_at',
                        DB::raw("(SELECT ar.image_url FROM event_articles ea JOIN articles ar ON ar.id = ea.article_id WHERE ea.event_id = events.id AND ar.image_url IS NOT NULL LIMIT 1) as image_url")
                    )
                    ->get();

                $rcEvents = $rcEvents->concat($fallbackEvents);
            }

            return $rcEvents->map(fn($e) => [
                'id'               => $e->id,
                'title_tr'         => $e->title_tr,
                'summary_tr'       => $e->summary_tr,
                'category'         => $e->category,
                'importance_score' => $e->importance_score,
                'created_at'       => $e->created_at,
                'image_url'        => $e->image_url ?? null,
            ]);
        });

        return response()->json([
            'country_a' => array_merge(['code' => $a], self::COUNTRIES[$a] ?? ['name' => $a, 'flag' => '']),
            'country_b' => array_merge(['code' => $b], self::COUNTRIES[$b] ?? ['name' => $b, 'flag' => '']),
            'events'    => $events,
        ]);
    }

    private function defaultTensions(): array
    {
        $data = [
            ['country_a' => 'US', 'country_b' => 'RU', 'tension_score' => 8.2, 'article_count' => 0],
            ['country_a' => 'US', 'country_b' => 'CN', 'tension_score' => 7.8, 'article_count' => 0],
            ['country_a' => 'IR', 'country_b' => 'IL', 'tension_score' => 7.5, 'article_count' => 0],
            ['country_a' => 'RU', 'country_b' => 'GB', 'tension_score' => 7.1, 'article_count' => 0],
            ['country_a' => 'US', 'country_b' => 'IR', 'tension_score' => 6.8, 'article_count' => 0],
            ['country_a' => 'TR', 'country_b' => 'IL', 'tension_score' => 5.5, 'article_count' => 0],
            ['country_a' => 'SA', 'country_b' => 'IR', 'tension_score' => 5.0, 'article_count' => 0],
            ['country_a' => 'CN', 'country_b' => 'GB', 'tension_score' => 4.5, 'article_count' => 0],
            ['country_a' => 'TR', 'country_b' => 'DE', 'tension_score' => 3.0, 'article_count' => 0],
            ['country_a' => 'EG', 'country_b' => 'TR', 'tension_score' => 2.5, 'article_count' => 0],
        ];
        // stdClass array for consistency
        return array_map(fn($d) => (object)array_merge($d, ['calculated_at' => null]), $data);
    }
}
