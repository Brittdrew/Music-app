<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PreferenceController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'preferred_genres'   => $user->preferred_genres  ?? [],
            'preferred_moods'    => $user->preferred_moods   ?? [],
            'preferred_artists'  => $user->preferred_artists ?? [],
            'onboarding_done'    => $user->onboarding_done,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'preferred_genres'   => 'nullable|array',
            'preferred_moods'    => 'nullable|array',
            'preferred_artists'  => 'nullable|array',
        ]);

        $user = $request->user();
        $user->update([
            'preferred_genres'   => $request->preferred_genres  ?? [],
            'preferred_moods'    => $request->preferred_moods   ?? [],
            'preferred_artists'  => $request->preferred_artists ?? [],
            'onboarding_done'    => true,
        ]);

        return response()->json(['message' => 'Preferences saved', 'user' => $user]);
    }
}
