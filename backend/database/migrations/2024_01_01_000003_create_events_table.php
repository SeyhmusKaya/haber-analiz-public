<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->text('title_tr');
            $table->text('summary_tr')->nullable();
            $table->string('category', 50)->nullable();
            $table->tinyInteger('importance_score')->default(5);
            $table->timestamps();
            $table->index('created_at');
            $table->index('importance_score');
        });
    }
    public function down(): void { Schema::dropIfExists('events'); }
};
