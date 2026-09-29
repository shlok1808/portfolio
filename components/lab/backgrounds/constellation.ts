/**
 * 04 · Feature Constellation — an SAE feature atlas as a planetarium.
 *
 * You stand at the centre of the decoder "hypersphere" (a 3-D stand-in): every star is one SAE
 * feature's unit decoder direction v_f. Features come in families that sit close together, so
 * some live in dense neighbourhoods and some are isolated; colour follows neighbour density
 * like stellar temperature (dense = warm, isolated = cool). A celestial grid turns with the
 * sky, the bigger families carry star-chart labels, and hovering a star opens its feature
 * dashboard: auto-interp explanation, activation density, top activating examples, the logits
 * it promotes and suppresses, and its nearest decoder-cosine neighbour. All illustrative.
 */
import { createSurface, runLoop, trackPointer, clamp, lerp } from '../lib/surface'
import { mulberry32, gaussian } from '../lib/noise'
import { readTheme, onThemeChange, rgba, fontFamily, type RGB } from '../lib/theme'
import { glowSprite, type BgMount } from '../lib/types'
import { THEMES } from './feature-atlas'

const K = 12

function tempColor(d: number): RGB {
  const stops: [number, RGB][] = [
    [0, [128, 164, 255]],
    [0.4, [214, 226, 255]],
    [0.62, [255, 244, 228]],
    [0.8, [255, 204, 150]],
    [1, [255, 150, 80]],
  ]
  for (let i = 1; i < stops.length; i++) {
    if (d <= stops[i][0]) {
      const [a, ca] = stops[i - 1]
      const [b, cb] = stops[i]
      const t = (d - a) / (b - a)
      return [lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), lerp(ca[2], cb[2], t)].map(Math.round) as RGB
    }
  }
  return stops[stops.length - 1][1]
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const fmtId = (n: number) => n.toLocaleString('en-US')

