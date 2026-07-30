import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
    useEffect(() => {
        const fn = () => setIsMobile(window.innerWidth < 640)
        window.addEventListener('resize', fn)
        return () => window.removeEventListener('resize', fn)
    }, [])
    return isMobile
}

function MosaicCover({ songs, size = 64 }) {
    const thumbs = songs.slice(0, 4).map(
        s => s.thumbnail || `https://img.youtube.com/vi/${s.youtube_id}/hqdefault.jpg`
    )
    const dim = { width: `${size}px`, height: `${size}px` }

    if (thumbs.length === 0) return (
        <div style={{
            ...dim, borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent-dark), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
        }}>
            <svg width={size * 0.34} height={size * 0.34} viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
        </div>
    )
    if (thumbs.length === 1) return (
        <img src={thumbs[0]} alt=""
            style={{ ...dim, borderRadius: '10px', objectFit: 'cover', flexShrink: 0, boxShadow: '0 3px 10px rgba(0,0,0,0.3)' }} />
    )
    return (
        <div style={{
            ...dim, borderRadius: '10px',
            overflow: 'hidden', display: 'grid',
            gridTemplateColumns: '1fr 1fr', gap: '1px',
            flexShrink: 0, boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
        }}>
            {thumbs.slice(0, 4).map((src, i) => (
                <img key={i} src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ))}
        </div>
    )
}

function PlaylistRow({ pl, index, onOpen, isMobile }) {
    const [hovered, setHovered] = useState(false)
    const count = pl.songs?.length || 0
    // Bigger cover on desktop so it doesn't look tiny
    const coverSize = isMobile ? 56 : 72

    return (
        <div
            onClick={onOpen}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: isMobile ? '10px 8px' : '10px 12px',
                borderRadius: '12px', cursor: 'pointer',
                background: hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
                transition: 'background 0.15s',
                animation: `slideUp 0.25s ${Math.min(index * 0.035, 0.35)}s both`,
            }}
        >
            <div style={{ transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.25s cubic-bezier(.22,1,.36,1)', flexShrink: 0 }}>
                <MosaicCover songs={pl.songs || []} size={coverSize} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontSize: isMobile ? '14px' : '14.5px',
                    fontWeight: '700', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: hovered ? 'var(--accent)' : 'var(--text-primary)',
                    transition: 'color 0.15s',
                }}>
                    {pl.name}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '3px' }}>
                    Playlist · {count} {count === 1 ? 'song' : 'songs'}
                </p>
            </div>
            <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: hovered ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s cubic-bezier(.22,1,.36,1)',
                transform: hovered ? 'scale(1)' : 'scale(0.92)',
            }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke={hovered ? 'white' : 'var(--text-muted)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </div>
        </div>
    )
}

