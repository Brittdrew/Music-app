<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SongController;
use App\Http\Controllers\PlaylistController;
use App\Http\Controllers\PreferenceController;
use App\Http\Controllers\ItunesController;
use App\Http\Controllers\FavoriteController;

// Public proxy routes for LRCLIB lyrics (no auth required — avoids CORS + Cloudflare blocks)
Route::get('/lyrics/search', function (Request $request) {
    $response = Http::withHeaders([
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept'     => 'application/json',
    ])->get('https://lrclib.net/api/search', $request->query());

    return response()->json($response->json() ?? [], $response->status());
});

Route::get('/lyrics/get', function (Request $request) {
    $response = Http::withHeaders([
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept'     => 'application/json',
    ])->get('https://lrclib.net/api/get', $request->query());

    return response()->json($response->json() ?? [], $response->status());
});

// Auth (public) — rate-limited to 10 requests/min to prevent brute force
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register',    [AuthController::class, 'register']);
    Route::post('/login',       [AuthController::class, 'login']);
    Route::post('/auth/google', [AuthController::class, 'googleLogin']);
});

// All protected routes (require login)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);
    Route::put('/me',      [AuthController::class, 'updateProfile']);

    // iTunes search and YouTube playback resolution
    Route::get('/search',           [ItunesController::class, 'search']);
    Route::get('/playback/resolve', [ItunesController::class, 'resolvePlayback']);

    // Preferences (onboarding)
    Route::get('/preferences',  [PreferenceController::class, 'show']);
    Route::post('/preferences', [PreferenceController::class, 'store']);

    // Favorites
    Route::get('/favorites',    [FavoriteController::class, 'index']);
    Route::post('/favorites',   [FavoriteController::class, 'toggle']);

    // Songs — scoped to the authenticated user
    Route::get('/songs',               [SongController::class, 'index']);
    Route::get('/songs/{song}',        [SongController::class, 'show']);
    Route::get('/songs/{song}/lyrics', [SongController::class, 'lyrics']);
    Route::post('/songs',              [SongController::class, 'store']);
    Route::put('/songs/{song}',        [SongController::class, 'update']);
    Route::delete('/songs/{song}',     [SongController::class, 'destroy']);

    // Playlists — scoped to the authenticated user
    Route::get('/playlists',                            [PlaylistController::class, 'index']);
    Route::post('/playlists',                           [PlaylistController::class, 'store']);
    Route::get('/playlists/{playlist}',                 [PlaylistController::class, 'show']);
    Route::post('/playlists/{playlist}/songs',          [PlaylistController::class, 'addSong']);
    Route::delete('/playlists/{playlist}/songs/{song}', [PlaylistController::class, 'removeSong']);
    Route::delete('/playlists/{playlist}',              [PlaylistController::class, 'destroy']);
});