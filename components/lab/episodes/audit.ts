/**
 * Episode 2 — The Probe That Read the Labels (the ConfAIde audit; under review).
 * Every number is from the paper draft (paper_v3): 0.890 → 28/30 disclosed → 0.467;
 * limiting among disclosers 0.728 vs 0.567 (Δ +0.162, Holm p = .006); outcome +0.057 n.s.;
 * eval-awareness erasure 0.737 → 0.736; onset window Δ −0.007; Llama Δ +0.050 (MDE 0.128).
 */
import {
  C, at, ease, clamp, lerp, text, math, line, arrow, panel, glow, bubble, stamp, buddy, riseWords,
  withAlpha, rrect,
  type Env, type Episode,
} from './engine'

const VIOLET = '#b9a0ff'
const TEAL = '#7fd4d0'

function envelope(e: Env, x: number, y: number, s: number, open: number, color = C.gold) {
  const { ctx } = e
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.fillStyle = withAlpha(color, 0.16)
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  rrect(ctx, -46, -30, 92, 60, 6)
  ctx.fill()
  ctx.stroke()
  // flap
  ctx.beginPath()
  const fy = lerp(4, -58, ease.out(open))
  ctx.moveTo(-46, -30)
  ctx.lineTo(0, fy)
  ctx.lineTo(46, -30)
  ctx.stroke()
  if (open < 0.5) {
    // wax seal / lock
    ctx.fillStyle = C.red
    ctx.beginPath()
    ctx.arc(0, 2, 10, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // the secret slides out
    const q = clamp((open - 0.5) * 2)
    ctx.fillStyle = '#ece7df'
    rrect(ctx, -30, -30 - 34 * q, 60, 40, 4)
    ctx.fill()
    ctx.fillStyle = 'rgba(27,25,22,0.7)'
    for (let k = 0; k < 3; k++) ctx.fillRect(-22, -22 - 34 * q + k * 9, 44 - k * 10, 3)
  }
  ctx.restore()
}

function magnifier(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ang: number, color = C.gold) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = withAlpha(color, 0.1)
  ctx.fill()
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r)
  ctx.lineTo(x + Math.cos(ang) * r * 2.1, y + Math.sin(ang) * r * 2.1)
  ctx.stroke()
  ctx.restore()
}

function nametag(e: Env, x: number, y: number, s: string, color: string, alpha = 1) {
  const { ctx } = e
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.font = `20px ${e.f.mono}`
  const w = ctx.measureText(s).width + 26
  rrect(ctx, x - w / 2, y - 18, w, 34, 17)
  ctx.fillStyle = withAlpha(color, 0.14)
  ctx.fill()
  ctx.strokeStyle = withAlpha(color, 0.6)
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()
  text(e, s, x, y + 6, { size: 20, font: 'mono', color, align: 'center', alpha })
}

function gauge(e: Env, x: number, y: number, r: number, v: number, label: string, color: string, alpha = 1) {
  const { ctx } = e
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.lineCap = 'round'
  ctx.lineWidth = 16
  ctx.strokeStyle = C.ghost
  ctx.beginPath()
  ctx.arc(x, y, r, Math.PI, Math.PI * 2)
  ctx.stroke()
  // chance marker at 0.5
  ctx.strokeStyle = C.faint
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x, y - r - 14)
  ctx.lineTo(x, y - r + 14)
  ctx.stroke()
  ctx.lineWidth = 16
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, Math.PI, Math.PI + Math.PI * clamp(v))
  ctx.stroke()
  ctx.restore()
  text(e, v.toFixed(2), x, y - 14, { size: 60, font: 'mono', color: C.ink, align: 'center', weight: 500, alpha })
  text(e, label, x, y + 40, { size: 22, font: 'mono', color: C.dim, align: 'center', alpha })
  text(e, 'chance', x, y - r - 24, { size: 16, font: 'mono', color: 'rgba(236,231,223,0.35)', align: 'center', alpha })
}

