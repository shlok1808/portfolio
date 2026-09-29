/**
 * 05 · Residual Stream — a sentence from your About section, one line per token position,
 * flowing left → right through 42 layers. Streams straighten early and get written to more in
 * deeper layers; attention arcs carry information from earlier positions to later ones
 * (causal, never backwards); now and then a feature fires on a stream. The left margin shows
 * the input tokens and the right margin each position's next-token prediction.
 */
import { createSurface, runLoop, smoothstep, clamp } from '../lib/surface'
import { makeNoise, mulberry32 } from '../lib/noise'
import { readTheme, onThemeChange, rgba, fontFamily } from '../lib/theme'
import type { BgMount } from '../lib/types'

const TOKENS = ['how', ' do', ' we', ' decode', ' activations', ' into', ' language', ' we', ' can', ' actually', ' trust', '?']
const NEXT: [string, number][] = [
  [' do', 0.62],
  [' we', 0.71],
  [' decode', 0.08],
  [' activations', 0.12],
  [' into', 0.47],
  [' language', 0.19],
  [' we', 0.33],
  [' can', 0.58],
  [' actually', 0.06],
  [' trust', 0.21],
  ['?', 0.54],
  ['⏎', 0.44],
]
const LAYERS = 42
/** SentencePiece shows a leading space as ▁ (Gemma/Llama tokenizers). */
const sp = (tok: string) => tok.replace(/^ /, '\u2581')

interface Particle { x: number; v: number; len: number; bright: number }
interface Arc { from: number; to: number; x: number; born: number; life: number }
interface Fire { s: number; x: number; born: number; id: number }

