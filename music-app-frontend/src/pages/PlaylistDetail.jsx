import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'

export default function PlaylistDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { playSong, setQueue } = usePlayer()

    const [playlist, setPlaylist] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!user) return
        setLoading(true)
        setError(null)
        api.get(`/playlists/${id}`)
            .then(res => setPlaylist(res.data))
            .catch(() => setError('Could not load this playlist.'))
            .finally(() => setLoading(false))
    }, [id, user])

    const deletePlaylist = async () => {
        if (!window.confirm('Delete this playlist?')) return
        try {
            await api.delete(`/playlists/${id}`)
            navigate('/playlists')
        } catch {
            setError('Could not delete playlist.')
        }
    }

    const removeSong = async (songId) => {
        try {
            const res = await api.delete(`/playlists/${id}/songs/${songId}`)
            setPlaylist(res.data)
        } catch {
            setError('Could not remove song.')
        }
    }

    const playAll = () => {
        if (!playlist?.songs?.length) return
        setQueue(playlist.songs)
        playSong(playlist.songs[0])
        navigate(`/player/${playlist.songs[0].youtube_id}`)
    }

    const shufflePlay = () => {
        if (!playlist?.songs?.length) return
        const songs = [...playlist.songs]
        for (let i = songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [songs[i], songs[j]] = [songs[j], songs[i]]
        }
        setQueue(songs)
        playSong(songs[0])
        navigate(`/player/${songs[0].youtube_id}`)
    }

    /* Guard: not logged in */
    if (!user) return (
        <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div style={{ textAlign: 'center', maxWidth: '380px', width: '100%', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '48px 32px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Login required</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Login to access your playlists.</p>
                <button onClick={() => navigate('/login')} className="app-btn" style={{ width: '100%' }}>Log in</button>
            </div>
        </div>
    )

    /* Loading */
    if (loading) return (
        <div className="page-wrapper">
            <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-xl)', marginBottom: '24px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: '64px', borderRadius: 'var(--radius-md)' }} />
                ))}
            </div>
        </div>
    )

    /* Error */
    if (error || !playlist) return (
        <div className="page-wrapper" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{error || 'Playlist not found.'}</p>
            <button onClick={() => navigate('/playlists')} className="app-btn">Back to Library</button>
        </div>
    )

    const heroThumb = playlist.songs?.[0]?.thumbnail
        || (playlist.songs?.[0] ? `https://img.youtube.com/vi/${playlist.songs[0].youtube_id}/maxresdefault.jpg` : null)

    return (
        <div>
            {/* ── Hero Header ────────────────────────────────── */}
            <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
                {/* Blurred background */}
                {heroThumb && (
                    <img src={heroThumb} alt=""
                        style={{
                            position: 'absolute', inset: 0, width: '100%', height: '100%',
                            objectFit: 'cover',
                            filter: 'blur(40px) brightness(0.35) saturate(1.5)',
                            transform: 'scale(1.2)',
                        }}
                    />
                )}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), var(--bg-primary))',
                }} />

                {/* Content */}
                <div style={{
                    position: 'relative', zIndex: 1,
                    padding: '28px 32px 32px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                }}>
                    <Link to="/playlists" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        color: 'var(--text-secondary)', textDecoration: 'none',
                        fontSize: '13px', fontWeight: '600', marginBottom: '16px',
                        transition: 'color 0.2s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                        Your Library
                    </Link>

                    <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Playlist
                    </p>
                    <h1 style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px', lineHeight: '1.1' }}>
                        {playlist.name}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {playlist.songs?.length || 0} {playlist.songs?.length === 1 ? 'song' : 'songs'}
                    </p>
                </div>
            </div>

            {/* ── Actions ──────────────────────────────────── */}
            <div style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {playlist.songs?.length > 0 && (
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
                <div style={{ flex: 1 }} />
                <button
                    onClick={deletePlaylist}
                    className="icon-btn"
                    title="Delete playlist"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                    </svg>
                </button>
            </div>

            {/* ── Song List ─────────────────────────────────── */}
            <div style={{ padding: '0 32px 32px' }}>
                {/* Column headers */}
                {playlist.songs?.length > 0 && (
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

                {playlist.songs?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎵</div>
                        <p style={{ fontWeight: '700', fontSize: '16px', marginBottom: '6px' }}>No songs yet</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                            Go to <Link to="/discover" style={{ color: 'var(--accent)', fontWeight: '600' }}>Discover</Link> or <Link to="/search" style={{ color: 'var(--accent)', fontWeight: '600' }}>Search</Link> to add songs
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {playlist.songs.map((song, i) => (
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
                                    onClick={() => removeSong(song.id)}
                                    className="icon-btn"
                                    title="Remove from playlist"
                                    style={{ color: 'var(--text-muted)', alignSelf: 'center' }}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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