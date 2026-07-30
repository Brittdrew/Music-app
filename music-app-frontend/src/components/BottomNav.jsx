import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ── Inline SVG Icons ────────────────────────────────────────── */
const HomeIcon = ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
)
const SearchIcon = ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={active ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
)
const DiscoverIcon = ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
            fill={active ? 'currentColor' : 'none'} />
    </svg>
)
const PlaylistIcon = ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={active ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="3" cy="6" r="1" fill="currentColor" />
        <circle cx="3" cy="12" r="1" fill="currentColor" />
        <circle cx="3" cy="18" r="1" fill="currentColor" />
    </svg>
)
const ProfileIcon = ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={active ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
)

const navItems = [
    { path: '/', Icon: HomeIcon, text: 'Home' },
    { path: '/search', Icon: SearchIcon, text: 'Search' },
    { path: '/discover', Icon: DiscoverIcon, text: 'Discover' },
    { path: '/playlists', Icon: PlaylistIcon, text: 'Library' },
]

export default function BottomNav() {
    const { pathname } = useLocation()
    const { user } = useAuth()

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'calc(60px + env(safe-area-inset-bottom))',
            background: '#121212',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-around',
            zIndex: 999,
            paddingTop: '0',
            paddingLeft: '8px',
            paddingRight: '8px',
            paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
            {navItems.map(item => {
                const active = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
                const Icon = item.Icon
                return (
                    <Link key={item.path} to={item.path} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'none',
                        color: active ? 'var(--accent)' : 'var(--text-secondary)',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                        minWidth: '64px'
                    }}>
                        <Icon active={active} />
                        <span style={{ fontSize: '10px', fontWeight: active ? '700' : '500' }}>
                            {item.text}
                        </span>
                    </Link>
                )
            })}
            <Link to={user ? '/profile' : '/login'} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
                color: (pathname === '/profile' || pathname === '/login') ? 'var(--accent)' : 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: '12px',
                minWidth: '64px'
            }}>
                <ProfileIcon active={pathname === '/profile' || pathname === '/login'} />
                <span style={{ fontSize: '10px', fontWeight: (pathname === '/profile' || pathname === '/login') ? '700' : '500' }}>
                    {user ? user.name.split(' ')[0] : 'Login'}
                </span>
            </Link>
        </div>
    )
}