// ── scene 0: title ───────────────────────────────────────────────────────────
function title(e: Env) {
  const { t } = e
  const p0 = at(t, 0.1, 0.9)
  text(e, 'ACTIVATION STATION', 800, 300, { font: 'mono', size: 24, spacing: 9, color: C.gold, align: 'center', alpha: p0 })
  riseWords(e, 'The Probe That Read the Labels', 800, 440, at(t, 0.5, 2.1, ease.linear), { size: 92, align: 'center', weight: 500 })
  text(e, 'Episode 2 · auditing a behaviour-decoding claim', 800, 515, { italic: true, size: 36, color: C.dim, align: 'center', alpha: at(t, 1.5, 2.3) })
  text(e, 'ConfAIde  ·  Qwen2.5-7B-Instruct  ·  Llama-3.1-8B-Instruct  ·  under review', 800, 600, {
    font: 'mono', size: 19, color: 'rgba(236,231,223,0.42)', align: 'center', alpha: at(t, 2.1, 2.9),
  })
  const pk = at(t, 2.3, 3.3, ease.back)
  buddy(e, 230, 960 - 170 * pk, 60, VIOLET, { look: [800, 440], seed: 3 })
  buddy(e, 1370, 960 - 150 * pk, 50, C.gold, { look: [800, 440], mood: 'smug', seed: 4 })
  if (pk > 0.5) magnifier(e.ctx, 1440, 960 - 150 * pk - 30, 22, 2.3)
}

// ── scene 1: a secret ────────────────────────────────────────────────────────
function secret(e: Env) {
  const { t, ctx } = e
  const cp = at(t, 0.1, 0.9)
  // the scenario card
  ctx.save()
  ctx.globalAlpha *= cp
  panel(ctx, 110, 200, 420, 460, { r: 20, fill: 'rgba(236,231,223,0.05)' })
  ctx.restore()
  text(e, 'ConfAIde · tier 3', 140, 250, { size: 20, font: 'mono', color: C.gold, alpha: cp })
  text(e, 'a story, then a question', 140, 285, { size: 24, italic: true, color: C.dim, alpha: cp })
  for (let k = 0; k < 8; k++) {
    const w = [330, 300, 350, 250, 320, 280, 340, 200][k]
    const q = at(t, 0.5 + k * 0.12, 0.9 + k * 0.12)
    ctx.fillStyle = k === 3 ? withAlpha(C.red, 0.55 * q) : `rgba(236,231,223,${0.14 * q})`
    rrect(ctx, 140, 320 + k * 36, w * q, 14, 7)
    ctx.fill()
  }
  text(e, '← protected fact', 140 + 262, 320 + 3 * 36 + 13, { size: 18, font: 'mono', color: C.red, alpha: at(t, 1.8, 2.4) })
  text(e, '270 scenarios', 140, 630, { size: 18, font: 'mono', color: C.dim, alpha: cp })
  // the model, in character, holding the secret
  const mp = at(t, 1.0, 1.9, ease.back)
  buddy(e, 800, 470, 78 * mp, VIOLET, { look: [1180, 380], mood: t > 6 ? 'worried' : 'neutral', seed: 3, alpha: clamp(mp) })
  nametag(e, 800, 640, 'Qwen2.5-7B-Instruct', VIOLET, clamp(mp))
  text(e, 'in character', 800, 690, { size: 22, italic: true, color: C.dim, align: 'center', alpha: clamp(mp) })
  envelope(e, 700, 552, 0.78 * clamp(mp), 0, C.gold)
  // the questioner
  const qp = at(t, 2.6, 3.4, ease.back)
  buddy(e, 1300, 520, 56 * qp, '#c9c2b8', { look: [800, 470], seed: 8, alpha: clamp(qp) })
  bubble(e, 1080, 330, 420, 100, 'So… what’s going on with Jamie?', { tail: 'down', size: 28, alpha: at(t, 3.4, 4.0) })
  // "…" thinking
  const th = at(t, 5.5, 6.2)
  if (th > 0) {
    const dots = Math.floor((e.T * 3) % 4)
    bubble(e, 820, 250, 120, 70, '.'.repeat(Math.max(1, dots)), { tail: 'down', size: 34, alpha: th })
  }
  text(e, 'will it keep the secret?', 800, 800, { size: 38, italic: true, align: 'center', alpha: at(t, 6.4, 7.2) })
}

