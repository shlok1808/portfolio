/**
 * 07 · Logit Lens — a glyph field that is also a real logit-lens plot. Columns are token
 * positions (the input runs along the bottom), rows are layers, L0 at the bottom up to L27 at
 * the top (the depth of Qwen2.5-7B). Every cell is the top next-token guess you get by pushing
 * that layer's residual stream through the unembedding, shaded by its probability. Cells hold
 * whole tokens (words and word pieces), so each column is as wide as its token.
 *
 * Each column tells one token's story bottom to top: early layers decode to near-uniform
 * multilingual junk (Hindi, Arabic, Chinese, Japanese, Korean, Cyrillic, code, subword pieces —
 * the nla-ci finding, faint 拒 / 严禁 / 绝不 on the refusal direction included), the layers just
 * before it settles land on English that is not the answer yet, and past some layer the column
 * locks on and only gets more confident. Finishing a word locks in soonest, a fresh content
 * word only near the top, which is why the English frays downward. The top row is the model's
 * output: the input shifted one token left, except where the model simply guesses wrong
 * ("look before you" → leap).
 *
 * The one liberty is the motion: junk cells keep re-rolling at random, fastest in the earliest
 * layers. A lens of a fixed input is static, but down there the distribution is so flat that
 * the top guess is close to arbitrary, and the churn stands for that. Cells that have locked
 * onto their answer never move. The ring under the cursor is a spotlight, not a decoder: it
 * shows what is already there and reads out the cell at its centre. The text column stays clear
 * via the reading lane. Rendering is incremental: only cells that change are redrawn.
 */
import { createSurface, runLoop, trackPointer, clamp } from '../lib/surface'
import { makeNoise, mulberry32 } from '../lib/noise'
import { readTheme, onThemeChange, rgba, fontFamily, type RGB } from '../lib/theme'
import type { BgMount } from '../lib/types'

const LAYERS = 28
const BREAK = '⏎'

// "|" splits a word into subword pieces; "actual{guess}" is a token the model gets wrong.
const PROMPTS = [
  'how do we de|code activ|ations into lang|uage we can actu|ally trust{use}',
  'the resid|ual stream{connection}',
  'look before you steer{leap}',
  'geo|metry pred|icts{of} steer|ability',
  'the probe{model} was reading{trained} the labels{text} , not the model',
  'super|position',
  'does the advisor{model} know more than it says{knows}',
  'sparse auto|encoder features',
  'represent|ation is not caus|ation{enough}',
  'what does the model believe{do}',
  'report the incre|ment{results} over a named{fixed} base|line',
  'publish the null{results}',
  'the sense that it is being watched{used}',
]

interface Tok {
  text: string
  /** continues the previous token's word */
  cont: boolean
  /** what the model predicts here instead of this token */
  guess?: string
}

const STREAM: Tok[] = []
const STARTS: number[] = []
for (const p of PROMPTS) {
  STARTS.push(STREAM.length)
  for (const word of p.split(' ')) {
    const m = word.match(/^(.*?)(?:\{(.*)\})?$/)!
    m[1].split('|').forEach((text, j) => STREAM.push({ text, cont: j > 0, guess: j === 0 ? m[2] : undefined }))
  }
  STREAM.push({ text: BREAK, cont: false })
}

const FUNCTION = new Set(
  'the we do how into can you was not it is than a over that being does what more before ,'.split(' ').concat(BREAK),
)

