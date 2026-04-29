<?php
namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Mailer\Mailer as SymfonyMailer;
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email as SymfonyEmail;

class MailService
{
    private array $smtp;

    public function __construct()
    {
        $keys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_email', 'smtp_from_name'];
        $raw  = DB::table('admin_settings')->whereIn('key', $keys)->pluck('value', 'key');

        $this->smtp = [
            'host'       => $raw['smtp_host']       ?? '',
            'port'       => (int) ($raw['smtp_port'] ?? 465),
            'username'   => $raw['smtp_user']        ?? '',
            'password'   => $raw['smtp_pass']        ?? '',
            'from_email' => $raw['smtp_from_email']  ?? '',
            'from_name'  => $raw['smtp_from_name']   ?? 'Medya İzle',
        ];
    }

    public function isConfigured(): bool
    {
        return !empty($this->smtp['host'])
            && !empty($this->smtp['username'])
            && !empty($this->smtp['from_email']);
    }

    /**
     * Send an HTML email.
     * Returns true on success, throws on failure.
     */
    public function send(string $to, string $toName, string $subject, string $htmlBody): bool
    {
        if (!$this->isConfigured()) {
            throw new \RuntimeException('SMTP ayarları eksik. Lütfen admin panelden SMTP ayarlarını yapılandırın.');
        }

        $user = rawurlencode($this->smtp['username']);
        $pass = rawurlencode($this->smtp['password']);
        $scheme = $this->smtp['port'] === 465 ? 'smtps' : 'smtp';
        $dsn    = "{$scheme}://{$user}:{$pass}@{$this->smtp['host']}:{$this->smtp['port']}";

        try {
            $transport = Transport::fromDsn($dsn);
            $mailer    = new SymfonyMailer($transport);

            $email = (new SymfonyEmail())
                ->from(new Address($this->smtp['from_email'], $this->smtp['from_name']))
                ->to(new Address($to, $toName ?: $to))
                ->subject($subject)
                ->html($htmlBody);

            $mailer->send($email);
            return true;
        } catch (\Throwable $e) {
            Log::error("MailService send failed: " . $e->getMessage());
            throw $e;
        }
    }

    // ─── HTML Template Builder ────────────────────────────────────────────────

