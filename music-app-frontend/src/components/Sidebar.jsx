import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'

/* ── SVG Icons ─────────────────────────────────────────────── */
const HomeIcon = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
)
const SearchIcon = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={active ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
)
const DiscoverIcon = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
            fill={active ? 'currentColor' : 'none'} />
    </svg>
)
const PlaylistIcon = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={active ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="3" cy="6" r="1" fill="currentColor" />
        <circle cx="3" cy="12" r="1" fill="currentColor" />
        <circle cx="3" cy="18" r="1" fill="currentColor" />
    </svg>
)
const HeartIcon = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth={active ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
)

const navItems = [
    { path: '/', label: 'Home', Icon: HomeIcon },
    { path: '/search', label: 'Search', Icon: SearchIcon },
    { path: '/discover', label: 'Discover', Icon: DiscoverIcon },
    { path: '/playlists', label: 'Library', Icon: PlaylistIcon },
    { path: '/favorites', label: 'Favorites', Icon: HeartIcon },
]

/* ── Sound wave (for "now playing" mini card) ──────────────── */
function SoundWave() {
    return (
        <div className="soundwave">
            <span style={{ height: '10px' }} />
            <span style={{ height: '16px' }} />
            <span style={{ height: '8px' }} />
        </div>
    )
}

export default function Sidebar() {
    const { pathname } = useLocation()
    const { user, logout } = useAuth()
    const { currentSong, isPlaying } = usePlayer()

    return (
        <div style={{
            width: '240px',
            minHeight: '100vh',
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '0 0 110px 0',
            overflowY: 'auto',
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
        }}>
            {/* ── Logo ────────────────────────────── */}
            <div style={{ padding: '28px 24px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                        stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2v20M17 5v14M22 9v6M7 7v10M2 10v4" />
                    </svg>
                    <span style={{
                        fontSize: '22px', fontWeight: '900',
                        letterSpacing: '-0.8px',
                        background: 'linear-gradient(135deg, #fff 60%, var(--accent))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>wa ra gud</span>
                </div>
            </div>

            {/* ── Main Nav ────────────────────────── */}
            <nav style={{ padding: '16px 12px 0' }}>
                {navItems.map(({ path, label, Icon }) => {
                    const active = path === '/'
                        ? pathname === '/'
                        : pathname.startsWith(path)
                    return (
                        <Link
                            key={path}
                            to={path}
                            className={`sidebar-link ${active ? 'active' : ''}`}
                            style={{ marginBottom: '4px' }}
                        >
                            <Icon active={active} />
                            <span>{label}</span>
                            {active && isPlaying && currentSong && label === 'Home' && null}
                        </Link>
                    )
                })}
            </nav>

            {/* ── Divider ─────────────────────────── */}
            <div style={{
                height: '1px', background: 'var(--border)',
                margin: '20px 12px'
            }} />

            {/* ── Auth / Profile ───────────────────── */}
            <div style={{ padding: '0 12px', marginTop: 'auto' }}>
                {user ? (
                    <div>
                        {/* Avatar row */}
                        <Link to="/profile" style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '10px 12px', borderRadius: 'var(--radius-md)',
                            marginBottom: '8px',
                            background: 'rgba(255,255,255,0.04)',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        >
                            <div style={{
                                width: '34px', height: '34px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent-dark), var(--accent))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '14px', fontWeight: '700', color: '#fff',
                                flexShrink: 0,
                            }}>
                                {user.name[0].toUpperCase()}
                            </div>
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                <p style={{
                                    fontSize: '13px', fontWeight: '700',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    margin: 0,
                                }}>{user.name}</p>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
                                    Free Plan
                                </p>
                            </div>
                        </Link>
                        <button onClick={logout} className="sidebar-logout-btn">
                            Log out
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Link to="/register" className="app-btn" style={{
                            display: 'block', textAlign: 'center',
                            padding: '11px', fontSize: '13px'
                        }}>
                            Sign up free
                        </Link>
                        <Link to="/login" className="sidebar-logout-btn" style={{
                            display: 'block', textAlign: 'center',
                            padding: '10px', fontSize: '13px', cursor: 'pointer',
                            fontWeight: '600', borderRadius: 'var(--radius-full)',
                            textDecoration: 'none',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-light)',
                            transition: 'all 0.2s',
                        }}>
                            Log in
                        </Link>
                    </div>
                )}
            </div>

            {/* ── Now Playing Mini Card ────────────── */}
            {currentSong && (
                <div style={{
                    margin: '16px 12px 0',
                    padding: '12px',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    animation: 'fadeIn 0.3s ease',
                }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Now Playing
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                            src={currentSong.thumbnail || `https://img.youtube.com/vi/${currentSong.youtube_id}/hqdefault.jpg`}
                            alt={currentSong.title}
                            style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <p style={{
                                fontSize: '12px', fontWeight: '600',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }}>{currentSong.title}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {currentSong.artist}
                            </p>
                        </div>
                        {isPlaying && <SoundWave />}
                    </div>
                </div>
            )}
        </div>
    )
}