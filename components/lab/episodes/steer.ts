/**
 * Episode 1 — Look Before You Steer (Khan*, Channawar* et al., ICML 2026 MI Workshop).
 * Every number on screen is from the paper; curves marked "schematic" are illustrations, as in
 * the paper's own Figure 1. Figure 3 (ρ vs relative depth) is redrawn from Table 3.
 */
import {
  C, at, env, ease, clamp, lerp, rng, text, math, line, arrow, panel, glow, bubble, stamp, buddy,
  axes, plot, sigmoid, knob, meter, riseWords, withAlpha, rrect,
  type Env, type Episode,
} from './engine'

// the paper's coefficient grid
const GRID = [0, 0.25, 0.5, 1, 2, 3, 5, 10, 20]
const gridIndex = (a: number) => {
  if (a <= 0) return 0
  for (let i = 1; i < GRID.length; i++) if (a <= GRID[i]) return i - 1 + (a - GRID[i - 1]) / (GRID[i] - GRID[i - 1])
  return GRID.length - 1
}
const alphaAt = (u: number) => {
  const i = Math.min(GRID.length - 2, Math.floor(u))
  return lerp(GRID[i], GRID[i + 1], u - i)
}
const B0 = 0.12
const T_THR = 0.1
const Bgold = (a: number) => B0 + 0.55 * sigmoid(1.6 * (a - 2.6))
const Bred = (a: number) => B0 + 0.6 * sigmoid(1.7 * (a - 2.3))
const Bblue = (a: number) => B0 + 0.45 * sigmoid(0.55 * (a - 11))
const ORANGE = '#ffae6b'

function signal(e: Env, x: number, y: number, p: number) {
  const { ctx, T } = e
  ctx.save()
  ctx.globalAlpha *= p
  ctx.fillStyle = C.gold
  ctx.beginPath()
  ctx.arc(x, y, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  for (let k = 1; k <= 3; k++) {
    const wave = 0.5 + 0.5 * Math.sin(T * 3 - k * 0.9)
    ctx.strokeStyle = withAlpha(C.gold, 0.25 + 0.6 * wave)
    const r = 8 + k * 15
    ctx.beginPath()
    ctx.arc(x, y, r, -0.62, 0.62)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y, r, Math.PI - 0.62, Math.PI + 0.62)
    ctx.stroke()
  }
  ctx.restore()
}

// ── scene 0: title ───────────────────────────────────────────────────────────
function title(e: Env) {
  const { t } = e
  const p0 = at(t, 0.1, 0.9)
  signal(e, 800, 238, p0)
  text(e, 'ACTIVATION STATION', 800, 320, { font: 'mono', size: 24, spacing: 9, color: C.gold, align: 'center', alpha: p0 })
  riseWords(e, 'Look Before You Steer', 800, 455, at(t, 0.5, 2.1, ease.linear), { size: 104, align: 'center', weight: 500 })
  text(e, 'Episode 1 · geometry predicts SAE feature steerability', 800, 532, {
    italic: true, size: 36, color: C.dim, align: 'center', alpha: at(t, 1.5, 2.3),
  })
  text(e, 'Khan*, Channawar*, Gurugubelli, Gupta, Shah  ·  ICML 2026 Mechanistic Interpretability Workshop', 800, 620, {
    font: 'mono', size: 19, color: 'rgba(236,231,223,0.42)', align: 'center', alpha: at(t, 2.1, 2.9),
  })
  const pk = at(t, 2.3, 3.3, ease.back)
  buddy(e, 215, 960 - 175 * pk, 62, C.red, { look: [800, 455], mood: 'happy', seed: 1 })
  buddy(e, 1390, 960 - 150 * pk, 52, C.blue, { look: [800, 455], seed: 2 })
}

// ── scene 1: meet the SAE ────────────────────────────────────────────────────
const TOKENS = ['How', 'do', 'I', 'pick', 'a', 'lock', '?']
const HBARS = (() => {
  const r = rng(3)
  return Array.from({ length: 8 }, () => (r() - 0.45) * 2)
})()
const ACTIVE = new Set([5, 17, 30, 41])

function hVector(e: Env, x: number, y: number, p: number, color = C.gold) {
  const { ctx } = e
  for (let i = 0; i < HBARS.length; i++) {
    const v = HBARS[i] * clamp(p * 1.4 - i * 0.03)
    const yy = y + i * 8
    ctx.fillStyle = withAlpha(color, 0.85)
    const w = v * 34
    ctx.fillRect(w < 0 ? x + w : x, yy, Math.abs(w), 5)
  }
  ctx.fillStyle = C.faint
  ctx.fillRect(x - 1, y - 3, 2, HBARS.length * 8 + 3)
}

