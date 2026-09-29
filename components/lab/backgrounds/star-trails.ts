/**
 * 02 · Star Trails — a long exposure that runs while you read. Stars wheel around Polaris and
 * their trails lengthen the longer the page is open (capped near a quarter turn), with a
 * camera readout in the corner. Trails are drawn analytically as batched arcs, so there is
 * no accumulation buffer to smear or ghost. Clipped to the sky above the photo's real limb.
 */
import { createSurface, runLoop } from '../lib/surface'
import { mulberry32 } from '../lib/noise'
import { horizonMap, type HorizonMap } from '../lib/horizon'
import { glowSprite, type BgMount } from '../lib/types'

interface Trail { r: number; th: number; cls: number; col: number }

const COLS: [number, number, number][] = [
  [196, 214, 255],
  [255, 255, 255],
  [255, 236, 206],
  [255, 206, 170],
]
const WIDTH = [0.55, 0.85, 1.25, 1.8]
const ALPHA = [0.28, 0.42, 0.62, 0.85]
const SEGMENTS = 10

export const mount: BgMount = (host, { thumb }) => {
  const rand = mulberry32(421)
  let trails: Trail[] = []
  let groups: Trail[][] = []
  let pole = { x: 0, y: 0 }
  let hz: HorizonMap = horizonMap(1, 1)
  const glow = glowSprite([235, 242, 255], 48)

  function build(w: number, h: number) {
    hz = horizonMap(w, h)
    pole = hz.landscape ? { x: w * 0.76, y: h * 0.16 } : { x: w * 0.52, y: h * 0.12 }
    const maxR = Math.hypot(Math.max(pole.x, w - pole.x), Math.max(pole.y, hz.apexY - pole.y)) * 1.08
    const n = thumb ? 160 : Math.round(420 + (w * h) / 9000)
    trails = []
    for (let i = 0; i < n; i++) {
      const b = Math.pow(rand(), 2.4)
      const cls = b > 0.72 ? 3 : b > 0.42 ? 2 : b > 0.16 ? 1 : 0
      const u = rand()
      const col = u < 0.22 ? 0 : u < 0.72 ? 1 : u < 0.9 ? 2 : 3
      trails.push({ r: 6 + Math.sqrt(rand()) * maxR, th: rand() * Math.PI * 2, cls, col })
    }
    groups = Array.from({ length: 16 }, () => [])
    for (const tr of trails) groups[tr.cls * 4 + tr.col].push(tr)
  }

  const surf = createSurface(host, { onResize: (s) => build(s.w, s.h) })
  host.style.mixBlendMode = 'screen'

  let readout: HTMLDivElement | null = null
  if (!thumb) {
    readout = document.createElement('div')
    readout.className = 'trails-readout'
    host.appendChild(readout)
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const ss = Math.floor(s % 60)
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  const step = (t: number) => {
    const { ctx, w, h } = surf
    ctx.clearRect(0, 0, w, h)

    // Keep the exposure above the planet: clip to the sky side of the limb.
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(-10, -10)
    ctx.lineTo(w + 10, -10)
    for (let x = w + 10; x >= -10; x -= 16) ctx.lineTo(x, hz.limbY(x) - 4)
    ctx.closePath()
    ctx.clip()

    const exposure = 34 + t
    const L = Math.min(1.5, 0.3 + t * 0.016)
    const rot = t * 0.02

    ctx.lineCap = 'round'
    for (let g = 0; g < 16; g++) {
      const list = groups[g]
      if (!list.length) continue
      const cls = g >> 2
      const [r, gg, b] = COLS[g & 3]
      ctx.lineWidth = WIDTH[cls]
      for (let k = 0; k < SEGMENTS; k++) {
        const f = (k + 1) / SEGMENTS
        ctx.strokeStyle = `rgba(${r},${gg},${b},${ALPHA[cls] * Math.pow(f, 1.35)})`
        ctx.beginPath()
        for (const tr of list) {
          const head = tr.th + rot
          const a0 = head - L + (L * k) / SEGMENTS
          const a1 = head - L + (L * (k + 1)) / SEGMENTS
          ctx.moveTo(pole.x + tr.r * Math.cos(a0), pole.y + tr.r * Math.sin(a0))
          ctx.arc(pole.x, pole.y, tr.r, a0, a1)
        }
        ctx.stroke()
      }
    }
    // bright heads
    for (const list of groups.slice(12)) {
      for (const tr of list) {
        const a = tr.th + rot
        const x = pole.x + tr.r * Math.cos(a)
        const y = pole.y + tr.r * Math.sin(a)
        ctx.globalAlpha = 0.5
        ctx.drawImage(glow, x - 7, y - 7, 14, 14)
      }
    }
    ctx.globalAlpha = 1

    // Polaris itself
    ctx.drawImage(glow, pole.x - 9, pole.y - 9, 18, 18)
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.fillRect(pole.x - 1, pole.y - 1, 2, 2)
    if (!thumb) {
      ctx.font = 'italic 13px Georgia, serif'
      ctx.fillStyle = 'rgba(236,231,223,0.55)'
      ctx.fillText('Polaris', pole.x + 12, pole.y - 8)
    }

    // fade the exposure into the twilight glow near the horizon
    ctx.globalCompositeOperation = 'destination-out'
    const fade = ctx.createLinearGradient(0, hz.apexY * 0.35, 0, hz.apexY)
    fade.addColorStop(0, 'rgba(0,0,0,0)')
    fade.addColorStop(1, 'rgba(0,0,0,0.92)')
    ctx.fillStyle = fade
    ctx.fillRect(0, hz.apexY * 0.35, w, h)
    ctx.globalCompositeOperation = 'source-over'
    ctx.restore()

    if (readout) {
      const rec = Math.floor(t * 1.2) % 2 === 0 ? 'on' : ''
      readout.innerHTML = `<span class="rec ${rec}"></span>EXPOSURE ${fmt(exposure)}<i>·</i>ƒ/2.8<i>·</i>ISO 3200<i>·</i>14 mm`
    }
  }

  const loop = runLoop(step, { host })
  return {
    destroy() {
      loop.stop()
      surf.destroy()
      readout?.remove()
    },
    setPaused: (p) => loop.setPaused(p),
  }
}
