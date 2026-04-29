<?php
namespace App\Http\Controllers;

use App\Models\User;
use App\Services\MailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name'  => 'required|string|max:100',
            'email' => 'required|email|unique:users',
            'password' => ['required', 'string', PasswordRule::min(8)->mixedCase()->numbers()],
            'phone' => 'nullable|string|max:20',
            'age'   => 'nullable|integer|min:13|max:120',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => $request->password,
            'phone'    => $request->phone,
            'age'      => $request->age,
        ]);

        $token = $user->createToken('auth', ['*'], now()->addDays(7))->plainTextToken;

        return response()->json(['user' => $this->userData($user), 'token' => $token], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'E-posta veya şifre hatalı.'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['error' => 'Hesabınız askıya alınmıştır.'], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth', ['*'], now()->addDays(7))->plainTextToken;

        return response()->json(['user' => $this->userData($user), 'token' => $token]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Çıkış yapıldı.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->userData($request->user()));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name'  => 'sometimes|string|max:100',
            'phone' => 'sometimes|nullable|string|max:20',
            'age'   => 'sometimes|nullable|integer|min:13|max:120',
        ]);

        $user->update($request->only('name', 'phone', 'age'));

        return response()->json($this->userData($user));
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => ['required', 'string', PasswordRule::min(8)->mixedCase()->numbers()],
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['error' => 'Mevcut şifre yanlış.'], 422);
        }

        $user->update(['password' => $request->password]);

        return response()->json(['message' => 'Şifre güncellendi.']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        // Kullanıcı bulunamasa bile güvenlik gereği aynı yanıtı döndür
        if (!$user) {
            return response()->json(['message' => 'E-posta adresiniz sistemde kayıtlıysa sıfırlama bağlantısı gönderildi.']);
        }

        $token = Str::random(64);
        $email = $user->email;

        DB::table('password_reset_tokens')->upsert(
            ['email' => $email, 'token' => Hash::make($token), 'created_at' => now()],
            ['email'],
            ['token', 'created_at']
        );

        $resetUrl  = env('FRONTEND_URL', 'https://medyaizle.com') . '/sifre-sifirla?token=' . $token . '&email=' . urlencode($email);
        $name      = $user->name ?? $email;
        $escapedUrl = htmlspecialchars($resetUrl);

        $body = <<<HTML
<h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1e293b;">Şifre Sıfırlama</h2>
<p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
  Merhaba <strong>{$name}</strong>,<br>
  Medya İzle hesabınız için şifre sıfırlama talebinde bulundunuz.
  Aşağıdaki butona tıklayarak yeni şifrenizi belirleyin.
</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
  <tr>
    <td align="center">
      <a href="{$escapedUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
        Şifremi Sıfırla →
      </a>
    </td>
  </tr>
</table>
<p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">
  Bu bağlantı 60 dakika geçerlidir.
</p>
<p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
  Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
</p>
HTML;

        try {
            $mail = new MailService();
            $mail->send($email, $name, 'Şifre Sıfırlama — Medya İzle', $mail->wrapTemplate('Şifre Sıfırlama', $body));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Şifre sıfırlama maili gönderilemedi: ' . $e->getMessage());
            return response()->json(['error' => 'Mail gönderilemedi. Lütfen daha sonra tekrar deneyin.'], 500);
        }

        return response()->json(['message' => 'Şifre sıfırlama bağlantısı e-postanıza gönderildi.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => ['required', 'string', PasswordRule::min(8)->mixedCase()->numbers()],
        ]);

        /** @var object{token: string, created_at: string}|null $record */
        $record = DB::table('password_reset_tokens')->where('email', $request->email)->first();

        if (!$record || !Hash::check($request->token, (string) $record->token)) {
            return response()->json(['error' => 'Geçersiz veya süresi dolmuş bağlantı.'], 422);
        }

        // 60 dakika geçerlilik süresi
        if (now()->diffInMinutes((string) $record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['error' => 'Bağlantının süresi dolmuş. Lütfen tekrar şifre sıfırlama isteği gönderin.'], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['error' => 'Kullanıcı bulunamadı.'], 404);
        }

        $user->forceFill(['password' => $request->password, 'remember_token' => Str::random(60)])->save();
        $user->tokens()->delete();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz.']);
    }

    // Google OAuth — redirect
    public function googleRedirect(): \Symfony\Component\HttpFoundation\RedirectResponse
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    // Google OAuth — callback
    public function googleCallback()
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Google OAuth error: ' . $e->getMessage());
            return redirect($frontendUrl . '/giris?error=google_failed');
        }

        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if ($user) {
            $user->update([
                'google_id' => $googleUser->getId(),
                'avatar'    => $googleUser->getAvatar(),
            ]);
        } else {
            $user = User::create([
                'google_id' => $googleUser->getId(),
                'name'      => $googleUser->getName(),
                'email'     => $googleUser->getEmail(),
                'avatar'    => $googleUser->getAvatar(),
                'password'  => bcrypt(Str::random(32)),
                'is_active' => true,
            ]);
        }

        if (!$user->is_active) {
            return redirect($frontendUrl . '/giris?error=account_suspended');
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth', ['*'], now()->addDays(7))->plainTextToken;

        return redirect($frontendUrl . '/auth/callback?token=' . $token);
    }

    private function userData(User $user): array
    {
        return [
            'id'       => $user->id,
            'name'     => $user->name,
            'email'    => $user->email,
            'phone'    => $user->phone,
            'age'      => $user->age,
            'avatar'   => $user->avatar,
            'is_admin' => $user->is_admin,
        ];
    }
}
