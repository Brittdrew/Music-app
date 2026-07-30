import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useMediaQuery } from '../hooks/useMediaQuery'

const GENRES = [
    { id: 'OPM', label: 'OPM', icon: 'ti-map-pin', color: '#e74c3c', grad: ['#c0392b', '#e74c3c'] },
    { id: 'Pop', label: 'Pop', icon: 'ti-sparkles', color: '#e91e8c', grad: ['#c2185b', '#e91e8c'] },
    { id: 'R&B', label: 'R&B', icon: 'ti-heart', color: '#8e44ad', grad: ['#6a1b9a', '#8e44ad'] },
    { id: 'Hip-hop', label: 'Hip-hop', icon: 'ti-crown', color: '#f39c12', grad: ['#e65100', '#f39c12'] },
    { id: 'Rock', label: 'Rock', icon: 'ti-bolt', color: '#d35400', grad: ['#bf360c', '#d35400'] },
    { id: 'Emo', label: 'Emo', icon: 'ti-cloud-rain', color: '#546e7a', grad: ['#37474f', '#546e7a'] },
    { id: 'Jazz', label: 'Jazz', icon: 'ti-music', color: '#16a085', grad: ['#00695c', '#16a085'] },
    { id: 'Classical', label: 'Classical', icon: 'ti-piano', color: '#2980b9', grad: ['#1565c0', '#2980b9'] },
    { id: 'Electronic', label: 'Electronic', icon: 'ti-cpu', color: '#1abc9c', grad: ['#00897b', '#1abc9c'] },
    { id: 'K-pop', label: 'K-pop', icon: 'ti-star', color: '#e91e63', grad: ['#ad1457', '#e91e63'] },
    { id: 'Reggae', label: 'Reggae', icon: 'ti-sun', color: '#27ae60', grad: ['#2e7d32', '#27ae60'] },
    { id: 'Country', label: 'Country', icon: 'ti-horse', color: '#e67e22', grad: ['#e65100', '#e67e22'] },
]

const MOODS = [
    { id: 'chill', label: 'Chill', icon: 'ti-moon', desc: 'Laid-back & relaxed', color: '#2980b9', grad: ['#1565c0', '#2980b9'] },
    { id: 'hype', label: 'Hype', icon: 'ti-flame', desc: 'High energy & upbeat', color: '#e74c3c', grad: ['#c0392b', '#e74c3c'] },
    { id: 'sad', label: 'Sad', icon: 'ti-cloud-rain', desc: 'Emotional & deep', color: '#8e44ad', grad: ['#6a1b9a', '#8e44ad'] },
    { id: 'romantic', label: 'Romantic', icon: 'ti-heart', desc: 'Love songs & slow jams', color: '#e91e8c', grad: ['#c2185b', '#e91e8c'] },
    { id: 'focus', label: 'Focus', icon: 'ti-target', desc: 'Study & concentration', color: '#16a085', grad: ['#00695c', '#16a085'] },
    { id: 'happy', label: 'Happy', icon: 'ti-sun', desc: 'Feel-good vibes', color: '#f39c12', grad: ['#e65100', '#f39c12'] },
    { id: 'dark', label: 'Dark', icon: 'ti-moon-stars', desc: 'Intense & moody', color: '#546e7a', grad: ['#263238', '#546e7a'] },
    { id: 'party', label: 'Party', icon: 'ti-confetti', desc: 'Dance floor anthems', color: '#9b59b6', grad: ['#6a1b9a', '#9b59b6'] },
]

