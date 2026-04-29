<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('events', function (Blueprint $table) {
            $table->string('status', 20)->default('pending')->after('importance_score');
            $table->mediumText('centroid')->nullable()->after('status'); // normalized avg embedding (JSON)
            $table->index('status');
        });

        // Make title_tr nullable for pending events
        Schema::table('events', function (Blueprint $table) {
            $table->text('title_tr')->nullable()->change();
        });
    }

    public function down(): void {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['status', 'centroid']);
            $table->text('title_tr')->nullable(false)->change();
        });
    }
};
