<?php
namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;

class ContactController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'    => 'required|string|max:100',
            'email'   => 'required|email|max:255',
            'subject' => 'required|string|max:100',
            'message' => 'required|string|max:3000',
        ]);

        // IP başına günde 3 mesaj rate limit
        $ip  = $request->ip();
        $key = "contact_limit:{$ip}:" . now()->toDateString();
        $count = (int) Cache::get($key, 0);

        if ($count >= 3) {
            return response()->json([
                'error' => 'Bugün çok fazla mesaj gönderdiniz. Lütfen yarın tekrar deneyin.',
            ], 429);
        }

        DB::table('contact_messages')->insert([
            'name'       => $request->name,
            'email'      => $request->email,
            'subject'    => $request->subject,
            'message'    => $request->message,
            'ip'         => $ip,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Cache::put($key, $count + 1, now()->endOfDay());

        // Admin'e e-posta gönder (SMTP ayarlıysa)
        $this->notifyAdmin($request->all());

        return response()->json(['message' => 'Mesajınız alındı. En kısa sürede size dönüş yapacağız.'], 201);
    }

    // Admin mesaj listesi
    public function index(Request $request): JsonResponse
    {
        $messages = DB::table('contact_messages')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($messages);
    }

    // Okundu işaretle
    public function markRead(int $id): JsonResponse
    {
        DB::table('contact_messages')->where('id', $id)->update(['is_read' => true]);
        return response()->json(['message' => 'Okundu işaretlendi.']);
    }

    // Okunmamış sayısı
    public function unreadCount(): JsonResponse
    {
        $count = DB::table('contact_messages')->where('is_read', false)->count();
        return response()->json(['count' => $count]);
    }

    // Sil
    public function destroy(int $id): JsonResponse
    {
        DB::table('contact_messages')->where('id', $id)->delete();
        return response()->json(['message' => 'Mesaj silindi.']);
    }

    private function notifyAdmin(array $data): void
    {
        try {
            $adminEmail = DB::table('admin_settings')->where('key', 'smtp_from_email')->value('value');
            if (!$adminEmail) return;

            $subject = "[Medya İzle] Yeni İletişim: {$data['subject']}";
            $body    = "Ad: {$data['name']}\nE-posta: {$data['email']}\nKonu: {$data['subject']}\n\nMesaj:\n{$data['message']}";

            Mail::raw($body, function ($mail) use ($adminEmail, $subject, $data) {
                $mail->to($adminEmail)
                     ->subject($subject)
                     ->replyTo($data['email'], $data['name']);
            });
        } catch (\Throwable) {
            // SMTP ayarlı değilse sessizce geç
        }
    }
}
