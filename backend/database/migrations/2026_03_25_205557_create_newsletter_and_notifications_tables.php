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
        // Newsletter subscriptions
        Schema::create('newsletter_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('email');
            $table->string('frequency', 20)->default('weekly');
            $table->text('categories')->nullable();
            $table->text('countries')->nullable();
            $table->integer('min_importance')->default(1);
            $table->boolean('is_active')->default(true);
            $table->string('unsubscribe_token')->unique()->nullable();
            $table->timestamps();
        });

        // Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 50);
            $table->string('title');
            $table->text('message')->nullable();
            $table->string('link', 500)->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();
            $table->index(['user_id', 'is_read', 'created_at']);
        });

        // User notification settings
        Schema::create('user_notification_settings', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained('users')->cascadeOnDelete();
            $table->boolean('new_article')->default(true);
            $table->boolean('comment_reply')->default(true);
            $table->boolean('comment_like')->default(true);
            $table->boolean('newsletter')->default(true);
            $table->text('filter_countries')->nullable();
            $table->text('filter_categories')->nullable();
            $table->integer('min_importance')->default(5);
        });

        // Admin settings (SMTP etc.)
        Schema::create('admin_settings', function (Blueprint $table) {
            $table->string('key', 100)->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_settings');
        Schema::dropIfExists('user_notification_settings');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('newsletter_subscriptions');
    }
};
