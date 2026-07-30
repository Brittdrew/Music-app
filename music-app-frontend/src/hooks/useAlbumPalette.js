import { useEffect, useState } from 'react'

// Derive a real color theme from the album art, the same way Spotify/Apple
// Music do it: extract a small palette of named swatches (Vibrant, Muted,
// Dark/Light variants) rather than one flat average, then pick the ones
// that actually work as a background (good saturation, safe contrast).
// Requires: npm install node-vibrant
//
// Shared by Player.jsx and Home.jsx — this used to live only inside
// Player.jsx as a local function. Extracted here so both can reuse the
// same extraction/fallback logic instead of drifting out of sync.
export function useAlbumPalette(src) {
    const [palette, setPalette] = useState(null)

    useEffect(() => {
        if (!src) { setPalette(null); return }
        let cancelled = false

        // v4's root "node-vibrant" export deliberately throws — it exists only
        // to tell you to pick an environment-specific entry point. This was the
        // actual bug causing every extraction to silently fail and fall back
        // to the hardcoded default color, no matter what album art was loaded.
        import('node-vibrant/browser').then(({ Vibrant }) => {
            Vibrant.from(src)
                .quality(4)      // sample every 4th pixel — plenty for a background tint, keeps it fast
                .getPalette()
                .then(swatches => {
                    if (cancelled) return

                    const pick = (...names) => {
                        for (const n of names) if (swatches[n]) return swatches[n]
                        return null
                    }

                    // Primary = the liveliest usable color; Secondary = a darker
                    // partner for the gradient so it reads as a real theme, not
                    // one flat wash. Falling back through muted/dark variants
                    // covers album art that's mostly grayscale or monochrome.
                    const primary = pick('Vibrant', 'LightVibrant', 'Muted', 'LightMuted')
                    const secondary = pick('DarkVibrant', 'DarkMuted', 'Muted', 'Vibrant')

                    if (!primary) { if (!cancelled) setPalette(null); return }

                    setPalette({
                        primaryRgb: primary.rgb,
                        secondaryRgb: (secondary || primary).rgb,
                        // v4 exposes this as a property, not a method
                        textOnPrimary: primary.titleTextColor || '#fff',
                    })
                })
                .catch((err) => {
                    console.warn('Album palette extraction failed (likely a CORS-blocked image host):', err)
                    if (!cancelled) setPalette(null)
                })
        }).catch((err) => {
            console.warn('Failed to load node-vibrant:', err)
            if (!cancelled) setPalette(null)
        })

        return () => { cancelled = true }
    }, [src])

    return palette
}