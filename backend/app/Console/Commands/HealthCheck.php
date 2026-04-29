<?php
namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Event;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class HealthCheck extends Command
{
    protected $signature = 'haber:health {--fix : Sorunları otomatik düzelt}';
    protected $description = 'Pipeline sağlık kontrolü ve otomatik onarım';

    public function handle(): void
    {
        $fix    = $this->option('fix');
        $issues = [];
        $status = [];

        // 1) Fetch: Son 2 saatte yeni makale gelmiş mi?
        $recentArticles = Article::where('created_at', '>=', now()->subHours(2))->count();
        if ($recentArticles === 0) {
            $issues[] = 'fetch';
            $status['fetch'] = ['ok' => false, 'msg' => 'Son 2 saatte makale çekilmedi'];
            if ($fix) {
                Artisan::call('haber:fetch');
                Log::warning('HealthCheck: haber:fetch yeniden çalıştırıldı');
            }
        } else {
            $status['fetch'] = ['ok' => true, 'msg' => "Son 2 saatte {$recentArticles} makale"];
        }

        // 2) Embed: Embedding bekleyen makale var mı?
        $unembedded = Article::whereNull('embedding')
            ->where('published_at', '>=', now()->subDays(7))
            ->count();
        if ($unembedded > 50) {
            $issues[] = 'embed';
            $status['embed'] = ['ok' => false, 'msg' => "{$unembedded} makale embedding bekliyor"];
            if ($fix) {
                Artisan::call('haber:embed');
                Log::warning('HealthCheck: haber:embed yeniden çalıştırıldı');
            }
        } else {
            $status['embed'] = ['ok' => true, 'msg' => $unembedded > 0 ? "{$unembedded} makale embedding kuyrukta (normal)" : 'Tüm makaleler embed edilmiş'];
        }

        // 3) Cluster: Son 2 saatte yeni event oluştu mu?
        $recentEvents = Event::where('created_at', '>=', now()->subHours(2))->count();
        $hasArticles  = Article::where('created_at', '>=', now()->subHours(2))->count();
        // Yeni makale gelmiş ama event oluşmamışsa sorun var
        $clusterOk = !($hasArticles > 20 && $recentEvents === 0);
        if (!$clusterOk) {
            $issues[] = 'cluster';
            $status['cluster'] = ['ok' => false, 'msg' => "{$hasArticles} yeni makale var ama son 2 saatte event oluşmadı"];
            if ($fix) {
                Artisan::call('haber:cluster');
                Log::warning('HealthCheck: haber:cluster yeniden çalıştırıldı');
            }
        } else {
            $status['cluster'] = ['ok' => true, 'msg' => "Son 2 saatte {$recentEvents} event oluştu"];
        }

        // 4) Analyze: 30 dakikadan uzun pending event var mı?
        $stalePending = Event::where('status', 'pending')
            ->where('retry_count', '<', 3)
            ->where('created_at', '<=', now()->subMinutes(30))
            ->count();
        if ($stalePending > 0) {
            $issues[] = 'analyze';
            $status['analyze'] = ['ok' => false, 'msg' => "{$stalePending} event analiz bekliyor (>30dk)"];
            if ($fix) {
                Artisan::call('haber:analyze --limit=200');
                Log::warning('HealthCheck: haber:analyze yeniden çalıştırıldı');
            }
        } else {
            $status['analyze'] = ['ok' => true, 'msg' => 'Analiz kuyruğu temiz'];
        }

        // 5) Genel durum özeti
        $readyCount   = Event::where('status', 'ready')->count();
        $pendingCount = Event::where('status', 'pending')->count();
        $status['summary'] = [
            'ready_events'   => $readyCount,
            'pending_events' => $pendingCount,
            'total_articles' => Article::count(),
            'issues'         => $issues,
        ];

        // Cache'e kaydet (admin panel okur)
        Cache::put('health_status', array_merge($status, ['checked_at' => now()->toISOString()]), 600);

        if (empty($issues)) {
            $this->info('✓ Tüm pipeline adımları sağlıklı');
            Log::info('HealthCheck: OK - ready=' . $readyCount . ' pending=' . $pendingCount);
        } else {
            $this->warn('⚠ Sorunlar: ' . implode(', ', $issues));
            if (!$fix) {
                $this->line('  Otomatik düzeltmek için: php artisan haber:health --fix');
            }
            Log::warning('HealthCheck: Sorunlar tespit edildi: ' . implode(', ', $issues));
        }

        foreach ($status as $key => $val) {
            if ($key === 'summary') continue;
            $icon = $val['ok'] ? '✓' : '✗';
            $this->line("  {$icon} {$key}: {$val['msg']}");
        }
    }
}
