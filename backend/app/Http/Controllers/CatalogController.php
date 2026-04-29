<?php

namespace App\Http\Controllers;

use App\Models\Catalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Plan limitleri: [max_catalogs, max_events_per_catalog]
// -1 = sınırsız

class CatalogController extends Controller
{
    private const PLAN_LIMITS = [
        'free'     => ['catalogs' => 1,  'events' => 10],
        'standart' => ['catalogs' => 10, 'events' => -1],
        'pro'      => ['catalogs' => -1, 'events' => -1],
    ];

    private function planLimits($user): array
    {
        return self::PLAN_LIMITS[$user->plan ?? 'free'] ?? self::PLAN_LIMITS['free'];
    }
    /**
     * GET /api/catalogs — kullanicinin kataloglari (event sayisi ile)
     */
    public function index(Request $request): JsonResponse
    {
        $catalogs = Catalog::where('user_id', $request->user()->id)
            ->withCount('events')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($c) => [
                'id'          => $c->id,
                'name'        => $c->name,
                'description' => $c->description,
                'is_public'   => $c->is_public,
                'event_count' => $c->events_count,
                'created_at'  => $c->created_at->toIso8601String(),
            ]);

        return response()->json($catalogs);
    }

    /**
     * POST /api/catalogs — yeni katalog olustur
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
        ]);

        $user   = $request->user();
        $limits = $this->planLimits($user);

        if ($limits['catalogs'] !== -1) {
            $count = Catalog::where('user_id', $user->id)->count();
            if ($count >= $limits['catalogs']) {
                return response()->json([
                    'error'    => "Plan limitinize ulaştınız. {$limits['catalogs']} katalog oluşturabilirsiniz.",
                    'code'     => 'catalog_limit',
                    'limit'    => $limits['catalogs'],
                    'required' => $user->plan === 'free' ? 'standart' : 'pro',
                ], 403);
            }
        }

        $catalog = Catalog::create([
            'user_id'     => $user->id,
            'name'        => $request->name,
            'description' => $request->description,
        ]);

        return response()->json([
            'id'          => $catalog->id,
            'name'        => $catalog->name,
            'description' => $catalog->description,
            'is_public'   => $catalog->is_public,
            'event_count' => 0,
            'created_at'  => $catalog->created_at->toIso8601String(),
        ], 201);
    }

    /**
     * PUT /api/catalogs/{id} — katalogu guncelle
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $catalog = Catalog::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $request->validate([
            'name'        => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:500',
            'is_public'   => 'sometimes|boolean',
        ]);

        $catalog->update($request->only(['name', 'description', 'is_public']));

        return response()->json([
            'id'          => $catalog->id,
            'name'        => $catalog->name,
            'description' => $catalog->description,
            'is_public'   => $catalog->is_public,
            'event_count' => $catalog->events()->count(),
            'created_at'  => $catalog->created_at->toIso8601String(),
        ]);
    }

    /**
     * DELETE /api/catalogs/{id} — katalogu sil (sadece sahibi)
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $catalog = Catalog::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $catalog->delete();

        return response()->json(['message' => 'Katalog silindi.']);
    }

    /**
     * POST /api/catalogs/{catalogId}/events/{eventId} — kataloğa haber ekle
     */
    public function addEvent(int $catalogId, int $eventId, Request $request): JsonResponse
    {
        $catalog = Catalog::where('id', $catalogId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($catalog->events()->where('event_id', $eventId)->exists()) {
            return response()->json(['message' => 'Haber zaten katalogda.'], 409);
        }

        $limits = $this->planLimits($request->user());
        if ($limits['events'] !== -1) {
            $eventCount = $catalog->events()->count();
            if ($eventCount >= $limits['events']) {
                return response()->json([
                    'error'    => "Bu katalog en fazla {$limits['events']} haber içerebilir.",
                    'code'     => 'event_limit',
                    'limit'    => $limits['events'],
                    'required' => 'standart',
                ], 403);
            }
        }

        $catalog->events()->attach($eventId);

        return response()->json(['message' => 'Haber kataloğa eklendi.'], 201);
    }

    /**
     * DELETE /api/catalogs/{catalogId}/events/{eventId} — katalogdan haber cikar
     */
    public function removeEvent(int $catalogId, int $eventId, Request $request): JsonResponse
    {
        $catalog = Catalog::where('id', $catalogId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $catalog->events()->detach($eventId);

        return response()->json(['message' => 'Haber katalogdan cikarildi.']);
    }

    /**
     * GET /api/catalogs/{catalogId}/events — katalogdaki haberleri listele
     */
    public function events(int $catalogId, Request $request): JsonResponse
    {
        $catalog = Catalog::where('id', $catalogId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $events = $catalog->events()
            ->orderByPivot('added_at', 'desc')
            ->get()
            ->map(fn ($e) => [
                'id'               => $e->id,
                'title_tr'         => $e->title_tr,
                'summary_tr'       => $e->summary_tr,
                'category'         => $e->category,
                'importance_score' => $e->importance_score,
                'created_at'       => $e->created_at->toIso8601String(),
                'added_at'         => $e->pivot->added_at,
            ]);

        return response()->json([
            'catalog' => [
                'id'   => $catalog->id,
                'name' => $catalog->name,
            ],
            'events' => $events,
        ]);
    }

    /**
     * GET /api/events/{eventId}/catalogs — bu haberin hangi kataloglarda oldugu (current user icin)
     */
    public function userCatalogs(int $eventId, Request $request): JsonResponse
    {
        $catalogIds = Catalog::where('user_id', $request->user()->id)
            ->whereHas('events', fn ($q) => $q->where('event_id', $eventId))
            ->pluck('id');

        return response()->json(['catalog_ids' => $catalogIds]);
    }
}
