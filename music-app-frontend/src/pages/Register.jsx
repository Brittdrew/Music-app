import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'

const FEATURES = [
    { icon: '🎵', text: 'Unlimited music streaming' },
    { icon: '📋', text: 'Create personal playlists' },
    { icon: '🔀', text: 'Smart shuffle & loop modes' },
    { icon: '🎤', text: 'Synced lyrics while listening' },
]

export default function Register() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { register, googleLogin } = useAuth()
    const navigate = useNavigate()

    const handleRegister = async () => {
        if (password !== confirm) {
            setError('Passwords do not match.')
            return
        }
        setLoading(true)
        setError('')
        try {
            const { needsOnboarding } = await register(name, email, password, confirm)
            navigate(needsOnboarding ? '/onboarding' : '/')
        } catch {
            setError('Registration failed. Please check your inputs and try again.')
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
            setError(err.response?.data?.message || 'Google registration failed. Please try again.')
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
            {/* ── Left: Branding ───────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0505 100%)',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '48px',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Glows */}
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '350px', height: '350px', borderRadius: '50%', background: 'var(--accent-glow)', filter: 'blur(80px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(231,76,60,0.1)', filter: 'blur(60px)', pointerEvents: 'none' }} />

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

                {/* Features */}
                <div style={{ position: 'relative' }}>
                    <h3 style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '28px', lineHeight: '1.2' }}>
                        Everything you<br />need for music.
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {FEATURES.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '16px', flexShrink: 0,
                                }}>{f.icon}</div>
                                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>{f.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right: Form ─────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '48px',
            }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                        Sign up for free
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
                        Already have an account? <Link to="/login" className="app-link">Log in</Link>
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
                        {[
                            { label: 'Full name', placeholder: 'John Doe', value: name, set: setName, type: 'text' },
                            { label: 'Email address', placeholder: 'you@example.com', value: email, set: setEmail, type: 'email' },
                            { label: 'Password', placeholder: '••••••••', value: password, set: setPassword, type: 'password' },
                            { label: 'Confirm password', placeholder: '••••••••', value: confirm, set: setConfirm, type: 'password' },
                        ].map(f => (
                            <div key={f.label}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                                    {f.label}
                                </label>
                                <input
                                    placeholder={f.placeholder}
                                    type={f.type}
                                    value={f.value}
                                    onChange={e => f.set(e.target.value)}
                                    className="app-input"
                                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                                />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleRegister}
                        className="app-btn"
                        disabled={loading}
                        style={{ width: '100%', padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
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

                    {/* Google OAuth Signup Button */}
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_black"
                            shape="pill"
                            width="100%"
                        />
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '20px', lineHeight: '1.5', textAlign: 'center' }}>
                        By signing up you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>

            <style>{`
                @media (max-width: 700px) {
                    div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    )
}