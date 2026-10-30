'use client'

import { useEffect, useState } from 'react'

type Mode = 'light' | 'dark'

const read = (): Mode => (document.documentElement.getAttribute('data-mode') === 'dark' ? 'dark' : 'light')

/**
 * Light and dark. The first visit follows the system setting (see the pre-paint script in
 * app/layout.tsx); choosing here is remembered.
 */
export function ModeToggle() {
  const [mode, setMode] = useState<Mode>('light')
  useEffect(() => setMode(read()), [])
  const next: Mode = mode === 'dark' ? 'light' : 'dark'
  const toggle = () => {
    const r = document.documentElement
    // a short cross-fade instead of a hard cut
    r.classList.add('v2-retone')
    r.setAttribute('data-mode', next)
    setTimeout(() => r.classList.remove('v2-retone'), 450)
    try {
      localStorage.setItem('v2-mode', next)
    } catch {}
    setMode(next)
  }
  return (
    <button type="button" className="v2-mode" onClick={toggle} aria-label={`Switch to ${next} mode`}>
      <span className="v2-mode-dot" data-mode={mode} aria-hidden="true" />
      {next === 'dark' ? 'Dark' : 'Light'}
    </button>
  )
}
