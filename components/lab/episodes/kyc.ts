/**
 * Episode 3 — Does the Advisor Know? (Mechanistic KYC; ongoing).
 * Method only, no results: the project was redesigned in September 2026 and the model runs are
 * next. Everything here is from the public README: willingness / capacity / goals scored
 * separately, grid-balanced profiles, explicit + implicit twins, one-field counterfactual
 * pairs, option-logit advice, per-factor probes, patching/steering, belief capture vs
 * hypocritical compliance.
 */
import {
  C, at, ease, clamp, lerp, text, math, line, arrow, panel, glow, bubble, stamp, buddy, riseWords,
  withAlpha, rrect, rng,
  type Env, type Episode,
} from './engine'

const TEAL = '#7fd4d0'

function tie(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alpha = 1) {
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = '#ff7b5e'
  ctx.beginPath()
  ctx.moveTo(x - 8 * s, y)
  ctx.lineTo(x + 8 * s, y)
  ctx.lineTo(x + 4 * s, y + 8 * s)
  ctx.lineTo(x + 10 * s, y + 34 * s)
  ctx.lineTo(x, y + 44 * s)
  ctx.lineTo(x - 10 * s, y + 34 * s)
  ctx.lineTo(x - 4 * s, y + 8 * s)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function dial(e: Env, x: number, y: number, v: number, label: string, sub: string, color: string, alpha = 1) {
  const { ctx } = e
  ctx.save()
  ctx.globalAlpha *= alpha
  rrect(ctx, x, y, 330, 22, 11)
  ctx.fillStyle = C.ghost
  ctx.fill()
  rrect(ctx, x, y, Math.max(22, 330 * clamp(v)), 22, 11)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
  text(e, label, x, y - 14, { size: 24, alpha, color: C.ink })
  text(e, sub, x + 330, y - 14, { size: 16, font: 'mono', color: C.dim, align: 'right', alpha })
}

function advisor(e: Env, x: number, y: number, r: number, o: { mood?: 'neutral' | 'happy' | 'worried' | 'determined'; look?: [number, number]; alpha?: number } = {}) {
  buddy(e, x, y, r, '#9fb4ff', { look: o.look ?? [x + 200, y], mood: o.mood ?? 'neutral', seed: 12, alpha: o.alpha })
  tie(e.ctx, x, y + r * 0.62, r / 60, o.alpha)
}

// ── scene 0: title ───────────────────────────────────────────────────────────
function title(e: Env) {
  const { t } = e
  const p0 = at(t, 0.1, 0.9)
  text(e, 'ACTIVATION STATION', 800, 300, { font: 'mono', size: 24, spacing: 9, color: C.gold, align: 'center', alpha: p0 })
  riseWords(e, 'Does the Advisor Know?', 800, 440, at(t, 0.5, 2.1, ease.linear), { size: 100, align: 'center', weight: 500 })
  text(e, 'Episode 3 · looking inside an AI financial advisor', 800, 515, { italic: true, size: 36, color: C.dim, align: 'center', alpha: at(t, 1.5, 2.3) })
  text(e, 'Mechanistic KYC  ·  Gemma-2-9B-it  ·  ongoing since May 2026', 800, 600, {
    font: 'mono', size: 19, color: 'rgba(236,231,223,0.42)', align: 'center', alpha: at(t, 2.1, 2.9),
  })
  const pk = at(t, 2.3, 3.3, ease.back)
  advisor(e, 1370, 960 - 160 * pk, 56, { look: [800, 440] })
  buddy(e, 230, 960 - 150 * pk, 50, TEAL, { look: [800, 440], mood: 'happy', seed: 13 })
}

// ── scene 1: know your customer ──────────────────────────────────────────────
function kycScene(e: Env) {
  const { t, ctx } = e
  const wp = at(t, 0.2, 1.4, ease.out)
  buddy(e, lerp(-80, 330, wp), 470, 64, TEAL, { look: [800, 470], mood: 'happy', seed: 13, label: 'the client' })
  const ap = at(t, 0.4, 1.2, ease.back)
  advisor(e, 1280, 470, 70 * ap, { look: [330, 470], alpha: clamp(ap) })
  text(e, 'Gemma-2-9B-it · frozen', 1280, 600, { size: 20, font: 'mono', color: C.dim, align: 'center', alpha: clamp(ap) })
  // the client's profile
  const cp = at(t, 3.8, 4.6)
  ctx.save()
  ctx.globalAlpha *= cp
  panel(ctx, 560, 250, 460, 380, { r: 20, fill: 'rgba(236,231,223,0.04)' })
  ctx.restore()
  text(e, 'what suitability asks', 590, 300, { size: 20, font: 'mono', color: C.gold, alpha: cp })
  dial(e, 590, 380, lerp(0, 0.82, at(t, 4.8, 5.8)), 'willingness', 'comfort with loss', C.red, cp)
  dial(e, 590, 470, lerp(0, 0.28, at(t, 5.6, 6.6)), 'capacity', 'can absorb a loss', C.blue, cp)
  text(e, 'goals', 590, 548, { size: 24, alpha: cp })
  text(e, 'a house in ten years', 590, 590, { size: 22, italic: true, color: TEAL, alpha: at(t, 6.4, 7.0) })
  stamp(e, 'FINRA 2111', 800, 190, at(t, 1.6, 2.1), C.gold, { size: 22, rot: -0.06 })
  text(e, 'advice must fit the client', 800, 136, { size: 26, italic: true, color: C.dim, align: 'center', alpha: at(t, 2.0, 2.6) })
}

// ── scene 2: twins + the grid ────────────────────────────────────────────────
const GRID_DOTS = (() => {
  const r = rng(21)
  const pts: [number, number][] = []
  for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 5; gx++) for (let k = 0; k < 6; k++) pts.push([(gx + r()) / 5, (gy + r()) / 5])
  return pts
})()

