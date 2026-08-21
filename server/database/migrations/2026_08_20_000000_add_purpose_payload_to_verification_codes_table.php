<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('verification_codes', function (Blueprint $table) {
            $table->string('purpose', 40)->default('registration')->after('email');
            $table->json('payload')->nullable()->after('code');
            $table->unique(['email', 'purpose'], 'verification_codes_email_purpose_unique');
        });
    }

    public function down(): void
    {
        Schema::table('verification_codes', function (Blueprint $table) {
            $table->dropUnique('verification_codes_email_purpose_unique');
            $table->dropColumn(['purpose', 'payload']);
        });
    }
};