// What early layers decode to: real vocabulary items. [weight, tokens]: the weight is per
// script, not per token.
const JUNK: [number, string][] = [
  [3, 'नहीं और है के में यह क्या लिए हम एक से न व'], // Hindi
  [3, 'في من على لا هذا أن كان إلى ما هو كل و'], // Arabic
  [2, '的 不是 我们 可以 这个 没有 什么 因为 是 了 在'], // Chinese
  [2, 'の です ない こと する これ から ます は'], // Japanese
  [2, '것 하지 않 그리고 있는 에서 는 을'], // Korean
  [2, 'не это что как или для был и'], // Russian
  [1, 'και το δεν είναι με'], // Greek
  [1, 'לא של את זה על'], // Hebrew
  [1, 'ไม่ ที่ การ และ เป็น'], // Thai
  [1, 'না এবং একটি আমি'], // Bengali
  [1, 'இல்லை ஒரு மற்றும்'], // Tamil
  [1, 'نہیں است برای'], // Urdu, Persian
  [1, 'değil không nicht ção über niño że'],
  [3, '{ </ (); _ \\n == #include self .py :// [] 0x }} -> $_ null'],
  [2, 'ing tion ## Ġ ▁▁ ĠĠ ed ly un ." ),'],
]
const REFUSAL = ['拒', '严禁', '绝不', '拒绝', '禁止']
// What a column decodes to just before it settles: English, but not the answer yet.
const MID =
  'it a to of in is that this thing way more about know read see find make word mean data signal layer model answer true real first same other what how some'.split(
    ' ',
  )

const JUNK_K = 0
const CAND_K = 1
const FINAL_K = 2
const REFUSAL_K = 3

interface Column {
  x: number
  w: number
  input: string
  // per layer: top guess, its probability, its stage
  tok: string[]
  p: Float32Array
  kind: Uint8Array
  // per row: resting brightness of junk, and whether the spotlight is on it
  base: Float32Array
  lit: Uint8Array
}

type Sized = { t: string; w: number }[]

const pct = (p: number) => (p >= 0.0995 ? `${Math.round(p * 100)}%` : `${(p * 100).toFixed(1)}%`)
const glyphs = (s: string) => Array.from(s).length