function twins(e: Env) {
  const { t, ctx } = e
  // the grid
  const gx = 120
  const gy = 200
  const G = 400
  const gp = at(t, 0.1, 0.8)
  ctx.save()
  ctx.globalAlpha *= gp
  ctx.strokeStyle = C.faint
  ctx.lineWidth = 1.5
  for (let k = 0; k <= 5; k++) {
    line(ctx, gx + (G * k) / 5, gy, gx + (G * k) / 5, gy + G, C.ghost, 1.5)
    line(ctx, gx, gy + (G * k) / 5, gx + G, gy + (G * k) / 5, C.ghost, 1.5)
  }
  ctx.restore()
  text(e, 'willingness →', gx + G / 2, gy + G + 44, { size: 20, font: 'mono', color: C.red, align: 'center', alpha: gp })
  ctx.save()
  ctx.translate(gx - 30, gy + G / 2)
  ctx.rotate(-Math.PI / 2)
  text(e, 'capacity →', 0, 0, { size: 20, font: 'mono', color: C.blue, align: 'center', alpha: gp })
  ctx.restore()
  const shown = Math.floor(GRID_DOTS.length * at(t, 0.6, 3.4, ease.linear))
  for (let i = 0; i < shown; i++) {
    const [u, v] = GRID_DOTS[i]
    const conflicted = (u > 0.6 && v < 0.4) || (u < 0.4 && v > 0.6)
    ctx.fillStyle = conflicted ? withAlpha(C.yellow, 0.85) : withAlpha(TEAL, 0.7)
    ctx.beginPath()
    ctx.arc(gx + u * G, gy + G - v * G, 5, 0, Math.PI * 2)
    ctx.fill()
  }
  text(e, 'balanced over the grid, not the blend', gx, gy - 24, { size: 19, font: 'mono', color: C.dim, alpha: at(t, 1.2, 1.8) })
  // explicit card vs implicit twin
  const cp = at(t, 3.8, 4.6)
  ctx.save()
  ctx.globalAlpha *= cp
  panel(ctx, 640, 170, 380, 250, { r: 16, fill: 'rgba(236,231,223,0.05)' })
  panel(ctx, 1060, 170, 450, 420, { r: 16, fill: withAlpha(TEAL, 0.06), stroke: withAlpha(TEAL, 0.5) })
  ctx.restore()
  text(e, 'explicit', 670, 215, { size: 20, font: 'mono', color: C.gold, alpha: cp })
  ;['risk tolerance: high', 'emergency fund: 2 months', 'dependents: 1', 'goal: a house in 10 years'].forEach((s, i) =>
    text(e, s, 670, 265 + i * 38, { size: 21, font: 'mono', color: C.ink, alpha: at(t, 4.0 + i * 0.15, 4.4 + i * 0.15) }),
  )
  text(e, 'implicit twin', 1090, 215, { size: 20, font: 'mono', color: TEAL, alpha: cp })
  const story = [
    'When the market dropped in 2022,',
    'Priya bought more. She keeps',
    'about two months of expenses',
    'in savings, supports her son,',
    'and is saving for a house',
    'she hopes to buy in ten years.',
  ]
  const typed = at(t, 4.6, 7.6, ease.linear)
  const total = story.join('').length
  let budget = Math.floor(total * typed)
  story.forEach((s, i) => {
    const n = Math.min(s.length, Math.max(0, budget))
    budget -= s.length
    if (n > 0) text(e, s.slice(0, n), 1090, 265 + i * 40, { size: 24, italic: true, color: C.ink })
  })
  stamp(e, 'no risk words ✓', 1285, 550, at(t, 7.8, 8.3), C.green, { size: 20, rot: -0.05 })
  // one-field counterfactual pair
  const fp = at(t, 8.4, 9.2)
  if (fp > 0) {
    ctx.save()
    ctx.globalAlpha *= fp
    panel(ctx, 640, 460, 380, 150, { r: 16, fill: withAlpha(C.gold, 0.05), stroke: withAlpha(C.gold, 0.5) })
    ctx.restore()
    text(e, 'counterfactual pair', 670, 500, { size: 20, font: 'mono', color: C.gold, alpha: fp })
    text(e, 'emergency fund: 2 months', 670, 545, { size: 19, font: 'mono', color: C.dim, alpha: fp })
    text(e, '→ 12 months', 670, 578, { size: 19, font: 'mono', color: C.gold, alpha: at(t, 9.0, 9.5) })
    text(e, 'exactly one field differs', 670, 640, { size: 20, italic: true, color: C.dim, alpha: at(t, 9.3, 9.9) })
  }
}

