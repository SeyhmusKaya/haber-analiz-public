<?php
namespace App\Console\Commands;

use App\Services\ScraperService;
use Illuminate\Console\Command;

class FetchArticles extends Command
{
    protected $signature = 'haber:fetch';
    protected $description = 'Fetch articles from RSS feeds';

    public function handle(ScraperService $scraper): void
    {
        $this->info('Fetching articles...');
        $count = $scraper->fetchAll();
        $this->info("Done. Fetched {$count} new articles.");
    }
}
