import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { MoodIcon, GenreIcon, Icons } from '../components/icons'
import { FALLBACK_SONGS } from '../api/fallbackSongs'
import { resolvePlaybackSong } from '../api/playbackResolver'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useAlbumPalette } from '../hooks/useAlbumPalette'

/* ─── Constants ───────────────────────────────────────────── */
const MOOD_META = {
    chill: { icon: 'chill', color: '#3498db', bg: 'linear-gradient(135deg, #3498db, #2980b9)' },
    hype: { icon: 'hype', color: '#e74c3c', bg: 'linear-gradient(135deg, #e74c3c, #c0392b)' },
    sad: { icon: 'sad', color: '#9b59b6', bg: 'linear-gradient(135deg, #9b59b6, #8e44ad)' },
    romantic: { icon: 'romantic', color: '#ff4f81', bg: 'linear-gradient(135deg, #ff4f81, #e91e63)' },
    OPM: { icon: 'OPM', color: '#e67e22', bg: 'linear-gradient(135deg, #e67e22, #d35400)' },
    focus: { icon: 'focus', color: '#1abc9c', bg: 'linear-gradient(135deg, #1abc9c, #16a085)' },
    happy: { icon: 'happy', color: '#f1c40f', bg: 'linear-gradient(135deg, #f1c40f, #f39c12)' },
    party: { icon: 'party', color: '#9b59b6', bg: 'linear-gradient(135deg, #9b59b6, #8e44ad)' },
}
const GENRE_META = {
    OPM: { icon: 'OPM', color: '#2ecc71' },
    Pop: { icon: 'Pop', color: '#ff2d55' },
    'R&B': { icon: 'R&B', color: '#af52de' },
    'Hip-hop': { icon: 'Hip-hop', color: '#5856d6' },
    Emo: { icon: 'Emo', color: '#8e8e93' },
    Rock: { icon: 'Rock', color: '#ff9500' },
    Jazz: { icon: 'Jazz', color: '#34aadc' },
    Electronic: { icon: 'Electronic', color: '#4cd964' },
    'K-pop': { icon: 'K-pop', color: '#ff2d55' },
}

const SCORE_WEIGHTS = { artist: 4, genre: 2, mood: 1, recency: 0.5 }

function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
}

function scoreSong(song, user, index, total) {
    let score = 0
    const artists = (user?.preferred_artists ?? []).map(a => a.toLowerCase())
    const genres = user?.preferred_genres ?? []
    const moods = user?.preferred_moods ?? []
    if (song.artist && artists.some(a => song.artist.toLowerCase().includes(a))) score += SCORE_WEIGHTS.artist
    if (song.genre && genres.includes(song.genre)) score += SCORE_WEIGHTS.genre
    if (song.mood && moods.includes(song.mood)) score += SCORE_WEIGHTS.mood
    if (total > 1) score += SCORE_WEIGHTS.recency * (1 - index / total)
    return score
}


/* ─── Sub-components ─────────────────────────────────────── */

function EqualizerBars({ playing, color = 'var(--accent)', size = 12 }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '2px', height: size, width: size }}>
            {[0, 1, 2].map(i => (
                <span key={i} style={{
                    width: '2.5px', borderRadius: '1px', background: color,
                    animation: playing ? `eqBounce 0.9s ease-in-out ${i * 0.18}s infinite` : 'none',
                    height: playing ? undefined : '3px',
                }} />
            ))}
        </span>
    )
}

function SkeletonHero() {
    return (
        <div style={{ borderRadius: '24px', overflow: 'hidden', aspectRatio: '16/6', background: 'var(--bg-card)' }}>
            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
        </div>
    )
}

