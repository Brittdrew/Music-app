import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useFavorites } from '../context/FavoritesContext'
import { BOTTOM_NAV_CALC, MOBILE_STACK_CALC } from '../layoutConstants'

const getSongKey = (song) => song?.youtube_id || song?.previewUrl || song?.id

/* ── Icon helpers ───────────────────────────────────────────── */
const PlayIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: '2px' }}>
        <polygon points="5,3 19,12 5,21" />
    </svg>
)
const PauseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
)
const PrevIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="19,20 9,12 19,4" fill="currentColor" stroke="none" />
        <line x1="5" y1="4" x2="5" y2="20" strokeWidth="2.5" />
    </svg>
)
const NextIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="5,4 15,12 5,20" fill="currentColor" stroke="none" />
        <line x1="19" y1="4" x2="19" y2="20" strokeWidth="2.5" />
    </svg>
)
const ShuffleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8" />
        <line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" />
        <line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
)
const RepeatIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
)
const RepeatOneIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        <line x1="11" y1="10" x2="11" y2="14" />
    </svg>
)
const QueueIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="3" cy="6" r="1" fill="currentColor" />
        <circle cx="3" cy="12" r="1" fill="currentColor" />
        <circle cx="3" cy="18" r="1" fill="currentColor" />
    </svg>
)

function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
}

/* ── SeekBar ────────────────────────────────────────────────── */
function SeekBar({ currentTime, duration, seek }) {
    const [hovering, setHovering] = useState(false)
    const pct = duration > 0 ? (currentTime / duration) * 100 : 0

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const ratio = (e.clientX - rect.left) / rect.width
        seek(ratio * duration)
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(currentTime)}
            </span>

            <div
                onClick={handleClick}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                style={{
                    flex: 1, height: hovering ? '5px' : '4px',
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: '99px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'height 0.15s ease',
                }}
            >
                {/* Filled */}
                <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${pct}%`,
                    background: hovering ? 'var(--accent)' : '#fff',
                    borderRadius: '99px',
                    transition: 'background 0.2s ease, width 0.25s linear',
                }} />
                {/* Thumb */}
                {hovering && (
                    <div style={{
                        position: 'absolute',
                        left: `${pct}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '13px', height: '13px',
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                    }} />
                )}
            </div>

            <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '36px', fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(duration)}
            </span>
        </div>
    )
}

