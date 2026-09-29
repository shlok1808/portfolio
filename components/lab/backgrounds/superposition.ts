/**
 * 09 · Superposition — Toy Models of Superposition (Elhage et al., 2022) as floating line art.
 * Small wireframes drift in the margins: the geometries features settle into (digons,
 * triangles, pentagons, tetrahedra, square antiprisms). Up top, one big diagram packs 5 features
 * into 2 dimensions and re-packs as sparsity S rises: 2 orthogonal features → antipodal pairs
 * (digons) → a pentagon.
 */
import { createSurface, runLoop, smoothstep, lerp } from '../lib/surface'
import { mulberry32, gaussian } from '../lib/noise'
import { readTheme, onThemeChange, rgba, fontFamily, type RGB } from '../lib/theme'
import type { BgMount } from '../lib/types'

type V3 = [number, number, number]

const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

function polygon(n: number): V3[] {
  return Array.from({ length: n }, (_, k) => [Math.cos((2 * Math.PI * k) / n), Math.sin((2 * Math.PI * k) / n), 0])
}
const SHAPES: { name: string; label: string; verts: V3[] }[] = [
  { name: 'digon', label: '2 features · 1 dim', verts: [[1, 0, 0], [-1, 0, 0]] },
  { name: 'triangle', label: '3 features · 2 dims', verts: polygon(3) },
  { name: 'pentagon', label: '5 features · 2 dims', verts: polygon(5) },
  {
    name: 'tetrahedron',
    label: '4 features · 3 dims',
    verts: [norm([1, 1, 1]), norm([1, -1, -1]), norm([-1, 1, -1]), norm([-1, -1, 1])],
  },
  {
    name: 'square antiprism',
    label: '8 features · 3 dims',
    verts: [
      ...Array.from({ length: 4 }, (_, k) => norm([Math.cos((Math.PI / 2) * k), Math.sin((Math.PI / 2) * k), 0.62]) as V3),
      ...Array.from({ length: 4 }, (_, k) =>
        norm([Math.cos((Math.PI / 2) * k + Math.PI / 4), Math.sin((Math.PI / 2) * k + Math.PI / 4), -0.62]) as V3,
      ),
    ],
  },
  {
    name: 'octahedron',
    label: '6 features · 3 dims · 3 digons',
    verts: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
  },
]

