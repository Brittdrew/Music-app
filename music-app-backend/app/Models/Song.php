<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Song extends Model
{
    protected $fillable = [
        'user_id', 'title', 'artist', 'youtube_id', 'genre', 'mood', 'thumbnail', 'lyrics_cache'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function playlists()
    {
        return $this->belongsToMany(Playlist::class, 'playlist_songs');
    }

    public function favoritedBy()
    {
        return $this->belongsToMany(User::class, 'favorites')->withTimestamps();
    }

    /**
     * Retrieve the model for a bound value.
     * Supports both database primary keys (integers) and youtube_ids (strings).
     */
    public function resolveRouteBinding($value, $field = null)
    {
        if (is_numeric($value)) {
            return $this->where('id', $value)->firstOrFail();
        }
        return $this->where('youtube_id', $value)->firstOrFail();
    }
}