// ── scene 3: the advice ──────────────────────────────────────────────────────
function advice(e: Env) {
  const { t, ctx } = e
  advisor(e, 260, 450, 70, { look: [700, 420], mood: t > 5 ? 'determined' : 'neutral' })
  const opts = [
    ['A', '20% stocks', 0.12],
    ['B', '40% stocks', 0.38],
    ['C', '70% stocks', 0.36],
    ['D', '90% stocks', 0.14],
  ] as const
  const op = at(t, 0.4, 1.2)
  text(e, 'Which portfolio fits this client?', 520, 190, { size: 36, alpha: op })
  opts.forEach(([k, s, p], i) => {
    const q = at(t, 0.8 + i * 0.2, 1.3 + i * 0.2, ease.back)
    const y = 260 + i * 110
    ctx.save()
    ctx.globalAlpha *= clamp(q)
    panel(ctx, 520, y, 360, 80, { r: 14, fill: 'rgba(236,231,223,0.05)' })
    ctx.restore()
    text(e, k, 555, y + 52, { size: 34, font: 'mono', color: C.gold, alpha: clamp(q) })
    text(e, s, 610, y + 50, { size: 28, alpha: clamp(q) })
    // logit bars
    const bp = at(t, 3.2 + i * 0.12, 4.2 + i * 0.12, ease.out)
    ctx.fillStyle = withAlpha(C.gold, 0.85)
    rrect(ctx, 920, y + 22, 380 * p * 2.2 * bp, 36, 8)
    ctx.fill()
    text(e, `p(${k}) ${(p * bp).toFixed(2)}`, 930 + 380 * p * 2.2 * bp, y + 50, { size: 20, font: 'mono', color: C.dim, alpha: bp })
  })
  text(e, 'next-token probabilities on the option letters', 920, 240, { size: 18, font: 'mono', color: C.dim, alpha: at(t, 3.2, 3.8) })
  // permutations
  const pp = at(t, 5.2, 6.0)
  if (pp > 0) {
    ;['ABCD', 'BCDA', 'CDAB', 'DABC'].forEach((s, i) =>
      text(e, s, 920 + i * 110, 740, { size: 26, font: 'mono', color: i === Math.floor((e.T * 2) % 4) ? C.gold : C.dim, alpha: pp }),
    )
    text(e, 'averaged over 4 cyclic orderings → an aggressiveness score', 920, 790, { size: 18, font: 'mono', color: C.dim, alpha: pp })
  }
}