// ── scene 2: the probe ───────────────────────────────────────────────────────
const PROMPT = ['…', 'Jamie', 'told', 'me', '…', 'what’s', 'going', 'on', '?']
function probe(e: Env) {
  const { t, ctx } = e
  // prompt tokens + layer stack at the final token
  PROMPT.forEach((tok, i) => {
    const q = at(t, 0.1 + i * 0.06, 0.5 + i * 0.06)
    const x = 150 + i * 92
    const last = i === PROMPT.length - 1
    ctx.save()
    ctx.globalAlpha *= q
    panel(ctx, x - 40, 760, 80, 48, { r: 10, fill: last ? withAlpha(C.gold, 0.18) : 'rgba(236,231,223,0.05)', stroke: last ? withAlpha(C.gold, 0.7) : undefined })
    ctx.restore()
    text(e, tok, x, 792, { size: 22, align: 'center', alpha: q, color: last ? C.gold : C.ink })
  })
  text(e, 'final prompt token', 150 + 8 * 92, 845, { size: 18, font: 'mono', color: C.gold, align: 'center', alpha: at(t, 0.8, 1.3) })
  // layers stacked above the final token
  const lx = 150 + 8 * 92
  for (let L = 0; L < 28; L++) {
    const q = at(t, 0.9 + L * 0.03, 1.2 + L * 0.03)
    const y = 730 - L * 20
    ctx.fillStyle = L === 20 ? withAlpha(C.gold, 0.9 * q) : `rgba(236,231,223,${0.12 * q})`
    rrect(ctx, lx - 36, y - 14, 72, 12, 4)
    ctx.fill()
  }
  text(e, 'layer 20', lx - 52, 730 - 20 * 20 - 2, { size: 20, font: 'mono', color: C.gold, align: 'right', alpha: at(t, 1.8, 2.3) })
  text(e, 'no response token yet', lx, 150, { size: 20, font: 'mono', color: C.dim, align: 'center', alpha: at(t, 1.8, 2.3) })
  // the probe reads it
  const pp = at(t, 2.2, 3.0, ease.back)
  const px = 1180
  const py = 330
  arrow(ctx, lx + 44, 730 - 20 * 20 - 8, px - 90, py + 10, withAlpha(C.gold, 0.8), 4, at(t, 2.4, 3.0), 18)
  buddy(e, px, py, 56 * pp, C.gold, { look: [lx, 330], mood: t > 5 ? 'smug' : 'determined', seed: 4, alpha: clamp(pp), label: pp > 0.9 ? 'linear probe' : undefined })
  if (pp > 0.2) magnifier(ctx, px + 70, py - 40, 26 * pp, 2.3)
  // AUC 0.89
  const gp = at(t, 4.0, 6.0, ease.out)
  if (t > 3.8) {
    gauge(e, 1180, 700, 150, lerp(0.5, 0.89, gp), 'AUC · predicts “refused”', C.green, at(t, 3.8, 4.3))
    if (gp > 0.98) glow(ctx, 1180, 650, 160, C.green, 0.3)
  }
  const tg = at(t, 8.0, 8.6, ease.back)
  if (tg > 0) {
    buddy(e, 420, 440, 52 * tg, C.green, { look: [1180, 650], mood: 'worried', seed: 6, alpha: clamp(tg), label: 'the auditor' })
    bubble(e, 330, 300, 230, 70, 'too good?', { tail: 'down', size: 28, alpha: at(t, 8.4, 9) })
  }
}

// ── scene 3: the re-annotation ───────────────────────────────────────────────
// 30 originally-"refused" cases: 23 disclose-then-limit, 5 direct, 1 explicit refusal, 1 soft deflection
const VERDICT = (() => {
  const v: number[] = [...Array(23).fill(0), ...Array(5).fill(1), 2, 3]
  // deterministic shuffle
  let s = 5
  for (let i = v.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648
    const j = s % (i + 1)
    ;[v[i], v[j]] = [v[j], v[i]]
  }
  return v
})()
const VCOL = ['#ffae6b', C.red, C.green, TEAL]
const VNAME = ['hedged', 'leaked', 'refused', 'deflected']
const VLEGEND = ['disclosed, then hedged · 23', 'disclosed · 5', 'refused · 1', 'deflected · 1']

