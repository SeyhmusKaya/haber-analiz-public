<?php
namespace App\Console\Commands;

use App\Services\MailService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendNewsletter extends Command
{
    protected $signature = 'haber:newsletter {--type=weekly : weekly or monthly}';
    protected $description = 'Send newsletter emails to active subscribers';

    public function handle(MailService $mail): void
    {
        $type = $this->option('type');
        if (!in_array($type, ['weekly', 'monthly'])) {
            $this->error('Type must be "weekly" or "monthly".');
            return;
        }

        if (!$mail->isConfigured()) {
            $this->warn('SMTP not configured. Skipping newsletter.');
            return;
        }

        // Dönem hesapla
        [$periodStart, $periodEnd] = $this->getPeriod($type);
        $typeLabel   = $type === 'weekly' ? 'Haftalık' : 'Aylık';
        $periodLabel = $type === 'weekly'
            ? date('d M Y', strtotime($periodStart)) . ' – ' . date('d M Y', strtotime($periodEnd))
            : date('F Y', strtotime($periodStart));

        $subject = "{$typeLabel} Medya Bülteni — {$periodLabel}";

        // Aktif aboneler
        $subscriptions = DB::table('newsletter_subscriptions')
            ->where('is_active', true)
            ->where('frequency', $type)
            ->get();

        if ($subscriptions->isEmpty()) {
            $this->info('No active subscribers for this frequency.');
            return;
        }

        $this->info("Sending {$type} newsletter to {$subscriptions->count()} subscribers...");
        $bar = $this->output->createProgressBar($subscriptions->count());
        $bar->start();

        $sent   = 0;
        $failed = 0;

        foreach ($subscriptions as $sub) {
            // Kişiselleştirilmiş event listesi
            $categories  = $sub->categories ? json_decode($sub->categories, true) : [];
            $countries   = $sub->countries  ? json_decode($sub->countries, true)  : [];
            $minImportance = $sub->min_importance ?? 1;

            $query = DB::table('events')
                ->where('status', 'ready')
                ->where('importance_score', '>=', $minImportance)
                ->whereBetween('created_at', [$periodStart . ' 00:00:00', $periodEnd . ' 23:59:59'])
                ->orderByDesc('importance_score');

            if (!empty($categories)) {
                $query->whereIn('category', $categories);
            }
            if (!empty($countries)) {
                $query->where(function ($q) use ($countries) {
                    foreach ($countries as $c) {
                        $q->orWhereRaw("related_countries::text LIKE ?", ["%{$c}%"]);
                    }
                });
            }

            $events = $query->limit(10)->get(['id', 'title_tr', 'summary_tr', 'category']);

            if ($events->isEmpty()) {
                // Filtre çok dar, en popüler 5 haberi al
                $events = DB::table('events')
                    ->where('status', 'ready')
                    ->whereBetween('created_at', [$periodStart . ' 00:00:00', $periodEnd . ' 23:59:59'])
                    ->orderByDesc('importance_score')
                    ->limit(5)
                    ->get(['id', 'title_tr', 'summary_tr', 'category']);
            }

            if ($events->isEmpty()) {
                $bar->advance();
                continue;
            }

            // Kullanıcı adı
            $userName = $sub->user_id
                ? (DB::table('users')->where('id', $sub->user_id)->value('name') ?? 'Okuyucu')
                : 'Okuyucu';

            // Email oluştur
            $unsubUrl  = 'https://medyaizle.com/api/newsletter/unsubscribe/' . $sub->unsubscribe_token;
            $bodyHtml  = $mail->buildNewsletterBody($events->toArray(), $periodLabel, $typeLabel);
            $fullHtml  = $mail->wrapTemplate($subject, $bodyHtml, $unsubUrl);

            try {
                $mail->send($sub->email, $userName, $subject, $fullHtml);
                $sent++;

                DB::table('newsletter_logs')->insert([
                    'subscription_id' => $sub->id,
                    'sent_at'         => now(),
                    'event_count'     => $events->count(),
                    'status'          => 'sent',
                ]);
            } catch (\Throwable $e) {
                $failed++;
                Log::warning("Newsletter failed for {$sub->email}: " . $e->getMessage());

                DB::table('newsletter_logs')->insert([
                    'subscription_id' => $sub->id,
                    'sent_at'         => now(),
                    'event_count'     => 0,
                    'status'          => 'failed',
                ]);
            }

            $bar->advance();

            // Rate limit: 1 saniye aralık
            if ($sent % 10 === 0) usleep(500000);
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done. Sent: {$sent}, Failed: {$failed}");
        Log::info("Newsletter sent: type={$type}, sent={$sent}, failed={$failed}");
    }

    private function getPeriod(string $type): array
    {
        if ($type === 'weekly') {
            $monday = now()->startOfWeek()->subWeek();
            $sunday = $monday->copy()->endOfWeek();
            return [$monday->toDateString(), $sunday->toDateString()];
        }
        $start = now()->subMonth()->startOfMonth();
        $end   = now()->subMonth()->endOfMonth();
        return [$start->toDateString(), $end->toDateString()];
    }
}
