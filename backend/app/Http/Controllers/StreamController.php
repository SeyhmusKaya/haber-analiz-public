<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StreamController extends Controller
{
    public function events(Request $request): StreamedResponse
    {
        return new StreamedResponse(function () {
            $lastId = Event::max('id') ?? 0;

            // Send initial connection message
            echo "data: " . json_encode(['type' => 'connected', 'last_id' => $lastId]) . "\n\n";
            ob_flush();
            flush();

            $count = 0;
            while ($count < 60) { // Max 60 iterations (~5 minutes)
                sleep(5);

                $newEvents = Event::where('id', '>', $lastId)
                    ->orderBy('id', 'asc')
                    ->get();

                if ($newEvents->isNotEmpty()) {
                    foreach ($newEvents as $event) {
                        $data = [
                            'type' => 'new_event',
                            'event' => [
                                'id' => $event->id,
                                'title_tr' => $event->title_tr,
                                'category' => $event->category,
                                'importance_score' => $event->importance_score,
                                'created_at' => $event->created_at->toISOString(),
                            ],
                        ];
                        echo "data: " . json_encode($data) . "\n\n";
                        $lastId = max($lastId, $event->id);
                    }
                } else {
                    // Heartbeat
                    echo "data: " . json_encode(['type' => 'heartbeat']) . "\n\n";
                }

                ob_flush();
                flush();

                if (connection_aborted()) break;
                $count++;
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