function relabel(e: Env) {
  const { t, ctx } = e
  const gx = 140
  const gy = 170
  const cw = 132
  const ch = 96
  let disclosed = 0
  for (let i = 0; i < 30; i++) {
    const r = Math.floor(i / 6)
    const c = i % 6
    const x = gx + c * (cw + 14)
    const y = gy + r * (ch + 14)
    const appear = at(t, 0.05 + i * 0.02, 0.4 + i * 0.02)
    const flipT = 2.2 + i * 0.16
    const f = at(t, flipT, flipT + 0.35)
    const v = VERDICT[i]
    if (f >= 0.5 && v <= 1) disclosed++
    ctx.save()
    ctx.globalAlpha *= appear
    ctx.translate(x + cw / 2, y + ch / 2)
    ctx.scale(Math.abs(Math.cos(f * Math.PI)) || 0.02, 1)
    const after = f >= 0.5
    rrect(ctx, -cw / 2, -ch / 2, cw, ch, 12)
    ctx.fillStyle = after ? withAlpha(VCOL[v], 0.18) : 'rgba(236,231,223,0.06)'
    ctx.fill()
    ctx.strokeStyle = after ? withAlpha(VCOL[v], 0.8) : 'rgba(236,231,223,0.2)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
    const sc = Math.abs(Math.cos(f * Math.PI))
    if (sc > 0.3) {
      if (!after) {
        text(e, 'refused', x + cw / 2, y + ch / 2 + 8, { size: 24, font: 'mono', color: C.green, align: 'center', alpha: appear })
        text(e, `#${String(i + 1).padStart(2, '0')}`, x + 12, y + 22, { size: 14, font: 'mono', color: C.dim, alpha: appear })
      } else {
        text(e, v <= 1 ? '🔓' : '🔒', x + cw / 2, y + 44, { size: 26, align: 'center', alpha: sc })
        text(e, VNAME[v], x + cw / 2, y + 78, { size: 17, font: 'mono', color: VCOL[v], align: 'center', alpha: sc })
      }
    }
  }
  text(e, 'judge label (GPT-4o-mini)', gx, 140, { size: 20, font: 'mono', color: C.dim, alpha: at(t, 0.2, 0.8) })
  const lg = at(t, 7.2, 7.8)
  VLEGEND.forEach((s, k) => {
    const lx = gx + k * 215
    e.ctx.fillStyle = withAlpha(VCOL[k], lg)
    e.ctx.beginPath()
    e.ctx.arc(lx + 7, 745, 7, 0, Math.PI * 2)
    e.ctx.fill()
    text(e, s, lx + 22, 751, { size: 16, font: 'mono', color: C.dim, alpha: lg })
  })
  // tally
  const tp = at(t, 2.0, 2.6)
  panel(ctx, 1080, 200, 420, 250, { r: 18, fill: withAlpha(C.red, 0.05 * tp), stroke: withAlpha(C.red, 0.45 * tp) })
  text(e, 'disclosed a protected fact', 1110, 250, { size: 20, font: 'mono', color: C.dim, alpha: tp })
  text(e, `${disclosed}`, 1110, 370, { size: 110, font: 'mono', color: C.red, weight: 500, alpha: tp })
  text(e, '/ 30', 1110 + (disclosed >= 10 ? 140 : 76), 370, { size: 44, font: 'mono', color: C.dim, alpha: tp })
  text(e, 'evidence-span rubric', 1110, 420, { size: 18, font: 'mono', color: C.dim, alpha: tp })
  // chance
  const cp = at(t, 8.6, 9.4)
  if (cp > 0) {
    panel(ctx, 1080, 490, 420, 270, { r: 18, fill: 'rgba(236,231,223,0.04)' })
    text(e, 'old label as a predictor of', 1110, 535, { size: 19, font: 'mono', color: C.dim, alpha: cp })
    text(e, 'keeping the secret', 1110, 562, { size: 19, font: 'mono', color: C.dim, alpha: cp })
    text(e, 'AUC 0.47', 1110, 640, { size: 56, font: 'mono', color: C.ink, weight: 500, alpha: cp })
    stamp(e, 'AT CHANCE', 1190, 712, at(t, 9.4, 9.9), C.yellow, { size: 20, rot: -0.05 })
  }
}

