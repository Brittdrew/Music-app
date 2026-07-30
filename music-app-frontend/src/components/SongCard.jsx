import { useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { useNavigate } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'

export default function SongCard({ song, onClick }) {
    const { playSong, currentSong, isPlaying } = usePlayer()
    const { isFavorite, toggleFavorite } = useFavorites()
    const navigate = useNavigate()
    const [hovered, setHovered] = useState(false)

    const isActive = currentSong?.youtube_id === song.youtube_id || currentSong?.id === song.id
    const thumb = song.thumbnail || `https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`

    const handleClick = () => {
        if (onClick) {
            onClick(song)
        } else {
            playSong(song)
            navigate(`/player/${song.youtube_id || song.id}`)
        }
    }

    return (
        <div
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? 'var(--bg-elevated)' : 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                cursor: 'pointer',
                transition: 'background 0.2s ease, transform 0.2s ease',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                animation: 'fadeIn 0.3s ease',
                position: 'relative',
            }}
        >
            {/* Album art */}
            <div style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                aspectRatio: '1 / 1',
                marginBottom: '14px',
                boxShadow: isActive
                    ? `0 8px 32px var(--accent-glow)`
                    : hovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                transition: 'box-shadow 0.3s ease',
            }}>
                <img
                    src={thumb}
                    alt={song.title}
                    style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover', display: 'block',
                        transition: 'transform 0.4s ease',
                        transform: hovered ? 'scale(1.05)' : 'scale(1)',
                    }}
                />

                {/* Hover overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    opacity: hovered ? 1 : 0,
                    transition: 'opacity 0.25s ease',
                }} />

                {/* Play button */}
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    width: '42px', height: '42px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    opacity: hovered || isActive ? 1 : 0,
                    transform: hovered || isActive ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.9)',
                    transition: 'opacity 0.25s ease, transform 0.25s var(--ease-spring)',
                }}>
                    {isActive && isPlaying ? (
                        /* Pause icon */
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                    ) : (
                        /* Play icon */
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"
                            style={{ marginLeft: '2px' }}>
                            <polygon points="5,3 19,12 5,21" />
                        </svg>
                    )}
                </div>

                {/* Heart button */}
                <div 
                    onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(song)
                    }}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        width: '32px', height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: hovered || isFavorite(song?.youtube_id) ? 1 : 0,
                        transform: hovered || isFavorite(song?.youtube_id) ? 'scale(1)' : 'scale(0.8)',
                        transition: 'opacity 0.25s ease, transform 0.25s ease',
                        cursor: 'pointer',
                        color: isFavorite(song?.youtube_id) ? '#e74c3c' : '#fff',
                        zIndex: 10,
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill={isFavorite(song?.youtube_id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                </div>

                {/* Active pulse ring */}
                {isActive && (
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--accent)',
                        animation: 'glow 2s ease-in-out infinite',
                        pointerEvents: 'none',
                    }} />
                )}
            </div>

            {/* Info */}
            <p style={{
                fontWeight: '700', fontSize: '14px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                marginBottom: '4px',
                transition: 'color 0.2s',
            }}>
                {song.title}
            </p>
            <p style={{
                color: 'var(--text-secondary)', fontSize: '12px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
                {song.artist}
            </p>

            {/* Tags */}
            {(song.mood || song.genre) && (
                <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {song.mood && <span className="app-tag app-tag-accent">{song.mood}</span>}
                    {song.genre && <span className="app-tag app-tag-secondary">{song.genre}</span>}
                </div>
            )}
        </div>
    )
}