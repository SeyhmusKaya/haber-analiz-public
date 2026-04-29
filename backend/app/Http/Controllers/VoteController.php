<?php
namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VoteController extends Controller
{
    private const COUNTRIES = [
        'TR' => 'Türkiye', 'US' => 'ABD', 'GB' => 'İngiltere', 'DE' => 'Almanya',
        'RU' => 'Rusya', 'CN' => 'Çin', 'IR' => 'İran', 'IL' => 'İsrail',
        'SA' => 'Suudi Arabistan', 'EG' => 'Mısır',
    ];

    public function store(Request $request, int $eventId, string $countryCode): JsonResponse
    {
        $request->validate([
            'vote' => 'required|string|max:10',
        ]);

        $userId = $request->user()->id;

        DB::table('reader_votes')->updateOrInsert(
            ['event_id' => $eventId, 'country_code' => $countryCode, 'user_id' => $userId],
            ['vote' => $request->vote, 'created_at' => now()]
        );

        return response()->json(['message' => 'Oyunuz kaydedildi.']);
    }

    public function results(Request $request, int $eventId, string $countryCode): JsonResponse
    {
        $votes = DB::table('reader_votes')
            ->where('event_id', $eventId)
            ->where('country_code', $countryCode)
            ->selectRaw("vote, COUNT(*) as count")
            ->groupBy('vote')
            ->pluck('count', 'vote');

        $total = $votes->sum();

        $userVote = null;
        if ($request->user()) {
            $userVote = DB::table('reader_votes')
                ->where('event_id', $eventId)
                ->where('country_code', $countryCode)
                ->where('user_id', $request->user()->id)
                ->value('vote');
        }

        return response()->json(
            array_merge($votes->toArray(), ['total' => $total, 'user_vote' => $userVote])
        );
    }

    /**
     * Genel istatistikler — ülke bazlı oy dağılımı
     * vote alanı ülke kodu tutar (TR, US, GB vs.)
     */
    public function stats(): JsonResponse
    {
        $total = DB::table('reader_votes')->count();

        $counts = DB::table('reader_votes')
            ->selectRaw("vote, COUNT(*) as count")
            ->groupBy('vote')
            ->pluck('count', 'vote');

        // Ülke bazlı yüzde dağılımı
        $countries = [];
        foreach ($counts as $vote => $count) {
            $name = self::COUNTRIES[$vote] ?? $vote;
            $countries[] = [
                'code' => $vote,
                'name' => $name,
                'count' => $count,
                'pct' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
            ];
        }

        usort($countries, fn($a, $b) => $b['count'] - $a['count']);

        return response()->json([
            'total_votes' => $total,
            'countries' => $countries,
        ]);
    }

    /**
     * Haber bazlı istatistikler — hangi haberde hangi ülke kazandı
     */
    public function countryStats(): JsonResponse
    {
        // Her haber için en çok oy alan ülkeyi bul
        $events = DB::table('reader_votes')
            ->selectRaw("event_id, vote, COUNT(*) as count")
            ->groupBy('event_id', 'vote')
            ->orderByDesc('count')
            ->get();

        // Haber başına en çok oy alan ülke
        $winners = [];
        foreach ($events as $row) {
            if (!isset($winners[$row->event_id]) || $row->count > $winners[$row->event_id]['count']) {
                $winners[$row->event_id] = ['vote' => $row->vote, 'count' => $row->count];
            }
        }

        // Ülke bazında kazanma sayıları
        $winCounts = [];
        foreach ($winners as $data) {
            $code = $data['vote'];
            $winCounts[$code] = ($winCounts[$code] ?? 0) + 1;
        }

        $totalEvents = count($winners);
        $result = [];
        foreach ($winCounts as $code => $wins) {
            $result[] = [
                'country_code' => $code,
                'name' => self::COUNTRIES[$code] ?? $code,
                'wins' => $wins,
                'total_events' => $totalEvents,
                'win_pct' => $totalEvents > 0 ? round(($wins / $totalEvents) * 100, 1) : 0,
            ];
        }

        usort($result, fn($a, $b) => $b['wins'] - $a['wins']);

        return response()->json($result);
    }

    /**
     * Türkiye kutuplaşma oyu kaydet (yandaş/muhalif/both/undecided)
     */
    public function storeTrBias(Request $request, int $eventId): JsonResponse
    {
        $request->validate([
            'vote' => 'required|string|in:pro_gov,opposition,both,undecided',
        ]);

        // IP hash'i user_id olarak kullan (giriş gerekmez)
        $ipHash = crc32($request->ip()) & 0x7FFFFFFF;

        DB::table('reader_votes')->updateOrInsert(
            ['event_id' => $eventId, 'country_code' => 'TR_BIAS', 'user_id' => $ipHash],
            ['vote' => $request->vote, 'created_at' => now()]
        );

        return response()->json(['message' => 'Oyunuz kaydedildi.']);
    }

    /**
     * Türkiye kutuplaşma anket sonuçları (tek haber)
     */
    public function trBiasResults(int $eventId): JsonResponse
    {
        $counts = DB::table('reader_votes')
            ->where('event_id', $eventId)
            ->where('country_code', 'TR_BIAS')
            ->selectRaw("vote, COUNT(*) as count")
            ->groupBy('vote')
            ->pluck('count', 'vote');

        $total = $counts->sum();

        return response()->json([
            'pro_gov' => $counts->get('pro_gov', 0),
            'opposition' => $counts->get('opposition', 0),
            'both' => $counts->get('both', 0),
            'undecided' => $counts->get('undecided', 0),
            'total' => $total,
        ]);
    }

    /**
     * Türkiye kutuplaşma genel istatistikler (tüm haberler)
     */
    public function trBiasStats(): JsonResponse
    {
        $counts = DB::table('reader_votes')
            ->where('country_code', 'TR_BIAS')
            ->selectRaw("vote, COUNT(*) as count")
            ->groupBy('vote')
            ->pluck('count', 'vote');

        $total = $counts->sum();

        return response()->json([
            'total_votes' => $total,
            'pro_gov' => $counts->get('pro_gov', 0),
            'opposition' => $counts->get('opposition', 0),
            'both' => $counts->get('both', 0),
            'undecided' => $counts->get('undecided', 0),
            'pro_gov_pct' => $total > 0 ? round(($counts->get('pro_gov', 0) / $total) * 100, 1) : 0,
            'opposition_pct' => $total > 0 ? round(($counts->get('opposition', 0) / $total) * 100, 1) : 0,
            'both_pct' => $total > 0 ? round(($counts->get('both', 0) / $total) * 100, 1) : 0,
            'undecided_pct' => $total > 0 ? round(($counts->get('undecided', 0) / $total) * 100, 1) : 0,
        ]);
    }
}
