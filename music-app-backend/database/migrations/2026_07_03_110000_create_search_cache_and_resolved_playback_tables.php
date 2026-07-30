<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSearchCacheAndResolvedPlaybackTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('search_cache', function (Blueprint $table) {
            $table->id();
            $table->string('search_term', 255);
            $table->longText('results_json');
            $table->timestamp('created_at')->useCurrent();
            $table->index('search_term', 'idx_search_term');
        });

        Schema::create('resolved_playback', function (Blueprint $table) {
            $table->id();
            $table->string('track_title', 255);
            $table->string('artist_name', 255);
            $table->string('youtube_video_id', 50);
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['track_title', 'artist_name'], 'unique_track');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('resolved_playback');
        Schema::dropIfExists('search_cache');
    }
}
