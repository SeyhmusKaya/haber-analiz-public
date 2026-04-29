<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sources', function (Blueprint $table) {
            $table->tinyInteger('importance_score')->default(10)->after('is_active'); // 0-10 arası önem derecesi
            $table->string('site_url', 500)->nullable()->after('rss_url');            // Kaynak site URL'si
        });

        // Mevcut tüm kaynaklara 10 önem derecesi ver
        \DB::table('sources')->update(['importance_score' => 10]);
    }

    public function down(): void
    {
        Schema::table('sources', function (Blueprint $table) {
            $table->dropColumn(['importance_score', 'site_url']);
        });
    }
};
