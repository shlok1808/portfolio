/**
 * Bridge between the site's palette tokens (8 palettes × light/dark on <html>) and canvas code.
 * Backgrounds read colours from here and re-read them when the palette switcher changes.
 */

export type RGB = [number, number, number]

export interface Theme {
  mode: 'light' | 'dark'
  palette: string
  ground: RGB
  ink: RGB
  muted: RGB
  accent: RGB
  accentStrong: RGB
  rule: RGB
}

export function parseColor(input: string): RGB {
  const s = input.trim()
  if (s.startsWith('#')) {
    let h = s.slice(1)
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    const n = parseInt(h.slice(0, 6), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (m) {
    const [r, g, b] = m[1].split(/[ ,/]+/).map(Number)
    return [r, g, b]
  }
  return [128, 128, 128]
}

export function readTheme(): Theme {
  const root = document.documentElement
  const cs = getComputedStyle(root)
  const v = (name: string, fallback: string) => parseColor(cs.getPropertyValue(name) || fallback)
  return {
    mode: root.getAttribute('data-mode') === 'light' ? 'light' : 'dark',
    palette: root.getAttribute('data-palette') ?? 'moss',
    ground: v('--ground', '#13110f'),
    ink: v('--ink', '#e2e7e2'),
    muted: v('--muted', '#879088'),
    accent: v('--accent', '#8fbfa3'),
    accentStrong: v('--accent-strong', '#aed6be'),
    rule: v('--rule', '#242a26'),
  }
}

/** Calls cb whenever the palette or mode on <html> changes. Returns an unsubscribe. */
export function onThemeChange(cb: (t: Theme) => void): () => void {
  const mo = new MutationObserver(() => cb(readTheme()))
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode', 'data-palette'] })
  return () => mo.disconnect()
}

export const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`
export const mix = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]

/** Resolve a CSS font-family list for canvas from a CSS variable (next/font sets these). */
export function fontFamily(el: Element, cssVar: string, fallback: string) {
  const v = getComputedStyle(el).getPropertyValue(cssVar).trim()
  return v ? `${v}, ${fallback}` : fallback
}

export function serifFamily() {
  return getComputedStyle(document.body).fontFamily || 'Georgia, serif'
}
