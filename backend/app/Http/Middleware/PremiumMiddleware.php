<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PremiumMiddleware
{
    /**
     * Kullanım: 'premium:standart' veya 'premium:pro'
     */
    public function handle(Request $request, Closure $next, string $plan = 'standart'): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Giriş yapmanız gerekiyor.', 'code' => 'auth_required'], 401);
        }

        // Plan süresi dolmuş mu kontrol et
        if ($user->plan !== 'free' && $user->plan_expires_at && now()->isAfter($user->plan_expires_at)) {
            $user->update(['plan' => 'free', 'plan_expires_at' => null]);
        }

        $planHierarchy = ['free' => 0, 'standart' => 1, 'pro' => 2];
        $userLevel     = $planHierarchy[$user->plan] ?? 0;
        $requiredLevel = $planHierarchy[$plan] ?? 1;

        if ($userLevel < $requiredLevel) {
            return response()->json([
                'error'    => 'Bu özellik ' . ucfirst($plan) . ' plan gerektirir.',
                'code'     => 'premium_required',
                'required' => $plan,
                'current'  => $user->plan,
            ], 403);
        }

        return $next($request);
    }
}
