<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sources', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('rss_url', 255);
            $table->char('country_code', 2);
            $table->enum('bias', ['pro_gov', 'opposition']);
            $table->string('language', 10);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('sources'); }
};
