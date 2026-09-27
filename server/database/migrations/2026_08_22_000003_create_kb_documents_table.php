<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kb_documents', function (Blueprint $table) {
            $table->id();
            $table->string('source');
            $table->string('title')->nullable();
            $table->longText('chunk_text');
            $table->unsignedInteger('chunk_index')->default(0);
            $table->timestamp('embedding_indexed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kb_documents');
    }
};
