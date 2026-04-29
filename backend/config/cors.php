<?php

$origins = env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000');

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'allowed_origins' => array_map('trim', explode(',', $origins)),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    'exposed_headers' => [],
    'max_age' => 3600,
    'supports_credentials' => true,
];
