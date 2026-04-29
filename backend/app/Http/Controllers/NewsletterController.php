<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NewsletterController extends Controller
{
    public function subscribe(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $existing = DB::table('newsletter_subscriptions')
            ->where('email', $request->email)
            ->where('is_active', true)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Bu e-posta adresi zaten abone.'], 409);
        }

        DB::table('newsletter_subscriptions')->insert([
            'user_id' => $request->user()?->id,
            'email' => $request->email,
            'frequency' => 'weekly',
            'unsubscribe_token' => Str::random(64),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Bültene başarıyla abone oldunuz!']);
    }

    public function unsubscribe(string $token): JsonResponse
    {
        $sub = DB::table('newsletter_subscriptions')
            ->where('unsubscribe_token', $token)
            ->first();

        if (!$sub) {
            return response()->json(['error' => 'Geçersiz token.'], 404);
        }

        DB::table('newsletter_subscriptions')
            ->where('id', $sub->id)
            ->update(['is_active' => false, 'updated_at' => now()]);

        return response()->json(['message' => 'Aboneliğiniz iptal edildi.']);
    }

    public function settings(Request $request): JsonResponse
    {
        $sub = DB::table('newsletter_subscriptions')
            ->where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();

        if (!$sub) {
            return response()->json([
                'subscribed' => false,
                'frequency' => 'weekly',
                'categories' => [],
                'countries' => [],
                'min_importance' => 1,
            ]);
        }

        return response()->json([
            'subscribed' => true,
            'frequency' => $sub->frequency,
            'categories' => $sub->categories ? json_decode($sub->categories, true) : [],
            'countries' => $sub->countries ? json_decode($sub->countries, true) : [],
            'min_importance' => $sub->min_importance,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $sub = DB::table('newsletter_subscriptions')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->first();

        $data = [
            'frequency' => $request->input('frequency', 'weekly'),
            'categories' => $request->categories ? json_encode($request->categories) : null,
            'countries' => $request->countries ? json_encode($request->countries) : null,
            'min_importance' => $request->input('min_importance', 1),
            'updated_at' => now(),
        ];

        if ($sub) {
            DB::table('newsletter_subscriptions')->where('id', $sub->id)->update($data);
        } else {
            DB::table('newsletter_subscriptions')->insert(array_merge($data, [
                'user_id' => $userId,
                'email' => $request->user()->email,
                'is_active' => true,
                'unsubscribe_token' => Str::random(64),
                'created_at' => now(),
            ]));
        }

        return response()->json(['message' => 'Bülten ayarları güncellendi.']);
    }
}