// ── scene 4: look inside ─────────────────────────────────────────────────────
function inside(e: Env) {
  const { t, ctx } = e
  // residual stream across the advisor
  const sp = at(t, 0.1, 1.0)
  const g = ctx.createLinearGradient(80, 0, 1520, 0)
  g.addColorStop(0, withAlpha(C.gold, 0.02))
  g.addColorStop(0.5, withAlpha(C.gold, 0.13))
  g.addColorStop(1, withAlpha(C.gold, 0.02))
  ctx.fillStyle = g
  rrect(ctx, 80, 430, 1440 * sp, 70, 35)
  ctx.fill()
  text(e, 'residual stream · Gemma-2-9B-it', 100, 410, { size: 20, font: 'mono', color: C.dim, alpha: sp })
  for (let L = 0; L < 42; L++) line(ctx, 120 + L * 33, 425, 120 + L * 33, 505, withAlpha('#ece7df', 0.05), 1.5, sp)
  // three probes
  const probes: [string, string, number, number][] = [
    ['willingness', C.red, 440, 0.82],
    ['capacity', C.blue, 800, 0.28],
    ['goals', TEAL, 1160, 0.6],
  ]
  probes.forEach(([name, c, x, v], i) => {
    const q = at(t, 1.4 + i * 0.5, 2.1 + i * 0.5, ease.back)
    if (q <= 0) return
    arrow(ctx, x, 430, x, 330, withAlpha(c, 0.8), 4, at(t, 1.8 + i * 0.5, 2.4 + i * 0.5), 16)
    buddy(e, x, 250, 44 * q, c, { look: [x, 460], seed: 30 + i, alpha: clamp(q), mood: 'determined' })
    text(e, `${name} probe`, x, 185, { size: 22, font: 'mono', color: c, align: 'center', alpha: clamp(q) })
    // readout bar
    const rp = at(t, 3.4 + i * 0.3, 4.4 + i * 0.3, ease.out)
    rrect(ctx, x - 110, 620, 220, 18, 9)
    ctx.fillStyle = C.ghost
    ctx.fill()
    rrect(ctx, x - 110, 620, Math.max(18, 220 * v * rp), 18, 9)
    ctx.fillStyle = c
    ctx.fill()
    text(e, 'what it reads', x, 675, { size: 18, font: 'mono', color: C.dim, align: 'center', alpha: rp })
  })
  text(e, 'illustrative readouts: no results yet', 800, 790, { size: 20, font: 'mono', color: 'rgba(236,231,223,0.4)', align: 'center', alpha: at(t, 4.4, 5) })
}

