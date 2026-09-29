/**
 * 01 · Living Horizon — the current wallpaper, alive. Stars come out in the dark upper sky,
 * a satellite glides across and slips into Earth's shadow, meteors streak now and then, and the
 * night side of the planet gets city lights and thunderstorm flashes, the way it looks from the
 * ISS. Everything is placed against the measured limb of the photo, so it sits on the real edge.
 */
import { createSurface, runLoop, smoothstep, clamp } from '../lib/surface'
import { mulberry32, gaussian } from '../lib/noise'
import { horizonMap, type HorizonMap } from '../lib/horizon'
import { glowSprite, type BgMount } from '../lib/types'

interface Star { x: number; y: number; b: number; size: number; f: number; ph: number; c: string; vis: number }
interface Light { x: number; y: number; a: number; size: number; c: string; ph: number }
interface Haze { x: number; y: number; r: number; a: number }
interface Storm { x: number; y: number; r: number; next: number; t0: number; pulses: number[] }
interface Meteor { x: number; y: number; dx: number; dy: number; len: number; age: number; life: number }
interface Sat { x0: number; y0: number; x1: number; y1: number; age: number; dur: number }

const STAR_COLORS = ['205,218,255', '255,255,255', '255,255,255', '255,244,226', '255,224,196']
const CITY_COLORS = ['255,196,122', '255,178,96', '255,226,178', '255,206,150']

