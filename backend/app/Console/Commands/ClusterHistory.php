<?php
namespace App\Console\Commands;

use App\Services\ClusteringService;
use Illuminate\Console\Command;

class ClusterHistory extends Command
{
    protected $signature = 'haber:cluster-history {--days=30 : Kaç günlük geçmiş işlensin}';
    protected $description = 'Kümelenmemiş eski makaleleri event olarak gruplar (varsayılan: son 30 gün)';

    public function handle(ClusteringService $clusterer): void
    {
        $days = (int) $this->option('days');
        $this->info("Son {$days} günün kümelenmemiş makaleleri işleniyor...");
        $count = $clusterer->clusterHistoricalArticles($days);
        $this->info("Tamamlandı. {$count} event işlendi.");
    }
}