const ARTISTS = [
    { id: 'Ben&Ben', label: 'Ben&Ben', color: '#e74c3c' },
    { id: 'Taylor Swift', label: 'Taylor Swift', color: '#e91e8c' },
    { id: 'The Weeknd', label: 'The Weeknd', color: '#8e44ad' },
    { id: 'Bruno Mars', label: 'Bruno Mars', color: '#f39c12' },
    { id: 'Joji', label: 'Joji', color: '#546e7a' },
    { id: 'December Avenue', label: 'December Ave', color: '#16a085' },
    { id: 'LANY', label: 'LANY', color: '#2980b9' },
    { id: 'SZA', label: 'SZA', color: '#e91e63' },
    { id: 'Billie Eilish', label: 'Billie Eilish', color: '#1abc9c' },
    { id: 'Zack Tabudlo', label: 'Zack Tabudlo', color: '#d35400' },
    { id: 'Cup of Joe', label: 'Cup of Joe', color: '#27ae60' },
    { id: 'Ed Sheeran', label: 'Ed Sheeran', color: '#e67e22' },
    { id: 'Nobita', label: 'Nobita', color: '#9b59b6' },
    { id: 'Drake', label: 'Drake', color: '#546e7a' },
    { id: 'Dua Lipa', label: 'Dua Lipa', color: '#e91e8c' },
    { id: 'Ariana Grande', label: 'Ariana Grande', color: '#8e44ad' },
    { id: 'IV of Spades', label: 'IV of Spades', color: '#e74c3c' },
    { id: 'Unique Salonga', label: 'Unique Salonga', color: '#16a085' },
]

const STEPS = [
    { key: 'genres', label: 'Genres', icon: 'ti-vinyl', headline: 'Pick your genres', sub: "We'll build your Discover feed around these." },
    { key: 'moods', label: 'Moods', icon: 'ti-mood-smile', headline: 'Set your mood', sub: 'How do you usually listen? Pick at least 2.' },
    { key: 'artists', label: 'Artists', icon: 'ti-microphone-2', headline: 'Follow your favourites', sub: "We'll pull their music into your library." },
]

