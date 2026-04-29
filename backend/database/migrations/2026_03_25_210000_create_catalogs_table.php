<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('catalogs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps();
        });

        Schema::create('catalog_events', function (Blueprint $table) {
            $table->foreignId('catalog_id')->constrained('catalogs')->cascadeOnDelete();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->timestamp('added_at')->useCurrent();
            $table->primary(['catalog_id', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_events');
        Schema::dropIfExists('catalogs');
    }
};
