'use client'

import { useEffect, useState } from 'react'

const PALETTES = [
  { id: 'slate', label: 'Slate' },
  { id: 'paper', label: 'Paper' },
  { id: 'indigo', label: 'Indigo' },
  { id: 'plum', label: 'Plum' },
  { id: 'ink', label: 'Ink' },
  { id: 'teal', label: 'Teal' },
  { id: 'moss', label: 'Moss' },
  { id: 'clay', label: 'Clay' },
] as const

export function PaletteSwitcher() {
  // Mirrors whatever the pre-paint script in layout.tsx already put on <html>.
  const [palette, setPalette] = useState('moss')
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = document.documentElement
    setPalette(root.getAttribute('data-palette') ?? 'moss')
    setMode(root.getAttribute('data-mode') === 'dark' ? 'dark' : 'light')
  }, [])

  function choosePalette(id: string) {
    document.documentElement.setAttribute('data-palette', id)
    try {
      localStorage.setItem('palette', id)
    } catch {}
    setPalette(id)
  }

  function toggleMode() {
    const next = mode === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-mode', next)
    try {
      localStorage.setItem('mode', next)
    } catch {}
    setMode(next)
  }

  return (
    <footer className="colophon">
      <div className="swatches">
        <span>palette</span>
        {PALETTES.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`swatch sw-${p.id}`}
            title={p.label}
            aria-label={`${p.label} palette`}
            aria-pressed={palette === p.id}
            onClick={() => choosePalette(p.id)}
          />
        ))}
      </div>
      <button type="button" className="mode-toggle" aria-pressed={mode === 'dark'} onClick={toggleMode}>
        {mode === 'dark' ? 'light mode' : 'dark mode'}
      </button>
    </footer>
  )
}
