<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('success_stories', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt');
            $table->longText('story');
            $table->string('person_name', 100);
            $table->unsignedTinyInteger('person_age')->nullable();
            $table->enum('person_gender', ['male', 'female', 'other'])->default('male');
            $table->string('division', 60);
            $table->string('district', 60)->nullable();
            $table->date('missing_date')->nullable();
            $table->date('found_date')->nullable();
            $table->string('cover_image_url', 500)->nullable();
            $table->string('cover_image_public_id')->nullable();
            $table->unsignedBigInteger('missing_report_id')->nullable();
            $table->unsignedBigInteger('found_report_id')->nullable();
            $table->unsignedBigInteger('published_by');
            $table->boolean('is_published')->default(false)->index();
            $table->timestamp('published_at')->nullable()->index();
            $table->boolean('featured')->default(false)->index();
            $table->unsignedInteger('views')->default(0);
            $table->string('tag', 60)->default('পুনর্মিলিত');
            $table->timestamps();

            $table->index('division');
        });

        // Add foreign keys only when referenced tables are available.
        Schema::table('success_stories', function (Blueprint $table) {
            if (Schema::hasTable('users')) {
                $table->foreign('published_by')->references('id')->on('users')->restrictOnDelete();
            }

            if (Schema::hasTable('missing_reports')) {
                $table->foreign('missing_report_id')->references('id')->on('missing_reports')->nullOnDelete();
            }

            if (Schema::hasTable('found_reports')) {
                $table->foreign('found_report_id')->references('id')->on('found_reports')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('success_stories');
    }
};
