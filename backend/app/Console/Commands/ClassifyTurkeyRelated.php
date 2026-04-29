<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Services\GeminiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ClassifyTurkeyRelated extends Command
{
    protected $signature = 'haber:classify-turkey {--limit=50 : Max events per run}';
    protected $description = 'Classify existing ready events as Turkey-related or not via Gemini';

    public function __construct(private GeminiService $gemini)
    {
        parent::__construct();
    }

    public function handle(): void
    {
        $limit = (int) $this->option('limit');

        // Türk kaynağı olan ama henüz sınıflandırılmamış ready eventler
        $ids = DB::table('events as e')
            ->join('event_articles as ea', 'ea.event_id', '=', 'e.id')
            ->join('articles as a', 'a.id', '=', 'ea.article_id')
            ->join('sources as s', 's.id', '=', 'a.source_id')
            ->where('e.status', 'ready')
            ->whereNull('e.is_turkey_related')
            ->whereNotNull('e.title_tr')
            ->where('s.country_code', 'TR')
            ->select('e.id')
            ->groupBy('e.id')
            ->orderBy('e.id', 'desc')
            ->limit($limit)
            ->pluck('e.id')
            ->toArray();

        if (empty($ids)) {
            $this->info('Sınıflandırılacak event yok.');
            return;
        }

        $this->info(count($ids) . " event sınıflandırılıyor...");
        $bar = $this->output->createProgressBar(count($ids));
        $bar->start();

        $done = 0;
        $failed = 0;

        foreach ($ids as $id) {
            $event = Event::find($id);
            if (!$event) { $bar->advance(); continue; }

            $result = $this->classify($event->title_tr, $event->summary_tr);

            if ($result !== null) {
                $event->update(['is_turkey_related' => $result]);
                $done++;
            } else {
                $failed++;
            }

            $bar->advance();

            // Rate limit: 10 RPM → her istekten sonra kısa bekle
            usleep(150000); // 150ms
        }

        $bar->finish();
        $this->newLine();
        $this->info("Tamamlandı. Başarılı: {$done}, Başarısız: {$failed}");

        $remaining = DB::table('events as e')
            ->join('event_articles as ea', 'ea.event_id', '=', 'e.id')
            ->join('articles as a', 'a.id', '=', 'ea.article_id')
            ->join('sources as s', 's.id', '=', 'a.source_id')
            ->where('e.status', 'ready')
            ->whereNull('e.is_turkey_related')
            ->where('s.country_code', 'TR')
            ->distinct('e.id')
            ->count('e.id');

        if ($remaining > 0) {
            $this->warn("{$remaining} event daha bekliyor.");
        }
    }

    private function classify(string $title, ?string $summary): ?bool
    {
        $summaryPart = $summary ? mb_substr($summary, 0, 200) : '';

        $prompt = <<<PROMPT
Bu haber dogrudan Turkiye ile ilgili mi?
(Turkiye'de gerceklesen, Turkiye'yi veya Turkleri dogrudan etkileyen ya da Turk hukumeti/kurumlarinin taraf oldugu haberler "evet"tir.)

Baslik: {$title}
Ozet: {$summaryPart}

SADECE "evet" veya "hayir" yaz, baska hicbir sey yazma.
PROMPT;

        $response = $this->gemini->generate($prompt, 30);
        if (!$response) return null;

        $answer = mb_strtolower(trim($response));
        // str_starts_with: "evet"/"ev" → true, "hayır"/"hay" → false
        if (str_starts_with($answer, 'ev')) return true;
        if (str_starts_with($answer, 'hay')) return false;

        Log::warning("ClassifyTurkey: belirsiz yanıt '{$answer}' for event title: {$title}");
        return null;
    }
}
