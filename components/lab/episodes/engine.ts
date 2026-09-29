/**
 * Episode engine: every frame is a pure function of time, so episodes can be played, paused,
 * scrubbed, driven by scroll (concept 21) or shown on a TV (concept 22) with the same code.
 * Scenes draw in a fixed 1600×900 virtual stage.
 */

export const VW = 1600
export const VH = 900

export interface Fonts {
  serif: string
  mono: string
}

export interface Env {
  ctx: CanvasRenderingContext2D
  /** seconds into this scene */
  t: number
  /** scene duration */
  d: number
  /** seconds into the episode */
  T: number
  f: Fonts
}

export interface Scene {
  id: string
  title: string
  dur: number
  draw(e: Env): void
  /** [seconds into scene, caption html] */
  captions: [number, string][]
}

export interface Episode {
  slug: string
  number: number
  title: string
  subtitle: string
  scenes: Scene[]
  link?: { href: string; label: string }
  poster: number
}

export const SHOW = 'Activation Station'

export function duration(ep: Episode) {
  return ep.scenes.reduce((s, sc) => s + sc.dur, 0)
}

export function locate(ep: Episode, T: number) {
  let acc = 0
  for (let i = 0; i < ep.scenes.length; i++) {
    const sc = ep.scenes[i]
    if (T < acc + sc.dur || i === ep.scenes.length - 1) return { i, sc, t: Math.max(0, Math.min(sc.dur, T - acc)), start: acc }
    acc += sc.dur
  }
  return { i: 0, sc: ep.scenes[0], t: 0, start: 0 }
}

export function captionAt(ep: Episode, T: number) {
  const { sc, t, i } = locate(ep, T)
  let cap = ''
  let k = -1
  sc.captions.forEach(([at, html], j) => {
    if (t >= at) {
      cap = html
      k = j
    }
  })
  return { html: cap, key: `${i}:${k}` }
}

/** Renders the episode at time T into a canvas whose backing store is already sized. */
export function renderAt(ctx: CanvasRenderingContext2D, ep: Episode, T: number, pxW: number, pxH: number, f: Fonts) {
  const s = Math.min(pxW / VW, pxH / VH)
  const ox = (pxW - VW * s) / 2
  const oy = (pxH - VH * s) / 2
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, pxW, pxH)
  ctx.setTransform(s, 0, 0, s, ox, oy)
  const { sc, t } = locate(ep, T)
  backdrop(ctx, T)
  ctx.save()
  const fade = Math.min(1, t / 0.35, (sc.dur - t) / 0.35)
  ctx.globalAlpha = Math.max(0, Math.min(1, fade))
  sc.draw({ ctx, t, d: sc.dur, T, f })
  ctx.restore()
  vignette(ctx)
}

// ── palette ─────────────────────────────────────────────────────────────────
export const C = {
  bg: '#0f0e0d',
  ink: '#ece7df',
  dim: 'rgba(236,231,223,0.58)',
  faint: 'rgba(236,231,223,0.16)',
  ghost: 'rgba(236,231,223,0.07)',
  gold: '#f4c79a',
  blue: '#74a9ff',
  red: '#ff7b5e',
  green: '#8fd6a8',
  violet: '#b9a0ff',
  yellow: '#ffd36e',
  pink: '#ff9fb0',
}

// ── easing & timing ─────────────────────────────────────────────────────────
export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const ease = {
  linear: (x: number) => x,
  out: (x: number) => 1 - Math.pow(1 - x, 3),
  in: (x: number) => x * x * x,
  inOut: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  back: (x: number) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
  },
  elastic: (x: number) =>
    x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
}
/** progress of t through [a, b], eased */
export const at = (t: number, a: number, b: number, fn: (x: number) => number = ease.inOut) => fn(clamp((t - a) / (b - a)))
/** appear/disappear envelope: 0 → 1 over [a, a+fi], 1 → 0 over [b−fo, b] */
export const env = (t: number, a: number, b: number, fi = 0.4, fo = 0.4) =>
  Math.min(clamp((t - a) / fi), clamp((b - t) / fo))

