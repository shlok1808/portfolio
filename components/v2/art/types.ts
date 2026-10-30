/**
 * Contract for the v2 background art: a vanilla module that draws into a fixed, full-viewport
 * host behind the page and never takes pointer events from it. Colours come from the site's
 * tokens on <html> via readTheme() / onThemeChange() in components/lab/lib/theme.ts.
 */

/** The reading column in viewport px. The art should stay quiet behind it. */
export interface Lane {
  left: number
  right: number
}

export interface ArtController {
  destroy(): void
  /** reduced motion or hidden tab: hold the current frame */
  setPaused(p: boolean): void
  setLane(lane: Lane): void
}

export type ArtMount = (host: HTMLElement) => ArtController
