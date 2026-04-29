<?php

namespace App\Http\Controllers;

use App\Services\MailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('notifications')
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc');

        if ($request->boolean('unread')) {
            $query->where('is_read', false);
        }

        $notifications = $query->paginate(20);

        return response()->json([
            'notifications' => $notifications->items(),
            'total' => $notifications->total(),
            'unread_count' => DB::table('notifications')
                ->where('user_id', $request->user()->id)
                ->where('is_read', false)
                ->count(),
        ]);
    }

    public function markRead(int $id, Request $request): JsonResponse
    {
        DB::table('notifications')
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Okundu olarak işaretlendi.']);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        DB::table('notifications')
            ->where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Tümü okundu olarak işaretlendi.']);
    }

    public function settings(Request $request): JsonResponse
    {
        $settings = DB::table('user_notification_settings')
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$settings) {
            return response()->json([
                'new_article' => true,
                'comment_reply' => true,
                'comment_like' => true,
                'newsletter' => true,
                'filter_countries' => [],
                'filter_categories' => [],
                'min_importance' => 5,
            ]);
        }

        return response()->json([
            'new_article' => (bool) $settings->new_article,
            'comment_reply' => (bool) $settings->comment_reply,
            'comment_like' => (bool) $settings->comment_like,
            'newsletter' => (bool) $settings->newsletter,
            'filter_countries' => $settings->filter_countries ? json_decode($settings->filter_countries, true) : [],
            'filter_categories' => $settings->filter_categories ? json_decode($settings->filter_categories, true) : [],
            'min_importance' => $settings->min_importance,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $data = [
            'new_article' => $request->boolean('new_article', true),
            'comment_reply' => $request->boolean('comment_reply', true),
            'comment_like' => $request->boolean('comment_like', true),
            'newsletter' => $request->boolean('newsletter', true),
            'filter_countries' => $request->filter_countries ? json_encode($request->filter_countries) : null,
            'filter_categories' => $request->filter_categories ? json_encode($request->filter_categories) : null,
            'min_importance' => $request->input('min_importance', 5),
        ];

        $exists = DB::table('user_notification_settings')->where('user_id', $userId)->exists();

        if ($exists) {
            DB::table('user_notification_settings')->where('user_id', $userId)->update($data);
        } else {
            DB::table('user_notification_settings')->insert(array_merge(['user_id' => $userId], $data));
        }

        return response()->json(['message' => 'Bildirim ayarları güncellendi.']);
    }

    // Admin SMTP settings
    public function getSmtp(): JsonResponse
    {
        $keys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_email', 'smtp_from_name'];
        $raw  = DB::table('admin_settings')->whereIn('key', $keys)->pluck('value', 'key');

        return response()->json([
            'host'       => $raw['smtp_host']       ?? '',
            'port'       => (int) ($raw['smtp_port'] ?? 587),
            'username'   => $raw['smtp_user']        ?? '',
            'password'   => $raw['smtp_pass']        ?? '',
            'from_email' => $raw['smtp_from_email']  ?? '',
            'from_name'  => $raw['smtp_from_name']   ?? '',
        ]);
    }

    public function updateSmtp(Request $request): JsonResponse
    {
        $map = [
            'host'       => 'smtp_host',
            'port'       => 'smtp_port',
            'username'   => 'smtp_user',
            'password'   => 'smtp_pass',
            'from_email' => 'smtp_from_email',
            'from_name'  => 'smtp_from_name',
        ];

        foreach ($map as $frontendKey => $dbKey) {
            if ($request->has($frontendKey)) {
                DB::table('admin_settings')->updateOrInsert(
                    ['key' => $dbKey],
                    ['value' => $request->input($frontendKey), 'updated_at' => now()]
                );
            }
        }

        return response()->json(['message' => 'SMTP ayarları güncellendi.']);
    }

    // POST /api/admin/smtp/test
    public function testSmtp(Request $request): JsonResponse
    {
        $mail = new MailService();

        if (!$mail->isConfigured()) {
            return response()->json(['message' => 'SMTP ayarları eksik. Lütfen önce host, kullanıcı adı ve gönderici e-posta adresini kaydedin.'], 422);
        }

        $toEmail = DB::table('admin_settings')->where('key', 'smtp_from_email')->value('value')
                   ?: $request->user()?->email;

        if (!$toEmail) {
            return response()->json(['message' => 'Test e-postası gönderilecek adres bulunamadı.'], 422);
        }

        try {
            $bodyHtml = $mail->buildTestBody();
            $fullHtml = $mail->wrapTemplate('SMTP Test Maili', $bodyHtml);
            $mail->send($toEmail, 'Admin', 'Medya İzle — SMTP Test Maili', $fullHtml);

            return response()->json(['message' => "Test maili başarıyla gönderildi: {$toEmail}"]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'SMTP hatası: ' . $e->getMessage()], 500);
        }
    }

    // Admin AI Settings (Gemini key etc.)
    public function getAiSettings(): JsonResponse
    {
        $keys = ['gemini_api_key', 'gemini_model', 'gemini_embedding_model', 'ai_max_tokens', 'ai_temperature'];
        $settings = DB::table('admin_settings')->whereIn('key', $keys)->pluck('value', 'key');

        // Fallback defaults
        $defaults = [
            'gemini_api_key' => config('services.gemini.key'),
            'gemini_model' => 'gemini-2.5-flash',
            'gemini_embedding_model' => 'gemini-embedding-001',
            'ai_max_tokens' => '2048',
            'ai_temperature' => '0.7',
        ];

        foreach ($defaults as $k => $v) {
            if (!isset($settings[$k]) || empty($settings[$k])) {
                $settings[$k] = $v;
            }
        }

        // Mask the API key for display (show first 10 + last 4 chars)
        if (!empty($settings['gemini_api_key'])) {
            $key = $settings['gemini_api_key'];
            if (strlen($key) > 14) {
                $settings['gemini_api_key_masked'] = substr($key, 0, 10) . '...' . substr($key, -4);
            }
        }

        return response()->json($settings);
    }

    public function updateAiSettings(Request $request): JsonResponse
    {
        $keys = ['gemini_api_key', 'gemini_model', 'gemini_embedding_model', 'ai_max_tokens', 'ai_temperature'];

        foreach ($keys as $key) {
            if ($request->has($key) && $request->input($key) !== null && $request->input($key) !== '') {
                DB::table('admin_settings')->updateOrInsert(
                    ['key' => $key],
                    ['value' => $request->input($key), 'updated_at' => now()]
                );
            }
        }

        // Clear config cache so GeminiService picks up new key
        \Illuminate\Support\Facades\Cache::forget('gemini:working_model');

        return response()->json(['message' => 'AI ayarları güncellendi.']);
    }

    public function testAiConnection(): JsonResponse
    {
        try {
            // Get key from admin_settings or fallback to .env
            $key = DB::table('admin_settings')->where('key', 'gemini_api_key')->value('value')
                   ?: config('services.gemini.key');

            $response = \Illuminate\Support\Facades\Http::timeout(10)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$key}",
                [
                    'contents' => [['parts' => [['text' => 'Merhaba, bu bir test mesajıdır. Kısaca "Bağlantı başarılı" yaz.']]]],
                    'generationConfig' => ['maxOutputTokens' => 50],
                ]
            );

            if ($response->successful()) {
                $text = $response->json('candidates.0.content.parts.0.text') ?? 'Yanıt alınamadı';
                return response()->json(['success' => true, 'message' => 'Bağlantı başarılı!', 'response' => $text]);
            }

            return response()->json(['success' => false, 'message' => 'API hatası: ' . $response->status(), 'details' => $response->body()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Bağlantı hatası: ' . $e->getMessage()], 500);
        }
    }
}