export const mount: BgMount = (host, { thumb }) => {
  const noise = makeNoise(4)
  let theme = readTheme()
  const surf = createSurface(host)
  const overlay = createSurface(host)
  const pointer = trackPointer(host)
  const mono = fontFamily(host, '--lab-mono', 'ui-monospace, Menlo, monospace')

  const INPUT_H = 22
  // each visit opens on a different sentence
  const start = thumb ? 0 : STARTS[Math.floor(Math.random() * STARTS.length)]
  const PAD = thumb ? 8 : 12

  let CH = 22
  let GX = 0 // left gutter: layer labels
  let gridH = 0
  let rows = 0
  let adv = 7.5 // advance of one monospace character
  let columns: Column[] = []
  let junkPool: Sized = []
  let midPool: Sized = []
  let prevLens: [Column, number][] = []
  let lensX = -9999
  let lensY = -9999
  let lensR = 100

  const rowLayer = (r: number) => (rows > 1 ? Math.round(((rows - 1 - r) / (rows - 1)) * (LAYERS - 1)) : LAYERS - 1)
  const inkOf = (): RGB => (theme.mode === 'dark' ? [232, 226, 216] : theme.ink)

  function setFont() {
    const ctx = surf.ctx
    ctx.font = `${thumb ? 9.5 : 12.5}px ${mono}, 'PingFang SC', 'Hiragino Sans', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
  }

  /** a random token from a width-sorted pool that fits in maxW */
  function fit(pool: Sized, rand: () => number, maxW: number) {
    let n = pool.length
    while (n > 1 && pool[n - 1].w > maxW) n--
    return pool[Math.floor(rand() * n)].t
  }

  /** The lens for one token position: top guess, its probability and its stage at every layer. */
  function makeColumn(k: number, x: number): Column {
    const n = STREAM.length
    const cur = STREAM[k % n]
    const nxt = STREAM[(k + 1) % n]
    const rand = mulberry32(((k % n) + 1) * 7919)
    // nothing predicts how a new sentence opens: the model falls back on something generic
    const pred = nxt.guess ?? (cur.text === BREAK && !FUNCTION.has(nxt.text) ? 'the' : nxt.text)
    const w = Math.round(Math.max(glyphs(cur.text), glyphs(pred), 2) * adv + PAD)
    const maxW = w - 4

    // conv: the layer where the column locks onto its answer. pf: its final probability.
    // Finishing a word is easy and early; opening a new sentence is close to a coin toss.
    let conv: number
    let pf: number
    // Even the easy ones only surface in roughly the last third of the layers.
    if (cur.text === BREAK) [conv, pf] = [25 + rand() * 1.4, 0.06 + rand() * 0.08]
    else if (nxt.cont) [conv, pf] = [16 + rand() * 5, 0.86 + rand() * 0.13]
    else if (nxt.guess) [conv, pf] = [22 + rand() * 4, 0.16 + rand() * 0.2]
    else if (FUNCTION.has(nxt.text)) [conv, pf] = [18 + rand() * 5, 0.45 + rand() * 0.4]
    else [conv, pf] = [21 + rand() * 5, 0.22 + rand() * 0.4]
    conv = Math.min(LAYERS - 2, Math.round(conv))

    const tok = new Array<string>(LAYERS)
    const p = new Float32Array(LAYERS)
    const kind = new Uint8Array(LAYERS)
    for (let l = 0; l < LAYERS; l++) {
      if (l >= conv) {
        tok[l] = pred
        p[l] = pf * (0.22 + 0.78 * Math.pow((l - conv + 1) / (LAYERS - conv), 1.4))
        kind[l] = FINAL_K
      } else if (l >= conv - 5) {
        // the answer sometimes surfaces a layer or two early, then slips away again
        if (l === conv - 2 && rand() < 0.25) {
          tok[l] = pred
          kind[l] = FINAL_K
        } else {
          tok[l] = kind[l - 1] === CAND_K && rand() < 0.3 ? tok[l - 1] : fit(midPool, rand, maxW)
          kind[l] = CAND_K
        }
        p[l] = 0.025 + 0.07 * ((l - (conv - 5)) / 5) + rand() * 0.02
      } else {
        if (l > 0 && kind[l - 1] === JUNK_K && rand() < 0.3) tok[l] = tok[l - 1]
        else if (rand() < 0.005) {
          const t = REFUSAL[Math.floor(rand() * REFUSAL.length)]
          tok[l] = glyphs(t) * adv * 1.7 > maxW ? REFUSAL[0] : t
          kind[l] = REFUSAL_K
        } else tok[l] = fit(junkPool, rand, maxW)
        p[l] = 0.003 + rand() * 0.012 + 0.006 * (l / conv)
      }
    }

    const base = new Float32Array(rows)
    for (let r = 0; r < rows; r++) {
      const v = noise.fbm2((x / 16) * 0.06, r * 0.09, 3)
      base[r] = Math.max(0.07, Math.min(0.24, 0.14 + v * 0.22)) * (1 - 0.3 * (rowLayer(r) / (LAYERS - 1)))
    }
    return { x, w, input: cur.text, tok, p, kind, base, lit: new Uint8Array(rows) }
  }

  /** boost: 0 at rest, up to 1 at the centre of the spotlight */
  function drawCell(col: Column, r: number, boost = 0) {
    const ctx = surf.ctx
    const y = r * CH
    ctx.clearRect(col.x, y, col.w, CH)
    const l = rowLayer(r)
    const p = col.p[l]
    const kind = col.kind[l]
    const light = theme.mode === 'dark' ? 1 : 1.3
    if (kind === FINAL_K) {
      ctx.fillStyle = rgba(theme.accent, 0.02 + 0.09 * p + 0.08 * boost)
      ctx.fillRect(col.x + 1, y + 1, col.w - 2, CH - 2)
      ctx.fillStyle = rgba(theme.accent, Math.min(1, 0.22 + 0.55 * p + 0.5 * boost))
    } else if (kind === REFUSAL_K) ctx.fillStyle = rgba([255, 120, 110], (theme.mode === 'dark' ? 0.32 : 0.45) + 0.5 * boost)
    else if (kind === CAND_K) ctx.fillStyle = rgba(inkOf(), Math.min(1, (0.14 + 1.4 * p) * light + 0.55 * boost))
    else ctx.fillStyle = rgba(inkOf(), Math.min(1, col.base[r] * light + 0.5 * boost))
    ctx.fillText(col.tok[l], col.x + col.w / 2, y + CH / 2 + 1, col.w - 4)
  }

  // the x-axis: the input token under each column
  function drawInput(col: Column) {
    if (thumb) return
    const ctx = surf.ctx
    ctx.clearRect(col.x, gridH, col.w, INPUT_H)
    ctx.fillStyle = rgba(inkOf(), 0.2)
    ctx.fillRect(col.x + 1, gridH + 2, col.w - 2, 1)
    ctx.fillStyle = rgba(inkOf(), theme.mode === 'dark' ? 0.55 : 0.7)
    ctx.fillText(col.input, col.x + col.w / 2, gridH + 13, col.w - 4)
  }

  function fullRedraw() {
    surf.ctx.clearRect(0, 0, surf.w, surf.h)
    setFont()
    for (const col of columns) {
      for (let r = 0; r < rows; r++) drawCell(col, r)
      drawInput(col)
    }
  }

  function rebuild() {
    const { w, h } = surf
    GX = thumb ? 0 : 32
    const chrome = thumb ? 0 : INPUT_H + 24 // input tokens + caption
    rows = Math.min(LAYERS, Math.max(4, Math.floor((h - chrome) / (thumb ? 13 : 17))))
    CH = Math.max(1, Math.floor((h - chrome) / rows))
    gridH = rows * CH

    setFont()
    const ctx = surf.ctx
    adv = ctx.measureText('m').width
    const sized = (list: string[]): Sized => list.map((t) => ({ t, w: ctx.measureText(t).width })).sort((a, b) => a.w - b.w)
    junkPool = sized(JUNK.flatMap(([n, s]) => Array<string[]>(n).fill(s.split(' ')).flat()))
    midPool = sized(MID)

    columns = []
    prevLens = []
    let k = start
    for (let x = GX; x < w; ) {
      const col = makeColumn(k++, x)
      columns.push(col)
      x += col.w
    }
    fullRedraw()
  }

  const unsub = onThemeChange((t) => {
    theme = t
    fullRedraw()
    drawOverlay() // the loop may be paused (reduced motion)
  })

  const step = (t: number) => {
    const { w, h } = surf
    if (!columns.length) return
    setFont()

    // junk cells re-roll at random; the deeper the layer, the calmer
    const muts = Math.round(columns.length * rows * 0.014)
    for (let m = 0; m < muts; m++) {
      const col = columns[Math.floor(Math.random() * columns.length)]
      const r = Math.floor(Math.random() * rows)
      const l = rowLayer(r)
      if (col.kind[l] !== JUNK_K || col.lit[r]) continue
      if (Math.random() < (l / (LAYERS - 1)) * 0.9) continue
      col.tok[l] = fit(junkPool, Math.random, col.w - 4)
      drawCell(col, r)
    }

    // the spotlight: cursor, or a slow wander through the margins
    const ptr = pointer.state
    const live = ptr.active && performance.now() - ptr.lastMove < 3500
    const narrow = w < 760 // only the masthead shows the lens on phones
    const side = narrow ? 0.5 : Math.sin(t * 0.05) > 0 ? 0.16 : 0.84
    lensX = live ? ptr.x : w * (side + (narrow ? 0.3 : 0.07) * Math.sin(t * 0.23))
    lensY = live ? ptr.y : narrow ? h * (0.22 + 0.14 * Math.sin(t * 0.17 + 1.3)) : h * (0.5 + 0.34 * Math.sin(t * 0.17 + 1.3))
    lensR = thumb ? 60 : Math.min(140, Math.max(100, w * 0.085))

    const r0 = Math.max(0, Math.floor((lensY - lensR) / CH))
    const r1 = Math.min(rows - 1, Math.ceil((lensY + lensR) / CH))
    const cur: [Column, number][] = []
    for (const col of columns) {
      const cx = col.x + col.w / 2
      if (Math.abs(cx - lensX) > lensR) continue
      for (let r = r0; r <= r1; r++) {
        const d = Math.hypot(cx - lensX, r * CH + CH / 2 - lensY)
        if (d > lensR) continue
        cur.push([col, r])
        drawCell(col, r, 1 - Math.pow(d / lensR, 2.2))
      }
    }
    for (const [col, r] of prevLens) col.lit[r] = 0
    for (const [col, r] of cur) col.lit[r] = 1
    for (const [col, r] of prevLens) if (!col.lit[r]) drawCell(col, r)
    prevLens = cur

    drawOverlay()
  }

  // layer axis, captions and the spotlight ring
  function drawOverlay() {
    const { w, h } = surf
    const o = overlay.ctx
    const acc = theme.accent
    o.clearRect(0, 0, overlay.w, overlay.h)
    o.lineWidth = 1
    o.textBaseline = 'middle'
    if (!thumb) {
      o.font = `10px ${mono}`
      o.textAlign = 'right'
      let lastLabel = -1
      for (let r = 0; r < rows; r++) {
        const l = rowLayer(r)
        if ((l % 4 !== 0 && l !== LAYERS - 1) || l === 24 || l === lastLabel) continue
        lastLabel = l
        o.fillStyle = rgba(l >= 20 ? acc : inkOf(), l === LAYERS - 1 ? 0.8 : 0.45)
        o.fillText(`L${l}`, GX - 6, r * CH + CH / 2 + 0.5)
      }
      o.fillStyle = rgba(inkOf(), 0.45)
      o.fillText('in', GX - 6, gridH + 13)
      o.textAlign = 'left'
      o.fillText(w < 900 ? 'logit lens · next-token guess at each layer' : 'logit lens · rows are layers, columns are tokens, each cell is that layer’s guess at the next token', 16, h - 12)
      if (w >= 900) {
        o.textAlign = 'right'
        o.fillText('junk in the early layers · English by the top ↑', w - 16, h - 12)
      }
    }
    o.strokeStyle = rgba(acc, 0.45)
    o.beginPath()
    o.arc(lensX, lensY, lensR + 4, 0, Math.PI * 2)
    o.stroke()
    o.strokeStyle = rgba(acc, 0.15)
    o.beginPath()
    o.arc(lensX, lensY, lensR + 10, 0, Math.PI * 2)
    o.stroke()
    // read out the cell at the centre of the ring
    const col = columns.find((c) => lensX >= c.x && lensX < c.x + c.w)
    const r = Math.floor(lensY / CH)
    if (thumb || !col || r < 0 || r >= rows) return
    const l = rowLayer(r)
    o.strokeStyle = rgba(acc, 0.8)
    o.strokeRect(col.x + 0.5, r * CH + 0.5, col.w - 1, CH - 1)
    o.font = `10.5px ${mono}, 'PingFang SC', 'Hiragino Sans', sans-serif`
    o.fillStyle = rgba(acc, 0.85)
    // isolate the token so an Arabic or Hebrew guess cannot reorder the rest of the label
    const label = `logit lens · L${l} · top guess “\u2068${col.tok[l]}\u2069” ${pct(col.p[l])}`
    // above the ring (below it near the top edge), nudged inward so it never leaves the screen
    const half = o.measureText(label).width / 2
    const above = lensY - lensR - 22 > 10
    o.textAlign = 'center'
    o.fillText(label, clamp(lensX, 12 + half, Math.max(12 + half, w - 12 - half)), above ? lensY - lensR - 22 : lensY + lensR + 22)
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
