import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'

// Parses standard LRC "[mm:ss.xx]text" lines into { time, text }[]
function parseLRC(lrcText) {
    const lines = lrcText.split('\n')
    const timeTag = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g
    const result = []

    for (const line of lines) {
        const matches = [...line.matchAll(timeTag)]
        if (!matches.length) continue
        const text = line.replace(timeTag, '').trim()
        if (!text) continue
        for (const m of matches) {
            const min = parseInt(m[1], 10)
            const sec = parseInt(m[2], 10)
            const ms = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0
            result.push({ time: min * 60 + sec + ms / 1000, text })
        }
    }
    return result.sort((a, b) => a.time - b.time)
}

/**
 * useLyrics — fetches synced lyrics for the current song.
 * Primary: lrclib.net (synced, timestamped)
 * Fallback: lyrics.ovh (plain text, unsynced — returned as single-block lines
 *           with no timestamps so the UI can render them without highlighting)
 *
 * Returns: { lyrics, isSynced, isLoading, error }
 *   lyrics: [{ time, text }] | null   (time is -1 for unsynced fallback lines)
 */
export function useLyrics(song) {
    const [lyrics, setLyrics] = useState(null)
    const [isSynced, setIsSynced] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const requestIdRef = useRef(0)

    useEffect(() => {
        if (!song?.title || !song?.artist) {
            setLyrics(null)
            return
        }

        const myRequestId = ++requestIdRef.current
        setIsLoading(true)
        setError(null)

        const cleanTitle = song.title.replace(/\(.*?\)|\[.*?\]/g, '').trim()

        async function fetchLyrics() {
            // ── Primary: lrclib.net (via Laravel proxy to avoid CORS/Cloudflare) ──
            try {
                const res = await api.get('/lyrics/get', {
                    params: { track_name: cleanTitle, artist_name: song.artist }
                })
                const data = res.data
                if (myRequestId !== requestIdRef.current) return
                if (data.syncedLyrics) {
                    setLyrics(parseLRC(data.syncedLyrics))
                    setIsSynced(true)
                    setIsLoading(false)
                    return
                }
                if (data.plainLyrics) {
                    setLyrics(
                        data.plainLyrics
                            .split('\n')
                            .filter(l => l.trim())
                            .map(text => ({ time: -1, text }))
                    )
                    setIsSynced(false)
                    setIsLoading(false)
                    return
                }
            } catch {
                // fall through to fallback source
            }

            if (myRequestId !== requestIdRef.current) return

            // ── Fallback: lyrics.ovh (plain, unsynced) ──
            try {
                const res = await fetch(
                    `https://api.lyrics.ovh/v1/${encodeURIComponent(song.artist)}/${encodeURIComponent(cleanTitle)}`
                )
                if (res.ok) {
                    const data = await res.json()
                    if (myRequestId !== requestIdRef.current) return
                    if (data.lyrics) {
                        setLyrics(
                            data.lyrics
                                .split('\n')
                                .filter(l => l.trim())
                                .map(text => ({ time: -1, text }))
                        )
                        setIsSynced(false)
                        setIsLoading(false)
                        return
                    }
                }
                setLyrics(null)
                setIsSynced(false)
            } catch (err) {
                if (myRequestId !== requestIdRef.current) return
                setError(err)
                setLyrics(null)
            } finally {
                if (myRequestId === requestIdRef.current) setIsLoading(false)
            }
        }

        fetchLyrics()
    }, [song?.title, song?.artist])

    return { lyrics, isSynced, isLoading, error }
}