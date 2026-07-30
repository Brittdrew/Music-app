<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PlaybackResolutionService
{
    protected $youtubeKey;

    public function __construct()
    {
        $this->youtubeKey = env('VITE_YOUTUBE_API_KEY') ?? env('YOUTUBE_API_KEY');
    }

    /**
     * Resolve the YouTube video ID for a given track.
     *
     * @param string $title
     * @param string $artist
     * @param string|int|null $itunesTrackId
     * @return string|null
     */
    public function resolve($title, $artist, $itunesTrackId = null)
    {
        if (!$title || !$artist) {
            return null;
        }

        $normalizedTitle = mb_strtolower(preg_replace('/\s+/', ' ', $title));
        $normalizedArtist = mb_strtolower(preg_replace('/\s+/', ' ', $artist));

        // 1. Look up track in the resolved_playback table
        $cache = null;
        if ($itunesTrackId) {
            $cache = DB::table('resolved_playback')
                ->where('itunes_track_id', $itunesTrackId)
                ->first();
        }

        if (!$cache) {
            $cache = DB::table('resolved_playback')
                ->where('track_title', $normalizedTitle)
                ->where('artist_name', $normalizedArtist)
                ->first();
        }

        // If found, check if it's expired
        if ($cache) {
            // Store iTunes track ID if it was missing in the cache
            if ($itunesTrackId && !$cache->itunes_track_id) {
                DB::table('resolved_playback')
                    ->where('id', $cache->id)
                    ->update(['itunes_track_id' => $itunesTrackId]);
            }

            $resolvedAt = $cache->resolved_at ? Carbon::parse($cache->resolved_at) : Carbon::parse($cache->created_at);
            
            // If cache is fresh (not expired), return immediately (0 units)
            if ($resolvedAt->greaterThanOrEqualTo(now()->subDays(30))) {
                return $cache->youtube_video_id;
            }

            // Cache has expired! Check if the video is still active using videos.list (1 unit)
            $candidateId = $cache->youtube_video_id;
            $verification = $this->verifyVideoId($candidateId);

            if ($verification['valid']) {
                // Still valid, update resolved_at timestamp
                DB::table('resolved_playback')
                    ->where('id', $cache->id)
                    ->update([
                        'resolved_at' => now(),
                        'itunes_track_id' => $itunesTrackId ?? $cache->itunes_track_id
                    ]);
                return $candidateId;
            } elseif ($verification['reason'] === 'api_error') {
                // Graceful fallback to cached entry on YouTube API/network failures
                Log::warning("YouTube validation API failed. Falling back to expired cached video ID {$candidateId} for {$artist} - {$title}");
                return $candidateId;
            }

            // Video is deleted or invalid; continue to resolve via search.list
            Log::info("Cached video ID {$candidateId} is invalid/deleted. Re-resolving {$artist} - {$title}");
        }

        // 2. Look up candidates in the songs table (prior mapping)
        $existingSong = DB::table('songs')
            ->where('title', $title)
            ->where('artist', $artist)
            ->whereNotNull('youtube_id')
            ->first();

        if ($existingSong) {
            $candidateId = $existingSong->youtube_id;
            $verification = $this->verifyVideoId($candidateId);

            if ($verification['valid']) {
                $this->updateOrCreateCache($normalizedTitle, $normalizedArtist, $candidateId, $itunesTrackId);
                return $candidateId;
            }
        }

        // 3. Fallback: Search YouTube using search.list (100 units)
        if (!$this->youtubeKey) {
            Log::warning('YouTube API key is not configured. Cannot resolve playback for ' . $artist . ' - ' . $title);
            return null;
        }

        $youtubeId = $this->searchYoutube($title, $artist);
        if ($youtubeId) {
            $this->updateOrCreateCache($normalizedTitle, $normalizedArtist, $youtubeId, $itunesTrackId);
            return $youtubeId;
        }

        return null;
    }

    /**
     * Verify if a YouTube video ID exists and is playable using videos.list (1 unit).
     */
    protected function verifyVideoId($videoId)
    {
        if (!$this->youtubeKey) {
            return ['valid' => false, 'reason' => 'api_error'];
        }

        try {
            $response = Http::timeout(10)->get('https://www.googleapis.com/youtube/v3/videos', [
                'part' => 'status,snippet',
                'id' => $videoId,
                'key' => $this->youtubeKey,
            ]);

            $this->incrementQuotaCounter('videos.list');

            if ($response->successful()) {
                $items = $response->json('items') ?? [];
                if (!empty($items)) {
                    $video = $items[0];
                    $embeddable = $video['status']['embeddable'] ?? true;
                    $uploadStatus = $video['status']['uploadStatus'] ?? 'processed';

                    if ($embeddable && $uploadStatus !== 'failed') {
                        return ['valid' => true, 'reason' => 'none'];
                    }
                    return ['valid' => false, 'reason' => 'invalid_status'];
                }
                return ['valid' => false, 'reason' => 'not_found'];
            }

            return ['valid' => false, 'reason' => 'api_error'];
        } catch (\Exception $e) {
            Log::error('Error verifying YouTube video ID ' . $videoId . ': ' . $e->getMessage());
            return ['valid' => false, 'reason' => 'api_error'];
        }
    }

    /**
     * Find a YouTube video ID using search.list (100 units).
     */
    protected function searchYoutube($title, $artist)
    {
        try {
            $query = trim("{$artist} {$title} official music video");
            $response = Http::timeout(10)->get('https://www.googleapis.com/youtube/v3/search', [
                'part' => 'snippet',
                'q' => $query,
                'type' => 'video',
                'videoCategoryId' => '10',
                'maxResults' => 3,
                'key' => $this->youtubeKey,
            ]);

            $this->incrementQuotaCounter('search.list');

            if ($response->successful()) {
                $payload = $response->json();
                foreach ($payload['items'] ?? [] as $item) {
                    if (!empty($item['id']['videoId'])) {
                        return $item['id']['videoId'];
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Error searching YouTube for ' . $artist . ' - ' . $title . ': ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Cache the resolved video details.
     */
    protected function updateOrCreateCache($title, $artist, $videoId, $itunesTrackId)
    {
        DB::table('resolved_playback')->updateOrInsert(
            [
                'track_title' => $title,
                'artist_name' => $artist,
            ],
            [
                'youtube_video_id' => $videoId,
                'itunes_track_id' => $itunesTrackId,
                'resolved_at' => now(),
                'created_at' => now(),
            ]
        );
    }

    /**
     * Increment the call count of a YouTube API endpoint.
     */
    protected function incrementQuotaCounter($endpoint)
    {
        Log::info("YouTube API Call: {$endpoint} incremented");
        
        DB::table('youtube_api_calls')->updateOrInsert(
            ['endpoint' => $endpoint],
            [
                'count' => DB::raw('count + 1'),
                'updated_at' => now()
            ]
        );
    }
}
