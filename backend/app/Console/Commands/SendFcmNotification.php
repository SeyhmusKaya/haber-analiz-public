<?php

namespace App\Console\Commands;

use App\Services\FcmService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SendFcmNotification extends Command
{
    protected $signature = 'haber:notify';
    protected $description = 'Son 1 saatte yeni haber geldiyse FCM bildirimi gönder (saatte max 1)';

    public function handle(FcmService $fcm): int
    {
        $throttleKey = 'fcm_notification_sent';

        // Saatte 1 throttle
        if (Cache::has($throttleKey)) {
            $this->info('FCM: Son 1 saat içinde zaten gönderildi, atlanıyor.');
            return 0;
        }

        // Son 30 dakikada yeni event var mı?
        $newCount = DB::table('events')
            ->where('created_at', '>=', now()->subMinutes(35))
            ->count();

        if ($newCount === 0) {
            $this->info('FCM: Yeni haber yok, bildirim gönderilmeyecek.');
            return 0;
        }

        // En önemli yeni haberi bul
        $event = DB::table('events')
            ->where('created_at', '>=', now()->subMinutes(35))
            ->orderByDesc('importance_score')
            ->first();

        $title = 'Yeni Haberler';
        $body  = $event ? $event->title_tr : "{$newCount} yeni haber var";
        $data  = $event ? ['event_id' => (string) $event->id] : [];

        $this->info("FCM: '{$title}' bildirimi gönderiliyor...");
        $sent = $fcm->sendToAll($title, $body, $data);
        $this->info("FCM: {$sent} cihaza gönderildi.");

        // 1 saat throttle koy
        Cache::put($throttleKey, true, now()->addHour());

        return 0;
    }
}