export const mount: BgMount = (host, { thumb }) => {
  const rand = mulberry32(3584)
  const N = thumb ? 2600 : window.innerWidth < 760 ? 3200 : 7600

  // ── feature directions: families (clusters) + loners ─────────────────────────
  const P = new Float32Array(N * 3)
  const fam = new Int16Array(N)
  const nC = 44
  const centers: number[][] = []
  const weights: number[] = []
  const sigmas: number[] = []
  for (let j = 0; j < nC; j++) {
    const v = [gaussian(rand), gaussian(rand), gaussian(rand)]
    const l = Math.hypot(v[0], v[1], v[2])
    centers.push(v.map((x) => x / l))
    weights.push(1 / Math.pow(j + 1, 0.75))
    sigmas.push(0.02 + rand() * 0.085)
  }
  const wsum = weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < N; i++) {
    let v: number[]
    if (rand() < 0.3) {
      v = [gaussian(rand), gaussian(rand), gaussian(rand)]
      fam[i] = -1
    } else {
      let r = rand() * wsum
      let j = 0
      while (r > weights[j] && j < nC - 1) r -= weights[j++]
      const c = centers[j]
      const s = sigmas[j]
      v = [c[0] + s * gaussian(rand), c[1] + s * gaussian(rand), c[2] + s * gaussian(rand)]
      fam[i] = j
    }
    const l = Math.hypot(v[0], v[1], v[2]) || 1
    P[i * 3] = v[0] / l
    P[i * 3 + 1] = v[1] / l
    P[i * 3 + 2] = v[2] / l
  }

  // ── k nearest neighbours by cosine (grid-accelerated, partial selection) ─────
  const G = 16
  const cell = (x: number) => Math.min(G - 1, Math.max(0, Math.floor(((x + 1) / 2) * G)))
  const grid = new Map<number, number[]>()
  const key = (a: number, b: number, c: number) => (a * G + b) * G + c
  for (let i = 0; i < N; i++) {
    const k = key(cell(P[i * 3]), cell(P[i * 3 + 1]), cell(P[i * 3 + 2]))
    let arr = grid.get(k)
    if (!arr) grid.set(k, (arr = []))
    arr.push(i)
  }
  const nbr = new Int32Array(N * K)
  const nbrCos = new Float32Array(N * K)
  const density = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const x = P[i * 3]
    const y = P[i * 3 + 1]
    const z = P[i * 3 + 2]
    const topJ: number[] = []
    const topC: number[] = []
    for (let radius = 1; radius < G && topC.length < K; radius++) {
      topJ.length = 0
      topC.length = 0
      const cx = cell(x)
      const cy = cell(y)
      const cz = cell(z)
      for (let a = cx - radius; a <= cx + radius; a++)
        for (let b = cy - radius; b <= cy + radius; b++)
          for (let c = cz - radius; c <= cz + radius; c++) {
            if (a < 0 || b < 0 || c < 0 || a >= G || b >= G || c >= G) continue
            const arr = grid.get(key(a, b, c))
            if (!arr) continue
            for (const j of arr) {
              if (j === i) continue
              const cs = x * P[j * 3] + y * P[j * 3 + 1] + z * P[j * 3 + 2]
              if (topC.length === K && cs <= topC[K - 1]) continue
              let at = topC.length
              while (at > 0 && topC[at - 1] < cs) at--
              topC.splice(at, 0, cs)
              topJ.splice(at, 0, j)
              if (topC.length > K) {
                topC.pop()
                topJ.pop()
              }
            }
          }
    }
    let s = 0
    for (let k = 0; k < K; k++) {
      nbr[i * K + k] = topJ[k] ?? i
      nbrCos[i * K + k] = topC[k] ?? 0
      s += topC[k] ?? 0
    }
    density[i] = s / K
  }
  const rankOf = (arr: Float32Array) => {
    const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => arr[a] - arr[b])
    const out = new Float32Array(N)
    order.forEach((i, r) => (out[i] = r / (N - 1)))
    return out
  }
  const d01 = rankOf(density)
  const maxCos = new Float32Array(N)
  for (let i = 0; i < N; i++) maxCos[i] = nbrCos[i * K]
  const mc01 = rankOf(maxCos)

  // per-star look + identity
  const mag = new Float32Array(N)
  const col: RGB[] = []
  const tw = new Float32Array(N)
  const fid = new Int32Array(N)
  const themeOf = new Int16Array(N)
  const freq = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const m = Math.pow(rand(), 2.8)
    mag[i] = clamp(0.18 + 0.82 * m * (0.55 + 0.6 * d01[i]), 0, 1)
    col.push(tempColor(clamp(d01[i] + (rand() - 0.5) * 0.12)))
    tw[i] = rand() * Math.PI * 2
    fid[i] = Math.floor(rand() * 16384)
    themeOf[i] = fam[i] >= 0 ? fam[i] % THEMES.length : Math.floor(rand() * THEMES.length)
    freq[i] = Math.pow(10, -4.4 + rand() * 2.6) * 100 // % of tokens
  }
  const famSize = new Int32Array(nC)
  for (let i = 0; i < N; i++) if (fam[i] >= 0) famSize[fam[i]]++
  const labelled = Array.from({ length: nC }, (_, j) => j).filter((j) => j < THEMES.length && famSize[j] > 24)

  // constellation lines: tight neighbours only
  const edges: number[] = []
  const edgeCos = Math.cos(0.075)
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < 2; k++) {
      const j = nbr[i * K + k]
      if (j > i && nbrCos[i * K + k] > edgeCos && d01[i] > 0.55) edges.push(i, j)
    }
  }

  // ── rendering setup ──────────────────────────────────────────────────────────
  let theme = readTheme()
  const unsub = onThemeChange((t) => (theme = t))
  const surf = createSurface(host)
  const pointer = trackPointer(host)
  const mono = fontFamily(host, '--lab-mono', 'ui-monospace, Menlo, monospace')
  const sprites = new Map<string, HTMLCanvasElement>()
  const spriteFor = (c: RGB) => {
    const k = c.join(',')
    let s = sprites.get(k)
    if (!s) sprites.set(k, (s = glowSprite(c, 48)))
    return s
  }

  let legend: HTMLDivElement | null = null
  let card: HTMLDivElement | null = null
  if (!thumb) {
    legend = document.createElement('div')
    legend.className = 'constellation-legend'
    legend.innerHTML =
      '<b>feature atlas</b> · each star is one SAE feature’s decoder direction v<sub>f</sub><br/>' +
      '<span class="warm">●</span> dense neighbourhood &nbsp; <span class="cool">●</span> isolated &nbsp;·&nbsp; lines join nearest neighbours by cosine<br/>' +
      '<i>illustrative 3-D stand-in for a 3,584-dimensional space — hover a star to open its dashboard</i>'
    host.appendChild(legend)
    card = document.createElement('div')
    card.className = 'fcard'
    card.setAttribute('aria-hidden', 'true')
    ;(host.parentElement ?? document.body).appendChild(card)
  }

  const sx = new Float32Array(N)
  const sy = new Float32Array(N)
  const vis = new Uint8Array(N)
  let sel = -1
  let selT = 0
  let cardFor = -2
  let demoNext = 2.2
  let yaw = 0.6
  let pitch = -0.18
  let lastPointer = -10

  const laneHalf = () => Math.min(window.innerWidth / 2, 20 * 16 + 60)
  const mastBottom = () => document.querySelector('.masthead')?.getBoundingClientRect().bottom ?? 0
  const inLane = (x: number, y: number, w: number) => Math.abs(x - w / 2) < laneHalf() && y > mastBottom() - 20

  const pick = (x: number, y: number, maxD: number) => {
    let best = -1
    let bd = maxD * maxD
    for (let i = 0; i < N; i++) {
      if (!vis[i]) continue
      const dx = sx[i] - x
      const dy = sy[i] - y
      const d = dx * dx + dy * dy
      if (d < bd && mag[i] > 0.22) {
        bd = d
        best = i
      }
    }
    return best
  }

  const hist = (seed: number) => {
    const r = mulberry32(seed)
    let h = ''
    for (let b = 0; b < 16; b++) {
      const v = Math.max(0.06, Math.min(1, Math.exp(-b * 0.28) * (0.75 + r() * 0.4)))
      h += `<i style="height:${Math.round(v * 100)}%"></i>`
    }
    return h
  }

  function fillCard(i: number) {
    if (!card) return
    const th = THEMES[themeOf[i]]
    const ex = th.examples.map((e) => `<p class="fcard-ex">${esc(e).replace(/\[(.+?)\]/, '<mark>$1</mark>')}</p>`).join('')
    const up = th.promotes.map((t) => `<span class="tok up">${esc(t)}</span>`).join('')
    const dn = th.suppresses.map((t) => `<span class="tok dn">${esc(t)}</span>`).join('')
    const nn = nbr[i * K]
    const nnCos = 0.2 + mc01[i] * 0.52
    const isolated = fam[i] < 0 || d01[i] < 0.3
    const pct = freq[i] < 0.01 ? freq[i].toFixed(4) : freq[i].toFixed(3)
    card.innerHTML =
      `<div class="fcard-head"><span>FEATURE ${fmtId(fid[i])}</span><span>GEMMA-2-9B · L20 · 16K</span></div>` +
      `<div class="fcard-label">${esc(th.label)}${isolated ? ' <em>· isolated</em>' : ''}</div>` +
      `<p class="fcard-explain">${esc(th.explain)}</p>` +
      `<div class="fcard-hist"><div class="bars">${hist(i + 7)}</div><span>fires on ${pct}% of tokens</span></div>` +
      `<div class="fcard-sec">top activations</div>${ex}` +
      `<div class="fcard-row"><span class="k">promotes</span>${up}</div>` +
      `<div class="fcard-row"><span class="k">suppresses</span>${dn}</div>` +
      `<div class="fcard-foot">nearest decoder neighbour · #${fmtId(fid[nn])} · cos ${nnCos.toFixed(2)}</div>`
  }

  function placeCard(i: number, w: number, h: number, show: boolean) {
    if (!card) return
    if (!show || i < 0 || !vis[i] || w < 1000) {
      card.classList.remove('on')
      return
    }
    if (cardFor !== i) {
      fillCard(i)
      cardFor = i
    }
    const cw = 292
    const ch = card.offsetHeight || 330
    const x = sx[i]
    const y = sy[i]
    let cx = x < w / 2 ? x - cw - 26 : x + 26
    if (cx < 12) cx = x + 26
    if (cx + cw > w - 12) cx = x - cw - 26
    const cy = clamp(y - ch * 0.35, 14, h - ch - 96)
    card.style.transform = `translate(${Math.round(cx)}px, ${Math.round(cy)}px)`
    card.classList.add('on')
  }

  function drawGrid(ctx: CanvasRenderingContext2D, project: (x: number, y: number, z: number) => [number, number, number] | null) {
    const ink: RGB = theme.mode === 'dark' ? [210, 220, 255] : theme.ink
    ctx.strokeStyle = rgba(ink, theme.mode === 'dark' ? 0.055 : 0.08)
    ctx.lineWidth = 1
    const seg = (pts: ([number, number, number] | null)[]) => {
      ctx.beginPath()
      let pen = false
      for (const p of pts) {
        if (!p) {
          pen = false
          continue
        }
        if (pen) ctx.lineTo(p[0], p[1])
        else ctx.moveTo(p[0], p[1])
        pen = true
      }
      ctx.stroke()
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts = []
      const la = (lat * Math.PI) / 180
      for (let k = 0; k <= 96; k++) {
        const lo = (k / 96) * Math.PI * 2
        pts.push(project(Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)))
      }
      seg(pts)
    }
    for (let m = 0; m < 12; m++) {
      const pts = []
      const lo = (m / 12) * Math.PI * 2
      for (let k = 0; k <= 60; k++) {
        const la = -Math.PI / 2 + (k / 60) * Math.PI
        pts.push(project(Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)))
      }
      seg(pts)
    }
  }

  const step = (t: number, dt: number) => {
    const { ctx, w, h } = surf
    ctx.clearRect(0, 0, w, h)
    const ps = pointer.state
    const scrollP = clamp(window.scrollY / Math.max(1, window.innerHeight * 2))
    const mx = ps.active ? ps.x / w - 0.5 : 0
    const my = ps.active ? ps.y / h - 0.5 : 0
    yaw = lerp(yaw, 0.6 + t * 0.011 + mx * 0.12, Math.min(1, dt * 3))
    pitch = lerp(pitch, -0.18 + my * 0.08 + scrollP * 0.35, Math.min(1, dt * 3))

    const cyw = Math.cos(yaw)
    const syw = Math.sin(yaw)
    const cp = Math.cos(pitch)
    const sp = Math.sin(pitch)
    const f = Math.max(w, h * 1.2) / 2 / Math.tan((100 * Math.PI) / 360)
    const cx0 = w / 2
    const cy0 = h / 2
    const project = (x: number, y: number, z: number): [number, number, number] | null => {
      const x1 = cyw * x + syw * z
      const z1 = -syw * x + cyw * z
      const y2 = cp * y - sp * z1
      const z2 = sp * y + cp * z1
      if (z2 > -0.12) return null
      return [cx0 + (f * x1) / -z2, cy0 - (f * y2) / -z2, z2]
    }

    if (!thumb) drawGrid(ctx, project)

    for (let i = 0; i < N; i++) {
      const p = project(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])
      if (!p || p[0] < -20 || p[1] < -20 || p[0] > w + 20 || p[1] > h + 20) {
        vis[i] = 0
        continue
      }
      vis[i] = 1
      sx[i] = p[0]
      sy[i] = p[1]
    }

    const accent = theme.accent
    const dark = theme.mode === 'dark'
    ctx.lineWidth = 0.7
    ctx.strokeStyle = rgba(accent, dark ? 0.22 : 0.3)
    ctx.beginPath()
    for (let e = 0; e < edges.length; e += 2) {
      const a = edges[e]
      const b = edges[e + 1]
      if (!vis[a] || !vis[b]) continue
      ctx.moveTo(sx[a], sy[a])
      ctx.lineTo(sx[b], sy[b])
    }
    ctx.stroke()

    ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over'
    for (let i = 0; i < N; i++) {
      if (!vis[i]) continue
      const m = mag[i] * (0.8 + 0.2 * Math.sin(t * 1.3 + tw[i]))
      const c = col[i]
      const s = 0.8 + m * 2.1
      if (dark) ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.45 + 0.55 * m})`
      else {
        const ink = theme.ink
        ctx.fillStyle = `rgba(${Math.round((c[0] + ink[0] * 2) / 3)},${Math.round((c[1] + ink[1] * 2) / 3)},${Math.round((c[2] + ink[2] * 2) / 3)},${0.3 + 0.6 * m})`
      }
      ctx.fillRect(sx[i] - s / 2, sy[i] - s / 2, s, s)
      if (m > 0.5 && dark) {
        const r = 10 + m * 16
        ctx.globalAlpha = 0.5 * m
        ctx.drawImage(spriteFor(c), sx[i] - r / 2, sy[i] - r / 2, r, r)
        ctx.globalAlpha = 1
      }
    }
    ctx.globalCompositeOperation = 'source-over'

    // star-chart labels on the big feature families
    if (!thumb) {
      const lc = ctx as CanvasRenderingContext2D & { letterSpacing: string }
      ctx.font = `10.5px ${mono}`
      ctx.textAlign = 'center'
      lc.letterSpacing = '2.5px'
      for (const j of labelled) {
        const c = centers[j]
        const p = project(c[0], c[1], c[2])
        if (!p || p[0] < 50 || p[0] > w - 50 || p[1] < 50 || p[1] > h - 50) continue
        if (Math.abs(p[0] - w / 2) < laneHalf() + 60) continue // keep labels out of the reading column and the name
        ctx.fillStyle = rgba(accent, dark ? 0.55 : 0.7)
        ctx.fillText(THEMES[j].label.toUpperCase(), p[0], p[1] - 28)
      }
      lc.letterSpacing = '0px'
      ctx.textAlign = 'left'
    }

    // selection: hover in the margins / header, or an idle demo while at the top of the page
    const reading = window.scrollY >= window.innerHeight * 0.3
    const overText = ps.active && inLane(ps.x, ps.y, w)
    const pointerLive = ps.active && performance.now() - ps.lastMove < 4000 && !overText
    if (pointerLive) {
      lastPointer = t
      const i = pick(ps.x, ps.y, 36)
      if (i >= 0 && i !== sel) {
        sel = i
        selT = t
      }
    } else if (overText || (reading && t - lastPointer > 0.5)) {
      sel = -1
    } else if (t - lastPointer > 3 && t > demoNext && !reading && !thumb) {
      demoNext = t + 6
      const pool: number[] = []
      for (let i = 0; i < N; i++) {
        if (!vis[i] || d01[i] < 0.8 || mag[i] < 0.3) continue
        const side = sx[i] < w * 0.24 || sx[i] > w * 0.76
        if (side && sy[i] > 120 && sy[i] < h - 280) pool.push(i)
      }
      if (pool.length) {
        sel = pool[Math.floor(Math.random() * pool.length)]
        selT = t
      }
    }
    if (sel >= 0 && vis[sel]) drawSelection(ctx, sel, t - selT)
    placeCard(sel, w, h, sel >= 0 && vis[sel])
  }

  function drawSelection(ctx: CanvasRenderingContext2D, i: number, age: number) {
    const grow = clamp(age / 0.6)
    const accent = theme.accent
    const ink: RGB = theme.mode === 'dark' ? [236, 231, 223] : theme.ink
    ctx.lineWidth = 1
    for (let k = 0; k < K; k++) {
      const j = nbr[i * K + k]
      if (!vis[j]) continue
      const g = clamp(grow * K - k)
      if (g <= 0) continue
      ctx.strokeStyle = rgba(accent, 0.75)
      ctx.beginPath()
      ctx.moveTo(sx[i], sy[i])
      ctx.lineTo(sx[i] + (sx[j] - sx[i]) * g, sy[i] + (sy[j] - sy[i]) * g)
      ctx.stroke()
      if (g >= 1) {
        ctx.beginPath()
        ctx.arc(sx[j], sy[j], 3.2, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
    const pulse = 1 + 0.15 * Math.sin(age * 4)
    ctx.strokeStyle = rgba(ink, 0.85)
    ctx.beginPath()
    ctx.arc(sx[i], sy[i], 7 * pulse, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = rgba(ink, 0.25)
    ctx.beginPath()
    ctx.arc(sx[i], sy[i], 13 * pulse, 0, Math.PI * 2)
    ctx.stroke()
  }

  const loop = runLoop(step, { host })
  return {
    destroy() {
      loop.stop()
      surf.destroy()
      pointer.destroy()
      unsub()
      legend?.remove()
      card?.remove()
    },
    setPaused: (p) => loop.setPaused(p),
  }
}
