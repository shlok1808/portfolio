'use client'

import { useEffect, useState } from 'react'

const PALETTES = ['slate', 'paper', 'indigo', 'plum', 'ink', 'teal', 'moss', 'clay'] as const

export const BACKGROUNDS = [
  { id: 'constellation', label: 'constellation' },
  { id: 'logit-lens', label: 'logit lens' },
  { id: 'activations', label: 'activations' },
  { id: 'none', label: 'horizon' },
] as const

/**
 * The site's footer (palette dots + light/dark), plus a background switcher, which is how the
 * finished site would let you (and visitors) change backgrounds any time. Remembered per visitor.
 */
export function LabColophon({ bg, onBg }: { bg: string; onBg: (id: string) => void }) {
  const [palette, setPalette] = useState('moss')
  const [mode, setMode] = useState<'light' | 'dark'>('dark')
  useEffect(() => {
    const r = document.documentElement
    setPalette(r.getAttribute('data-palette') ?? 'moss')
    setMode(r.getAttribute('data-mode') === 'light' ? 'light' : 'dark')
  }, [])
  const choosePalette = (id: string) => {
    document.documentElement.setAttribute('data-palette', id)
    try {
      localStorage.setItem('palette', id)
    } catch {}
    setPalette(id)
  }
  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-mode', next)
    try {
      localStorage.setItem('mode', next)
    } catch {}
    setMode(next)
  }
  return (
    <footer className="colophon colophon--lab">
      <div className="swatches">
        <span>palette</span>
        {PALETTES.map((p) => (
          <button
            key={p}
            type="button"
            className={`swatch sw-${p}`}
            title={p}
            aria-label={`${p} palette`}
            aria-pressed={palette === p}
            onClick={() => choosePalette(p)}
          />
        ))}
      </div>
      <div className="bg-switch" role="group" aria-label="Background">
        <span>background</span>
        {BACKGROUNDS.map((b, i) => (
          <span key={b.id} className="bg-switch-item">
            {i > 0 && <span className="sep">·</span>}
            <button type="button" className={`bg-opt ${bg === b.id ? 'on' : ''}`} aria-pressed={bg === b.id} onClick={() => onBg(b.id)}>
              {b.label}
            </button>
          </span>
        ))}
      </div>
      <button type="button" className="mode-toggle" aria-pressed={mode === 'dark'} onClick={toggleMode}>
        {mode === 'dark' ? 'light mode' : 'dark mode'}
      </button>
    </footer>
  )
}
