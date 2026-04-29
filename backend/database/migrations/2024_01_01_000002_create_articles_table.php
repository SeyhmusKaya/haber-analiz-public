<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_id')->constrained()->onDelete('cascade');
            $table->text('title');
            $table->text('summary')->nullable();
            $table->text('url');
            $table->string('url_hash', 64)->unique();
            $table->timestamp('published_at');
            $table->longText('embedding')->nullable();
            $table->timestamps();
            $table->index('published_at');
            $table->index('source_id');
        });
    }
    public function down(): void { Schema::dropIfExists('articles'); }
};
