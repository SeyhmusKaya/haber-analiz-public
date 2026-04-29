<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('reports')) {
            Schema::create('reports', function (Blueprint $table) {
                $table->id();
                $table->string('type', 20);           // weekly | monthly
                $table->string('title');
                $table->jsonb('content');
                $table->text('html_content')->nullable();
                $table->string('pdf_url', 500)->nullable();
                $table->date('period_start');
                $table->date('period_end');
                $table->timestamp('created_at')->useCurrent();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
