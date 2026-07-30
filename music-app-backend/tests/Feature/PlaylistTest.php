<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Playlist;
use App\Models\Song;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlaylistTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_playlists_returns_successful_response(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);
        
        Playlist::create([
            'name' => 'My Rock Hits',
            'user_id' => $user->id,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/playlists');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            '*' => [
                'id',
                'name',
                'user_id',
                'created_at',
                'updated_at',
                'songs',
            ]
        ]);
    }

    public function test_create_playlist(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/playlists', [
            'name' => 'Late Night Vibes'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('playlists', [
            'name' => 'Late Night Vibes',
            'user_id' => $user->id
        ]);
    }

    public function test_show_playlist_unauthorized(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $otherUser = User::create([
            'name' => 'Other User',
            'email' => 'other@example.com',
            'password' => bcrypt('password'),
        ]);

        $playlist = Playlist::create([
            'name' => 'Secret Playlist',
            'user_id' => $otherUser->id
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/playlists/{$playlist->id}");
        $response->assertStatus(403);
    }

    public function test_show_playlist_with_songs(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $playlist = Playlist::create([
            'name' => 'My Playlist',
            'user_id' => $user->id
        ]);

        $song = Song::create([
            'title' => 'Never Gonna Give You Up',
            'artist' => 'Rick Astley',
            'youtube_id' => 'dQw4w9WgXcQ'
        ]);

        $playlist->songs()->attach($song->id);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/playlists/{$playlist->id}");
        $response->assertStatus(200);
        $response->assertJsonPath('name', 'My Playlist');
        $response->assertJsonCount(1, 'songs');
        $response->assertJsonPath('songs.0.title', 'Never Gonna Give You Up');
    }

    public function test_add_song_by_id(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $playlist = Playlist::create([
            'name' => 'My Playlist',
            'user_id' => $user->id
        ]);

        $song = Song::create([
            'title' => 'Stayin Alive',
            'artist' => 'Bee Gees',
            'youtube_id' => 'I_izvAbhExY'
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/playlists/{$playlist->id}/songs", [
            'song_id' => $song->id
        ]);

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'songs');
        $this->assertDatabaseHas('playlist_songs', [
            'playlist_id' => $playlist->id,
            'song_id' => $song->id
        ]);
    }

    public function test_add_song_by_payload_creates_song(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $playlist = Playlist::create([
            'name' => 'My Playlist',
            'user_id' => $user->id
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/playlists/{$playlist->id}/songs", [
            'youtube_id' => 'xyz123',
            'title' => 'New Song',
            'artist' => 'New Artist',
        ]);

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'songs');
        $this->assertDatabaseHas('songs', [
            'youtube_id' => 'xyz123',
            'title' => 'New Song'
        ]);
    }

    public function test_remove_song(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $playlist = Playlist::create([
            'name' => 'My Playlist',
            'user_id' => $user->id
        ]);

        $song = Song::create([
            'title' => 'Thriller',
            'artist' => 'Michael Jackson',
            'youtube_id' => 'sOnqjkJTMaA'
        ]);

        $playlist->songs()->attach($song->id);

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/playlists/{$playlist->id}/songs/{$song->id}");
        $response->assertStatus(200);
        $response->assertJsonCount(0, 'songs');
        $this->assertDatabaseMissing('playlist_songs', [
            'playlist_id' => $playlist->id,
            'song_id' => $song->id
        ]);
    }
}
