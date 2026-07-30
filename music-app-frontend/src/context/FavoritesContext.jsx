import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const FavoritesContext = createContext()

export function FavoritesProvider({ children }) {
    const { token } = useAuth()
    const [favorites, setFavorites] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!token) {
            setFavorites([])
            return
        }

        const fetchFavorites = async () => {
            setLoading(true)
            try {
                const res = await api.get('/favorites')
                setFavorites(res.data)
            } catch (err) {
                console.error('Failed to load favorites', err)
            } finally {
                setLoading(false)
            }
        }

        fetchFavorites()
    }, [token])

    const isFavorite = (youtube_id) => {
        if (!youtube_id) return false
        return favorites.some(song => song.youtube_id === youtube_id)
    }

    const toggleFavorite = async (song) => {
        if (!token) return

        const { youtube_id, title, artist, thumbnail, genre, mood } = song
        if (!youtube_id) return

        const alreadyFavorited = isFavorite(youtube_id)

        // Optimistic update
        const originalFavorites = [...favorites]
        if (alreadyFavorited) {
            setFavorites(prev => prev.filter(s => s.youtube_id !== youtube_id))
        } else {
            setFavorites(prev => [...prev, {
                youtube_id,
                title,
                artist,
                thumbnail,
                genre,
                mood,
                id: Date.now() // temp ID
            }])
        }

        try {
            const res = await api.post('/favorites', {
                youtube_id,
                title,
                artist,
                thumbnail,
                genre,
                mood
            })

            if (res.data.status === 'added') {
                setFavorites(prev => prev.map(s => s.youtube_id === youtube_id ? res.data.song : s))
            } else if (res.data.status === 'removed') {
                setFavorites(prev => prev.filter(s => s.youtube_id !== youtube_id))
            }
        } catch (err) {
            console.error('Failed to toggle favorite', err)
            setFavorites(originalFavorites)
        }
    }

    return (
        <FavoritesContext.Provider value={{ favorites, loading, toggleFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    )
}

export const useFavorites = () => useContext(FavoritesContext)
