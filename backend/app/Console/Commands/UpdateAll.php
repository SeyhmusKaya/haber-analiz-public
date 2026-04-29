<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;

class UpdateAll extends Command
{
    protected $signature = 'haber:update {--skip-images : Resim çekmeyi atla}';
    protected $description = 'Tüm veri güncelleme pipeline: fetch → embed → cluster → analyze → images';

    public function handle(): int
    {
        $start = microtime(true);

        $this->info('=== HABER GUNCELLEME PIPELINE ===');
        $this->newLine();

        // 1. RSS Fetch
        $this->info('[1/5] RSS makaleler çekiliyor...');
        $this->call('haber:fetch');
        $this->newLine();

        // 2. Embedding
        $this->info('[2/5] Embedding üretiliyor...');
        $this->call('haber:embed');
        $this->newLine();

        // 3. Clustering
        $this->info('[3/5] Haberler kümeleniyor...');
        $this->call('haber:cluster');
        $this->newLine();

        // 4. Analyze
        $this->info('[4/5] AI analiz yapılıyor (20x paralel)...');
        $this->call('haber:analyze', ['--limit' => 200, '--parallel' => 20]);
        $this->newLine();

        // 5. Images
        if (!$this->option('skip-images')) {
            $this->info('[5/5] Resimler çekiliyor...');
            $this->call('haber:images');
        } else {
            $this->info('[5/5] Resimler atlandı (--skip-images)');
        }

        $elapsed = round(microtime(true) - $start, 1);
        $this->newLine();
        $this->info("=== TAMAMLANDI ({$elapsed} saniye) ===");

        return 0;
    }
}