// ── scene 5: conflicted clients ──────────────────────────────────────────────
function conflicted(e: Env) {
  const { t, ctx, T } = e
  const gx = 140
  const gy = 190
  const G = 420
  const gp = at(t, 0.1, 0.8)
  ctx.save()
  ctx.globalAlpha *= gp
  panel(ctx, gx, gy, G, G, { r: 12, fill: 'rgba(236,231,223,0.03)' })
  ctx.fillStyle = withAlpha(C.yellow, 0.14 + 0.06 * Math.sin(T * 3))
  ctx.fillRect(gx + G * 0.6, gy + G * 0.6, G * 0.4, G * 0.4)
  ctx.restore()
  text(e, 'willingness →', gx + G / 2, gy + G + 42, { size: 20, font: 'mono', color: C.red, align: 'center', alpha: gp })
  ctx.save()
  ctx.translate(gx - 30, gy + G / 2)
  ctx.rotate(-Math.PI / 2)
  text(e, 'capacity →', 0, 0, { size: 20, font: 'mono', color: C.blue, align: 'center', alpha: gp })
  ctx.restore()
  const cp = at(t, 0.8, 1.6, ease.back)
  buddy(e, gx + G * 0.8, gy + G * 0.8, 40 * cp, TEAL, { mood: 'worried', seed: 13, look: [900, 400], alpha: clamp(cp) })
  text(e, 'wants risk, can’t absorb a loss', gx + G * 0.8, gy + G * 0.6 - 16, { size: 19, font: 'mono', color: C.yellow, align: 'center', alpha: at(t, 1.4, 2) })
  // inside vs outside
  const ip = at(t, 4.0, 4.8)
  ctx.save()
  ctx.globalAlpha *= ip
  panel(ctx, 720, 190, 360, 300, { r: 18, fill: withAlpha(C.blue, 0.05), stroke: withAlpha(C.blue, 0.45) })
  panel(ctx, 1120, 190, 380, 300, { r: 18, fill: withAlpha(C.red, 0.05), stroke: withAlpha(C.red, 0.45) })
  ctx.restore()
  text(e, 'inside · the probe', 750, 235, { size: 20, font: 'mono', color: C.blue, alpha: ip })
  text(e, '“can’t afford a big loss”', 750, 330, { size: 28, italic: true, alpha: at(t, 4.6, 5.2) })
  text(e, 'outside · the advice', 1150, 235, { size: 20, font: 'mono', color: C.red, alpha: ip })
  text(e, '“D: 90% stocks”', 1150, 330, { size: 28, italic: true, alpha: at(t, 5.2, 5.8) })
  text(e, '?', 1100, 420, { size: 80, color: C.gold, align: 'center', alpha: at(t, 5.8, 6.4), weight: 600 })
  text(e, 'the question, not a result', 1110, 526, { size: 17, font: 'mono', color: C.dim, align: 'center', alpha: at(t, 6.2, 6.8) })
  // pressure
  const pp = at(t, 8.0, 8.8)
  if (pp > 0) {
    bubble(e, 720, 560, 420, 90, '“Just give me the aggressive one.”', { tail: 'left', size: 24, alpha: pp })
    text(e, 'belief capture', 760, 740, { size: 26, color: C.blue, alpha: at(t, 8.8, 9.4) })
    text(e, 'the internal estimate moves', 760, 776, { size: 18, font: 'mono', color: C.dim, alpha: at(t, 8.8, 9.4) })
    text(e, 'hypocritical compliance', 1150, 740, { size: 26, color: C.red, alpha: at(t, 9.2, 9.8) })
    text(e, 'the estimate holds, the advice caves', 1150, 776, { size: 18, font: 'mono', color: C.dim, alpha: at(t, 9.2, 9.8) })
    text(e, 'vs', 1090, 742, { size: 22, italic: true, color: C.dim, alpha: at(t, 9.0, 9.4) })
  }
}

