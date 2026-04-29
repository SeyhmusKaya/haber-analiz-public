<?php
use App\Http\Controllers\AdminApiKeyController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminSourceController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\FcmController;
use App\Http\Controllers\AnalysisController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\FactCheckController;
use App\Http\Controllers\InteractionController;
use App\Http\Controllers\LongSummaryController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\NarrativeController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SourceController;
use App\Http\Controllers\StreamController;
use App\Http\Controllers\TensionController;
use App\Http\Controllers\TweetController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\VoteController;
use App\Http\Controllers\SilenceController;
use Illuminate\Support\Facades\Route;

// Public routes (60 requests/minute)
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/popular', [EventController::class, 'popular']);
    Route::get('/events/slider', [EventController::class, 'slider']);
    Route::get('/events/gundem', [EventController::class, 'gundem']);
    Route::get('/events/turkiye-gundem', [EventController::class, 'turkiyeGundem']);
    Route::get('/events/turkiye-kutuplasma', [EventController::class, 'turkiyeKutuplasma']);
    Route::get('/events/most-read', [EventController::class, 'mostRead']);
    Route::get('/events/stats', [EventController::class, 'stats']);
    Route::get('/events/stream', [StreamController::class, 'events']);
    Route::get('/events/{id}', [EventController::class, 'show']);
    Route::get('/events/{id}/related', [EventController::class, 'related']);
    Route::post('/events/{id}/flag-ai', [EventController::class, 'flagAi']);
    Route::get('/events/{eventId}/long-summary', [LongSummaryController::class, 'show']);
    Route::get('/events/{eventId}/silence', [SilenceController::class, 'show']);
    Route::get('/events/{eventId}/comments', [CommentController::class, 'index']);
    Route::get('/tweets', [TweetController::class, 'search']);

    // Newsletter (public subscribe/unsubscribe)
    Route::post('/newsletter/subscribe', [NewsletterController::class, 'subscribe']);
    Route::get('/newsletter/unsubscribe/{token}', [NewsletterController::class, 'unsubscribe']);

    // Sources (public)
    Route::get('/sources', [SourceController::class, 'index']);
    Route::get('/sources/{slug}', [SourceController::class, 'show']);


    // Reports (public sample — en son rapor, giriş gerektirmez)
    Route::get('/reports/sample', [ReportController::class, 'sample']);

    // Tensions (public)
    Route::get('/tensions', [TensionController::class, 'index']);
    Route::get('/tensions/top', [TensionController::class, 'top']);
    Route::get('/tensions/{a}/{b}/articles', [TensionController::class, 'articles']);
    Route::get('/tensions/{a}/{b}', [TensionController::class, 'between']);

    // Votes (public read)
    Route::get('/votes/stats', [VoteController::class, 'stats']);
    Route::get('/votes/country-stats', [VoteController::class, 'countryStats']);
    Route::get('/votes/{eventId}/{countryCode}', [VoteController::class, 'results']);
    Route::post('/votes/tr-bias/{eventId}', [VoteController::class, 'storeTrBias']);
    Route::get('/votes/tr-bias/{eventId}', [VoteController::class, 'trBiasResults']);
    Route::get('/votes/tr-bias-stats', [VoteController::class, 'trBiasStats']);

    // Fact-check (public)
    Route::get('/factcheck/{eventId}', [FactCheckController::class, 'show']);

    // Chat (public - simplified, no history)
    Route::post('/chat', [ChatController::class, 'publicSend']);
    Route::post('/chat/global', [ChatController::class, 'globalChat']);

    // Plan listesi (public)
    Route::get('/subscription/plans', [PaymentController::class, 'plans']);

    // İletişim formu (public, rate limited)
    Route::post('/contact', [ContactController::class, 'store']);

    // FCM token kayıt (mobil uygulama)
    Route::post('/fcm/register', [FcmController::class, 'store']);
});

