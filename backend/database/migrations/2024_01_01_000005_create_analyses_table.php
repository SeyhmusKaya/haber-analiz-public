<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->char('country_code', 2);
            $table->text('pro_gov_summary')->nullable();
            $table->text('opposition_summary')->nullable();
            $table->text('consensus')->nullable();
            $table->text('pro_gov_sources')->nullable();
            $table->text('opposition_sources')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->unique(['event_id', 'country_code']);
            $table->index(['event_id', 'country_code']);
        });
    }
    public function down(): void { Schema::dropIfExists('analyses'); }
};
