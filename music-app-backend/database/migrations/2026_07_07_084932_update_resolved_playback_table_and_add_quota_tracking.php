<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Update resolved_playback table to support iTunes track IDs and resolution timestamp
        Schema::table('resolved_playback', function (Blueprint $table) {
            $table->string('itunes_track_id', 50)->nullable()->after('id');
            $table->timestamp('resolved_at')->nullable()->after('youtube_video_id');
            $table->index('itunes_track_id', 'idx_itunes_track_id');
        });

        // Initialize resolved_at to created_at for any existing cache entries
        DB::table('resolved_playback')->update([
            'resolved_at' => DB::raw('created_at')
        ]);

        // 2. Create youtube_api_calls quota tracking table
        Schema::create('youtube_api_calls', function (Blueprint $table) {
            $table->string('endpoint', 50)->primary(); // 'search.list' or 'videos.list'
            $table->unsignedInteger('count')->default(0);
            $table->timestamps();
        });

        // 3. Seed initial rows for both endpoints
        DB::table('youtube_api_calls')->insert([
            [
                'endpoint' => 'search.list',
                'count' => 0,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'endpoint' => 'videos.list',
                'count' => 0,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('youtube_api_calls');

        Schema::table('resolved_playback', function (Blueprint $table) {
            $table->dropIndex('idx_itunes_track_id');
            $table->dropColumn(['itunes_track_id', 'resolved_at']);
        });
    }
};