function SkeletonRow({ isMobile }) {
    return (
        <div style={{ display: 'flex', gap: '18px', overflowX: 'hidden' }}>
            {Array.from({ length: isMobile ? 3 : 5 }).map((_, i) => (
                <div key={i} style={{ flexShrink: 0, width: isMobile ? '130px' : '168px' }}>
                    <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1', borderRadius: '12px', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ height: '11px', width: '80%', marginBottom: '6px' }} />
                    <div className="skeleton" style={{ height: '9px', width: '55%' }} />
                </div>
            ))}
        </div>
    )
}

function HeroCard({ song, onPlay, accentColor = 'var(--accent)', isMobile }) {
    const { currentSong, isPlaying } = usePlayer()
    const isActive = currentSong?.id === song.id
    const thumb = song.thumbnail || `https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`
    const [hovered, setHovered] = useState(false)

    // Palette extraction for dynamic backdrop
    const palette = useAlbumPalette(thumb)
    const [pr, pg, pb] = palette ? palette.primaryRgb : [231, 76, 60]
    const dynamicAccent = `rgb(${pr}, ${pg}, ${pb})`

    return (
        <div
            onClick={() => onPlay(song)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                borderRadius: '24px', overflow: 'hidden', cursor: 'pointer',
                position: 'relative',
                aspectRatio: isMobile ? '16/10' : '21/8',
                transform: hovered ? 'scale(1.006)' : 'scale(1)',
                boxShadow: isActive
                    ? `0 24px 60px rgba(${pr}, ${pg}, ${pb}, 0.35)`
                    : '0 16px 40px rgba(0,0,0,0.5)',
                isolation: 'isolate',
                transition: 'box-shadow 0.6s ease, transform 0.4s cubic-bezier(.25,.8,.25,1)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            {/* Ambient dynamic backdrop */}
            <div style={{
                position: 'absolute', inset: '-10%',
                backgroundImage: `url(${thumb})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'blur(35px) saturate(1.8) brightness(0.5)',
                transform: 'scale(1.1)',
                zIndex: 0,
            }} />
            
            {/* Ambient color blobs */}
            <div style={{
                position: 'absolute',
                top: '-20%', left: '-20%',
                width: '60%', height: '60%',
                background: `radial-gradient(circle, rgba(${pr}, ${pg}, ${pb}, 0.4) 0%, transparent 70%)`,
                filter: 'blur(40px)',
                zIndex: 1,
            }} />

            <img
                src={thumb}
                alt={song.title}
                style={{
                    position: 'absolute', right: '0', top: '0', bottom: '0',
                    width: isMobile ? '75%' : '56%',
                    height: '100%', objectFit: 'cover',
                    maskImage: 'linear-gradient(to left, black 65%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to left, black 65%, transparent 100%)',
                    transform: hovered ? 'scale(1.04)' : 'scale(1)',
                    transition: 'transform 0.8s cubic-bezier(.25,.8,.25,1)',
                    zIndex: 2,
                }}
            />

            {/* Depth gradient overlay */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 3,
                background: 'linear-gradient(90deg, rgba(10,10,12,0.92) 0%, rgba(10,10,12,0.65) 45%, rgba(10,10,12,0.1) 80%, transparent 100%)',
            }} />

            {/* Content */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 4,
                padding: isMobile ? '20px' : '36px',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content',
                    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '99px',
                    padding: isMobile ? '4px 10px' : '6px 14px',
                    marginBottom: isMobile ? '10px' : '16px',
                    fontSize: isMobile ? '9px' : '10px',
                    fontWeight: '800', letterSpacing: '1.5px',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)',
                }}>
                    <Icons.sparkles color={dynamicAccent} size={10} />
                    Featured Today
                </div>
                <h2 style={{
                    fontSize: isMobile ? '20px' : 'clamp(26px, 3.4vw, 36px)',
                    fontWeight: '900', letterSpacing: '-1px',
                    lineHeight: 1.1, marginBottom: '6px', color: 'white',
                    maxWidth: '550px', overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>{song.title}</h2>
                <p style={{
                    color: 'rgba(255,255,255,0.65)',
                    fontSize: isMobile ? '13px' : '15px',
                    fontWeight: '500',
                    marginBottom: isMobile ? '16px' : '24px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: '50%',
                }}>
                    {song.artist}
                </p>
                <button style={{
                    width: isMobile ? '44px' : '54px',
                    height: isMobile ? '44px' : '54px',
                    borderRadius: '50%',
                    background: '#fff',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: hovered ? 'scale(1.08)' : 'scale(1)',
                }}>
                    {isActive && isPlaying ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={dynamicAccent}>
                            <rect x="6" y="4" width="4" height="16" rx="1.5" />
                            <rect x="14" y="4" width="4" height="16" rx="1.5" />
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={dynamicAccent} style={{ marginLeft: '3px' }}>
                            <polygon points="5,3 19,12 5,21" />
                        </svg>
                    )}
                </button>
            </div>
            {isActive && (
                <div style={{
                    position: 'absolute', inset: 0, borderRadius: '24px', zIndex: 5,
                    border: `2px solid ${dynamicAccent}`, pointerEvents: 'none',
                }} />
            )}
        </div>
    )
}

function SongRow({ song, onPlay, index, reason }) {
    const { currentSong, isPlaying } = usePlayer()
    const isActive = currentSong?.id === song.id
    const [hovered, setHovered] = useState(false)
    const thumb = song.thumbnail || `https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`

    return (
        <div
            onClick={() => onPlay(song)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '10px 14px', borderRadius: '12px',
                background: hovered ? 'rgba(255,255,255,0.06)' : isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.2s ease',
                animation: `slideUp 0.25s ${Math.min(index * 0.03, 0.35)}s both`,
                borderBottom: '1px solid rgba(255,255,255,0.02)',
            }}
        >
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', width: '20px', flexShrink: 0, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                {isActive
                    ? (isPlaying ? <EqualizerBars playing color="var(--accent)" size={13} /> : <span style={{ color: 'var(--accent)' }}>❚❚</span>)
                    : index + 1}
            </span>
            <img src={thumb} alt={song.title} style={{
                width: '46px', height: '46px', borderRadius: '8px',
                objectFit: 'cover', flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: isActive ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontWeight: '600', fontSize: '14.5px', color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    margin: 0,
                }}>{song.title}</p>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '3px 0 0' }}>
                    {reason ?? song.artist}
                </p>
            </div>
            {song.genre && (
                <span style={{
                    fontSize: '11px', fontWeight: '700', padding: '4px 10px',
                    borderRadius: '99px', background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.6)', flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.04)',
                }}>{song.genre}</span>
            )}
        </div>
    )
}

function HScrollCard({ song, onPlay, index, cardWidth = 168 }) {
    const { currentSong, isPlaying } = usePlayer()
    const isActive = currentSong?.id === song.id
    const [hovered, setHovered] = useState(false)
    const thumb = song.thumbnail || `https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`

    return (
        <div
            onClick={() => onPlay(song)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                flexShrink: 0, width: `${cardWidth}px`, cursor: 'pointer',
                animation: `slideUp 0.25s ${Math.min(index * 0.04, 0.4)}s both`,
            }}
        >
            <div style={{
                position: 'relative', borderRadius: '16px', overflow: 'hidden',
                aspectRatio: '1/1', marginBottom: '12px',
                boxShadow: isActive 
                    ? '0 12px 32px rgba(231,76,60,0.3)' 
                    : hovered 
                        ? '0 16px 36px rgba(0,0,0,0.45)' 
                        : '0 6px 18px rgba(0,0,0,0.25)',
                transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}>
                <img src={thumb} alt={song.title} style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    transform: hovered ? 'scale(1.06)' : 'scale(1)',
                    transition: 'transform 0.5s cubic-bezier(.25,.8,.25,1)',
                }} />
                
                {/* Spotify-style play button overlay */}
                <div style={{
                    position: 'absolute', inset: 0, 
                    background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)',
                    opacity: hovered || isActive ? 1 : 0, transition: 'opacity 0.25s ease',
                }} />
                
                <div style={{
                    position: 'absolute', bottom: '12px', right: '12px',
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
                    opacity: hovered || isActive ? 1 : 0,
                    transform: hovered || isActive ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(6px)',
                    transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                    {isActive && isPlaying ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)"><rect x="6" y="4" width="4" height="16" rx="1.5" /><rect x="14" y="4" width="4" height="16" rx="1.5" /></svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" style={{ marginLeft: '2px' }}><polygon points="5,3 19,12 5,21" /></svg>
                    )}
                </div>

                {isActive && isPlaying && (
                    <div style={{
                        position: 'absolute', top: '12px', left: '12px',
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                        borderRadius: '8px', padding: '6px 8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <EqualizerBars playing color="var(--accent)" size={12} />
                    </div>
                )}
                {isActive && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '16px', border: '2px solid var(--accent)', pointerEvents: 'none' }} />
                )}
            </div>
            <p style={{ fontWeight: '700', fontSize: '14px', color: isActive ? 'var(--accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                {song.title}
            </p>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {song.artist}
            </p>
        </div>
    )
}

function SectionHeader({ title, sub, onSeeAll }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div>
                <h2 style={{ fontSize: '21px', fontWeight: '900', letterSpacing: '-0.5px', margin: 0, color: '#fff' }}>{title}</h2>
                {sub && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>{sub}</p>}
            </div>
            {onSeeAll && (
                <button onClick={onSeeAll} style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                    fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.8)',
                    padding: '6px 14px', borderRadius: '99px',
                    transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                >Show all</button>
            )}
        </div>
    )
}

/** Horizontal shelf — edge padding collapses to 16px on mobile */
function ScrollShelf({ children, isMobile }) {
    const edgePad = isMobile ? '16px' : '32px'
    return (
        <div style={{ position: 'relative' }}>
            <div style={{
                display: 'flex',
                gap: isMobile ? '14px' : '20px',
                overflowX: 'auto',
                padding: `4px ${edgePad} 16px`,
                scrollbarWidth: 'none',
                maskImage: `linear-gradient(to right, transparent 0, black ${edgePad}, black calc(100% - ${edgePad}), transparent 100%)`,
                WebkitMaskImage: `linear-gradient(to right, transparent 0, black ${edgePad}, black calc(100% - ${edgePad}), transparent 100%)`,
            }}>
                {children}
            </div>
        </div>
    )
}

function MoodBubble({ mood, meta, active, onClick, isMobile }) {
    return (
        <button
            onClick={onClick}
            style={{
                flexShrink: 0,
                padding: isMobile ? '8px 16px' : '10px 22px',
                borderRadius: '99px', border: 'none', cursor: 'pointer',
                background: active ? meta.bg : 'rgba(255,255,255,0.06)',
                color: active ? 'white' : 'var(--text-secondary)',
                fontWeight: '700',
                fontSize: isMobile ? '12px' : '13px',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.25s cubic-bezier(.25,.8,.25,1)',
                transform: active ? 'scale(1.04)' : 'scale(1)',
                boxShadow: active ? `0 6px 20px ${meta.color}59` : 'none',
                border: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.04)',
            }}
        >
            <MoodIcon name={meta.icon} color={active ? 'white' : meta.color} size={15} />
            {mood}
        </button>
    )
}

function QuickPickTile({ song, onPlay, isMobile }) {
    const { currentSong, isPlaying } = usePlayer()
    const isActive = currentSong?.id === song.id
    const [hovered, setHovered] = useState(false)
    const thumb = song.thumbnail || `https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`
    const tileHeight = isMobile ? '58px' : '64px'
    const imgSize = isMobile ? '58px' : '64px'

    return (
        <div
            onClick={() => onPlay(song)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                height: tileHeight, position: 'relative',
                transition: 'all 0.25s ease',
                border: isActive ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
            }}
        >
            <img src={thumb} alt={song.title} style={{ width: imgSize, height: imgSize, objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                <p style={{
                    fontWeight: '700',
                    fontSize: isMobile ? '12.5px' : '13.5px',
                    color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    margin: 0,
                }}>{song.title}</p>
                <p style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    margin: '3px 0 0',
                }}>{song.artist}</p>
            </div>
            <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, marginRight: '14px',
                background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: hovered || isActive ? 1 : 0,
                transform: hovered || isActive ? 'scale(1)' : 'scale(0.8)',
                transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
                {isActive && isPlaying ? (
                    <EqualizerBars playing color="var(--accent)" size={11} />
                ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--accent)" style={{ marginLeft: '1.5px' }}><polygon points="5,3 19,12 5,21" /></svg>
                )}
            </div>
        </div>
    )
}

function GenreCard({ genre, meta, active, onClick, isMobile }) {
    return (
        <button
            onClick={onClick}
            style={{
                flexShrink: 0,
                width: isMobile ? '86px' : '104px',
                padding: isMobile ? '14px 10px' : '18px 12px',
                borderRadius: '16px',
                border: active ? `2px solid ${meta.color}` : '1.5px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
                background: active ? `${meta.color}1e` : 'rgba(255,255,255,0.03)',
                color: active ? 'white' : 'var(--text-secondary)',
                fontWeight: '700',
                fontSize: isMobile ? '11px' : '12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                transition: 'all 0.25s ease',
                transform: active ? 'scale(1.05)' : 'scale(1)',
                boxShadow: active ? `0 6px 18px ${meta.color}2b` : 'none',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '34px', color: active ? 'white' : meta.color }}>
                <GenreIcon name={meta.icon} color="currentColor" size={isMobile ? 24 : 28} />
            </div>
            {genre}
        </button>
    )
}



/* ─── Main Page ─────────────────────────────────────────────── */
export default function Discover() {
    const [songs, setSongs] = useState([])
    const [filterMood, setFilterMood] = useState(null)
    const [filterGenre, setFilterGenre] = useState(null)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDboSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [seeding, setSeeding] = useState(false)
    const [seedDone, setSeedDone] = useState(false)
    const { playSong, setQueue } = usePlayer()
    const { user } = useAuth()
    const navigate = useNavigate()
    const isMobile = useMediaQuery('(max-width: 768px)')

    // Responsive padding: 16px on mobile, 32px on desktop
    const pad = isMobile ? '16px' : '32px'

    useEffect(() => { if (!user) navigate('/login') }, [user, navigate])

    useEffect(() => {
        const t = setTimeout(() => setDboSearch(search), 400)
        return () => clearTimeout(t)
    }, [search])

    const seedFromPreferences = useCallback(async () => {
        if (!user?.preferred_artists?.length && !user?.preferred_genres?.length) return
        setSeeding(true)
        const artists = user.preferred_artists?.slice(0, 3) ?? []
        const genres = user.preferred_genres?.slice(0, 2) ?? []
        const queries = [...artists, ...genres.map(g => `best ${g} songs`)].slice(0, 5)
        let apiFailed = false

        for (const q of queries) {
            try {
                const res = await api.get('/search', { params: { term: q } })
                const items = res.data.results || []
                if (!items.length) { apiFailed = true; continue }

                for (const item of items.slice(0, 4)) {
                    const title = item.trackName
                    const artist = item.artistName
                    const thumb = item.artworkUrl100?.replace('100x100bb.jpg', '400x400bb.jpg') || item.artworkUrl100
                    const genre = user.preferred_genres?.[0] ?? null
                    const mood = user.preferred_moods?.[0] ?? null
                    const resolved = await resolvePlaybackSong({ title, artist, trackId: item.trackId, id: item.trackId })
                    if (resolved?.youtube_id) {
                        await api.post('/songs', { title, artist, youtube_id: resolved.youtube_id, thumbnail: thumb, genre, mood }).catch(() => { })
                    }
                }
            } catch (_) { apiFailed = true }
        }

        if (apiFailed) {
            const matchedSongs = FALLBACK_SONGS.filter(s => {
                const artistMatch = user.preferred_artists?.some(a => s.artist.toLowerCase().includes(a.toLowerCase()))
                const genreMatch = user.preferred_genres?.some(g => s.genre === g)
                return artistMatch || genreMatch
            })
            const seedSet = matchedSongs.length > 0 ? matchedSongs : FALLBACK_SONGS.slice(0, 10)
            for (const s of seedSet) {
                try {
                    await api.post('/songs', {
                        title: s.title, artist: s.artist, youtube_id: s.youtube_id,
                        thumbnail: s.thumbnail,
                        genre: s.genre || user.preferred_genres?.[0] || null,
                        mood: s.mood || user.preferred_moods?.[0] || null,
                    })
                } catch (_) { }
            }
        }

        setSeeding(false)
        setSeedDone(true)
    }, [user])

    useEffect(() => {
        const params = {}
        if (filterMood) params.mood = filterMood
        if (filterGenre) params.genre = filterGenre
        if (debouncedSearch) params.search = debouncedSearch

        setLoading(true)
        api.get('/songs', { params }).then(async res => {
            if (res.data.length === 0 && user?.onboarding_done && !seedDone) {
                await seedFromPreferences()
                const seeded = await api.get('/songs', { params })
                setSongs(seeded.data)
                setQueue(seeded.data)
            } else {
                setSongs(res.data)
                setQueue(res.data)
            }
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [filterMood, filterGenre, debouncedSearch, seedDone, seedFromPreferences])

    const handlePlay = useCallback(async (song) => {
        const resolved = await resolvePlaybackSong(song)
        if (resolved.youtube_id) setSongs(prev => prev.map(s => s.id === song.id ? resolved : s))
        playSong(resolved)
        navigate(`/player/${resolved.youtube_id || resolved.id}`)
    }, [playSong, navigate])

    const scoredSongs = useMemo(() =>
        songs.map((s, i) => ({ ...s, _score: scoreSong(s, user, i, songs.length) }))
            .sort((a, b) => b._score - a._score),
        [songs, user]
    )

    const forYou = useMemo(() => scoredSongs.filter(s => s._score > 0).slice(0, 10), [scoredSongs])
    const topArtist = user?.preferred_artists?.[0]
    const becauseYouLike = useMemo(() => {
        if (!topArtist) return []
        return songs.filter(s => s.artist?.toLowerCase().includes(topArtist.toLowerCase())).slice(0, 10)
    }, [songs, topArtist])

    const recentlyAdded = [...songs].slice(0, 10)
    const featured = forYou[0] ?? songs[0]
    const activeFilterMoods = [...new Set(songs.map(s => s.mood).filter(Boolean))]
    const activeFilterGenres = [...new Set(songs.map(s => s.genre).filter(Boolean))]
    const isFiltering = filterMood || filterGenre || debouncedSearch
    const canvasColor = (featured?.mood && MOOD_META[featured.mood]?.color) || '#e74c3c'

    // Card width scales down on mobile
    const cardWidth = isMobile ? 130 : 168

    return (
        <div style={{ padding: '0 0 48px 0' }}>
            <style>{`
                @keyframes eqBounce {
                    0%, 100% { height: 30%; }
                    50%       { height: 100%; }
                }
            `}</style>

            {/* ── Top Header ────────────────────────── */}
            <div style={{
                padding: `${isMobile ? '24px' : '38px'} ${pad} 0`,
                background: `linear-gradient(180deg, ${canvasColor}1a 0%, transparent 100%)`,
                transition: 'background 0.6s ease',
                marginBottom: '32px',
            }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>
                    {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                </p>
                <h1 style={{
                    fontSize: isMobile ? '28px' : '36px',
                    fontWeight: '900', letterSpacing: '-1.2px', marginBottom: '22px',
                    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                }}>
                    Discover
                </h1>

                {/* Search bar */}
                <div style={{ position: 'relative', maxWidth: '460px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"
                        style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                        placeholder="Search your songs or artists..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="app-input"
                        style={{
                            paddingLeft: '44px', borderRadius: '10px', height: '42px',
                            fontSize: '13.5px', background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            width: '100%', boxSizing: 'border-box',
                        }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{
                            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1,
                        }}>✕</button>
                    )}
                </div>
            </div>

            {/* ── Mood Filter Bubbles ───────────────── */}
            {!isFiltering && activeFilterMoods.length > 0 && (
                <div style={{ padding: `0 ${pad}`, marginBottom: '38px' }}>
                    <div style={{ display: 'flex', gap: '9px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                        <MoodBubble
                            mood="All" meta={{ icon: 'music', color: 'var(--accent)', bg: 'var(--accent)' }}
                            active={!filterMood} onClick={() => setFilterMood(null)} isMobile={isMobile}
                        />
                        {activeFilterMoods.map(m => MOOD_META[m] && (
                            <MoodBubble key={m} mood={m} meta={MOOD_META[m]}
                                active={filterMood === m}
                                onClick={() => setFilterMood(filterMood === m ? null : m)}
                                isMobile={isMobile}
                            />
                        ))}
                    </div>
                </div>
            )}

            {loading || seeding ? (
                <div style={{ padding: `0 ${pad}` }}>
                    {seeding && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            padding: '18px 22px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, rgba(231,76,60,0.1), rgba(255,107,107,0.05))',
                            border: '1px solid rgba(231,76,60,0.18)',
                            marginBottom: '28px', animation: 'slideUp 0.3s cubic-bezier(.22,1,.36,1) both',
                        }}>
                            <div style={{
                                width: '42px', height: '42px', borderRadius: '50%',
                                background: 'rgba(231,76,60,0.14)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <Icons.sparkles color="var(--accent)" size={19} />
                            </div>
                            <div>
                                <p style={{ fontWeight: '800', fontSize: '14px', color: 'white', marginBottom: '2px' }}>
                                    Building your personal library
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    Curating songs based on your taste — this only happens once
                                </p>
                            </div>
                        </div>
                    )}
                    <div style={{ borderRadius: '20px', height: '220px', background: 'var(--bg-card)', marginBottom: '36px' }}>
                        <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: '20px' }} />
                    </div>
                    <SkeletonRow isMobile={isMobile} />
                </div>
            ) : songs.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '80px', padding: `0 ${pad}` }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', color: 'var(--accent)' }}>
                        <Icons.library size={56} />
                    </div>
                    <p style={{ fontWeight: '800', fontSize: '18px', marginBottom: '8px' }}>Your library is empty</p>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        Use Search to find and add songs you love
                    </p>
                    <button onClick={() => navigate('/search')} className="app-btn" style={{ marginTop: '24px', padding: '12px 28px' }}>
                        Find Music
                    </button>
                </div>
            ) : isFiltering ? (
                /* ── Filtered View ─────────────────── */
                <div style={{ padding: `0 ${pad}` }}>
                    <SectionHeader
                        title={filterMood ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <MoodIcon name={MOOD_META[filterMood]?.icon} color="var(--accent)" size={19} />
                                {filterMood.charAt(0).toUpperCase() + filterMood.slice(1)} vibes
                            </span>
                        ) : filterGenre ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <GenreIcon name={GENRE_META[filterGenre]?.icon} color="var(--accent)" size={19} />
                                {filterGenre}
                            </span>
                        ) : `Results for "${debouncedSearch}"`}
                        sub={`${songs.length} song${songs.length !== 1 ? 's' : ''}`}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {songs.map((s, i) => <SongRow key={s.id} song={s} onPlay={handlePlay} index={i} />)}
                    </div>
                </div>
            ) : (
                /* ── Full Discover Layout ───────────── */
                <div>
                    {/* Jump Back In */}
                    {recentlyAdded.length >= 4 && (
                        <div style={{ padding: `0 ${pad}`, marginBottom: '40px' }}>
                            <SectionHeader title="Jump Back In" />
                            <div style={{
                                display: 'grid',
                                // On mobile: single column so tiles have breathing room
                                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                                gap: isMobile ? '8px' : '10px',
                            }}>
                                {/* Show fewer rows on mobile to avoid a wall of tiles */}
                                {recentlyAdded.slice(0, isMobile ? 4 : 6).map(s => (
                                    <QuickPickTile key={s.id} song={s} onPlay={handlePlay} isMobile={isMobile} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hero Card */}
                    {featured && (
                        <div style={{ padding: `0 ${pad}`, marginBottom: '44px' }}>
                            <HeroCard song={featured} onPlay={handlePlay} accentColor={canvasColor} isMobile={isMobile} />
                        </div>
                    )}

                    {/* Made For You */}
                    {forYou.length > 0 && (
                        <div style={{ marginBottom: '42px' }}>
                            <div style={{ padding: `0 ${pad}` }}>
                                <SectionHeader
                                    title="Made For You"
                                    sub="Ranked by how closely each track matches your taste"
                                />
                            </div>
                            <ScrollShelf isMobile={isMobile}>
                                {forYou.map((s, i) => <HScrollCard key={s.id} song={s} onPlay={handlePlay} index={i} cardWidth={cardWidth} />)}
                            </ScrollShelf>
                        </div>
                    )}

                    {/* Because you like {artist} */}
                    {becauseYouLike.length > 0 && (
                        <div style={{ marginBottom: '42px' }}>
                            <div style={{ padding: `0 ${pad}` }}>
                                <SectionHeader title={`Because you like ${topArtist}`} />
                            </div>
                            <ScrollShelf isMobile={isMobile}>
                                {becauseYouLike.map((s, i) => <HScrollCard key={s.id} song={s} onPlay={handlePlay} index={i} cardWidth={cardWidth} />)}
                            </ScrollShelf>
                        </div>
                    )}

                    {/* Recently Added */}
                    <div style={{ marginBottom: '42px' }}>
                        <div style={{ padding: `0 ${pad}` }}>
                            <SectionHeader title="Recently Added" sub="Your latest songs" />
                        </div>
                        <ScrollShelf isMobile={isMobile}>
                            {recentlyAdded.map((s, i) => <HScrollCard key={s.id} song={s} onPlay={handlePlay} index={i} cardWidth={cardWidth} />)}
                        </ScrollShelf>
                    </div>

                    {/* Browse by Genre */}
                    {activeFilterGenres.length > 0 && (
                        <div style={{ marginBottom: '42px' }}>
                            <div style={{ padding: `0 ${pad}` }}>
                                <SectionHeader title="Browse by Genre" />
                            </div>
                            <div style={{ display: 'flex', gap: '11px', overflowX: 'auto', padding: `0 ${pad} 8px`, scrollbarWidth: 'none' }}>
                                {activeFilterGenres.map(g => GENRE_META[g] && (
                                    <GenreCard key={g} genre={g} meta={GENRE_META[g]}
                                        active={filterGenre === g}
                                        onClick={() => setFilterGenre(filterGenre === g ? null : g)}
                                        isMobile={isMobile}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Songs list */}
                    <div style={{ padding: `0 ${pad}` }}>
                        <SectionHeader title="All Songs" sub={`${songs.length} track${songs.length !== 1 ? 's' : ''} in your library`} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {songs.map((s, i) => <SongRow key={s.id} song={s} onPlay={handlePlay} index={i} />)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}