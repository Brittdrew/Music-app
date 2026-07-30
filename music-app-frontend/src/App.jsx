import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Player from './pages/Player'
import Discover from './pages/Discover'
import Playlists from './pages/Playlists'
import PlaylistDetail from './pages/PlaylistDetail'
import Favorites from './pages/Favorites'
import Login from './pages/Login'
import Register from './pages/Register'
import Search from './pages/Search'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import NowPlayingBar from './components/NowPlayingBar'
import NowPlayingPanel from './components/NowPlayingPanel'
import { PlayerProvider } from './context/PlayerContext'
import { AuthProvider } from './context/AuthContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { useMediaQuery } from './hooks/useMediaQuery'
import { MOBILE_STACK_CALC } from './layoutConstants'

function Layout() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  // Right panel is the least essential column (same as Spotify) — it's the first
  // thing to go when the window gets tight, before the sidebar collapses or the
  // layout switches to full mobile.
  const hidePanel = useMediaQuery('(max-width: 1200px)')
  const { pathname } = useLocation()
  const isPlayerPage = pathname.startsWith('/player/')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'transparent' }}>
      {!isMobile && <Sidebar />}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: 'transparent',
        // FIX: was a hardcoded 'calc(140px + env(safe-area-inset-bottom))'
        // that could silently drift from the real bar stack height. Now
        // derived from the same constants BottomNav.jsx and
        // NowPlayingBar.jsx's QueuePanel use, so all three stay in sync.
        paddingBottom: isMobile ? (isPlayerPage ? '0px' : MOBILE_STACK_CALC) : '90px'
      }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/player/:id" element={<Player />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/playlists/:id" element={<PlaylistDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
      {/* Right-side Now Playing panel — hidden below 1200px, before mobile kicks in */}
      {!isMobile && !hidePanel && <NowPlayingPanel />}
      {/* NowPlayingBar must be always mounted so the YouTube player iframe is never destroyed.
          On mobile player page, it hides its own UI. */}
      <NowPlayingBar />
      {isMobile && !isPlayerPage && <BottomNav />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <PlayerProvider>
            <Routes>
              {/* Onboarding is full-screen — no sidebar/nav */}
              <Route path="/onboarding" element={<Onboarding />} />
              {/* All other routes use the main Layout */}
              <Route path="/*" element={<Layout />} />
            </Routes>
          </PlayerProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App