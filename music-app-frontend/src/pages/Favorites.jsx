import { useFavorites } from '../context/FavoritesContext'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    useEffect(() => {
        const fn = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', fn)
        return () => window.removeEventListener('resize', fn)
    }, [])
    return isMobile
}

export default function Favorites() {
    const { favorites, loading, toggleFavorite } = useFavorites()
    const { playSong, setQueue } = usePlayer()
    const { user } = useAuth()
    const navigate = useNavigate()
    const isMobile = useIsMobile()

    const playAll = () => {
        if (!favorites.length) return
        setQueue(favorites)
        playSong(favorites[0])
        navigate(`/player/${favorites[0].youtube_id}`)
    }

    const shufflePlay = () => {
        if (!favorites.length) return
        const songs = [...favorites]
        for (let i = songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [songs[i], songs[j]] = [songs[j], songs[i]]
        }
        setQueue(songs)
        playSong(songs[0])
        navigate(`/player/${songs[0].youtube_id}`)
    }

    if (!user) return (
        <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div style={{ textAlign: 'center', maxWidth: '380px', width: '100%', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: isMobile ? '32px 16px' : '48px 32px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Login required</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Login to access your favorite songs.</p>
                <button onClick={() => navigate('/login')} className="app-btn" style={{ width: '100%' }}>Log in</button>
            </div>
        </div>
    )

    return (
        <div>
            {/* ── Hero Header ────────────────────────────────── */}
            <div style={{ position: 'relative', height: isMobile ? '230px' : '280px', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, rgba(231,76,60,0.4) 0%, rgba(10,10,12,0.8) 60%, var(--bg-primary) 100%)',
                }} />
                
                {/* Floating animated sparkles */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.15,
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
                }} />

                {/* Content */}
                <div style={{
                    position: 'relative', zIndex: 1,
                    padding: isMobile ? '20px 16px 20px' : '28px 32px 32px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                }}>
                    <Link to="/playlists" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        color: 'var(--text-secondary)', textDecoration: 'none',
                        fontSize: '13px', fontWeight: '600', marginBottom: isMobile ? '10px' : '16px',
                        transition: 'color 0.2s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                        Your Library
                    </Link>

                    <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Auto-Playlist
                    </p>
                    <h1 style={{ fontSize: isMobile ? '30px' : '40px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px', lineHeight: '1.1' }}>
                        Favorite Songs
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {favorites.length} {favorites.length === 1 ? 'song' : 'songs'}
                    </p>
                </div>
            </div>

            {/* ── Actions ──────────────────────────────────── */}
            <div style={{ padding: isMobile ? '16px' : '24px 32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {favorites.length > 0 && (
                    <>
                        <button onClick={playAll} style={{
                            width: '52px', height: '52px', borderRadius: '50%',
                            background: 'var(--accent)', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 20px var(--accent-glow)',
                            transition: 'transform 0.15s var(--ease-spring), background 0.2s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: '3px' }}>
                                <polygon points="5,3 19,12 5,21" />
                            </svg>
                        </button>
                        <button onClick={shufflePlay} className="app-btn-ghost" style={{ padding: '11px 22px', fontSize: '13px' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="16 3 21 3 21 8" />
                                <line x1="4" y1="20" x2="21" y2="3" />
                                <polyline points="21 16 21 21 16 21" />
                                <line x1="15" y1="15" x2="21" y2="21" />
                                <line x1="4" y1="4" x2="9" y2="9" />
                            </svg>
                            Shuffle
                        </button>
                    </>
                )}
            </div>

            {/* ── Song List ─────────────────────────────────── */}
            <div style={{ padding: isMobile ? '0 16px 16px' : '0 32px 32px' }}>
                {favorites.length > 0 && (
                    <div style={{
                        display: 'grid', gridTemplateColumns: '32px 1fr auto',
                        gap: '16px', padding: '0 12px 8px',
                        borderBottom: '1px solid var(--border)',
                        marginBottom: '8px',
                    }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px', textAlign: 'center' }}>#</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Title</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px' }}></span>
                    </div>
                )}

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: '64px', borderRadius: 'var(--radius-md)' }} />
                        ))}
                    </div>
                ) : favorites.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>❤️</div>
                        <p style={{ fontWeight: '700', fontSize: '16px', marginBottom: '6px' }}>Your favorites is empty</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                            Heart songs in the player or search to build your favorites list.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {favorites.map((song, i) => (
                            <div
                                key={song.id}
                                className="song-row"
                                style={{
                                    display: 'grid', gridTemplateColumns: '32px 1fr auto',
                                    gap: '16px', padding: '8px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    animation: `slideUp 0.2s ${Math.min(i * 0.04, 0.3)}s both`,
                                }}
                            >
                                <span style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', alignSelf: 'center', fontVariantNumeric: 'tabular-nums' }}>
                                    {i + 1}
                                </span>
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', cursor: 'pointer' }}
                                    onClick={() => { playSong(song); navigate(`/player/${song.youtube_id}`) }}
                                >
                                    <img
                                        src={song.thumbnail || `https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`}
                                        alt={song.title}
                                        style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                                    />
                                    <div style={{ overflow: 'hidden' }}>
                                        <p style={{ fontSize: '14px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {song.title}
                                        </p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {song.artist}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleFavorite(song)}
                                    className="icon-btn"
                                    title="Remove from favorites"
                                    style={{ color: 'var(--accent)', alignSelf: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
