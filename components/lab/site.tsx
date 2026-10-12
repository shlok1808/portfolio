'use client'

import { useEffect, useState } from 'react'
import { BackgroundStage } from './background-stage'
import { LabColophon, BACKGROUNDS } from './lab-colophon'
import { bySlug } from './registry'

/**
 * The homepage's background, switchable by visitors from the footer (like the palettes).
 * The choice lives on <html data-bg> (set before paint by the script in app/layout.tsx) and
 * in localStorage under "bg". Default: the logit lens.
 */
const KEY = 'bg'
const EVT = 'site-bg'
const DEFAULT = 'logit-lens'
const valid = (v: string | null): v is string => !!v && BACKGROUNDS.some((b) => b.id === v)

function currentBg() {
  const r = document.documentElement
  let v = r.getAttribute('data-bg')
  if (!valid(v)) {
    try {
      v = localStorage.getItem(KEY)
    } catch {}
    v = valid(v) ? v : DEFAULT
    r.setAttribute('data-bg', v) // arrived by client-side navigation: set it now
  }
  return v
}

export function setSiteBg(id: string) {
  document.documentElement.setAttribute('data-bg', id)
  try {
    localStorage.setItem(KEY, id)
  } catch {}
  window.dispatchEvent(new CustomEvent(EVT))
}

export function useSiteBg() {
  const [bg, setBg] = useState<string | null>(null)
  useEffect(() => {
    setBg(currentBg())
    const on = () => setBg(currentBg())
    window.addEventListener(EVT, on)
    return () => window.removeEventListener(EVT, on)
  }, [])
  return bg
}

export function SiteBackground() {
  const bg = useSiteBg()
  const [still, setStill] = useState(false)
  useEffect(() => setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches), [])
  if (!bg || bg === 'none') return null
  const opt = bySlug(bg)
  return opt ? <BackgroundStage key={bg} opt={opt} still={still} /> : null
}

export function SiteColophon() {
  const bg = useSiteBg()
  return <LabColophon bg={bg ?? DEFAULT} onBg={setSiteBg} />
}
