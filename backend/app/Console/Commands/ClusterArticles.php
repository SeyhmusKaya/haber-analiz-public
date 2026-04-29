<?php
namespace App\Console\Commands;

use App\Services\ClusteringService;
use Illuminate\Console\Command;

class ClusterArticles extends Command
{
    protected $signature = 'haber:cluster';
    protected $description = 'Cluster articles into events';

    public function handle(ClusteringService $clusterer): void
    {
        $this->info('Clustering articles...');
        $count = $clusterer->clusterRecentArticles();
        $this->info("Done. Created {$count} events.");
    }
}
