<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('songs', function (Blueprint $table) {
        $table->id();
        $table->string('title');
        $table->string('artist');
        $table->string('youtube_id'); // e.g. "dQw4w9WgXcQ"
        $table->string('genre')->nullable();
        $table->string('mood')->nullable(); // chill, hype, sad, romantic
        $table->string('thumbnail')->nullable();
        $table->longText('lyrics_cache')->nullable();
        $table->timestamps();
    });
}
};
