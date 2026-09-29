'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Sky } from '@/components/sky'
import { PortfolioBody } from '../portfolio-body'
import { captionAt, duration, renderAt, type Episode, type Fonts } from '../episodes/engine'
import { readFonts } from '../episodes/player'
import { STEER } from '../episodes/steer'
import { AUDIT } from '../episodes/audit'
import { KYC } from '../episodes/kyc'

const CHANNELS: { ep: Episode; name: string; venue: string }[] = [
  { ep: STEER, name: 'Look Before You Steer', venue: 'ICML 2026 MI Workshop · COLM 2026' },
  { ep: AUDIT, name: 'The Probe That Read the Labels', venue: 'ConfAIde · under review' },
  { ep: KYC, name: 'Does the Advisor Know?', venue: 'Mechanistic KYC · ongoing' },
]

/**
 * 22 · Channel Shlok — a CRT television that plays the three episodes. It powers on when it
 * scrolls into view (the classic line-expand), switches channels through static, shows closed
 * captions on screen, and takes 1/2/3, ↑/↓ and space from the keyboard.
 */
function Television({ channel, setChannel }: { channel: number; setChannel: (c: number) => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const noise = useRef<HTMLCanvasElement | null>(null)
  const [on, setOn] = useState(false)
  const [cc, setCc] = useState({ html: '', key: '' })
  const [osd, setOsd] = useState(0)
  const [paused, setPaused] = useState(false)
  const st = useRef({ T: 0, last: 0, raf: 0, fonts: null as Fonts | null, staticUntil: 0, ch: channel, paused: false })

  const drawStatic = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (!noise.current) {
      noise.current = document.createElement('canvas')
      noise.current.width = 160
      noise.current.height = 100
    }
    const n = noise.current
    const nctx = n.getContext('2d')!
    const img = nctx.createImageData(160, 100)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    nctx.putImageData(img, 0, 0)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(n, 0, 0, w, h)
    ctx.imageSmoothingEnabled = true
    const y = ((performance.now() / 3) % (h + 80)) - 40
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.fillRect(0, y, w, 26)
  }

  const frame = useCallback((now: number) => {
    const s = st.current
    const c = canvas.current
    if (!c || !s.fonts) {
      s.raf = requestAnimationFrame(frame)
      return
    }
    const ctx = c.getContext('2d')!
    const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 0
    s.last = now
    const ep = CHANNELS[s.ch].ep
    if (now < s.staticUntil) {
      drawStatic(ctx, c.width, c.height)
    } else {
      if (!s.paused) s.T += dt
      if (s.T >= duration(ep)) {
        // auto-advance to the next channel
        const next = (s.ch + 1) % CHANNELS.length
        setChannel(next)
        s.T = 0
      }
      renderAt(ctx, ep, s.T, c.width, c.height, s.fonts)
      const cap = captionAt(ep, s.T)
      setCc((o) => (o.key === `${s.ch}:${cap.key}` ? o : { html: cap.html, key: `${s.ch}:${cap.key}` }))
    }
    s.raf = requestAnimationFrame(frame)
  }, [setChannel])

  // channel changes: static burst + on-screen display
  useEffect(() => {
    const s = st.current
    if (s.ch !== channel) {
      s.ch = channel
      s.T = 0
      s.staticUntil = performance.now() + 520
      setCc({ html: '', key: '' })
    }
    setOsd((k) => k + 1)
  }, [channel])

  // power on when it scrolls into view
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(
      ([en]) => {
        if (en.intersectionRatio > 0.45 && !on) {
          setOn(true)
          st.current.staticUntil = performance.now() + 900
        }
      },
      { threshold: [0, 0.45, 0.8] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [on])

  useEffect(() => {
    if (!on) return
    const c = canvas.current
    if (!c || !wrap.current) return
    st.current.fonts = readFonts(wrap.current)
    document.fonts?.ready.then(() => wrap.current && (st.current.fonts = readFonts(wrap.current)))
    const ro = new ResizeObserver(() => {
      const r = c.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      c.width = Math.round(r.width * dpr)
      c.height = Math.round(r.height * dpr)
    })
    ro.observe(c)
    st.current.raf = requestAnimationFrame(frame)
    const s = st.current
    return () => {
      ro.disconnect()
      cancelAnimationFrame(s.raf)
    }
  }, [on, frame])

  useEffect(() => {
    st.current.paused = paused
  }, [paused])

  const osdVisible = osd > 0
  return (
    <div
      className={`tv-wrap ${on ? 'is-on' : ''}`}
      ref={wrap}
      tabIndex={0}
      data-keys
      onKeyDown={(e) => {
        if (['1', '2', '3'].includes(e.key)) setChannel(Number(e.key) - 1)
        else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setChannel((channel + 1) % 3)
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          setChannel((channel + 2) % 3)
        } else if (e.key === ' ') {
          e.preventDefault()
          setPaused((p) => !p)
        }
      }}
      aria-label="Channel Shlok. Keys 1 to 3 change channel, space pauses."
    >
      <svg className="tv-antenna" viewBox="0 0 300 120" aria-hidden="true">
        <path d="M150 118 L78 12" />
        <path d="M150 118 L226 18" />
        <circle cx="78" cy="12" r="6" />
        <circle cx="226" cy="18" r="6" />
        <ellipse cx="150" cy="116" rx="34" ry="10" />
      </svg>
      <div className="tv">
        <div className="tv-screen" onClick={() => setPaused((p) => !p)}>
          <canvas ref={canvas} className="tv-canvas" />
          <div className="tv-cc" key={cc.key} dangerouslySetInnerHTML={{ __html: cc.html }} hidden={!cc.html} />
          {osdVisible && (
            <div className="tv-osd" key={osd}>
              CH {channel + 1}
              <span>{CHANNELS[channel].name}</span>
            </div>
          )}
          {paused && <div className="tv-paused">❚❚ PAUSE</div>}
          <div className="tv-scan" />
          <div className="tv-glass" />
          <div className="tv-power" />
        </div>
        <div className="tv-panel">
          <div className="tv-brand">
            SHLOK<span>·VISION</span>
          </div>
          <button
            type="button"
            className="tv-knob"
            style={{ transform: `rotate(${channel * 50 - 50}deg)` }}
            onClick={() => setChannel((channel + 1) % 3)}
            aria-label="Change channel"
          >
            <i />
          </button>
          <div className="tv-dial">
            {CHANNELS.map((c, i) => (
              <button type="button" key={i} className={i === channel ? 'on' : ''} onClick={() => setChannel(i)}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="tv-grille">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <div className={`tv-lamp ${on ? 'on' : ''}`}>
            <i /> ON AIR
          </div>
        </div>
      </div>
      <div className="tv-feet">
        <i />
        <i />
      </div>
    </div>
  )
}

export function ChannelShlok() {
  const [channel, setChannel] = useState(0)
  const watch = (i: number) => {
    setChannel(i)
    document.querySelector('.tv-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  return (
    <div className="sky-photo cs-page">
      <Sky />
      <PortfolioBody
        research={
          <>
            <p className="cs-now">
              Now showing on <b>Channel Shlok</b>: a Saturday-morning show about my research, with all the real
              technical terms. Change channels with the dial, or press 1, 2 or 3.
            </p>
            <div className="explainer-slot cs-slot">
              <Television channel={channel} setChannel={setChannel} />
            </div>
            <div className="cs-guide">
              <p className="cs-guide-k">tv guide</p>
              {CHANNELS.map((c, i) => (
                <button type="button" key={i} className={`cs-row ${channel === i ? 'on' : ''}`} onClick={() => watch(i)}>
                  <span className="cs-ch">CH {i + 1}</span>
                  <span className="cs-t">{c.name}</span>
                  <span className="cs-v">{c.venue}</span>
                  <span className="cs-play">{channel === i ? 'on now' : '▶ watch'}</span>
                </button>
              ))}
              <p className="cs-links">
                <a href="https://openreview.net/pdf?id=UIaLI9XPpq" target="_blank" rel="noopener noreferrer">
                  read Look Before You Steer
                </a>
              </p>
            </div>
          </>
        }
      />
    </div>
  )
}
