import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useFavorites } from '../context/FavoritesContext'

function parseLRC(lrc) {
    const lines = lrc.split('\n')
    const result = []
    const timeRegex = /\[(\d+):(\d+\.\d+|\d+)\]/
    for (const line of lines) {
        const match = line.match(timeRegex)
        if (match) {
            const minutes = parseFloat(match[1])
            const seconds = parseFloat(match[2])
            const time = minutes * 60 + seconds
            const text = line.replace(/\[.*?\]/g, '').trim()
            if (text) result.push({ time, text })
        }
    }
    return result
}

function parsePlainLyricsToTimed(plainText, songDuration) {
    if (!plainText || plainText === 'Lyrics not found for this song.') return []
    const lines = plainText
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)

    if (!lines.length) return []
    const dur = songDuration > 0 ? songDuration : 180
    const startTime = Math.min(3, dur * 0.04)
    const effectiveDur = Math.max(10, dur - startTime - 5)
    const timePerLine = effectiveDur / lines.length

    return lines.map((text, idx) => ({
        time: startTime + idx * timePerLine,
        text,
        isEstimated: true,
    }))
}

function VinylDisc({ song, isPlaying }) {
    const thumbSrc = song.thumbnail || `https://img.youtube.com/vi/${song.youtube_id}/maxresdefault.jpg`
    return (
        <div style={{ position: 'relative', width: '300px', height: '300px' }}>
            {/* CD Case frame */}
            <div style={{
                position: 'absolute', inset: '-20px', borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                border: '2px solid rgba(255,255,255,0.15)',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6), 0 0 60px rgba(0,0,0,0.8), inset 2px 2px 8px rgba(255,255,255,0.05)',
                backdropFilter: 'blur(2px)', zIndex: 0
            }}>
                <div style={{ position: 'absolute', left: '8px', top: '20px', bottom: '20px', width: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                <div style={{ position: 'absolute', right: '8px', top: '20px', bottom: '20px', width: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
            </div>

            {/* Spinning disc */}
            <div style={{
                width: '300px', height: '300px', borderRadius: '50%',
                position: 'relative', zIndex: 1, overflow: 'hidden',
                animationName: isPlaying ? 'spin' : 'none',
                animationDuration: '6s',
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                animationPlayState: isPlaying ? 'running' : 'paused',
                transformOrigin: '50% 50%',
            }}>
                {/* True album colors — no grayscale, just a slight dim so the grooves/overlay still read on top */}
                <img src={thumbSrc} alt={song.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', filter: 'brightness(0.92)', zIndex: 0 }} />
                {[20, 40, 60, 80, 100, 115, 128, 140].map(r => (
                    <div key={r} style={{ position: 'absolute', width: `${r * 2}px`, height: `${r * 2}px`, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 1 }} />
                ))}
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 50%, rgba(0,0,0,0.22) 100%)', zIndex: 2 }} />
                <div className="vinyl-spindle-hole" style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #111 0%, #000 100%)',
                    border: '3px solid rgba(255,255,255,0.15)',
                    zIndex: 4,
                    boxShadow: '0 0 10px rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {[[-8, -8], [8, -8], [0, 8], [-8, 8], [8, 8]].map(([x, y], i) => (
                        <div key={i} style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', top: `calc(50% + ${y}px)`, left: `calc(50% + ${x}px)`, transform: 'translate(-50%, -50%)' }} />
                    ))}
                </div>
            </div>

            {/* Needle */}
            <div style={{ position: 'absolute', top: '-28px', right: '-28px', width: '5px', height: '110px', background: 'linear-gradient(180deg, #aaa 0%, #666 100%)', borderRadius: '5px', transformOrigin: 'top center', transform: isPlaying ? 'rotate(28deg)' : 'rotate(5deg)', transition: 'transform 0.8s ease', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, #ccc, #888)', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
                <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: '3px', height: '8px', background: '#e74c3c', borderRadius: '2px' }} />
            </div>

            {isPlaying && <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', boxShadow: '0 0 40px rgba(192,57,43,0.3)', pointerEvents: 'none', zIndex: 0 }} />}
        </div>
    )
}

// Derive a real color theme from the album art, the same way Spotify/Apple
// Music do it: extract a small palette of named swatches (Vibrant, Muted,
// Dark/Light variants) rather than one flat average, then pick the ones
// that actually work as a background (good saturation, safe contrast).
// Requires: npm install node-vibrant
function useAlbumPalette(src) {
    const [palette, setPalette] = useState(null)

    useEffect(() => {
        if (!src) { setPalette(null); return }
        let cancelled = false

        // v4's root "node-vibrant" export deliberately throws — it exists only
        // to tell you to pick an environment-specific entry point. This was the
        // actual bug causing every extraction to silently fail and fall back
        // to the hardcoded default color, no matter what album art was loaded.
        import('node-vibrant/browser').then(({ Vibrant }) => {
            Vibrant.from(src)
                .quality(4)      // sample every 4th pixel — plenty for a background tint, keeps it fast
                .getPalette()
                .then(swatches => {
                    if (cancelled) return

                    const pick = (...names) => {
                        for (const n of names) if (swatches[n]) return swatches[n]
                        return null
                    }

                    // Primary = the liveliest usable color; Secondary = a darker
                    // partner for the gradient so it reads as a real theme, not
                    // one flat wash. Falling back through muted/dark variants
                    // covers album art that's mostly grayscale or monochrome.
                    const primary = pick('Vibrant', 'LightVibrant', 'Muted', 'LightMuted')
                    const secondary = pick('DarkVibrant', 'DarkMuted', 'Muted', 'Vibrant')

                    if (!primary) { if (!cancelled) setPalette(null); return }

                    setPalette({
                        primaryRgb: primary.rgb,
                        secondaryRgb: (secondary || primary).rgb,
                        // v4 exposes this as a property, not a method
                        textOnPrimary: primary.titleTextColor || '#fff',
                    })
                })
                .catch((err) => {
                    console.warn('Album palette extraction failed (likely a CORS-blocked image host):', err)
                    if (!cancelled) setPalette(null)
                })
        }).catch((err) => {
            console.warn('Failed to load node-vibrant:', err)
            if (!cancelled) setPalette(null)
        })

        return () => { cancelled = true }
    }, [src])

    return palette
}

export default function Player() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isMobile = useMediaQuery('(max-width: 768px)')

    // Initialize song from context immediately to avoid blank flash on navigation
    const { playSong, currentSong, isPlaying, setIsPlaying, togglePlay,
        playNext, playPrev, currentTime, duration, seek, queue, playerRef,
        isShuffle, setIsShuffle, loopMode, setLoopMode } = usePlayer()

    const [song, setSong] = useState(() => {
        // If the player context already has this song loaded (by youtube_id or database id), use it immediately
        const isMatch = currentSong && (
            String(currentSong.youtube_id) === String(id) ||
            String(currentSong.id) === String(id)
        )
        return isMatch ? currentSong : null
    })
    const [syncedLyrics, setSyncedLyrics] = useState([])
    const [plainLyrics, setPlainLyrics] = useState('')
    const [loadingLyrics, setLoadingLyrics] = useState(true)
    const activeLyrics = syncedLyrics.length > 0
        ? syncedLyrics
        : parsePlainLyricsToTimed(plainLyrics, duration)
    // Raw lrclib results — held until we know the real YouTube duration so we
    // can pick the entry whose duration best matches the actual video length.
    const [lyricsResults, setLyricsResults] = useState([])
    const durationMatchedRef = useRef(false) // prevents re-picking on every 250ms poll tick
    const [currentLine, setCurrentLine] = useState(0)
    const [fullscreen, setFullscreen] = useState(false)
    const [fullscreenView, setFullscreenView] = useState('split') // 'split' | 'album' | 'queue'
    const [volume, setVolume] = useState(70)
    const [showQueuePanel, setShowQueuePanel] = useState(false)
    const lyricsRef = useRef(null)
    const lineRefs = useRef([])
    const fsLyricsRef = useRef(null)
    const fsLineRefs = useRef([])
    const [userScrolling, setUserScrolling] = useState(false)
    const userScrollTimeoutRef = useRef(null)
    const scrollRafRef = useRef(null)
    const [mobileLyricsExpanded, setMobileLyricsExpanded] = useState(false)
    const [lyricsOffset, setLyricsOffset] = useState(0) // manual ±s shift to fix intro drift

    const handleScroll = () => {
        setUserScrolling(true)
        if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current)
        userScrollTimeoutRef.current = setTimeout(() => setUserScrolling(false), 2500)
    }

    // Custom smooth-scroll with Apple-style easing (ease-out-quart)
    const smoothScrollTo = useCallback((container, targetY, duration = 520) => {
        if (!container) return
        if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)
        const startY = container.scrollTop
        const dist = targetY - startY
        if (Math.abs(dist) < 2) return
        const startTime = performance.now()
        const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4)
        const step = (now) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            container.scrollTop = startY + dist * easeOutQuart(progress)
            if (progress < 1) scrollRafRef.current = requestAnimationFrame(step)
        }
        scrollRafRef.current = requestAnimationFrame(step)
    }, [])

    const getRemainingTime = () => {
        const remaining = duration - currentTime
        return remaining > 0 ? `-${formatTime(remaining)}` : '0:00'
    }
    const { isFavorite, toggleFavorite } = useFavorites()
    const [showControls, setShowControls] = useState(true)
    const controlsTimeoutRef = useRef(null)

    const { user } = useAuth()
    const [playlists, setPlaylists] = useState([])
    const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false)
    const [toast, setToast] = useState(null)

    const triggerToast = (msg) => {
        setToast(msg)
        setTimeout(() => setToast(null), 2500)
    }

    useEffect(() => {
        if (user) {
            api.get('/playlists')
                .then(res => setPlaylists(res.data))
                .catch(() => { })
        }
    }, [user])

    const [artistSongs, setArtistSongs] = useState([])
    const [loadingArtistSongs, setLoadingArtistSongs] = useState(false)

    useEffect(() => {
        if (!song?.artist) {
            setArtistSongs([])
            setLoadingArtistSongs(false)
            return
        }

        let isMounted = true
        setLoadingArtistSongs(true)

        const cleanArtist = song.artist
            .replace(/vevo$/i, '')
            .replace(/ - topic$/i, '')
            .replace(/\(.*?\)/g, '')
            .replace(/ft\..*$/i, '')
            .replace(/feat\..*$/i, '')
            .trim()

        if (!cleanArtist) {
            setArtistSongs([])
            setLoadingArtistSongs(false)
            return
        }

        api.get('/search', { params: { term: cleanArtist } })
            .then(res => {
                if (!isMounted) return
                const data = res.data || {}
                const rawResults = Array.isArray(data) ? data : (data.results || [])

                const formatted = rawResults.map(item => ({
                    id: item.trackId || item.id,
                    trackId: item.trackId || item.id,
                    youtube_id: item.youtube_id || null,
                    title: item.trackName || item.title || '',
                    artist: item.artistName || item.artist || '',
                    thumbnail: item.artworkUrl100?.replace('100x100bb.jpg', '400x400bb.jpg') || item.thumbnail || '',
                    previewUrl: item.previewUrl || null,
                    mood: item.mood || null,
                    genre: item.genre || null,
                }))

                // Normalise a name for comparison: lowercase, strip feat./ft./vevo/topic
                // suffixes, collapse whitespace — the same transforms applied to cleanArtist.
                const normalise = (s) => (s || '')
                    .replace(/vevo$/i, '')
                    .replace(/ - topic$/i, '')
                    .replace(/\(.*?\)/g, '')
                    .replace(/ft\..*$/i, '')
                    .replace(/feat\..*$/i, '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .toLowerCase()

                const targetArtist = normalise(cleanArtist)

                const currentId = String(song.youtube_id || song.id || '')
                const currentTitleLower = (song.title || '').toLowerCase().trim()

                const filtered = formatted.filter(item => {
                    // Exact artist match — prevents unrelated artists with similar
                    // names (e.g. "Miguel A. Covarrubias" when playing "Miguel")
                    const itemArtist = normalise(item.artist)
                    if (itemArtist !== targetArtist) return false

                    // Exclude the currently playing track itself
                    const itemId = String(item.youtube_id || item.id || item.trackId || '')
                    const itemTitleLower = (item.title || '').toLowerCase().trim()
                    const isSameId = itemId && currentId && itemId === currentId
                    const isSameTitle = itemTitleLower && currentTitleLower && itemTitleLower === currentTitleLower

                    return !isSameId && !isSameTitle
                })

                setArtistSongs(filtered.slice(0, 5))
            })
            .catch(err => {
                console.warn('Failed to fetch artist songs:', err)
                if (isMounted) setArtistSongs([])
            })
            .finally(() => {
                if (isMounted) setLoadingArtistSongs(false)
            })

        return () => { isMounted = false }
    }, [song?.artist, song?.youtube_id, song?.id, song?.title])

    const handleAddSongToPlaylist = async (playlistId) => {
        try {
            await api.post(`/playlists/${playlistId}/songs`, {
                youtube_id: song.youtube_id,
                title: song.title,
                artist: song.artist,
                thumbnail: song.thumbnail,
                mood: song.mood,
                genre: song.genre
            })

            // Update the playlists count locally
            setPlaylists(playlists.map(pl => {
                if (pl.id === playlistId) {
                    return {
                        ...pl,
                        songs: [...(pl.songs || []), song]
                    }
                }
                return pl
            }))

            triggerToast('Added to playlist!')
            setShowPlaylistDropdown(false)
        } catch (err) {
            triggerToast('Failed to add song.')
        }
    }

    // usePlayer is destructured at the top of the function

    const cycleLoop = () => setLoopMode(m => m === 'none' ? 'all' : m === 'all' ? 'one' : 'none')

    const handleLyricClick = (time) => {
        seek(time)
        if (!isPlaying) {
            if (playerRef.current?.playVideo) {
                playerRef.current.playVideo()
            }
            setIsPlaying(true)
        }
    }

    const handleVolumeChange = (val) => {
        setVolume(val)
        if (playerRef.current?.setVolume) {
            playerRef.current.setVolume(val)
        }
        if (playerRef.current?.unMute && val > 0) {
            playerRef.current.unMute()
        }
    }

    // Sync song from context whenever it matches the current page ID (database id or youtube_id).
    // Essential for resolving search/iTunes tracks smoothly.
    useEffect(() => {
        const isMatch = currentSong && (
            String(currentSong.youtube_id) === String(id) ||
            String(currentSong.id) === String(id)
        )
        if (isMatch) {
            setSong(currentSong)
        }
    }, [currentSong, id])

    // Redirect handler: updates the URL when the active song changes (e.g. queue progression)
    useEffect(() => {
        if (currentSong && currentSong.youtube_id && String(currentSong.youtube_id) !== String(id)) {
            navigate(`/player/${currentSong.youtube_id}`, { replace: true })
        }
    }, [currentSong, id, navigate])

    // Re-fetch lyrics whenever the active song's artist or title changes
    const fetchedTrackRef = useRef('')
    useEffect(() => {
        if (!song?.artist && !song?.title) return
        const key = `${song.youtube_id || song.id}_${song.artist}_${song.title}`
        if (fetchedTrackRef.current === key) return
        fetchedTrackRef.current = key
        fetchLyrics(song.artist, song.title)
    }, [song?.artist, song?.title, song?.youtube_id, song?.id])

    const fetchLyrics = async (artist, title) => {
        if (!artist && !title) {
            setLoadingLyrics(false)
            setPlainLyrics('Lyrics not available')
            return
        }

        setLoadingLyrics(true)
        setSyncedLyrics([])
        setPlainLyrics('')

        const cleanString = (str) => {
            if (!str) return ''
            return str
                .replace(/\(.*?\)/g, '')
                .replace(/\[.*?\]/g, '')
                .replace(/ft\..*$/i, '')
                .replace(/feat\..*$/i, '')
                .replace(/official\s+music\s+video/gi, '')
                .replace(/official\s+video/gi, '')
                .replace(/official\s+audio/gi, '')
                .replace(/lyric\s+video/gi, '')
                .replace(/lyrics/gi, '')
                .replace(/remastered/gi, '')
                .replace(/\s+/g, ' ')
                .trim()
        }

        let parsedArtist = (artist || '').trim()
        let parsedTitle = (title || '').trim()

        // Clean VEVO or Topic suffixes from channel name
        if (parsedArtist.toLowerCase().endsWith('vevo')) {
            parsedArtist = parsedArtist.slice(0, -4).trim()
        }
        if (parsedArtist.toLowerCase().includes('- topic')) {
            parsedArtist = parsedArtist.replace(/- topic/gi, '').trim()
        }

        // Handle titles like "Artist - Title" vs "Title - Extra Info"
        if (parsedTitle.includes('-')) {
            const parts = parsedTitle.split('-')
            const part0 = parts[0].trim()
            const part1 = parts.slice(1).join('-').trim()

            // If parsedArtist is missing or generic, or part0 matches parsedArtist
            if (!parsedArtist || parsedArtist.toLowerCase().includes(part0.toLowerCase()) || part0.toLowerCase().includes(parsedArtist.toLowerCase())) {
                parsedArtist = part0
                parsedTitle = part1
            } else {
                // part0 is likely the actual title, part1 is extra info (e.g. "Remastered", "Single", etc.)
                parsedTitle = part0
            }
        }

        const cleanArtist = cleanString(parsedArtist)
        const cleanTitle = cleanString(parsedTitle)

        // Try LRCLIB: 1. Strict search by artist + track
        try {
            if (cleanArtist && cleanTitle) {
                const res = await api.get('/lyrics/search', { params: { artist_name: cleanArtist, track_name: cleanTitle } })
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setLyricsResults(res.data)
                    setLoadingLyrics(false)
                    return
                }
            }
        } catch { }

        // Try LRCLIB: 2. Combined query search ('q')
        try {
            const query = `${cleanArtist} ${cleanTitle}`.trim()
            if (query) {
                const res = await api.get('/lyrics/search', { params: { q: query } })
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setLyricsResults(res.data)
                    setLoadingLyrics(false)
                    return
                }
            }
        } catch { }

        // Try LRCLIB: 3. Search by track title only
        try {
            if (cleanTitle && cleanTitle.length > 2) {
                const res = await api.get('/lyrics/search', { params: { q: cleanTitle } })
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setLyricsResults(res.data)
                    setLoadingLyrics(false)
                    return
                }
            }
        } catch { }

        // Fallback: lyrics.ovh (clean artist & title)
        try {
            if (cleanArtist && cleanTitle) {
                const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.lyrics) {
                        setPlainLyrics(data.lyrics)
                        setLoadingLyrics(false)
                        return
                    }
                }
            }
        } catch { }

        // Fallback: lyrics.ovh (raw artist & title)
        try {
            if (artist && title) {
                const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.lyrics) {
                        setPlainLyrics(data.lyrics)
                        setLoadingLyrics(false)
                        return
                    }
                }
            }
        } catch { }

        setPlainLyrics('Lyrics not found for this song.')
        setLoadingLyrics(false)
    }

    // Pick the best lrclib entry by matching its stored duration to the YouTube
    // player's actual video duration. This fires:
    //   1. When results arrive (waits if duration not yet known)
    //   2. Once more when duration transitions 0 → real value (picks with truth)
    // The durationMatchedRef prevents re-picking on every 250ms polling tick.
    const hasDuration = duration > 0
    useEffect(() => {
        if (!lyricsResults.length) return

        const synced = lyricsResults.filter(e => e.syncedLyrics)
        const plain = lyricsResults.find(e => e.plainLyrics)

        if (synced.length === 0) {
            // No synced entry at all — use plain text immediately
            if (plain) { setSyncedLyrics([]); setPlainLyrics(plain.plainLyrics) }
            durationMatchedRef.current = true
            return
        }

        // Wait until we have a real video duration (> 10s) before picking
        // so we always match against the actual YouTube track length.
        if (duration <= 10) return

        console.log('LYRICS PICK — video duration:', duration, 'lrc entries:', synced.map(e => e.duration))

        const best = synced.reduce((a, b) =>
            Math.abs(a.duration - duration) <= Math.abs(b.duration - duration) ? a : b
        )

        setSyncedLyrics(parseLRC(best.syncedLyrics))
        setPlainLyrics('')
        durationMatchedRef.current = true
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lyricsResults, duration])

    useEffect(() => {
        setCurrentLine(0); setSyncedLyrics([]); setPlainLyrics(''); setLoadingLyrics(true); setMobileLyricsExpanded(false)
        setLyricsResults([])         // clear stored results so the picker resets
        durationMatchedRef.current = false  // allow one re-pick once duration is known
        const isMatch = currentSong && (
            String(currentSong.youtube_id) === String(id) ||
            String(currentSong.id) === String(id)
        )

        if (isMatch) {
            // Song already loaded in context — use it immediately, no API call needed
            setSong(currentSong)
            fetchLyrics(currentSong.artist, currentSong.title)
        } else {
            // Song not in context (deep link / page refresh) — fetch from API
            api.get(`/songs/${id}`)
                .then(res => { setSong(res.data); playSong(res.data); fetchLyrics(res.data.artist, res.data.title) })
                .catch(() => {
                    if (currentSong) { setSong(currentSong); fetchLyrics(currentSong.artist, currentSong.title) }
                    else { setLoadingLyrics(false) }
                })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    useEffect(() => {
        if (!activeLyrics.length) return
        let idx = 0
        for (let i = 0; i < activeLyrics.length; i++) {
            if (currentTime >= activeLyrics[i].time) idx = i
        }

        if (idx !== currentLine) {
            setCurrentLine(idx)
        }
    }, [currentTime, activeLyrics, currentLine])

    useEffect(() => {
        if (userScrolling || !activeLyrics.length) return

        // Normal (non-fullscreen) lyrics panel — Apple-style smooth RAF easing
        const elNorm = lineRefs.current[currentLine]
        const containerNorm = lyricsRef.current
        if (elNorm && containerNorm) {
            const elTop = elNorm.offsetTop
            const elHeight = elNorm.offsetHeight
            const containerHeight = containerNorm.clientHeight
            const targetScrollTop = elTop - containerHeight / 2 + elHeight / 2
            smoothScrollTo(containerNorm, targetScrollTop, 520)
        }

        // Fullscreen lyrics panel — custom RAF easing for Apple-style smoothness
        const el = fsLineRefs.current[currentLine]
        const container = fsLyricsRef.current
        if (el && container) {
            const elTop = el.offsetTop
            const elHeight = el.offsetHeight
            const containerHeight = container.clientHeight
            const targetScrollTop = elTop - containerHeight / 2 + elHeight / 2
            smoothScrollTo(container, targetScrollTop, 520)
        }
    }, [currentLine, userScrolling, activeLyrics, smoothScrollTo])

    useEffect(() => {
        return () => {
            if (userScrollTimeoutRef.current) {
                clearTimeout(userScrollTimeoutRef.current)
            }
        }
    }, [])

    // Enter/exit native browser fullscreen in sync with our immersive view,
    // matching Spotify's behavior where the browser chrome fully disappears.
    useEffect(() => {
        if (fullscreen && !isMobile) {
            // Request native browser fullscreen (hides address bar, tabs, taskbar)
            if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => { })
            }
            document.body.style.overflow = 'hidden'
        } else {
            // Exit native fullscreen if we were in it
            if (document.exitFullscreen && document.fullscreenElement) {
                document.exitFullscreen().catch(() => { })
            }
            document.body.style.overflow = ''
        }

        // Sync React state if user exits via browser Esc or native controls
        const onFsChange = () => {
            if (!document.fullscreenElement) {
                setFullscreen(false)
            }
        }
        document.addEventListener('fullscreenchange', onFsChange)
        return () => {
            document.removeEventListener('fullscreenchange', onFsChange)
        }
    }, [fullscreen, isMobile])

    // Desktop fullscreen: lyrics visible by default; toggle switches to queue view.
    useEffect(() => {
        if (fullscreen && !isMobile) setShowQueuePanel(false)
    }, [fullscreen, isMobile])

    // Autohide fullscreen controls when mouse/keyboard is inactive (Spotify desktop style)
    useEffect(() => {
        if (!fullscreen) return

        const handleUserActivity = () => {
            setShowControls(true)
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current)
            }
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false)
            }, 2500)
        }

        const events = ['mousemove', 'mousedown', 'keydown', 'keyup', 'touchstart', 'pointermove', 'wheel']
        events.forEach(ev => window.addEventListener(ev, handleUserActivity))

        setShowControls(true)
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false)
        }, 2500)

        return () => {
            events.forEach(ev => window.removeEventListener(ev, handleUserActivity))
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        }
    }, [fullscreen])

    const thumbSrc = song ? (song.thumbnail || `https://img.youtube.com/vi/${song.youtube_id}/maxresdefault.jpg`) : null
    // Runs for both views (not just fullscreen) so the normal player page
    // picks up the album's color theme too, matching Spotify's behavior.
    const palette = useAlbumPalette(thumbSrc)
    const [pr, pg, pb] = palette ? palette.primaryRgb : [231, 76, 60]
    const [sr, sg, sb] = palette ? palette.secondaryRgb : [80, 50, 180]
    const glowA = `rgba(${pr}, ${pg}, ${pb}, 0.55)`
    const glowB = `rgba(${sr}, ${sg}, ${sb}, 0.4)`
    const glowASoft = `rgba(${pr}, ${pg}, ${pb}, 0.22)`
    const glowBSoft = `rgba(${sr}, ${sg}, ${sb}, 0.16)`

    if (!song) return <p style={{ padding: '32px', color: '#aaa' }}>Loading...</p>

    // Compute the fullscreen lyric preview slice + correct highlighted index
    const previewStart = Math.max(0, currentLine - 1)
    const previewSlice = syncedLyrics.slice(previewStart, currentLine + 4)
    const previewHighlightIdx = currentLine - previewStart

    // Calculate Up Next songs
    const currentIdx = queue ? queue.findIndex(s => s.youtube_id === currentSong?.youtube_id) : -1
    const upNextSongs = currentIdx !== -1 && queue ? queue.slice(currentIdx + 1, currentIdx + 4) : []

    return (
        <>
            {/* Shared keyframes — rendered unconditionally so the normal view's
                color-crossfade layers can use npFadeIn even when fullscreen is closed. */}
            <style>{`
                @keyframes npFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes npDotPulse {
                    0%, 100% { transform: scale(0.7); opacity: 0.4; }
                    50% { transform: scale(1); opacity: 1; }
                }
                @keyframes npDrift1 {
                    0%   { transform: translate(-8%, -6%) scale(1); }
                    50%  { transform: translate(6%, 4%) scale(1.12); }
                    100% { transform: translate(-8%, -6%) scale(1); }
                }
                @keyframes npDrift2 {
                    0%   { transform: translate(6%, 8%) scale(1.05); }
                    50%  { transform: translate(-8%, -4%) scale(0.95); }
                    100% { transform: translate(6%, 8%) scale(1.05); }
                }
                @keyframes npBreathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.018); }
                }
            `}</style>

            {/* FULLSCREEN OVERLAY */}
            {fullscreen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 999,
                    display: 'flex', flexDirection: 'column',
                    padding: (fullscreenView === 'album' && !isMobile) ? '0' : (isMobile ? '20px 20px 28px' : '28px 56px 24px'),
                    color: '#fff',
                    background: '#050505',
                    animation: 'npFadeIn 0.35s ease',
                    overflow: isMobile ? 'auto' : 'hidden',
                }}>
                    <style>{`
                        @keyframes npFadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes npDrift1 {
                            0%   { transform: translate(-8%, -6%) scale(1); }
                            50%  { transform: translate(6%, 4%) scale(1.12); }
                            100% { transform: translate(-8%, -6%) scale(1); }
                        }
                        @keyframes npDrift2 {
                            0%   { transform: translate(6%, 8%) scale(1.05); }
                            50%  { transform: translate(-8%, -4%) scale(0.95); }
                            100% { transform: translate(6%, 8%) scale(1.05); }
                        }
                        @keyframes npBreathe {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.018); }
                        }
                        @keyframes npLineIn {
                            from { opacity: 0; transform: translateY(6px); }
                            to   { opacity: 1; transform: translateY(0); }
                        }
                        .np-lyric-line { animation: npLineIn 0.45s ease both; }
                        .np-seek:hover .np-seek-thumb { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        .np-icon-btn { color: rgba(255,255,255,0.62); transition: color 0.2s ease, transform 0.15s ease; }
                        .np-icon-btn:hover { color: #fff; transform: scale(1.06); }
                        .np-icon-btn:active { transform: scale(0.94); }
                    `}</style>

                    {/* Ambient layered background: blurred art + two slow-drifting color blobs + grain (hidden in album view — it uses its own gradient) */}
                    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', opacity: fullscreenView === 'album' ? 0 : 1, transition: 'opacity 0.4s ease', pointerEvents: 'none' }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            backgroundImage: `url(${thumbSrc})`,
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            filter: 'blur(100px) brightness(0.14) saturate(1.85)',
                            transform: 'scale(1.2)',
                        }} />
                        <div key={`glowA-${song.youtube_id}`} style={{
                            position: 'absolute', width: '70%', height: '70%', top: '-10%', left: '-10%',
                            background: `radial-gradient(circle, ${glowA} 0%, transparent 70%)`,
                            filter: 'blur(60px)', animation: 'npDrift1 18s ease-in-out infinite, npFadeIn 1.2s ease',
                        }} />
                        <div key={`glowB-${song.youtube_id}`} style={{
                            position: 'absolute', width: '65%', height: '65%', bottom: '-15%', right: '-10%',
                            background: `radial-gradient(circle, ${glowB} 0%, transparent 70%)`,
                            filter: 'blur(60px)', animation: 'npDrift2 22s ease-in-out infinite, npFadeIn 1.2s ease',
                        }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />
                        {/* subtle film grain for texture, matches the "premium streaming app" feel */}
                        <div style={{
                            position: 'absolute', inset: 0, opacity: 0.05, mixBlendMode: 'overlay',
                            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                        }} />
                    </div>



                    {/* ── MAIN LAYOUT ── */}
                    <div style={{
                        position: 'relative', zIndex: 1,
                        display: 'flex',
                        flex: 1,
                        minHeight: 0,
                        flexDirection: 'column',
                        gap: '0',
                        margin: (fullscreenView === 'album' && !isMobile) ? '-28px -56px -24px' : '0',
                    }}>
                        {isMobile ? (
                            /* ── MOBILE: fullscreen lyrics view (Apple Music style) ── */
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: 0,
                                zIndex: 1,
                                paddingBottom: 'env(safe-area-inset-bottom)',
                            }}>
                                {/* Top Header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '8px 0 16px', flexShrink: 0, width: '100%'
                                }}>
                                    <button
                                        onClick={() => setFullscreen(false)}
                                        className="np-icon-btn"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}
                                        aria-label="Close"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>
                                    <div style={{ textAlign: 'center', overflow: 'hidden', flex: 1, padding: '0 12px' }}>
                                        <p style={{ fontSize: '14px', fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff', margin: '0 0 2px' }}>{song.title}</p>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{song.artist}</p>
                                    </div>
                                    {/* Spacer to keep title centered */}
                                    <div style={{ width: '40px', flexShrink: 0 }} />
                                </div>

                                {/* Lyrics scroll panel */}
                                <div
                                    ref={fsLyricsRef}
                                    onScroll={handleScroll}
                                    style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        minHeight: 0,
                                        maskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
                                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
                                        scrollBehavior: 'smooth',
                                        padding: '40px 10px 240px', // large padding bottom so active line stays centered
                                    }}
                                >
                                    {loadingLyrics ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {Array.from({ length: 6 }).map((_, i) => (
                                                <div key={i} className="skeleton" style={{ height: '24px', width: `${45 + (i % 3) * 18}%`, borderRadius: '6px' }} />
                                            ))}
                                        </div>
                                    ) : activeLyrics.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {activeLyrics.map((line, i) => {
                                                const isActive = i === currentLine
                                                return (
                                                    <p
                                                        key={i}
                                                        ref={el => fsLineRefs.current[i] = el}
                                                        onClick={() => handleLyricClick(line.time)}
                                                        style={{
                                                            fontSize: isActive ? '28px' : '22px',
                                                            fontWeight: isActive ? '800' : '600',
                                                            color: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                                                            lineHeight: '1.45',
                                                            margin: '16px 0',
                                                            cursor: 'pointer',
                                                            transition: 'font-size 0.4s cubic-bezier(0.34, 1.2, 0.64, 1), color 0.4s ease, opacity 0.4s ease',
                                                            willChange: 'font-size, color',
                                                            letterSpacing: isActive ? '-0.5px' : '-0.1px',
                                                            opacity: isActive ? 1 : i < currentLine ? 0.35 : 0.45,
                                                        }}
                                                    >
                                                        {line.text}
                                                    </p>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '22px', fontWeight: '600', textAlign: 'center', marginTop: '60px' }}>Lyrics not available</p>
                                    )}
                                </div>

                                {/* Bottom Controls */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 8px 12px', flexShrink: 0, width: '100%' }}>
                                    {/* Action buttons (Share + Heart + Ellipsis) */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                                        <button className="np-icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                                <polyline points="16 6 12 2 8 6" />
                                                <line x1="12" y1="2" x2="12" y2="15" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const favorited = isFavorite(song?.youtube_id)
                                                toggleFavorite(song)
                                                triggerToast(favorited ? 'Removed from Favorites' : 'Added to Favorites!')
                                            }}
                                            className="np-icon-btn"
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: isFavorite(song?.youtube_id) ? '#e74c3c' : 'rgba(255,255,255,0.6)',
                                                transition: 'color 0.2s, transform 0.15s ease'
                                            }}
                                            title={isFavorite(song?.youtube_id) ? 'Remove from favorites' : 'Add to favorites'}
                                        >
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill={isFavorite(song?.youtube_id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                            </svg>
                                        </button>
                                        <button className="np-icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                                                <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
                                                <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Seek Bar slider */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            color: 'rgba(255,255,255,0.5)', fontSize: '11px',
                                            minWidth: '32px', textAlign: 'left', fontVariantNumeric: 'tabular-nums', fontWeight: '600',
                                        }}>{formatTime(currentTime)}</span>
                                        <div
                                            className="np-seek"
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect()
                                                seek((e.clientX - rect.left) / rect.width * duration)
                                            }}
                                            style={{
                                                flex: 1, height: '4px',
                                                background: 'rgba(255,255,255,0.2)',
                                                borderRadius: '99px', cursor: 'pointer', position: 'relative',
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                                                background: '#fff', borderRadius: '99px',
                                            }} />
                                        </div>
                                        <span style={{
                                            color: 'rgba(255,255,255,0.5)', fontSize: '11px',
                                            minWidth: '32px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: '600',
                                        }}>{getRemainingTime()}</span>
                                    </div>

                                    {/* Play / Pause button */}
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '4px' }}>
                                        <button
                                            onClick={togglePlay}
                                            style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: '50%', background: '#fff',
                                                border: 'none', cursor: 'pointer', flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                                transition: 'transform 0.18s ease',
                                            }}
                                        >
                                            {isPlaying
                                                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="#000"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                                                : <svg width="22" height="22" viewBox="0 0 24 24" fill="#000" style={{ marginLeft: '3px' }}><polygon points="5,3 19,12 5,21" /></svg>
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ── DESKTOP: Immersive design matching mock (album + controls left, lyrics right) ── */
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                minHeight: 0,
                                gap: '56px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '32px 56px',
                                position: 'relative',
                            }}>

                                {/* Top Right View Mode Switcher (Album / Lyrics / Queue) — hidden in album view, which has its own header */}
                                <div style={{
                                    position: 'absolute',
                                    top: '24px',
                                    right: '48px',
                                    zIndex: 100,
                                    display: fullscreenView === 'album' ? 'none' : 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    opacity: showControls ? 1 : 0,
                                    pointerEvents: showControls ? 'auto' : 'none',
                                    transition: 'opacity 0.4s ease',
                                }}>
                                    {/* Segmented Control Pill Container */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        background: 'rgba(0, 0, 0, 0.35)',
                                        backdropFilter: 'blur(20px)',
                                        WebkitBackdropFilter: 'blur(20px)',
                                        padding: '3px',
                                        borderRadius: '24px',
                                        border: '1px solid rgba(255, 255, 255, 0.10)',
                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
                                    }}>
                                        {/* Album View Button */}
                                        <button
                                            onClick={() => setFullscreenView('album')}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '6px 14px', borderRadius: '20px', border: 'none',
                                                background: fullscreenView === 'album' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                                                backdropFilter: fullscreenView === 'album' ? 'blur(8px)' : 'none',
                                                color: fullscreenView === 'album' ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                                                fontSize: '12px', fontWeight: '600', letterSpacing: '-0.1px',
                                                cursor: 'pointer', transition: 'all 0.22s ease',
                                                boxShadow: fullscreenView === 'album' ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                                            }}
                                            onMouseEnter={e => { if (fullscreenView !== 'album') { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; } }}
                                            onMouseLeave={e => { if (fullscreenView !== 'album') { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)'; e.currentTarget.style.background = 'transparent'; } }}
                                            title="Album View"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                            <span>Album</span>
                                        </button>

                                        {/* Lyrics View Button */}
                                        <button
                                            onClick={() => { setFullscreenView('split'); setShowQueuePanel(false); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '6px 14px', borderRadius: '20px', border: 'none',
                                                background: (fullscreenView === 'split' && !showQueuePanel) ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                                                backdropFilter: (fullscreenView === 'split' && !showQueuePanel) ? 'blur(8px)' : 'none',
                                                color: (fullscreenView === 'split' && !showQueuePanel) ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                                                fontSize: '12px', fontWeight: '600', letterSpacing: '-0.1px',
                                                cursor: 'pointer', transition: 'all 0.22s ease',
                                                boxShadow: (fullscreenView === 'split' && !showQueuePanel) ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                                            }}
                                            onMouseEnter={e => { if (!(fullscreenView === 'split' && !showQueuePanel)) { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; } }}
                                            onMouseLeave={e => { if (!(fullscreenView === 'split' && !showQueuePanel)) { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)'; e.currentTarget.style.background = 'transparent'; } }}
                                            title="Lyrics View"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                            </svg>
                                            <span>Lyrics</span>
                                        </button>

                                        {/* Queue View Button */}
                                        <button
                                            onClick={() => { setFullscreenView('split'); setShowQueuePanel(true); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '6px 14px', borderRadius: '20px', border: 'none',
                                                background: (fullscreenView === 'split' && showQueuePanel) ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                                                backdropFilter: (fullscreenView === 'split' && showQueuePanel) ? 'blur(8px)' : 'none',
                                                color: (fullscreenView === 'split' && showQueuePanel) ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                                                fontSize: '12px', fontWeight: '600', letterSpacing: '-0.1px',
                                                cursor: 'pointer', transition: 'all 0.22s ease',
                                                boxShadow: (fullscreenView === 'split' && showQueuePanel) ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                                            }}
                                            onMouseEnter={e => { if (!(fullscreenView === 'split' && showQueuePanel)) { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; } }}
                                            onMouseLeave={e => { if (!(fullscreenView === 'split' && showQueuePanel)) { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)'; e.currentTarget.style.background = 'transparent'; } }}
                                            title="Up Next / Queue"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="8" y1="6" x2="21" y2="6" />
                                                <line x1="8" y1="12" x2="21" y2="12" />
                                                <line x1="8" y1="18" x2="21" y2="18" />
                                                <line x1="3" y1="6" x2="3.01" y2="6" />
                                                <line x1="3" y1="12" x2="3.01" y2="12" />
                                                <line x1="3" y1="18" x2="3.01" y2="18" />
                                            </svg>
                                            <span>Queue</span>
                                        </button>
                                    </div>

                                    {/* Exit Fullscreen Button */}
                                    <button
                                        onClick={() => setFullscreen(false)}
                                        style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: 'rgba(0, 0, 0, 0.35)',
                                            backdropFilter: 'blur(20px)',
                                            WebkitBackdropFilter: 'blur(20px)',
                                            border: '1px solid rgba(255, 255, 255, 0.10)',
                                            color: 'rgba(255, 255, 255, 0.75)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', transition: 'all 0.2s ease',
                                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'; e.currentTarget.style.background = 'rgba(0, 0, 0, 0.35)'; }}
                                        title="Exit Fullscreen"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                                            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                                            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                                            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                                        </svg>
                                    </button>
                                </div>

                                {fullscreenView === 'album' ? (
                                    /* ── SPOTIFY PREMIUM DESKTOP FULLSCREEN (Matching User Images 1 & 2) ── */
                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%',
                                        minHeight: 0,
                                        overflow: 'hidden',
                                        cursor: showControls ? 'default' : 'none',
                                        background: `linear-gradient(160deg, rgba(${pr},${pg},${pb},0.75) 0%, rgba(${Math.max(0, pr - 45)},${Math.max(0, pg - 45)},${Math.max(0, pb - 45)},0.90) 55%, rgba(6,6,8,0.98) 100%)`,
                                        transition: 'background 1s ease',
                                    }}>
                                        {/* Blurred album art wash background */}
                                        <div style={{
                                            position: 'absolute', inset: 0, zIndex: 0,
                                            backgroundImage: `url(${thumbSrc})`,
                                            backgroundSize: 'cover', backgroundPosition: 'center',
                                            filter: 'blur(80px) brightness(0.20) saturate(2)',
                                            transform: 'scale(1.15)',
                                            transition: 'background-image 0.8s ease',
                                        }} />
                                        {/* Radial dark vignette for depth */}
                                        <div style={{
                                            position: 'absolute', inset: 0, zIndex: 1,
                                            background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.65) 100%)',
                                            pointerEvents: 'none',
                                        }} />

                                        {/* ── Top Header Bar (Spotify style — autohides on idle) ── */}
                                        <div style={{
                                            position: 'relative', zIndex: 20,
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: isMobile ? '16px 20px' : '20px 36px',
                                            flexShrink: 0,
                                            opacity: showControls ? 1 : 0,
                                            transition: 'opacity 0.4s ease',
                                            pointerEvents: showControls ? 'auto' : 'none',
                                        }}>
                                            {/* Top-Left: Song Title */}
                                            <h1 style={{
                                                fontSize: '15px', fontWeight: '700', color: '#ffffff', margin: 0,
                                                letterSpacing: '-0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '40vw',
                                            }}>
                                                {song.title}
                                            </h1>

                                            {/* Top-Right: View Mode Switcher (desktop only) + Exit button */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {/* View switcher pill — desktop only */}
                                                {!isMobile && (
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: '3px',
                                                        background: 'rgba(0, 0, 0, 0.40)',
                                                        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                                                        padding: '3px', borderRadius: '24px',
                                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
                                                    }}>
                                                        {[
                                                            { label: 'Cover', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></svg>, action: () => setFullscreenView('album'), active: fullscreenView === 'album' },
                                                            { label: 'Lyrics', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, action: () => { setFullscreenView('split'); setShowQueuePanel(false) }, active: fullscreenView === 'split' && !showQueuePanel },
                                                            { label: 'Queue', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>, action: () => { setFullscreenView('split'); setShowQueuePanel(true) }, active: fullscreenView === 'split' && showQueuePanel },
                                                        ].map(({ label, icon, action, active }) => (
                                                            <button
                                                                key={label} onClick={action} title={label}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                                    padding: '6px 14px', borderRadius: '20px', border: 'none',
                                                                    background: active ? 'rgba(255, 255, 255, 0.20)' : 'transparent',
                                                                    backdropFilter: active ? 'blur(8px)' : 'none',
                                                                    color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.60)',
                                                                    fontSize: '12px', fontWeight: '600', letterSpacing: '-0.1px',
                                                                    cursor: 'pointer', transition: 'all 0.22s ease',
                                                                    boxShadow: active ? '0 2px 8px rgba(0, 0, 0, 0.25)' : 'none',
                                                                }}
                                                                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; } }}
                                                                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.60)'; e.currentTarget.style.background = 'transparent'; } }}
                                                            >
                                                                {icon} {label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Exit Fullscreen Button */}
                                                <button
                                                    onClick={() => setFullscreen(false)} title="Exit Fullscreen"
                                                    style={{
                                                        width: '32px', height: '32px', borderRadius: '50%',
                                                        background: 'rgba(0, 0, 0, 0.40)',
                                                        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                                        color: 'rgba(255, 255, 255, 0.75)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer', transition: 'all 0.2s ease',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'; e.currentTarget.style.background = 'rgba(0, 0, 0, 0.40)'; }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                                                        <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                                                        <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                                                        <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* ── Always-visible Song Info pinned bottom-left of full container (Spotify Image 2) ── */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: showControls ? (isMobile ? '88px' : '100px') : (isMobile ? '24px' : '36px'),
                                            left: isMobile ? '20px' : '32px',
                                            pointerEvents: 'none',
                                            zIndex: 25,
                                            transition: 'bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        }}>
                                            <p style={{
                                                fontSize: isMobile ? '18px' : '22px', fontWeight: '800',
                                                color: '#ffffff', margin: '0 0 3px', letterSpacing: '-0.4px',
                                                textShadow: '0 2px 24px rgba(0, 0, 0, 0.85)',
                                                maxWidth: '55vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2,
                                            }}>{song.title}</p>
                                            <p style={{
                                                fontSize: isMobile ? '13px' : '14px', fontWeight: '500',
                                                color: 'rgba(255,255,255,0.65)', margin: 0, letterSpacing: '0.05px',
                                                textShadow: '0 1px 12px rgba(0,0,0,0.7)',
                                                maxWidth: '55vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>{song.artist}</p>
                                        </div>

                                        {/* ── Center: Album Art (fills all space between top bar and bottom bar) ── */}
                                        <div style={{
                                            position: 'relative', zIndex: 2,
                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            minHeight: 0, padding: '12px 36px 12px',
                                        }}>
                                            {/* Breathing ambient color glow orb behind artwork */}
                                            <div style={{
                                                position: 'absolute',
                                                width: isMobile ? '320px' : '80vh',
                                                height: isMobile ? '320px' : '80vh',
                                                borderRadius: '50%',
                                                background: `radial-gradient(circle, rgba(${pr},${pg},${pb},0.50) 0%, transparent 68%)`,
                                                filter: 'blur(72px)',
                                                pointerEvents: 'none',
                                                animation: 'npBreathe 8s ease-in-out infinite',
                                                zIndex: 0,
                                            }} />

                                            {/* Centered Album Art Container with Crisp White Frame */}
                                            <div
                                                onClick={togglePlay}
                                                style={{
                                                    position: 'relative', zIndex: 1,
                                                    width: isMobile ? 'min(80vw, 280px)' : 'min(calc(100vh - 160px), 68vmin)',
                                                    height: isMobile ? 'min(80vw, 280px)' : 'min(calc(100vh - 160px), 68vmin)',
                                                    maxHeight: isMobile ? '280px' : '560px',
                                                    maxWidth: isMobile ? '280px' : '560px',
                                                    padding: '8px',
                                                    background: '#ffffff',
                                                    borderRadius: '16px',
                                                    boxShadow: `0 35px 95px rgba(0, 0, 0, 0.75), 0 0 120px rgba(${pr},${pg},${pb},0.45)`,
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease',
                                                    animation: isPlaying ? 'npBreathe 6s ease-in-out infinite' : 'none',
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)'
                                                    e.currentTarget.style.boxShadow = `0 45px 110px rgba(0,0,0,0.85), 0 0 140px rgba(${pr},${pg},${pb},0.55)`
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                                    e.currentTarget.style.boxShadow = `0 35px 95px rgba(0, 0, 0, 0.75), 0 0 120px rgba(${pr},${pg},${pb},0.45)`
                                                }}
                                            >
                                                <img
                                                    src={thumbSrc}
                                                    alt={song.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px', display: 'block' }}
                                                />
                                            </div>
                                        </div>

                                        {/* ── Spotify Full-Width Docked Bottom Player Bar (autohides on idle) ── */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px 28px',
                                            background: '#000000',
                                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                            flexShrink: 0,
                                            zIndex: 30,
                                            opacity: showControls ? 1 : 0,
                                            transform: showControls ? 'translateY(0)' : 'translateY(100%)',
                                            transition: 'opacity 0.4s ease, transform 0.4s ease',
                                            pointerEvents: showControls ? 'auto' : 'none',
                                        }}>
                                            {/* Left: Thumbnail + Song Title + Artist + Favorite (+) Button */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '0 0 280px', minWidth: 0 }}>
                                                <img src={thumbSrc} alt={song.title} style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#fff', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</p>
                                                    <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.artist}</p>
                                                </div>
                                                {/* Spotify (+) Add to Favorites button */}
                                                <button
                                                    onClick={() => {
                                                        const favorited = isFavorite(song?.youtube_id)
                                                        toggleFavorite(song)
                                                        triggerToast(favorited ? 'Removed from Favorites' : 'Added to Favorites!')
                                                    }}
                                                    style={{
                                                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                                                        color: isFavorite(song?.youtube_id) ? '#1db954' : 'rgba(255, 255, 255, 0.65)',
                                                        transition: 'color 0.2s, transform 0.15s ease', flexShrink: 0,
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                    title={isFavorite(song?.youtube_id) ? 'Remove from Favorites' : 'Add to Favorites'}
                                                >
                                                    {isFavorite(song?.youtube_id) ? (
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                                    ) : (
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Center: Controls + Progress Seek Line */}
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', maxWidth: '560px' }}>
                                                {/* Playback Buttons */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                                                    <button onClick={() => setIsShuffle(p => !p)} className="np-icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: isShuffle ? '#1db954' : 'rgba(255,255,255,0.5)' }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>
                                                    </button>
                                                    <button onClick={playPrev} className="np-icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.85)' }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4" /><rect x="5" y="4" width="3" height="16" rx="1" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={togglePlay}
                                                        style={{
                                                            width: '36px', height: '36px', borderRadius: '50%', background: '#ffffff',
                                                            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'transform 0.15s ease', boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                    >
                                                        {isPlaying
                                                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="#000"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                                                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" style={{ marginLeft: '2px' }}><polygon points="5,3 19,12 5,21" /></svg>
                                                        }
                                                    </button>
                                                    <button onClick={playNext} className="np-icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.85)' }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20" /><rect x="16" y="4" width="3" height="16" rx="1" /></svg>
                                                    </button>
                                                    <button onClick={cycleLoop} className="np-icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: loopMode !== 'none' ? '#1db954' : 'rgba(255,255,255,0.5)' }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                                                    </button>
                                                </div>
                                                {/* Progress Seek Timeline Line */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', minWidth: '32px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatTime(currentTime)}</span>
                                                    <div
                                                        className="np-seek"
                                                        onClick={(e) => {
                                                            const rect = e.currentTarget.getBoundingClientRect()
                                                            seek((e.clientX - rect.left) / rect.width * duration)
                                                        }}
                                                        style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '99px', cursor: 'pointer', position: 'relative' }}
                                                    >
                                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, background: '#fff', borderRadius: '99px' }} />
                                                    </div>
                                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', minWidth: '32px', textAlign: 'left', fontVariantNumeric: 'tabular-nums' }}>{getRemainingTime()}</span>
                                                </div>
                                            </div>

                                            {/* Right: Lyrics, Queue, Volume */}
                                            {!isMobile && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '0 0 240px', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => { setFullscreenView('split'); setShowQueuePanel(false) }} className="np-icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }} title="Lyrics">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                    </button>
                                                    <button onClick={() => { setFullscreenView('split'); setShowQueuePanel(true) }} className="np-icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }} title="Queue">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                                                    </button>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '90px' }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /></svg>
                                                        <input type="range" min="0" max="100" value={volume} onChange={e => handleVolumeChange(Number(e.target.value))} style={{ flex: 1, accentColor: '#fff', cursor: 'pointer', height: '4px' }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Left column: Album art + Controls */}
                                        <div style={{
                                            width: '320px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: 0,
                                            zIndex: 5,
                                            transition: 'opacity 0.3s ease',
                                            opacity: showControls ? 1 : 0.85,
                                        }}>
                                            {/* Album Cover — fixed 260×260px, Apple Music proportions */}
                                            <div
                                                onClick={togglePlay}
                                                style={{
                                                    width: '260px',
                                                    height: '260px',
                                                    borderRadius: '10px',
                                                    overflow: 'hidden',
                                                    boxShadow: `0 20px 48px rgba(0,0,0,0.65), 0 0 60px ${glowASoft}`,
                                                    cursor: 'pointer',
                                                    flexShrink: 0,
                                                    transition: 'transform 0.3s ease',
                                                    animation: isPlaying ? 'npBreathe 6s ease-in-out infinite' : 'none',
                                                    marginBottom: '16px',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.015)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                <img
                                                    src={thumbSrc}
                                                    alt={song.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                />
                                            </div>

                                            {/* Metadata Row (Title + Star/Ellipsis actions) */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, width: '100%', marginBottom: '12px', position: 'relative' }}>
                                                <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                                                    <h2 style={{
                                                        fontSize: '20px',
                                                        fontWeight: '800',
                                                        letterSpacing: '-0.4px',
                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        marginBottom: '3px', lineHeight: '1.2',
                                                        color: '#fff',
                                                    }}>{song.title}</h2>
                                                    <p style={{
                                                        fontSize: '13px',
                                                        color: 'rgba(255,255,255,0.55)',
                                                        fontWeight: '500',
                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                    }}>{song.artist}</p>
                                                </div>

                                                {/* Actions */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                                                    {/* Heart (Like) Button */}
                                                    <button
                                                        onClick={() => {
                                                            const favorited = isFavorite(song?.youtube_id)
                                                            toggleFavorite(song)
                                                            triggerToast(favorited ? 'Removed from Favorites' : 'Added to Favorites!')
                                                        }}
                                                        className="np-icon-btn"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: isFavorite(song?.youtube_id) ? '#e74c3c' : 'rgba(255,255,255,0.5)' }}
                                                        title={isFavorite(song?.youtube_id) ? 'Remove from favorites' : 'Add to favorites'}
                                                    >
                                                        <svg width="22" height="22" viewBox="0 0 24 24" fill={isFavorite(song?.youtube_id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                                        </svg>
                                                    </button>

                                                    {/* Ellipsis (Options / Add to Playlist) Button */}
                                                    <div style={{ position: 'relative' }}>
                                                        <button
                                                            onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
                                                            className="np-icon-btn"
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: showPlaylistDropdown ? '#fff' : 'rgba(255,255,255,0.5)' }}
                                                            title="Add to Playlist"
                                                        >
                                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                                                            </svg>
                                                        </button>
                                                        {showPlaylistDropdown && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                bottom: 'calc(100% + 12px)',
                                                                right: '0',
                                                                background: '#181818',
                                                                border: '1px solid rgba(255,255,255,0.08)',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                                                                zIndex: 100,
                                                                width: '200px',
                                                                maxHeight: '180px',
                                                                overflowY: 'auto',
                                                                padding: '6px',
                                                            }}>
                                                                {playlists.length === 0 ? (
                                                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '10px', textAlign: 'center' }}>No playlists</p>
                                                                ) : (
                                                                    playlists.map(pl => (
                                                                        <div
                                                                            key={pl.id}
                                                                            onClick={() => handleAddSongToPlaylist(pl.id)}
                                                                            style={{
                                                                                padding: '8px 12px',
                                                                                fontSize: '13px',
                                                                                borderRadius: '6px',
                                                                                cursor: 'pointer',
                                                                                color: 'rgba(255,255,255,0.8)',
                                                                                transition: 'background 0.2s',
                                                                            }}
                                                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                                                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                        >
                                                                            {pl.name}
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress / Seek Bar */}
                                            <div style={{ width: '100%', marginBottom: '14px' }}>
                                                <div
                                                    className="np-seek"
                                                    onClick={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect()
                                                        seek((e.clientX - rect.left) / rect.width * duration)
                                                    }}
                                                    style={{
                                                        width: '100%', height: '4px',
                                                        background: 'rgba(255,255,255,0.2)',
                                                        borderRadius: '99px', cursor: 'pointer', position: 'relative',
                                                    }}
                                                >
                                                    <div style={{
                                                        position: 'absolute', left: 0, top: 0, bottom: 0,
                                                        width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                                                        background: '#fff', borderRadius: '99px',
                                                    }} />
                                                    <div className="np-seek-thumb" style={{
                                                        position: 'absolute', top: '50%',
                                                        left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                                                        width: '10px', height: '10px', borderRadius: '50%',
                                                        background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                                                        opacity: 0, transform: 'translate(-50%, -50%) scale(0.6)',
                                                        transition: 'opacity 0.15s ease, transform 0.15s ease',
                                                        pointerEvents: 'none',
                                                    }} />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontWeight: '500', fontVariantNumeric: 'tabular-nums' }}>
                                                    <span>{formatTime(currentTime)}</span>
                                                    <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
                                                </div>
                                            </div>

                                            {/* Playback Controls */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '18px', width: '100%' }}>
                                                {/* Shuffle */}
                                                <button
                                                    onClick={() => setIsShuffle(p => !p)}
                                                    className="np-icon-btn"
                                                    title="Shuffle"
                                                    style={{
                                                        position: 'relative', background: 'none', border: 'none',
                                                        cursor: 'pointer', padding: '6px',
                                                        color: isShuffle ? '#fff' : 'rgba(255,255,255,0.4)',
                                                    }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                                                        <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
                                                        <line x1="4" y1="4" x2="9" y2="9" />
                                                    </svg>
                                                </button>

                                                {/* Prev */}
                                                <button onClick={playPrev} className="np-icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#fff' }} title="Previous">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4" /><rect x="5" y="4" width="3" height="16" rx="1" /></svg>
                                                </button>

                                                {/* Play/Pause */}
                                                <button
                                                    onClick={togglePlay}
                                                    className="np-icon-btn"
                                                    style={{
                                                        background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#fff',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                    title={isPlaying ? 'Pause' : 'Play'}
                                                >
                                                    {isPlaying
                                                        ? <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16" rx="1" /><rect x="15" y="4" width="4" height="16" rx="1" /></svg>
                                                        : <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '3px' }}><polygon points="5,3 21,12 5,21" /></svg>
                                                    }
                                                </button>

                                                {/* Next */}
                                                <button onClick={playNext} className="np-icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#fff' }} title="Next">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20" /><rect x="16" y="4" width="3" height="16" rx="1" /></svg>
                                                </button>

                                                {/* Repeat */}
                                                <button
                                                    onClick={cycleLoop}
                                                    className="np-icon-btn"
                                                    title={loopMode === 'none' ? 'No repeat' : loopMode === 'all' ? 'Repeat all' : 'Repeat one'}
                                                    style={{
                                                        position: 'relative', background: 'none', border: 'none',
                                                        cursor: 'pointer', padding: '6px',
                                                        color: loopMode !== 'none' ? '#fff' : 'rgba(255,255,255,0.4)',
                                                    }}
                                                >
                                                    {loopMode === 'one' ? (
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                                            <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                                            <line x1="11" y1="10" x2="11" y2="14" />
                                                        </svg>
                                                    ) : (
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                                            <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Volume Controls */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '0 2px' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                                </svg>
                                                <input
                                                    type="range" min="0" max="100" value={volume}
                                                    onChange={e => handleVolumeChange(Number(e.target.value))}
                                                    style={{ flex: 1, accentColor: '#fff', cursor: 'pointer', height: '4px' }}
                                                />
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                                    <path d="M18.07 5.93a9 9 0 0 1 0 12.73" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Right column: synced lyrics or queue */}
                                        <div style={{
                                            flex: 1,
                                            minWidth: 0,
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            paddingTop: '20px',
                                        }}>
                                            {!showQueuePanel ? (
                                                <div
                                                    ref={fsLyricsRef}
                                                    onScroll={handleScroll}
                                                    style={{
                                                        flex: 1, overflowY: 'auto', minHeight: 0,
                                                        maskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
                                                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
                                                        scrollBehavior: 'smooth',
                                                        paddingRight: '12px',
                                                    }}
                                                >
                                                    <div style={{ paddingTop: '22vh', paddingBottom: '22vh' }}>
                                                        {loadingLyrics ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                {Array.from({ length: 6 }).map((_, i) => (
                                                                    <div key={i} className="skeleton" style={{ height: '24px', width: `${45 + (i % 3) * 18}%`, borderRadius: '6px' }} />
                                                                ))}
                                                            </div>
                                                        ) : activeLyrics.length > 0 ? (
                                                            <>
                                                                {currentLine === 0 && currentTime < activeLyrics[0].time && (
                                                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                                                                        {[0, 1, 2].map(i => (
                                                                            <span key={i} style={{
                                                                                width: '7px', height: '7px', borderRadius: '50%',
                                                                                background: 'rgba(255,255,255,0.45)',
                                                                                animation: `npDotPulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                                                                            }} />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {activeLyrics.map((line, i) => {
                                                                    const isActive = i === currentLine
                                                                    // Distance-based opacity: active=1, ±1=0.55, ±2=0.32, ±3+=0.14
                                                                    const dist = Math.abs(i - currentLine)
                                                                    const opacity = isActive ? 1
                                                                        : dist === 1 ? 0.52
                                                                            : dist === 2 ? 0.30
                                                                                : dist === 3 ? 0.18
                                                                                    : 0.10
                                                                    // Scale up the active line instead of changing font-size
                                                                    // (avoids layout reflow = no jumping)
                                                                    const scale = isActive ? 1 : 0.82
                                                                    return (
                                                                        <p
                                                                            key={i}
                                                                            ref={el => fsLineRefs.current[i] = el}
                                                                            onClick={() => handleLyricClick(line.time)}
                                                                            style={{
                                                                                fontSize: '30px',
                                                                                fontWeight: isActive ? '800' : '600',
                                                                                color: '#fff',
                                                                                lineHeight: '1.4',
                                                                                margin: '10px 0',
                                                                                cursor: 'pointer',
                                                                                transformOrigin: 'left center',
                                                                                transform: `scale(${scale})`,
                                                                                opacity,
                                                                                letterSpacing: isActive ? '-0.6px' : '-0.2px',
                                                                                transition: [
                                                                                    'transform 0.5s cubic-bezier(0.34, 1.15, 0.64, 1)',
                                                                                    'opacity 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                                                                    'letter-spacing 0.45s ease',
                                                                                    'font-weight 0.3s ease',
                                                                                ].join(', '),
                                                                                willChange: 'transform, opacity',
                                                                            }}
                                                                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.opacity = '0.7' }}
                                                                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.opacity = String(opacity) }}
                                                                        >
                                                                            {line.text}
                                                                        </p>
                                                                    )
                                                                })}
                                                            </>
                                                        ) : (
                                                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '24px', fontWeight: '600' }}>Lyrics not available</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '8px', paddingTop: '10vh' }}>
                                                    <p style={{
                                                        fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px',
                                                        color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                                                        marginBottom: '20px',
                                                    }}>Up Next</p>
                                                    {upNextSongs.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {upNextSongs.map(nextSong => (
                                                                <div
                                                                    key={nextSong.youtube_id}
                                                                    onClick={() => { playSong(nextSong); navigate(`/player/${nextSong.youtube_id}`) }}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '14px',
                                                                        padding: '12px 14px', borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        transition: 'background 0.2s ease',
                                                                    }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                                >
                                                                    <img
                                                                        src={nextSong.thumbnail || `https://img.youtube.com/vi/${nextSong.youtube_id}/hqdefault.jpg`}
                                                                        alt={nextSong.title}
                                                                        style={{ width: '56px', height: '56px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                                                                    />
                                                                    <div style={{ overflow: 'hidden', flex: 1 }}>
                                                                        <p style={{ fontSize: '16px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextSong.title}</p>
                                                                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextSong.artist}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '18px', fontWeight: '500' }}>No more songs in queue</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* NORMAL PLAYER — dynamic blurred background */}
            {!fullscreen && (
                <div style={{
                    position: 'relative',
                    ...(isMobile
                        ? { height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }
                        : { minHeight: 'calc(100vh - 90px)', overflow: 'hidden' }
                    ),
                }}>
                    {/* Ambient layered background: blurred art + two slow-drifting color blobs + grain */}
                    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            backgroundImage: `url(${thumbSrc})`,
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            filter: isMobile ? 'blur(90px) brightness(0.16) saturate(1.7)' : 'blur(100px) brightness(0.14) saturate(1.85)',
                            transform: 'scale(1.2)',
                            transition: 'background-image 0.8s ease',
                        }} />
                        <div key={`page-glow-a-${song.youtube_id}`} style={{
                            position: 'absolute', width: '70%', height: '70%', top: '-10%', left: '-10%',
                            background: `radial-gradient(circle, ${glowA} 0%, transparent 70%)`,
                            filter: 'blur(60px)', animation: 'npDrift1 18s ease-in-out infinite, npFadeIn 1.2s ease',
                        }} />
                        <div key={`page-glow-b-${song.youtube_id}`} style={{
                            position: 'absolute', width: '65%', height: '65%', bottom: '-15%', right: '-10%',
                            background: `radial-gradient(circle, ${glowB} 0%, transparent 70%)`,
                            filter: 'blur(60px)', animation: 'npDrift2 22s ease-in-out infinite, npFadeIn 1.2s ease',
                        }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />
                        {/* subtle film grain for texture, matches the "premium streaming app" feel */}
                        <div style={{
                            position: 'absolute', inset: 0, opacity: 0.05, mixBlendMode: 'overlay',
                            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                        }} />
                    </div>

                    {isMobile ? (
                        /* ── MOBILE: unified scrollable page (Spotify pattern) ── */
                        <div style={{
                            position: 'relative', zIndex: 1,
                            display: 'flex', flexDirection: 'column',
                            height: '100%', overflowY: 'auto',
                            padding: '16px 20px 120px',
                            scrollBehavior: 'smooth',
                        }}>
                            {/* Mobile header strip */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '11px',
                                padding: '0 0 16px',
                                flexShrink: 0,
                                justifyContent: 'space-between',
                                width: '100%',
                            }}>
                                {/* Back button */}
                                <button
                                    onClick={() => navigate(-1)}
                                    style={{
                                        width: '34px', height: '34px', borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.12)', border: 'none',
                                        color: '#fff', cursor: 'pointer', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                </button>
                                {/* Title + artist */}
                                <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                                    <p style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '2px' }}>Now Playing</p>
                                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {song.artist}
                                    </p>
                                </div>
                                {/* Spacer to align center */}
                                <div style={{ width: '34px' }} />
                            </div>

                            {/* Artwork & Controls section */}
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                width: '100%', padding: '16px 0', gap: '20px', flexShrink: 0
                            }}>
                                {/* Centered Album Cover */}
                                <div
                                    onClick={togglePlay}
                                    style={{
                                        aspectRatio: '1/1',
                                        height: 'min(70vw, 280px)',
                                        width: 'min(70vw, 280px)',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 50px ${glowASoft}`,
                                        cursor: 'pointer',
                                        transition: 'transform 0.3s ease',
                                        animation: isPlaying ? 'npBreathe 6s ease-in-out infinite' : 'none',
                                        flexShrink: 0,
                                    }}
                                >
                                    <img
                                        src={thumbSrc}
                                        alt={song.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                </div>

                                {/* Title / Artist Metadata */}
                                <div style={{ width: '100%', padding: '0 8px', textAlign: 'left' }}>
                                    <h2 style={{
                                        fontSize: '22px',
                                        fontWeight: '900',
                                        letterSpacing: '-0.5px',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        marginBottom: '4px', lineHeight: '1.2',
                                        color: '#fff',
                                    }}>{song.title}</h2>
                                    <p style={{
                                        fontSize: '15px',
                                        color: 'rgba(255,255,255,0.6)',
                                        fontWeight: '500',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>{song.artist}</p>
                                </div>

                                {/* Seek Bar */}
                                <div style={{ width: '100%', padding: '0 8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            color: 'rgba(255,255,255,0.4)', fontSize: '11px',
                                            minWidth: '32px', textAlign: 'left', fontVariantNumeric: 'tabular-nums', fontWeight: '600',
                                        }}>{formatTime(currentTime)}</span>
                                        <div
                                            className="np-seek"
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect()
                                                seek((e.clientX - rect.left) / rect.width * duration)
                                            }}
                                            style={{
                                                flex: 1, height: '4px',
                                                background: 'rgba(255,255,255,0.2)',
                                                borderRadius: '99px', cursor: 'pointer', position: 'relative',
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                                                background: '#fff', borderRadius: '99px',
                                            }} />
                                        </div>
                                        <span style={{
                                            color: 'rgba(255,255,255,0.4)', fontSize: '11px',
                                            minWidth: '32px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: '600',
                                        }}>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                {/* Transport Controls */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    width: '100%', padding: '0 8px', marginTop: '4px'
                                }}>
                                    <button
                                        onClick={() => setIsShuffle(p => !p)}
                                        className="np-icon-btn"
                                        title="Shuffle"
                                        style={{
                                            position: 'relative', background: 'none', border: 'none',
                                            cursor: 'pointer', padding: '8px',
                                            color: isShuffle ? '#fff' : 'rgba(255,255,255,0.5)',
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                                            <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
                                            <line x1="4" y1="4" x2="9" y2="9" />
                                        </svg>
                                        {isShuffle && <span style={{
                                            position: 'absolute', bottom: '1px', left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '4px', height: '4px', borderRadius: '50%',
                                            background: '#fff', display: 'block'
                                        }} />}
                                    </button>

                                    <button onClick={playPrev} className="np-icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#fff' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4" /><rect x="5" y="4" width="3" height="16" rx="1" /></svg>
                                    </button>

                                    <button
                                        onClick={togglePlay}
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '50%', background: '#fff',
                                            border: 'none', cursor: 'pointer', flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                            transition: 'transform 0.18s ease',
                                        }}
                                    >
                                        {isPlaying
                                            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="#000"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                                            : <svg width="22" height="22" viewBox="0 0 24 24" fill="#000" style={{ marginLeft: '3px' }}><polygon points="5,3 19,12 5,21" /></svg>
                                        }
                                    </button>

                                    <button onClick={playNext} className="np-icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#fff' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20" /><rect x="16" y="4" width="3" height="16" rx="1" /></svg>
                                    </button>

                                    <button
                                        onClick={cycleLoop}
                                        className="np-icon-btn"
                                        title={loopMode === 'none' ? 'No repeat' : loopMode === 'all' ? 'Repeat all' : 'Repeat one'}
                                        style={{
                                            position: 'relative', background: 'none', border: 'none',
                                            cursor: 'pointer', padding: '8px',
                                            color: loopMode !== 'none' ? '#fff' : 'rgba(255,255,255,0.5)',
                                        }}
                                    >
                                        {loopMode === 'one' ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                                <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                                <line x1="11" y1="10" x2="11" y2="14" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                                <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                            </svg>
                                        )}
                                        {loopMode !== 'none' && <span style={{
                                            position: 'absolute', bottom: '1px', left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '4px', height: '4px', borderRadius: '50%',
                                            background: '#fff', display: 'block'
                                        }} />}
                                    </button>
                                </div>
                            </div>

                            {/* Lyrics Card (Inline Mobile Expansion) */}
                            <div style={{
                                background: `rgba(${pr}, ${pg}, ${pb}, 0.18)`,
                                borderRadius: 'var(--radius-xl)',
                                padding: '20px 20px 16px',
                                width: '100%',
                                marginTop: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                border: `1px solid rgba(${pr}, ${pg}, ${pb}, 0.22)`,
                                boxShadow: `0 8px 30px rgba(${pr}, ${pg}, ${pb}, 0.08)`,
                                flexShrink: 0,
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                            }}>
                                <p style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', margin: 0 }}>
                                    {mobileLyricsExpanded ? 'Lyrics' : 'Lyrics preview'}
                                </p>

                                {loadingLyrics ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '18px', width: `${55 + i * 9}%`, borderRadius: '4px' }} />)}
                                    </div>
                                ) : activeLyrics.length > 0 ? (
                                    mobileLyricsExpanded ? (
                                        /* Full inline scrollable synced lyrics on mobile */
                                        <div
                                            ref={lyricsRef}
                                            onScroll={handleScroll}
                                            style={{
                                                maxHeight: '380px',
                                                overflowY: 'auto',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '2px',
                                                paddingRight: '6px',
                                                scrollBehavior: 'smooth',
                                                maskImage: 'linear-gradient(to bottom, transparent 0%, black 16px, black calc(100% - 24px), transparent 100%)',
                                                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 16px, black calc(100% - 24px), transparent 100%)',
                                            }}
                                        >
                                            <div style={{ paddingTop: '16px', paddingBottom: '160px' }}>
                                                {activeLyrics.map((line, i) => {
                                                    const isActive = i === currentLine
                                                    return (
                                                        <p
                                                            key={i}
                                                            ref={el => lineRefs.current[i] = el}
                                                            onClick={() => handleLyricClick(line.time)}
                                                            style={{
                                                                fontSize: isActive ? '19px' : '15px',
                                                                fontWeight: isActive ? '800' : '500',
                                                                color: isActive ? '#fff' : i < currentLine ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)',
                                                                lineHeight: '1.55',
                                                                margin: '8px 0',
                                                                cursor: 'pointer',
                                                                transition: 'font-size 0.35s ease, color 0.35s ease',
                                                            }}
                                                        >
                                                            {line.text}
                                                        </p>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Live synced lyrics preview — window of lines from currentLine */
                                        <div
                                            onClick={() => setFullscreen(true)}
                                            style={{
                                                display: 'flex', flexDirection: 'column', gap: '6px',
                                                maskImage: 'linear-gradient(to bottom, white 55%, transparent 100%)',
                                                WebkitMaskImage: 'linear-gradient(to bottom, white 55%, transparent 100%)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {activeLyrics.slice(Math.max(0, currentLine), Math.min(activeLyrics.length, Math.max(0, currentLine) + 5)).map((line, idx) => {
                                                const isActive = idx === 0
                                                return (
                                                    <p key={Math.max(0, currentLine) + idx} style={{
                                                        fontSize: isActive ? '17px' : '15px',
                                                        fontWeight: isActive ? '800' : '600',
                                                        color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                                                        lineHeight: '1.55',
                                                        margin: 0,
                                                        transition: 'font-size 0.35s ease, color 0.35s ease',
                                                        willChange: 'font-size, color',
                                                    }}>{line.text}</p>
                                                )
                                            })}
                                        </div>
                                    )
                                ) : (
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: '500', margin: 0 }}>Lyrics not available</p>
                                )}

                                {(syncedLyrics.length > 0 || (plainLyrics && plainLyrics !== 'Lyrics not found for this song.')) && (
                                    <button
                                        onClick={() => setFullscreen(true)}
                                        style={{
                                            alignSelf: 'flex-start',
                                            background: 'rgba(255,255,255,0.18)',
                                            border: 'none',
                                            color: '#fff',
                                            padding: '8px 18px',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            backdropFilter: 'blur(8px)',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                                    >
                                        Show lyrics
                                    </button>
                                )}
                            </div>


                            {/* More from Artist Section below fold */}
                            {(loadingArtistSongs || artistSongs.length > 0) && (
                                <div style={{ width: '100%', marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.2px', color: '#fff', margin: 0 }}>More from {song.artist}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {loadingArtistSongs ? (
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.02)' }}>
                                                    <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <div className="skeleton" style={{ height: '14px', width: '70%', borderRadius: '4px' }} />
                                                        <div className="skeleton" style={{ height: '11px', width: '40%', borderRadius: '4px' }} />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            artistSongs.map(item => (
                                                <div
                                                    key={item.youtube_id || item.id}
                                                    onClick={() => {
                                                        playSong(item)
                                                        const targetId = item.youtube_id || item.id
                                                        if (targetId) navigate(`/player/${targetId}`)
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        padding: '10px 12px',
                                                        borderRadius: 'var(--radius-lg)',
                                                        background: 'rgba(255,255,255,0.04)',
                                                        border: '1px solid rgba(255,255,255,0.06)',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <img
                                                        src={item.thumbnail || `https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg`}
                                                        alt={item.title}
                                                        style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
                                                    />
                                                    <div style={{ overflow: 'hidden', flex: 1 }}>
                                                        <p style={{ fontSize: '13px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 2px', color: '#fff' }}>{item.title}</p>
                                                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{item.artist}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ── DESKTOP: VinylDisc (340px) + lyrics panel side-by-side ── */
                        <div style={{ position: 'relative', zIndex: 1, padding: '32px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                            {/* Left: Disc + Info + Up Next */}
                            <div style={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                                <VinylDisc song={song} isPlaying={isPlaying} />
                                <div style={{ textAlign: 'center' }}>
                                    <h2 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.4px', marginBottom: '6px', lineHeight: '1.2' }}>{song.title}</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{song.artist}</p>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {song.mood && <span className="app-tag app-tag-accent">{song.mood}</span>}
                                        {song.genre && <span className="app-tag app-tag-secondary">{song.genre}</span>}
                                        {user && (
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                        padding: '4px 12px', background: 'transparent',
                                                        border: '1px solid var(--accent)', borderRadius: 'var(--radius-full)',
                                                        color: 'var(--accent)', fontSize: '11px', fontWeight: '700',
                                                        cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-subtle)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                    Add to Playlist
                                                </button>
                                                {showPlaylistDropdown && (
                                                    <div style={{
                                                        position: 'absolute', top: 'calc(100% + 8px)',
                                                        left: '50%', transform: 'translateX(-50%)',
                                                        background: '#282828', border: '1px solid var(--border-light)',
                                                        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)',
                                                        zIndex: 50, width: '200px', maxHeight: '200px',
                                                        overflowY: 'auto', padding: '8px',
                                                        animation: 'slideDown 0.2s var(--ease)',
                                                    }}>
                                                        {playlists.length === 0 ? (
                                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '10px', textAlign: 'center' }}>No playlists</p>
                                                        ) : (
                                                            playlists.map(pl => (
                                                                <div key={pl.id} onClick={() => handleAddSongToPlaylist(pl.id)} className="song-row"
                                                                    style={{ borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '13px' }}>
                                                                    {pl.name}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* More from Artist Section */}
                                {(loadingArtistSongs || artistSongs.length > 0) && (
                                    <div style={{ width: '100%' }}>
                                        <p style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>More from {song.artist}</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {loadingArtistSongs ? (
                                                Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)' }}>
                                                        <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: '5px', flexShrink: 0 }} />
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <div className="skeleton" style={{ height: '12px', width: '75%', borderRadius: '3px' }} />
                                                            <div className="skeleton" style={{ height: '10px', width: '45%', borderRadius: '3px' }} />
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                artistSongs.map(item => (
                                                    <div key={item.youtube_id || item.id}
                                                        onClick={() => {
                                                            playSong(item)
                                                            const targetId = item.youtube_id || item.id
                                                            if (targetId) navigate(`/player/${targetId}`)
                                                        }}
                                                        className="song-row"
                                                        style={{ borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
                                                    >
                                                        <img src={item.thumbnail || `https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg`} alt={item.title} style={{ width: '38px', height: '38px', borderRadius: '5px', objectFit: 'cover', flexShrink: 0 }} />
                                                        <div style={{ overflow: 'hidden', flex: 1 }}>
                                                            <p style={{ fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                                                            <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.artist}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Lyrics — flexible height, adapts to shorter desktops */}
                            <div ref={lyricsRef} style={{
                                flex: '1', minWidth: '300px',
                                background: 'rgba(24,24,24,0.7)',
                                backdropFilter: 'blur(12px)',
                                borderRadius: 'var(--radius-xl)',
                                padding: '28px',
                                // min() lets it shrink on shorter screens instead of clipping
                                height: 'min(530px, calc(100vh - 90px - 80px))',
                                overflowY: 'auto',
                                border: `1px solid rgba(${pr}, ${pg}, ${pb}, 0.16)`,
                                boxShadow: `0 0 40px rgba(${pr}, ${pg}, ${pb}, 0.08)`,
                                transition: 'border-color 0.8s ease, box-shadow 0.8s ease',
                                scrollBehavior: 'smooth',
                            }}>
                                <div style={{
                                    position: 'sticky',
                                    top: '-28px',
                                    zIndex: 10,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px 28px',
                                    margin: '-28px -28px 16px -28px',
                                    background: 'rgba(24,24,24,0.85)',
                                    backdropFilter: 'blur(16px)',
                                    WebkitBackdropFilter: 'blur(16px)',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                                }}>
                                    <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', margin: 0 }}>Lyrics</h3>
                                    <button
                                        onClick={() => setFullscreen(true)}
                                        className="app-btn-ghost"
                                        style={{ padding: '6px 12px', fontSize: '11px', gap: '6px', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center' }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                                        Fullscreen
                                    </button>
                                </div>
                                {loadingLyrics ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '18px', width: `${55 + i * 9}%`, borderRadius: '4px' }} />)}
                                    </div>
                                ) : syncedLyrics.length > 0 ? (
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '200px',
                                        maskImage: 'linear-gradient(to bottom, transparent 0%, black 28px, black calc(100% - 40px), transparent 100%)',
                                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 28px, black calc(100% - 40px), transparent 100%)'
                                    }}>
                                        {syncedLyrics.map((line, i) => (
                                            <p key={i} ref={el => lineRefs.current[i] = el} style={{
                                                fontSize: i === currentLine ? '21px' : '15px',
                                                fontWeight: i === currentLine ? '800' : '500',
                                                color: i === currentLine ? 'var(--text-primary)'
                                                    : i < currentLine ? 'rgba(255,255,255,0.18)'
                                                        : 'rgba(255,255,255,0.45)',
                                                lineHeight: '1.65',
                                                transition: [
                                                    'font-size 0.35s cubic-bezier(0.34, 1.2, 0.64, 1)',
                                                    'color 0.35s ease',
                                                    'opacity 0.35s ease',
                                                    'border-color 0.35s ease',
                                                    'padding 0.35s ease',
                                                ].join(', '),
                                                willChange: 'font-size, color',
                                                cursor: 'default',
                                                padding: i === currentLine ? '2px 0 2px 12px' : '2px 0 2px 0',
                                                borderLeft: i === currentLine
                                                    ? `3px solid rgba(${pr}, ${pg}, ${pb}, 0.85)`
                                                    : '3px solid transparent',
                                                letterSpacing: i === currentLine ? '-0.2px' : 'normal',
                                                marginBottom: '2px',
                                            }}>{line.text}</p>
                                        ))}
                                    </div>
                                ) : plainLyrics === 'Lyrics not found for this song.' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%', gap: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /><line x1="3" y1="3" x2="21" y2="21" /></svg>
                                        <p style={{ fontSize: '14px', fontWeight: '500' }}>Lyrics not found</p>
                                    </div>
                                ) : (
                                    <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '2.2', fontFamily: 'inherit', fontWeight: '500' }}>{plainLyrics}</pre>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}{/* end outer position relative div */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--accent)',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '30px',
                    fontSize: '13px',
                    fontWeight: '600',
                    zIndex: 9999,
                    boxShadow: '0 4px 15px var(--accent-glow)',
                    transition: 'all 0.3s ease'
                }}>
                    {toast}
                </div>
            )}
        </>
    )
}

function formatTime(secs) {
    if (!secs || isNaN(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}
