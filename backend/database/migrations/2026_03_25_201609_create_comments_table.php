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
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->text('content');
            $table->integer('likes_count')->default(0);
            $table->integer('dislikes_count')->default(0);
            $table->boolean('is_deleted')->default(false);
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('comments')->cascadeOnDelete();
            $table->index(['event_id', 'created_at']);
        });

        Schema::create('comment_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained('comments')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('vote_type', 10);
            $table->timestamps();
            $table->unique(['comment_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comment_votes');
        Schema::dropIfExists('comments');
    }
};
