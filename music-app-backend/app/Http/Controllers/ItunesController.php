<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use App\Services\PlaybackResolutionService;

class ItunesController extends Controller
{
    /**
     * Keep our own outbound rate comfortably under Apple's documented
     * "~20 calls per minute" so we get predictable, fast local throttling
     * instead of unpredictable 403s from Apple that used to look identical
     * to "no results" on the frontend.
     */
    private const ITUNES_LIMIT_PER_MINUTE = 18;
    private const ITUNES_RATE_KEY = 'itunes-search-api';

    /**
     * Search for songs using the iTunes Search API.
     */
    public function search(Request $request)
    {
        $term = trim($request->query('term', ''));
        if (!$term) {
            return response()->json(['resultCount' => 0, 'results' => []]);
        }

        $normalized = $this->normalizeTerm($term);

        // 1. Serve from cache first — this alone avoids the vast majority of
        // calls that would otherwise count against the rate limit, since the
        // same normalized term (e.g. "love song" typed, retyped, or searched
        // by multiple users) is reused for 24h.
        $cache = DB::table('search_cache')
            ->where('search_term', $normalized)
            ->where('created_at', '>=', now()->subDay())
            ->first();

        if ($cache) {
            return response()->json(json_decode($cache->results_json, true));
        }

        // 2. Enforce our own rate limit BEFORE calling Apple. If we're already
        // at the ceiling, fail fast with a clear "rate_limited" flag instead
        // of making a request that would likely 403 anyway.
        if (RateLimiter::tooManyAttempts(self::ITUNES_RATE_KEY, self::ITUNES_LIMIT_PER_MINUTE)) {
            $retryAfter = RateLimiter::availableIn(self::ITUNES_RATE_KEY);

            Log::warning('iTunes search throttled locally before request', [
                'term' => $term,
                'retry_after' => $retryAfter,
            ]);

            return response()->json([
                'resultCount' => 0,
                'results' => [],
                'rate_limited' => true,
                'retry_after' => $retryAfter,
            ], 200);
        }

        RateLimiter::hit(self::ITUNES_RATE_KEY, 60); // 60s decay window

        $response = Http::timeout(10)->get('https://itunes.apple.com/search', [
            'term'    => $term,
            'media'   => 'music',
            'entity'  => 'song',
            'limit'   => 50, // Fetch more so the backend/frontend relevance filter has enough to work with
            'version' => 2,
        ]);

        // 3. If Apple itself throttled or errored, log the real reason and
        // tell the frontend explicitly — never silently return an empty
        // "no results" for what is actually a 403/429/5xx.
        if (!$response->successful()) {
            Log::warning('iTunes search request failed', [
                'term'   => $term,
                'status' => $response->status(),
                'body'   => Str::limit($response->body(), 500),
            ]);

            return response()->json([
                'resultCount' => 0,
                'results' => [],
                'rate_limited' => in_array($response->status(), [403, 429]),
            ], 200);
        }

        $payload = $response->json();

        // 4. Apply title/artist relevance scoring server-side too, so the
        // cached payload is already clean and the frontend doesn't have to
        // do all the heavy lifting (and so title-only searches — the ones
        // you flagged as looking "limited" — get a real ranked set instead
        // of whatever raw order Apple returns).
        $payload['results'] = $this->rankResults($payload['results'] ?? [], $term);
        $payload['resultCount'] = count($payload['results']);

        DB::table('search_cache')->updateOrInsert(
            ['search_term' => $normalized],
            [
                'results_json' => json_encode($payload),
                'created_at' => now(),
            ]
        );

        return response()->json($payload);
    }

    /**
     * Normalize a search term for cache-key purposes: lowercase, strip
     * accents/diacritics, collapse whitespace, and drop punctuation that
     * doesn't change meaning (so "Ben & Ben", "ben and ben", "ben  ben"
     * don't create three separate cache entries and three separate API
     * calls against the rate limit).
     */
    private function normalizeTerm(string $term): string
    {
        $ascii = Str::ascii($term); // strips accents (é -> e, etc.)
        $lower = mb_strtolower($ascii);
        $noPunct = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $lower);
        return trim(preg_replace('/\s+/', ' ', $noPunct));
    }

    /**
     * Score and sort iTunes results by relevance to the query, matching on
     * both title and artist so a title-only search (no artist typed) still
     * surfaces the right song first instead of whatever Apple's default
     * ordering happens to return.
     */
    private function rankResults(array $results, string $term): array
    {
        $queryNorm = $this->normalizeTerm($term);
        $queryWords = array_values(array_filter(explode(' ', $queryNorm), fn ($w) => mb_strlen($w) >= 2));

        $scored = [];

        foreach ($results as $item) {
            $title = $this->normalizeTerm($item['trackName'] ?? '');
            $artist = $this->normalizeTerm($item['artistName'] ?? '');
            $score = 0;

            // Exact / prefix / substring match on title — highest priority,
            // since most people search by song title.
            if ($title === $queryNorm) {
                $score += 300;
            } elseif (str_starts_with($title, $queryNorm)) {
                $score += 150;
            } elseif (str_contains($title, $queryNorm)) {
                $score += 100;
            }

            // Same on artist.
            if ($artist === $queryNorm) {
                $score += 100;
            } elseif (str_starts_with($artist, $queryNorm)) {
                $score += 60;
            } elseif (str_contains($artist, $queryNorm)) {
                $score += 40;
            }

            // Per-word overlap so partial/typo'd queries still find close
            // matches (e.g. "shape of you" partially typed as "shape you").
            foreach ($queryWords as $word) {
                if (str_contains($title, $word)) {
                    $score += 20;
                }
                if (str_contains($artist, $word)) {
                    $score += 5;
                }
            }

            // Slight boost for songs with a preview available, since that's
            // needed as a playback fallback in this app.
            if (!empty($item['previewUrl'])) {
                $score += 2;
            }

            if ($score > 0) {
                $scored[] = ['item' => $item, 'score' => $score];
            }
        }

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);

        return array_map(fn ($s) => $s['item'], array_slice($scored, 0, 25));
    }

    /**
     * Resolve YouTube playback ID for a track.
     */
    public function resolvePlayback(Request $request, PlaybackResolutionService $resolver)
    {
        $title = trim($request->query('title', ''));
        $artist = trim($request->query('artist', ''));
        $itunesTrackId = $request->query('itunes_track_id');

        if (!$title || !$artist) {
            return response()->json(['message' => 'Missing title or artist'], 400);
        }

        $youtubeId = $resolver->resolve($title, $artist, $itunesTrackId);

        if (!$youtubeId) {
            return response()->json([
                'youtube_video_id' => null,
                'message' => 'YouTube video not found, using iTunes preview'
            ], 200);
        }

        return response()->json(['youtube_video_id' => $youtubeId]);
    }
}