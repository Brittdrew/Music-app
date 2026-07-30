import { useState, useEffect, useRef } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMediaQuery } from '../hooks/useMediaQuery'
import SongCard from '../components/SongCard'
import { FALLBACK_SONGS } from '../api/fallbackSongs'
import api from '../api/axios'
import { resolvePlaybackSong } from '../api/playbackResolver'

const TRENDING_SEARCHES = [
    'Ben&Ben', 'LANY', 'December Avenue', 'Eraserheads',
    'Nobita', 'Cup of Joe', 'Unique Salonga', 'Zack Tabudlo',
    'Joji', 'The Weeknd', 'Taylor Swift', 'Bruno Mars'
]

const CATEGORY_COLORS = [
    'linear-gradient(135deg,#e74c3c,#c0392b)',
    'linear-gradient(135deg,#8e44ad,#6c3483)',
    'linear-gradient(135deg,#2980b9,#1a5276)',
    'linear-gradient(135deg,#16a085,#0e6655)',
    'linear-gradient(135deg,#d35400,#ba4a00)',
    'linear-gradient(135deg,#27ae60,#1e8449)',
    'linear-gradient(135deg,#2c3e50,#1a252f)',
    'linear-gradient(135deg,#c0392b,#922b21)',
    'linear-gradient(135deg,#7f8c8d,#626567)',
    'linear-gradient(135deg,#1abc9c,#148f77)',
    'linear-gradient(135deg,#e67e22,#ca6f1e)',
    'linear-gradient(135deg,#2471a3,#1a5276)',
]

// Same normalization approach as the backend: lowercase, strip accents,
// drop punctuation, collapse whitespace. Keeping the two in sync means a
// term like "Ben & Ben" scores/matches the same way on both ends.
function normalize(str) {
    if (!str) return ''
    return str
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function SkeletonGrid({ isMobile }) {
    if (isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 4px' }}>
                        <div className="skeleton" style={{ width: '52px', height: '52px', borderRadius: '6px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ height: '13px', width: '65%', marginBottom: '8px' }} />
                            <div className="skeleton" style={{ height: '11px', width: '40%' }} />
                        </div>
                    </div>
                ))}
            </div>
        )
    }
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '16px'
        }}>
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-card)', padding: '16px' }}>
                    <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 'var(--radius-md)', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ height: '12px', width: '80%', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ height: '10px', width: '55%' }} />
                </div>
            ))}
        </div>
    )
}

/**
 * Browse tile — the page's one signature element. Instead of a flat color
 * block (Spotify) or an editorial photo card (Apple Music), each tile is a
 * diagonally-sliced glass panel: a monogram badge anchors the term, a faint
 * watermark waveform gives it depth, and the whole thing tilts slightly on
 * hover. Reads as its own thing rather than a lift from either app.
 */
