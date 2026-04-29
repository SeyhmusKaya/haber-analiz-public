<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PruneOldReports extends Command
{
    protected $signature = 'haber:prune-reports';
    protected $description = 'Delete weekly reports older than 8 weeks and monthly reports older than 1 year';

    public function handle(): void
    {
        $weeklyThreshold = now()->subWeeks(8)->toDateString();
        $monthlyThreshold = now()->subYear()->toDateString();

        $deletedWeekly = DB::table('reports')
            ->where('type', 'weekly')
            ->where('period_end', '<', $weeklyThreshold)
            ->delete();

        $deletedMonthly = DB::table('reports')
            ->where('type', 'monthly')
            ->where('period_end', '<', $monthlyThreshold)
            ->delete();

        $this->info("Pruned {$deletedWeekly} weekly and {$deletedMonthly} monthly reports.");
        Log::info("Reports pruned: {$deletedWeekly} weekly, {$deletedMonthly} monthly");
    }
}
