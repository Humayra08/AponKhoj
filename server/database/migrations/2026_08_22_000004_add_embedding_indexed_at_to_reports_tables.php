<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('missing_reports', function (Blueprint $table) {
            $table->timestamp('embedding_indexed_at')->nullable();
        });

        Schema::table('found_reports', function (Blueprint $table) {
            $table->timestamp('embedding_indexed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('missing_reports', function (Blueprint $table) {
            $table->dropColumn('embedding_indexed_at');
        });

        Schema::table('found_reports', function (Blueprint $table) {
            $table->dropColumn('embedding_indexed_at');
        });
    }
};
