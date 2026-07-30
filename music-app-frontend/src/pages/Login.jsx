import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'

const QUOTES = [
    'Music is the shorthand of emotion.',
    'Without music, life would be a mistake.',
    'One good thing about music, when it hits you, you feel no pain.',
]

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login, googleLogin } = useAuth()
    const navigate = useNavigate()

    const quote = QUOTES[Math.floor(Date.now() / 1000) % QUOTES.length]

    const handleLogin = async () => {
        setLoading(true)
        setError('')
        try {
            const { needsOnboarding } = await login(email, password)
            navigate(needsOnboarding ? '/onboarding' : '/')
        } catch {
            setError('Invalid email or password. Please try again.')
        }
        setLoading(false)
    }

    const handleGoogleSuccess = async (credentialResponse) => {
        if (!credentialResponse.credential) return
        setLoading(true)
        setError('')
        try {
            const { needsOnboarding } = await googleLogin(credentialResponse.credential)
            navigate(needsOnboarding ? '/onboarding' : '/')
        } catch (err) {
            setError(err.response?.data?.message || 'Google login failed. Please try again.')
        }
        setLoading(false)
    }

    const handleGoogleError = () => {
        setError('Google sign-in was unsuccessful. Please try again.')
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg-primary)',
        }}>
            {/* ── Left: Branding panel ─────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #1a0505 0%, #0d0d0d 60%)',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '48px',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Glow */}
                <div style={{
                    position: 'absolute', top: '-80px', left: '-80px',
                    width: '300px', height: '300px', borderRadius: '50%',
                    background: 'var(--accent-glow)', filter: 'blur(80px)', pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-80px', right: '-80px',
                    width: '250px', height: '250px', borderRadius: '50%',
                    background: 'rgba(231,76,60,0.12)', filter: 'blur(60px)', pointerEvents: 'none',
                }} />

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                        stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2v20M17 5v14M22 9v6M7 7v10M2 10v4" />
                    </svg>
                    <span style={{
                        fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px',
                        background: 'linear-gradient(135deg, #fff 60%, var(--accent))',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>Musify</span>
                </div>

                {/* Quote */}
                <div style={{ position: 'relative' }}>
                    <div style={{
                        width: '40px', height: '3px',
                        background: 'var(--accent)',
                        borderRadius: '2px', marginBottom: '20px',
                    }} />
                    <p style={{
                        fontSize: '28px', fontWeight: '800', lineHeight: '1.3',
                        letterSpacing: '-0.5px', marginBottom: '16px',
                        color: '#fff',
                    }}>
                        "{quote}"
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
                        Stream unlimited music, anytime.
                    </p>
                </div>
            </div>

            {/* ── Right: Form panel ────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '48px',
            }}>
                <div style={{ width: '100%', maxWidth: '380px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                        Log in to Musify
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '36px' }}>
                        Don't have an account? <Link to="/register" className="app-link">Sign up free</Link>
                    </p>

                    {error && (
                        <div style={{
                            background: 'rgba(231,76,60,0.08)',
                            border: '1px solid rgba(231,76,60,0.3)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px 16px', marginBottom: '20px',
                            display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: '500' }}>{error}</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                                Email address
                            </label>
                            <input
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                type="email"
                                className="app-input"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                                Password
                            </label>
                            <input
                                placeholder="••••••••"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="app-input"
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleLogin}
                        className="app-btn"
                        disabled={loading}
                        style={{ width: '100%', padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>

                    {/* Divider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        margin: '20px 0',
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                        <span style={{ padding: '0 14px' }}>or</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                    </div>

                    {/* Google OAuth Login Button */}
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_black"
                            shape="pill"
                            width="100%"
                        />
                    </div>
                </div>
            </div>

            {/* Responsive: hide left panel on small screens */}
            <style>{`
                @media (max-width: 700px) {
                    div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
                    div[style*="justifyContent: space-between"] { display: none !important; }
                }
            `}</style>
        </div>
    )
}