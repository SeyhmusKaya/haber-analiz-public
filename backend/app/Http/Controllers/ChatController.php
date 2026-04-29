<?php
namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    // Plan bazlı günlük toplam mesaj limitleri (-1 = sınırsız)
    const PLAN_LIMITS = ['pro' => -1];
    const PER_EVENT_DAILY = 20;
    const TOTAL_DAILY     = 50;

    public function __construct(private GeminiService $gemini) {}

    public function send(Request $request, int $eventId): JsonResponse
    {
        $request->validate(['message' => 'required|string|max:1000']);

        $user  = $request->user();
        $today = now()->startOfDay();

        // Plan bazlı günlük toplam mesaj kontrolü
        $planLimit = self::PLAN_LIMITS[$user->plan ?? 'free'] ?? self::TOTAL_DAILY;

        $totalToday = DB::table('chat_messages')
            ->where('user_id', $user->id)
            ->where('role', 'user')
            ->where('created_at', '>=', $today)
            ->count();

        if ($planLimit !== -1 && $totalToday >= $planLimit) {
            return response()->json([
                'error'   => 'limit_reached',
                'message' => "Günlük " . $planLimit . " mesaj limitine ulaştınız. Yarın tekrar deneyin.",
            ], 429);
        }

        // Aynı haber için günlük mesaj kontrolü
        $eventToday = DB::table('chat_messages')
            ->where('user_id', $user->id)
            ->where('event_id', $eventId)
            ->where('role', 'user')
            ->where('created_at', '>=', $today)
            ->count();

        if ($eventToday >= self::PER_EVENT_DAILY) {
            return response()->json([
                'error'   => 'event_limit_reached',
                'message' => "Bu haber için günlük " . self::PER_EVENT_DAILY . " mesaj limitine ulaştınız.",
            ], 429);
        }

        // Haberi yükle
        $event = Event::with('articles:id,title,summary')->find($eventId);
        if (!$event) {
            return response()->json(['error' => 'Haber bulunamadı.'], 404);
        }

        // Konuşma geçmişini al (son 10 mesaj)
        $history = DB::table('chat_messages')
            ->where('user_id', $user->id)
            ->where('event_id', $eventId)
            ->orderBy('created_at', 'asc')
            ->limit(10)
            ->get(['role', 'message']);

        // Kullanıcı mesajını kaydet
        DB::table('chat_messages')->insert([
            'user_id'    => $user->id,
            'event_id'   => $eventId,
            'role'       => 'user',
            'message'    => $request->message,
            'tokens_used' => 0,
            'created_at' => now(),
        ]);

        // Gemini prompt oluştur
        $prompt = $this->buildPrompt($event, $history->toArray(), $request->message);
        $response = $this->gemini->generate($prompt, 1024);

        if (!$response) {
            return response()->json(['error' => 'Yapay zeka şu an yanıt veremiyor, lütfen tekrar deneyin.'], 503);
        }

        $response = trim($response);

        // AI cevabını kaydet
        DB::table('chat_messages')->insert([
            'user_id'    => $user->id,
            'event_id'   => $eventId,
            'role'       => 'assistant',
            'message'    => $response,
            'tokens_used' => 0,
            'created_at' => now(),
        ]);

        $remaining = $planLimit === -1 ? -1 : $planLimit - $totalToday - 1;

        return response()->json([
            'message'           => $response,
            'daily_remaining'   => $planLimit === -1 ? -1 : max(0, $remaining),
            'event_remaining'   => max(0, self::PER_EVENT_DAILY - $eventToday - 1),
        ]);
    }

    public function history(Request $request, int $eventId): JsonResponse
    {
        $messages = DB::table('chat_messages')
            ->where('user_id', $request->user()->id)
            ->where('event_id', $eventId)
            ->orderBy('created_at', 'asc')
            ->limit(30)
            ->get(['role', 'message', 'created_at']);

        return response()->json(['messages' => $messages]);
    }

    // Public chat - no auth, no history, rate limited by IP
    public function publicSend(Request $request): JsonResponse
    {
        $request->validate([
            'event_id' => 'required|integer',
            'question' => 'required|string|max:500',
        ]);

        $event = Event::with('articles:id,title,summary')->find($request->event_id);
        if (!$event) {
            return response()->json(['error' => 'Haber bulunamadı.'], 404);
        }

        $titles = $event->articles->pluck('title')->take(6)->implode("\n");
        $prompt = <<<PROMPT
Sen Medya İzle'nin yapay zeka asistanısın. Aşağıdaki haber hakkında kullanıcının sorusunu Türkçe olarak yanıtla.

HABER: {$event->title_tr}
KAYNAKLAR:
{$titles}

SORU: {$request->question}

Kısa ve net cevap ver (2-5 cümle). Türkçe yaz. Tarafsız ol.
PROMPT;

        $response = $this->gemini->generate($prompt, 512);

        return response()->json([
            'answer' => $response ?: 'Şu an yanıt veremiyorum, lütfen tekrar deneyin.',
        ]);
    }

    // Global chatbot - no auth, searches event database
    public function globalChat(Request $request): JsonResponse
    {
        $request->validate([
            'message'  => 'required|string|max:500',
            'event_id' => 'nullable|integer',
        ]);

        $query = mb_strtolower($request->message, 'UTF-8');
        $original = $request->message;

        // --- Optional: load current event for context hint ---
        $currentEvent = null;
        if ($request->filled('event_id')) {
            $currentEvent = Event::with('articles:id,title,summary')->find($request->event_id);
        }

        // --- Intent: "güncel / bugün / önemli haberler" ---
        $recentKeywords = ['bugün', 'gündem', 'son haber', 'son dakika', 'önemli haber', 'ne var', 'neler var', 'güncel', 'en önemli', 'manşet', 'gelişme'];
        $isRecentIntent = collect($recentKeywords)->contains(fn($k) => mb_stripos($query, $k, 0, 'UTF-8') !== false);

        // --- Intent: kategori bazlı ---
        $categoryMap = [
            'ekonomi'   => ['ekonomi', 'borsa', 'dolar', 'enflasyon', 'piyasa', 'bütçe', 'faiz'],
            'siyaset'   => ['siyaset', 'hükümet', 'seçim', 'meclis', 'cumhurbaşkan', 'parti'],
            'savas-catisma' => ['savaş', 'çatışma', 'askeri', 'bomba', 'saldırı', 'ordu'],
            'diplomasi' => ['diplomasi', 'dışişleri', 'büyükelçi', 'zirve', 'anlaşma'],
            'teknoloji' => ['teknoloji', 'yapay zeka', 'yazılım', 'uzay', 'bilim'],
        ];

        $detectedCategory = null;
        foreach ($categoryMap as $cat => $keywords) {
            if (collect($keywords)->contains(fn($k) => mb_stripos($query, $k, 0, 'UTF-8') !== false)) {
                $detectedCategory = $cat;
                break;
            }
        }

        // --- Intent: ülke bazlı ---
        $countryMap = [
            'US' => ['abd', 'amerikan', 'trump', 'washington', 'pentagon'],
            'RU' => ['rusya', 'rus', 'putin', 'moskova'],
            'CN' => ['çin', 'çinli', 'pekin'],
            'TR' => ['türkiye', 'türk', 'ankara', 'erdoğan'],
            'IL' => ['israil', 'tel aviv'],
            'IR' => ['iran', 'tahran'],
        ];

        $detectedCountry = null;
        foreach ($countryMap as $cc => $keywords) {
            if (collect($keywords)->contains(fn($k) => mb_stripos($query, $k, 0, 'UTF-8') !== false)) {
                $detectedCountry = $cc;
                break;
            }
        }

        $events = collect();

        // 1. Güncel haber intent'i — importance + recency ile getir
        if ($isRecentIntent && !$detectedCategory && !$detectedCountry) {
            $events = Event::whereNotNull('title_tr')
                ->where('created_at', '>=', now()->subDays(3))
                ->orderByDesc('importance_score')
                ->take(6)
                ->get(['id', 'title_tr', 'summary_tr', 'category', 'importance_score']);

            if ($events->isEmpty()) {
                $events = Event::whereNotNull('title_tr')
                    ->orderByDesc('importance_score')
                    ->take(6)
                    ->get(['id', 'title_tr', 'summary_tr', 'category', 'importance_score']);
            }
        }

        // 2. Kategori bazlı intent
        if ($events->isEmpty() && $detectedCategory) {
            $events = Event::whereNotNull('title_tr')
                ->where('category', $detectedCategory)
                ->where('created_at', '>=', now()->subDays(7))
                ->orderByDesc('importance_score')
                ->take(5)
                ->get(['id', 'title_tr', 'summary_tr', 'category', 'importance_score']);
        }

        // 3. Ülke bazlı intent
        if ($events->isEmpty() && $detectedCountry) {
            $events = Event::whereNotNull('title_tr')
                ->whereHas('articles.source', fn($q) => $q->where('country_code', $detectedCountry))
                ->where('created_at', '>=', now()->subDays(7))
                ->orderByDesc('importance_score')
                ->take(5)
                ->get(['id', 'title_tr', 'summary_tr', 'category', 'importance_score']);
        }

        // 4. Tam cümle araması
        if ($events->isEmpty()) {
            $events = Event::whereNotNull('title_tr')
                ->where(function ($q) use ($original) {
                    $q->where('title_tr', 'LIKE', '%' . $original . '%')
                      ->orWhere('summary_tr', 'LIKE', '%' . $original . '%');
                })
                ->orderByDesc('importance_score')
                ->take(5)
                ->get(['id', 'title_tr', 'summary_tr', 'category', 'importance_score']);
        }

        // 5. Kelime kelime arama (anlam taşıyan kelimeler)
        if ($events->isEmpty()) {
            $stopWords = ['neler', 'nedir', 'nasıl', 'olan', 'için', 'ile', 'var', 'mı', 'mi', 'bu', 'bir', 've', 've', 'de', 'da', 'en', 'çok'];
            $words = array_filter(
                preg_split('/\s+/', $original),
                fn($w) => mb_strlen($w, 'UTF-8') >= 4 && !in_array(mb_strtolower($w, 'UTF-8'), $stopWords)
            );
            if (!empty($words)) {
                $qb = Event::whereNotNull('title_tr')
                    ->where('created_at', '>=', now()->subDays(30));
                foreach (array_slice($words, 0, 3) as $word) {
                    $qb->where(function ($q) use ($word) {
                        $q->where('title_tr', 'LIKE', '%' . $word . '%')
                          ->orWhere('summary_tr', 'LIKE', '%' . $word . '%');
                    });
                }
                $events = $qb->orderByDesc('importance_score')->take(5)
                    ->get(['id', 'title_tr', 'summary_tr', 'category', 'importance_score']);
            }
        }

        $context = $events->map(fn($e) =>
            '- [' . strtoupper($e->category ?? 'genel') . '] ' . $e->title_tr .
            ($e->summary_tr ? ': ' . mb_substr($e->summary_tr, 0, 250, 'UTF-8') : '')
        )->implode("\n");

        $contextNote = $isRecentIntent
            ? "Bu liste son günlerin en önemli haberlerini içermektedir."
            : "Bu liste kullanıcının sorusuyla ilgili haberlerdir.";

        $noNewsInstruction = $events->isEmpty()
            ? "Veritabanında şu an ilgili haber bulunamadı. Bunu nazikçe belirt ve kullanıcıyı arama sayfasına yönlendir."
            : "";

        // Build current event context block if available
        $currentEventBlock = '';
        if ($currentEvent) {
            $eventTitles = $currentEvent->articles->pluck('title')->take(5)->implode("\n");
            $eventSummary = mb_substr($currentEvent->summary_tr ?? '', 0, 400, 'UTF-8');
            $currentEventBlock = <<<BLOCK

KULLANICININ ŞUAN OKUDUĞU HABER (Bağlam ipucu — kullanıcı bu haberle ilgili soru sormuş olabilir):
Başlık: {$currentEvent->title_tr}
Özet: {$eventSummary}
Kaynaklar: {$eventTitles}

BLOCK;
        }

        $prompt = <<<PROMPT
Sen Medya İzle'nin yapay zeka asistanısın. Türkçe yanıt verirsin. Kullanıcının sorusu haber ile ilgili olabilir, genel bir soru da olabilir.
{$currentEventBlock}
{$contextNote}
İLGİLİ HABERLER:
{$context}

KULLANICI SORUSU: {$original}

Yanıt kuralları:
- Eğer soru haberlerle ilgiliyse haber içeriklerine dayan
- Eğer soru genel bilgi veya başka bir konuysa genel bilginle yardımcı ol, "haberimiz yok" deme
- 3-5 cümle ile net ve bilgilendirici yanıt ver
- {$noNewsInstruction}
- Tarafsız, akıcı Türkçe kullan
PROMPT;

        $response = $this->gemini->generate($prompt, 1200);

        return response()->json([
            'answer' => $response ?: 'Şu an yanıt veremiyorum, lütfen tekrar deneyin.',
            'events' => $events->map(fn($e) => [
                'id'       => $e->id,
                'title_tr' => $e->title_tr,
                'category' => $e->category,
            ])->values(),
        ]);
    }

    private function buildPrompt(Event $event, array $history, string $userMessage): string
    {
        $titles = $event->articles
            ->pluck('title')
            ->take(8)
            ->implode("\n");

        $summaries = $event->articles
            ->pluck('summary')
            ->filter()
            ->take(4)
            ->map(fn($s) => mb_substr($s, 0, 300))
            ->implode("\n---\n");

        $historyText = '';
        foreach ($history as $msg) {
            $role = $msg->role === 'user' ? 'Kullanıcı' : 'Asistan';
            $historyText .= "{$role}: {$msg->message}\n";
        }

        return <<<PROMPT
Sen Medya İzle'nin yapay zeka asistanısın. Aşağıdaki haber hakkında kullanıcının sorularını Türkçe olarak yanıtlıyorsun.

HABER BAŞLIĞI: {$event->title_tr}
HABER KATEGORİSİ: {$event->category}

HABER BAŞLIKLARI:
{$titles}

HABER ÖZETLERİ:
{$summaries}

KONUŞMA GEÇMİŞİ:
{$historyText}

Kullanıcı: {$userMessage}

KURALAR:
- Sadece bu haberle ilgili soruları yanıtla
- Tarafsız ve bilgilendirici ol
- Kısa ve net cevaplar ver (2-5 cümle yeterli)
- Bilmiyorsan "Bu konuda yeterli bilgim yok" de
- Asla yalan söyleme
- Türkçe yaz

Asistan:
PROMPT;
    }
}
