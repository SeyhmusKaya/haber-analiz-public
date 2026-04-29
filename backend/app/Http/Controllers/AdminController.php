<?php
namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    // GET /api/admin/stats
    public function stats(): JsonResponse
    {
        $today = now()->startOfDay();

        $totalUsers    = DB::table('users')->count();
        $activeToday   = DB::table('personal_access_tokens')
            ->where('last_used_at', '>=', $today)
            ->distinct('tokenable_id')
            ->count('tokenable_id');
        $totalEvents   = DB::table('events')->count();
        $totalArticles = DB::table('articles')->count();

        // Token usage per feature (all time)
        $tokensByFeature = DB::table('token_logs')
            ->select('feature', DB::raw('SUM(tokens_used) as total'))
            ->groupBy('feature')
            ->pluck('total', 'feature');

        // Daily active users last 7 days
        $dailyActive = DB::table('personal_access_tokens')
            ->select(DB::raw('DATE(last_used_at) as date'), DB::raw('COUNT(DISTINCT tokenable_id) as count'))
            ->where('last_used_at', '>=', now()->subDays(6)->startOfDay())
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Chat messages today
        $chatToday = DB::table('chat_messages')
            ->where('role', 'user')
            ->where('created_at', '>=', $today)
            ->count();

        return response()->json([
            'total_users'      => $totalUsers,
            'active_today'     => $activeToday,
            'total_events'     => $totalEvents,
            'total_articles'   => $totalArticles,
            'tokens_by_feature'=> $tokensByFeature,
            'daily_active'     => $dailyActive,
            'chat_today'       => $chatToday,
        ]);
    }

    // GET /api/admin/users
    public function users(Request $request): JsonResponse
    {
        $query = DB::table('users')
            ->select('id', 'name', 'email', 'phone', 'age', 'is_admin', 'is_active', 'google_id', 'created_at', 'plan', 'plan_expires_at');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->query('inactive') === '1') {
            $query->where('is_active', false);
        }

        $total = $query->count();
        $users = $query->orderByDesc('created_at')->paginate(20);

        return response()->json([
            'users' => $users->items(),
            'total' => $total,
            'page'  => $users->currentPage(),
            'pages' => $users->lastPage(),
        ]);
    }

    // GET /api/admin/users/{id}
    public function user(int $id): JsonResponse
    {
        $user = DB::table('users')
            ->select('id', 'name', 'email', 'phone', 'age', 'is_admin', 'is_active', 'google_id', 'avatar', 'created_at')
            ->where('id', $id)
            ->first();

        if (!$user) {
            return response()->json(['error' => 'Kullanıcı bulunamadı.'], 404);
        }

        // Chat stats
        $chatTotal = DB::table('chat_messages')
            ->where('user_id', $id)
            ->where('role', 'user')
            ->count();

        $chatToday = DB::table('chat_messages')
            ->where('user_id', $id)
            ->where('role', 'user')
            ->where('created_at', '>=', now()->startOfDay())
            ->count();

        // Saved events count
        $savedCount = DB::table('user_event_saves')->where('user_id', $id)->count();

        // Token usage by feature
        $tokensByFeature = DB::table('token_logs')
            ->select('feature', DB::raw('SUM(tokens_used) as total'))
            ->where('user_id', $id)
            ->groupBy('feature')
            ->pluck('total', 'feature');

        // Recent activity (last 10 chat messages)
        $recentChats = DB::table('chat_messages')
            ->where('user_id', $id)
            ->where('role', 'user')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['message', 'created_at']);

        return response()->json([
            'user'            => $user,
            'chat_total'      => $chatTotal,
            'chat_today'      => $chatToday,
            'saved_count'     => $savedCount,
            'tokens_by_feature' => $tokensByFeature,
            'recent_chats'    => $recentChats,
        ]);
    }

    // POST /api/admin/users/{id}/gift-plan
    public function giftPlan(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'plan'   => 'required|in:pro',
            'months' => 'required|integer|min:1|max:24',
        ]);

        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'Kullanıcı bulunamadı.'], 404);
        }

        $months  = (int) $request->input('months');
        $plan    = $request->input('plan');

        // Mevcut aktif abonelik varsa süresi üzerine ekle, yoksa bugünden başlat
        $base = ($user->plan === $plan && $user->plan_expires_at && now()->isBefore($user->plan_expires_at))
            ? \Carbon\Carbon::parse($user->plan_expires_at)
            : now();

        $expiresAt = $base->addMonths($months);

        $user->plan            = $plan;
        $user->plan_expires_at = $expiresAt;
        $user->save();

        return response()->json([
            'success'          => true,
            'plan'             => $user->plan,
            'plan_expires_at'  => $user->plan_expires_at,
        ]);
    }

    // GET /api/admin/health
    public function health(): JsonResponse
    {
        $cached = Cache::get('health_status');

        if (!$cached) {
            // Cache yoksa anlık hesapla
            $recentArticles = Article::where('created_at', '>=', now()->subHours(2))->count();
            $unembedded   = Article::whereNull('embedding')->where('published_at', '>=', now()->subDays(7))->count();
            $stalePending = Event::where('status', 'pending')->where('retry_count', '<', 3)->where('created_at', '<=', now()->subMinutes(30))->count();
            $recentEvents = Event::where('created_at', '>=', now()->subHours(2))->count();
            $clusterOk    = !($recentArticles > 20 && $recentEvents === 0);

            $cached = [
                'fetch'   => ['ok' => $recentArticles > 0, 'msg' => "Son 2 saatte {$recentArticles} makale"],
                'embed'   => ['ok' => $unembedded <= 50,   'msg' => "{$unembedded} makale embedding bekliyor"],
                'cluster' => ['ok' => $clusterOk,          'msg' => "Son 2 saatte {$recentEvents} event"],
                'analyze' => ['ok' => $stalePending === 0, 'msg' => "{$stalePending} event analiz bekliyor"],
                'summary' => [
                    'ready_events'   => Event::where('status', 'ready')->count(),
                    'pending_events' => Event::where('status', 'pending')->count(),
                    'total_articles' => Article::count(),
                    'issues'         => array_values(array_filter(['fetch' => $recentArticles === 0 ? 'fetch' : null, 'embed' => $unembedded > 50 ? 'embed' : null, 'cluster' => !$clusterOk ? 'cluster' : null, 'analyze' => $stalePending > 0 ? 'analyze' : null])),
                ],
                'checked_at' => now()->toISOString(),
            ];
        }

        return response()->json($cached);
    }

    // PUT /api/admin/users/{id}
    public function changeUserPassword(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'Kullanıcı bulunamadı.'], 404);
        }

        $user->password = $request->password;
        $user->tokens()->delete();
        $user->save();

        return response()->json(['success' => true, 'message' => 'Şifre güncellendi.']);
    }

    public function updateUser(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'is_active' => 'sometimes|boolean',
            'is_admin'  => 'sometimes|boolean',
        ]);

        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'Kullanıcı bulunamadı.'], 404);
        }

        // Prevent removing own admin status
        if ($request->user()->id === $id && isset($request->is_admin) && !$request->is_admin) {
            return response()->json(['error' => 'Kendi admin yetkinizi kaldıramazsınız.'], 422);
        }

        if ($request->has('is_active')) {
            $user->is_active = $request->is_active;
        }
        if ($request->has('is_admin')) {
            $user->is_admin = $request->is_admin;
        }
        $user->save();

        return response()->json(['success' => true, 'user' => [
            'id'        => $user->id,
            'is_active' => $user->is_active,
            'is_admin'  => $user->is_admin,
        ]]);
    }
}
