<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommentController extends Controller
{
    public function index(int $eventId, Request $request): JsonResponse
    {
        $sort = $request->input('sort', 'newest');

        $query = Comment::with(['user:id,name,email', 'replies' => function ($q) {
            $q->with(['user:id,name,email', 'replies' => function ($q2) {
                $q2->with('user:id,name,email')
                   ->where('is_deleted', false)
                   ->orderBy('created_at', 'asc');
            }])
            ->where('is_deleted', false)
            ->orderBy('created_at', 'asc');
        }])
        ->where('event_id', $eventId)
        ->whereNull('parent_id')
        ->where('is_deleted', false);

        if ($sort === 'popular') {
            $query->orderByRaw('(likes_count - dislikes_count) DESC');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $comments = $query->paginate(20);

        $userId = $request->user()?->id;
        $commentIds = collect();
        foreach ($comments as $c) {
            $commentIds->push($c->id);
            foreach ($c->replies as $r) {
                $commentIds->push($r->id);
                foreach ($r->replies as $r2) {
                    $commentIds->push($r2->id);
                }
            }
        }

        $userVotes = [];
        if ($userId && $commentIds->isNotEmpty()) {
            $userVotes = DB::table('comment_votes')
                ->where('user_id', $userId)
                ->whereIn('comment_id', $commentIds)
                ->pluck('vote_type', 'comment_id')
                ->toArray();
        }

        $format = function ($comment) use (&$format, $userVotes) {
            return [
                'id' => $comment->id,
                'content' => $comment->content,
                'user' => [
                    'id' => $comment->user->id,
                    'name' => $comment->user->name,
                ],
                'likes_count' => $comment->likes_count,
                'dislikes_count' => $comment->dislikes_count,
                'user_vote' => $userVotes[$comment->id] ?? null,
                'replies' => $comment->replies->map($format)->values(),
                'created_at' => $comment->created_at->toISOString(),
            ];
        };

        return response()->json([
            'comments' => $comments->getCollection()->map($format)->values(),
            'total' => $comments->total(),
            'page' => $comments->currentPage(),
        ]);
    }

    public function store(int $eventId, Request $request): JsonResponse
    {
        $request->validate([
            'content' => ['required', 'string', 'min:2', 'max:2000'],
            'parent_id' => 'nullable|integer|exists:comments,id',
        ]);

        // XSS koruması - HTML etiketlerini temizle
        $content = strip_tags($request->content);

        // Max 3 levels deep
        if ($request->parent_id) {
            $parent = Comment::find($request->parent_id);
            if ($parent && $parent->parent_id) {
                $grandparent = Comment::find($parent->parent_id);
                if ($grandparent && $grandparent->parent_id) {
                    return response()->json(['error' => 'Maksimum yanıt derinliğine ulaşıldı.'], 422);
                }
            }
        }

        $comment = Comment::create([
            'event_id' => $eventId,
            'user_id' => $request->user()->id,
            'parent_id' => $request->parent_id,
            'content' => $content,
        ]);

        $comment->load('user:id,name,email');

        return response()->json([
            'id' => $comment->id,
            'content' => $comment->content,
            'user' => ['id' => $comment->user->id, 'name' => $comment->user->name],
            'likes_count' => 0,
            'dislikes_count' => 0,
            'user_vote' => null,
            'replies' => [],
            'created_at' => $comment->created_at->toISOString(),
        ], 201);
    }

    public function vote(int $commentId, Request $request): JsonResponse
    {
        $request->validate(['vote_type' => 'required|in:like,dislike']);

        $userId = $request->user()->id;
        $comment = Comment::findOrFail($commentId);

        $existing = DB::table('comment_votes')
            ->where('comment_id', $commentId)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            if ($existing->vote_type === $request->vote_type) {
                // Remove vote
                DB::table('comment_votes')->where('id', $existing->id)->delete();
                $comment->decrement($existing->vote_type === 'like' ? 'likes_count' : 'dislikes_count');
                return response()->json([
                    'likes_count' => $comment->fresh()->likes_count,
                    'dislikes_count' => $comment->fresh()->dislikes_count,
                    'user_vote' => null,
                ]);
            }
            // Change vote
            DB::table('comment_votes')->where('id', $existing->id)->update([
                'vote_type' => $request->vote_type,
                'updated_at' => now(),
            ]);
            $comment->decrement($existing->vote_type === 'like' ? 'likes_count' : 'dislikes_count');
            $comment->increment($request->vote_type === 'like' ? 'likes_count' : 'dislikes_count');
        } else {
            DB::table('comment_votes')->insert([
                'comment_id' => $commentId,
                'user_id' => $userId,
                'vote_type' => $request->vote_type,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $comment->increment($request->vote_type === 'like' ? 'likes_count' : 'dislikes_count');
        }

        return response()->json([
            'likes_count' => $comment->fresh()->likes_count,
            'dislikes_count' => $comment->fresh()->dislikes_count,
            'user_vote' => $request->vote_type,
        ]);
    }

    public function destroy(int $commentId, Request $request): JsonResponse
    {
        $comment = Comment::findOrFail($commentId);

        if ($comment->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Yetkisiz işlem.'], 403);
        }

        $comment->update(['is_deleted' => true, 'content' => '[Bu yorum silindi]']);

        return response()->json(['message' => 'Yorum silindi.']);
    }
}