export default function Onboarding() {
    const [step, setStep] = useState(0)
    const [genres, setGenres] = useState([])
    const [moods, setMoods] = useState([])
    const [artists, setArtists] = useState([])
    const [saving, setSaving] = useState(false)
    const { updateUser } = useAuth()
    const navigate = useNavigate()
    const isMobile = useMediaQuery('(max-width: 768px)')

    const toggle = (id, list, setList) =>
        setList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

    const selections = [genres, moods, artists]
    const canContinue = selections[step].length >= 2

    const handleFinish = async () => {
        setSaving(true)
        try {
            const res = await api.post('/preferences', {
                preferred_genres: genres,
                preferred_moods: moods,
                preferred_artists: artists,
            })
            updateUser(res.data.user)
            navigate('/discover')
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const current = STEPS[step]
    const hPad = isMobile ? '20px' : '44px'

    return (
        <div style={{
            minHeight: '100vh', background: '#0a0a0a',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            fontFamily: 'var(--font-main)', color: '#fff',
        }}>

            {/* ── Sidebar (desktop) / Top bar (mobile) ── */}
            {isMobile ? (
                /* Mobile: slim top bar with logo + step counter */
                <div style={{
                    width: '100%',
                    background: 'rgba(17,6,6,0.95)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    padding: '14px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0,
                    position: 'sticky', top: 0, zIndex: 10,
                }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '7px',
                            background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <i className="ti ti-brand-soundcloud" style={{ fontSize: '14px', color: '#fff' }} />
                        </div>
                        <span style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '-0.3px' }}>Musify</span>
                    </div>

                    {/* Step label + dots */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#e74c3c', fontWeight: '700' }}>
                            Step {step + 1} / {STEPS.length}
                        </span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {STEPS.map((_, i) => (
                                <div key={i} style={{
                                    width: i === step ? '16px' : '5px', height: '5px',
                                    borderRadius: '99px',
                                    background: i <= step ? '#e74c3c' : 'rgba(255,255,255,0.12)',
                                    transition: 'all 0.3s ease',
                                }} />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* Desktop: full left sidebar */
                <div style={{
                    width: '300px', flexShrink: 0,
                    background: 'linear-gradient(180deg, #110606 0%, #0a0303 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', flexDirection: 'column',
                    padding: '36px 28px',
                    position: 'sticky', top: 0, height: '100vh',
                }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '52px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <i className="ti ti-brand-soundcloud" style={{ fontSize: '17px', color: '#fff' }} />
                        </div>
                        <span style={{ fontWeight: '800', fontSize: '16px', letterSpacing: '-0.3px' }}>Musify</span>
                    </div>

                    {/* Steps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                        {STEPS.map((s, i) => {
                            const done = i < step
                            const active = i === step
                            return (
                                <div
                                    key={s.key}
                                    onClick={() => done && setStep(i)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '13px 14px', borderRadius: '12px',
                                        background: active ? 'rgba(231,76,60,0.1)' : 'transparent',
                                        border: active ? '1px solid rgba(231,76,60,0.2)' : '1px solid transparent',
                                        cursor: done ? 'pointer' : 'default',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{
                                        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                                        background: done ? '#e74c3c' : active ? 'rgba(231,76,60,0.12)' : 'rgba(255,255,255,0.04)',
                                        border: done ? 'none' : active ? '1.5px solid #e74c3c' : '1.5px solid rgba(255,255,255,0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.25s',
                                    }}>
                                        {done
                                            ? <i className="ti ti-check" style={{ fontSize: '15px', color: '#fff' }} />
                                            : <i className={`ti ${s.icon}`} style={{ fontSize: '15px', color: active ? '#e74c3c' : '#444' }} />
                                        }
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: active ? '#fff' : done ? '#888' : '#444', transition: 'color 0.2s' }}>
                                            {s.label}
                                        </p>
                                        <p style={{ fontSize: '11px', margin: '2px 0 0', color: done ? '#e74c3c' : active ? 'rgba(255,255,255,0.35)' : 'transparent' }}>
                                            {done ? `${selections[i].length} selected` : active ? `${selections[i].length} selected` : '·'}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <p style={{ fontSize: '11px', color: '#333', lineHeight: '1.6' }}>
                        Pick at least 2 per step. You can update preferences anytime in Settings.
                    </p>
                </div>
            )}

            {/* ── Right content ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0 }}>

                {/* Header */}
                <div style={{
                    padding: `${isMobile ? '24px' : '36px'} ${hPad} 0`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {!isMobile && (
                            <p style={{ fontSize: '11px', color: '#e74c3c', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px' }}>
                                Step {step + 1} of {STEPS.length}
                            </p>
                        )}
                        <h1 style={{
                            fontSize: isMobile ? '22px' : '26px',
                            fontWeight: '800', letterSpacing: '-0.5px',
                            margin: 0, lineHeight: 1.2,
                        }}>
                            {current.headline}
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginTop: '6px', margin: '6px 0 0' }}>
                            {current.sub}
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', paddingTop: '4px', flexShrink: 0, marginLeft: '12px' }}>
                        <span style={{ fontSize: '11px', color: '#444' }}>{selections[step].length} / 2 min</span>
                        <div style={{ width: '60px', height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(100, (selections[step].length / 2) * 100)}%`,
                                background: 'linear-gradient(90deg, #c0392b, #e74c3c)',
                                borderRadius: '99px', transition: 'width 0.3s ease',
                            }} />
                        </div>
                    </div>
                </div>

                <div style={{ margin: `${isMobile ? '16px' : '24px'} ${hPad} 0`, height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                {/* Grid */}
                <div style={{ flex: 1, padding: `${isMobile ? '16px' : '28px'} ${hPad}` }}>

                    {/* GENRES */}
                    {step === 0 && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))',
                            gap: isMobile ? '8px' : '10px',
                        }}>
                            {GENRES.map((g) => {
                                const sel = genres.includes(g.id)
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => toggle(g.id, genres, setGenres)}
                                        style={{
                                            borderRadius: '14px',
                                            border: sel ? `2px solid ${g.color}` : '2px solid transparent',
                                            background: sel
                                                ? `linear-gradient(145deg, ${g.grad[0]}, ${g.grad[1]})`
                                                : 'rgba(255,255,255,0.05)',
                                            cursor: 'pointer',
                                            padding: 0,
                                            overflow: 'hidden',
                                            position: 'relative',
                                            aspectRatio: '1',
                                            transition: 'all 0.2s ease',
                                            transform: sel ? 'scale(1.03)' : 'scale(1)',
                                            boxShadow: sel ? `0 8px 24px ${g.color}40` : 'none',
                                        }}
                                        onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                                        onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                    >
                                        {sel && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 0 }} />}
                                        {sel && (
                                            <div style={{
                                                position: 'absolute', top: '8px', right: '8px', zIndex: 2,
                                                width: '18px', height: '18px', borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <i className="ti ti-check" style={{ fontSize: '11px', color: '#fff' }} />
                                            </div>
                                        )}
                                        <div style={{
                                            position: 'relative', zIndex: 1,
                                            height: '100%', padding: isMobile ? '14px 12px' : '18px 16px',
                                            display: 'flex', flexDirection: 'column',
                                            justifyContent: 'space-between',
                                        }}>
                                            <i className={`ti ${g.icon}`} style={{
                                                fontSize: isMobile ? '22px' : '28px',
                                                color: sel ? '#fff' : g.color,
                                                transition: 'color 0.2s', display: 'block',
                                            }} />
                                            <span style={{
                                                fontWeight: '700', fontSize: isMobile ? '12px' : '13px',
                                                display: 'block', textAlign: 'left',
                                                color: sel ? '#fff' : 'rgba(255,255,255,0.5)',
                                                transition: 'color 0.2s',
                                            }}>
                                                {g.label}
                                            </span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* MOODS */}
                    {step === 1 && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(210px, 1fr))',
                            gap: isMobile ? '8px' : '10px',
                        }}>
                            {MOODS.map((m) => {
                                const sel = moods.includes(m.id)
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => toggle(m.id, moods, setMoods)}
                                        style={{
                                            borderRadius: '14px',
                                            border: sel ? `2px solid ${m.color}` : '2px solid rgba(255,255,255,0.07)',
                                            background: sel ? `${m.color}14` : 'rgba(255,255,255,0.03)',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '14px',
                                            padding: isMobile ? '12px 14px' : '14px 16px',
                                            transition: 'all 0.18s ease',
                                            transform: sel ? 'translateY(-2px)' : 'none',
                                            boxShadow: sel ? `0 6px 20px ${m.color}28` : 'none',
                                            textAlign: 'left',
                                        }}
                                        onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                                        onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                                    >
                                        <div style={{
                                            width: isMobile ? '40px' : '46px', height: isMobile ? '40px' : '46px',
                                            borderRadius: '12px', flexShrink: 0,
                                            background: sel ? `linear-gradient(145deg, ${m.grad[0]}, ${m.grad[1]})` : 'rgba(255,255,255,0.06)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s',
                                            boxShadow: sel ? `0 4px 12px ${m.color}50` : 'none',
                                        }}>
                                            <i className={`ti ${m.icon}`} style={{
                                                fontSize: isMobile ? '18px' : '22px',
                                                color: sel ? '#fff' : m.color,
                                                transition: 'color 0.2s',
                                            }} />
                                        </div>

                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <p style={{ fontWeight: '700', fontSize: '13px', margin: '0 0 3px', color: sel ? '#fff' : 'rgba(255,255,255,0.6)', transition: 'color 0.18s' }}>
                                                {m.label}
                                            </p>
                                            <p style={{ fontSize: '11px', margin: 0, color: 'rgba(255,255,255,0.28)', lineHeight: 1.4 }}>
                                                {m.desc}
                                            </p>
                                        </div>

                                        {sel && (
                                            <div style={{
                                                width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                                                background: m.color,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <i className="ti ti-check" style={{ fontSize: '11px', color: '#fff' }} />
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* ARTISTS */}
                    {step === 2 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignContent: 'flex-start' }}>
                            {ARTISTS.map((a) => {
                                const sel = artists.includes(a.id)
                                return (
                                    <button
                                        key={a.id}
                                        onClick={() => toggle(a.id, artists, setArtists)}
                                        style={{
                                            padding: isMobile ? '10px 18px' : '10px 20px',
                                            borderRadius: '99px',
                                            border: sel ? `1.5px solid ${a.color}` : '1.5px solid rgba(255,255,255,0.1)',
                                            background: sel ? `${a.color}22` : 'rgba(255,255,255,0.04)',
                                            cursor: 'pointer',
                                            fontWeight: '600', fontSize: isMobile ? '13px' : '13px',
                                            color: sel ? '#fff' : 'rgba(255,255,255,0.4)',
                                            transition: 'all 0.15s ease',
                                            display: 'flex', alignItems: 'center', gap: '7px',
                                            boxShadow: sel ? `0 2px 12px ${a.color}30` : 'none',
                                        }}
                                        onMouseEnter={e => { if (!sel) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' } }}
                                        onMouseLeave={e => { if (!sel) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' } }}
                                    >
                                        {sel && <i className="ti ti-check" style={{ fontSize: '13px', color: a.color }} />}
                                        {a.label}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* ── Footer nav ── */}
                <div style={{
                    padding: isMobile ? '14px 20px' : '18px 44px 28px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(10,10,10,0.92)',
                    backdropFilter: 'blur(16px)',
                    position: 'sticky', bottom: 0, zIndex: 5,
                    gap: '12px',
                }}>
                    <button
                        onClick={() => setStep(s => Math.max(0, s - 1))}
                        disabled={step === 0}
                        style={{
                            padding: isMobile ? '10px 14px' : '10px 20px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'transparent',
                            color: step === 0 ? '#2a2a2a' : 'rgba(255,255,255,0.5)',
                            cursor: step === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: '600', fontSize: '13px',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            transition: 'all 0.2s', flexShrink: 0,
                        }}
                    >
                        <i className="ti ti-arrow-left" style={{ fontSize: '15px' }} />
                        {!isMobile && 'Back'}
                    </button>

                    {/* Step dots */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {STEPS.map((_, i) => (
                            <div key={i} style={{
                                width: i === step ? '20px' : '6px', height: '6px',
                                borderRadius: '99px',
                                background: i <= step ? '#e74c3c' : 'rgba(255,255,255,0.1)',
                                transition: 'all 0.3s ease',
                            }} />
                        ))}
                    </div>

                    {step < STEPS.length - 1 ? (
                        <button
                            onClick={() => canContinue && setStep(s => s + 1)}
                            style={{
                                padding: isMobile ? '10px 18px' : '10px 24px',
                                borderRadius: '10px', border: 'none',
                                background: canContinue ? 'linear-gradient(135deg, #c0392b, #e74c3c)' : 'rgba(255,255,255,0.05)',
                                color: canContinue ? '#fff' : '#333',
                                cursor: canContinue ? 'pointer' : 'not-allowed',
                                fontWeight: '700', fontSize: '13px',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                transition: 'all 0.2s', flexShrink: 0,
                                boxShadow: canContinue ? '0 4px 16px rgba(192,57,43,0.4)' : 'none',
                            }}
                        >
                            Continue
                            <i className="ti ti-arrow-right" style={{ fontSize: '15px' }} />
                        </button>
                    ) : (
                        <button
                            onClick={canContinue && !saving ? handleFinish : undefined}
                            disabled={!canContinue || saving}
                            style={{
                                padding: isMobile ? '10px 18px' : '10px 24px',
                                borderRadius: '10px', border: 'none',
                                background: canContinue ? 'linear-gradient(135deg, #c0392b, #e74c3c)' : 'rgba(255,255,255,0.05)',
                                color: canContinue ? '#fff' : '#333',
                                cursor: canContinue && !saving ? 'pointer' : 'not-allowed',
                                fontWeight: '700', fontSize: '13px',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                transition: 'all 0.2s', flexShrink: 0,
                                boxShadow: canContinue ? '0 4px 16px rgba(192,57,43,0.4)' : 'none',
                                opacity: saving ? 0.75 : 1,
                            }}
                        >
                            {saving ? (
                                <><i className="ti ti-loader-2" style={{ fontSize: '15px', animation: 'spin 0.8s linear infinite' }} /> Saving…</>
                            ) : (
                                <><i className="ti ti-headphones" style={{ fontSize: '15px' }} /> {isMobile ? 'Go' : 'Start Listening'}</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}