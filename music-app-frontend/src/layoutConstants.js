// Single source of truth for the mobile fixed-bar stack.
// Import these anywhere a component needs to know how tall the
// bottom nav / now-playing bar are, instead of re-guessing a
// hardcoded pixel number in each file.

export const BOTTOM_NAV_H = 60          // BottomNav.jsx base height (before safe-area)
export const NOW_PLAYING_MOBILE_H = 76  // NowPlayingBar.jsx mobile bar rendered height

// BottomNav alone, safe-area included — what BottomNav.jsx itself uses.
export const BOTTOM_NAV_CALC = `calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom))`

// BottomNav + NowPlayingBar stacked, safe-area included — used by:
//  - Layout.jsx, to pad scrollable content so the last item isn't hidden
//  - NowPlayingBar.jsx's QueuePanel, to sit above the full stack
export const MOBILE_STACK_CALC = `calc(${BOTTOM_NAV_H}px + ${NOW_PLAYING_MOBILE_H}px + env(safe-area-inset-bottom))`