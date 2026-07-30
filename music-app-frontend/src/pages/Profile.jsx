import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { Icons } from '../components/icons'
import api from '../api/axios'

export default function Profile() {
    const { user, logout, updateUser } = useAuth()
    const { setQueue } = usePlayer()
    const navigate = useNavigate()
    const isMobile = useMediaQuery('(max-width: 768px)')
    const pad = isMobile ? '20px' : '40px'

    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(user?.name || '')
    const [email, setEmail] = useState(user?.email || '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [songsCount, setSongsCount] = useState(0)
    const [playlistsCount, setPlaylistsCount] = useState(0)

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }
        // Fetch library stats
        api.get('/songs').then(res => setSongsCount(res.data.length)).catch(() => {})
        api.get('/playlists').then(res => setPlaylistsCount(res.data.length)).catch(() => {})
    }, [user, navigate])

    if (!user) return null

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            const res = await api.put('/me', { name, email })
            updateUser(res.data)
            setEditing(false)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U'

    return (
        <div style={{ paddingBottom: '80px', color: '#fff', fontFamily: 'var(--font-main)' }}>
            {/* ── Dynamic Header Banner (Apple Music Style) ── */}
            <div style={{
                position: 'relative',
                padding: `${isMobile ? '40px' : '60px'} ${pad} 40px`,
                background: 'linear-gradient(180deg, rgba(80, 50, 180, 0.25) 0%, rgba(10,10,12,0.95) 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
            }}>
                {/* Floating blur circles */}
                <div style={{
                    position: 'absolute', top: '-40%', left: '-10%',
                    width: '300px', height: '300px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(138, 43, 226, 0.4) 0%, transparent 70%)',
                    filter: 'blur(50px)', zIndex: 0
                }} />
                <div style={{
                    position: 'absolute', top: '10%', right: '-5%',
                    width: '250px', height: '250px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(231, 76, 60, 0.25) 0%, transparent 70%)',
                    filter: 'blur(45px)', zIndex: 0
                }} />

                <div style={{
                    position: 'relative', zIndex: 1,
                    display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                    alignItems: 'center', gap: isMobile ? '20px' : '32px',
                    textAlign: isMobile ? 'center' : 'left',
                }}>
                    {/* Big Avatar */}
                    <div style={{
                        width: isMobile ? '100px' : '130px',
                        height: isMobile ? '100px' : '130px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8a2be2 0%, #ff2d55 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: isMobile ? '42px' : '56px',
                        fontWeight: '900', color: '#fff',
                        boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
                        border: '3px solid rgba(255,255,255,0.1)',
                        position: 'relative',
                    }}>
                        {firstLetter}
                    </div>

                    <div style={{ flex: 1 }}>
                        <p style={{
                            fontSize: '11px', fontWeight: '800', letterSpacing: '2px',
                            textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
                            margin: '0 0 6px'
                        }}>Profile</p>
                        <h1 style={{
                            fontSize: isMobile ? '28px' : '44px',
                            fontWeight: '900', letterSpacing: '-1.5px',
                            margin: '0 0 8px', lineHeight: 1.1,
                            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
                        }}>{user.name}</h1>
                        <p style={{
                            fontSize: '14px', color: 'rgba(255,255,255,0.6)',
                            margin: 0, fontWeight: '500'
                        }}>{user.email} &bull; <span style={{ color: 'var(--accent)' }}>Free Plan</span></p>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: isMobile ? 'center' : 'flex-start', marginTop: '18px' }}>
                            <button
                                onClick={() => setEditing(true)}
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: '#fff', padding: '8px 18px',
                                    borderRadius: '99px', fontSize: '13px', fontWeight: '700',
                                    cursor: 'pointer', transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={logout}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(231, 76, 60, 0.4)',
                                    color: '#e74c3c', padding: '8px 18px',
                                    borderRadius: '99px', fontSize: '13px', fontWeight: '700',
                                    cursor: 'pointer', transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(231, 76, 60, 0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Curation / Preferences (Spotify + Apple Style Grid) ── */}
            <div style={{ padding: `40px ${pad} 0` }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                    gap: '24px',
                }}>
                    {/* Stats Card (Spotify Style) */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)',
                        padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
                    }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.3px', margin: 0 }}>Stats</h3>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div>
                                <p style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>{songsCount}</p>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>Songs</p>
                            </div>
                            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
                                <p style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>{playlistsCount}</p>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>Playlists</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/playlists')}
                            style={{
                                background: 'var(--accent)', border: 'none', color: '#fff',
                                padding: '10px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700',
                                cursor: 'pointer', marginTop: 'auto',
                            }}
                        >
                            Open Library
                        </button>
                    </div>

                    {/* Preferred Tastes Card */}
                    <div style={{
                        gridColumn: isMobile ? 'span 1' : 'span 2',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)',
                        padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.3px', margin: 0 }}>Music Curation</h3>
                            <button
                                onClick={() => navigate('/onboarding')}
                                style={{
                                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                                    fontSize: '12px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline',
                                }}
                            >
                                Reset Curation
                            </button>
                        </div>

                        {/* Preferred Genres list */}
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 10px' }}>Preferred Genres</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {user.preferred_genres && user.preferred_genres.length > 0 ? (
                                    user.preferred_genres.map(g => (
                                        <span key={g} style={{
                                            fontSize: '12px', fontWeight: '600',
                                            padding: '6px 12px', borderRadius: '99px',
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                        }}>{g}</span>
                                    ))
                                ) : (
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>No genres chosen yet</span>
                                )}
                            </div>
                        </div>

                        {/* Preferred Moods list */}
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 10px' }}>Preferred Moods</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {user.preferred_moods && user.preferred_moods.length > 0 ? (
                                    user.preferred_moods.map(m => (
                                        <span key={m} style={{
                                            fontSize: '12px', fontWeight: '600',
                                            padding: '6px 12px', borderRadius: '99px',
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                        }}>{m}</span>
                                    ))
                                ) : (
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>No moods chosen yet</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Followed Artists (Spotify Style) */}
                <div style={{ marginTop: '40px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', marginBottom: '18px' }}>Your Artists</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                        {user.preferred_artists && user.preferred_artists.length > 0 ? (
                            user.preferred_artists.map(artist => (
                                <div key={artist} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '8px 16px 8px 10px', borderRadius: '99px',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '12px', fontWeight: '700',
                                    }}>
                                        {artist.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: '12.5px', fontWeight: '700' }}>{artist}</span>
                                </div>
                            ))
                        ) : (
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Follow some artists during onboarding to list them here.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Edit Profile Modal (Apple Music Style Glass Layer) ── */}
            {editing && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(16px)',
                    padding: '20px',
                }}>
                    <form onSubmit={handleSave} style={{
                        background: 'rgba(30, 30, 34, 0.85)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                        borderRadius: '20px',
                        width: '100%', maxWidth: '400px',
                        padding: '28px',
                        position: 'relative',
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', margin: '0 0 20px' }}>Edit Profile</h3>
                        {error && (
                            <p style={{ color: '#e74c3c', fontSize: '13px', fontWeight: '600', margin: '0 0 16px' }}>{error}</p>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    style={{
                                        width: '100%', height: '40px', background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                                        color: '#fff', padding: '0 12px', fontSize: '14px', outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    style={{
                                        width: '100%', height: '40px', background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                                        color: '#fff', padding: '0 12px', fontSize: '14px', outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                style={{
                                    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
                                    padding: '8px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    background: 'var(--accent)', border: 'none', color: '#fff',
                                    padding: '8px 20px', borderRadius: '99px', fontSize: '13px', fontWeight: '700',
                                    cursor: 'pointer',
                                }}
                            >
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
