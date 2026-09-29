'use client'

import { useEffect, useRef, useState } from 'react'
import { Sky } from '@/components/sky'
import { PortfolioBody } from '../portfolio-body'
import { captionAt, duration, renderAt, type Episode, type Fonts } from '../episodes/engine'
import { readFonts } from '../episodes/player'
import { STEER } from '../episodes/steer'
import { AUDIT } from '../episodes/audit'
import { KYC } from '../episodes/kyc'

/** An episode scrubbed by scroll: the stage sticks while you scroll through its story. */
function ScrollEpisode({ ep, title, venue }: { ep: Episode; title: string; venue: string }) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const fonts = useRef<Fonts | null>(null)
  const [cap, setCap] = useState('')
  useEffect(() => {
    const c = canvas.current
    const b = box.current
    if (!c || !b) return
    fonts.current = readFonts(b)
    document.fonts?.ready.then(() => (fonts.current = readFonts(b)))
    const D = duration(ep)
    let raf = 0
    const draw = () => {
      raf = 0
      const r = b.getBoundingClientRect()
      const span = r.height - window.innerHeight
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, span)))
      const T = p * (D - 0.05)
      const cr = c.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (c.width !== Math.round(cr.width * dpr)) {
        c.width = Math.round(cr.width * dpr)
        c.height = Math.round(cr.height * dpr)
      }
      if (fonts.current) renderAt(c.getContext('2d')!, ep, T, c.width, c.height, fonts.current)
      setCap(captionAt(ep, T).html)
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(draw)
    }
    draw()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      cancelAnimationFrame(raf)
    }
  }, [ep])
  return (
    <div className="fp-ep" ref={box} style={{ height: `${Math.round(duration(ep) * 9)}vh` }}>
      <div className="fp-sticky">
        <div className="fp-meta">
          <h3>{title}</h3>
          <p>{venue} · scroll to play</p>
        </div>
        <canvas ref={canvas} className="fp-canvas" />
        <p className="fp-cap" dangerouslySetInnerHTML={{ __html: cap || '&nbsp;' }} />
      </div>
    </div>
  )
}

/** The left rail: the page is one forward pass, and you are the token. */
function Rail() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const on = () => setP(window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight))
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const stops = [
    ['embed', 0],
    ['L8 · about', 0.12],
    ['L20 · research', 0.3],
    ['L41 · unembed', 0.97],
  ] as const
  return (
    <div className="fp-rail" aria-hidden="true">
      <div className="fp-line" />
      <div className="fp-fill" style={{ transform: `scaleY(${p})` }} />
      {stops.map(([l, at]) => (
        <span key={l} className={`fp-stop ${p >= at ? 'on' : ''}`} style={{ top: `${at * 100}%` }}>
          {l}
        </span>
      ))}
      <i className="fp-token" style={{ top: `${p * 100}%` }}>
        <b>L{Math.round(p * 41)}</b>
      </i>
    </div>
  )
}

export function ForwardPass() {
  return (
    <div className="sky-photo fp-page">
      <Sky />
      <Rail />
      <PortfolioBody
        research={
          <div className="fp-list">
            <p className="fp-intro">Each paper plays as you scroll through it.</p>
            <ScrollEpisode ep={STEER} title="Look Before You Steer" venue="ICML 2026 MI Workshop · COLM 2026" />
            <ScrollEpisode ep={AUDIT} title="Auditing Behavioral Probes for Contextual Privacy" venue="ConfAIde · under review" />
            <ScrollEpisode ep={KYC} title="Interpretability for AI Financial Advisors" venue="Mechanistic KYC · ongoing" />
          </div>
        }
      />
    </div>
  )
}
