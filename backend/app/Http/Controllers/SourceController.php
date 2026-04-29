<?php
namespace App\Http\Controllers;

use App\Models\Source;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SourceController extends Controller
{
    public function index(): JsonResponse
    {
        $sources = Source::select(['id', 'name', 'slug', 'rss_url', 'site_url', 'country_code', 'bias', 'language', 'importance_score', 'owner', 'funding_type', 'founded_year', 'description', 'is_active'])
            ->where('is_active', true)
            ->where('importance_score', '>', 0)
            ->orderBy('country_code')
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

    public function show(string $slug): JsonResponse
    {
        $source = Source::where('slug', $slug)->first();
        if (!$source) {
            return response()->json(['message' => 'Kaynak bulunamadı.'], 404);
        }

        $source->article_count = DB::table('articles')->where('source_id', $source->id)->count();

        // Son 30 günlük istatistikler
        $stats = DB::table('articles')
            ->where('source_id', $source->id)
            ->where('created_at', '>=', now()->subDays(30))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as article_count')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get();

        return response()->json([
            'source' => $source,
            'daily_stats' => $stats,
        ]);
    }
}
