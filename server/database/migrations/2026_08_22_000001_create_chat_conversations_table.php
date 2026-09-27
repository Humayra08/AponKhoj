<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->uuid('session_id')->nullable()->index();
            $table->string('title')->nullable();
            $table->enum('status', ['active', 'closed'])->default('active');
            $table->enum('context_type', ['general', 'report_filing_missing', 'report_filing_found'])->default('general');
            $table->json('draft_report_payload')->nullable();
            $table->timestamps();
        });

        Schema::table('chat_conversations', function (Blueprint $table) {
            if (Schema::hasTable('users')) {
                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_conversations');
    }
};