function BrowseTile({ term, gradient, index, onClick, featured = false }) {
    const [hovered, setHovered] = useState(false)
    const initial = term.trim().charAt(0).toUpperCase()

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative', borderRadius: '16px', overflow: 'hidden',
                cursor: 'pointer', minHeight: featured ? '200px' : '128px',
                gridColumn: featured ? 'span 2' : 'span 1',
                gridRow: featured ? 'span 2' : 'span 1',
                background: gradient,
                boxShadow: hovered ? '0 14px 32px rgba(0,0,0,0.4)' : '0 6px 16px rgba(0,0,0,0.22)',
                transform: hovered ? 'translateY(-3px) rotate(-0.3deg)' : 'translateY(0) rotate(0deg)',
                transition: 'transform 0.25s cubic-bezier(.22,1,.36,1), box-shadow 0.25s',
                animation: `slideUp 0.3s ${Math.min(index * 0.03, 0.4)}s both var(--ease)`,
            }}
        >
            {/* Diagonal glass slice — the signature cut, now with a visible seam */}
            <div style={{
                position: 'absolute', inset: 0,
                clipPath: 'polygon(46% 0, 100% 0, 100% 100%, 66% 100%)',
                background: 'rgba(255,255,255,0.14)',
                backdropFilter: 'blur(2px)',
            }} />
            {/* The seam line itself — a bright diagonal edge so the cut reads at a glance */}
            <div style={{
                position: 'absolute', inset: 0,
                clipPath: 'polygon(45% 0, 47% 0, 67% 100%, 65% 100%)',
                background: 'rgba(255,255,255,0.55)',
            }} />
            {/* Watermark waveform, barely-there texture */}
            <svg width={featured ? 110 : 72} height={featured ? 110 : 72} viewBox="0 0 72 72" style={{
                position: 'absolute', right: '-6px', bottom: '-10px', opacity: 0.16,
            }}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <rect key={i} x={i * 12} y={72 - (18 + (i % 3) * 16)} width="6" height={18 + (i % 3) * 16} rx="3" fill="#fff" />
                ))}
            </svg>

            <div style={{ position: 'relative', padding: featured ? '22px' : '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{
                    width: featured ? '38px' : '30px', height: featured ? '38px' : '30px', borderRadius: featured ? '11px' : '9px',
                    background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '900', fontSize: featured ? '16px' : '13px', color: '#fff',
                }}>
                    {initial}
                </div>
                <p style={{
                    fontWeight: '800', fontSize: featured ? '22px' : '15.5px', color: '#fff',
                    letterSpacing: '-0.2px', lineHeight: 1.15,
                    textShadow: '0 2px 10px rgba(0,0,0,0.25)',
                }}>{term}</p>
            </div>

            {/* Play affordance, Spotify-shelf habit but tucked into the glass slice */}
            <div style={{
                position: 'absolute', top: '14px', right: '14px',
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: hovered ? 1 : 0, transform: hovered ? 'scale(1)' : 'scale(0.8)',
                transition: 'all 0.2s cubic-bezier(.22,1,.36,1)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
            }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#111" style={{ marginLeft: '1.5px' }}>
                    <polygon points="5,3 19,12 5,21" />
                </svg>
            </div>
        </div>
    )
}

/**
 * Mobile browse row — replaces the diagonal glass tile grid on narrow
 * viewports. Same monogram badge + gradient, laid out as a single tappable
 * row so nothing ever forces horizontal width beyond the viewport.
 */
function BrowseRow({ term, gradient, index, onClick }) {
    const initial = term.trim().charAt(0).toUpperCase()
    return (
        <div
            onClick={onClick}
            className="song-row"
            style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                borderRadius: 'var(--radius-md)', padding: '10px 6px',
                cursor: 'pointer',
                animation: `slideUp 0.25s ${Math.min(index * 0.025, 0.3)}s both var(--ease)`,
            }}
        >
            <div style={{
                width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                background: gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '900', fontSize: '16px', color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}>
                {initial}
            </div>
            <span style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-primary)' }}>{term}</span>
        </div>
    )
}

/**
 * Mobile result row — Spotify-style: thumbnail, title/artist stacked,
 * play affordance on the right. Renders in a plain vertical list so the
 * row width always tracks the viewport instead of a grid's implicit track math.
 */
