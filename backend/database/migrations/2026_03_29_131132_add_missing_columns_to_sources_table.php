<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sources', function (Blueprint $table) {
            $table->string('slug', 100)->nullable()->unique()->after('name');
            $table->string('owner', 255)->nullable()->after('language');
            $table->string('funding_type', 50)->nullable()->after('owner');
            $table->integer('founded_year')->nullable()->after('funding_type');
            $table->text('description')->nullable()->after('founded_year');
            $table->string('logo_url', 500)->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('sources', function (Blueprint $table) {
            $table->dropColumn(['slug', 'owner', 'funding_type', 'founded_year', 'description', 'logo_url']);
        });
    }
};
