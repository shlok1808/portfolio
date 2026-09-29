'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'

gsap.registerPlugin(DrawSVGPlugin)

/**
 * A one-image summary that draws itself in when it scrolls into view. Children are SVG; any
 * element with data-at="seconds" joins the timeline:
 *   data-k="draw"  stroke draws on (DrawSVG)     data-k="pop"  scales in
 *   data-k="grow"  grows up from its base         (default)     fades up
 */
export function Figure({
  kicker,
  title,
  caption,
  children,
  viewBox = '0 0 960 414',
}: {
  kicker: string
  title: string
  caption: ReactNode
  children: ReactNode
  viewBox?: string
}) {
  const svg = useRef<SVGSVGElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const el = svg.current
    if (!el) return
    const ctx = gsap.context(() => {
      const t = gsap.timeline({ paused: true, onComplete: () => setDone(true) })
      el.querySelectorAll<SVGElement>('[data-at]').forEach((node) => {
        const at = parseFloat(node.dataset.at ?? '0')
        const k = node.dataset.k
        const d = parseFloat(node.dataset.d ?? '0.9')
        if (k === 'draw') t.fromTo(node, { drawSVG: '0%' }, { drawSVG: '100%', duration: d, ease: 'power2.inOut' }, at)
        else if (k === 'pop')
          t.fromTo(node, { scale: 0, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.2)' }, at)
        else if (k === 'grow')
          t.fromTo(node, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: d, ease: 'power3.out' }, at)
        else t.fromTo(node, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, at)
      })
      tl.current = t
      const io = new IntersectionObserver(
        ([en]) => {
          if (en.isIntersecting) {
            t.play()
            io.disconnect()
          }
        },
        { threshold: 0.3 },
      )
      io.observe(el)
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <figure className="fig">
      <div className="fig-head">
        <span>
          <b>{kicker}</b> · {title}
        </span>
        <button
          type="button"
          className={`fig-replay ${done ? 'on' : ''}`}
          onClick={() => {
            setDone(false)
            tl.current?.restart()
          }}
        >
          ↺ replay
        </button>
      </div>
      <svg ref={svg} className="fg" viewBox={viewBox} role="img" aria-label={title}>
        {children}
      </svg>
      <figcaption className="fig-cap">{caption}</figcaption>
    </figure>
  )
}

/** Panel frame with a numbered title. */
export function Panel({ x, y = 40, w = 300, h = 300, n, title, at = 0 }: { x: number; y?: number; w?: number; h?: number; n: string; title: string; at?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} className="s-faint fill-panel" data-at={at} data-k="fade" />
      <text x={x + 2} y={y - 12} className="t-serif t-title" data-at={at + 0.1}>
        <tspan className="t-acc">{n}</tspan> {title}
      </text>
    </g>
  )
}

export function Chevron({ x, y, at = 0 }: { x: number; y: number; at?: number }) {
  return <path d={`M${x - 5} ${y - 9} L${x + 5} ${y} L${x - 5} ${y + 9}`} className="s-dim" strokeWidth={2} data-at={at} data-k="draw" data-d="0.4" />
}

/** A row of number chips along the bottom. Widths are estimated from the mono font. */
export function Chips({ y, items, at = 0 }: { y: number; items: string[]; at?: number }) {
  const widths = items.map((s) => s.length * 6.9 + 26)
  const total = widths.reduce((a, b) => a + b, 0) + (items.length - 1) * 10
  let x = (960 - total) / 2
  return (
    <g>
      {items.map((s, i) => {
        const w = widths[i]
        const g = (
          <g key={s} data-at={at + i * 0.15} data-k="fade">
            <rect x={x} y={y} width={w} height={30} rx={15} className="s-faint fill-chip" />
            <text x={x + w / 2} y={y + 19.5} textAnchor="middle" className="t-chip">
              {s}
            </text>
          </g>
        )
        x += w + 10
        return g
      })}
    </g>
  )
}
