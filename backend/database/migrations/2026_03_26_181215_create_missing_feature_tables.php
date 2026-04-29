<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Jeopolitik gerilim endeksi
        if (!Schema::hasTable('geopolitical_tensions')) {
            Schema::create('geopolitical_tensions', function (Blueprint $table) {
                $table->id();
                $table->char('country_a', 2);
                $table->char('country_b', 2);
                $table->float('tension_score');
                $table->float('sentiment_avg')->nullable();
                $table->integer('article_count')->nullable();
                $table->timestamp('calculated_at')->useCurrent();
                $table->index(['country_a', 'country_b']);
            });
        }

        // Okuyucu oylama
        if (!Schema::hasTable('reader_votes')) {
            Schema::create('reader_votes', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('event_id');
                $table->char('country_code', 2);
                $table->unsignedBigInteger('user_id');
                $table->string('vote', 30); // pro_gov, opposition, both_biased, undecided
                $table->timestamp('created_at')->useCurrent();
                $table->unique(['event_id', 'country_code', 'user_id']);
                $table->index(['event_id', 'country_code']);
                $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }

        // Raporlar
        if (!Schema::hasTable('reports')) {
            Schema::create('reports', function (Blueprint $table) {
                $table->id();
                $table->string('type', 20); // weekly, monthly
                $table->string('title', 255);
                $table->longText('content');
                $table->text('html_content')->nullable();
                $table->string('pdf_url', 500)->nullable();
                $table->date('period_start');
                $table->date('period_end');
                $table->timestamp('created_at')->useCurrent();
            });
        }

        // Fact-check sonuçları
        if (!Schema::hasTable('fact_checks')) {
            Schema::create('fact_checks', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('event_id');
                $table->text('claim');
                $table->string('source', 100)->nullable(); // teyit.org, snopes
                $table->string('rating', 50)->nullable(); // true, false, half-true
                $table->string('source_url', 500)->nullable();
                $table->timestamp('checked_at')->useCurrent();
                $table->index('event_id');
                $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
            });
        }

        // Anlatı takipçisi
        if (!Schema::hasTable('narrative_timeline')) {
            Schema::create('narrative_timeline', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('event_id');
                $table->char('country_code', 2);
                $table->date('date');
                $table->text('narrative_summary')->nullable();
                $table->float('sentiment_score')->nullable();
                $table->float('divergence_score')->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->unique(['event_id', 'country_code', 'date']);
                $table->index(['event_id', 'date']);
                $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
            });
        }

        // Source slug alanı (yoksa ekle) - raw SQL for old MySQL compatibility
        try {
            DB::statement("ALTER TABLE sources ADD COLUMN slug VARCHAR(100) NULL AFTER name");
        } catch (\Exception $e) { /* already exists */ }
        try {
            DB::statement("ALTER TABLE sources ADD COLUMN owner VARCHAR(255) NULL");
        } catch (\Exception $e) {}
        try {
            DB::statement("ALTER TABLE sources ADD COLUMN funding_type VARCHAR(50) NULL");
        } catch (\Exception $e) {}
        try {
            DB::statement("ALTER TABLE sources ADD COLUMN founded_year INT NULL");
        } catch (\Exception $e) {}
        try {
            DB::statement("ALTER TABLE sources ADD COLUMN description TEXT NULL");
        } catch (\Exception $e) {}

        // Events ai_questions alanı
        try {
            DB::statement("ALTER TABLE events ADD COLUMN ai_questions TEXT NULL");
        } catch (\Exception $e) {}

        // Events related_countries + view_count
        try {
            DB::statement("ALTER TABLE events ADD COLUMN related_countries TEXT NULL");
        } catch (\Exception $e) {}
        try {
            DB::statement("ALTER TABLE events ADD COLUMN view_count INT DEFAULT 0");
        } catch (\Exception $e) {}
    }

    public function down(): void
    {
        Schema::dropIfExists('narrative_timeline');
        Schema::dropIfExists('fact_checks');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('reader_votes');
        Schema::dropIfExists('geopolitical_tensions');
    }
};
