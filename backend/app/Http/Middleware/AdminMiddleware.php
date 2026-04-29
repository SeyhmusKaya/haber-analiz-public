<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || !$user->is_admin) {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        return $next($request);
    }
}
