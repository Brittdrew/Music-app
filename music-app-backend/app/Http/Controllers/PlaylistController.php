<?php

namespace App\Http\Controllers;

use App\Models\Playlist;
use App\Models\Song;
use Illuminate\Http\Request;

class PlaylistController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->playlists()->with('songs')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string']);
        $playlist = $request->user()->playlists()->create($validated);
        return response()->json($playlist, 201);
    }

    public function show(Playlist $playlist, Request $request)
    {
        if ($playlist->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        $playlist->load('songs');
        return response()->json($playlist);
    }

    public function addSong(Playlist $playlist, Request $request)
    {
        if ($playlist->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        $songId = $request->input('song_id');

        if ($songId) {
            $song = Song::findOrFail($songId);
        } else {
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
                $validatedSong
            );
        }

        $playlist->songs()->syncWithoutDetaching([$song->id]);
        $playlist->load('songs');

        return response()->json($playlist);
    }

    public function removeSong(Playlist $playlist, Song $song, Request $request)
    {
        if ($playlist->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        $playlist->songs()->detach($song->id);
        $playlist->load('songs');

        return response()->json($playlist);
    }

    public function destroy(Playlist $playlist, Request $request)
    {
        if ($playlist->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        $playlist->delete();
        return response()->json(['message' => 'Playlist deleted']);
    }
}