// Auth routes (10 requests/minute per IP - brute force koruması)
Route::middleware('throttle:10,1')->prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Google OAuth — throttle yok (Google redirect'ten gelir)
Route::prefix('auth')->group(function () {
    Route::get('/google', [AuthController::class, 'googleRedirect']);
    Route::get('/google/callback', [AuthController::class, 'googleCallback']);
});

// Protected routes — require login
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'changePassword']);

    // Analysis requires login
    Route::get('/analysis/{eventId}/{countryCode}', [AnalysisController::class, 'show']);

    // Interactions
    Route::post('/events/{eventId}/read', [InteractionController::class, 'markRead']);
    Route::post('/events/{eventId}/save', [InteractionController::class, 'toggleSave']);
    Route::get('/events/{eventId}/status', [InteractionController::class, 'status']);
    Route::get('/user/saved', [InteractionController::class, 'savedEvents']);

    // Long summary moved to public routes

    // Comments (requires login for write)
    Route::post('/events/{eventId}/comments', [CommentController::class, 'store']);
    Route::post('/comments/{commentId}/vote', [CommentController::class, 'vote']);
    Route::delete('/comments/{commentId}', [CommentController::class, 'destroy']);

    // AI Chat (requires Pro plan)
    Route::middleware('premium:pro')->group(function () {
        Route::post('/chat/{eventId}', [ChatController::class, 'send']);
        Route::get('/chat/{eventId}/history', [ChatController::class, 'history']);
    });

    // Newsletter settings (requires login)
    Route::get('/user/newsletter', [NewsletterController::class, 'settings']);
    Route::put('/user/newsletter', [NewsletterController::class, 'updateSettings']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::get('/user/notification-settings', [NotificationController::class, 'settings']);
    Route::put('/user/notification-settings', [NotificationController::class, 'updateSettings']);

    // Catalogs
    Route::get('/catalogs', [CatalogController::class, 'index']);
    Route::post('/catalogs', [CatalogController::class, 'store']);
    Route::put('/catalogs/{id}', [CatalogController::class, 'update']);
    Route::delete('/catalogs/{id}', [CatalogController::class, 'destroy']);
    Route::post('/catalogs/{catalogId}/events/{eventId}', [CatalogController::class, 'addEvent']);
    Route::delete('/catalogs/{catalogId}/events/{eventId}', [CatalogController::class, 'removeEvent']);
    Route::get('/catalogs/{catalogId}/events', [CatalogController::class, 'events']);
    Route::get('/events/{eventId}/catalogs', [CatalogController::class, 'userCatalogs']);

    // Subscription / Payment
    Route::post('/subscription/checkout', [PaymentController::class, 'checkout']);
    Route::get('/subscription/status', [PaymentController::class, 'status']);
    Route::get('/subscription/history', [PaymentController::class, 'history']);
    Route::get('/subscription/verify/{transactionId}', [PaymentController::class, 'callbackVerify']);
    Route::post('/subscription/installments', [PaymentController::class, 'installments']);
    Route::post('/subscription/cancel', [PaymentController::class, 'cancelSubscription']);

    // Votes (write requires login)
    Route::post('/votes/{eventId}/{countryCode}', [VoteController::class, 'store']);

    // Narrative + Reports (requires Pro)
    Route::middleware('premium:pro')->group(function () {
        Route::get('/narrative/{eventId}', [NarrativeController::class, 'show']);
        Route::get('/reports', [ReportController::class, 'index']);
        Route::get('/reports/{id}', [ReportController::class, 'show']);
    });
    // PDF indir — sadece giriş yeterli (pro kontrolü show'da zaten yapılıyor)
    Route::get('/reports/{id}/pdf', [ReportController::class, 'pdf']);

    // Admin (requires login + admin)
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/health', [AdminController::class, 'health']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/users/{id}', [AdminController::class, 'user']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::post('/users/{id}/change-password', [AdminController::class, 'changeUserPassword']);
        Route::post('/users/{id}/gift-plan', [AdminController::class, 'giftPlan']);
        Route::get('/smtp', [NotificationController::class, 'getSmtp']);
        Route::put('/smtp', [NotificationController::class, 'updateSmtp']);
        Route::post('/smtp/test', [NotificationController::class, 'testSmtp']);
        Route::get('/ai-settings', [NotificationController::class, 'getAiSettings']);
        Route::put('/ai-settings', [NotificationController::class, 'updateAiSettings']);
        Route::post('/ai-settings/test', [NotificationController::class, 'testAiConnection']);
        // Ödeme ayarları
        Route::get('/payment-settings', [PaymentController::class, 'getPaymentSettings']);
        Route::put('/payment-settings', [PaymentController::class, 'updatePaymentSettings']);
        // Abonelik istatistikleri
        Route::get('/subscriptions', [PaymentController::class, 'adminList']);
        Route::get('/subscriptions/stats', [PaymentController::class, 'adminStats']);
        // Rapor üretimi (manuel tetik)
        Route::post('/reports/generate', [ReportController::class, 'generate']);
        // İletişim mesajları
        Route::get('/contact', [ContactController::class, 'index']);
        Route::get('/contact/unread', [ContactController::class, 'unreadCount']);
        Route::put('/contact/{id}/read', [ContactController::class, 'markRead']);
        Route::delete('/contact/{id}', [ContactController::class, 'destroy']);
        // API Anahtarları
        Route::get('/api-keys', [AdminApiKeyController::class, 'index']);
        Route::post('/api-keys', [AdminApiKeyController::class, 'store']);
        Route::put('/api-keys/{id}', [AdminApiKeyController::class, 'update']);
        Route::post('/api-keys/{id}/revoke', [AdminApiKeyController::class, 'revoke']);
        Route::post('/api-keys/{id}/activate', [AdminApiKeyController::class, 'activate']);
        Route::delete('/api-keys/{id}', [AdminApiKeyController::class, 'destroy']);
        // Kaynak Yönetimi
        Route::get('/sources', [AdminSourceController::class, 'index']);
        Route::get('/sources/countries', [AdminSourceController::class, 'countries']);
        Route::post('/sources', [AdminSourceController::class, 'store']);
        Route::get('/sources/{id}', [AdminSourceController::class, 'show']);
        Route::put('/sources/{id}', [AdminSourceController::class, 'update']);
        Route::patch('/sources/{id}/toggle-active', [AdminSourceController::class, 'toggleActive']);
        Route::delete('/sources/{id}', [AdminSourceController::class, 'destroy']);
    });
});

// Webhook - auth olmadan, imza ile doğrulama
Route::post('/payment/webhook', [PaymentController::class, 'webhook']);
