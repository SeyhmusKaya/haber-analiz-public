<?php
namespace App\Console\Commands;

use App\Models\Event;
use App\Services\GeminiService;
use Illuminate\Console\Command;

class RecategorizeEvents extends Command
{
    protected $signature = 'haber:recategorize';
    protected $description = 'Re-categorize events that have diger category';

    public function handle(GeminiService $gemini): void
    {
        $events = Event::where('category', 'diger')->orWhereNull('category')->get();
        $this->info("Re-categorizing {$events->count()} events...");

        $count = 0;
        foreach ($events as $event) {
            $category = $gemini->detectCategory($event->title_tr);
            if ($category !== 'diger') {
                $event->update(['category' => $category]);
                $count++;
            }
        }

        $this->info("Done. Updated {$count} events.");
    }
}