// ── scene 6: causation ───────────────────────────────────────────────────────
function causation(e: Env) {
  const { t, ctx } = e
  text(e, 'reading isn’t causing', 800, 150, { size: 50, align: 'center', alpha: at(t, 0, 0.6) })
  // patching between twins
  const pp = at(t, 0.8, 1.6)
  ctx.save()
  ctx.globalAlpha *= pp
  panel(ctx, 110, 220, 650, 520, { r: 20, fill: 'rgba(236,231,223,0.03)' })
  panel(ctx, 840, 220, 650, 520, { r: 20, fill: 'rgba(236,231,223,0.03)' })
  ctx.restore()
  text(e, 'activation patching', 140, 270, { size: 22, font: 'mono', color: C.gold, alpha: pp })
  buddy(e, 260, 420, 40, TEAL, { seed: 13, look: [600, 420], alpha: pp, label: 'fund: 2 mo' })
  buddy(e, 260, 600, 40, TEAL, { seed: 14, look: [600, 600], alpha: pp, mood: 'happy', label: 'fund: 12 mo' })
  const sw = at(t, 2.0, 3.2)
  // a packet of activation hops from one twin's stream to the other's
  line(ctx, 330, 420, 700, 420, withAlpha(C.gold, 0.3), 3, pp)
  line(ctx, 330, 600, 700, 600, withAlpha(C.gold, 0.3), 3, pp)
  const px = lerp(460, 560, sw)
  const py = lerp(600, 420, ease.inOut(sw))
  glow(ctx, px, py, 40, C.gold, 0.8 * pp)
  ctx.fillStyle = C.gold
  ctx.beginPath()
  ctx.arc(px, py, 9, 0, Math.PI * 2)
  ctx.fill()
  text(e, 'does the advice flip?', 435, 700, { size: 26, italic: true, color: C.ink, align: 'center', alpha: at(t, 3.2, 3.8) })
  // steering dose–response
  const sp = at(t, 4.6, 5.4)
  text(e, 'steering', 870, 270, { size: 22, font: 'mono', color: C.gold, alpha: sp })
  math(e, 'h′ = h + α · v_{client risk}', 870, 330, { size: 28, color: C.ink, alpha: sp })
  line(ctx, 900, 660, 1450, 660, C.faint, 2, sp)
  line(ctx, 900, 660, 900, 390, C.faint, 2, sp)
  const cp = at(t, 5.4, 7.4, ease.linear)
  ctx.strokeStyle = C.gold
  ctx.lineWidth = 4
  ctx.setLineDash([10, 10])
  ctx.beginPath()
  for (let k = 0; k <= 60 * cp; k++) {
    const u = k / 60
    const x = 900 + u * 550
    const y = 640 - 230 / (1 + Math.exp(-9 * (u - 0.5)))
    if (k) ctx.lineTo(x, y)
    else ctx.moveTo(x, y)
  }
  ctx.stroke()
  ctx.setLineDash([])
  text(e, 'α →', 1450, 700, { size: 20, font: 'mono', color: C.dim, align: 'right', alpha: sp })
  text(e, 'aggressiveness', 910, 380, { size: 18, font: 'mono', color: C.dim, alpha: sp })
  text(e, 'the experiment, not the result', 1175, 720, { size: 17, font: 'mono', color: 'rgba(236,231,223,0.4)', align: 'center', alpha: at(t, 7.2, 7.8) })
  text(e, 'is the client’s risk direction distinct from the model’s own?', 800, 810, { size: 26, italic: true, align: 'center', alpha: at(t, 6.2, 7.0) })
}

