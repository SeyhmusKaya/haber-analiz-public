<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FcmController extends Controller
{
    /**
     * FCM token kaydet / güncelle.
     * POST /api/fcm/register
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => 'required|string|max:500',
            'platform' => 'in:android,ios',
        ]);

        $token    = $request->input('token');
        $platform = $request->input('platform', 'android');

        DB::table('device_tokens')->upsert(
            ['token' => $token, 'platform' => $platform, 'updated_at' => now(), 'created_at' => now()],
            ['token'],
            ['platform', 'updated_at']
        );

        return response()->json(['success' => true]);
    }
}
