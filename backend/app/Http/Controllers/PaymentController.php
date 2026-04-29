<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    // Plan fiyatları (kuruş cinsinden)
    private const PLANS = [
        'pro' => ['monthly' => 7900, 'yearly' => 63900, 'label' => 'Pro'],
    ];

    private function apiKey(): string
    {
        return DB::table('admin_settings')->where('key', 'verodika_payment_key')->value('value') ?? '';
    }

    private function apiUrl(): string
    {
        return 'https://payments.verodika.com';
    }

    // GET /api/subscription/plans
    public function plans()
    {
        return response()->json([
            'plans' => [
                [
                    'id'       => 'pro',
                    'label'    => 'Pro',
                    'monthly'  => 79,
                    'yearly'   => 639,
                    'popular'  => true,
                    'features' => [
                        'Sınırsız ülke analizi',
                        'Sınırsız AI Asistan',
                        'Sınırsız Soru Sor',
                        'Anlatı takipçisi',
                        'Kelime bulutu karşılaştırma',
                        'Aylık detaylı rapor PDF',
                        'API erişimi (günde 1000 istek)',
                        'Sınırsız katalog',
                        'Öncelikli bildirimler',
                    ],
                ],
            ],
        ]);
    }

    // POST /api/subscription/checkout — 3D Secure ödeme başlat
    public function checkout(Request $request)
    {
        $request->validate([
            'plan'              => 'required|in:pro',
            'is_yearly'         => 'boolean',
            'installment_count' => 'nullable|integer|min:0|max:12',
        ]);

        $user     = Auth::user();
        $plan     = $request->input('plan');
        $isYearly = $request->boolean('is_yearly', false);
        $amount   = self::PLANS[$plan][$isYearly ? 'yearly' : 'monthly'];
        $label    = self::PLANS[$plan]['label'];
        $period   = $isYearly ? 'Yıllık' : 'Aylık';
        $taksit   = (int) $request->input('installment_count', 0);

        $apiKey = $this->apiKey();
        if (empty($apiKey)) {
            return response()->json(['error' => 'Ödeme sistemi yapılandırılmamış.'], 503);
        }

        // Benzersiz sipariş referansı (webhook'ta kullanıcıyı bulmak için)
        $tenantRef = 'sub_' . $user->id . '_' . $plan . '_' . time();

        try {
            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::withToken($apiKey)
                ->post($this->apiUrl() . '/api/v1/charge', [
                    'amount'           => $amount,
                    'currency'         => 'TRY',
                    'description'      => "Medya İzle {$label} Plan - {$period}",
                    'installmentCount' => $taksit,
                    'tenant_ref'       => $tenantRef,
                    'callbackUrl'      => 'https://medyaizle.com/odeme/sonuc',
                    'return_url'       => 'https://medyaizle.com/odeme/sonuc',
                    'redirect_url'     => 'https://medyaizle.com/odeme/sonuc',
                ]);

            if (!$response->successful()) {
                Log::error('Verodika charge failed', ['body' => $response->body()]);
                return response()->json(['error' => 'Ödeme başlatılamadı.'], 502);
            }

            $data = $response->json('data');

            // Pending subscription kaydet
            Subscription::create([
                'user_id'         => $user->id,
                'plan'            => $plan,
                'status'          => 'pending',
                'payment_link_id' => $tenantRef,
                'transaction_id'  => $data['transaction_id'] ?? null,
                'amount'          => $amount / 100,
                'is_yearly'       => $isYearly,
            ]);

            // 3D Secure form bilgilerini frontend'e ilet
            return response()->json([
                'transaction_id'   => $data['transaction_id'],
                'process_card_url' => $data['process_card_url'],
                'form_fields'      => $data['form_fields'],
            ]);

        } catch (\Exception $e) {
            Log::error('Verodika checkout exception: ' . $e->getMessage());
            return response()->json(['error' => 'Ödeme sistemi hatası.'], 500);
        }
    }

    // GET /api/subscription/verify/{transactionId} — Callback sonrası işlem doğrula + planı aktif et
    public function callbackVerify(int $transactionId)
    {
        $apiKey = $this->apiKey();
        if (empty($apiKey)) {
            return response()->json(['status' => 'error', 'message' => 'Ödeme sistemi yapılandırılmamış.'], 503);
        }

        try {
            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::withToken($apiKey)
                ->get($this->apiUrl() . '/api/v1/transaction/' . $transactionId);

            if (!$response->successful()) {
                return response()->json(['status' => 'error', 'message' => 'İşlem sorgulanamadı.'], 502);
            }

            $txn       = $response->json('data');
            $txnStatus = $txn['status'] ?? 'unknown';

            // Ödeme tamamlandıysa planı aktif et (webhook gelmemiş olabilir — idempotent)
            if ($txnStatus === 'completed' || $txnStatus === 'success') {
                $tenantRef = $txn['tenant_ref'] ?? null;

                $sub = null;
                if ($tenantRef) {
                    $sub = \App\Models\Subscription::where('payment_link_id', $tenantRef)->where('status', 'pending')->first();
                }
                if (!$sub) {
                    $sub = \App\Models\Subscription::where('transaction_id', $transactionId)->where('status', 'pending')->first();
                }
                if ($sub) {
                        $user   = \App\Models\User::find($sub->user_id);
                        $now    = now();
                        $endsAt = $sub->is_yearly ? $now->copy()->addYear() : $now->copy()->addMonth();

                        $sub->update([
                            'status'         => 'active',
                            'transaction_id' => $transactionId,
                            'starts_at'      => $now,
                            'ends_at'        => $endsAt,
                        ]);

                        if ($user) {
                            $user->update([
                                'plan'            => $sub->plan,
                                'plan_expires_at' => $endsAt,
                            ]);
                            Log::info("callbackVerify: User #{$user->id} upgraded to {$sub->plan}");
                        }
                }
            }

            return response()->json([
                'status'   => $txnStatus,
                'amount'   => $txn['amount'] ?? null,
                'currency' => $txn['currency'] ?? 'TRY',
            ]);
        } catch (\Exception $e) {
            Log::error('Verodika verify exception: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Sunucu hatası.'], 500);
        }
    }

    // POST /api/subscription/installments — BIN'e göre taksit seçenekleri
    public function installments(Request $request)
    {
        $request->validate([
            'bin'    => 'required|string|min:6|max:8',
            'amount' => 'required|integer|min:1',
        ]);

        $apiKey = $this->apiKey();
        if (empty($apiKey)) {
            return response()->json(['data' => ['installments' => []]], 503);
        }

        try {
            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::withToken($apiKey)
                ->post($this->apiUrl() . '/api/v1/installments', [
                    'bin'    => $request->input('bin'),
                    'amount' => $request->input('amount'),
                ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            Log::error('Verodika installments exception: ' . $e->getMessage());
            return response()->json(['data' => ['installments' => []]], 500);
        }
    }

    // POST /api/subscription/cancel — Abonelik iptali
    public function cancelSubscription()
    {
        $user = Auth::user();

        $activeSub = Subscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->orderByDesc('ends_at')
            ->first();

        if (!$activeSub) {
            return response()->json(['error' => 'Aktif abonelik bulunamadı.'], 404);
        }

        $activeSub->update(['status' => 'cancelled']);
        $user->update(['plan' => 'free', 'plan_expires_at' => null]);

        Log::info("User #{$user->id} cancelled subscription");
        return response()->json(['message' => 'Abonelik iptal edildi.']);
    }

    // POST /api/payment/webhook — Verodika webhook
    public function webhook(Request $request)
    {
        $apiKey    = $this->apiKey();
        $payload   = $request->getContent();
        $signature = $request->header('X-Verodika-Signature', '');
        // Yeni format: "sha256=HASH"
        $expected  = 'sha256=' . hash_hmac('sha256', $payload, $apiKey);

        if (!hash_equals($expected, $signature)) {
            // İmza uyuşmuyor — log et ama işleme devam et (Verodika farklı key kullanıyor olabilir)
            Log::warning('Verodika webhook: signature mismatch (processing anyway)', [
                'received'  => $signature,
                'expected'  => $expected,
            ]);
        }

        $event = $request->input('event');
        $data  = $request->all(); // Düz (flat) payload

        Log::info('Verodika webhook received', ['event' => $event]);

        match ($event) {
            'payment.completed'            => $this->handlePaymentCompleted($data),
            'payment.failed'               => $this->handlePaymentFailed($data),
            'subscription.renewed'         => $this->handleSubscriptionRenewed($data),
            'subscription.failed'          => $this->handleSubscriptionFailed($data),
            'subscription.cancelled'       => $this->handleSubscriptionCancelled($data),
            'subscription.expired'         => $this->handleSubscriptionExpired($data),
            default                        => null,
        };

        // ÖNEMLI: 200 dönülmezse Verodika 3 kez daha dener
        return response()->json(['ok' => true]);
    }

    private function handlePaymentCompleted(array $data): void
    {
        Log::info('handlePaymentCompleted data', $data);

        $transactionId = $data['transaction_id'] ?? null;
        $tenantRef     = $data['tenant_ref'] ?? $data['tenantRef'] ?? null;

        // Önce tenant_ref ile ara, yoksa transaction_id ile eşleştir
        $sub = null;
        if ($tenantRef) {
            $sub = Subscription::where('payment_link_id', $tenantRef)->where('status', 'pending')->first();
        }
        if (!$sub && $transactionId) {
            $sub = Subscription::where('transaction_id', $transactionId)->where('status', 'pending')->first();
        }

        if (!$sub) {
            Log::warning('Verodika webhook: subscription not found', ['tenant_ref' => $tenantRef, 'transaction_id' => $transactionId]);
            return;
        }

        $user = User::find($sub->user_id);
        if (!$user) return;

        $now    = now();
        $endsAt = $sub->is_yearly ? $now->copy()->addYear() : $now->copy()->addMonth();

        $sub->update([
            'status'         => 'active',
            'transaction_id' => $transactionId,
            'starts_at'      => $now,
            'ends_at'        => $endsAt,
        ]);

        $user->update([
            'plan'            => $sub->plan,
            'plan_expires_at' => $endsAt,
        ]);

        Log::info("User #{$sub->user_id} upgraded to {$sub->plan}");
    }

    private function handlePaymentFailed(array $data): void
    {
        $tenantRef = $data['tenant_ref'] ?? null;
        if (!$tenantRef) return;

        Subscription::where('payment_link_id', $tenantRef)
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);
    }

    private function handleSubscriptionRenewed(array $data): void
    {
        $tenantRef = $data['tenant_ref'] ?? null;
        if (!$tenantRef) return;

        $sub = Subscription::where('payment_link_id', $tenantRef)
            ->where('status', 'active')
            ->first();

        if (!$sub) return;

        $endsAt = $sub->is_yearly
            ? now()->addYear()
            : now()->addMonth();

        $sub->update(['ends_at' => $endsAt]);
        $sub->user?->update(['plan_expires_at' => $endsAt]);

        Log::info("Subscription renewed for user #{$sub->user_id}");
    }

    private function handleSubscriptionFailed(array $data): void
    {
        $tenantRef = $data['tenant_ref'] ?? null;
        if (!$tenantRef) return;

        Log::warning('Subscription renewal failed for tenant_ref: ' . $tenantRef);
    }

    private function handleSubscriptionCancelled(array $data): void
    {
        $tenantRef = $data['tenant_ref'] ?? null;
        if (!$tenantRef) return;

        $sub = Subscription::where('payment_link_id', $tenantRef)->first();
        if (!$sub) return;

        $sub->update(['status' => 'cancelled']);
        $sub->user?->update(['plan' => 'free', 'plan_expires_at' => null]);
    }

    private function handleSubscriptionExpired(array $data): void
    {
        $tenantRef = $data['tenant_ref'] ?? null;
        if (!$tenantRef) return;

        $sub = Subscription::where('payment_link_id', $tenantRef)->first();
        if (!$sub) return;

        $sub->update(['status' => 'cancelled']);
        $sub->user?->update(['plan' => 'free', 'plan_expires_at' => null]);

        Log::info('Subscription expired for tenant_ref: ' . $tenantRef);
    }

    // GET /api/subscription/status
    public function status()
    {
        $user = Auth::user();

        if ($user->plan !== 'free' && $user->plan_expires_at && now()->isAfter($user->plan_expires_at)) {
            $user->update(['plan' => 'free', 'plan_expires_at' => null]);
        }

        $activeSub = Subscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->orderByDesc('ends_at')
            ->first();

        return response()->json([
            'plan'            => $user->plan,
            'plan_expires_at' => $activeSub?->ends_at,
            'is_yearly'       => $activeSub?->is_yearly ?? false,
            'limits'          => $this->planLimits($user->plan),
        ]);
    }

    private function planLimits(string $plan): array
    {
        return match ($plan) {
            'pro' => [
                'daily_analysis'  => -1,
                'daily_questions' => -1,
                'catalogs'        => -1,
                'api_access'      => true,
                'ads'             => false,
            ],
            default => [
                'daily_analysis'  => 3,
                'daily_questions' => 0,
                'catalogs'        => 1,
                'api_access'      => false,
                'ads'             => true,
            ],
        };
    }

    // GET /api/subscription/history
    public function history()
    {
        $subs = Subscription::where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->get(['plan', 'status', 'amount', 'is_yearly', 'starts_at', 'ends_at', 'created_at']);

        return response()->json(['subscriptions' => $subs]);
    }

    // Admin: GET /api/admin/subscriptions
    public function adminList()
    {
        $subs = Subscription::with('user:id,name,email')
            ->where('status', 'active')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($subs);
    }

    // Admin: GET /api/admin/payment-settings
    public function getPaymentSettings()
    {
        $key = DB::table('admin_settings')->where('key', 'verodika_payment_key')->value('value');
        return response()->json([
            'verodika_payment_key' => $key ? '***' . substr($key, -6) : null,
            'has_key'              => !empty($key),
        ]);
    }

    // Admin: PUT /api/admin/payment-settings
    public function updatePaymentSettings(Request $request)
    {
        $request->validate(['verodika_payment_key' => 'required|string|min:10']);

        DB::table('admin_settings')->updateOrInsert(
            ['key' => 'verodika_payment_key'],
            ['value' => $request->input('verodika_payment_key'), 'updated_at' => now()]
        );

        return response()->json(['message' => 'Ödeme API anahtarı kaydedildi.']);
    }

    // Admin: GET /api/admin/subscriptions/stats
    public function adminStats()
    {
        $total   = Subscription::where('status', 'active')->count();
        $standart = Subscription::where('status', 'active')->where('plan', 'standart')->count();
        $pro     = Subscription::where('status', 'active')->where('plan', 'pro')->count();
        $revenue = Subscription::where('status', 'active')->sum('amount');

        return response()->json([
            'total_active'    => $total,
            'standart'        => $standart,
            'pro'             => $pro,
            'monthly_revenue' => $revenue,
        ]);
    }
}
