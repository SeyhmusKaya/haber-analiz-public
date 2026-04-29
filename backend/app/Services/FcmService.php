<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class FcmService
{
    private string $projectId;
    private string $credentialsPath;

    public function __construct()
    {
        $this->projectId      = config('services.firebase.project_id', 'medya-izle');
        $this->credentialsPath = config('services.firebase.credentials', storage_path('app/firebase-credentials.json'));
    }

    /**
     * Tüm kayıtlı cihazlara bildirim gönderir.
     * Başarısız (invalid/unregistered) token'ları siler.
     */
    public function sendToAll(string $title, string $body, array $data = []): int
    {
        $tokens = DB::table('device_tokens')->pluck('token')->all();

        if (empty($tokens)) {
            return 0;
        }

        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            Log::error('FCM: OAuth2 access token alınamadı.');
            return 0;
        }

        $sent = 0;
        foreach ($tokens as $token) {
            $success = $this->sendOne($accessToken, $token, $title, $body, $data);
            if ($success) {
                $sent++;
            }
        }

        return $sent;
    }

    private function sendOne(string $accessToken, string $token, string $title, string $body, array $data): bool
    {
        $url = "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send";

        $payload = [
            'message' => [
                'token' => $token,
                'notification' => [
                    'title' => $title,
                    'body'  => $body,
                ],
                'data' => array_map('strval', $data),
                'android' => [
                    'notification' => [
                        'channel_id' => 'medyaizle_haberler',
                        'priority'   => 'HIGH',
                    ],
                ],
            ],
        ];

        $response = Http::withToken($accessToken)
            ->timeout(10)
            ->post($url, $payload);

        if ($response->successful()) {
            return true;
        }

        $status = $response->status();
        $errorCode = $response->json('error.details.0.errorCode') ?? $response->json('error.status') ?? '';

        // Geçersiz/kayıtlı olmayan token'ı sil
        if ($status === 404 || in_array($errorCode, ['UNREGISTERED', 'INVALID_ARGUMENT'])) {
            DB::table('device_tokens')->where('token', $token)->delete();
            Log::info("FCM: Geçersiz token silindi.");
        } else {
            Log::error("FCM: Gönderim hatası [{$status}]: " . $response->body());
        }

        return false;
    }

    /**
     * Service Account JSON kullanarak Google OAuth2 access token alır.
     * Token 1 saat geçerli; cachelenir.
     */
    private function getAccessToken(): ?string
    {
        $cacheKey = 'fcm_oauth2_token';
        $cached   = cache($cacheKey);
        if ($cached) {
            return $cached;
        }

        if (!file_exists($this->credentialsPath)) {
            Log::error("FCM: Service account JSON bulunamadı: {$this->credentialsPath}");
            return null;
        }

        $creds = json_decode(file_get_contents($this->credentialsPath), true);
        if (!$creds) {
            Log::error('FCM: Service account JSON parse hatası.');
            return null;
        }

        try {
            $now = time();
            $header  = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $payload = base64_encode(json_encode([
                'iss'   => $creds['client_email'],
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud'   => 'https://oauth2.googleapis.com/token',
                'iat'   => $now,
                'exp'   => $now + 3600,
            ]));

            $signingInput = "{$header}.{$payload}";
            openssl_sign($signingInput, $signature, $creds['private_key'], 'SHA256');
            $jwt = "{$signingInput}." . base64_encode($signature);

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]);

            if (!$response->successful()) {
                Log::error('FCM: Token isteği başarısız: ' . $response->body());
                return null;
            }

            $accessToken = $response->json('access_token');
            $expiresIn   = $response->json('expires_in', 3600);

            cache([$cacheKey => $accessToken], now()->addSeconds($expiresIn - 60));

            return $accessToken;
        } catch (\Throwable $e) {
            Log::error('FCM: Token üretme hatası: ' . $e->getMessage());
            return null;
        }
    }
}