function sae(e: Env) {
  const { t, ctx } = e
  // tokens
  TOKENS.forEach((tok, i) => {
    const p = at(t, 0.1 + i * 0.1, 0.5 + i * 0.1, ease.back)
    const x = 170 + i * 118
    ctx.save()
    ctx.globalAlpha *= clamp(p)
    panel(ctx, x - 48, 104 - 30 * (1 - p), 96, 54, { r: 12, fill: 'rgba(236,231,223,0.06)' })
    ctx.restore()
    text(e, tok, x, 141 - 30 * (1 - p), { size: 28, align: 'center', alpha: clamp(p) })
  })
  text(e, 'SALADBench-style prompt', 170 - 48, 84, { size: 18, font: 'mono', color: C.dim, alpha: at(t, 0.6, 1.2) })
  // residual stream
  const sp = at(t, 0.5, 1.6)
  const g = ctx.createLinearGradient(100, 0, 1500, 0)
  g.addColorStop(0, withAlpha(C.gold, 0.02))
  g.addColorStop(0.5, withAlpha(C.gold, 0.14))
  g.addColorStop(1, withAlpha(C.gold, 0.02))
  ctx.fillStyle = g
  rrect(ctx, 100, 212, 1400 * sp, 64, 32)
  ctx.fill()
  text(e, 'residual stream · layer 20', 1490, 205, { font: 'mono', size: 20, color: C.dim, align: 'right', alpha: sp })
  for (let k = 0; k < 7; k++) {
    const x = 170 + k * 118
    line(ctx, x, 158, x, 212, C.faint, 2, at(t, 0.8 + k * 0.05, 1.3 + k * 0.05))
  }
  // h rides the stream, then drops into the SAE
  const hp = at(t, 1.3, 2.4)
  const drop = at(t, 3.6, 4.6)
  const hx = lerp(lerp(160, 900, hp), 250, drop)
  const hy = lerp(244, 560, drop)
  if (hp > 0) {
    hVector(e, hx, hy - 31, hp)
    math(e, 'h', hx - 70, hy + 12, { size: 40, font: 'serif', italic: true, color: C.gold, alpha: hp })
    math(e, '∈ ℝ^{2304}', hx + 44, hy + 10, { size: 22, color: C.dim, alpha: hp * (1 - drop) })
  }
  // SAE machine
  const mp = at(t, 3.0, 3.9)
  if (mp > 0) {
    ctx.save()
    ctx.globalAlpha *= mp
    // encoder
    ctx.fillStyle = 'rgba(116,169,255,0.10)'
    ctx.strokeStyle = 'rgba(116,169,255,0.45)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(340, 470)
    ctx.lineTo(520, 400)
    ctx.lineTo(520, 740)
    ctx.lineTo(340, 670)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    // decoder
    ctx.fillStyle = 'rgba(255,123,94,0.10)'
    ctx.strokeStyle = 'rgba(255,123,94,0.45)'
    ctx.beginPath()
    ctx.moveTo(1080, 400)
    ctx.lineTo(1260, 470)
    ctx.lineTo(1260, 670)
    ctx.lineTo(1080, 740)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
    text(e, 'encoder', 430, 780, { font: 'mono', size: 20, color: C.dim, align: 'center', alpha: mp })
    math(e, 'decoder  W_{dec}', 1165, 780, { size: 20, color: C.dim, align: 'center', alpha: mp })
    // feature cells
    for (let i = 0; i < 48; i++) {
      const row = Math.floor(i / 12)
      const col = i % 12
      const x = 560 + col * 41
      const y = 470 + row * 50
      const on = ACTIVE.has(i) && at(t, 4.7 + (i % 5) * 0.08, 5.1 + (i % 5) * 0.08) > 0
      const popped = i === 30 && t > 6.0
      ctx.save()
      ctx.globalAlpha *= mp
      rrect(ctx, x, y, 30, 34, 7)
      ctx.fillStyle = on && !popped ? ORANGE : 'rgba(236,231,223,0.06)'
      ctx.fill()
      if (on && !popped) glow(ctx, x + 15, y + 17, 40, ORANGE, 0.4)
      ctx.restore()
    }
    text(e, '16,384 features · only a handful are active', 800, 700, { font: 'mono', size: 21, color: C.dim, align: 'center', alpha: at(t, 5, 5.6) })
    // reconstruction
    const rp = at(t, 5.3, 6.1)
    if (rp > 0) {
      hVector(e, 1350, 520, rp, C.dim)
      math(e, 'ĥ ≈ h', 1330, 500, { size: 30, font: 'serif', italic: true, color: C.dim, alpha: rp })
    }
  }
  // feature 30 pops out and becomes a character
  const pop = at(t, 6.0, 7.0, ease.back)
  if (t > 6.0) {
    const sx = 560 + 6 * 41 + 15
    const sy = 470 + 2 * 50 + 17
    const x = lerp(sx, 800, pop)
    const y = lerp(sy, 385, pop)
    buddy(e, x, y, lerp(15, 58, pop), ORANGE, { look: [1100, 300], mood: pop > 0.9 ? 'happy' : 'surprised', seed: 5, label: pop > 0.95 ? 'feature f' : undefined })
    const vp = at(t, 7.4, 8.3)
    arrow(ctx, x + 62, y - 10, x + 262, y - 44, ORANGE, 5, vp, 20)
    math(e, 'v_f', x + 276, y - 40, { size: 36, font: 'serif', italic: true, color: ORANGE, alpha: vp })
    math(e, '= row f of W_{dec}', x + 322, y - 40, { size: 22, color: C.dim, alpha: at(t, 8.0, 8.6) })
  }
}

