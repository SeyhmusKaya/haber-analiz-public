<?php
namespace App\Http\Controllers;

use App\Models\Source;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminSourceController extends Controller
{
    /**
     * Tüm kaynakları listele (aktif + pasif), filtreleme + sayfalama destekli
     */
    public function index(Request $request): JsonResponse
    {
        $q = Source::query();

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $q->where(function ($qr) use ($search) {
                $qr->where('name', 'like', $search)
                   ->orWhere('rss_url', 'like', $search)
                   ->orWhere('site_url', 'like', $search);
            });
        }

        if ($request->filled('country')) {
            $q->where('country_code', $request->country);
        }

        if ($request->filled('bias')) {
            $q->where('bias', $request->bias);
        }

        if ($request->filled('active')) {
            $q->where('is_active', $request->active === '1' || $request->active === 'true');
        }

        $sources = $q->orderBy('country_code')
                     ->orderBy('bias')
                     ->orderByDesc('importance_score')
                     ->orderBy('name')
                     ->get()
                     ->map(function ($s) {
                         $s->article_count = DB::table('articles')->where('source_id', $s->id)->count();
                         return $s;
                     });

        return response()->json(['sources' => $sources]);
    }

    /**
     * Yeni kaynak oluştur
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'             => 'required|string|max:100',
            'rss_url'          => 'required|url|max:255',
            'site_url'         => 'nullable|url|max:500',
            'country_code'     => 'required|string|size:2',
            'bias'             => 'required|in:pro_gov,opposition',
            'language'         => 'required|string|max:10',
            'importance_score' => 'required|integer|min:0|max:10',
            'owner'            => 'nullable|string|max:255',
            'funding_type'     => 'nullable|string|max:50',
            'founded_year'     => 'nullable|integer|min:1800|max:2100',
            'description'      => 'nullable|string',
            'logo_url'         => 'nullable|url|max:500',
            'is_active'        => 'boolean',
        ]);

        // Slug otomatik oluştur
        $baseSlug = Str::slug($data['name']);
        $slug = $baseSlug;
        $i = 2;
        while (Source::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $i++;
        }
        $data['slug'] = $slug;

        $source = Source::create($data);
        $source->article_count = 0;

        return response()->json(['source' => $source], 201);
    }

    /**
     * Kaynak detayı
     */
    public function show(int $id): JsonResponse
    {
        $source = Source::findOrFail($id);
        $source->article_count = DB::table('articles')->where('source_id', $source->id)->count();
        return response()->json(['source' => $source]);
    }

    /**
     * Kaynağı güncelle
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $source = Source::findOrFail($id);

        $data = $request->validate([
            'name'             => 'sometimes|string|max:100',
            'rss_url'          => 'sometimes|url|max:255',
            'site_url'         => 'nullable|url|max:500',
            'country_code'     => 'sometimes|string|size:2',
            'bias'             => 'sometimes|in:pro_gov,opposition',
            'language'         => 'sometimes|string|max:10',
            'importance_score' => 'sometimes|integer|min:0|max:10',
            'is_active'        => 'sometimes|boolean',
            'owner'            => 'nullable|string|max:255',
            'funding_type'     => 'nullable|string|max:50',
            'founded_year'     => 'nullable|integer|min:1800|max:2100',
            'description'      => 'nullable|string',
            'logo_url'         => 'nullable|url|max:500',
        ]);

        // İsim değiştiyse slug'u da güncelle
        if (isset($data['name']) && $data['name'] !== $source->name) {
            $baseSlug = Str::slug($data['name']);
            $slug = $baseSlug;
            $i = 2;
            while (Source::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $baseSlug . '-' . $i++;
            }
            $data['slug'] = $slug;
        }

        $source->update($data);
        $source->article_count = DB::table('articles')->where('source_id', $source->id)->count();

        return response()->json(['source' => $source]);
    }

    /**
     * Aktif/Pasif toggle
     */
    public function toggleActive(int $id): JsonResponse
    {
        $source = Source::findOrFail($id);
        $source->update(['is_active' => !$source->is_active]);
        return response()->json(['source' => $source, 'is_active' => $source->is_active]);
    }

    /**
     * Kaynağı sil
     */
    public function destroy(int $id): JsonResponse
    {
        $source = Source::findOrFail($id);
        $source->delete();
        return response()->json(['message' => 'Kaynak silindi.']);
    }

    /**
     * Tüm kaynakların ülke kodlarını döndür (filter için)
     */
    public function countries(): JsonResponse
    {
        $countries = Source::select('country_code')
            ->distinct()
            ->orderBy('country_code')
            ->pluck('country_code');
        return response()->json(['countries' => $countries]);
    }
}