export default function Playlists() {
    const [playlists, setPlaylists] = useState([])
    const [name, setName] = useState('')
    const [creating, setCreating] = useState(false)
    const [showInput, setShowInput] = useState(false)
    const { user } = useAuth()
    const { favorites } = useFavorites()
    const navigate = useNavigate()
    const isMobile = useIsMobile()

    useEffect(() => {
        if (!user) return
        api.get('/playlists').then(res => setPlaylists(res.data))
    }, [user])

    const createPlaylist = async () => {
        if (!name.trim()) return
        setCreating(true)
        const res = await api.post('/playlists', { name })
        setPlaylists(prev => [...prev, res.data])
        setName('')
        setShowInput(false)
        setCreating(false)
    }

    const totalSongs = playlists.reduce((sum, pl) => sum + (pl.songs?.length || 0), 0)

    if (!user) return (
        <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div style={{
                textAlign: 'center', maxWidth: '380px', width: '100%',
                background: 'var(--bg-card)', borderRadius: '20px',
                padding: isMobile ? '32px 20px' : '48px 32px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{
                    width: '68px', height: '68px', borderRadius: '50%', margin: '0 auto 20px',
                    background: 'rgba(231,76,60,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
                <h2 style={{ fontSize: '21px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.4px' }}>
                    Members Only
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px', lineHeight: '1.6' }}>
                    Create and manage your own playlists. Sign up to start building your library.
                </p>
                <button onClick={() => navigate('/login')} className="app-btn" style={{ width: '100%', padding: '13px' }}>
                    Log in to continue
                </button>
            </div>
        </div>
    )

    return (
        <div className="page-wrapper">
            {/* ── Header ──────────────────────────────────── */}
            <div style={{
                marginBottom: '30px',
                // Stack vertically on mobile so the button doesn't clip
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'flex-end',
                gap: isMobile ? '16px' : '0',
            }}>
                <div>
                    <h1 style={{
                        fontSize: isMobile ? '26px' : '32px',
                        fontWeight: '900', letterSpacing: '-0.8px', marginBottom: '4px',
                    }}>
                        Your Library
                    </h1>
                    {playlists.length > 0 && (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
                            {playlists.length} playlist{playlists.length !== 1 ? 's' : ''} · {totalSongs} song{totalSongs !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
                {/* On mobile stretch the button full width for easy tapping */}
                <button
                    onClick={() => setShowInput(p => !p)}
                    className="app-btn"
                    style={{
                        padding: '10px 20px', fontSize: '13px', gap: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: isMobile ? '100%' : 'auto',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New playlist
                </button>
            </div>

            {/* ── Create Input ────────────────────────────── */}
            {showInput && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    padding: isMobile ? '16px' : '22px',
                    marginBottom: '28px',
                    animation: 'slideDown 0.2s cubic-bezier(.22,1,.36,1)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
                }}>
                    <p style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Name your playlist
                    </p>
                    {/* Stack input + buttons vertically on mobile */}
                    <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: '10px',
                    }}>
                        <input
                            autoFocus
                            placeholder="My Playlist #1"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && createPlaylist()}
                            className="app-input"
                            style={{ flex: 1, borderRadius: '10px', width: isMobile ? '100%' : undefined, boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={createPlaylist}
                                className="app-btn"
                                disabled={creating}
                                style={{ padding: '13px 22px', fontSize: '13px', flex: isMobile ? 1 : undefined }}
                            >
                                {creating ? '...' : 'Create'}
                            </button>
                            <button
                                onClick={() => { setShowInput(false); setName('') }}
                                className="app-btn-ghost"
                                style={{ padding: '13px 18px', fontSize: '13px', flex: isMobile ? 1 : undefined }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Empty state ─────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {/* Favorite Songs Quick Row */}
                <div
                    onClick={() => navigate('/favorites')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: isMobile ? '10px 8px' : '10px 12px',
                        borderRadius: '12px', cursor: 'pointer',
                        background: 'transparent',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <div style={{ flexShrink: 0 }}>
                        <div style={{
                            width: isMobile ? '56px' : '72px',
                            height: isMobile ? '56px' : '72px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                        }}>
                            <svg width={isMobile ? '20' : '26'} height={isMobile ? '20' : '26'} viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                            fontSize: isMobile ? '14px' : '14.5px',
                            fontWeight: '700', overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            color: 'var(--text-primary)',
                        }}>
                            Favorite Songs
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '3px' }}>
                            Auto-Playlist · {favorites.length} {favorites.length === 1 ? 'song' : 'songs'}
                        </p>
                    </div>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </div>
                </div>

                {/* Playlist Rows */}
                {playlists.map((pl, i) => (
                    <PlaylistRow
                        key={pl.id} pl={pl} index={i}
                        onOpen={() => navigate(`/playlists/${pl.id}`)}
                        isMobile={isMobile}
                    />
                ))}

                {/* Subtle create playlist block if empty */}
                {playlists.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 16px', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '12px', marginTop: '16px' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '14px', fontWeight: '500' }}>
                            Create your own custom playlists to group songs.
                        </p>
                        <button onClick={() => setShowInput(true)} className="app-btn" style={{ padding: '9px 18px', fontSize: '12.5px' }}>
                            Create playlist
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}