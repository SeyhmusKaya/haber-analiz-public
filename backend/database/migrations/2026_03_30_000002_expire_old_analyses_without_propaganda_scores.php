<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        // propaganda_scores kolonu eklendikten sonra mevcut cache'leri geçersiz kıl
        // Böylece bir sonraki analiz isteğinde Gemini yeniden üretir ve skoru da ekler
        DB::table('analyses')
            ->whereNull('propaganda_scores')
            ->update(['expires_at' => now()->subHour()]);
    }

    public function down(): void {}
};
