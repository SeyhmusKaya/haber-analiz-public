<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ETag/Last-Modified for RSS conditional GET
        Schema::table('sources', function (Blueprint $table) {
            $table->string('last_etag', 255)->nullable()->after('is_active');
            $table->string('last_modified_http', 100)->nullable()->after('last_etag');
            $table->timestamp('last_fetched_at')->nullable()->after('last_modified_http');
        });

        // analyzed_at: sadece yeni/değişen eventleri analiz etmek için
        Schema::table('events', function (Blueprint $table) {
            $table->timestamp('analyzed_at')->nullable()->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('events', fn($t) => $t->dropColumn('analyzed_at'));
        Schema::table('sources', fn($t) => $t->dropColumns(['last_etag', 'last_modified_http', 'last_fetched_at']));
    }
};