function SongRow({ song, onClick }) {
    return (
        <div
            onClick={() => onClick(song)}
            className="song-row"
            style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                borderRadius: 'var(--radius-md)', padding: '8px 4px',
                cursor: 'pointer', minWidth: 0,
            }}
        >
            <img
                src={song.thumbnail}
                alt={song.title}
                style={{ width: '52px', height: '52px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, background: 'var(--bg-elevated)' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{song.title}</p>
                <p style={{
                    fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{song.artist}</p>
            </div>
            <div style={{
                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--text-primary)" style={{ marginLeft: '1.5px' }}>
                    <polygon points="5,3 19,12 5,21" />
                </svg>
            </div>
        </div>
    )
}

export default function Search() {
    const isMobile = useMediaQuery('(max-width: 768px)')
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [rateLimited, setRateLimited] = useState(false)
    const [recentSearches, setRecentSearches] = useState(
        JSON.parse(localStorage.getItem('recentSearches') || '[]')
    )
    const [focused, setFocused] = useState(false)
    const searchTimerRef = useRef(null)
    const retryTimerRef = useRef(null)
    const lastQueryRef = useRef('')
    const { setQueue, playSong } = usePlayer()
    const { user } = useAuth()
    const navigate = useNavigate()

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!user) {
            navigate('/login')
        }
    }, [user, navigate])

    const buildFallback = (q) => {
        const queryLower = normalize(q)
        return FALLBACK_SONGS.filter(
            s => normalize(s.title).includes(queryLower) || normalize(s.artist).includes(queryLower)
        ).map(s => ({
            id: s.youtube_id,
            youtube_id: s.youtube_id,
            title: s.title,
            artist: s.artist,
            thumbnail: s.thumbnail,
            mood: s.mood,
            genre: s.genre,
            isFallback: true,
        }))
    }

    const search = async (q = query) => {
        if (!q.trim()) {
            setResults([])
            return
        }

        clearTimeout(searchTimerRef.current)
        clearTimeout(retryTimerRef.current)
        setLoading(true)
        setError(null)
        setRateLimited(false)
        setFocused(false)
        lastQueryRef.current = q

        const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 6)
        setRecentSearches(updated)
        localStorage.setItem('recentSearches', JSON.stringify(updated))

        try {
            const res = await api.get('/search', { params: { term: q } })
            const data = res.data

            // Bail out early and distinctly if the backend flagged this as a
            // rate-limit response (either our own local throttle or Apple's
            // 403/429) — don't let it masquerade as "genuinely no results."
            if (data.rate_limited) {
                // Only act on this if the user hasn't already typed something
                // new since this request was fired.
                if (lastQueryRef.current === q) {
                    setResults([])
                    setRateLimited(true)
                    setError('Search is briefly cooling down — try again in a few seconds.')

                    const retryAfter = Math.min(Math.max(data.retry_after || 3, 2), 15)
                    retryTimerRef.current = setTimeout(() => {
                        if (lastQueryRef.current === q) search(q)
                    }, retryAfter * 1000)
                }
                setLoading(false)
                return
            }

            const rawSongs = (data.results || []).map(item => ({
                id: item.trackId,
                trackId: item.trackId,
                title: item.trackName,
                artist: item.artistName,
                thumbnail: item.artworkUrl100?.replace('100x100bb.jpg', '400x400bb.jpg') || item.artworkUrl100,
                previewUrl: item.previewUrl,
                youtube_id: null,
                mood: null,
                genre: null,
            }))

            // ── Relevance filter & ranking ────────────────────────────────
            // The backend already ranks results, but we re-score client-side
            // too (using the same accent/punctuation-insensitive normalize())
            // as a safety net in case the backend cache holds an older,
            // unranked payload from before this change.
            const queryNorm = normalize(q)
            const queryWords = queryNorm.split(' ').filter(w => w.length >= 2)

            const scored = rawSongs
                .map(song => {
                    const t = normalize(song.title)
                    const a = normalize(song.artist)
                    let score = 0

                    // 1. Title matching (highest priority when searching for a song title)
                    if (t === queryNorm) {
                        score += 300
                    } else if (t.startsWith(queryNorm)) {
                        score += 150
                    } else if (t.includes(queryNorm)) {
                        score += 100
                    }

                    // 2. Artist matching
                    if (a === queryNorm) {
                        score += 100
                    } else if (a.startsWith(queryNorm)) {
                        score += 60
                    } else if (a.includes(queryNorm)) {
                        score += 40
                    }

                    // 3. Individual word matches (gives boost to titles over artists)
                    for (const word of queryWords) {
                        if (t.includes(word)) score += 20
                        if (a.includes(word)) score += 5
                    }

                    return { song, score }
                })
                .filter(({ score }) => score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 25)
                .map(({ song }) => song)

            if (scored.length === 0) {
                const localResults = buildFallback(q)
                setResults(localResults)
                setQueue(localResults)
                if (localResults.length === 0) {
                    setError(null) // let the dedicated "No results found" block show instead
                }
            } else {
                setResults(scored)
                setQueue(scored)
            }
        } catch (err) {
            console.error('Search error:', err)
            const localResults = buildFallback(q)
            setResults(localResults)
            setQueue(localResults)
            setError('Search failed. Showing offline backup music library.')
        }

        setLoading(false)
    }

    useEffect(() => {
        clearTimeout(searchTimerRef.current)
        clearTimeout(retryTimerRef.current)
        searchTimerRef.current = setTimeout(() => {
            // Require at least 2 characters and a real pause before firing —
            // reduces how many distinct partial-term calls a single typing
            // session generates against the shared iTunes rate limit.
            if (query.trim().length >= 2) {
                search(query)
            } else {
                setResults([])
                setError(null)
                setRateLimited(false)
            }
        }, 550)
        return () => {
            clearTimeout(searchTimerRef.current)
            clearTimeout(retryTimerRef.current)
        }
    }, [query])

    const handlePlay = async (song) => {
        setLoading(true)
        setError(null)
        try {
            const resolved = await resolvePlaybackSong(song)
            if (!resolved.youtube_id) {
                setError('Unable to play this song.')
                setLoading(false)
                return
            }

            setResults(prev => prev.map(s => s.id === song.id ? resolved : s))
            setQueue(prev => prev.map(s => s.id === song.id ? resolved : s))
            playSong(resolved)
            navigate(`/player/${resolved.youtube_id}`)
        } catch (err) {
            setError('Unable to play this song.')
        } finally {
            setLoading(false)
        }
    }

    const clearRecent = () => {
        setRecentSearches([])
        localStorage.removeItem('recentSearches')
    }

    const showDropdown = focused && !results.length && (recentSearches.length > 0)

    return (
        // box-sizing + overflow-x guard: the grid's minmax() math can still
        // request more than 100vw on some mobile browsers when combined with
        // the page's own padding, so this container clamps it as a hard floor
        // regardless of what any child grid tries to do.
        <div className="page-wrapper" style={{ overflowX: 'hidden', boxSizing: 'border-box', width: '100%', maxWidth: '100vw' }}>
            <h1 style={{ fontSize: isMobile ? '26px' : '32px', fontWeight: '900', letterSpacing: '-0.8px', marginBottom: '24px' }}>
                Search
            </h1>

            {/* ── Search bar ─────────────────────────── */}
            <div style={{ position: 'relative', marginBottom: '32px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(16px) saturate(1.3)',
                    WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
                    borderRadius: 'var(--radius-full)',
                    padding: '5px 6px 5px 6px',
                    border: focused ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
                    backgroundImage: focused
                        ? 'linear-gradient(rgba(20,20,20,0.9), rgba(20,20,20,0.9)), linear-gradient(120deg, var(--accent), #ff8a65)'
                        : 'none',
                    backgroundOrigin: 'border-box',
                    backgroundClip: focused ? 'padding-box, border-box' : 'border-box',
                    boxShadow: focused ? '0 8px 28px rgba(231,76,60,0.22)' : 'none',
                    transition: 'box-shadow 0.25s, border-color 0.25s',
                }}>
                    {/* Branded icon badge, echoes the equalizer mark in the sidebar logo */}
                    <div style={{
                        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                        background: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                    </div>
                    <input
                        placeholder="What do you want to listen to?"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setTimeout(() => setFocused(false), 150)}
                        onKeyDown={e => e.key === 'Enter' && search()}
                        style={{
                            flex: 1, minWidth: 0, background: 'none', border: 'none',
                            color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
                            padding: '6px 0', fontFamily: 'inherit', fontWeight: '500',
                        }}
                    />
                    {query && (
                        <button
                            onClick={() => { setQuery(''); setResults([]); setError(null); setRateLimited(false) }}
                            style={{
                                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary)',
                                borderRadius: '50%', width: '26px', height: '26px',
                                cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >✕</button>
                    )}
                    {/* Mobile: icon-only button so a long "Search" label can't push the bar wider than the viewport */}
                    <button
                        onClick={() => search()}
                        className="app-btn"
                        style={{
                            borderRadius: 'var(--radius-full)',
                            flexShrink: 0,
                            ...(isMobile
                                ? { width: '38px', height: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }
                                : { padding: '10px 22px', fontSize: '13px' }
                            ),
                        }}
                    >
                        {isMobile
                            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            : 'Search'
                        }
                    </button>
                </div>

                {/* Dropdown */}
                {showDropdown && (
                    <div style={{
                        position: 'absolute', top: 'calc(100% + 8px)',
                        left: 0, right: 0,
                        background: 'rgba(24,24,24,0.82)',
                        backdropFilter: 'blur(20px) saturate(1.4)',
                        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                        borderRadius: 'var(--radius-lg)',
                        zIndex: 50, overflow: 'hidden',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
                        animation: 'slideDown 0.2s var(--ease)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <div style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    Recent Searches
                                </p>
                                <button onClick={clearRecent} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                                    Clear all
                                </button>
                            </div>
                            {recentSearches.map(s => (
                                <div
                                    key={s}
                                    onClick={() => { setQuery(s); search(s) }}
                                    className="song-row"
                                    style={{ gap: '14px', borderRadius: 'var(--radius-md)', marginBottom: '2px' }}
                                >
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Error / Warning Toast ──────────────── */}
            {error && (
                <div style={{
                    padding: '14px 18px',
                    background: (rateLimited || error.includes("offline"))
                        ? 'rgba(243,156,18,0.1)'
                        : 'rgba(231,76,60,0.08)',
                    border: (rateLimited || error.includes("offline"))
                        ? '1px solid rgba(243,156,18,0.3)'
                        : '1px solid rgba(231,76,60,0.25)',
                    borderRadius: 'var(--radius-md)',
                    color: (rateLimited || error.includes("offline")) ? '#f39c12' : 'var(--accent)',
                    fontSize: '13px',
                    marginBottom: '24px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* ── Browse (no query yet) ─────────────── */}
            {!loading && (!error || error.includes("offline") || rateLimited) && results.length === 0 && (
                <>
                    {TRENDING_SEARCHES.length > 0 && (
                        <section>
                            <h2 style={{ fontSize: isMobile ? '19px' : '22px', fontWeight: '800', letterSpacing: '-0.4px', marginBottom: '18px' }}>
                                Browse all
                            </h2>
                            {isMobile ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {TRENDING_SEARCHES.map((term, i) => (
                                        <BrowseRow
                                            key={term}
                                            term={term}
                                            index={i}
                                            gradient={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                                            onClick={() => { setQuery(term); search(term) }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                                    gridAutoFlow: 'dense',
                                    gap: '14px',
                                }}>
                                    {TRENDING_SEARCHES.map((term, i) => (
                                        <BrowseTile
                                            key={term}
                                            term={term}
                                            index={i}
                                            featured={i === 0 || i === 5}
                                            gradient={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                                            onClick={() => { setQuery(term); search(term) }}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}

            {/* ── Loading ───────────────────────────── */}
            {loading && <SkeletonGrid isMobile={isMobile} />}

            {/* ── Results ───────────────────────────── */}
            {!loading && results.length > 0 && (
                <>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px', fontWeight: '500' }}>
                        {results.length} results for <span style={{ color: 'var(--text-primary)' }}>"{query}"</span>
                    </p>
                    {isMobile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {results.map(song => (
                                <SongRow key={song.youtube_id || song.id} song={song} onClick={handlePlay} />
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                            gap: '16px',
                        }}>
                            {results.map((song, i) => (
                                <div key={song.youtube_id || song.id} style={{ animation: `slideUp 0.3s ${i * 0.04}s both var(--ease)` }}>
                                    <SongCard song={song} onClick={handlePlay} />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── No results ───────────────────────── */}
            {!loading && !error && !rateLimited && query && results.length === 0 && recentSearches[0] === query && (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}></div>
                    <p style={{ fontWeight: '700', fontSize: '16px', marginBottom: '6px' }}>No results found</p>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Try searching for something else</p>
                </div>
            )}
        </div>
    )
}