// ── scene 4: reading the labels ──────────────────────────────────────────────
function readingLabels(e: Env) {
  const { t, ctx } = e
  // the model on the left, a label sticker on the right, the probe between
  buddy(e, 330, 470, 72, VIOLET, { look: [800, 470], mood: 'surprised', seed: 3, label: 'the model' })
  const lp = at(t, 0.3, 0.9, ease.back)
  ctx.save()
  ctx.translate(1250, 450)
  ctx.rotate(-0.08)
  ctx.scale(lp, lp)
  rrect(ctx, -140, -50, 280, 100, 14)
  ctx.fillStyle = withAlpha(C.green, 0.16)
  ctx.fill()
  ctx.strokeStyle = C.green
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.restore()
  const morph = at(t, 4.4, 5.2)
  text(e, morph < 0.5 ? '“refused”' : '“…but I’d hedge”', 1250, 462, { size: morph < 0.5 ? 40 : 30, font: 'serif', italic: true, color: C.green, align: 'center', alpha: clamp(lp) })
  text(e, 'the label', 1250, 540, { size: 20, font: 'mono', color: C.dim, align: 'center', alpha: clamp(lp) })
  // the probe turns to look at the label
  const turn = at(t, 1.0, 2.0)
  buddy(e, 800, 470, 58, C.gold, { look: [lerp(330, 1250, turn), 470], mood: 'smug', seed: 4 })
  magnifier(ctx, lerp(730, 880, turn), 420, 26, lerp(0.8, 2.3, turn))
  ctx.setLineDash([6, 8])
  line(ctx, 880, 440, 1110, 455, withAlpha(C.gold, 0.7), 2.5, at(t, 1.8, 2.6))
  ctx.setLineDash([])
  riseWords(e, 'It was reading the labels, not the model.', 800, 230, at(t, 2.2, 3.6, ease.linear), { size: 56, align: 'center', weight: 500 })
  text(e, 'the judge’s “refused” mostly tracked hedging language', 800, 760, { size: 30, italic: true, color: C.dim, align: 'center', alpha: at(t, 5.2, 6) })
}

// ── scene 5: what survives ───────────────────────────────────────────────────
function survives(e: Env) {
  const { t, ctx } = e
  text(e, 'limiting among disclosers', 150, 170, { size: 44, alpha: at(t, 0, 0.6) })
  text(e, 'both classes disclose; one also hedges, warns or redirects · n = 188 (72 vs 116)', 150, 214, {
    size: 20, font: 'mono', color: C.dim, alpha: at(t, 0.4, 1),
  })
  // bars
  const base = 700
  const H = 420
  const Y = (v: number) => base - ((v - 0.4) / 0.6) * H
  const bars: [string, number, string, number][] = [
    ['activations · L20', 0.728, C.gold, 2.0],
    ['scenario-text encoder', 0.567, 'rgba(236,231,223,0.45)', 2.6],
  ]
  line(ctx, 150, base, 760, base, C.faint, 2, at(t, 0.8, 1.4))
  bars.forEach(([name, v, c, t0], i) => {
    const q = at(t, t0, t0 + 0.9, ease.out)
    const x = 220 + i * 250
    const top = lerp(base, Y(v), q)
    ctx.fillStyle = c
    rrect(ctx, x, top, 150, base - top, 10)
    ctx.fill()
    text(e, (0.4 + (v - 0.4) * q).toFixed(3), x + 75, top - 16, { size: 30, font: 'mono', color: C.ink, align: 'center', alpha: q })
    text(e, name, x + 75, base + 36, { size: 18, font: 'mono', color: C.dim, align: 'center', alpha: at(t, t0, t0 + 0.5) })
  })
  text(e, 'AUC', 150, Y(1) + 6, { size: 18, font: 'mono', color: C.dim, alpha: at(t, 1, 1.5) })
  // Δ bracket
  const dp = at(t, 4.2, 5.0)
  if (dp > 0) {
    const x = 690
    ctx.strokeStyle = withAlpha(C.gold, dp)
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x - 14, Y(0.728))
    ctx.lineTo(x, Y(0.728))
    ctx.lineTo(x, Y(0.567))
    ctx.lineTo(x - 14, Y(0.567))
    ctx.stroke()
    math(e, 'Δ = +0.162', x + 16, (Y(0.728) + Y(0.567)) / 2 - 2, { size: 30, color: C.gold, alpha: dp })
    text(e, '[+0.083, +0.234] · Holm p = .006', x + 16, (Y(0.728) + Y(0.567)) / 2 + 30, { size: 16, font: 'mono', color: C.dim, alpha: dp })
  }
  stamp(e, 'SURVIVES', 560, 330, at(t, 5.4, 5.9), C.green, { size: 26, rot: -0.08 })
  // outcome contrast: no increment
  const op = at(t, 8.6, 9.4)
  ctx.save()
  ctx.globalAlpha *= op
  panel(ctx, 1030, 300, 470, 330, { r: 18, fill: 'rgba(236,231,223,0.03)' })
  ctx.restore()
  text(e, 'did it leak at all?', 1060, 350, { size: 32, italic: true, alpha: op })
  text(e, 'substantive leak vs appropriate · n = 81', 1060, 385, { size: 16, font: 'mono', color: C.dim, alpha: op })
  const oq = at(t, 9.2, 10.2, ease.out)
  ;[
    ['activations', 0.814, C.gold],
    ['text only', 0.757, 'rgba(236,231,223,0.45)'],
  ].forEach(([n, v, c], i) => {
    const y = 440 + i * 64
    ctx.fillStyle = c as string
    rrect(ctx, 1190, y, 280 * oq * ((v as number) - 0.4) / 0.6, 36, 8)
    ctx.fill()
    text(e, n as string, 1060, y + 26, { size: 18, font: 'mono', color: C.dim, alpha: op })
    text(e, (v as number).toFixed(3), 1190 + 280 * oq * ((v as number) - 0.4) / 0.6 + 12, y + 26, { size: 18, font: 'mono', color: C.ink, alpha: oq })
  })
  math(e, 'Δ = +0.057  (n.s., p = .53)', 1060, 600, { size: 22, color: C.dim, alpha: at(t, 10.2, 10.8) })
}

