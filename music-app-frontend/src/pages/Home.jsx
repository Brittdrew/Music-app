import { useEffect, useState } from 'react'
import api from '../api/axios'
import { usePlayer } from '../context/PlayerContext'
import { useNavigate } from 'react-router-dom'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useAlbumPalette } from '../hooks/useAlbumPalette'
import SongCard from '../components/SongCard'

function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
}

function SkeletonCard() {
    return (
        <div style={{ minWidth: '140px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-card)', padding: '16px' }}>
            <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 'var(--radius-md)', marginBottom: '12px' }} />
            <div className="skeleton" style={{ height: '12px', width: '80%', marginBottom: '8px' }} />
            <div className="skeleton" style={{ height: '10px', width: '55%' }} />
        </div>
    )
}

function PlayButton() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
            <polygon points="5,3 19,12 5,21" />
        </svg>
    )
}

export default function Home() {
    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(true)
    const { playSong, setQueue, currentSong, isPlaying } = usePlayer()
    const navigate = useNavigate()
    // Shared breakpoint — matches Player.jsx and Search.jsx so mobile/desktop
    // layout decisions agree across every page at the same viewport width.
    const isMobile = useMediaQuery('(max-width: 768px)')

    useEffect(() => {
        api.get('/songs').then(res => {
            setSongs(res.data)
            setQueue(res.data)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    const play = (song) => {
        playSong(song)
        navigate(`/player/${song.youtube_id || song.id}`)
    }

    const featured = songs[0] || null
    const newReleases = songs.slice(1, 9)
    const forYou = songs.slice(9, 19)

    const featuredThumb = featured
        ? (featured.thumbnail || `https://img.youtube.com/vi/${featured.youtube_id}/maxresdefault.jpg`)
        : null

    // Recolor the featured banner to match whatever's actually featured —
    // the same extraction Player.jsx uses for its now-playing glow, so the
    // hero on Home no longer sits locked to the static --accent red
    // regardless of the art it's showing.
    const palette = useAlbumPalette(featuredThumb)
    const [pr, pg, pb] = palette ? palette.primaryRgb : [231, 76, 60] // falls back to --accent red
    const [sr, sg, sb] = palette ? palette.secondaryRgb : [80, 50, 180]
    const accentColor = `rgb(${pr}, ${pg}, ${pb})`
    const accentGlow = `rgba(${pr}, ${pg}, ${pb}, 0.45)`
    const accentGlowSoft = `rgba(${pr}, ${pg}, ${pb}, 0.18)`
    const secondaryGlowSoft = `rgba(${sr}, ${sg}, ${sb}, 0.14)`

    if (loading) {
        return (
            <div className="page-wrapper">
                <div className="skeleton" style={{ height: '32px', width: '260px', marginBottom: '32px', borderRadius: 'var(--radius-md)' }} />
                <div className="skeleton" style={{ height: isMobile ? '160px' : '200px', borderRadius: 'var(--radius-xl)', marginBottom: '40px' }} />
                <div className="skeleton" style={{ height: '18px', width: '140px', marginBottom: '16px', borderRadius: '4px' }} />
                <div style={{ display: 'flex', gap: '16px' }}>
                    {Array.from({ length: isMobile ? 3 : 5 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        )
    }

    if (songs.length === 0) {
        return (
            <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎵</div>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>No music yet</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Search and save songs to start listening</p>
                    <button onClick={() => navigate('/search')} className="app-btn">Browse Music</button>
                </div>
            </div>
        )
    }

    // Responsive values
    const bannerHeight = isMobile ? 'auto' : '240px'
    const imgWidth = isMobile ? '120px' : '240px'

    return (
        <div className="page-wrapper">

            {/* ── Greeting ───────────────────────────────── */}
            <h1 style={{
                fontSize: isMobile ? '24px' : '32px',
                fontWeight: '900',
                letterSpacing: '-0.8px',
                marginBottom: '28px',
                background: 'linear-gradient(135deg, #fff 60%, var(--text-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}>
                {getGreeting()} 👋
            </h1>

            {/* ── Featured Banner — recolors to match the featured song ──── */}
            {featured && (
                <div
                    key={featured.youtube_id || featured.id} // reset ambient glow animation per song
                    onClick={() => play(featured)}
                    style={{
                        position: 'relative',
                        borderRadius: 'var(--radius-xl)',
                        overflow: 'hidden',
                        marginBottom: '48px',
                        cursor: 'pointer',
                        // On mobile: auto height so content isn't clipped
                        height: bannerHeight,
                        minHeight: isMobile ? '140px' : undefined,
                        animation: 'scaleIn 0.4s var(--ease)',
                        display: 'flex',
                        alignItems: 'stretch',
                        // Ambient color glow around the whole banner, tuned to the art
                        boxShadow: `0 24px 60px ${accentGlowSoft}, 0 8px 24px ${secondaryGlowSoft}`,
                        transition: 'box-shadow 0.8s ease',
                    }}
                >
                    {/* Blurred background */}
                    <img
                        src={featuredThumb}
                        alt=""
                        style={{
                            position: 'absolute', inset: 0, width: '100%', height: '100%',
                            objectFit: 'cover',
                            filter: 'blur(20px) brightness(0.5) saturate(1.4)',
                            transform: 'scale(1.1)',
                        }}
                    />

                    {/* Sharp image on left — shrinks on mobile */}
                    <img
                        src={featuredThumb}
                        alt={featured.title}
                        style={{
                            position: 'absolute',
                            left: 0, top: 0, bottom: 0,
                            width: imgWidth,
                            height: '100%',
                            objectFit: 'cover',
                            zIndex: 1,
                        }}
                    />

                    {/* Gradient fade over sharp image */}
                    <div style={{
                        position: 'absolute',
                        left: isMobile ? '80px' : '180px',
                        top: 0, bottom: 0,
                        width: isMobile ? '60px' : '120px',
                        background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.7))',
                        zIndex: 2,
                    }} />

                    {/* Dark overlay on right — tinted toward the secondary swatch instead of flat black */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: `linear-gradient(90deg, transparent 30%, rgba(${sr},${sg},${sb},0.55) 55%, rgba(${sr},${sg},${sb},0.85) 100%)`,
                        transition: 'background 0.8s ease',
                        zIndex: 2,
                    }} />

                    {/* Content — responsive width and padding */}
                    <div style={{
                        position: 'absolute',
                        right: 0, top: 0, bottom: 0,
                        // On mobile give more width so text isn't squished
                        width: isMobile ? '65%' : '60%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: isMobile ? '16px 16px 16px 8px' : '32px',
                        zIndex: 3,
                    }}>
                        <span style={{
                            fontSize: isMobile ? '8px' : '10px',
                            color: accentColor,
                            fontWeight: '800',
                            letterSpacing: '2px',
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            transition: 'color 0.8s ease',
                        }}>
                            Featured Track
                        </span>
                        {/* Larger, more confident hero title on desktop — sharper contrast
                            against the muted metadata line below, closer to Apple Music's
                            "Listen Now" hero type scale than the previous 24px cap. */}
                        <h2 style={{
                            fontSize: isMobile ? '16px' : '34px',
                            fontWeight: '900',
                            letterSpacing: '-0.8px',
                            marginBottom: '4px',
                            lineHeight: '1.15',
                            // Prevent long titles from overflowing on mobile
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                        }}>
                            {featured.title}
                        </h2>
                        <p style={{
                            color: 'rgba(255,255,255,0.55)',
                            fontSize: isMobile ? '12px' : '14px',
                            fontWeight: '500',
                            marginBottom: '16px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {featured.artist}
                        </p>
                        <button
                            onClick={e => { e.stopPropagation(); play(featured) }}
                            style={{
                                width: 'fit-content',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: isMobile ? '8px 16px' : '11px 24px',
                                background: '#fff', color: '#000',
                                border: 'none', borderRadius: 'var(--radius-full)',
                                cursor: 'pointer', fontWeight: '800',
                                fontSize: isMobile ? '11px' : '13px',
                                fontFamily: 'inherit',
                                boxShadow: `0 8px 24px ${accentGlow}`,
                                transition: 'transform 0.15s var(--ease-spring), box-shadow 0.8s ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <PlayButton /> Play
                        </button>
                    </div>
                </div>
            )}

            {/* ── New Releases (horizontal scroll) ───────── */}
            {newReleases.length > 0 && (
                <section style={{ marginBottom: '48px' }}>
                    <div className="section-header">
                        <h2 className="section-title">New Releases</h2>
                        <span className="section-see-all" onClick={() => navigate('/discover')}>
                            Show all
                        </span>
                    </div>
                    <div
                        className="scroll-row"
                        style={{
                            // Ensure scroll row items don't get too small on mobile
                            gap: isMobile ? '10px' : '16px',
                        }}
                    >
                        {newReleases.map(song => (
                            <div
                                key={song.id || song.youtube_id}
                                style={{
                                    // Slightly wider on mobile so 2+ cards are visible
                                    minWidth: isMobile ? '130px' : '160px',
                                    maxWidth: isMobile ? '150px' : '180px',
                                    flex: '0 0 auto',
                                }}
                            >
                                <SongCard song={song} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── For You (list) ─────────────────────────── */}
            {forYou.length > 0 && (
                <section style={{ marginBottom: '48px' }}>
                    <div className="section-header">
                        <h2 className="section-title">For You</h2>
                        <span className="section-see-all" onClick={() => navigate('/discover')}>
                            Show all
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {forYou.map((song, i) => {
                            const isActive = currentSong?.youtube_id === song.youtube_id
                            return (
                                <div
                                    key={song.id || song.youtube_id}
                                    onClick={() => play(song)}
                                    className="song-row"
                                    style={{
                                        background: isActive ? 'rgba(231,76,60,0.08)' : undefined,
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                >
                                    <span style={{
                                        color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                                        fontSize: '13px',
                                        minWidth: '24px',
                                        textAlign: 'center',
                                        fontVariantNumeric: 'tabular-nums',
                                    }}>
                                        {isActive && isPlaying ? (
                                            <div className="soundwave" style={{ justifyContent: 'center' }}>
                                                <span style={{ height: '8px' }} />
                                                <span style={{ height: '12px' }} />
                                                <span style={{ height: '6px' }} />
                                            </div>
                                        ) : i + 10}
                                    </span>
                                    <img
                                        src={song.thumbnail || `https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`}
                                        alt={song.title}
                                        style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                                    />
                                    <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                                        <p style={{
                                            fontSize: '14px', fontWeight: '600',
                                            color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>{song.title}</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {song.artist}
                                        </p>
                                    </div>
                                    {/* Hide mood tag on very small screens to prevent overflow */}
                                    {song.mood && !isMobile && (
                                        <span className="app-tag app-tag-accent" style={{ flexShrink: 0 }}>
                                            {song.mood}
                                        </span>
                                    )}
                                    {song.mood && isMobile && (
                                        <span className="app-tag app-tag-accent" style={{ flexShrink: 0, fontSize: '10px', padding: '2px 8px' }}>
                                            {song.mood}
                                        </span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}
        </div>
    )
}