// hull-ish edges: connect each vertex to its nearest neighbours (minimal angle)
function edgesOf(verts: V3[]): [number, number][] {
  if (verts.length === 2) return []
  let best = -2
  const dots: number[][] = verts.map((a) => verts.map((b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
  for (let i = 0; i < verts.length; i++) for (let j = 0; j < verts.length; j++) if (i !== j) best = Math.max(best, dots[i][j])
  const out: [number, number][] = []
  for (let i = 0; i < verts.length; i++)
    for (let j = i + 1; j < verts.length; j++) if (dots[i][j] > best - 0.35) out.push([i, j])
  return out
}

interface Floater {
  shape: number
  x: number
  y: number
  r: number
  axis: V3
  speed: number
  ph: number
  drift: number
}

export const mount: BgMount = (host, { thumb }) => {
  const rand = mulberry32(2022)
  let theme = readTheme()
  const unsub = onThemeChange((t) => (theme = t))
  const surf = createSurface(host)
  const mono = fontFamily(host, '--lab-mono', 'ui-monospace, Menlo, monospace')
  const edges = SHAPES.map((s) => edgesOf(s.verts))

  const floaters: Floater[] = []
  const nF = thumb ? 5 : 9
  for (let i = 0; i < nF; i++) {
    floaters.push({
      shape: i % SHAPES.length,
      x: 0,
      y: 0,
      r: 26 + rand() * 30,
      axis: norm([gaussian(rand), gaussian(rand), gaussian(rand)]),
      speed: 0.12 + rand() * 0.2,
      ph: rand() * 10,
      drift: rand() * 6.28,
    })
  }
  const place = () => {
    const { w, h } = surf
    const wide = w > 1000
    floaters.forEach((f, i) => {
      const left = i % 2 === 0
      const band = wide ? (w - 720) / 2 : w
      f.x = wide ? (left ? band * (0.25 + rand() * 0.5) : w - band * (0.25 + rand() * 0.5)) : w * (0.1 + rand() * 0.8)
      f.y = h * (0.12 + ((i + 0.5) / nF) * 0.8)
    })
  }
  place()
  surf.onResize = place

  const rotate = (v: V3, axis: V3, a: number): V3 => {
    const [x, y, z] = v
    const [u, w_, n] = axis
    const c = Math.cos(a)
    const s = Math.sin(a)
    const d = u * x + w_ * y + n * z
    return [
      u * d * (1 - c) + x * c + (-n * y + w_ * z) * s,
      w_ * d * (1 - c) + y * c + (n * x - u * z) * s,
      n * d * (1 - c) + z * c + (-w_ * x + u * y) * s,
    ]
  }

  const drawFloater = (ctx: CanvasRenderingContext2D, f: Floater, t: number, ink: RGB, acc: RGB) => {
    const S = SHAPES[f.shape]
    const cx = f.x + 14 * Math.sin(t * 0.07 + f.drift)
    const cy = f.y + 10 * Math.cos(t * 0.05 + f.drift * 1.3)
    const a = t * f.speed + f.ph
    const tilt: V3 = [0.4, 0.2, 0]
    const pts = S.verts.map((v) => {
      let p = rotate(v, f.axis, a)
      p = rotate(p, norm([1, 0, 0]), tilt[0])
      const persp = 1 / (1 - p[2] * 0.25)
      return { x: cx + p[0] * f.r * persp, y: cy - p[1] * f.r * persp, z: p[2] }
    })
    ctx.lineWidth = 1
    for (const [i, j] of edges[f.shape]) {
      const z = (pts[i].z + pts[j].z) / 2
      ctx.strokeStyle = rgba(ink, 0.1 + 0.08 * (z + 1))
      ctx.beginPath()
      ctx.moveTo(pts[i].x, pts[i].y)
      ctx.lineTo(pts[j].x, pts[j].y)
      ctx.stroke()
    }
    for (const p of pts) {
      ctx.strokeStyle = rgba(ink, 0.16 + 0.12 * (p.z + 1))
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
      ctx.fillStyle = rgba(acc, 0.45 + 0.35 * (p.z + 1) * 0.5)
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2 + (p.z + 1) * 0.6, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = rgba(ink, 0.5)
    ctx.beginPath()
    ctx.arc(cx, cy, 1.4, 0, Math.PI * 2)
    ctx.fill()
    if (!thumb) {
      ctx.font = `10px ${mono}`
      ctx.textAlign = 'center'
      ctx.fillStyle = rgba(ink, 0.34)
      ctx.fillText(S.name, cx, cy + f.r + 22)
      ctx.fillStyle = rgba(ink, 0.22)
      ctx.fillText(S.label, cx, cy + f.r + 35)
      ctx.textAlign = 'left'
    }
  }

  // hero: 5 features in 2 dims, re-packing with sparsity
  const K0 = [0, 90, 180, 270, 306].map((d) => (d * Math.PI) / 180)
  const LEN1 = [1, 1, 1, 1, 0]
  const K2 = [18, 90, 162, 234, 306].map((d) => (d * Math.PI) / 180)

  const drawHero = (ctx: CanvasRenderingContext2D, t: number, ink: RGB, acc: RGB) => {
    const { w, h } = surf
    const wide = w > 1000
    const cx = wide ? w * 0.78 : w * 0.72
    const cy = h * 0.3
    const R = Math.min(h * 0.17, w * 0.14)
    const cyc = (t % 26) / 26
    const S = cyc < 0.5 ? smoothstep(0, 0.46, cyc) : 1 - smoothstep(0.54, 1, cyc)
    const sHat = 0.2 + S * 0.79
    const u1 = smoothstep(0.15, 0.45, S)
    const u2 = smoothstep(0.62, 0.92, S)
    // unit circle + axes
    ctx.strokeStyle = rgba(ink, 0.08)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - R * 1.25, cy)
    ctx.lineTo(cx + R * 1.25, cy)
    ctx.moveTo(cx, cy - R * 1.25)
    ctx.lineTo(cx, cy + R * 1.25)
    ctx.stroke()
    const tips: { x: number; y: number; l: number }[] = []
    for (let k = 0; k < 5; k++) {
      // stage 0: only features 0,1 (orthogonal); stage 1: 4 as two digons; stage 2: pentagon
      const len0 = k < 2 ? 1 : 0
      const len = lerp(lerp(len0, LEN1[k], u1), 1, u2)
      const ang = lerp(K0[k], K2[k], u2)
      tips.push({ x: cx + Math.cos(ang) * R * len, y: cy - Math.sin(ang) * R * len, l: len })
    }
    // polygon through the represented features
    if (u2 > 0.01) {
      ctx.strokeStyle = rgba(acc, 0.28 * u2)
      ctx.beginPath()
      tips.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
      ctx.closePath()
      ctx.stroke()
    }
    tips.forEach((p, k) => {
      if (p.l < 0.02) return
      const a = 0.3 + 0.6 * p.l
      ctx.strokeStyle = rgba(acc, a)
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
      // arrowhead
      const ang = Math.atan2(p.y - cy, p.x - cx)
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.x - 8 * Math.cos(ang - 0.4), p.y - 8 * Math.sin(ang - 0.4))
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.x - 8 * Math.cos(ang + 0.4), p.y - 8 * Math.sin(ang + 0.4))
      ctx.stroke()
      if (!thumb) {
        ctx.font = `10.5px ${mono}`
        ctx.fillStyle = rgba(ink, 0.55 * p.l)
        ctx.fillText(`W${'₀₁₂₃₄'[k]}`, p.x + 8 * Math.cos(ang) + 4, p.y + 8 * Math.sin(ang) + 4)
      }
    })
    if (!thumb) {
      const phase = u2 > 0.5 ? 'pentagon' : u1 > 0.5 ? 'antipodal pairs · digons' : '2 features, orthogonal'
      ctx.font = `10.5px ${mono}`
      ctx.textAlign = 'center'
      ctx.fillStyle = rgba(ink, 0.55)
      ctx.fillText(`5 features in 2 dims · sparsity S = ${sHat.toFixed(2)}`, cx, cy + R * 1.25 + 26)
      ctx.fillStyle = rgba(acc, 0.8)
      ctx.fillText(phase, cx, cy + R * 1.25 + 42)
      ctx.textAlign = 'left'
    }
  }

  const step = (t: number) => {
    const { ctx, w, h } = surf
    ctx.clearRect(0, 0, w, h)
    const ink: RGB = theme.mode === 'dark' ? [232, 226, 216] : theme.ink
    const acc = theme.accent
    const hero = w > 700
    for (const f of floaters) {
      if (hero && f.y < h * 0.5 && f.x > w * 0.6) continue // leave room for the hero diagram
      drawFloater(ctx, f, t, ink, acc)
    }
    if (hero || thumb) drawHero(ctx, t, ink, acc)
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