// ── deterministic noise ─────────────────────────────────────────────────────
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── backdrop ────────────────────────────────────────────────────────────────
const STARS = (() => {
  const r = rng(7)
  return Array.from({ length: 140 }, () => ({ x: r() * VW, y: r() * VH, s: 0.6 + r() * 1.6, p: r() * 6.28, v: 2 + r() * 6 }))
})()

function backdrop(ctx: CanvasRenderingContext2D, T: number) {
  const g = ctx.createRadialGradient(VW * 0.5, VH * 1.15, 50, VW * 0.5, VH * 0.6, VW * 0.8)
  g.addColorStop(0, 'rgba(244,199,154,0.07)')
  g.addColorStop(1, 'rgba(244,199,154,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, VW, VH)
  for (const s of STARS) {
    const a = 0.12 + 0.12 * Math.sin(T * 0.8 + s.p)
    ctx.fillStyle = `rgba(236,231,223,${a})`
    const x = (s.x + T * s.v) % VW
    ctx.fillRect(x, s.y, s.s, s.s)
  }
}

function vignette(ctx: CanvasRenderingContext2D) {
  const g = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.45, VW / 2, VH / 2, VW * 0.72)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, VW, VH)
}

// ── text ────────────────────────────────────────────────────────────────────
export interface TextOpts {
  size?: number
  font?: 'serif' | 'mono'
  color?: string
  align?: CanvasTextAlign
  weight?: number | string
  italic?: boolean
  alpha?: number
  base?: CanvasTextBaseline
  spacing?: number
}