// ── scene 2: steering ────────────────────────────────────────────────────────
function steering(e: Env) {
  const { t, ctx } = e
  const eq = 'h′ = h + α · v_f'
  const tp = at(t, 0.2, 1.3, ease.linear)
  const shown = eq.slice(0, Math.ceil(eq.length * tp))
  math(e, shown, 800, 160, { size: 60, align: 'center', color: C.ink })
  const alpha = lerp(0, 5, at(t, 2.2, 7.0, ease.inOut))
  const idx = gridIndex(alpha)
  const b = Bgold(alpha)
  const ap = at(t, 1.0, 1.8)
  // the feature pushes
  const push = clamp(alpha / 5)
  buddy(e, 250, 470, 66, ORANGE, {
    look: [800, 470],
    mood: push > 0.55 ? 'determined' : 'happy',
    squash: Math.sin(t * 9) * 0.25 * push,
    seed: 5,
    label: 'feature f',
    alpha: ap,
  })
  arrow(ctx, 330, 470, 330 + 120 + push * 170, 470, ORANGE, 6 + push * 5, ap, 24)
  math(e, 'α·v_f', 350 + push * 85, 440, { size: 28, color: ORANGE, alpha: ap })
  // knob
  knob(e, 800, 470, 92, idx / 8, 'steering coefficient α', `α = ${alpha < 1 ? alpha.toFixed(2) : alpha.toFixed(1)}`, C.gold)
  // prompt + reply
  text(e, '“How do I pick a lock?”', 1270, 280, { size: 28, italic: true, color: C.dim, align: 'center', alpha: ap })
  const refusing = alpha >= 2.6
  const flip = refusing ? at(t, 5.2, 5.6, ease.back) : 1
  bubble(e, 1060, 318, 420, 96, refusing ? 'I can’t help with that.' : 'Sure! Here’s how you…', {
    tail: 'left', size: 30, alpha: ap * (refusing ? flip : 1),
    color: refusing ? 'rgba(255,211,110,0.95)' : 'rgba(236,231,223,0.94)',
  })
  text(e, 'Gemma-2-2B', 1060, 450, { size: 20, font: 'mono', color: C.dim, alpha: ap })
  meter(e, 1060, 620, 420, 22, b * ap, 'refusal rate · 100 prompts', C.red)
  const q = at(t, 7.6, 8.2, ease.back)
  if (q > 0) {
    text(e, '?', 925, 330 - 20 * q, { size: 84, color: C.gold, alpha: q, weight: 600 })
    text(e, 'how far do we have to turn it?', 800, 700, { size: 32, italic: true, align: 'center', color: C.ink, alpha: q })
  }
}

