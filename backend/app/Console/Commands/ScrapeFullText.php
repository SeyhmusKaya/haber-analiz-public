<?php

namespace App\Console\Commands;

use App\Services\FullTextScraperService;
use Illuminate\Console\Command;

class ScrapeFullText extends Command
{
    protected $signature = 'haber:scrape-fulltext {--limit=100 : Maximum articles to scrape}';
    protected $description = 'Scrape full text from article URLs and translate to Turkish';

    public function handle(FullTextScraperService $service): int
    {
        $limit = (int) $this->option('limit');
        $this->info("Scraping full text for up to {$limit} articles...");

        $stats = $service->scrapeNewArticles($limit);

        $this->info("Done! Total: {$stats['total']}, Success: {$stats['success']}, Failed: {$stats['failed']}, Translated: {$stats['translated']}");

        return Command::SUCCESS;
    }
}