export function text(e: Env, str: string, x: number, y: number, o: TextOpts = {}) {
  const { ctx } = e
  const size = o.size ?? 32
  const fam = o.font === 'mono' ? e.f.mono : e.f.serif
  ctx.save()
  ctx.globalAlpha *= o.alpha ?? 1
  ctx.font = `${o.italic ? 'italic ' : ''}${o.weight ?? 400} ${size}px ${fam}`
  ctx.fillStyle = o.color ?? C.ink
  ctx.textAlign = o.align ?? 'left'
  ctx.textBaseline = o.base ?? 'alphabetic'
  if (o.spacing) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${o.spacing}px`
  ctx.fillText(str, x, y)
  ctx.restore()
}

/**
 * Math-ish text: `v_f`, `α^*`, `W_{dec}`, `10^{-6}` become sub/superscripts.
 * Returns the drawn width.
 */
export function math(e: Env, str: string, x: number, y: number, o: TextOpts = {}) {
  const { ctx } = e
  const size = o.size ?? 32
  const fam = o.font === 'serif' ? e.f.serif : e.f.mono
  const runs: { s: string; k: 'n' | 'sub' | 'sup' }[] = []
  const re = /(_\{[^}]+\}|_[A-Za-z0-9]|\^\{[^}]+\}|\^[^\s{])/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(str))) {
    if (m.index > last) runs.push({ s: str.slice(last, m.index), k: 'n' })
    const tok = m[0]
    const body = tok[1] === '{' ? tok.slice(2, -1) : tok.slice(1)
    runs.push({ s: body, k: tok[0] === '_' ? 'sub' : 'sup' })
    last = m.index + tok.length
  }
  if (last < str.length) runs.push({ s: str.slice(last), k: 'n' })
  ctx.save()
  ctx.globalAlpha *= o.alpha ?? 1
  ctx.fillStyle = o.color ?? C.ink
  ctx.textBaseline = 'alphabetic'
  const setFont = (k: string) => {
    const sz = k === 'n' ? size : size * 0.66
    ctx.font = `${o.italic ? 'italic ' : ''}${o.weight ?? 400} ${sz}px ${fam}`
  }
  let total = 0
  for (const r of runs) {
    setFont(r.k)
    total += ctx.measureText(r.s).width
  }
  let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x
  ctx.textAlign = 'left'
  for (const r of runs) {
    setFont(r.k)
    const dy = r.k === 'sub' ? size * 0.26 : r.k === 'sup' ? -size * 0.4 : 0
    ctx.fillText(r.s, cx, y + dy)
    cx += ctx.measureText(r.s).width
  }
  ctx.restore()
  return total
}

// ── shapes ──────────────────────────────────────────────────────────────────
export function line(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, w = 2, p = 1) {
  if (p <= 0) return
  ctx.strokeStyle = color
  ctx.lineWidth = w
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(lerp(x0, x1, p), lerp(y0, y1, p))
  ctx.stroke()
}

export function arrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  w = 3,
  p = 1,
  head = 14,
) {
  if (p <= 0.001) return
  const x = lerp(x0, x1, p)
  const y = lerp(y0, y1, p)
  const a = Math.atan2(y - y0, x - x0)
  const len = Math.hypot(x - x0, y - y0)
  const hd = Math.min(head, len * 0.6)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = w
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x - Math.cos(a) * hd * 0.6, y - Math.sin(a) * hd * 0.6)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - hd * Math.cos(a - 0.42), y - hd * Math.sin(a - 0.42))
  ctx.lineTo(x - hd * Math.cos(a + 0.42), y - hd * Math.sin(a + 0.42))
  ctx.closePath()
  ctx.fill()
}

export function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

export function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, o: { fill?: string; stroke?: string; r?: number; lw?: number } = {}) {
  rrect(ctx, x, y, w, h, o.r ?? 18)
  ctx.fillStyle = o.fill ?? 'rgba(236,231,223,0.04)'
  ctx.fill()
  ctx.strokeStyle = o.stroke ?? 'rgba(236,231,223,0.14)'
  ctx.lineWidth = o.lw ?? 1.5
  ctx.stroke()
}

export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.save()
  ctx.globalAlpha *= a
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
  ctx.restore()
}

/** Speech bubble with a tail. Text is drawn by the caller or passed in. */
export function bubble(
  e: Env,
  x: number,
  y: number,
  w: number,
  h: number,
  str: string,
  o: { tail?: 'left' | 'right' | 'down' | 'up'; color?: string; ink?: string; size?: number; font?: 'serif' | 'mono'; italic?: boolean; alpha?: number } = {},
) {
  const { ctx } = e
  ctx.save()
  ctx.globalAlpha *= o.alpha ?? 1
  const fill = o.color ?? 'rgba(236,231,223,0.94)'
  ctx.fillStyle = fill
  rrect(ctx, x, y, w, h, 22)
  ctx.fill()
  ctx.beginPath()
  const t = o.tail ?? 'left'
  if (t === 'left') {
    ctx.moveTo(x + 10, y + h * 0.55)
    ctx.lineTo(x - 22, y + h * 0.78)
    ctx.lineTo(x + 18, y + h * 0.8)
  } else if (t === 'right') {
    ctx.moveTo(x + w - 10, y + h * 0.55)
    ctx.lineTo(x + w + 22, y + h * 0.78)
    ctx.lineTo(x + w - 18, y + h * 0.8)
  } else if (t === 'down') {
    ctx.moveTo(x + w * 0.3, y + h - 4)
    ctx.lineTo(x + w * 0.24, y + h + 24)
    ctx.lineTo(x + w * 0.42, y + h - 4)
  } else {
    ctx.moveTo(x + w * 0.3, y + 4)
    ctx.lineTo(x + w * 0.24, y - 24)
    ctx.lineTo(x + w * 0.42, y + 4)
  }
  ctx.fill()
  ctx.restore()
  text(e, str, x + w / 2, y + h / 2 + (o.size ?? 28) * 0.34, {
    size: o.size ?? 28,
    align: 'center',
    color: o.ink ?? '#1b1916',
    font: o.font ?? 'serif',
    italic: o.italic,
    alpha: o.alpha,
  })
}

/** A little stamp that thumps onto the stage (scale overshoot + slight rotation). */
export function stamp(e: Env, str: string, x: number, y: number, p: number, color: string, o: { size?: number; rot?: number } = {}) {
  if (p <= 0) return
  const { ctx } = e
  const s = 0.6 + 0.4 * ease.back(clamp(p))
  const size = o.size ?? 30
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(o.rot ?? -0.06)
  ctx.scale(s, s)
  ctx.globalAlpha *= clamp(p * 2)
  ctx.font = `600 ${size}px ${e.f.mono}`
  const w = ctx.measureText(str).width + size * 1.1
  const h = size * 1.7
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  rrect(ctx, -w / 2, -h / 2, w, h, 10)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(str, 0, 2)
  ctx.restore()
}

// ── characters ──────────────────────────────────────────────────────────────
export type Mood = 'neutral' | 'happy' | 'surprised' | 'worried' | 'determined' | 'smug'

export interface BuddyOpts {
  look?: [number, number]
  mood?: Mood
  seed?: number
  squash?: number
  alpha?: number
  label?: string
  labelColor?: string
  eyes?: boolean
  sweat?: number
}

/**
 * A feature, as a character: a glowing round body with eyes that track a point and blink on
 * their own clock. Mood changes the mouth and brows.
 */
export function buddy(e: Env, x: number, y: number, r: number, color: string, o: BuddyOpts = {}) {
  const { ctx, T } = e
  const seed = o.seed ?? 1
  ctx.save()
  ctx.globalAlpha *= o.alpha ?? 1
  const sq = o.squash ?? 0
  glow(ctx, x, y, r * 2.6, color, 0.35)
  ctx.translate(x, y)
  ctx.scale(1 + sq * 0.18, 1 - sq * 0.18)
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.18, color)
  g.addColorStop(1, shade(color, -0.35))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()

  if (o.eyes !== false) {
    // look direction
    const [lx, ly] = o.look ?? [x + 100, y]
    const ang = Math.atan2(ly - y, lx - x)
    const px = Math.cos(ang) * r * 0.1
    const py = Math.sin(ang) * r * 0.08
    const cyc = (T * 0.9 + seed * 1.37) % 3.7
    const blink = cyc < 0.13 ? 0.12 : 1
    const surprised = o.mood === 'surprised'
    const ew = r * 0.2
    const eh = r * (surprised ? 0.3 : 0.26) * blink
    for (const sx of [-1, 1]) {
      const ex = sx * r * 0.33 + px * 0.4
      const ey = -r * 0.12 + py * 0.4
      ctx.fillStyle = '#fffaf2'
      ctx.beginPath()
      ctx.ellipse(ex, ey, ew, eh, 0, 0, Math.PI * 2)
      ctx.fill()
      if (blink > 0.5) {
        ctx.fillStyle = '#171412'
        ctx.beginPath()
        ctx.ellipse(ex + px, ey + py, ew * 0.55, eh * 0.62, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(ex + px - ew * 0.18, ey + py - eh * 0.25, ew * 0.16, 0, Math.PI * 2)
        ctx.fill()
      }
      // brows
      if (o.mood === 'worried' || o.mood === 'determined') {
        ctx.strokeStyle = 'rgba(23,20,18,0.8)'
        ctx.lineWidth = r * 0.06
        ctx.lineCap = 'round'
        ctx.beginPath()
        const tilt = o.mood === 'worried' ? -1 : 1
        ctx.moveTo(ex - ew, ey - eh - r * 0.08 + sx * tilt * r * 0.05)
        ctx.lineTo(ex + ew, ey - eh - r * 0.08 - sx * tilt * r * 0.05)
        ctx.stroke()
      }
    }
    // mouth
    ctx.strokeStyle = 'rgba(23,20,18,0.85)'
    ctx.fillStyle = 'rgba(23,20,18,0.85)'
    ctx.lineWidth = r * 0.07
    ctx.lineCap = 'round'
    const my = r * 0.36
    ctx.beginPath()
    switch (o.mood) {
      case 'happy':
        ctx.arc(0, my - r * 0.1, r * 0.2, 0.15 * Math.PI, 0.85 * Math.PI)
        ctx.stroke()
        break
      case 'smug':
        ctx.arc(r * 0.05, my - r * 0.1, r * 0.18, 0.1 * Math.PI, 0.6 * Math.PI)
        ctx.stroke()
        break
      case 'surprised':
        ctx.ellipse(0, my, r * 0.09, r * 0.12, 0, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'worried':
        ctx.moveTo(-r * 0.16, my + r * 0.02)
        ctx.quadraticCurveTo(-r * 0.05, my - r * 0.06, 0, my)
        ctx.quadraticCurveTo(r * 0.05, my + r * 0.06, r * 0.16, my - r * 0.02)
        ctx.stroke()
        break
      case 'determined':
        ctx.moveTo(-r * 0.14, my)
        ctx.lineTo(r * 0.14, my)
        ctx.stroke()
        break
      default:
        ctx.arc(0, my - r * 0.14, r * 0.14, 0.25 * Math.PI, 0.75 * Math.PI)
        ctx.stroke()
    }
  }
  ctx.restore()

  if (o.sweat && o.sweat > 0) {
    ctx.save()
    ctx.globalAlpha *= o.sweat
    const dy = ((T * 1.4) % 1) * r * 0.5
    ctx.fillStyle = '#9fd0ff'
    ctx.beginPath()
    const sx = x + r * 0.95
    const sy = y - r * 0.55 + dy
    ctx.moveTo(sx, sy - r * 0.2)
    ctx.quadraticCurveTo(sx + r * 0.14, sy, sx, sy + r * 0.06)
    ctx.quadraticCurveTo(sx - r * 0.14, sy, sx, sy - r * 0.2)
    ctx.fill()
    ctx.restore()
  }
  if (o.label) {
    math(e, o.label, x, y + r + 34, { size: 24, align: 'center', color: o.labelColor ?? C.dim, alpha: o.alpha })
  }
}

export function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) & 255
  let g = (n >> 8) & 255
  let b = n & 255
  if (k < 0) {
    r *= 1 + k
    g *= 1 + k
    b *= 1 + k
  } else {
    r += (255 - r) * k
    g += (255 - g) * k
    b += (255 - b) * k
  }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
}

export function withAlpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

// ── charts ──────────────────────────────────────────────────────────────────
export interface Axes {
  x: number
  y: number
  w: number
  h: number
  X(v: number): number
  Y(v: number): number
}

export function axes(
  e: Env,
  x: number,
  y: number,
  w: number,
  h: number,
  o: { xr: [number, number]; yr: [number, number]; xlabel?: string; ylabel?: string; xticks?: [number, string][]; yticks?: [number, string][]; p?: number },
): Axes {
  const { ctx } = e
  const p = o.p ?? 1
  const X = (v: number) => x + ((v - o.xr[0]) / (o.xr[1] - o.xr[0])) * w
  const Y = (v: number) => y + h - ((v - o.yr[0]) / (o.yr[1] - o.yr[0])) * h
  ctx.save()
  ctx.globalAlpha *= p
  line(ctx, x, y + h, x + w, y + h, C.faint, 2, at(p, 0, 1))
  line(ctx, x, y + h, x, y, C.faint, 2, at(p, 0, 1))
  for (const [v, s] of o.xticks ?? []) {
    line(ctx, X(v), y + h, X(v), y + h + 8, C.faint, 2)
    text(e, s, X(v), y + h + 34, { size: 20, font: 'mono', align: 'center', color: C.dim })
  }
  for (const [v, s] of o.yticks ?? []) {
    line(ctx, x - 8, Y(v), x, Y(v), C.faint, 2)
    text(e, s, x - 16, Y(v) + 7, { size: 20, font: 'mono', align: 'right', color: C.dim })
  }
  if (o.xlabel) math(e, o.xlabel, x + w / 2, y + h + 72, { size: 24, align: 'center', color: C.dim, font: 'mono' })
  if (o.ylabel) {
    ctx.save()
    ctx.translate(x - 78, y + h / 2)
    ctx.rotate(-Math.PI / 2)
    math(e, o.ylabel, 0, 0, { size: 24, align: 'center', color: C.dim, font: 'mono' })
    ctx.restore()
  }
  ctx.restore()
  return { x, y, w, h, X, Y }
}

/** Draws y = fn(x) over [x0, x1] in data space, revealed up to progress p. */
export function plot(ctx: CanvasRenderingContext2D, ax: Axes, fn: (x: number) => number, x0: number, x1: number, color: string, w = 4, p = 1, dash?: number[]) {
  if (p <= 0) return
  const n = 120
  ctx.strokeStyle = color
  ctx.lineWidth = w
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (dash) ctx.setLineDash(dash)
  ctx.beginPath()
  const end = x0 + (x1 - x0) * clamp(p)
  for (let i = 0; i <= n; i++) {
    const xv = x0 + ((end - x0) * i) / n
    const px = ax.X(xv)
    const py = ax.Y(fn(xv))
    if (i) ctx.lineTo(px, py)
    else ctx.moveTo(px, py)
  }
  ctx.stroke()
  ctx.setLineDash([])
}

export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

export function knob(e: Env, x: number, y: number, r: number, v01: number, label: string, valueText: string, color = C.gold) {
  const { ctx } = e
  const a0 = Math.PI * 0.75
  const a1 = Math.PI * 2.25
  ctx.save()
  ctx.lineCap = 'round'
  ctx.strokeStyle = C.ghost
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.arc(x, y, r + 16, a0, a1)
  ctx.stroke()
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r + 16, a0, a0 + (a1 - a0) * clamp(v01))
  ctx.stroke()
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r)
  g.addColorStop(0, '#3a3530')
  g.addColorStop(1, '#1d1a17')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(236,231,223,0.18)'
  ctx.lineWidth = 2
  ctx.stroke()
  const a = a0 + (a1 - a0) * clamp(v01)
  ctx.strokeStyle = color
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.25)
  ctx.lineTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82)
  ctx.stroke()
  ctx.restore()
  math(e, label, x, y + r + 58, { size: 26, align: 'center', color: C.dim })
  text(e, valueText, x, y + 10, { size: 26, font: 'mono', align: 'center', color: C.ink, weight: 500 })
}

export function meter(e: Env, x: number, y: number, w: number, h: number, v01: number, label: string, color = C.red) {
  const { ctx } = e
  rrect(ctx, x, y, w, h, h / 2)
  ctx.fillStyle = C.ghost
  ctx.fill()
  if (v01 > 0.001) {
    rrect(ctx, x, y, Math.max(h, w * clamp(v01)), h, h / 2)
    ctx.fillStyle = color
    ctx.fill()
  }
  text(e, label, x, y - 16, { size: 22, font: 'mono', color: C.dim })
  text(e, `${Math.round(v01 * 100)}%`, x + w, y - 16, { size: 22, font: 'mono', color: C.ink, align: 'right' })
}

/** Title that rises into place word by word. */
export function riseWords(e: Env, str: string, x: number, y: number, p: number, o: TextOpts & { stagger?: number } = {}) {
  const { ctx } = e
  const words = str.split(' ')
  const size = o.size ?? 64
  ctx.save()
  ctx.font = `${o.italic ? 'italic ' : ''}${o.weight ?? 400} ${size}px ${o.font === 'mono' ? e.f.mono : e.f.serif}`
  const space = ctx.measureText(' ').width
  const widths = words.map((w) => ctx.measureText(w).width)
  const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1)
  ctx.restore()
  let cx = o.align === 'center' ? x - total / 2 : x
  const st = o.stagger ?? 0.12
  // scale time so the last word finishes exactly at p = 1, however long the title
  const span = (words.length - 1) * st + 0.5
  words.forEach((w, i) => {
    const q = clamp((p * span - i * st) / 0.5)
    const eq = ease.out(q)
    text(e, w, cx, y + (1 - eq) * size * 0.45, { ...o, size, align: 'left', alpha: (o.alpha ?? 1) * eq })
    cx += widths[i] + space
  })
}
