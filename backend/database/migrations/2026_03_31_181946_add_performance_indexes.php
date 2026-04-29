<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        // articles - indexler
        $this->addIndexIfNotExists('articles', 'articles_scrape_status_index', function (Blueprint $table) {
            $table->index('scrape_status');
        });
        $this->addIndexIfNotExists('articles', 'articles_language_detected_index', function (Blueprint $table) {
            $table->index('language_detected');
        });

        // Full-text indexler
        if ($driver === 'pgsql') {
            DB::statement("CREATE INDEX IF NOT EXISTS idx_articles_ft_title ON articles USING GIN(to_tsvector('simple', title))");
            DB::statement("CREATE INDEX IF NOT EXISTS idx_articles_ft_summary ON articles USING GIN(to_tsvector('simple', COALESCE(summary, '')))");
            DB::statement("CREATE INDEX IF NOT EXISTS idx_articles_ft_fulltext_tr ON articles USING GIN(to_tsvector('simple', COALESCE(full_text_tr, '')))");
        } else {
            DB::statement('ALTER TABLE articles ADD FULLTEXT IF NOT EXISTS idx_articles_ft_title (title)');
            DB::statement('ALTER TABLE articles ADD FULLTEXT IF NOT EXISTS idx_articles_ft_summary (summary)');
            DB::statement('ALTER TABLE articles ADD FULLTEXT IF NOT EXISTS idx_articles_ft_fulltext_tr (full_text_tr)');
        }

        // events indexler (view_count kolonu bu tabloda yok, atlanıyor)
        $this->addIndexIfNotExists('events', 'events_category_index', function (Blueprint $table) {
            $table->index('category');
        });
        $this->addIndexIfNotExists('events', 'events_category_created_at_index', function (Blueprint $table) {
            $table->index(['category', 'created_at']);
        });
        $this->addIndexIfNotExists('events', 'events_importance_score_created_at_index', function (Blueprint $table) {
            $table->index(['importance_score', 'created_at']);
        });

        if ($driver === 'pgsql') {
            DB::statement("CREATE INDEX IF NOT EXISTS idx_events_ft_title_tr ON events USING GIN(to_tsvector('simple', title_tr))");
            DB::statement("CREATE INDEX IF NOT EXISTS idx_events_ft_summary_tr ON events USING GIN(to_tsvector('simple', COALESCE(summary_tr, '')))");
        } else {
            DB::statement('ALTER TABLE events ADD FULLTEXT IF NOT EXISTS idx_events_ft_title_tr (title_tr)');
            DB::statement('ALTER TABLE events ADD FULLTEXT IF NOT EXISTS idx_events_ft_summary_tr (summary_tr)');
        }

        // sources indexler
        $this->addIndexIfNotExists('sources', 'sources_country_code_index', function (Blueprint $table) {
            $table->index('country_code');
        });
        $this->addIndexIfNotExists('sources', 'sources_country_code_bias_index', function (Blueprint $table) {
            $table->index(['country_code', 'bias']);
        });
        $this->addIndexIfNotExists('sources', 'sources_is_active_index', function (Blueprint $table) {
            $table->index('is_active');
        });
    }

    private function addIndexIfNotExists(string $table, string $indexName, \Closure $callback): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            $exists = DB::select("SELECT 1 FROM pg_indexes WHERE tablename = ? AND indexname = ?", [$table, $indexName]);
        } else {
            $exists = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
        }

        if (empty($exists)) {
            Schema::table($table, $callback);
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        Schema::table('articles', function (Blueprint $table) {
            $table->dropIndexIfExists(['scrape_status']);
            $table->dropIndexIfExists(['language_detected']);
        });

        if ($driver === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS idx_articles_ft_title');
            DB::statement('DROP INDEX IF EXISTS idx_articles_ft_summary');
            DB::statement('DROP INDEX IF EXISTS idx_articles_ft_fulltext_tr');
        } else {
            DB::statement('ALTER TABLE articles DROP INDEX idx_articles_ft_title');
            DB::statement('ALTER TABLE articles DROP INDEX idx_articles_ft_summary');
            DB::statement('ALTER TABLE articles DROP INDEX idx_articles_ft_fulltext_tr');
        }

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndexIfExists(['category']);
            $table->dropIndexIfExists(['category', 'created_at']);
            $table->dropIndexIfExists(['importance_score', 'created_at']);
        });

        if ($driver === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS idx_events_ft_title_tr');
            DB::statement('DROP INDEX IF EXISTS idx_events_ft_summary_tr');
        } else {
            DB::statement('ALTER TABLE events DROP INDEX idx_events_ft_title_tr');
            DB::statement('ALTER TABLE events DROP INDEX idx_events_ft_summary_tr');
        }

        Schema::table('sources', function (Blueprint $table) {
            $table->dropIndexIfExists(['country_code']);
            $table->dropIndexIfExists(['country_code', 'bias']);
            $table->dropIndexIfExists(['is_active']);
        });
    }
};
