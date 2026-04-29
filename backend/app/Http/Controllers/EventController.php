<?php
namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class EventController extends Controller
{
    /**
     * Makale koleksiyonundan en iyi resim + video URL çiftini seçer.
     *
     * Öncelik sırası:
     *   1. TR kaynak → video
     *   2. TR kaynak → resim
     *   3. Diğer kaynak → video
     *   4. Diğer kaynak → resim
     *
     * @return array{image_url: ?string, video_url: ?string}
     */
    private function pickBestMedia($articles): array
    {
        $trArticles    = $articles->filter(fn($a) => ($a->source?->country_code ?? '') === 'TR');
        $otherArticles = $articles->filter(fn($a) => ($a->source?->country_code ?? '') !== 'TR');

        // 1. TR kaynakta video var mı?
        $trWithVideo = $trArticles->filter(fn($a) => !empty($a->video_url))->first();
        if ($trWithVideo) {
            return [
                'video_url' => $trWithVideo->video_url,
                'image_url' => $trWithVideo->image_url
                    ?: $this->pickBestImageFromCollection($trArticles)
                    ?: $this->pickBestImageFromCollection($otherArticles),
            ];
        }

        // 2. TR kaynakta resim var mı?
        $trImage = $this->pickBestImageFromCollection($trArticles);
        if ($trImage) {
            // Diğer kaynaklarda video var mı? Varsa onu da ekle ama TR resmi göster
            $otherVideo = $otherArticles->filter(fn($a) => !empty($a->video_url))->first();
            return [
                'image_url' => $trImage,
                'video_url' => $otherVideo?->video_url ?? null,
            ];
        }

        // 3. Diğer kaynaklarda video var mı?
        $otherWithVideo = $otherArticles->filter(fn($a) => !empty($a->video_url))->first();
        if ($otherWithVideo) {
            return [
                'video_url' => $otherWithVideo->video_url,
                'image_url' => $otherWithVideo->image_url
                    ?: $this->pickBestImageFromCollection($otherArticles),
            ];
        }

        // 4. Diğer kaynaklarda resim
        return ['image_url' => $this->pickBestImageFromCollection($otherArticles), 'video_url' => null];
    }

    private function pickBestImageFromCollection($articles): ?string
    {
        return $articles
            ->filter(function ($a) {
                if (empty($a->image_url)) return false;
                $url   = $a->image_url;
                $path  = strtolower(parse_url($url, PHP_URL_PATH) ?? '');
                $query = parse_url($url, PHP_URL_QUERY) ?? '';

                if (preg_match('#/0/0\.\w+$#i', $url)) return false;
                if (str_contains($url, '/0x0/')) return false;
                if (str_contains($path, '/thumbnail')) return false;
                if (preg_match('#/Img_\d+_\d+/(\d+)/#', $url, $m) && (int)$m[1] <= 300) return false;
                if (preg_match('/(?:^|&)width=(\d+)/i', $query, $m) && (int)$m[1] <= 300) return false;
                if (preg_match('#-0-image-[a-z]+-\d+_\d+\.jpg$#i', $path)) return false;

                $filename = basename($path);
                if (preg_match('/^(default|placeholder|no.?image|blank)\.\w+$/', $filename)) return false;
                if (preg_match('/logo/', $filename)) return false;

                return true;
            })
            ->sortByDesc(fn($a) => strlen($a->image_url))
            ->first()?->image_url;
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

    public function index(Request $request): JsonResponse
    {
        $params = $request->only(['page','category','country','search','sort','tr_bias','show_all','date_from','date_to']);
        $cacheKey = 'events_list_' . md5(json_encode($params));

        $result = Cache::remember($cacheKey, 300, function () use ($request) {
            return $this->buildEventsList($request);
        });

        return response()->json($result);
    }

    private function buildEventsList(Request $request): array
    {
        $perPage = 20;
        $page    = max(1, (int)$request->input('page', 1));

        // Tüm koşulları ID seviyesinde çalıştır (correlated subquery yok)
        $idQuery = \Illuminate\Support\Facades\DB::table('events')
            ->join('event_articles as ea', 'ea.event_id', '=', 'events.id')
            ->join('articles as a', 'a.id', '=', 'ea.article_id')
            ->join('sources as s', 's.id', '=', 'a.source_id')
            ->whereNotNull('events.title_tr')
            ->select(
                'events.id',
                \Illuminate\Support\Facades\DB::raw('MIN(a.published_at) as first_published_at'),
                \Illuminate\Support\Facades\DB::raw('COUNT(DISTINCT s.country_code) as country_count'),
                \Illuminate\Support\Facades\DB::raw('MAX(CASE WHEN s.country_code = \'TR\' AND s.bias = \'pro_gov\' THEN 1 ELSE 0 END) as has_tr_progov'),
                \Illuminate\Support\Facades\DB::raw('MAX(CASE WHEN s.country_code = \'TR\' AND s.bias = \'opposition\' THEN 1 ELSE 0 END) as has_tr_opp'),
                \Illuminate\Support\Facades\DB::raw('MAX(CASE WHEN s.country_code != \'TR\' THEN 1 ELSE 0 END) as has_non_tr')
            )
            ->groupBy('events.id');

        // Kategori filtresi
        if ($request->category && $request->category !== 'tumu') {
            if ($request->category === 'gundem') {
                // Gündem: son 3 gün, önem sırasına göre
                $idQuery->where('events.created_at', '>=', now()->subDays(3));
            } else {
                $cats = explode(',', $request->category);
                $idQuery->whereIn('events.category', $cats);
            }
        }

        // Arama
        if ($request->search) {
            $like = str_replace(['*', '?'], ['%', '_'], $request->search);
            $idQuery->where(function ($q) use ($like) {
                $q->where('events.title_tr', 'LIKE', "%{$like}%")
                  ->orWhere('events.summary_tr', 'LIKE', "%{$like}%");
            });
        }

        // Ülke filtresi
        if ($request->country) {
            $countries = explode(',', $request->country);
            $idQuery->whereIn('s.country_code', $countries);

            // TR filtresi: sadece Türkiye ile ilgili haberleri göster
            if (in_array('TR', $countries) && count($countries) === 1) {
                $idQuery->where(function ($q) {
                    $q->where('events.is_turkey_related', true)
                      ->orWhereNull('events.is_turkey_related');
                });
            }
        }

        // Tarih filtresi
        if ($request->date_from) {
            $idQuery->where('events.created_at', '>=', $request->date_from . ' 00:00:00');
        }
        if ($request->date_to) {
            $idQuery->where('events.created_at', '<=', $request->date_to . ' 23:59:59');
        }

        // TR kutuplaşma / ülke filtresi (HAVING üzerinden)
        if ($request->tr_bias) {
            $idQuery->havingRaw('MAX(CASE WHEN s.country_code = ? AND s.bias = ? THEN 1 ELSE 0 END) = 1', ['TR', 'pro_gov'])
                    ->havingRaw('MAX(CASE WHEN s.country_code = ? AND s.bias = ? THEN 1 ELSE 0 END) = 1', ['TR', 'opposition'])
                    ->havingRaw('MAX(CASE WHEN s.country_code != ? THEN 1 ELSE 0 END) = 0', ['TR']);
            // Kutuplaşmalar: sadece Türkiye ile ilgili haberleri göster
            $idQuery->where(function ($q) {
                $q->where('events.is_turkey_related', true)
                  ->orWhereNull('events.is_turkey_related');
            });
        } elseif (!$request->show_all) {
            $idQuery->havingRaw('COUNT(DISTINCT s.country_code) >= 2');
        }

        // Sıralama
        if ($request->category === 'gundem') {
            // Gündem: makale yayın tarihine göre en yeniden en eskiye
            $idQuery->orderByRaw('MIN(a.published_at) DESC NULLS LAST');
        } elseif ($request->sort === 'importance') {
            $idQuery->orderByRaw("MAX(events.importance_score + CASE WHEN events.category IN ('savas-catisma','siyaset') THEN 2 ELSE 0 END) DESC")
                    ->orderByRaw('MIN(a.published_at) DESC NULLS LAST');
        } elseif ($request->sort === 'oldest') {
            $idQuery->orderByRaw('MIN(a.published_at) ASC NULLS LAST');
        } else {
            $idQuery->orderByRaw('MIN(a.published_at) DESC NULLS LAST');
        }

        // Önce total sayısını al (subquery)
        $totalResult = \Illuminate\Support\Facades\DB::table(
            \Illuminate\Support\Facades\DB::raw("({$idQuery->toSql()}) as sub")
        )->mergeBindings($idQuery)->count();

        // Sayfalama için ID listesi al
        $rows = (clone $idQuery)->skip(($page - 1) * $perPage)->take($perPage)->get();
        $ids  = $rows->pluck('id')->toArray();

        if (empty($ids)) {
            return ['events' => [], 'total' => $totalResult, 'page' => $page, 'per_page' => $perPage];
        }

        // Sadece bu 20 event için articles+source yükle
        $events = Event::with(['articles.source'])
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        // firstPublishedAt bilgisini rows'tan al
        $firstPublished = $rows->keyBy('id');

        $data = collect($ids)->map(function ($id) use ($events, $firstPublished) {
            $event = $events[$id] ?? null;
            if (!$event) return null;

            $row          = $firstPublished[$id];
            $hasTrBias    = $row->has_tr_progov && $row->has_tr_opp;
            $media        = $this->pickBestMedia($event->articles);
            $countryCodes = $event->articles->pluck('source.country_code')->unique()->values()->toArray();

            return [
                'id'              => $event->id,
                'title_tr'        => $event->title_tr,
                'summary_tr'      => $event->summary_tr,
                'category'        => $event->category,
                'importance_score'=> $event->importance_score,
                'article_count'   => $event->articles->count(),
                'country_codes'   => $countryCodes,
                'has_tr_bias'     => $hasTrBias,
                'image_url'       => $media['image_url'],
                'video_url'       => $media['video_url'],
                'published_at'    => $row->first_published_at,
                'created_at'      => $event->created_at->toISOString(),
            ];
        })->filter()->values();

        $data = $this->deduplicateByTitle($data);

        return ['events' => $data, 'total' => $totalResult, 'page' => $page, 'per_page' => $perPage];
    }

    public function popular(): JsonResponse
    {
        $data = Cache::remember('events_popular', 300, function () {
            $ids = \Illuminate\Support\Facades\DB::table('events as e')
                ->join('event_articles as ea', 'ea.event_id', '=', 'e.id')
                ->join('articles as a', 'a.id', '=', 'ea.article_id')
                ->join('sources as s', 's.id', '=', 'a.source_id')
                ->whereNotNull('e.title_tr')
                ->select('e.id')
                ->groupBy('e.id')
                ->havingRaw('COUNT(DISTINCT s.country_code) >= 2')
                ->orderByRaw("MAX(e.importance_score + CASE WHEN e.category IN ('savas-catisma','siyaset') THEN 2 ELSE 0 END) DESC")
                ->orderByRaw('MAX(e.created_at) DESC')
                ->take(10)
                ->pluck('e.id')->toArray();

            $events = Event::with(['articles.source'])->whereIn('id', $ids)->get()->keyBy('id');

            return collect($ids)->map(function ($id) use ($events) {
                $event = $events[$id] ?? null;
                if (!$event) return null;
                $media = $this->pickBestMedia($event->articles);
                return [
                    'id'               => $event->id,
                    'title_tr'         => $event->title_tr,
                    'summary_tr'       => $event->summary_tr,
                    'category'         => $event->category,
                    'importance_score' => $event->importance_score,
                    'article_count'    => $event->articles->count(),
                    'country_codes'    => $event->articles->pluck('source.country_code')->unique()->values()->toArray(),
                    'image_url'        => $media['image_url'],
                    'video_url'        => $media['video_url'],
                    'published_at'     => $event->articles->min('published_at'),
                    'created_at'       => $event->created_at->toISOString(),
                ];
            })->filter()->values();
        });

        return response()->json(['events' => $data]);
    }

    public function turkiyeGundem(): JsonResponse
    {
        $data = Cache::remember('events_turkiye_gundem_v4', 300, function () {
            // Keyword fallback: Gemini sınıflandırması henüz yapılmamış eventler için
            $trKeywords = [
                'türkiye', 'türk', 'ankara', 'erdoğan', 'istanbul', 'izmir', 'tbmm',
                'cumhurbaşkan', 'meclis',
            ];
            $keywordConditions = implode(' OR ', array_fill(0, count($trKeywords), 'LOWER(e.title_tr) LIKE ?'));
            $keywordParams = array_map(fn($k) => "%{$k}%", $trKeywords);

            $ids = \Illuminate\Support\Facades\DB::table('events as e')
                ->join('event_articles as ea', 'ea.event_id', '=', 'e.id')
                ->join('articles as a', 'a.id', '=', 'ea.article_id')
                ->join('sources as s', 's.id', '=', 'a.source_id')
                ->whereNotNull('e.title_tr')
                ->where('e.created_at', '>=', now()->subDays(3))
                ->where(function ($q) use ($keywordConditions, $keywordParams) {
                    // Gemini sınıflandırması varsa onu kullan, yoksa keyword fallback
                    $q->where('e.is_turkey_related', true)
                      ->orWhere(function ($q2) use ($keywordConditions, $keywordParams) {
                          $q2->whereNull('e.is_turkey_related')
                             ->whereRaw("({$keywordConditions})", $keywordParams);
                      });
                })
                ->select('e.id')
                ->groupBy('e.id')
                ->havingRaw('SUM(CASE WHEN s.country_code = ? THEN 1 ELSE 0 END) >= 1', ['TR'])
                ->orderByRaw('MAX(a.published_at) DESC NULLS LAST')
                ->take(15)
                ->pluck('e.id')->toArray();

            $events = Event::with(['articles.source'])->whereIn('id', $ids)->get()->keyBy('id');

            $result = collect($ids)->map(function ($id) use ($events) {
                $event = $events[$id] ?? null;
                if (!$event) return null;
                $media = $this->pickBestMedia($event->articles);
                return [
                    'id'               => $event->id,
                    'title_tr'         => $event->title_tr,
                    'summary_tr'       => $event->summary_tr,
                    'category'         => $event->category,
                    'importance_score' => $event->importance_score,
                    'article_count'    => $event->articles->count(),
                    'country_codes'    => $event->articles->pluck('source.country_code')->unique()->values()->toArray(),
                    'image_url'        => $media['image_url'],
                    'video_url'        => $media['video_url'],
                    'published_at'     => $event->articles->min('published_at'),
                    'created_at'       => $event->created_at->toISOString(),
                ];
            })->filter()->values();

            return $this->deduplicateByTitle($result);
        });

        return response()->json(['events' => $data]);
    }

    public function turkiyeKutuplasma(): JsonResponse
    {
        $data = Cache::remember('events_turkiye_kutuplasma', 300, function () {
            $ids = \Illuminate\Support\Facades\DB::table('events as e')
                ->join('event_articles as ea', 'ea.event_id', '=', 'e.id')
                ->join('articles as a', 'a.id', '=', 'ea.article_id')
                ->join('sources as s', 's.id', '=', 'a.source_id')
                ->whereNotNull('e.title_tr')
                ->where('e.created_at', '>=', now()->subDays(7))
                ->where(function ($q) {
                    $q->where('e.is_turkey_related', true)
                      ->orWhereNull('e.is_turkey_related');
                })
                ->select('e.id')
                ->groupBy('e.id')
                ->havingRaw('MAX(CASE WHEN s.country_code = ? AND s.bias = ? THEN 1 ELSE 0 END) = 1', ['TR', 'pro_gov'])
                ->havingRaw('MAX(CASE WHEN s.country_code = ? AND s.bias = ? THEN 1 ELSE 0 END) = 1', ['TR', 'opposition'])
                ->havingRaw('MAX(CASE WHEN s.country_code != ? THEN 1 ELSE 0 END) = 0', ['TR'])
                ->orderByRaw('MAX(a.published_at) DESC NULLS LAST')
                ->take(15)
                ->pluck('e.id')->toArray();

            $events = Event::with(['articles.source'])->whereIn('id', $ids)->get()->keyBy('id');

            $result = collect($ids)->map(function ($id) use ($events) {
                $event = $events[$id] ?? null;
                if (!$event) return null;
                $media = $this->pickBestMedia($event->articles);
                return [
                    'id'               => $event->id,
                    'title_tr'         => $event->title_tr,
                    'summary_tr'       => $event->summary_tr,
                    'category'         => $event->category,
                    'importance_score' => $event->importance_score,
                    'article_count'    => $event->articles->count(),
                    'country_codes'    => $event->articles->pluck('source.country_code')->unique()->values()->toArray(),
                    'image_url'        => $media['image_url'],
                    'video_url'        => $media['video_url'],
                    'published_at'     => $event->articles->min('published_at'),
                    'created_at'       => $event->created_at->toISOString(),
                ];
            })->filter()->values();

            return $this->deduplicateByTitle($result);
        });

        return response()->json(['events' => $data]);
    }

    public function gundem(): JsonResponse
    {
        $data = Cache::remember('events_gundem', 600, function () {
            $ids = \Illuminate\Support\Facades\DB::table('events as e')
                ->join('event_articles as ea', 'ea.event_id', '=', 'e.id')
                ->join('articles as a', 'a.id', '=', 'ea.article_id')
                ->join('sources as s', 's.id', '=', 'a.source_id')
                ->whereNotNull('e.title_tr')
                ->where('e.created_at', '>=', now()->subDays(3))
                ->select('e.id')
                ->groupBy('e.id')
                ->havingRaw('COUNT(DISTINCT s.country_code) >= 2')
                ->orderByRaw('MAX(a.published_at) DESC NULLS LAST')
                ->take(15)
                ->pluck('e.id')->toArray();

            $events = Event::with(['articles.source'])->whereIn('id', $ids)->get()->keyBy('id');

            $result = collect($ids)->map(function ($id) use ($events) {
                $event = $events[$id] ?? null;
                if (!$event) return null;
                $media = $this->pickBestMedia($event->articles);
                return [
                    'id'               => $event->id,
                    'title_tr'         => $event->title_tr,
                    'summary_tr'       => $event->summary_tr,
                    'category'         => $event->category,
                    'importance_score' => $event->importance_score,
                    'article_count'    => $event->articles->count(),
                    'country_codes'    => $event->articles->pluck('source.country_code')->unique()->values()->toArray(),
                    'image_url'        => $media['image_url'],
                    'video_url'        => $media['video_url'],
                    'published_at'     => $event->articles->min('published_at'),
                    'created_at'       => $event->created_at->toISOString(),
                ];
            })->filter()->values();

            return $this->deduplicateByTitle($result);
        });

        return response()->json(['events' => $data]);
    }

    public function mostRead(): JsonResponse
    {
        $data = Cache::remember('events_most_read', 300, function () {
            $events = Event::with(['articles.source'])
                ->whereNotNull('title_tr')
                ->where('view_count', '>', 0)
                ->orderByDesc('view_count')
                ->take(12)
                ->get();

            return $events->map(function ($event) {
                $media = $this->pickBestMedia($event->articles);
                return [
                    'id'               => $event->id,
                    'title_tr'         => $event->title_tr,
                    'summary_tr'       => $event->summary_tr,
                    'category'         => $event->category,
                    'importance_score' => $event->importance_score,
                    'article_count'    => $event->articles->count(),
                    'country_codes'    => $event->articles->pluck('source.country_code')->unique()->values()->toArray(),
                    'image_url'        => $media['image_url'],
                    'video_url'        => $media['video_url'],
                    'view_count'       => $event->view_count,
                    'published_at'     => $event->articles->min('published_at'),
                    'created_at'       => $event->created_at->toISOString(),
                ];
            })->values();
        });

        return response()->json(['events' => $data]);
    }

    public function slider(): JsonResponse
    {
        $data = Cache::remember('events_slider', 300, function () {
            $ids = \Illuminate\Support\Facades\DB::table('events as e')
                ->join('event_articles as ea', 'ea.event_id', '=', 'e.id')
                ->join('articles as a', 'a.id', '=', 'ea.article_id')
                ->join('sources as s', 's.id', '=', 'a.source_id')
                ->whereNotNull('e.title_tr')
                ->where('e.created_at', '>=', now()->subDays(3))
                ->select('e.id')
                ->groupBy('e.id')
                ->havingRaw('COUNT(DISTINCT s.country_code) >= 2')
                ->orderByRaw("MAX(e.importance_score + CASE WHEN e.category IN ('savas-catisma','siyaset') THEN 2 ELSE 0 END) DESC")
                ->orderByRaw('MAX(e.created_at) DESC')
                ->take(30)
                ->pluck('e.id')->toArray();

            $events = Event::with(['articles.source'])->whereIn('id', $ids)->get()->keyBy('id');

            return collect($ids)->map(function ($id) use ($events) {
                $event = $events[$id] ?? null;
                if (!$event) return null;
                $media = $this->pickBestMedia($event->articles);
                return [
                    'id'               => $event->id,
                    'title_tr'         => $event->title_tr,
                    'summary_tr'       => $event->summary_tr,
                    'category'         => $event->category,
                    'importance_score' => $event->importance_score,
                    'article_count'    => $event->articles->count(),
                    'image_url'        => $media['image_url'],
                    'video_url'        => $media['video_url'],
                    'published_at'     => $event->articles->min('published_at'),
                    'created_at'       => $event->created_at->toISOString(),
                ];
            })->filter(fn($e) => $e && !empty($e['image_url']))->values();
        });

        return response()->json(['events' => $data]);
    }

    public function stats(): JsonResponse
    {
        $result = Cache::remember('events_stats', 600, function () {
            $today = now()->startOfDay();

            $countryCounts = \Illuminate\Support\Facades\DB::table('event_articles')
                ->join('articles', 'event_articles.article_id', '=', 'articles.id')
                ->join('sources', 'articles.source_id', '=', 'sources.id')
                ->select('sources.country_code', \Illuminate\Support\Facades\DB::raw('COUNT(DISTINCT event_articles.event_id) as event_count'))
                ->groupBy('sources.country_code')
                ->pluck('event_count', 'country_code');

            $countryStats = [];
            foreach ($this->COUNTRIES as $code => $meta) {
                $countryStats[] = [
                    'code'  => $code,
                    'name'  => $meta['name'],
                    'flag'  => $meta['flag'],
                    'count' => $countryCounts[$code] ?? 0,
                ];
            }

            return [
                'total_events'    => Event::count(),
                'today_events'    => Event::where('created_at', '>=', $today)->count(),
                'total_sources'   => \App\Models\Source::where('is_active', true)->count(),
                'total_countries' => \App\Models\Source::where('is_active', true)->distinct('country_code')->count('country_code'),
                'total_articles'  => \App\Models\Article::count(),
                'country_stats'   => $countryStats,
            ];
        });

        return response()->json($result);
    }

    public function related(int $id): JsonResponse
    {
        $data = Cache::remember("event_related_{$id}", 600, function () use ($id) {
            $event = Event::find($id);
            if (!$event) return [];

            $related = Event::with(['articles.source'])
                ->where('id', '!=', $id)
                ->where('category', $event->category)
                ->orderBy('created_at', 'desc')
                ->take(6)
                ->get();

            if ($related->count() < 6) {
                $moreIds = $related->pluck('id')->push($id)->toArray();
                $more = Event::with(['articles.source'])
                    ->whereNotIn('id', $moreIds)
                    ->orderBy('importance_score', 'desc')
                    ->take(6 - $related->count())
                    ->get();
                $related = $related->concat($more);
            }

            return $related->map(function ($e) {
                $hasTrBias = $e->articles->contains(fn($a) => $a->source?->country_code === 'TR' && $a->source?->bias === 'pro_gov')
                          && $e->articles->contains(fn($a) => $a->source?->country_code === 'TR' && $a->source?->bias === 'opposition');
                $media = $this->pickBestMedia($e->articles);
                return [
                    'id'               => $e->id,
                    'title_tr'         => $e->title_tr,
                    'summary_tr'       => $e->summary_tr,
                    'category'         => $e->category,
                    'importance_score' => $e->importance_score,
                    'article_count'    => $e->articles->count(),
                    'country_codes'    => $e->articles->pluck('source.country_code')->unique()->values()->toArray(),
                    'has_tr_bias'      => $hasTrBias,
                    'image_url'        => $media['image_url'],
                    'video_url'        => $media['video_url'],
                    'published_at'     => $e->articles->min('published_at'),
                    'created_at'       => $e->created_at->toISOString(),
                ];
            })->values();
        });

        return response()->json(['events' => $data]);
    }

    /**
     * Başlık kelimelerini normalize edip anlamlı kelimeleri döndürür.
     */
    private function titleWords(string $title): array
    {
        $words = preg_split('/\s+/', preg_replace('/[^\p{L}\p{N}\s]/u', '', mb_strtolower($title)));
        return array_unique(array_values(array_filter($words, fn($w) => mb_strlen($w) > 3)));
    }

    /**
     * Başlık Jaccard benzerliğine göre duplicate event'leri filtreler.
     * Kelime sırası farklı olsa da %60+ ortak kelime varsa duplicate sayar.
     */
    private function deduplicateByTitle(iterable $events): \Illuminate\Support\Collection
    {
        $seenWordSets = [];
        return collect($events)->filter(function ($event) use (&$seenWordSets) {
            $words = $this->titleWords($event['title_tr'] ?? '');
            if (empty($words)) return true;

            foreach ($seenWordSets as $seenWords) {
                $intersection = count(array_intersect($words, $seenWords));
                $union        = count(array_unique(array_merge($words, $seenWords)));
                if ($union > 0 && ($intersection / $union) >= 0.6) {
                    return false; // %60+ benzerlik → duplicate
                }
            }

            $seenWordSets[] = $words;
            return true;
        })->values();
    }

    public function flagAi(Request $request, int $id): JsonResponse
    {
        $type        = $request->input('type', 'summary');
        $countryCode = $request->input('country_code');
        $reason      = $request->input('reason', '');
        $ip          = $request->ip();

        Log::info("AI flag report: event={$id} type={$type} country={$countryCode} reason={$reason} ip={$ip}");

        return response()->json(['success' => true]);
    }

    public function show(int $id): JsonResponse
    {
        $cached = Cache::remember("event_show_{$id}", 1800, function () use ($id) {
            $event = Event::with(['articles.source'])->find($id);
            if (!$event) return null;

            $countriesData = [];
            $byCountry = $event->articles->groupBy('source.country_code');
            foreach ($byCountry as $code => $articles) {
                $meta = $this->COUNTRIES[$code] ?? null;
                if (!$meta) continue;
                $countriesData[] = [
                    'code'          => $code,
                    'name'          => $meta['name'],
                    'flag'          => $meta['flag'],
                    'article_count' => $articles->count(),
                ];
            }
            usort($countriesData, fn($a, $b) => $b['article_count'] - $a['article_count']);

            $articlesList = $event->articles->map(fn($a) => [
                'id'             => $a->id,
                'title'          => $a->title,
                'url'            => $a->url,
                'source_name'    => $a->source?->name,
                'source_country' => $a->source?->country_code,
                'source_bias'    => $a->source?->bias,
                'published_at'   => $a->published_at?->toISOString(),
            ])->sortByDesc('published_at')->values()->toArray();

            $hasTrBias = $event->articles->contains(fn($a) => $a->source?->country_code === 'TR' && $a->source?->bias === 'pro_gov')
                      && $event->articles->contains(fn($a) => $a->source?->country_code === 'TR' && $a->source?->bias === 'opposition');
            $media = $this->pickBestMedia($event->articles);

            return [
                'id'                 => $event->id,
                'title_tr'           => $event->title_tr,
                'summary_tr'         => $event->summary_tr,
                'category'           => $event->category,
                'importance_score'   => $event->importance_score,
                'article_count'      => $event->articles->count(),
                'image_url'          => $media['image_url'],
                'video_url'          => $media['video_url'],
                'has_tr_bias'        => $hasTrBias,
                'available_countries'=> $countriesData,
                'articles'           => $articlesList,
                'ai_questions'       => $event->ai_questions,
                'published_at'       => $event->articles->min('published_at'),
                'created_at'         => $event->created_at->toISOString(),
                'updated_at'         => $event->updated_at?->toISOString(),
            ];
        });

        if (!$cached) return response()->json(['error' => 'Not found'], 404);
        return response()->json($cached);
    }
}
