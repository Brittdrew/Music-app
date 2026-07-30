import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { useLyrics } from '../hooks/useLyrics' // adjust path to wherever you place it

/* ── Icons (inline, matches your no-external-icon-file pattern) ─────────── */
function ChevronDownIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    )
}
function PlayIcon() {
    return <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
}
function PauseIcon() {
    return <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
}
function SkipBackIcon() {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM20 6l-10 6 10 6z" /></svg>
}
function SkipForwardIcon() {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6h-2v12h2zM4 6l10 6-10 6z" /></svg>
}
function MicIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
        </svg>
    )
}

/**
 * NowPlayingSheet — mobile fullscreen player (Spotify structure / Apple Music polish).
 * Reads directly from PlayerContext, same as your desktop NowPlayingPanel.
 * Render this conditionally inside your mobile layout, e.g.:
 *   {isMobile && <NowPlayingSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />}
 */
export default function NowPlayingSheet({ isOpen, onClose }) {
    const {
        currentSong, isPlaying, currentTime, duration,
        togglePlay, seek, playNext, playPrev,
    } = usePlayer()

    const { lyrics, isSynced, isLoading: lyricsLoading } = useLyrics(currentSong)

    const [lyricsOpen, setLyricsOpen] = useState(false)
    const [dragY, setDragY] = useState(0)
    const dragStartY = useRef(null)
    const lyricsListRef = useRef(null)
    const activeLineRef = useRef(null)

    const thumb = currentSong
        ? currentSong.thumbnail || (currentSong.youtube_id ? `https://img.youtube.com/vi/${currentSong.youtube_id}/hqdefault.jpg` : '')
        : null

    /* ── active lyric line (only meaningful when isSynced) ────────────── */
    const activeIndex = useMemo(() => {
        if (!lyrics || !isSynced) return -1
        let idx = -1
        for (let i = 0; i < lyrics.length; i++) {
            if (lyrics[i].time <= currentTime) idx = i
            else break
        }
        return idx
    }, [lyrics, isSynced, currentTime])

    useEffect(() => {
        if (!lyricsOpen || !isSynced || !activeLineRef.current) return
        activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [activeIndex, lyricsOpen, isSynced])

    useEffect(() => {
        if (!isOpen) setLyricsOpen(false)
    }, [isOpen])

    /* ── drag-to-dismiss ────────────────────────────────────────────── */
    const handleTouchStart = useCallback((e) => { dragStartY.current = e.touches[0].clientY }, [])
    const handleTouchMove = useCallback((e) => {
        if (dragStartY.current === null) return
        const delta = e.touches[0].clientY - dragStartY.current
        if (delta > 0) setDragY(delta)
    }, [])
    const handleTouchEnd = useCallback(() => {
        if (dragY > 120) onClose()
        setDragY(0)
        dragStartY.current = null
    }, [dragY, onClose])

    const fmtTime = (s) => {
        if (!s && s !== 0) return '0:00'
        const m = Math.floor(s / 60)
        const sec = Math.floor(s % 60).toString().padStart(2, '0')
        return `${m}:${sec}`
    }

    if (!currentSong) return null

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                transform: isOpen ? `translateY(${dragY}px)` : 'translateY(100%)',
                transition: dragStartY.current !== null ? 'none' : 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
                background: 'var(--bg-app, #0a0a0c)',
            }}
        >
            {/* Blurred background art */}
            <div style={{
                position: 'absolute', inset: '-40px',
                backgroundImage: `url(${thumb})`, backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'blur(60px) saturate(1.4) brightness(0.5)', transform: 'scale(1.15)',
            }} />
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(10,10,12,0.35) 0%, rgba(10,10,12,0.8) 60%, rgba(10,10,12,0.97) 100%)',
            }} />

            {/* Header / drag handle / close */}
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'flex-end', padding: '14px 12px 0' }}>
                <div style={{
                    width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.3)',
                    position: 'absolute', left: '50%', top: '8px', transform: 'translateX(-50%)',
                }} />
                <button onClick={onClose} aria-label="Close" style={{
                    background: 'none', border: 'none', color: '#fff', width: '44px', height: '44px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>
                    <ChevronDownIcon />
                </button>
            </div>

            <div style={{
                position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column',
                padding: '16px 24px 16px', minHeight: 0,
            }}>
                {/* Artwork — shrinks + moves up when lyrics open */}
                <div style={{
                    width: '100%', margin: '8px auto 20px', borderRadius: '12px', overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    maxHeight: lyricsOpen ? '15vh' : '42vh',
                    ...(lyricsOpen ? { width: '15vh', margin: '0 auto 12px' } : {}),
                    transition: 'max-height 320ms cubic-bezier(0.22,1,0.36,1), margin 320ms cubic-bezier(0.22,1,0.36,1), width 320ms cubic-bezier(0.22,1,0.36,1)',
                    aspectRatio: '1/1',
                }}>
                    <img src={thumb} alt={currentSong.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>

                {/* Title / artist */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                        <p style={{
                            color: '#fff', fontSize: '19px', fontWeight: '800', margin: '0 0 2px',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {currentSong.title}
                        </p>
                        <p style={{
                            color: 'rgba(255,255,255,0.65)', fontSize: '14px', margin: 0,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {currentSong.artist}
                        </p>
                    </div>
                </div>

                {/* Seek bar */}
                <div style={{ marginTop: '18px' }}>
                    <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={currentTime || 0}
                        onChange={(e) => seek(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent, #e74c3c)', height: '4px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.55)', fontSize: '11px', marginTop: '4px' }}>
                        <span>{fmtTime(currentTime)}</span>
                        <span>{fmtTime(duration)}</span>
                    </div>
                </div>

                {/* Transport controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', marginTop: '8px' }}>
                    <button onClick={playPrev} aria-label="Previous" style={{
                        background: 'none', border: 'none', color: '#fff', width: '44px', height: '44px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}>
                        <SkipBackIcon />
                    </button>
                    <button onClick={togglePlay} aria-label="Play/Pause" style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: 'var(--accent, #e74c3c)', border: 'none', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(231,76,60,0.4)',
                    }}>
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <button onClick={playNext} aria-label="Next" style={{
                        background: 'none', border: 'none', color: '#fff', width: '44px', height: '44px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}>
                        <SkipForwardIcon />
                    </button>
                </div>

                {/* Lyrics toggle */}
                <button
                    onClick={() => setLyricsOpen(v => !v)}
                    style={{
                        alignSelf: 'center', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '20px', minHeight: '36px', cursor: 'pointer',
                        border: `1px solid ${lyricsOpen ? 'var(--accent, #e74c3c)' : 'rgba(255,255,255,0.2)'}`,
                        background: lyricsOpen ? 'var(--accent, #e74c3c)' : 'rgba(255,255,255,0.06)',
                        color: lyricsOpen ? '#fff' : 'rgba(255,255,255,0.75)',
                        fontSize: '12px', fontWeight: '700',
                    }}
                >
                    <MicIcon />
                    <span>Lyrics</span>
                </button>

                {/* Lyrics panel */}
                <div style={{
                    overflow: 'hidden',
                    maxHeight: lyricsOpen ? '100%' : 0,
                    opacity: lyricsOpen ? 1 : 0,
                    flex: lyricsOpen ? 1 : 0,
                    minHeight: 0,
                    marginTop: lyricsOpen ? '12px' : 0,
                    transition: 'max-height 340ms cubic-bezier(0.22,1,0.36,1), opacity 240ms ease-out',
                }}>
                    {lyricsLoading ? (
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
                            Loading lyrics…
                        </p>
                    ) : lyrics && lyrics.length > 0 ? (
                        <div
                            ref={lyricsListRef}
                            style={{
                                height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
                                padding: '12px 4px 40vh', scrollbarWidth: 'none',
                            }}
                        >
                            {lyrics.map((line, i) => {
                                const isActive = isSynced && i === activeIndex
                                const distance = isSynced
                                    ? (activeIndex === -1 ? 1 : Math.abs(i - activeIndex))
                                    : 0
                                // Distance-based fade for synced lyrics; unsynced lines render at full opacity
                                const opacity = !isSynced ? 0.85 : (isActive ? 1 : Math.max(0.15, 1 - distance * 0.22))
                                return (
                                    <p
                                        key={i}
                                        ref={isActive ? activeLineRef : null}
                                        onClick={() => isSynced && line.time >= 0 && seek(line.time)}
                                        style={{
                                            color: '#fff',
                                            fontSize: isActive ? '23px' : '19px',
                                            fontWeight: isActive ? 800 : 600,
                                            lineHeight: 1.5,
                                            margin: '0 0 18px',
                                            opacity,
                                            cursor: isSynced ? 'pointer' : 'default',
                                            transition: 'opacity 280ms ease-out, font-size 280ms ease-out',
                                        }}
                                    >
                                        {line.text}
                                    </p>
                                )
                            })}
                        </div>
                    ) : (
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
                            No lyrics available for this track.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}