    /**
     * Wrap content HTML in the master email template.
     */
    public function wrapTemplate(string $title, string $bodyHtml, ?string $unsubscribeUrl = null): string
    {
        $unsub = $unsubscribeUrl
            ? '<p style="margin:0 0 4px;">İstemiyorsanız <a href="' . htmlspecialchars($unsubscribeUrl) . '" style="color:#6b7280;text-decoration:underline;">aboneliği iptal edin</a>.</p>'
            : '';

        $year = date('Y');

        return <<<HTML
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>{$title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a 0%,#7c3aed 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <div style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;">
                    <span style="font-size:28px;">🌐</span>
                    <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.02em;">Medya İzle</span>
                  </div>
                  <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:0.04em;text-transform:uppercase;">
                    {$title}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            {$bodyHtml}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;color:#64748b;line-height:1.6;">
              Bu e-posta Medya İzle tarafından gönderilmiştir.
            </p>
            {$unsub}
            <p style="margin:12px 0 0;font-size:11px;color:#94a3b8;">
              © {$year} Medya İzle — medyaizle.com
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>
HTML;
    }

    /**
     * Build a newsletter email body for a list of events.
     */
    public function buildNewsletterBody(array $events, string $periodLabel, string $typeLabel): string
    {
        $eventRows = '';
        foreach (array_slice($events, 0, 8) as $i => $event) {
            $title    = htmlspecialchars($event->title_tr ?? '');
            $summary  = htmlspecialchars(mb_substr($event->summary_tr ?? '', 0, 180));
            $category = htmlspecialchars($event->category ?? '');
            $link     = 'https://medyaizle.com/haber/' . $event->id;

            $catColors = [
                'siyaset'       => ['bg' => '#dbeafe', 'color' => '#1d4ed8'],
                'ekonomi'       => ['bg' => '#d1fae5', 'color' => '#065f46'],
                'savas-catisma' => ['bg' => '#fee2e2', 'color' => '#991b1b'],
                'diplomasi'     => ['bg' => '#e0e7ff', 'color' => '#3730a3'],
                'teknoloji'     => ['bg' => '#f0fdf4', 'color' => '#166534'],
            ];
            $catStyle = $catColors[$category] ?? ['bg' => '#f1f5f9', 'color' => '#475569'];

            $divider = $i > 0 ? '<tr><td style="padding:0 0 16px;"><div style="border-top:1px solid #f1f5f9;"></div></td></tr>' : '';

            $eventRows .= <<<ROW
{$divider}
<tr>
  <td style="padding-bottom:20px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:18px 20px;">
          <span style="display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;background:{$catStyle['bg']};color:{$catStyle['color']};margin-bottom:10px;text-transform:uppercase;letter-spacing:0.04em;">
            {$category}
          </span>
          <h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1e293b;line-height:1.4;">
            <a href="{$link}" style="text-decoration:none;color:#1e293b;">{$title}</a>
          </h3>
          <p style="margin:0 0 12px;font-size:13px;color:#64748b;line-height:1.6;">
            {$summary}…
          </p>
          <a href="{$link}" style="display:inline-block;font-size:12px;font-weight:600;color:#2563eb;text-decoration:none;">
            Devamını oku →
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>
ROW;
        }

        $totalCount = count($events);

        return <<<HTML
<h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#1e293b;line-height:1.3;">
  {$typeLabel} Medya Bülteni
</h2>
<p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">
  {$periodLabel} döneminde <strong style="color:#2563eb;">{$totalCount} haber</strong> analiz edildi. İşte öne çıkanlar:
</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  {$eventRows}
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
  <tr>
    <td align="center">
      <a href="https://medyaizle.com" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.01em;">
        Tüm Haberleri Gör →
      </a>
    </td>
  </tr>
</table>
HTML;
    }

    /**
     * Build a welcome email body.
     */
    public function buildWelcomeBody(string $userName): string
    {
        $name = htmlspecialchars($userName);
        return <<<HTML
<h2 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#1e293b;">
  Hoş geldiniz, {$name}! 🎉
</h2>
<p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
  Medya İzle'ye üye olduğunuz için teşekkür ederiz. Artık dünya medyasını yandaş ve muhalif gözlerden
  karşılaştırmalı olarak takip edebilirsiniz.
</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
  {$this->featureRow('🌍', 'Dünya Perspektifi', '10 ülkenin yandaş ve muhalif medyasını karşılaştırın.')}
  {$this->featureRow('🤖', 'Yapay Zeka Analizi', 'Gemini AI ile üretilmiş Türkçe özetler ve analizler.')}
  {$this->featureRow('📊', 'Medya Raporları', 'Haftalık ve aylık medya analiz raporlarına erişin.')}
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center">
      <a href="https://medyaizle.com" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
        Haber Okumaya Başla →
      </a>
    </td>
  </tr>
</table>
HTML;
    }

    /**
     * Build a test email body.
     */
    public function buildTestBody(): string
    {
        return <<<HTML
<h2 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#1e293b;">
  ✅ SMTP Bağlantısı Başarılı!
</h2>
<p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">
  Bu e-posta, Medya İzle admin panelinden gönderilen bir test mesajıdır.
  SMTP ayarlarınız doğru yapılandırılmıştır.
</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:16px;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="margin:0;font-size:14px;color:#166534;font-weight:600;">
        🎉 Bildirimler ve bültenler artık bu SMTP üzerinden iletilecek.
      </p>
    </td>
  </tr>
</table>
<p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
  Gönderim zamanı: {$this->now()}
</p>
HTML;
    }

    private function featureRow(string $icon, string $title, string $desc): string
    {
        $title = htmlspecialchars($title);
        $desc  = htmlspecialchars($desc);
        return <<<ROW
<tr>
  <td style="padding:8px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:14px 16px;width:40px;vertical-align:top;">
          <span style="font-size:22px;">{$icon}</span>
        </td>
        <td style="padding:14px 16px 14px 0;vertical-align:top;">
          <strong style="font-size:14px;color:#1e293b;display:block;margin-bottom:3px;">{$title}</strong>
          <span style="font-size:13px;color:#64748b;">{$desc}</span>
        </td>
      </tr>
    </table>
  </td>
</tr>
ROW;
    }

    private function now(): string
    {
        return now()->setTimezone('Europe/Istanbul')->format('d.m.Y H:i:s') . ' (Istanbul)';
    }
}
