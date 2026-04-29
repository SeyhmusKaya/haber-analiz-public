<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        try { DB::statement("ALTER TABLE articles ADD COLUMN image_width INT NULL"); } catch (\Exception $e) {}
        try { DB::statement("ALTER TABLE articles ADD COLUMN image_height INT NULL"); } catch (\Exception $e) {}
    }

    public function down(): void
    {
        try { DB::statement("ALTER TABLE articles DROP COLUMN image_width"); } catch (\Exception $e) {}
        try { DB::statement("ALTER TABLE articles DROP COLUMN image_height"); } catch (\Exception $e) {}
    }
};
