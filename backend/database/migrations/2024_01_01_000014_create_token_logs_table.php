<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('token_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('feature', ['chat', 'analysis', 'long_summary']);
            $table->unsignedInteger('tokens_used')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'feature', 'created_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('token_logs');
    }
};
