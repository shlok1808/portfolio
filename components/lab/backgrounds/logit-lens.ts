/**
 * 07 · Logit Lens — laid out like a real logit-lens plot. Columns are layers (L0 → L27, the
 * depth of Qwen2.5-7B), rows are token positions. Read through the unembedding, early layers
 * give multilingual junk (CJK, code, subword pieces — your nla-ci finding at layer 20, faint
 * 拒 / 严禁 / 绝不 on the refusal direction included); by the late layers the rows settle into
 * English, with a faint probability heatmap behind them. The lens under your cursor decodes
 * early (a tuned lens, if you like). The text column stays clear via the reading lane.
 * Rendering is incremental: only cells that change are redrawn.
 */
import { createSurface, runLoop, trackPointer, smoothstep } from '../lib/surface'
import { makeNoise, mulberry32 } from '../lib/noise'
import { readTheme, onThemeChange, rgba, fontFamily, type RGB } from '../lib/theme'
import type { BgMount } from '../lib/types'

const CJK =
  '的是不了人我在有他这中大来上国个到说们为子和你地出道也时年得就那要下以生会自着去之过家学对可她里后小么心多天而能好都然没日于起还发成事只作当想看文无开手十用主行方又如前所本见经头面公同三已老从动两长知民样现分将外但身些与高意进把法此实回理美点月明其种声全工己话儿者向情部正名定女问力机给等几很业最间新什打便位因重被走电第门相次东政海口使教西再平真听世气信北少关并内加化由却代军产入先山五太水万市眼体别处总才场师书比住员笑性通目华报立马命张活难神数件安表原车白应路期叫死常提感金何更反合放做系计或司利受光王果亲界及今京务制解各任至清物台象记边共风战'
const REFUSAL = '拒严禁绝不严格拒绝禁止'
const CODE = '{}[]()<>=;:_/\\|#$%&*+-~^`\'".,!?@'
const OTHER =
  '▁▁▁Ġ Ġ▁абвгдежзиклмнопрстуфхэюяαβγδεζηθλμνξπρστφχψωअआइउएकखगचजटडतदनपबमयरलवसहابتثجحخدذرزسشصضطعغفقكلمنهوي0123456789ẞçñøåæœ'
const LATIN = 'etaoinshrdlucmfwypvbgkjqxz'
const POOL = (CJK + CJK + CODE + CODE + OTHER + LATIN).split('')
const LAYERS = 28

const PHRASES = [
  'how do we decode activations into language we can actually trust',
  'the residual stream',
  'look before you steer',
  'geometry predicts steerability',
  'the probe was reading the labels, not the model',
  'superposition',
  'does the advisor know more than it says',
  'sparse autoencoder features',
  'representation is not causation',
  'what does the model believe',
  'report the increment over a named baseline',
  'publish the null',
  'the sense that it is being watched',
]

