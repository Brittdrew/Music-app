<?php

namespace App\Http\Controllers;

use App\Models\Song;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->favorites()->latest('favorites.created_at')->get()
        );
    }

    public function toggle(Request $request)
    {
        $validatedSong = $request->validate([
            'youtube_id' => 'required|string',
            'title'      => 'required|string',
            'artist'     => 'required|string',
            'genre'      => 'nullable|string',
            'mood'       => 'nullable|string',
            'thumbnail'  => 'nullable|string',
        ]);

        $song = Song::firstOrCreate(
            ['youtube_id' => $validatedSong['youtube_id']],
            array_merge($validatedSong, ['user_id' => auth()->id()])
        );

        $user = $request->user();
        $isFavorited = $user->favorites()->where('song_id', $song->id)->exists();

        if ($isFavorited) {
            $user->favorites()->detach($song->id);
            $status = 'removed';
        } else {
            $user->favorites()->syncWithoutDetaching([$song->id]);
            $status = 'added';
        }

        return response()->json([
            'status' => $status,
            'song' => $song,
        ]);
    }
}
