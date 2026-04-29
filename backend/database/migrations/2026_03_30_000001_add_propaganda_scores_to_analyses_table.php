<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('analyses', function (Blueprint $table) {
            $table->longText('propaganda_scores')->nullable()->after('consensus');
            $table->longText('word_frequencies')->nullable()->after('propaganda_scores');
        });
    }

    public function down(): void {
        Schema::table('analyses', function (Blueprint $table) {
            $table->dropColumn(['propaganda_scores', 'word_frequencies']);
        });
    }
};