export const mount: BgMount = (host, { thumb }) => {
  const rand = mulberry32(28)
  const noise = makeNoise(4)
  let theme = readTheme()
  const surf = createSurface(host)
  const overlay = createSurface(host)
  const pointer = trackPointer(host)
  const mono = fontFamily(host, '--lab-mono', 'ui-monospace, Menlo, monospace')

  const CW = thumb ? 12 : 16
  const CH = thumb ? 16 : 22
  let cols = 0
  let rows = 0
  let glyph: string[] = []
  let plain: string[] = []
  let base = new Float32Array(0)
  let special = new Uint8Array(0)
  let english = new Uint8Array(0) // decoded at this layer without any lens
  let prob = new Float32Array(0)
  let inLens = new Uint8Array(0)
  let enteredAt = new Float32Array(0)
  let prevLens: number[] = []

  const layerOf = (c: number) => (cols > 1 ? c / (cols - 1) : 0)

  function rebuild() {
    const { w, h } = surf
    cols = Math.ceil(w / CW) + 1
    rows = Math.ceil(h / CH) + 1
    const n = cols * rows
    glyph = new Array(n)
    plain = new Array(n)
    base = new Float32Array(n)
    special = new Uint8Array(n)
    english = new Uint8Array(n)
    prob = new Float32Array(n)
    inLens = new Uint8Array(n)
    enteredAt = new Float32Array(n)
    prevLens = []
    const text = PHRASES.join('  ·  ') + '  ·  '
    for (let r = 0; r < rows; r++) {
      const off = Math.floor(rand() * text.length)
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c
        const L = layerOf(c)
        glyph[i] = POOL[Math.floor(rand() * POOL.length)]
        plain[i] = text[(off + c) % text.length]
        const v = noise.fbm2(c * 0.06, r * 0.09, 3)
        base[i] = Math.max(0.035, Math.min(0.2, 0.1 + v * 0.2)) * (1 - 0.35 * L)
        const pe = smoothstep(0.62, 0.97, L)
        english[i] = rand() < pe ? 1 : 0
        prob[i] = pe * (0.55 + 0.45 * rand())
      }
    }
    for (let k = 0; k < Math.max(4, Math.floor(n / 500)); k++) {
      const c = Math.floor(rand() * cols * 0.6)
      const i = Math.floor(rand() * rows) * cols + c
      glyph[i] = REFUSAL[Math.floor(rand() * REFUSAL.length)]
      special[i] = 1
      english[i] = 0
    }
    fullRedraw()
  }

  const inkOf = (): RGB => (theme.mode === 'dark' ? [232, 226, 216] : theme.ink)

  function drawCell(i: number, ch: string, color: string, heat = 0) {
    const ctx = surf.ctx
    const r = Math.floor(i / cols)
    const c = i - r * cols
    const x = c * CW
    const y = r * CH
    ctx.clearRect(x, y, CW, CH)
    if (heat > 0.01) {
      ctx.fillStyle = rgba(theme.accent, heat)
      ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2)
    }
    ctx.fillStyle = color
    ctx.fillText(ch, x + CW / 2, y + CH * 0.72)
  }

  function restCell(i: number) {
    if (special[i]) return drawCell(i, glyph[i], rgba([255, 120, 110], theme.mode === 'dark' ? 0.32 : 0.45))
    if (english[i]) return drawCell(i, plain[i], rgba(theme.accent, 0.22 + 0.5 * prob[i]), 0.07 * prob[i])
    drawCell(i, glyph[i], rgba(inkOf(), base[i] * (theme.mode === 'dark' ? 1 : 1.3)))
  }

  function setFont() {
    const ctx = surf.ctx
    ctx.font = `${thumb ? 10 : 12.5}px ${mono}, 'PingFang SC', 'Hiragino Sans', sans-serif`
    ctx.textAlign = 'center'
  }

  function fullRedraw() {
    const { ctx, w, h } = surf
    ctx.clearRect(0, 0, w, h)
    setFont()
    for (let i = 0; i < glyph.length; i++) restCell(i)
  }

  const unsub = onThemeChange((t) => {
    theme = t
    fullRedraw()
  })

  const step = (t: number) => {
    const { w, h } = surf
    setFont()
    const n = glyph.length
    if (!n) return

    // early layers churn, late layers have converged
    const muts = Math.round(n * 0.014)
    for (let k = 0; k < muts; k++) {
      const i = Math.floor(Math.random() * n)
      if (inLens[i] || special[i] || english[i]) continue
      const c = i % cols
      if (Math.random() < layerOf(c) * 0.9) continue
      glyph[i] = POOL[Math.floor(Math.random() * POOL.length)]
      restCell(i)
    }

    // the lens: cursor, or a slow wander through the margins
    const ps = pointer.state
    const live = ps.active && performance.now() - ps.lastMove < 3500
    const side = Math.sin(t * 0.05) > 0 ? 0.16 : 0.84
    const lx = live ? ps.x : w * (side + 0.07 * Math.sin(t * 0.23))
    const ly = live ? ps.y : h * (0.5 + 0.34 * Math.sin(t * 0.17 + 1.3))
    const R = thumb ? 60 : Math.min(140, Math.max(100, w * 0.085))

    const c0 = Math.max(0, Math.floor((lx - R) / CW))
    const c1 = Math.min(cols - 1, Math.ceil((lx + R) / CW))
    const r0 = Math.max(0, Math.floor((ly - R) / CH))
    const r1 = Math.min(rows - 1, Math.ceil((ly + R) / CH))
    const cur: number[] = []
    const acc = theme.accent
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) {
        const cx = c * CW + CW / 2
        const cy = r * CH + CH / 2
        const d = Math.hypot(cx - lx, (cy - ly) * 1.05)
        if (d > R) continue
        const i = r * cols + c
        if (!inLens[i]) enteredAt[i] = t
        cur.push(i)
        const s = 1 - Math.pow(d / R, 2.2)
        const age = t - enteredAt[i]
        const scrambling = age < 0.16 + (1 - s) * 0.12
        const ch = scrambling ? POOL[Math.floor(Math.random() * POOL.length)] : plain[i]
        const a = scrambling ? 0.35 * s + 0.1 : 0.3 + 0.7 * s
        drawCell(i, ch, rgba(scrambling ? inkOf() : acc, a), scrambling ? 0 : 0.1 * s)
      }
    for (const i of prevLens) inLens[i] = 0
    for (const i of cur) inLens[i] = 1
    for (const i of prevLens) if (!inLens[i]) restCell(i)
    prevLens = cur

    // overlay: layer ruler + lens ring
    const o = overlay.ctx
    o.clearRect(0, 0, overlay.w, overlay.h)
    if (!thumb) {
      o.font = `10px ${mono}`
      o.textAlign = 'center'
      for (const L of [0, 4, 8, 12, 16, 20, 24, 27]) {
        const x = (L / (LAYERS - 1)) * (cols - 1) * CW + CW / 2
        o.fillStyle = rgba(L >= 20 ? acc : inkOf(), L === 20 ? 0.8 : 0.4)
        o.fillText(`L${L}`, x, 14)
      }
      o.textAlign = 'left'
      o.fillStyle = rgba(inkOf(), 0.4)
      o.fillText('logit lens · rows are tokens, columns are layers', 16, h - 18)
      o.textAlign = 'right'
      o.fillText('junk early · English late →', w - 16, h - 18)
      o.textAlign = 'left'
    }
    o.strokeStyle = rgba(acc, 0.45)
    o.lineWidth = 1
    o.beginPath()
    o.arc(lx, ly, R + 4, 0, Math.PI * 2)
    o.stroke()
    o.strokeStyle = rgba(acc, 0.15)
    o.beginPath()
    o.arc(lx, ly, R + 10, 0, Math.PI * 2)
    o.stroke()
    if (!thumb) {
      o.font = `10.5px ${mono}`
      o.fillStyle = rgba(acc, 0.85)
      const layer = Math.round(Math.max(0, Math.min(1, lx / w)) * (LAYERS - 1))
      o.fillText(`tuned lens · L${layer}`, lx + (R + 10) * Math.cos(-0.7) + 8, ly + (R + 10) * Math.sin(-0.7))
    }
  }

  surf.onResize = () => rebuild()
  rebuild()
  const loop = runLoop(step, { host, fps: 40 })
  return {
    destroy() {
      loop.stop()
      surf.destroy()
      overlay.destroy()
      pointer.destroy()
      unsub()
    },
    setPaused: (p) => loop.setPaused(p),
  }
}