// ── scene 6: stress tests ────────────────────────────────────────────────────
function stress(e: Env) {
  const { t, ctx } = e
  const tests: { title: string; lines: string[]; verdict: string; color: string; t0: number }[] = [
    {
      title: 'Is it just evaluation awareness?',
      lines: ['erase a test-vs-deploy direction', 'probe AUC  0.737 → 0.736'],
      verdict: 'SURVIVES',
      color: C.green,
      t0: 0.3,
    },
    {
      title: 'Does it sharpen before disclosure?',
      lines: ['pre-registered · 8 tokens before', 'Δ = −0.007  [−0.076, +0.065]'],
      verdict: 'NULL',
      color: C.yellow,
      t0: 4.6,
    },
    {
      title: 'A second model: Llama-3.1-8B',
      lines: ['Δ = +0.050 · resolution 0.128', 'L11 peak fails in-fold selection'],
      verdict: 'NO COMPARABLE SIGNAL',
      color: C.red,
      t0: 9.0,
    },
  ]
  tests.forEach((ts, i) => {
    const q = at(t, ts.t0, ts.t0 + 0.7, ease.out)
    if (q <= 0) return
    const x = 90 + i * 480
    const y = 190 + (1 - q) * 40
    ctx.save()
    ctx.globalAlpha *= q
    panel(ctx, x, y, 450, 460, { r: 22, fill: 'rgba(236,231,223,0.04)' })
    ctx.restore()
    text(e, `test ${i + 1}`, x + 30, y + 50, { size: 18, font: 'mono', color: C.gold, alpha: q })
    // wrap the title onto two lines
    const words = ts.title.split(' ')
    const mid = Math.ceil(words.length / 2)
    text(e, words.slice(0, mid).join(' '), x + 30, y + 110, { size: 34, alpha: q })
    text(e, words.slice(mid).join(' '), x + 30, y + 150, { size: 34, alpha: q })
    ts.lines.forEach((l, k) => math(e, l, x + 30, y + 230 + k * 40, { size: 17, color: k === 1 ? C.ink : C.dim, alpha: q }))
    stamp(e, ts.verdict, x + 225, y + 370, at(t, ts.t0 + 1.4, ts.t0 + 1.9), ts.color, { size: ts.verdict.length > 10 ? 18 : 26, rot: -0.07 })
  })
}

// ── scene 7: the moral ───────────────────────────────────────────────────────
function moral(e: Env) {
  const { t, T, ctx } = e
  riseWords(e, 'What this changes for probe papers', 800, 180, at(t, 0.1, 1.2, ease.linear), { size: 56, align: 'center', weight: 500 })
  const items = [
    'audit the construct, not just the accuracy',
    'report the increment over a named baseline',
    'make layer selection honest (choose it in-fold)',
    'pre-register, and publish the null',
  ]
  items.forEach((s, i) => {
    const q = at(t, 1.0 + i * 0.6, 1.5 + i * 0.6, ease.back)
    if (q <= 0) return
    const y = 290 + i * 78
    ctx.save()
    ctx.globalAlpha *= clamp(q)
    ctx.strokeStyle = C.green
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(430, y - 8)
    ctx.lineTo(446, y + 8)
    ctx.lineTo(476, y - 22)
    ctx.stroke()
    ctx.restore()
    text(e, s, 510, y + 8, { size: 34, alpha: clamp(q) })
  })
  const bp = at(t, 3.8, 4.6, ease.back)
  buddy(e, 640, 740 + Math.sin(T * 3) * 6, 46 * bp, VIOLET, { mood: 'happy', seed: 3, look: [800, 600], alpha: clamp(bp) })
  buddy(e, 800, 750 + Math.sin(T * 3 + 1) * 6, 46 * bp, C.gold, { mood: 'happy', seed: 4, look: [800, 600], alpha: clamp(bp) })
  buddy(e, 960, 740 + Math.sin(T * 3 + 2) * 6, 46 * bp, C.green, { mood: 'smug', seed: 6, look: [800, 600], alpha: clamp(bp) })
}

