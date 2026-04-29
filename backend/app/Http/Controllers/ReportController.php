<?php
namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private const COUNTRY_NAMES = [
        'TR' => 'Türkiye', 'US' => 'ABD', 'GB' => 'İngiltere', 'DE' => 'Almanya',
        'RU' => 'Rusya',   'CN' => 'Çin', 'IR' => 'İran',      'IL' => 'İsrail',
        'SA' => 'Suudi Arabistan', 'EG' => 'Mısır',
    ];

    private const CAT_LABELS = [
        'siyaset' => 'Siyaset', 'ekonomi' => 'Ekonomi', 'savas-catisma' => 'Savaş/Çatışma',
        'diplomasi' => 'Diplomasi', 'teknoloji' => 'Teknoloji', 'saglik' => 'Sağlık',
        'cevre' => 'Çevre', 'spor' => 'Spor', 'kultur' => 'Kültür', 'diger' => 'Diğer',
    ];

    // POST /api/admin/reports/generate
    public function generate(Request $request): JsonResponse
    {
        $request->validate(['type' => 'required|in:weekly,monthly']);
        $type = $request->input('type');

        $focus      = $request->input('focus', 'all');
        $countries  = $request->input('countries', []);
        $categories = $request->input('categories', []);
        $current    = (bool) $request->input('current', false);
        $force      = (bool) $request->input('force', false);

        $args = ['type' => $type];
        if ($focus && $focus !== 'all') $args['--focus'] = $focus;
        if (!empty($countries))         $args['--countries']  = implode(',', $countries);
        if (!empty($categories))        $args['--categories'] = implode(',', $categories);
        if ($current)                   $args['--current'] = true;
        if ($force)                     $args['--force']   = true;

        try {
            Artisan::call('haber:generate-report', $args);
            $output = Artisan::output();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Report generation failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Rapor üretimi başarısız: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'success' => true,
            'message' => trim($output) ?: 'Rapor üretimi tamamlandı.',
        ]);
    }

    // GET /api/reports/sample — public, giriş gerektirmez
    public function sample(): JsonResponse
    {
        /** @var object|null $report */
        $report = DB::table('reports')->orderByDesc('created_at')->first();
        if (!$report) {
            return response()->json(['message' => 'Henüz rapor yok.'], 404);
        }
        $data = (array) $report;
        if (is_string($data['content'])) {
            $data['content'] = json_decode($data['content'], true) ?? [];
        }
        return response()->json($data);
    }

    // GET /api/reports
    public function index(): JsonResponse
    {
        $reports = DB::table('reports')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($report) {
                if (is_string($report->content)) {
                    $report->content = json_decode($report->content, true) ?? [];
                }
                unset($report->html_content);
                return $report;
            });

        return response()->json(['reports' => $reports]);
    }

    // GET /api/reports/{id}
    public function show(int $id): JsonResponse
    {
        $report = DB::table('reports')->find($id);
        if (!$report) {
            return response()->json(['message' => 'Rapor bulunamadı.'], 404);
        }

        if (is_string($report->content)) {
            $report->content = json_decode($report->content, true) ?? [];
        }

        return response()->json($report);
    }

    // GET /api/reports/{id}/pdf
    public function pdf(int $id)
    {
        $report = DB::table('reports')->find($id);
        if (!$report) {
            return response()->json(['message' => 'Rapor bulunamadı.'], 404);
        }

        $content = is_string($report->content)
            ? (json_decode($report->content, true) ?? [])
            : (array) $report->content;

        $typeLabel   = $report->type === 'weekly' ? 'Haftalık Rapor' : 'Aylık Rapor';
        $periodStart = new \DateTime($report->period_start);
        $periodEnd   = new \DateTime($report->period_end);

        if ($report->type === 'monthly') {
            $periodLabel = $this->trMonth((int) $periodStart->format('n')) . ' ' . $periodStart->format('Y');
        } else {
            $periodLabel = $periodStart->format('d') . ' '
                . $this->trMonth((int) $periodStart->format('n'))
                . ' – '
                . $periodEnd->format('d') . ' '
                . $this->trMonth((int) $periodEnd->format('n')) . ' '
                . $periodEnd->format('Y');
        }

        $html     = $this->buildPdfHtml($report->title, $typeLabel, $periodLabel, $content);
        // Sanitize filename — only safe ASCII chars
        $safeDate = preg_replace('/[^a-z0-9\-]/', '', strtolower(trim((string) $report->period_start)));
        $filename = 'medyaizle-rapor-' . $safeDate . '.pdf';

        $pdfContent = Pdf::loadHtml($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'dpi'                       => 150,
                'defaultFont'               => 'DejaVu Sans',
                'isHtml5ParserEnabled'      => true,
                'isRemoteEnabled'           => false,
                'isFontSubsettingEnabled'   => true,
            ])
            ->output();

        return response()->streamDownload(
            function () use ($pdfContent) { echo $pdfContent; },
            $filename,
            ['Content-Type' => 'application/pdf']
        );
    }

    // ── PDF HTML ─────────────────────────────────────────────────────

    private function buildPdfHtml(string $title, string $typeLabel, string $periodLabel, array $c): string
    {
        $summary    = htmlspecialchars($c['summary'] ?? '');
        $trendNote  = htmlspecialchars($c['trend_note'] ?? '');
        $highlights = $c['highlights'] ?? [];
        $stats      = $c['stats'] ?? [];
        $topEvents  = $c['top_events'] ?? [];
        $catDist    = $c['category_distribution'] ?? [];
        $countryList = $c['country_coverage'] ?? [];
        $biasComp   = $c['bias_comparison'] ?? [];
        $silence    = $c['silence_count'] ?? 0;
        $createdAt  = date('d.m.Y');

        // İstatistik kutuları
        $statsHtml = '';
        foreach ([
            ['📰', $stats['events']    ?? 0, 'Haber'],
            ['📄', $stats['articles']  ?? 0, 'Makale'],
            ['📡', $stats['sources']   ?? 0, 'Kaynak'],
            ['🌍', $stats['countries'] ?? 0, 'Ülke'],
        ] as [$icon, $val, $label]) {
            $statsHtml .= <<<HTML
<td style="width:25%;text-align:center;padding:14px 8px;background:#f0f4ff;border-radius:8px;border:1px solid #dbeafe">
  <div style="font-size:20px;margin-bottom:4px">{$icon}</div>
  <div style="font-size:22px;font-weight:800;color:#1d4ed8">{$val}</div>
  <div style="font-size:10px;color:#6b7280;font-weight:600;margin-top:2px">{$label}</div>
</td>
HTML;
        }

        // Öne çıkan bulgular
        $highlightsHtml = '';
        foreach ($highlights as $i => $h) {
            $num = $i + 1;
            $highlightsHtml .= <<<HTML
<tr>
  <td style="width:24px;padding:8px 6px 8px 0;vertical-align:top">
    <span style="display:inline-block;width:22px;height:22px;background:#1d4ed8;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700">{$num}</span>
  </td>
  <td style="padding:8px 0;font-size:12px;color:#374151;line-height:1.6;border-bottom:1px solid #f3f4f6">{$h}</td>
</tr>
HTML;
        }

        // En önemli haberler
        $eventsHtml = '';
        foreach (array_slice($topEvents, 0, 10) as $i => $e) {
            $num     = $i + 1;
            $etitle  = htmlspecialchars($e['title'] ?? '');
            $ecat    = htmlspecialchars(self::CAT_LABELS[$e['category'] ?? ''] ?? ucfirst($e['category'] ?? ''));
            $bgColor = $i % 2 === 0 ? '#f9fafb' : '#ffffff';
            $eventsHtml .= <<<HTML
<tr style="background:{$bgColor}">
  <td style="width:24px;padding:8px 10px;font-size:11px;font-weight:700;color:#9ca3af;text-align:center">{$num}</td>
  <td style="padding:8px 10px;font-size:12px;color:#111827;line-height:1.45;font-weight:500">{$etitle}</td>
  <td style="padding:8px 10px;white-space:nowrap">
    <span style="font-size:10px;font-weight:600;color:#1d4ed8;background:#dbeafe;padding:2px 7px;border-radius:4px">{$ecat}</span>
  </td>
</tr>
HTML;
        }

        // Kategori bar chart
        $catHtml = '';
        foreach (array_slice($catDist, 0, 8) as $cat) {
            $pct   = min((int)($cat['pct'] ?? 0), 100);
            $label = htmlspecialchars($cat['label'] ?? '');
            $count = (int)($cat['count'] ?? 0);
            $barW  = max(4, $pct);
            $catHtml .= <<<HTML
<tr>
  <td style="width:110px;padding:5px 8px 5px 0;font-size:11px;color:#374151;font-weight:600">{$label}</td>
  <td style="padding:5px 0">
    <div style="background:#e5e7eb;border-radius:3px;height:10px;width:100%">
      <div style="background:#1d4ed8;border-radius:3px;height:10px;width:{$barW}%"></div>
    </div>
  </td>
  <td style="width:70px;padding:5px 0 5px 8px;font-size:11px;color:#6b7280;text-align:right">{$count} haber ({$pct}%)</td>
</tr>
HTML;
        }

        // Ülke kapsamı
        $maxCnt     = max(array_column($countryList, 'count') ?: [1]);
        $countryHtml = '';
        foreach (array_slice($countryList, 0, 10) as $cov) {
            $pct   = $maxCnt > 0 ? round($cov['count'] / $maxCnt * 100) : 0;
            $name  = htmlspecialchars($cov['name'] ?? '');
            $count = (int)($cov['count'] ?? 0);
            $barW  = max(4, $pct);
            $countryHtml .= <<<HTML
<tr>
  <td style="width:130px;padding:5px 8px 5px 0;font-size:11px;color:#374151;font-weight:600">{$name}</td>
  <td style="padding:5px 0">
    <div style="background:#e5e7eb;border-radius:3px;height:10px;width:100%">
      <div style="background:#7c3aed;border-radius:3px;height:10px;width:{$barW}%"></div>
    </div>
  </td>
  <td style="width:70px;padding:5px 0 5px 8px;font-size:11px;color:#6b7280;text-align:right">{$count} haber</td>
</tr>
HTML;
        }

        // Kutuplaşma
        $biasHtml = '';
        if (!empty($biasComp['pro_gov']) || !empty($biasComp['opposition'])) {
            $proList = htmlspecialchars(implode(', ', $biasComp['pro_gov'] ?? []));
            $oppList = htmlspecialchars(implode(', ', $biasComp['opposition'] ?? []));
            $biasHtml = <<<HTML
<h3 style="font-size:13px;font-weight:700;color:#111827;margin:0 0 10px;padding-bottom:6px;border-bottom:2px solid #e5e7eb">⚖️ TR Medya Kutuplaşması</h3>
<table width="100%" style="border-collapse:collapse">
  <tr>
    <td style="width:50%;padding:12px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;vertical-align:top">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#dc2626;margin-bottom:5px">Hükümete Yakın Medya</div>
      <div style="font-size:12px;font-weight:600;color:#111827">{$proList}</div>
    </td>
    <td style="width:4px"></td>
    <td style="width:50%;padding:12px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;vertical-align:top">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#16a34a;margin-bottom:5px">Muhalif Medya</div>
      <div style="font-size:12px;font-weight:600;color:#111827">{$oppList}</div>
    </td>
  </tr>
</table>
HTML;
        }

        // Suskunluk
        $silenceHtml = '';
        if ($silence > 0) {
            $silenceHtml = <<<HTML
<div style="margin-bottom:20px;padding:12px 16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;font-size:12px;color:#374151">
  <strong style="color:#d97706">🔇 Medya Suskunluğu:</strong>
  Bu dönemde uluslararası medyanın ele aldığı <strong>{$silence} haber</strong> Türk medyasında yer bulmadı.
</div>
HTML;
        }

        $trendHtml = $trendNote ? <<<HTML
<div style="margin-top:12px;padding:10px 14px;background:#eff6ff;border-left:3px solid #1d4ed8;border-radius:0 6px 6px 0;font-size:12px;color:#374151">
  <strong style="color:#1d4ed8">📈 Dönem Eğilimi:</strong> {$trendNote}
</div>
HTML : '';

        $titleEsc = htmlspecialchars($title);

        return <<<HTML
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: DejaVu Sans, sans-serif; font-size:12px; color:#111827; background:#fff; }
  .page { padding: 0; }
  .section { margin-bottom:22px; }
  .section-title { font-size:13px; font-weight:700; color:#111827; margin-bottom:10px; padding-bottom:6px; border-bottom:2px solid #e5e7eb; }
  table { border-collapse:collapse; width:100%; }
</style>
</head>
<body>

<!-- KAPAK BAŞLIĞI -->
<div style="background:#1d4ed8;padding:32px 36px 28px;margin-bottom:24px">
  <div style="display:table;width:100%">
    <div style="display:table-cell;vertical-align:middle">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#93c5fd;text-transform:uppercase;margin-bottom:6px">medyaizle.com</div>
      <div style="font-size:11px;font-weight:700;color:#bfdbfe;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">{$typeLabel}</div>
      <h1 style="font-size:20px;font-weight:800;color:#ffffff;line-height:1.3;margin-bottom:8px">{$titleEsc}</h1>
      <div style="font-size:11px;color:#93c5fd">📅 {$periodLabel}</div>
    </div>
    <div style="display:table-cell;text-align:right;vertical-align:middle;white-space:nowrap">
      <div style="font-size:10px;color:#bfdbfe">Oluşturulma tarihi</div>
      <div style="font-size:13px;font-weight:700;color:#ffffff">{$createdAt}</div>
    </div>
  </div>
</div>

<div style="padding:0 36px 36px">

<!-- İSTATİSTİKLER -->
<div class="section">
  <div class="section-title">📊 Dönem İstatistikleri</div>
  <table><tr style="border-spacing:8px">
    {$statsHtml}
  </tr></table>
</div>

<!-- DÖNEM ÖZETİ -->
<div class="section">
  <div class="section-title">📝 Dönem Özeti</div>
  <p style="font-size:12px;line-height:1.8;color:#374151">{$summary}</p>
  {$trendHtml}
</div>

{$silenceHtml}

<!-- ÖNE ÇIKAN BULGULAR -->
<div class="section">
  <div class="section-title">🔍 Öne Çıkan Bulgular</div>
  <table><tbody>{$highlightsHtml}</tbody></table>
</div>

<!-- EN ÖNEMLİ HABERLER -->
<div class="section">
  <div class="section-title">🗞 Dönemin En Önemli Haberleri</div>
  <table>
    <thead>
      <tr style="background:#1d4ed8">
        <th style="padding:7px 10px;font-size:10px;color:#fff;font-weight:700;text-align:center;width:24px">#</th>
        <th style="padding:7px 10px;font-size:10px;color:#fff;font-weight:700;text-align:left">Başlık</th>
        <th style="padding:7px 10px;font-size:10px;color:#fff;font-weight:700;text-align:left;white-space:nowrap">Kategori</th>
      </tr>
    </thead>
    <tbody>{$eventsHtml}</tbody>
  </table>
</div>

<!-- KATEGORİ + ÜLKE yan yana -->
<table style="width:100%;margin-bottom:22px">
<tr style="vertical-align:top">
  <td style="width:48%;padding-right:16px">
    <div class="section-title">📂 Kategori Dağılımı</div>
    <table><tbody>{$catHtml}</tbody></table>
  </td>
  <td style="width:4%"></td>
  <td style="width:48%">
    <div class="section-title">🌍 Ülke Kapsamı</div>
    <table><tbody>{$countryHtml}</tbody></table>
  </td>
</tr>
</table>

<!-- KUTUPLAŞMA -->
{$biasHtml}

<!-- FOOTER -->
<div style="margin-top:32px;padding-top:14px;border-top:1px solid #e5e7eb;display:table;width:100%">
  <div style="display:table-cell;font-size:10px;color:#9ca3af">
    Bu rapor <strong>medyaizle.com</strong> tarafından yapay zeka destekli otomatik analiz ile oluşturulmuştur.
  </div>
  <div style="display:table-cell;text-align:right;font-size:10px;color:#9ca3af;white-space:nowrap">
    © {$createdAt} medyaizle.com
  </div>
</div>

</div>
</body>
</html>
HTML;
    }

    private function trMonth(int $m): string
    {
        return ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][$m] ?? '';
    }
}
