<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin'    => \App\Http\Middleware\AdminMiddleware::class,
            'premium'  => \App\Http\Middleware\PremiumMiddleware::class,
        ]);
        // Prevent "Route [login] not defined" 500 — just use a fallback path
        $middleware->redirectGuestsTo('/giris');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // API isteklerinde 401 JSON döndür, redirect yapma
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });
    })->create();
