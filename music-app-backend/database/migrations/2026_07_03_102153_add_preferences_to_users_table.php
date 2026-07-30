<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('preferred_genres')->nullable()->after('password');
            $table->json('preferred_moods')->nullable()->after('preferred_genres');
            $table->json('preferred_artists')->nullable()->after('preferred_moods');
            $table->boolean('onboarding_done')->default(false)->after('preferred_artists');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['preferred_genres', 'preferred_moods', 'preferred_artists', 'onboarding_done']);
        });
    }
};
