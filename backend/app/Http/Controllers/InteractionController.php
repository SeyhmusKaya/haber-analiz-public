<?php
namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InteractionController extends Controller
{
    public function markRead(Request $request, int $eventId): JsonResponse
    {
        $user = $request->user();

        DB::table('user_event_reads')->updateOrInsert(
            ['user_id' => $user->id, 'event_id' => $eventId],
            ['read_at' => now()]
        );

        return response()->json(['read' => true]);
    }

    public function toggleSave(Request $request, int $eventId): JsonResponse
    {
        $user = $request->user();

        $exists = DB::table('user_event_saves')
            ->where('user_id', $user->id)
            ->where('event_id', $eventId)
            ->exists();

        if ($exists) {
            DB::table('user_event_saves')
                ->where('user_id', $user->id)
                ->where('event_id', $eventId)
                ->delete();
            return response()->json(['saved' => false]);
        }

        DB::table('user_event_saves')->insert([
            'user_id' => $user->id,
            'event_id' => $eventId,
            'saved_at' => now(),
        ]);

        return response()->json(['saved' => true]);
    }

    public function savedEvents(Request $request): JsonResponse
    {
        $user = $request->user();

        $eventIds = DB::table('user_event_saves')
            ->where('user_id', $user->id)
            ->orderBy('saved_at', 'desc')
            ->pluck('event_id');

        $events = Event::with(['articles.source'])
            ->whereIn('id', $eventIds)
            ->where('status', 'ready')
            ->get()
            ->map(function ($event) {
                return [
                    'id'            => $event->id,
                    'title_tr'      => $event->title_tr,
                    'summary_tr'    => $event->summary_tr,
                    'category'      => $event->category,
                    'importance_score' => $event->importance_score,
                    'article_count' => $event->articles->count(),
                    'country_codes' => $event->articles->pluck('source.country_code')->unique()->values()->toArray(),
                    'image_url'     => $event->articles->whereNotNull('image_url')->first()?->image_url,
                    'published_at'  => $event->articles->max('published_at'),
                    'created_at'    => $event->created_at->toISOString(),
                ];
            });

        return response()->json(['events' => $events]);
    }

    public function status(Request $request, int $eventId): JsonResponse
    {
        $user = $request->user();

        $read = DB::table('user_event_reads')
            ->where('user_id', $user->id)
            ->where('event_id', $eventId)
            ->exists();

        $saved = DB::table('user_event_saves')
            ->where('user_id', $user->id)
            ->where('event_id', $eventId)
            ->exists();

        return response()->json(['read' => $read, 'saved' => $saved]);
    }
}
