/**
 * 06 · Loss Landscape — a topographic map of a slowly shifting loss surface (marching squares,
 * index contours every fourth level, like a survey map), with two optimizers released from the
 * same initialisation: Adam and SGD with momentum, running real update rules on the real field.
 * Hover to read the loss under your cursor. Line art, so it also suits light mode.
 */
import { createSurface, runLoop, trackPointer, clamp } from '../lib/surface'
import { makeNoise, mulberry32 } from '../lib/noise'
import { readTheme, onThemeChange, rgba, fontFamily, type RGB } from '../lib/theme'
import type { BgMount } from '../lib/types'

interface Opt {
  name: string
  x: number
  y: number
  m: [number, number]
  v: [number, number]
  step: number
  trail: [number, number][]
  done: boolean
}

export const mount: BgMount = (host, { thumb }) => {
  const noise = makeNoise(6)
  const rand = mulberry32(1234)
  let theme = readTheme()
  const unsub = onThemeChange((t) => (theme = t))
  const surf = createSurface(host)
  const pointer = trackPointer(host)
  const mono = fontFamily(host, '--lab-mono', 'ui-monospace, Menlo, monospace')

  const basins = Array.from({ length: 6 }, () => ({
    bx: 0.1 + rand() * 1.4,
    by: 0.12 + rand() * 0.76,
    d: 0.45 + rand() * 0.8,
    s: 0.1 + rand() * 0.16,
    w1: 0.03 + rand() * 0.05,
    w2: 0.03 + rand() * 0.05,
    ph: rand() * 6.28,
  }))

  let T = 0
  // field in units of screen height; x spans [0, aspect]
  const field = (x: number, y: number) => {
    const a = surf.w / surf.h
    let f = 0.5 * noise.fbm2(x * 1.35 + T * 0.006, y * 1.35 - T * 0.004, 3)
    for (const b of basins) {
      const cx = (b.bx / 1.6) * a + 0.07 * Math.sin(T * b.w1 + b.ph)
      const cy = b.by + 0.06 * Math.cos(T * b.w2 + b.ph)
      const dx = x - cx
      const dy = y - cy
      f -= b.d * Math.exp(-(dx * dx + dy * dy) / (2 * b.s * b.s))
    }
    const ex = x - a / 2
    const ey = y - 0.5
    return f + 0.22 * (ex * ex + ey * ey)
  }
  const grad = (x: number, y: number): [number, number] => {
    const e = 1e-3
    return [(field(x + e, y) - field(x - e, y)) / (2 * e), (field(x, y + e) - field(x, y - e)) / (2 * e)]
  }

  // ── contours ────────────────────────────────────────────────────────────────
  const CELL = thumb ? 10 : 12
  const LEVELS = 18
  let paths: { p: Path2D; major: boolean }[] = []
  let lastBuild = -1
  let fmin = 0
  let fmax = 1

  function buildContours() {
    const { w, h } = surf
    const nx = Math.ceil(w / CELL) + 1
    const ny = Math.ceil(h / CELL) + 1
    const vals = new Float32Array(nx * ny)
    fmin = Infinity
    fmax = -Infinity
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const v = field((i * CELL) / h, (j * CELL) / h)
        vals[j * nx + i] = v
        if (v < fmin) fmin = v
        if (v > fmax) fmax = v
      }
    paths = []
    for (let L = 0; L < LEVELS; L++) {
      const iso = fmin + ((L + 0.5) / LEVELS) * (fmax - fmin)
      const p = new Path2D()
      for (let j = 0; j < ny - 1; j++)
        for (let i = 0; i < nx - 1; i++) {
          const a = vals[j * nx + i]
          const b = vals[j * nx + i + 1]
          const c = vals[(j + 1) * nx + i + 1]
          const d = vals[(j + 1) * nx + i]
          const idx = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0)
          if (idx === 0 || idx === 15) continue
          const x = i * CELL
          const y = j * CELL
          const top: [number, number] = [x + (CELL * (iso - a)) / (b - a), y]
          const right: [number, number] = [x + CELL, y + (CELL * (iso - b)) / (c - b)]
          const bottom: [number, number] = [x + (CELL * (iso - d)) / (c - d), y + CELL]
          const left: [number, number] = [x, y + (CELL * (iso - a)) / (d - a)]
          const seg = (p1: [number, number], p2: [number, number]) => {
            p.moveTo(p1[0], p1[1])
            p.lineTo(p2[0], p2[1])
          }
          switch (idx) {
            case 1: case 14: seg(left, bottom); break
            case 2: case 13: seg(bottom, right); break
            case 3: case 12: seg(left, right); break
            case 4: case 11: seg(top, right); break
            case 6: case 9: seg(top, bottom); break
            case 7: case 8: seg(left, top); break
            case 5: seg(left, top); seg(bottom, right); break
            case 10: seg(top, right); seg(left, bottom); break
          }
        }
      paths.push({ p, major: L % 4 === 1 })
    }
  }

  // ── optimizers ──────────────────────────────────────────────────────────────
  let opts: Opt[] = []
  let restartAt = 0
  const spawn = () => {
    const a = surf.w / surf.h
    const x = a * (0.08 + rand() * 0.84)
    const y = 0.1 + rand() * 0.8
    const mk = (name: string): Opt => ({ name, x, y, m: [0, 0], v: [0, 0], step: 0, trail: [[x, y]], done: false })
    opts = [mk('adam'), mk('sgd+momentum')]
  }

  const stepOpt = (o: Opt) => {
    if (o.done) return
    const [gx, gy] = grad(o.x, o.y)
    o.step++
    if (o.name === 'adam') {
      const b1 = 0.9
      const b2 = 0.999
      const lr = 0.0042
      o.m = [b1 * o.m[0] + (1 - b1) * gx, b1 * o.m[1] + (1 - b1) * gy]
      o.v = [b2 * o.v[0] + (1 - b2) * gx * gx, b2 * o.v[1] + (1 - b2) * gy * gy]
      const mh = [o.m[0] / (1 - Math.pow(b1, o.step)), o.m[1] / (1 - Math.pow(b1, o.step))]
      const vh = [o.v[0] / (1 - Math.pow(b2, o.step)), o.v[1] / (1 - Math.pow(b2, o.step))]
      o.x -= (lr * mh[0]) / (Math.sqrt(vh[0]) + 1e-8)
      o.y -= (lr * mh[1]) / (Math.sqrt(vh[1]) + 1e-8)
    } else {
      const lr = 0.0022
      o.m = [0.9 * o.m[0] + gx, 0.9 * o.m[1] + gy]
      o.x -= lr * o.m[0]
      o.y -= lr * o.m[1]
    }
    const last = o.trail[o.trail.length - 1]
    if (Math.hypot(o.x - last[0], o.y - last[1]) > 0.004) o.trail.push([o.x, o.y])
    if (o.step > 700 || (o.step > 60 && Math.hypot(gx, gy) < 0.01)) o.done = true
  }

  const step = (t: number, dt: number) => {
    T = t
    const { ctx, w, h } = surf
    if (lastBuild < 0 || t - lastBuild > 0.12) {
      buildContours()
      lastBuild = t
    }
    if (!opts.length) spawn()
    ctx.clearRect(0, 0, w, h)
    const dark = theme.mode === 'dark'
    const ink: RGB = dark ? [232, 226, 216] : theme.ink
    const acc = theme.accent
    const warm: RGB = dark ? [244, 199, 154] : [150, 92, 48]

    ctx.lineWidth = 1
    for (const { p, major } of paths) {
      ctx.strokeStyle = rgba(ink, major ? (dark ? 0.14 : 0.2) : dark ? 0.06 : 0.09)
      ctx.lineWidth = major ? 1.15 : 0.8
      ctx.stroke(p)
    }

    // run a few update steps per frame
    const n = Math.max(1, Math.round(dt * 32))
    for (let k = 0; k < n; k++) for (const o of opts) stepOpt(o)
    if (opts.every((o) => o.done)) {
      if (!restartAt) restartAt = t + 2.2
      else if (t > restartAt) {
        restartAt = 0
        spawn()
      }
    }
    const fadeOut = restartAt ? clamp((restartAt - t) / 0.8) : 1

    for (const o of opts) {
      const c = o.name === 'adam' ? acc : warm
      ctx.strokeStyle = rgba(c, 0.8 * fadeOut)
      ctx.lineWidth = 1.4
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      o.trail.forEach(([x, y], i) => (i ? ctx.lineTo(x * h, y * h) : ctx.moveTo(x * h, y * h)))
      ctx.lineTo(o.x * h, o.y * h)
      ctx.stroke()
      ctx.setLineDash([])
      const hx = o.x * h
      const hy = o.y * h
      ctx.fillStyle = rgba(c, fadeOut)
      ctx.beginPath()
      ctx.arc(hx, hy, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = rgba(c, 0.35 * fadeOut)
      ctx.beginPath()
      ctx.arc(hx, hy, 8, 0, Math.PI * 2)
      ctx.stroke()
      if (!thumb) {
        ctx.font = `10.5px ${mono}`
        ctx.fillStyle = rgba(c, 0.9 * fadeOut)
        const loss = field(o.x, o.y)
        const label = `${o.name}  step ${o.step}  loss ${loss.toFixed(3)}`
        const right = hx + 14 + ctx.measureText(label).width > w - 8
        ctx.textAlign = right ? 'right' : 'left'
        ctx.fillText(label, right ? hx - 14 : hx + 14, hy + (o.name === 'adam' ? -10 : 16))
        ctx.textAlign = 'left'
      }
      // start marker
      const [sx, sy] = o.trail[0]
      ctx.strokeStyle = rgba(ink, 0.5 * fadeOut)
      ctx.beginPath()
      ctx.moveTo(sx * h - 4, sy * h - 4)
      ctx.lineTo(sx * h + 4, sy * h + 4)
      ctx.moveTo(sx * h + 4, sy * h - 4)
      ctx.lineTo(sx * h - 4, sy * h + 4)
      ctx.stroke()
    }

    // cursor readout
    const ps = pointer.state
    if (ps.active && !thumb && performance.now() - ps.lastMove < 2500) {
      const v = field(ps.x / h, ps.y / h)
      ctx.strokeStyle = rgba(ink, 0.35)
      ctx.beginPath()
      ctx.moveTo(ps.x - 10, ps.y)
      ctx.lineTo(ps.x - 4, ps.y)
      ctx.moveTo(ps.x + 4, ps.y)
      ctx.lineTo(ps.x + 10, ps.y)
      ctx.moveTo(ps.x, ps.y - 10)
      ctx.lineTo(ps.x, ps.y - 4)
      ctx.moveTo(ps.x, ps.y + 4)
      ctx.lineTo(ps.x, ps.y + 10)
      ctx.stroke()
      ctx.font = `10.5px ${mono}`
      ctx.fillStyle = rgba(ink, 0.6)
      ctx.fillText(`L(θ) = ${v.toFixed(3)}`, ps.x + 12, ps.y - 12)
    }

    if (!thumb) {
      ctx.font = `10px ${mono}`
      ctx.fillStyle = rgba(ink, 0.32)
      ctx.fillText('loss surface · a 2-D slice of ~2.6 billion dimensions', 22, h - 22)
    }
  }

  const loop = runLoop(step, { host })
  return {
    destroy() {
      loop.stop()
      surf.destroy()
      pointer.destroy()
      unsub()
    },
    setPaused: (p) => loop.setPaused(p),
  }
}