export const mount: BgMount = (host, { thumb }) => {
  const rand = mulberry32(1808)
  let stars: Star[] = []
  let lights: Light[] = []
  let haze: Haze[] = []
  let storms: Storm[] = []
  let hz: HorizonMap = horizonMap(1, 1)
  const meteors: Meteor[] = []
  let sat: Sat | null = null
  let nextMeteor = 2.5
  let nextSat = 1.5

  const warmGlow = glowSprite([255, 190, 120], 64)
  const whiteGlow = glowSprite([235, 242, 255], 64)
  const stormGlow = glowSprite([196, 214, 255], 128, 0.08)

  function build(w: number, h: number) {
    hz = horizonMap(w, h)
    const apex = hz.apexY
    // Stars — denser toward the zenith, fading out where the twilight sky gets bright.
    const n = thumb ? 90 : Math.round((w * apex) / 2600)
    stars = []
    for (let i = 0; i < n; i++) {
      const y = apex * 0.8 * Math.pow(rand(), 1.25)
      const b = Math.pow(rand(), 3.2)
      stars.push({
        x: rand() * w,
        y,
        b,
        size: 0.5 + b * 1.25,
        f: 0.4 + rand() * 2.6,
        ph: rand() * Math.PI * 2,
        c: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
        vis: 1 - smoothstep(apex * 0.16, apex * 0.74, y),
      })
    }
    // City lights — clusters on the night side, foreshortened toward the limb.
    lights = []
    haze = []
    const depth = h - apex
    const clusters = thumb ? 7 : 18
    for (let c = 0; c < clusters; c++) {
      const cx = rand() * w
      const d = 5 + Math.pow(rand(), 1.9) * depth * 0.62
      const persp = clamp(d / (depth * 0.4), 0.12, 1)
      const spreadX = (12 + rand() * 46) * (0.6 + persp)
      const spreadY = 1 + d * 0.07
      const m = Math.round((6 + rand() * 34) * (thumb ? 0.6 : 1))
      for (let i = 0; i < m; i++) {
        const x = cx + gaussian(rand) * spreadX
        const y = hz.limbY(x) + d + gaussian(rand) * spreadY
        if (y < hz.limbY(x) + 2.5) continue
        lights.push({
          x,
          y,
          a: (0.22 + rand() * 0.5) * (0.45 + 0.55 * smoothstep(0, 30, d)),
          size: (0.45 + rand() * 0.9) * (0.7 + 0.5 * persp),
          c: CITY_COLORS[Math.floor(rand() * CITY_COLORS.length)],
          ph: rand() * Math.PI * 2,
        })
      }
      haze.push({ x: cx, y: hz.limbY(cx) + d, r: spreadX * 1.6, a: 0.05 + 0.05 * persp })
    }
    // Thunderstorms somewhere under the clouds.
    storms = []
    const ns = thumb ? 3 : 6
    for (let i = 0; i < ns; i++) {
      const x = rand() * w
      const d = 14 + Math.pow(rand(), 1.4) * depth * 0.5
      storms.push({ x, y: hz.limbY(x) + d, r: 40 + rand() * 70 * clamp(d / 120, 0.4, 1.3), next: 1 + rand() * 6, t0: -10, pulses: [] })
    }
  }

  const surf = createSurface(host, { onResize: (s) => build(s.w, s.h) })
  host.style.mixBlendMode = 'screen'

  const spawnMeteor = () => {
    const { w } = surf
    const dir = rand() < 0.5 ? -1 : 1
    const ang = (22 + rand() * 38) * (Math.PI / 180)
    const speed = 650 + rand() * 520
    meteors.push({
      x: w * (0.1 + rand() * 0.8),
      y: hz.apexY * (0.04 + rand() * 0.3),
      dx: Math.cos(ang) * speed * dir,
      dy: Math.sin(ang) * speed,
      len: 90 + rand() * 110,
      age: 0,
      life: 0.45 + rand() * 0.45,
    })
  }

  const spawnSat = () => {
    const { w } = surf
    const ltr = rand() < 0.5
    const y0 = hz.apexY * (0.06 + rand() * 0.3)
    sat = {
      x0: ltr ? -20 : w + 20,
      y0,
      x1: ltr ? w * (0.75 + rand() * 0.3) : w * (0.25 - rand() * 0.3),
      y1: y0 + (rand() - 0.3) * hz.apexY * 0.25,
      age: 0,
      dur: 17 + rand() * 7,
    }
  }

  const step = (t: number, dt: number) => {
    const { ctx, w, h } = surf
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'

    // stars
    for (const s of stars) {
      if (s.vis <= 0.01) continue
      const tw = 0.62 + 0.38 * Math.sin(t * s.f + s.ph) * Math.sin(t * s.f * 0.37 + s.ph * 2)
      const a = (0.2 + 0.8 * s.b) * s.vis * tw
      ctx.fillStyle = `rgba(${s.c},${a})`
      ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size)
      if (s.b > 0.55) {
        ctx.globalAlpha = a * 0.55
        const r = 9 + s.b * 10
        ctx.drawImage(whiteGlow, s.x - r / 2, s.y - r / 2, r, r)
        ctx.globalAlpha = 1
      }
    }

    // meteors
    nextMeteor -= dt
    if (nextMeteor <= 0 && !thumb) {
      spawnMeteor()
      nextMeteor = 7 + Math.random() * 10
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i]
      m.age += dt
      if (m.age > m.life) {
        meteors.splice(i, 1)
        continue
      }
      const env = Math.sin(Math.PI * (m.age / m.life))
      const hx = m.x + m.dx * m.age
      const hy = m.y + m.dy * m.age
      const sp = Math.hypot(m.dx, m.dy)
      const l = m.len * Math.min(1, m.age / 0.18)
      const tx = hx - (m.dx / sp) * l
      const ty = hy - (m.dy / sp) * l
      const g = ctx.createLinearGradient(tx, ty, hx, hy)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(1, `rgba(236,242,255,${0.85 * env})`)
      ctx.strokeStyle = g
      ctx.lineWidth = 1.3
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(hx, hy)
      ctx.stroke()
      ctx.globalAlpha = env * 0.8
      ctx.drawImage(whiteGlow, hx - 7, hy - 7, 14, 14)
      ctx.globalAlpha = 1
    }

    // satellite gliding into Earth's shadow
    nextSat -= dt
    if (!sat && nextSat <= 0) spawnSat()
    if (sat) {
      sat.age += dt
      const p = sat.age / sat.dur
      if (p >= 1) {
        sat = null
        nextSat = 12 + Math.random() * 16
      } else {
        const x = sat.x0 + (sat.x1 - sat.x0) * p
        const y = sat.y0 + (sat.y1 - sat.y0) * p
        const a = smoothstep(0, 0.12, p) * (1 - smoothstep(0.62, 0.82, p))
        ctx.fillStyle = `rgba(255,255,255,${0.9 * a})`
        ctx.fillRect(x - 0.9, y - 0.9, 1.8, 1.8)
        ctx.globalAlpha = 0.45 * a
        ctx.drawImage(whiteGlow, x - 6, y - 6, 12, 12)
        ctx.globalAlpha = 1
      }
    }

    // city haze + lights
    for (const z of haze) {
      ctx.globalAlpha = z.a
      ctx.drawImage(warmGlow, z.x - z.r, z.y - z.r * 0.35, z.r * 2, z.r * 0.7)
    }
    ctx.globalAlpha = 1
    for (const l of lights) {
      const a = l.a * (0.86 + 0.14 * Math.sin(t * 1.7 + l.ph))
      ctx.fillStyle = `rgba(${l.c},${a})`
      ctx.fillRect(l.x - l.size / 2, l.y - l.size / 2, l.size, l.size)
    }

    // lightning inside storm clouds
    for (const s of storms) {
      if (t > s.next) {
        s.t0 = t
        s.pulses = [0, 0.06 + Math.random() * 0.05, 0.18 + Math.random() * 0.12]
        s.next = t + 2.5 + Math.random() * 7
      }
      const age = t - s.t0
      if (age < 0.6) {
        let b = 0
        for (const p of s.pulses) b = Math.max(b, Math.exp(-Math.pow((age - p) / 0.028, 2)))
        if (b > 0.01) {
          ctx.globalAlpha = b * 0.55
          ctx.drawImage(stormGlow, s.x - s.r, s.y - s.r * 0.32, s.r * 2, s.r * 0.64)
          ctx.globalAlpha = b * 0.9
          ctx.drawImage(whiteGlow, s.x - 8, s.y - 3, 16, 6)
          ctx.globalAlpha = 1
        }
      }
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  const loop = runLoop(step, { host })
  return {
    destroy() {
      loop.stop()
      surf.destroy()
    },
    setPaused: (p) => loop.setPaused(p),
  }
}
