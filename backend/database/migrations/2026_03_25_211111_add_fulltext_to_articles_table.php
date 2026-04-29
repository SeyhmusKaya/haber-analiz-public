<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->longText('full_text')->nullable()->after('summary');
            $table->longText('full_text_tr')->nullable()->after('full_text');
            $table->string('language_detected', 10)->nullable()->after('full_text_tr');
            $table->string('scrape_status', 20)->default('pending')->after('language_detected');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn(['full_text', 'full_text_tr', 'language_detected', 'scrape_status']);
        });
    }
};
