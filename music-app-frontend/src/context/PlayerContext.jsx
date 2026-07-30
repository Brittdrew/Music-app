import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import { resolvePlaybackSong } from '../api/playbackResolver'

const PlayerContext = createContext()

const getSongKey = (song) => song?.youtube_id || song?.previewUrl || song?.id

// Fisher-Yates in-place shuffle — returns a new array
function fisherYates(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

export function PlayerProvider({ children }) {
    const [currentSong, setCurrentSong] = useState(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [queue, setQueue] = useState([])
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [showQueue, setShowQueue] = useState(false)
    const [isShuffle, setIsShuffleRaw] = useState(false)
    const [loopMode, setLoopMode] = useState('none') // 'none' | 'all' | 'one'
    const [isResolving, setIsResolving] = useState(false)

    // Shuffle state — immutable once built; only rebuilt on explicit triggers
    const shuffledQueueRef = useRef([])   // full pre-generated shuffle order
    const shuffleIdxRef = useRef(0)    // pointer into that order
    // Keep a reactive copy so components can read the upcoming order
    const [shuffledQueue, setShuffledQueue] = useState([])
    const [shuffleIdx, setShuffleIdx] = useState(0)

    const playerRef = useRef(null)
    const intervalRef = useRef(null)
    // Guards against a slow resolve() from an earlier song overwriting a later one
    const resolveTokenRef = useRef(0)

    // ── Internal helpers ────────────────────────────────────────────────────

    /**
     * Build & store a new shuffled play order.
     * `seed` is pinned to position 0 (currently playing song).
     * Uses the latest `queue` from the ref so we never capture stale state.
     */
    const buildShuffle = useCallback((songs, seed) => {
        if (!songs.length) return

        const seedKey = getSongKey(seed)
        const rest = seed
            ? fisherYates(songs.filter(s => getSongKey(s) !== seedKey))
            : fisherYates(songs)

        const order = seed ? [seed, ...rest] : rest
        shuffledQueueRef.current = order
        shuffleIdxRef.current = 0
        setShuffledQueue(order)
        setShuffleIdx(0)
    }, [])

    /**
     * Swap a resolved song into whatever collections still reference the old
     * (unresolved) version, so it's never re-resolved again this session.
     */
    const patchResolvedSong = useCallback((originalKey, resolved) => {
        setQueue(prev => prev.map(s => getSongKey(s) === originalKey ? resolved : s))
        shuffledQueueRef.current = shuffledQueueRef.current.map(s => getSongKey(s) === originalKey ? resolved : s)
        setShuffledQueue(prev => prev.map(s => getSongKey(s) === originalKey ? resolved : s))
    }, [])

    // ── Core playSong (internal, does NOT rebuild shuffle) ──────────────────
    // Every playback path (direct click, Up Next, playNext, playPrev, shuffle
    // jump) funnels through here, so this is the ONE place that needs to make
    // sure a song has a real youtube_id before it settles in as currentSong —
    // otherwise queued iTunes-only songs silently fall back to the 30s preview.

    const _playSong = useCallback((song) => {
        setCurrentSong(song)
        setIsPlaying(true)
        setCurrentTime(0)
        setDuration(0)

        if (song?.youtube_id) return // already fully resolved, nothing to do

        const originalKey = getSongKey(song)
        const myToken = ++resolveTokenRef.current
        setIsResolving(true)

        resolvePlaybackSong(song)
            .then(resolved => {
                // Bail if the user has since moved on to a different song
                if (myToken !== resolveTokenRef.current) return
                if (resolved?.youtube_id) {
                    setCurrentSong(resolved)
                    patchResolvedSong(originalKey, resolved)
                }
            })
            .catch(() => { })
            .finally(() => {
                if (myToken === resolveTokenRef.current) setIsResolving(false)
            })
    }, [patchResolvedSong])

    // ── Public playSong — rebuilds shuffle order when called directly ────────
    // (e.g. clicking a SongCard, clicking a queue row, "Up Next" click, etc.)

    const playSong = useCallback((song) => {
        _playSong(song)
        // If shuffle is on, pin this song as the new seed for the shuffle order
        if (isShuffle) {
            // Use current queue ref value to avoid stale closure
            setQueue(prev => {
                // Ensure the song is in the pool (it may come from Search / YouTube)
                const songKey = getSongKey(song)
                const pool = prev.find(s => getSongKey(s) === songKey)
                    ? prev
                    : [song, ...prev]
                buildShuffle(pool, song)
                return pool
            })
        }
    }, [isShuffle, _playSong, buildShuffle])

    // ── Shuffle toggle ──────────────────────────────────────────────────────

    const setIsShuffle = useCallback((valueOrUpdater) => {
        setIsShuffleRaw(prev => {
            const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater
            if (next && !prev) {
                // Turning ON: build shuffle order right now using current state
                setQueue(q => {
                    setCurrentSong(cs => {
                        buildShuffle(q.length ? q : (cs ? [cs] : []), cs)
                        return cs
                    })
                    return q
                })
            }
            return next
        })
    }, [buildShuffle])

    // ── playNext ────────────────────────────────────────────────────────────

    const playNext = useCallback(() => {
        if (isShuffle) {
            const order = shuffledQueueRef.current
            if (!order.length) return

            const nextIdx = shuffleIdxRef.current + 1

            if (nextIdx < order.length) {
                shuffleIdxRef.current = nextIdx
                setShuffleIdx(nextIdx)
                _playSong(order[nextIdx])
            } else if (loopMode === 'all') {
                // Reshuffle — no seed, fully random new order
                setQueue(q => {
                    buildShuffle(q, null)
                    return q
                })
                // After buildShuffle, order[0] will be played on next render
                // Use a microtask so refs are updated first
                setTimeout(() => {
                    const newOrder = shuffledQueueRef.current
                    if (newOrder.length) _playSong(newOrder[0])
                }, 0)
            } else {
                setIsPlaying(false)
            }
            return
        }

        // Normal (non-shuffle)
        setQueue(q => {
            setCurrentSong(cs => {
                const currentKey = getSongKey(cs)
                const idx = q.findIndex(s => getSongKey(s) === currentKey)
                const next = q[idx + 1]
                if (next) {
                    _playSong(next)
                } else if (loopMode === 'all') {
                    if (q[0]) _playSong(q[0])
                } else {
                    setIsPlaying(false)
                }
                return cs
            })
            return q
        })
    }, [isShuffle, loopMode, _playSong, buildShuffle])

    // ── playPrev ────────────────────────────────────────────────────────────

    const playPrev = useCallback(() => {
        if (isShuffle) {
            const order = shuffledQueueRef.current
            const prevIdx = shuffleIdxRef.current - 1
            if (prevIdx >= 0) {
                shuffleIdxRef.current = prevIdx
                setShuffleIdx(prevIdx)
                _playSong(order[prevIdx])
            }
            // At history start → do nothing (same as YouTube / Spotify)
            return
        }

        setQueue(q => {
            setCurrentSong(cs => {
                const currentKey = getSongKey(cs)
                const idx = q.findIndex(s => getSongKey(s) === currentKey)
                const prev = q[idx - 1]
                if (prev) {
                    _playSong(prev)
                } else if (loopMode === 'all') {
                    const last = q[q.length - 1]
                    if (last) _playSong(last)
                }
                return cs
            })
            return q
        })
    }, [isShuffle, loopMode, _playSong])

    // ── handleSongEnded ─────────────────────────────────────────────────────

    const handleSongEnded = useCallback(() => {
        if (loopMode === 'one' && playerRef.current?.seekTo) {
            playerRef.current.seekTo(0, true)
            playerRef.current.playVideo()
            setCurrentTime(0)
            setIsPlaying(true)
        } else {
            playNext()
        }
    }, [loopMode, playNext])

    // ── Other controls ──────────────────────────────────────────────────────

    const togglePlay = () => {
        if (!playerRef.current) return
        if (isPlaying) playerRef.current.pauseVideo?.()
        else playerRef.current.playVideo?.()
        setIsPlaying(prev => !prev)
    }

    const seek = (time) => {
        if (!playerRef.current) return
        playerRef.current.seekTo?.(time, true)
        setCurrentTime(time)
    }

    const addToQueue = (song) => {
        setQueue(prev => {
            const songKey = getSongKey(song)
            if (prev.find(s => getSongKey(s) === songKey)) return prev
            return [...prev, song]
        })
    }

    const removeFromQueue = (songKey) => {
        setQueue(prev => prev.filter(s => getSongKey(s) !== songKey))
    }

    // ── Time polling ────────────────────────────────────────────────────────

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                if (playerRef.current?.getCurrentTime) {
                    setCurrentTime(playerRef.current.getCurrentTime())
                    setDuration(playerRef.current.getDuration() || 0)
                }
            }, 250)
        } else {
            clearInterval(intervalRef.current)
        }
        return () => clearInterval(intervalRef.current)
    }, [isPlaying])

    return (
        <PlayerContext.Provider value={{
            currentSong, isPlaying, setIsPlaying, queue, setQueue,
            duration, currentTime, playerRef, showQueue, setShowQueue,
            playSong, togglePlay, playNext, playPrev, seek,
            addToQueue, removeFromQueue,
            isShuffle, setIsShuffle, loopMode, setLoopMode, handleSongEnded,
            shuffledQueue, shuffleIdx, isResolving,
        }}>
            {children}
        </PlayerContext.Provider>
    )
}

export const usePlayer = () => useContext(PlayerContext)