<?php
namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminApiKeyController extends Controller
{
    public function index(): JsonResponse
    {
        $keys = DB::table('api_keys')
            ->leftJoin('users', 'api_keys.user_id', '=', 'users.id')
            ->select(
                'api_keys.id',
                'api_keys.user_id',
                'users.email as user_email',
                'users.name as user_name',
                'api_keys.name as note',
                'api_keys.key',
                'api_keys.requests_today',
                'api_keys.is_active',
                'api_keys.created_at',
                DB::raw('0 as total_requests'),
                DB::raw('NULL as last_used_at'),
                DB::raw("'[]' as allowed_ips"),
                DB::raw('1000 as rate_limit_daily')
            )
            ->orderByDesc('api_keys.created_at')
            ->get()
            ->map(function ($k) {
                $k->key_masked = substr($k->key, 0, 8) . '****' . substr($k->key, -4);
                $k->allowed_ips = [];
                unset($k->key);
                return $k;
            });

        return response()->json(['keys' => $keys]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'user_email'       => 'nullable|email',
            'rate_limit_daily' => 'nullable|integer|min:1|max:100000',
            'note'             => 'nullable|string|max:255',
            'allowed_ips'      => 'nullable|array',
        ]);

        $userId = null;
        if ($request->user_email) {
            $userId = DB::table('users')->where('email', $request->user_email)->value('id');
        }

        $key = 'miz_' . Str::random(40);

        $id = DB::table('api_keys')->insertGetId([
            'user_id'       => $userId,
            'key'           => $key,
            'name'          => $request->note ?? 'API Anahtarı',
            'is_active'     => true,
            'requests_today'=> 0,
            'last_reset'    => now()->toDateString(),
            'created_at'    => now(),
        ]);

        return response()->json(['id' => $id, 'key_full' => $key], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'note'             => 'nullable|string|max:255',
            'rate_limit_daily' => 'nullable|integer|min:1',
            'allowed_ips'      => 'nullable|array',
        ]);

        DB::table('api_keys')->where('id', $id)->update([
            'name' => $request->note ?? 'API Anahtarı',
        ]);

        return response()->json(['message' => 'Güncellendi.']);
    }

    public function revoke(int $id): JsonResponse
    {
        DB::table('api_keys')->where('id', $id)->update(['is_active' => false]);
        return response()->json(['message' => 'İptal edildi.']);
    }

    public function activate(int $id): JsonResponse
    {
        DB::table('api_keys')->where('id', $id)->update(['is_active' => true]);
        return response()->json(['message' => 'Aktifleştirildi.']);
    }

    public function destroy(int $id): JsonResponse
    {
        DB::table('api_keys')->where('id', $id)->delete();
        return response()->json(['message' => 'Silindi.']);
    }
}
