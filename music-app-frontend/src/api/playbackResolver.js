import api from './axios'
import { FALLBACK_SONGS } from './fallbackSongs'

const normalize = (value) => {
    if (!value) return ''
    return value.toString().trim().toLowerCase().replace(/\s+/g, ' ')
}

export const findFallbackSong = (title, artist) => {
    const targetTitle = normalize(title)
    const targetArtist = normalize(artist)
    return FALLBACK_SONGS.find(s => normalize(s.title) === targetTitle && normalize(s.artist) === targetArtist)
}

export async function resolvePlaybackSong(song) {
    if (song.youtube_id) return song

    const fallback = findFallbackSong(song.title, song.artist)
    if (fallback) {
        return { ...song, youtube_id: fallback.youtube_id }
    }

    try {
        const res = await api.get('/playback/resolve', {
            params: {
                title: song.title,
                artist: song.artist,
                itunes_track_id: song.trackId || song.id,
            }
        })

        if (res.data?.youtube_video_id) {
            return { ...song, youtube_id: res.data.youtube_video_id }
        }

        if (res.data?.message) {
            return { ...song, playbackMessage: res.data.message }
        }
    } catch (_) {
        // Ignore, fallback at caller level if needed
    }

    return song
}