/* ── Volume Slider ──────────────────────────────────────────── */
function VolumeSlider({ playerRef }) {
    const [vol, setVol] = useState(80)
    const [hovering, setHovering] = useState(false)

    const handleChange = (e) => {
        const v = Number(e.target.value)
        setVol(v)
        if (playerRef.current?.setVolume) playerRef.current.setVolume(v)
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="var(--text-secondary)" stroke="none" />
                {vol > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
                {vol > 50 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
            </svg>
            <div style={{ flex: 1, position: 'relative', height: '4px' }}>
                <div style={{
                    position: 'absolute', inset: 0, borderRadius: '99px',
                    background: 'rgba(255,255,255,0.15)',
                }} />
                <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${vol}%`,
                    borderRadius: '99px',
                    background: hovering ? 'var(--accent)' : '#fff',
                    transition: 'background 0.2s',
                }} />
                <input
                    type="range" min="0" max="100" value={vol}
                    onChange={handleChange}
                    style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        opacity: 0, cursor: 'pointer',
                    }}
                />
            </div>
        </div>
    )
}

/* ── Queue Panel ────────────────────────────────────────────── */
function QueuePanel({ currentSong, queue, playSong, removeFromQueue, navigate, isMobile }) {
    const currentKey = getSongKey(currentSong)
    const currentIdx = queue.findIndex(s => getSongKey(s) === currentKey)
    const upNext = queue.slice(currentIdx + 1)

    return (
        <div style={{
            position: 'fixed',
            // FIX: previously a bare '136px' with no safe-area term, so on
            // notched iPhones the panel sat ~34px too low and clipped behind
            // the fixed bar stack below it. Now derived from the same
            // constants as Layout.jsx / BottomNav.jsx, plus the inset.
            bottom: isMobile ? MOBILE_STACK_CALC : '90px',
            right: '16px',
            width: isMobile ? 'calc(100% - 32px)' : '340px',
            maxHeight: '440px',
            background: '#282828',
            borderRadius: 'var(--radius-xl)',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
            animation: 'slideUp 0.25s var(--ease-spring)',
            border: '1px solid var(--border-light)',
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.3px' }}>Queue</h4>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
                    {upNext.length} up next
                </span>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
                {/* Now Playing */}
                <div style={{ padding: '12px 16px 0' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Now Playing
                    </p>
                    <div className="song-row" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <img
                            src={currentSong.thumbnail || (currentSong.youtube_id ? `https://img.youtube.com/vi/${currentSong.youtube_id}/hqdefault.jpg` : '')}
                            alt={currentSong.title}
                            style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSong.title}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{currentSong.artist}</p>
                        </div>
                        <div className="soundwave">
                            <span style={{ height: '10px' }} />
                            <span style={{ height: '16px' }} />
                            <span style={{ height: '8px' }} />
                        </div>
                    </div>
                </div>

                {/* Up Next */}
                {upNext.length > 0 && (
                    <div style={{ padding: '12px 16px' }}>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Next Up
                        </p>
                        {upNext.map((song, i) => (
                            <div key={getSongKey(song)} className="song-row" style={{ position: 'relative', borderRadius: 'var(--radius-md)', marginBottom: '2px' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px', minWidth: '20px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                                <img
                                    src={song.thumbnail || (song.youtube_id ? `https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg` : '')}
                                    alt={song.title}
                                    style={{ width: '38px', height: '38px', borderRadius: '5px', objectFit: 'cover' }}
                                />
                                <div
                                    style={{ flex: 1, cursor: 'pointer', overflow: 'hidden' }}
                                    onClick={() => {
                                        playSong(song)
                                        if (song.youtube_id) navigate(`/player/${song.youtube_id}`)
                                    }}
                                >
                                    <p style={{ fontSize: '13px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</p>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{song.artist}</p>
                                </div>
                                <button
                                    onClick={() => removeFromQueue(getSongKey(song))}
                                    className="icon-btn"
                                    title="Remove"
                                    style={{ padding: '4px', opacity: 0.5 }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {upNext.length === 0 && (
                    <p style={{ padding: '24px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                        Nothing up next
                    </p>
                )}
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function NowPlayingBar() {
    const {
        currentSong, isPlaying, togglePlay, playNext, playPrev,
        playerRef, setIsPlaying, duration, currentTime, seek,
        queue, showQueue, setShowQueue, playSong, removeFromQueue,
        isShuffle, setIsShuffle, loopMode, setLoopMode, handleSongEnded,
        isResolving,
    } = usePlayer()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { isFavorite, toggleFavorite } = useFavorites()
    const isMobile = useMediaQuery('(max-width: 768px)')
    const isPlayerPage = pathname.startsWith('/player/')
    const handleSongEndedRef = useRef(handleSongEnded)

    useEffect(() => {
        handleSongEndedRef.current = handleSongEnded
    }, [handleSongEnded])

    /* YouTube player init */
    useEffect(() => {
        if (!currentSong) return

        // ── Wait for YouTube ID resolution before starting any playback ──────
        // When a queued iTunes-only song is clicked, `_playSong` sets currentSong
        // immediately (youtube_id = null) then fires an async resolve. Without
        // this guard the effect would instantly fall through to the iTunes
        // previewUrl Audio path, playing the 30-second clip. By bailing while
        // isResolving=true, we let the resolve finish, which calls
        // setCurrentSong(resolved) — that triggers this effect again, this time
        // with a real youtube_id, so the full YouTube track plays instead.
        if (isResolving) return

        // Fallback: only use the 30-second iTunes preview when there is genuinely
        // no youtube_id AND we are NOT in the middle of fetching one.
        if (!currentSong.youtube_id && currentSong.previewUrl) {
            if (playerRef.current?.destroy) playerRef.current.destroy()

            const audio = new Audio(currentSong.previewUrl)
            audio.volume = 0.8
            audio.addEventListener('play', () => setIsPlaying(true))
            audio.addEventListener('pause', () => setIsPlaying(false))
            audio.addEventListener('ended', () => handleSongEndedRef.current())

            playerRef.current = {
                playVideo: () => audio.play().catch(() => setIsPlaying(false)),
                pauseVideo: () => audio.pause(),
                seekTo: (time) => { audio.currentTime = time },
                getCurrentTime: () => audio.currentTime || 0,
                getDuration: () => Number.isFinite(audio.duration) ? audio.duration : 0,
                setVolume: (value) => { audio.volume = Math.max(0, Math.min(1, value / 100)) },
                destroy: () => { audio.pause(); audio.src = '' },
            }

            playerRef.current.playVideo()

            return () => {
                audio.pause()
                audio.src = ''
            }
        }

        if (!currentSong.youtube_id) return

        const initPlayer = () => {
            if (playerRef.current) playerRef.current.destroy()
            playerRef.current = new window.YT.Player('yt-player', {
                height: '0', width: '0',
                videoId: currentSong.youtube_id,
                playerVars: { autoplay: 1 },
                events: {
                    onStateChange: (e) => {
                        if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true)
                        if (e.data === window.YT.PlayerState.PAUSED) setIsPlaying(false)
                        if (e.data === window.YT.PlayerState.ENDED) handleSongEndedRef.current()
                    }
                }
            })
        }
        if (window.YT && window.YT.Player) {
            initPlayer()
        } else {
            window.onYouTubeIframeAPIReady = initPlayer
            if (!document.getElementById('yt-api-script')) {
                const script = document.createElement('script')
                script.id = 'yt-api-script'
                script.src = 'https://www.youtube.com/iframe_api'
                document.body.appendChild(script)
            }
        }
    }, [currentSong, isResolving])

    const thumb = currentSong
        ? currentSong.thumbnail || (currentSong.youtube_id ? `https://img.youtube.com/vi/${currentSong.youtube_id}/hqdefault.jpg` : '')
        : null
    const openPlayer = () => {
        if (currentSong.youtube_id) navigate(`/player/${currentSong.youtube_id}`)
    }

    if (!currentSong) return <div id="yt-player" style={{ display: 'none' }} />

    const isPlayerPageMobile = isMobile && isPlayerPage
    if (isPlayerPageMobile) {
        return <div id="yt-player" style={{ display: 'none' }} />
    }

    /* ── Controls helper ──── */
    const cycleLoop = () => setLoopMode(m => m === 'none' ? 'all' : m === 'all' ? 'one' : 'none')

    /* ── MOBILE LAYOUT ──────────────────────────────────────── */
    if (isMobile) {
        const pct = duration > 0 ? (currentTime / duration) * 100 : 0

        return (
            <>
                <div id="yt-player" style={{ display: 'none' }} />
                {showQueue && (
                    <QueuePanel
                        currentSong={currentSong} queue={queue}
                        playSong={playSong} removeFromQueue={removeFromQueue}
                        navigate={navigate} isMobile
                    />
                )}

                {/* ── Premium floating mini-bar ── */}
                <div
                    onClick={openPlayer}
                    style={{
                        position: 'fixed',
                        bottom: BOTTOM_NAV_CALC,
                        left: '8px',
                        right: '8px',
                        borderRadius: '16px',
                        background: 'rgba(28, 28, 32, 0.88)',
                        backdropFilter: 'blur(30px) saturate(1.8)',
                        WebkitBackdropFilter: 'blur(30px) saturate(1.8)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                        zIndex: 100,
                        cursor: 'pointer',
                    }}
                >
                    {/* Live progress stripe at the very top */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.07)' }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, height: '100%',
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.55), rgba(255,255,255,0.9))',
                            borderRadius: '0 99px 99px 0',
                            transition: 'width 0.6s linear',
                        }} />
                    </div>

                    {/* Main content row */}
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        padding: '11px 10px 11px 12px',
                        gap: '12px',
                    }}>
                        {/* Album art with glow ring when playing */}
                        <div style={{
                            position: 'relative', flexShrink: 0,
                            borderRadius: '10px',
                            boxShadow: isPlaying
                                ? '0 0 0 2px rgba(255,255,255,0.2), 0 6px 18px rgba(0,0,0,0.5)'
                                : '0 4px 12px rgba(0,0,0,0.4)',
                            transition: 'box-shadow 0.4s ease',
                        }}>
                            <img
                                src={thumb}
                                alt={currentSong.title}
                                style={{
                                    width: '46px', height: '46px',
                                    borderRadius: '10px', objectFit: 'cover',
                                    display: 'block',
                                    animation: isPlaying ? 'npBreathe 5s ease-in-out infinite' : 'none',
                                }}
                            />
                        </div>

                        {/* Title + Artist */}
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                            <p style={{
                                fontSize: '13.5px', fontWeight: '700',
                                color: '#fff',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                margin: '0 0 3px', lineHeight: '1.2',
                                letterSpacing: '-0.1px',
                            }}>{currentSong.title}</p>
                            <p style={{
                                fontSize: '11.5px', fontWeight: '500',
                                color: 'rgba(255,255,255,0.48)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                margin: 0, lineHeight: '1.2',
                            }}>{currentSong.artist}</p>
                        </div>

                        {/* Mobile Favorite Heart Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(currentSong)
                            }}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: isFavorite(currentSong?.youtube_id) ? '#e74c3c' : 'rgba(255,255,255,0.45)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '36px', height: '36px', flexShrink: 0,
                                margin: '0 4px 0 8px',
                                transition: 'color 0.2s, transform 0.15s ease'
                            }}
                            title={isFavorite(currentSong?.youtube_id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite(currentSong?.youtube_id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                        </button>

                        {/* Right controls — stop propagation so they don't open player */}
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={playPrev}
                                style={{
                                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)',
                                    width: '34px', height: '34px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '50%',
                                }}
                                aria-label="Previous"
                            >
                                <PrevIcon />
                            </button>

                            <button
                                onClick={togglePlay}
                                style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    background: '#fff', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                                    transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
                                }}
                                onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.9)' }}
                                onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
                                aria-label={isPlaying ? 'Pause' : 'Play'}
                            >
                                {isPlaying
                                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="#111"><rect x="6" y="4" width="4" height="16" rx="1.5" /><rect x="14" y="4" width="4" height="16" rx="1.5" /></svg>
                                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="#111" style={{ marginLeft: '2px' }}><polygon points="5,3 19,12 5,21" /></svg>
                                }
                            </button>

                            <button
                                onClick={playNext}
                                style={{
                                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)',
                                    width: '34px', height: '34px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '50%',
                                }}
                                aria-label="Next"
                            >
                                <NextIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </>
        )
    }


    /* ── DESKTOP LAYOUT (3-column Spotify style) ────────────── */
    return (
        <>
            <div id="yt-player" style={{ display: 'none' }} />
            {showQueue && (
                <QueuePanel
                    currentSong={currentSong} queue={queue}
                    playSong={playSong} removeFromQueue={removeFromQueue}
                    navigate={navigate}
                />
            )}

            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                height: '90px',
                background: 'rgba(24, 24, 24, 0.75)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1fr',
                alignItems: 'center',
                padding: '0 16px',
                zIndex: 100,
            }}>

                {/* ── LEFT: Song info ─────────────────────── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
                    <img
                        src={thumb} alt={currentSong.title}
                        onClick={openPlayer}
                        style={{
                            width: '56px', height: '56px',
                            borderRadius: 'var(--radius-sm)',
                            objectFit: 'cover', flexShrink: 0,
                            cursor: currentSong.youtube_id ? 'pointer' : 'default',
                            transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    />
                    <div style={{ overflow: 'hidden' }}>
                        <p
                            onClick={openPlayer}
                            style={{
                                fontSize: '13px', fontWeight: '600',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                cursor: currentSong.youtube_id ? 'pointer' : 'default', maxWidth: '200px',
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >
                            {currentSong.title}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            {currentSong.artist}
                        </p>
                    </div>
                    <button
                        onClick={() => toggleFavorite(currentSong)}
                        className="icon-btn"
                        style={{
                            color: isFavorite(currentSong?.youtube_id) ? '#e74c3c' : 'var(--text-muted)',
                            background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px',
                            transition: 'color 0.2s, transform 0.15s ease',
                            flexShrink: 0
                        }}
                        title={isFavorite(currentSong?.youtube_id) ? 'Remove from favorites' : 'Add to favorites'}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite(currentSong?.youtube_id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                    </button>
                    {currentSong.mood && (
                        <span className="app-tag app-tag-accent" style={{ flexShrink: 0 }}>
                            {currentSong.mood}
                        </span>
                    )}
                </div>

                {/* ── CENTER: Controls + Progress ──────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '0 24px' }}>
                    {/* Controls row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Shuffle */}
                        <button
                            onClick={() => setIsShuffle(p => !p)}
                            className={`icon-btn ${isShuffle ? 'active' : ''}`}
                            title="Shuffle"
                            style={{ position: 'relative' }}
                        >
                            <ShuffleIcon />
                            {isShuffle && <span style={{
                                position: 'absolute', bottom: '2px', left: '50%',
                                transform: 'translateX(-50%)',
                                width: '4px', height: '4px', borderRadius: '50%',
                                background: 'var(--accent)', display: 'block'
                            }} />}
                        </button>

                        {/* Prev */}
                        <button onClick={playPrev} className="icon-btn" style={{ color: 'var(--text-primary)' }}>
                            <PrevIcon />
                        </button>

                        {/* Play / Pause */}
                        <button
                            onClick={togglePlay}
                            style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: '#fff', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, margin: '0 4px',
                                transition: 'transform 0.15s var(--ease-spring), background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {isPlaying
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="#000"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                                : <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" style={{ marginLeft: '2px' }}><polygon points="5,3 19,12 5,21" /></svg>
                            }
                        </button>

                        {/* Next */}
                        <button onClick={playNext} className="icon-btn" style={{ color: 'var(--text-primary)' }}>
                            <NextIcon />
                        </button>

                        {/* Loop */}
                        <button
                            onClick={cycleLoop}
                            className={`icon-btn ${loopMode !== 'none' ? 'active' : ''}`}
                            title={loopMode === 'none' ? 'No repeat' : loopMode === 'all' ? 'Repeat all' : 'Repeat one'}
                            style={{ position: 'relative' }}
                        >
                            {loopMode === 'one' ? <RepeatOneIcon /> : <RepeatIcon />}
                            {loopMode !== 'none' && <span style={{
                                position: 'absolute', bottom: '2px', left: '50%',
                                transform: 'translateX(-50%)',
                                width: '4px', height: '4px', borderRadius: '50%',
                                background: 'var(--accent)', display: 'block'
                            }} />}
                        </button>
                    </div>

                    {/* Seek bar */}
                    <SeekBar currentTime={currentTime} duration={duration} seek={seek} />
                </div>

                {/* ── RIGHT: Volume + Queue ─────────────── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                    <VolumeSlider playerRef={playerRef} />
                    <button
                        onClick={() => setShowQueue(p => !p)}
                        className={`icon-btn ${showQueue ? 'active' : ''}`}
                        title="Queue"
                    >
                        <QueueIcon />
                    </button>
                </div>
            </div>
        </>
    )
}