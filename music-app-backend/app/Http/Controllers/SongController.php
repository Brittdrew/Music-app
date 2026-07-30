<?php

namespace App\Http\Controllers;

use App\Models\Song;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SongController extends Controller
{
    public function index(Request $request)
    {
        $query = Song::where('user_id', auth()->id());

        if ($request->mood)  $query->where('mood', $request->mood);
        if ($request->genre) $query->where('genre', $request->genre);
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('artist', 'like', "%{$request->search}%");
            });
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'      => 'required|string',
            'artist'     => 'required|string',
            'youtube_id' => 'required|string',
        ]);

        $song = Song::create(array_merge($request->all(), ['user_id' => auth()->id()]));
        return response()->json($song, 201);
    }

    public function show(Song $song)
    {
        // Ensure the song belongs to the authenticated user
        if ($song->user_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return response()->json($song);
    }

    public function update(Request $request, Song $song)
    {
        if ($song->user_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $validated = $request->validate([
            'title'      => 'sometimes|string|max:255',
            'artist'     => 'sometimes|string|max:255',
            'genre'      => 'nullable|string|max:100',
            'mood'       => 'nullable|string|max:100',
            'thumbnail'  => 'nullable|url|max:500',
            'youtube_id' => 'sometimes|string|max:50',
        ]);
        $song->update($validated);
        return response()->json($song);
    }

    public function destroy(Song $song)
    {
        if ($song->user_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $song->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function lyrics(Song $song)
    {
        if ($song->user_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($song->lyrics_cache) {
            return response()->json(['lyrics' => $song->lyrics_cache]);
        }

        $response = Http::get("https://api.lyrics.ovh/v1/{$song->artist}/{$song->title}");

        if ($response->successful()) {
            $lyrics = $response->json()['lyrics'];
            $song->update(['lyrics_cache' => $lyrics]);
            return response()->json(['lyrics' => $lyrics]);
        }

        return response()->json(['lyrics' => 'Lyrics not found.'], 404);
    }
}