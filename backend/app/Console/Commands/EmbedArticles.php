<?php
namespace App\Console\Commands;

use App\Services\EmbeddingService;
use Illuminate\Console\Command;

class EmbedArticles extends Command
{
    protected $signature = 'haber:embed';
    protected $description = 'Generate embeddings for new articles';

    public function handle(EmbeddingService $embedder): void
    {
        $this->info('Generating embeddings...');
        $count = $embedder->embedNewArticles();
        $this->info("Done. Embedded {$count} articles.");
    }
}