// ── scene 3: α* ──────────────────────────────────────────────────────────────
function alphaStar(e: Env) {
  const { t, ctx } = e
  const ax = axes(e, 170, 150, 780, 520, {
    xr: [0, 8],
    yr: [0, 0.8],
    xticks: GRID.map((v, i) => [i, String(v)] as [number, string]),
    yticks: [[0, '0'], [0.4, '.4'], [0.8, '.8']],
    xlabel: 'steering coefficient α',
    ylabel: 'refusal rate B(α, f)',
    p: at(t, 0, 0.9),
  })
  const lp = at(t, 0.9, 1.6)
  ctx.setLineDash([8, 8])
  line(ctx, ax.X(0), ax.Y(B0), ax.X(8), ax.Y(B0), C.faint, 2, lp)
  line(ctx, ax.X(0), ax.Y(B0 + T_THR), ax.X(8), ax.Y(B0 + T_THR), withAlpha(C.gold, 0.8), 2, lp)
  ctx.setLineDash([])
  text(e, 'B(0)', ax.X(8) + 12, ax.Y(B0) + 8, { size: 20, font: 'mono', color: C.dim, alpha: lp })
  math(e, 'B(0) + T', ax.X(8) + 12, ax.Y(B0 + T_THR) - 4, { size: 20, color: C.gold, alpha: lp })
  math(e, 'T = 0.10', ax.X(8) + 12, ax.Y(B0 + T_THR) + 22, { size: 18, color: C.dim, alpha: lp })
  // the sweep, point by point
  const shown = Math.floor(clamp((t - 1.6) / 0.45, 0, 9))
  ctx.strokeStyle = ORANGE
  ctx.lineWidth = 4
  ctx.beginPath()
  for (let i = 0; i < shown; i++) {
    const x = ax.X(i)
    const y = ax.Y(Bgold(GRID[i]))
    if (i) ctx.lineTo(x, y)
    else ctx.moveTo(x, y)
  }
  ctx.stroke()
  for (let i = 0; i < shown; i++) {
    const x = ax.X(i)
    const y = ax.Y(Bgold(GRID[i]))
    const born = 1.6 + i * 0.45
    const ring = at(t, born, born + 0.5)
    ctx.fillStyle = ORANGE
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.fill()
    if (ring < 1) {
      ctx.strokeStyle = withAlpha(ORANGE, 1 - ring)
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, 8 + ring * 26, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  // cost counter
  const gens = shown * 100
  panel(ctx, 1010, 170, 500, 150, { r: 16 })
  text(e, 'generations so far', 1040, 215, { size: 20, font: 'mono', color: C.dim })
  text(e, gens.toLocaleString(), 1040, 290, { size: 64, font: 'mono', color: C.ink, weight: 500 })
  text(e, `${shown}/9 α values × 100 prompts`, 1486, 290, { size: 18, font: 'mono', color: C.dim, align: 'right' })
  // α*
  const sp = at(t, 5.8, 6.7)
  const iStar = 4
  if (sp > 0) {
    const x = ax.X(iStar)
    ctx.setLineDash([6, 6])
    line(ctx, x, ax.Y(Bgold(GRID[iStar])), x, ax.Y(0), C.gold, 2.5, sp)
    ctx.setLineDash([])
    glow(ctx, x, ax.Y(Bgold(GRID[iStar])), 50, C.gold, 0.6 * sp)
    stamp(e, 'α*(f) = 2', x + 20, ax.Y(0.62), sp, C.gold, { size: 30 })
  }
  const dp = at(t, 6.8, 7.6)
  panel(ctx, 1010, 360, 500, 150, { r: 16, fill: withAlpha(C.gold, 0.06 * dp), stroke: withAlpha(C.gold, 0.4 * dp) })
  text(e, 'steerability', 1040, 405, { size: 20, font: 'mono', color: withAlpha(C.gold, dp) })
  math(e, 'α*(f) = min{ α : B(α,f) − B(0) ≥ T }', 1040, 465, { size: 21, color: C.ink, alpha: dp })
  const lp2 = at(t, 8.2, 9)
  text(e, 'Could we just look first?', 1250, 600, { size: 40, italic: true, align: 'center', alpha: lp2 })
  // an eye, looking
  if (lp2 > 0) {
    ctx.save()
    ctx.globalAlpha *= lp2
    ctx.strokeStyle = C.gold
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(1180, 680)
    ctx.quadraticCurveTo(1250, 630, 1320, 680)
    ctx.quadraticCurveTo(1250, 730, 1180, 680)
    ctx.stroke()
    ctx.fillStyle = C.gold
    ctx.beginPath()
    ctx.arc(1250 + 8 * Math.sin(e.T * 2), 680, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// ── scene 4: decoder-space neighbourhoods ────────────────────────────────────
const CX = 800
const CY = 480
const R = 330
const RED_P: [number, number] = [1010, 400]
const BLUE_P: [number, number] = [560, 590]
const DOTS = (() => {
  const r = rng(11)
  const g = () => {
    const u = Math.max(1e-6, r())
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r())
  }
  const pts: [number, number][] = []
  const add = (x: number, y: number) => {
    if (Math.hypot(x - CX, y - CY) < R - 12 && Math.hypot(x - BLUE_P[0], y - BLUE_P[1]) > 135) pts.push([x, y])
  }
  for (let i = 0; i < 44; i++) add(RED_P[0] + g() * 52, RED_P[1] + g() * 48)
  for (let i = 0; i < 22; i++) add(700 + g() * 60, 300 + g() * 55)
  for (let i = 0; i < 20; i++) add(880 + g() * 60, 660 + g() * 45)
  for (let i = 0; i < 90; i++) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r()) * R
    add(CX + Math.cos(a) * d, CY + Math.sin(a) * d)
  }
  return pts.filter(([x, y]) => Math.hypot(x - RED_P[0], y - RED_P[1]) > 30)
})()
const nearest = (p: [number, number], k: number) =>
  DOTS.map((d, i) => ({ i, d: Math.hypot(d[0] - p[0], d[1] - p[1]) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map((o) => o.i)
const RED_NN = nearest(RED_P, 12)
const BLUE_NN = nearest(BLUE_P, 12)

function decoderSpace(e: Env, p: number, dotsAlpha = 1) {
  const { ctx } = e
  ctx.save()
  ctx.globalAlpha *= p
  ctx.strokeStyle = C.faint
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(CX, CY, R, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = withAlpha('#ece7df', 0.02)
  ctx.fill()
  for (const [x, y] of DOTS) {
    ctx.fillStyle = `rgba(236,231,223,${0.4 * dotsAlpha})`
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function neighbourhood(e: Env) {
  const { t, ctx } = e
  const dp = at(t, 0, 1.2)
  decoderSpace(e, dp)
  text(e, 'decoder space', 150, 140, { size: 40, alpha: dp })
  math(e, 'each dot is a row of W_{dec}: one feature’s direction', 150, 184, { size: 22, color: C.dim, alpha: dp })
  const bp = at(t, 1.4, 2.4, ease.back)
  // neighbour lines
  const kp = at(t, 3.4, 6.2, ease.linear)
  RED_NN.forEach((j, n) => {
    const q = clamp(kp * 12 - n)
    line(ctx, RED_P[0], RED_P[1], DOTS[j][0], DOTS[j][1], withAlpha(C.red, 0.75), 2.5, q)
  })
  BLUE_NN.forEach((j, n) => {
    const q = clamp(kp * 12 - n)
    line(ctx, BLUE_P[0], BLUE_P[1], DOTS[j][0], DOTS[j][1], withAlpha(C.blue, 0.6), 2.5, q)
  })
  buddy(e, RED_P[0], RED_P[1], 34 * bp, C.red, { look: [RED_P[0] - 60, RED_P[1] + 20], mood: kp > 0.5 ? 'happy' : 'neutral', seed: 1, alpha: clamp(bp) })
  buddy(e, BLUE_P[0], BLUE_P[1], 34 * bp, C.blue, { look: [BLUE_P[0] + 80, BLUE_P[1] - 60], mood: kp > 0.5 ? 'worried' : 'neutral', seed: 2, alpha: clamp(bp) })
  text(e, 'crowded', RED_P[0] + 50, RED_P[1] - 44, { size: 26, italic: true, color: C.red, alpha: clamp(bp) })
  text(e, 'isolated', BLUE_P[0] - 50, BLUE_P[1] + 72, { size: 26, italic: true, color: C.blue, alpha: clamp(bp), align: 'right' })
  if (kp > 0.6) bubble(e, BLUE_P[0] - 160, BLUE_P[1] - 130, 110, 64, '…', { tail: 'down', size: 34, alpha: at(t, 5.6, 6.2) })
  // readouts
  const r1 = at(t, 4.2, 5.0)
  panel(ctx, 1170, 170, 330, 250, { r: 16, stroke: withAlpha(C.red, 0.45 * r1), fill: withAlpha(C.red, 0.05 * r1) })
  text(e, 'crowded feature', 1195, 212, { size: 20, font: 'mono', color: withAlpha(C.red, r1) })
  text(e, 'neighbour density', 1195, 262, { size: 20, font: 'mono', color: C.dim, alpha: r1 })
  text(e, '0.29', 1475, 262, { size: 26, font: 'mono', color: C.ink, align: 'right', alpha: r1 })
  const m1 = at(t, 7.0, 7.8)
  text(e, 'max cos', 1195, 312, { size: 20, font: 'mono', color: C.dim, alpha: m1 })
  text(e, '0.71', 1475, 312, { size: 26, font: 'mono', color: C.ink, align: 'right', alpha: m1 })
  text(e, '→ cheap to steer?', 1195, 380, { size: 24, italic: true, color: C.red, alpha: at(t, 8.4, 9.2) })

  panel(ctx, 1170, 460, 330, 250, { r: 16, stroke: withAlpha(C.blue, 0.45 * r1), fill: withAlpha(C.blue, 0.05 * r1) })
  text(e, 'isolated feature', 1195, 502, { size: 20, font: 'mono', color: withAlpha(C.blue, r1) })
  text(e, 'neighbour density', 1195, 552, { size: 20, font: 'mono', color: C.dim, alpha: r1 })
  text(e, '0.14', 1475, 552, { size: 26, font: 'mono', color: C.ink, align: 'right', alpha: r1 })
  text(e, 'max cos', 1195, 602, { size: 20, font: 'mono', color: C.dim, alpha: m1 })
  text(e, '0.24', 1475, 602, { size: 26, font: 'mono', color: C.ink, align: 'right', alpha: m1 })
  text(e, '→ expensive?', 1195, 670, { size: 24, italic: true, color: C.blue, alpha: at(t, 8.4, 9.2) })
  // formulas
  const fp = at(t, 3.6, 4.4)
  math(e, 'density(f) = mean_{g ∈ 50-NN(f)} cos(v_f, v_g)', 150, 800, { size: 24, color: C.ink, alpha: fp })
  math(e, 'maxcos(f) = max_{g≠f} cos(v_f, v_g)', 150, 846, { size: 24, color: C.ink, alpha: m1 })
}

// ── scene 5: co-recruitment race ─────────────────────────────────────────────
// when (in scene time) each lane's push first reaches the threshold
const RACE_T = (B: (a: number) => number) => {
  for (let k = 0; k <= 800; k++) {
    const u = (k / 800) * 8
    if (B(alphaAt(u)) - B0 >= T_THR) return 1.0 + (u / 8) * 8.6
  }
  return 99
}
const RED_T = RACE_T(Bred)
const BLUE_T = RACE_T(Bblue)

const NEIGH = [
  [-95, -70, 0.78], [-120, 30, 0.62], [-30, -120, 0.7], [70, -95, 0.55], [-60, 105, 0.48], [95, 60, 0.4],
] as const

function corecruit(e: Env) {
  const { t, ctx } = e
  const u = lerp(0, 8, at(t, 1.0, 9.6, ease.linear))
  const a = alphaAt(u)
  const lp = at(t, 0, 0.8)
  // left: the race
  panel(ctx, 70, 110, 700, 700, { r: 22, fill: 'rgba(236,231,223,0.025)' })
  text(e, 'push toward refusal', 100, 160, { size: 22, font: 'mono', color: C.dim, alpha: lp })
  const finish = 640
  ctx.setLineDash([10, 10])
  line(ctx, finish, 190, finish, 790, withAlpha(C.gold, 0.7), 3, lp)
  ctx.setLineDash([])
  text(e, 'threshold T', finish, 182, { size: 20, font: 'mono', color: C.gold, align: 'center', alpha: lp })
  // crowded lane
  const ry = 330
  const redPush = clamp((Bred(a) - B0) / T_THR) // 1 = reached threshold
  const bluePush = clamp((Bblue(a) - B0) / T_THR)
  const x0 = 200
  NEIGH.forEach(([dx, dy, c], i) => {
    const nx = x0 + dx * 0.9
    const ny = ry + dy * 0.9
    buddy(e, nx, ny, 17, '#e8a28f', { eyes: true, seed: 10 + i, look: [finish, ny], alpha: lp, mood: redPush > 0.2 ? 'determined' : 'neutral' })
    const len = Math.min(170, a * 60 * c)
    if (len > 3) arrow(ctx, nx + 16, ny, nx + 16 + len, ny, withAlpha(C.red, 0.55), 3, 1, 12)
  })
  const redLen = lerp(0, finish - x0 - 50, redPush)
  buddy(e, x0, ry, 46, C.red, { look: [finish, ry], mood: redPush >= 1 ? 'happy' : 'determined', seed: 1, squash: Math.sin(t * 10) * 0.12 * (1 - redPush), alpha: lp })
  if (redLen > 4) arrow(ctx, x0 + 50, ry, x0 + 50 + redLen, ry, C.red, 9, 1, 26)
  if (redPush >= 1) stamp(e, '✓', finish + 40, ry - 50, at(t, RED_T, RED_T + 0.5), C.red, { size: 30 })
  math(e, '+ Σ α·cos(v_f, v_g)', x0 - 40, ry + 150, { size: 22, color: withAlpha(C.red, 0.9), alpha: at(t, 1.8, 2.6) })
  text(e, 'crowded: its neighbours push too', 100, 560 - 40, { size: 24, italic: true, color: C.red, alpha: at(t, 1.2, 2) })
  // isolated lane
  const by = 680
  const blueLen = lerp(0, finish - x0 - 50, bluePush)
  buddy(e, x0, by, 46, C.blue, { look: [finish, by], mood: bluePush >= 1 ? 'happy' : a > 3 ? 'worried' : 'determined', seed: 2, squash: Math.sin(t * 12) * 0.14 * (1 - bluePush), sweat: a > 4 && bluePush < 1 ? 1 : 0, alpha: lp })
  if (blueLen > 4) arrow(ctx, x0 + 50, by, x0 + 50 + blueLen, by, C.blue, 9, 1, 26)
  if (bluePush >= 1) stamp(e, '✓', finish + 40, by - 50, at(t, BLUE_T, BLUE_T + 0.5), C.blue, { size: 30 })
  text(e, 'isolated: pushes alone', 100, 790, { size: 24, italic: true, color: C.blue, alpha: at(t, 1.2, 2) })
  // right: dose–response
  const ax = axes(e, 930, 150, 560, 520, {
    xr: [0, 8],
    yr: [0, 0.8],
    xticks: GRID.map((v, i) => [i, String(v)] as [number, string]).filter((_, i) => i % 2 === 0 || i === 8 || i === 5),
    yticks: [[0, '0'], [0.4, '.4'], [0.8, '.8']],
    xlabel: 'α',
    ylabel: 'refusal rate',
    p: lp,
  })
  ctx.setLineDash([8, 8])
  line(ctx, ax.X(0), ax.Y(B0 + T_THR), ax.X(8), ax.Y(B0 + T_THR), withAlpha(C.gold, 0.7), 2, lp)
  ctx.setLineDash([])
  plot(ctx, ax, (uu) => Bred(alphaAt(uu)), 0, 8, C.red, 4.5, u / 8)
  plot(ctx, ax, (uu) => Bblue(alphaAt(uu)), 0, 8, C.blue, 4.5, u / 8)
  line(ctx, ax.X(u), ax.Y(0), ax.X(u), ax.Y(0.8), withAlpha('#ece7df', 0.25), 2)
  text(e, `α = ${a < 1 ? a.toFixed(2) : a.toFixed(1)}`, ax.X(u), ax.Y(0.8) - 14, { size: 20, font: 'mono', align: 'center', color: C.ink })
  if (redPush >= 1) {
    const q = at(t, RED_T, RED_T + 0.6)
    glow(ctx, ax.X(4), ax.Y(Bred(2)), 44, C.red, 0.7 * q)
    text(e, 'α* = 2', ax.X(4) - 12, ax.Y(Bred(2)) - 26, { size: 22, font: 'mono', color: C.red, align: 'right', alpha: q })
  }
  if (bluePush >= 1) {
    const q = at(t, BLUE_T, BLUE_T + 0.6)
    glow(ctx, ax.X(7), ax.Y(Bblue(10)), 44, C.blue, 0.7 * q)
    text(e, 'α* = 10', ax.X(7) + 14, ax.Y(Bblue(10)) + 40, { size: 22, font: 'mono', color: C.blue, align: 'center', alpha: q })
  }
  text(e, 'schematic', ax.X(8), ax.Y(0.8) + 24, { size: 16, font: 'mono', color: 'rgba(236,231,223,0.35)', align: 'right', alpha: lp })
}

// ── scene 6: results (Figure 3, from Table 3) ────────────────────────────────
const FIG3: { m: string; label: string; d: number; r: number; c: string; open?: boolean; shape: 'o' | 's' | 'd' }[] = [
  { m: '9B', label: '9B L20', d: 48, r: -0.546, c: '#ff6f6f', shape: 's' },
  { m: 'Llama', label: 'Llama L15', d: 47, r: -0.188, c: '#8fd6a8', shape: 'd' },
  { m: 'Llama', label: 'Llama L23', d: 72, r: -0.22, c: '#8fd6a8', shape: 'd' },
  { m: '2B', label: '2B L20', d: 77, r: -0.288, c: '#74a9ff', shape: 'o' },
  { m: '2B', label: '2B L22', d: 85, r: -0.512, c: '#74a9ff', shape: 'o' },
  { m: '9B', label: '9B L36', d: 86, r: -0.327, c: '#ff6f6f', shape: 's' },
  { m: '2B', label: '2B L24', d: 92, r: -0.125, c: '#74a9ff', shape: 'o', open: true },
]

function results(e: Env) {
  const { t, ctx } = e
  const ax = axes(e, 190, 150, 720, 560, {
    xr: [42, 97],
    yr: [-0.65, 0.05],
    xticks: [[50, '50'], [60, '60'], [70, '70'], [80, '80'], [90, '90']],
    yticks: [[0, '0'], [-0.2, '−.2'], [-0.4, '−.4'], [-0.6, '−.6']],
    xlabel: 'relative layer depth (%)',
    ylabel: 'Spearman ρ (density vs log α*)',
    p: at(t, 0, 0.9),
  })
  const sp = at(t, 0.6, 1.4)
  ctx.fillStyle = `rgba(236,231,223,${0.05 * sp})`
  ctx.fillRect(ax.X(85), ax.Y(0.05), ax.X(97) - ax.X(85), ax.Y(-0.65) - ax.Y(0.05))
  text(e, 'deep', ax.X(91), ax.Y(0.05) + 30, { size: 20, font: 'mono', color: C.dim, align: 'center', alpha: sp })
  ctx.setLineDash([6, 8])
  line(ctx, ax.X(42), ax.Y(0), ax.X(97), ax.Y(0), C.faint, 2, sp)
  ctx.setLineDash([])
  FIG3.forEach((pt, i) => {
    const q = at(t, 1.2 + i * 0.5, 1.7 + i * 0.5, ease.back)
    if (q <= 0) return
    const x = ax.X(pt.d)
    const y = ax.Y(pt.r)
    const s = 13 * q
    ctx.save()
    ctx.fillStyle = pt.c
    ctx.strokeStyle = pt.c
    ctx.lineWidth = 3
    ctx.beginPath()
    if (pt.shape === 'o') ctx.arc(x, y, s, 0, Math.PI * 2)
    else if (pt.shape === 's') ctx.rect(x - s, y - s, s * 2, s * 2)
    else {
      ctx.moveTo(x, y - s * 1.25)
      ctx.lineTo(x + s * 1.1, y)
      ctx.lineTo(x, y + s * 1.25)
      ctx.lineTo(x - s * 1.1, y)
      ctx.closePath()
    }
    if (pt.open) ctx.stroke()
    else ctx.fill()
    ctx.restore()
    text(e, pt.label, x + 20, y - 14, { size: 19, font: 'mono', color: pt.c, alpha: clamp(q) })
  })
  const hl = at(t, 5.0, 5.8)
  if (hl > 0) {
    const x = ax.X(48)
    const y = ax.Y(-0.546)
    glow(ctx, x, y, 70, '#ff6f6f', 0.6 * hl * (0.8 + 0.2 * Math.sin(e.T * 4)))
    panel(ctx, x + 40, y + 20, 290, 84, { r: 12, fill: 'rgba(15,14,13,0.9)', stroke: withAlpha('#ff6f6f', 0.6 * hl) })
    math(e, 'ρ = −0.546', x + 60, y + 58, { size: 26, color: C.ink, alpha: hl })
    math(e, 'p < 10^{−6},  n = 73', x + 60, y + 90, { size: 19, color: C.dim, alpha: hl })
  }
  // legend
  const lg = at(t, 1, 1.8)
  ;[
    ['Gemma-2-2B', '#74a9ff'],
    ['Gemma-2-9B', '#ff6f6f'],
    ['Llama-3.1-8B', '#8fd6a8'],
  ].forEach(([n, c], i) => {
    ctx.fillStyle = withAlpha(c, lg)
    ctx.beginPath()
    ctx.arc(ax.X(62), ax.Y(0.05) + 30 + i * 30 - 6, 7, 0, Math.PI * 2)
    ctx.fill()
    text(e, n, ax.X(62) + 16, ax.Y(0.05) + 30 + i * 30, { size: 19, font: 'mono', color: C.dim, alpha: lg })
  })
  // badges
  const badges: [string, string][] = [
    ['✓  Gemma-2 2B and 9B', C.green],
    ['✓  16K and 65K SAE widths', C.green],
    ['✓  Llama-3.1-8B, cross-architecture', C.green],
    ['~  Qwen3-8B: steerable or not, not how much', C.yellow],
    ['✗  fades near the output layers', C.red],
  ]
  badges.forEach(([s, c], i) => {
    const q = at(t, 6.2 + i * 0.8, 6.8 + i * 0.8, ease.back)
    if (q <= 0) return
    const y = 190 + i * 96
    ctx.save()
    ctx.globalAlpha *= clamp(q)
    ctx.translate(1000 + (1 - q) * 40, y)
    panel(ctx, 0, 0, 520, 70, { r: 14, stroke: withAlpha(c, 0.5), fill: withAlpha(c, 0.07) })
    ctx.restore()
    text(e, s, 1026 + (1 - q) * 40, y + 45, { size: 24, color: c, alpha: clamp(q) })
  })
  const au = at(t, 10.4, 11.2)
  text(e, 'AUROC 0.61–0.82 across conditions', 1000, 692, { size: 17, font: 'mono', color: C.dim, alpha: au })
  text(e, 'easy features’ neighbours: 3.4× more refusal-aligned', 1000, 720, { size: 17, font: 'mono', color: C.dim, alpha: au })
}

// ── scene 7: the moral ───────────────────────────────────────────────────────
function moral(e: Env) {
  const { t, T } = e
  riseWords(e, 'Look before you steer.', 800, 330, at(t, 0.2, 1.6, ease.linear), { size: 96, align: 'center', weight: 500 })
  math(e, 'rank features by steering cost from W_{dec} alone, before a single sweep', 800, 410, {
    size: 30, align: 'center', color: C.dim, font: 'serif', italic: true, alpha: at(t, 1.2, 2),
  })
  const bp = at(t, 1.8, 2.8, ease.back)
  buddy(e, 690, 610 + Math.sin(T * 3) * 8, 58 * bp, C.red, { mood: 'happy', look: [760, 540], seed: 1, alpha: clamp(bp) })
  buddy(e, 910, 610 + Math.sin(T * 3 + 1.2) * 8, 58 * bp, C.blue, { mood: 'happy', look: [840, 540], seed: 2, alpha: clamp(bp) })
  buddy(e, 800, 640 + Math.sin(T * 3 + 2.1) * 8, 46 * bp, ORANGE, { mood: 'smug', look: [800, 400], seed: 5, alpha: clamp(bp) })
  const lp = at(t, 3.0, 3.8)
  text(e, 'ICML 2026 · Mechanistic Interpretability Workshop   ·   COLM 2026 · Actionable Interpretability', 800, 790, {
    size: 20, font: 'mono', color: C.gold, align: 'center', alpha: lp,
  })
  text(e, 'next time: do crowded features cause more off-target effects?', 800, 840, {
    size: 22, italic: true, color: C.dim, align: 'center', alpha: at(t, 4.4, 5.2),
  })
}

export const STEER: Episode = {
  slug: 'steer',
  number: 1,
  title: 'Look Before You Steer',
  subtitle: 'Geometry predicts SAE feature steerability',
  poster: 36.5,
  link: { href: 'https://openreview.net/pdf?id=UIaLI9XPpq', label: 'read the paper' },
  scenes: [
    {
      id: 'title',
      title: 'Cold open',
      dur: 5.5,
      draw: title,
      captions: [[0.3, 'Today on <b>Activation Station</b>: can we tell which features are easy to steer, <i>before</i> we ever steer them?']],
    },
    {
      id: 'sae',
      title: 'Meet the SAE',
      dur: 9.5,
      draw: sae,
      captions: [
        [0, 'Inside Gemma-2, every token leaves a vector <b>h</b> in the <b>residual stream</b>.'],
        [3.2, 'A <b>sparse autoencoder</b> rewrites <code>h</code> as a few active features out of 16,384.'],
        [6.4, 'Each feature <code>f</code> owns a <b>decoder direction</b> <code>v<sub>f</sub></code>: one row of <code>W<sub>dec</sub></code>.'],
      ],
    },
    {
      id: 'steer',
      title: 'Steering',
      dur: 10.5,
      draw: steering,
      captions: [
        [0, '<b>Steering</b> adds a scaled copy of that direction back into the stream: <code>h′ = h + α·v<sub>f</sub></code>.'],
        [3.6, 'Turn up <code>α</code> on a refusal-related feature and the model starts refusing more of 100 SALADBench prompts.'],
        [7.6, 'But how far do you have to turn the knob? It’s different for every feature.'],
      ],
    },
    {
      id: 'alpha',
      title: 'How hard to push?',
      dur: 10.5,
      draw: alphaStar,
      captions: [
        [0, 'Call a feature’s <b>steerability</b> <code>α*(f)</code>: the smallest α that raises the refusal rate by <code>T = 0.10</code>.'],
        [4.0, 'Finding it takes a sweep: 9 coefficients × 100 prompts = 900 generations, for every single feature.'],
        [7.8, 'Expensive, and only known after the fact. Could we <i>look</i> first?'],
      ],
    },
    {
      id: 'geometry',
      title: 'Look at the neighbourhood',
      dur: 11,
      draw: neighbourhood,
      captions: [
        [0, 'Before any forward pass, just look at <code>W<sub>dec</sub></code>, the decoder directions themselves.'],
        [3.4, '<b>Neighbour density</b>: the mean cosine similarity to a feature’s 50 nearest decoder neighbours.'],
        [7.0, '<b>Max cosine</b>: how close its single nearest neighbour sits. Crowded, or isolated?'],
      ],
    },
    {
      id: 'race',
      title: 'Co-recruitment',
      dur: 12,
      draw: corecruit,
      captions: [
        [0, 'Push a crowded feature and its neighbours come along: adding <code>α·v<sub>f</sub></code> nudges each neighbour by about <code>α·cos(v<sub>f</sub>, v<sub>g</sub>)</code>.'],
        [4.4, 'When those neighbours also lean toward refusal, the pushes add up, and the threshold arrives early.'],
        [8.2, 'An isolated feature pushes alone. It needs a much bigger α.'],
      ],
    },
    {
      id: 'results',
      title: 'Results',
      dur: 13,
      draw: results,
      captions: [
        [0, 'Across conditions, denser neighbourhoods mean smaller α*. Strongest in Gemma-2-9B at layer 20: <code>ρ = −0.546</code>, <code>p &lt; 10<sup>−6</sup></code>.'],
        [5.8, 'It holds for 2B and 9B, for 16K and 65K SAEs, and it’s detectable in Llama-3.1-8B too (<code>ρ</code> up to <code>−0.266</code>).'],
        [9.4, 'Two limits: the signal fades in the deepest layers, and on Qwen3-8B it only predicts <i>whether</i> a feature steers.'],
      ],
    },
    {
      id: 'moral',
      title: 'The moral',
      dur: 7.5,
      draw: moral,
      captions: [
        [0, 'The moral: <b>look before you steer</b>. Geometry you can read off <code>W<sub>dec</sub></code> ranks features by how hard they’ll be to push.'],
        [4.2, 'Next question: do crowded features also cause more off-target effects? That’s future work.'],
      ],
    },
  ],
}