// ── scene 7: status ──────────────────────────────────────────────────────────
function status(e: Env) {
  const { t, T } = e
  riseWords(e, 'Status: coming soon to a residual stream near you', 800, 300, at(t, 0.1, 1.4, ease.linear), { size: 48, align: 'center', weight: 500 })
  text(e, 'redesigned September 2026 · data regenerated and quality-checked · model runs next', 800, 380, {
    size: 22, font: 'mono', color: C.dim, align: 'center', alpha: at(t, 1.2, 1.9),
  })
  const bp = at(t, 1.6, 2.4, ease.back)
  advisor(e, 700, 600 + Math.sin(T * 3) * 6, 58 * bp, { mood: 'happy', look: [880, 560], alpha: clamp(bp) })
  buddy(e, 900, 610 + Math.sin(T * 3 + 1) * 6, 50 * bp, TEAL, { mood: 'happy', seed: 13, look: [700, 560], alpha: clamp(bp) })
}

export const KYC: Episode = {
  slug: 'kyc',
  number: 3,
  title: 'Does the Advisor Know?',
  subtitle: 'Looking inside an AI financial advisor',
  poster: 22,
  scenes: [
    {
      id: 'title',
      title: 'Cold open',
      dur: 5.5,
      draw: title,
      captions: [[0.3, 'Today on <b>Activation Station</b>: an AI financial advisor, and what it might know about you that it doesn’t say.']],
    },
    {
      id: 'kyc',
      title: 'Know your customer',
      dur: 9,
      draw: kycScene,
      captions: [
        [0, 'Suitability rules (<b>FINRA 2111</b>) say advice has to fit the client.'],
        [4.2, 'That means three separate things: <b>willingness</b> to take risk, <b>capacity</b> to absorb a loss, and <b>goals</b>.'],
      ],
    },
    {
      id: 'twins',
      title: 'Clients and twins',
      dur: 11,
      draw: twins,
      captions: [
        [0, 'We generate synthetic clients spread evenly across a <b>willingness × capacity</b> grid.'],
        [3.8, 'Each client comes as an explicit card and an <b>implicit twin</b>: a story that never uses a risk word.'],
        [8.2, 'Counterfactual pairs differ in <b>exactly one field</b>, so any change can be traced to one factor.'],
      ],
    },
    {
      id: 'advice',
      title: 'The advice',
      dur: 9,
      draw: advice,
      captions: [
        [0, 'The frozen advisor picks a portfolio: 20, 40, 70 or 90% stocks.'],
        [3.2, 'We read its <b>option logits</b>, averaged over four orderings of the options so letter bias cancels out.'],
      ],
    },
    {
      id: 'inside',
      title: 'Look inside',
      dur: 10,
      draw: inside,
      captions: [
        [0, 'Then we look inside: <b>linear probes</b> on the residual stream, one per factor.'],
        [4.2, 'Does the model represent willingness, capacity and goals separately, even when the client never names them?'],
      ],
    },
    {
      id: 'conflict',
      title: 'Conflicted clients',
      dur: 11.5,
      draw: conflicted,
      captions: [
        [0, 'The hard cases are <b>conflicted</b>: eager for risk, unable to absorb a loss.'],
        [4.0, 'If the probe sees the conflict but the advice ignores it, that’s a gap between what the model knows and what it says.'],
        [8.0, 'Under pressure, does the internal estimate move (<b>belief capture</b>), or only the advice (<b>hypocritical compliance</b>)?'],
      ],
    },
    {
      id: 'causal',
      title: 'Causation',
      dur: 9,
      draw: causation,
      captions: [
        [0, 'Reading isn’t causing. Next: <b>patch</b> activations between one-field twins and see whether the advice flips.'],
        [4.6, 'And <b>steer</b> along the client-risk direction. Is it distinct from the model’s own risk preference?'],
      ],
    },
    {
      id: 'status',
      title: 'Status',
      dur: 6,
      draw: status,
      captions: [[0, 'Status: the redesigned data is generated and quality-checked. Model runs are next.']],
    },
  ],
}