export const mount: BgMount = (host, { thumb }) => {
  const noise = makeNoise(20)
  const rand = mulberry32(99)
  let theme = readTheme()
  const unsub = onThemeChange((t) => (theme = t))
  const surf = createSurface(host)
  const mono = fontFamily(host, '--lab-mono', 'ui-monospace, Menlo, monospace')

  const S = TOKENS.length
  const parts: Particle[][] = TOKENS.map(() =>
    Array.from({ length: thumb ? 3 : 6 }, () => ({
      x: rand() * 1.2,
      v: 0.05 + rand() * 0.035,
      len: 0.06 + rand() * 0.1,
      bright: rand(),
    })),
  )
  const arcs: Arc[] = []
  const fires: Fire[] = []
  let nextArc = 0.4
  let nextFire = 1.5

  const geom = () => {
    const { w, h } = surf
    const narrow = w < 760
    const x0 = narrow ? 0 : Math.min(170, w * 0.12)
    const x1 = narrow ? w : w - Math.min(190, w * 0.13)
    const top = h * 0.1
    const bot = h * 0.86
    return { x0, x1, top, bot, gap: (bot - top) / (S - 1), narrow }
  }

  const streamY = (i: number, u: number, t: number, g: ReturnType<typeof geom>) => {
    // u ∈ [0,1] along the stream; deeper layers get written to more
    const env = 0.15 + 0.85 * smoothstep(0, 0.85, u)
    const n = noise.noise3(u * 2.6, i * 0.9, t * 0.05) + 0.5 * noise.noise3(u * 6.1, i * 1.7 + 10, t * 0.08)
    return g.top + i * g.gap + n * env * g.gap * 0.42
  }

  const step = (t: number, dt: number) => {
    const { ctx, w, h } = surf
    ctx.clearRect(0, 0, w, h)
    const g = geom()
    const ink = theme.mode === 'dark' ? ([232, 226, 216] as const) : theme.ink
    const inkc: [number, number, number] = [ink[0], ink[1], ink[2]]
    const acc = theme.accent
    const span = g.x1 - g.x0
    const X = (u: number) => g.x0 + u * span

    // layer planes
    for (let l = 0; l < LAYERS; l++) {
      const x = X(l / (LAYERS - 1))
      const major = (l % 10 === 0 && l < 40) || l === LAYERS - 1
      const probe = l === 20
      ctx.strokeStyle = probe ? rgba(acc, 0.22) : rgba(inkc, major ? 0.07 : 0.03)
      ctx.lineWidth = probe ? 1 : 1
      ctx.beginPath()
      ctx.moveTo(x, g.top - g.gap * 0.6)
      ctx.lineTo(x, g.bot + g.gap * 0.6)
      ctx.stroke()
      if ((major || probe) && !thumb) {
        ctx.font = `10px ${mono}`
        ctx.fillStyle = probe ? rgba(acc, 0.8) : rgba(inkc, 0.3)
        ctx.textAlign = 'center'
        ctx.fillText(probe ? 'L20 · probes read here' : `L${l}`, x, g.bot + g.gap * 0.6 + 16)
        ctx.textAlign = 'left'
      }
    }

    // faint full streams
    ctx.lineWidth = 1
    for (let i = 0; i < S; i++) {
      ctx.strokeStyle = rgba(inkc, 0.075)
      ctx.beginPath()
      for (let k = 0; k <= 90; k++) {
        const u = k / 90
        const y = streamY(i, u, t, g)
        if (k === 0) ctx.moveTo(X(u), y)
        else ctx.lineTo(X(u), y)
      }
      ctx.stroke()
    }

    // particles riding the streams (their trails are just the stream curve behind them)
    for (let i = 0; i < S; i++) {
      for (const p of parts[i]) {
        p.x += p.v * dt
        if (p.x - p.len > 1) {
          p.x = -rand() * 0.2
          p.v = 0.05 + rand() * 0.035
          p.bright = rand()
        }
        const seg = 5
        for (let s = 0; s < seg; s++) {
          const ua = clamp(p.x - p.len + (p.len * s) / seg)
          const ub = clamp(p.x - p.len + (p.len * (s + 1)) / seg)
          if (ub <= ua) continue
          const a = Math.pow((s + 1) / seg, 1.6) * (0.25 + 0.5 * p.bright)
          ctx.strokeStyle = p.bright > 0.82 ? rgba(acc, a * 1.2) : rgba(inkc, a)
          ctx.lineWidth = p.bright > 0.82 ? 1.6 : 1.1
          ctx.beginPath()
          for (let k = 0; k <= 4; k++) {
            const u = ua + ((ub - ua) * k) / 4
            const y = streamY(i, u, t, g)
            if (k === 0) ctx.moveTo(X(u), y)
            else ctx.lineTo(X(u), y)
          }
          ctx.stroke()
        }
      }
    }

    // attention: information moves from an earlier position to a later one
    nextArc -= dt
    if (nextArc <= 0) {
      const to = 1 + Math.floor(rand() * (S - 1))
      const from = Math.floor(rand() * to)
      arcs.push({ from, to, x: 0.12 + rand() * 0.8, born: t, life: 1.8 })
      nextArc = 0.35 + rand() * 0.6
    }
    for (let k = arcs.length - 1; k >= 0; k--) {
      const a = arcs[k]
      const age = (t - a.born) / a.life
      if (age >= 1) {
        arcs.splice(k, 1)
        continue
      }
      const x = X(a.x)
      const ya = streamY(a.from, a.x, t, g)
      const yb = streamY(a.to, a.x, t, g)
      const bulge = 22 + Math.abs(a.to - a.from) * 10
      const alpha = Math.sin(Math.PI * age)
      ctx.strokeStyle = rgba(acc, 0.35 * alpha)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, ya)
      ctx.quadraticCurveTo(x + bulge, (ya + yb) / 2, x, yb)
      ctx.stroke()
      // the packet travelling down the arc
      const q = clamp(age * 1.4)
      const px = (1 - q) * (1 - q) * x + 2 * (1 - q) * q * (x + bulge) + q * q * x
      const py = (1 - q) * (1 - q) * ya + 2 * (1 - q) * q * ((ya + yb) / 2) + q * q * yb
      ctx.fillStyle = rgba(acc, 0.9 * alpha)
      ctx.beginPath()
      ctx.arc(px, py, 2.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = rgba(acc, 0.7 * alpha)
      ctx.beginPath()
      ctx.arc(x, ya, 1.8, 0, Math.PI * 2)
      ctx.arc(x, yb, 1.8, 0, Math.PI * 2)
      ctx.fill()
    }

    // a feature fires on a stream
    nextFire -= dt
    if (nextFire <= 0 && !thumb) {
      fires.push({ s: Math.floor(rand() * S), x: 0.3 + rand() * 0.65, born: t, id: 1000 + Math.floor(rand() * 16000) })
      nextFire = 1.6 + rand() * 2.2
    }
    for (let k = fires.length - 1; k >= 0; k--) {
      const f = fires[k]
      const age = t - f.born
      if (age > 2.4) {
        fires.splice(k, 1)
        continue
      }
      const x = X(f.x)
      const y = streamY(f.s, f.x, t, g)
      const a = age < 0.15 ? age / 0.15 : Math.exp(-(age - 0.15) * 1.6)
      ctx.strokeStyle = rgba(acc, 0.8 * a)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y, 3 + age * 10, 0, Math.PI * 2)
      ctx.stroke()
      ctx.font = `10px ${mono}`
      ctx.fillStyle = rgba(acc, 0.75 * a)
      ctx.fillText(`f/${f.id}`, x + 8, y - 8)
    }

    // tokens in, predictions out
    if (!g.narrow && !thumb) {
      ctx.font = `12px ${mono}`
      for (let i = 0; i < S; i++) {
        const yl = streamY(i, 0, t, g)
        const yr = streamY(i, 1, t, g)
        ctx.textAlign = 'right'
        ctx.fillStyle = rgba(inkc, 0.55)
        ctx.fillText(sp(TOKENS[i]), g.x0 - 12, yl + 4)
        ctx.textAlign = 'left'
        const [tok, p] = NEXT[i]
        ctx.fillStyle = rgba(inkc, 0.3)
        ctx.fillText('→', g.x1 + 10, yr + 4)
        ctx.fillStyle = rgba(acc, 0.75)
        ctx.fillText(sp(tok), g.x1 + 26, yr + 4)
        const tw = ctx.measureText(sp(tok)).width
        ctx.fillStyle = rgba(inkc, 0.32)
        ctx.fillText(p.toFixed(2), g.x1 + 32 + tw, yr + 4)
      }
      ctx.font = `10px ${mono}`
      ctx.fillStyle = rgba(inkc, 0.3)
      ctx.textAlign = 'right'
      ctx.fillText('tokens', g.x0 - 12, g.top - g.gap * 0.6 - 4)
      ctx.textAlign = 'left'
      ctx.fillText('next-token prediction', g.x1 + 10, g.top - g.gap * 0.6 - 4)
    }
  }

  const loop = runLoop(step, { host })
  return {
    destroy() {
      loop.stop()
      surf.destroy()
      unsub()
    },
    setPaused: (p) => loop.setPaused(p),
  }
}