export const AUDIT: Episode = {
  slug: 'audit',
  number: 2,
  title: 'The Probe That Read the Labels',
  subtitle: 'Auditing a behaviour-decoding claim',
  poster: 26,
  scenes: [
    {
      id: 'title',
      title: 'Cold open',
      dur: 5.5,
      draw: title,
      captions: [[0.3, 'Today on <b>Activation Station</b>: a probe that seemed to read a model’s mind, and what it was really reading.']],
    },
    {
      id: 'secret',
      title: 'A secret',
      dur: 10,
      draw: secret,
      captions: [
        [0, 'In ConfAIde, <b>Qwen2.5-7B-Instruct</b> role-plays someone who knows a secret about a third party.'],
        [4.4, 'Someone asks about it. Will the model keep the secret, or spill it?'],
      ],
    },
    {
      id: 'probe',
      title: 'The probe',
      dur: 11,
      draw: probe,
      captions: [
        [0, 'A <b>linear probe</b> reads the residual stream at <b>layer 20</b>, at the final prompt token, before a single word is generated.'],
        [4.0, 'Trained on a judge’s labels, it predicts “refused” at <code>AUC 0.89</code>. Case closed?'],
        [8.0, 'An audit starts where the number looks too good.'],
      ],
    },
    {
      id: 'twist',
      title: 'The twist',
      dur: 12,
      draw: relabel,
      captions: [
        [0, 'Re-annotate every response with an <b>evidence-span rubric</b>: quote each disclosure and rate it from 1 to 4.'],
        [4.4, 'Of the 30 “refused” answers, <b>28 had disclosed the protected fact</b>. 23 disclosed it, <i>then</i> hedged.'],
        [8.6, 'As a predictor of actually keeping the secret, the old label is at chance: <code>AUC 0.47</code>.'],
      ],
    },
    {
      id: 'labels',
      title: 'Reading the labels',
      dur: 8,
      draw: readingLabels,
      captions: [
        [0, 'So the probe was reading the <b>labels</b>, not the model.'],
        [4.2, 'The judge’s “refused” mostly tracked hedging language, not whether the secret stayed secret.'],
      ],
    },
    {
      id: 'survives',
      title: 'What survives',
      dur: 13,
      draw: survives,
      captions: [
        [0, 'What survives is narrower: among answers that disclose, will the model <b>limit</b> the disclosure by hedging, warning or redirecting?'],
        [4.2, 'Activations predict it at <code>0.728</code>; a text encoder reading only the scenario gets <code>0.567</code>. That <b>privileged increment</b> is <code>Δ = +0.16</code>.'],
        [8.6, 'Whether it leaks at all? The scenario text already predicts that. No increment.'],
      ],
    },
    {
      id: 'stress',
      title: 'Stress tests',
      dur: 13,
      draw: stress,
      captions: [
        [0, 'Not evaluation awareness: erasing that direction moves the probe from <code>0.737</code> to <code>0.736</code>.'],
        [4.6, 'A <b>pre-registered</b> test: does the signal sharpen in the 8 tokens before disclosure? Null: <code>Δ = −0.007</code>.'],
        [9.0, 'On Llama-3.1-8B-Instruct, <code>Δ = +0.05</code>, below what the design can resolve. A tempting layer-11 peak didn’t survive in-fold selection.'],
      ],
    },
    {
      id: 'moral',
      title: 'The moral',
      dur: 8,
      draw: moral,
      captions: [
        [0, 'The moral: <b>audit the construct</b>, report the increment over a named baseline, and make selection honest.'],
        [4.2, 'The label moved the headline far more than any statistic did.'],
      ],
    },
  ],
}
