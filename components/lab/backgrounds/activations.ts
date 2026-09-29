/**
 * 24 · Activations — a piano roll of your own words.
 *
 * Your About text streams through an SAE one token at a time. At the playhead (right margin) each
 * token's features fire as glowing notes on labelled feature lanes, then drift left behind the
 * reading column and out the other side, like a spectrogram of what the model "hears". The
 * page is live input: hover any word you wrote ("chess", "privacy", "watched") and it's played
 * through the model on the spot, highlighted in place, with a readout of what fired. An optional
 * ♪ turns the firing features into soft notes. Illustrative (no model runs in the browser).
 */
import { createSurface, runLoop, clamp } from '../lib/surface'
import { readTheme, onThemeChange, rgba, fontFamily, type RGB } from '../lib/theme'
import type { BgMount } from '../lib/types'
import { THEMES } from './feature-atlas'

const GENERIC = ['function words', 'proper nouns', 'punctuation & numbers']
const LANES = [...THEMES.map((t) => t.label), ...GENERIC]
const laneOf = (label: string) => Math.max(0, LANES.indexOf(label))

// what your words fire (illustrative, hand-written)
const LEX: Record<string, [string, number][]> = {
  chess: [['chess notation', 5.3], ['video games', 1.1]],
  poker: [['poker', 5.4]],
  pickleball: [['racket sports', 5.2]],
  badminton: [['racket sports', 5.4]],
  xbox: [['video games', 5.5]],
  music: [['music', 5.1]],
  orion: [['astronomy', 5.6]],
  nebula: [['astronomy', 5.8]],
  photography: [['astronomy', 3.1]],
  mechanistic: [['interpretability', 5.2]],
  interpretability: [['interpretability', 5.7]],
  activations: [['interpretability', 5.1]],
  decode: [['interpretability', 3.6], ['base64', 1.4]],
  represents: [['interpretability', 3.4]],
  representation: [['interpretability', 3.9]],
  probe: [['interpretability', 4.8]],
  model: [['interpretability', 2.6]],
  models: [['interpretability', 2.4]],
  deception: [['deception', 5.8]],
  loud: [['deception', 1.4]],
  watched: [['being evaluated', 5.6]],
  trust: [['uncertainty', 1.9], ['sycophancy', 1.2]],
  hallucinate: [['uncertainty', 3.3]],
  safety: [['refusal', 2.4], ['jailbreak attempt', 1.6]],
  francisco: [['golden gate bridge', 3.6], ['proper nouns', 2.6]],
  san: [['golden gate bridge', 1.9], ['proper nouns', 2.2]],
  october: [['dates', 5.0]],
  engineering: [['arithmetic', 1.3]],
  data: [['arithmetic', 1.6], ['base64', 1.1]],
  science: [['medical', 1.0]],
  not: [['negation', 5.0]],
  never: [['negation', 4.8]],
  says: [['deception', 1.2]],
  words: [['french', 0.9]],
  questions: [['uncertainty', 2.1]],
  circling: [['uncertainty', 1.4]],
  switch: [['video games', 0.8]],
  major: [['music', 1.3]],
  friends: [['video games', 1.0]],
  language: [['french', 2.0], ['korean', 1.4]],
  course: [['recipes', 0.7]],
  sprint: [['sports reports', 2.2]],
  moved: [['grief', 1.1]],
  caused: [['interpretability', 1.9]],
  showing: [['interpretability', 1.1]],
  bag: [['recipes', 1.1]],
}
const FUNCTION = new Set(
  'the a an of to and in on at for with by from as is are was were be been it its this that these those i me my we our you your he she they them his her their what how who which when where why do does did can could would should will just or but if so than then there here up out about into over also only very more most some any all no apart like get today little enough'.split(
    ' ',
  ),
)

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967296
}

/** Returns [lane, activation] pairs for a token. */
function fire(tok: string): [number, number][] {
  const raw = tok.trim()
  const w = raw.toLowerCase().replace(/[’']s$/, '').replace(/[^a-z0-9’'-]/g, '')
  const h = hash(w || raw)
  if (!w) return [[laneOf('punctuation & numbers'), 1.5 + h]]
  if (LEX[w]) return LEX[w].map(([l, a]) => [laneOf(l), a] as [number, number])
  if (/^\d/.test(w)) return [[laneOf('punctuation & numbers'), 2.6], [laneOf(w.length === 4 ? 'dates' : 'arithmetic'), 2.2]]
  if (FUNCTION.has(w)) return [[laneOf('function words'), 1.4 + h * 0.9]]
  if (/^[A-Z]/.test(raw)) return [[laneOf('proper nouns'), 2.4 + h * 1.4]]
  const lane = Math.floor(h * THEMES.length)
  return h > 0.55 ? [[lane, 0.8 + h * 1.2], [laneOf('function words'), 0.5]] : [[lane, 0.7 + h]]
}

const FALLBACK =
  'I was studying engineering when I watched one of Neel Nanda’s videos on mechanistic interpretability, and it moved me enough to switch my major to data science. The questions I keep circling: how do we decode activations into language we can actually trust?'

interface Note {
  lane: number
  act: number
  born: number
  dur: number
  label: boolean
  weak?: boolean
}

export const mount: BgMount = (host, { thumb }) => {
  let theme = readTheme()
  const unsub = onThemeChange((t) => (theme = t))
  const surf = createSurface(host)
  const mono = fontFamily(host, '--lab-mono', 'ui-monospace, Menlo, monospace')

  // ── the token stream: your own About text ─────────────────────────────────
  const src =
    Array.from(document.querySelectorAll('#about p, #research h3'))
      .map((n) => n.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim() || FALLBACK
  const TOKENS = src.match(/\s*[A-Za-z0-9’'\-]+|\s*[^\sA-Za-z0-9]/g) ?? []
  let ti = 0
  let tokStart = 0
  let tokDur = 0.4
  let current = ''
  let currentFires: [number, number][] = []
  let injected: string | null = null
  const notes: Note[] = []
  const laneHeat = new Float32Array(LANES.length)
  const V = thumb ? 40 : 66

  const durFor = (tok: string) => clamp(0.26 + tok.trim().length * 0.035, 0.28, 0.62)

  // ── optional sound: firing features as soft plucks ────────────────────────
  let audio: AudioContext | null = null
  let master: GainNode | null = null
  let soundOn = false
  let lastPluck = 0
  const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66]
  const pluck = (lane: number, act: number) => {
    if (!audio || !master || !soundOn) return
    const now = audio.currentTime
    if (now - lastPluck < 0.09) return
    lastPluck = now
    const f = SCALE[SCALE.length - 1 - (lane % SCALE.length)]
    const g = audio.createGain()
    const o = audio.createOscillator()
    const o2 = audio.createOscillator()
    const g2 = audio.createGain()
    const lp = audio.createBiquadFilter()
    o.type = 'triangle'
    o.frequency.value = f
    o2.type = 'sine'
    o2.frequency.value = f * 2
    g2.gain.value = 0.25
    lp.type = 'lowpass'
    lp.frequency.value = 2600
    const peak = 0.05 * clamp(act / 6)
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1)
    o.connect(g)
    o2.connect(g2).connect(g)
    g.connect(lp).connect(master)
    o.start(now)
    o2.start(now)
    o.stop(now + 1.2)
    o2.stop(now + 1.2)
  }

  // ── DOM chrome: legend + sound toggle + hover readout (outside the masked stage) ──
  let legend: HTMLDivElement | null = null
  let tip: HTMLDivElement | null = null
  if (!thumb) {
    const parent = host.parentElement ?? document.body
    legend = document.createElement('div')
    legend.className = 'act-legend'
    legend.innerHTML =
      '<b>activations</b> · SAE features firing on your own words, one token at a time<br/>' +
      '<i>hover any word on the page to run it through the model · illustrative</i>' +
      '<button type="button" class="act-sound" aria-pressed="false">♪ sound off</button>'
    parent.appendChild(legend)
    const btn = legend.querySelector('button')!
    btn.addEventListener('click', () => {
      if (!audio) {
        audio = new AudioContext()
        master = audio.createGain()
        master.gain.value = 0.8
        const comp = audio.createDynamicsCompressor()
        master.connect(comp).connect(audio.destination)
      }
      soundOn = !soundOn
      btn.setAttribute('aria-pressed', String(soundOn))
      btn.textContent = soundOn ? '♪ sound on' : '♪ sound off'
      if (soundOn) audio.resume()
    })
    tip = document.createElement('div')
    tip.className = 'act-tip'
    parent.appendChild(tip)
  }

  // ── hover: read the word under the cursor, straight out of the page ───────
  let hoverWord = ''
  let hoverT = -9
  let hoverTok = ''
  let raf = 0
  let lastEv: PointerEvent | null = null
  const hl =
    typeof CSS !== 'undefined' && 'highlights' in CSS ? (CSS as unknown as { highlights: Map<string, unknown> }).highlights : null
  // the build's CSS parser doesn't know ::highlight() yet, so the rule is added at runtime
  const hlStyle = thumb ? null : document.createElement('style')
  if (hlStyle) {
    hlStyle.textContent = '::highlight(act-word){background-color:rgba(255,150,80,.32)}'
    document.head.appendChild(hlStyle)
  }
  const clearHover = () => {
    hoverWord = ''
    hl?.delete('act-word')
    tip?.classList.remove('on')
  }
  const readHover = () => {
    raf = 0
    const e = lastEv
    if (!e || thumb) return
    const t = e.target as Element | null
    if (!t || !t.closest('.page') || t.closest('.labbar, .decide, .lb, .colophon, button')) return clearHover()
    const doc = document as Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null }
    const r = doc.caretRangeFromPoint?.(e.clientX, e.clientY)
    const node = r?.startContainer
    if (!r || !node || node.nodeType !== 3) return clearHover()
    const text = node.textContent ?? ''
    let a = r.startOffset
    let b = r.startOffset
    const isW = (c: string) => /[A-Za-z0-9’'\-]/.test(c)
    while (a > 0 && isW(text[a - 1])) a--
    while (b < text.length && isW(text[b])) b++
    const word = text.slice(a, b)
    if (word.length < 2) return clearHover()
    const range = document.createRange()
    range.setStart(node, a)
    range.setEnd(node, b)
    const box = range.getBoundingClientRect()
    if (e.clientX < box.left - 2 || e.clientX > box.right + 2 || e.clientY < box.top - 2 || e.clientY > box.bottom + 2) return clearHover()
    if (hl && typeof Highlight !== 'undefined') hl.set('act-word', new Highlight(range))
    if (word !== hoverWord) {
      hoverWord = word
      injected = ' ' + word
    }
    if (tip) {
      const fires = fire(word).sort((p, q) => q[1] - p[1])
      tip.innerHTML =
        `<b>${word.replace(/</g, '&lt;')}</b> → ` +
        fires
          .slice(0, 3)
          .map(([l, act]) => `<span>${LANES[l]} <em>${act.toFixed(2)}</em></span>`)
          .join('<i>·</i>')
      tip.style.transform = `translate(${Math.round(box.left)}px, ${Math.round(box.bottom + 8)}px)`
      tip.classList.add('on')
    }
  }
  const onMove = (e: PointerEvent) => {
    lastEv = e
    if (!raf) raf = requestAnimationFrame(readHover)
  }
  const onLeave = () => clearHover()
  if (!thumb) {
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
  }

  // ── the loop ──────────────────────────────────────────────────────────────
  const nextToken = (t: number) => {
    const tok = injected ?? TOKENS[ti++ % TOKENS.length]
    if (injected) {
      hoverT = t
      hoverTok = injected
    }
    injected = null
    current = tok
    tokStart = t
    tokDur = durFor(tok)
    currentFires = fire(tok).sort((p, q) => q[1] - p[1])
    for (const [lane, act] of currentFires) {
      notes.push({ lane, act, born: t, dur: tokDur, label: act > 3.4 })
      laneHeat[lane] = Math.max(laneHeat[lane], clamp(act / 6))
      if (act > 1.4 && t > 0) pluck(lane, act)
    }
    // sub-threshold flickers: features that almost fired
    const seed = hash(tok + ti)
    for (let k = 0; k < 5; k++) {
      const r = hash(`${seed}:${k}`)
      notes.push({ lane: Math.floor(r * LANES.length), act: 0.15 + hash(`${k}:${seed}`) * 0.5, born: t + r * tokDur * 0.6, dur: tokDur * 0.5, label: false, weak: true })
    }
  }

  // pre-roll: open with the roll already full of recent history
  const prefill = () => {
    const w = surf.w
    const px = w < 1000 ? w - 70 : w - Math.max(160, w * 0.14)
    let tt = -Math.max(8, (px - Math.min(176, w * 0.13)) / V)
    while (tt < 0) {
      nextToken(tt)
      tt += tokDur
    }
    tokStart = tt - tokDur
    laneHeat.fill(0)
  }

  const step = (t: number, dt: number) => {
    const { ctx, w, h } = surf
    ctx.clearRect(0, 0, w, h)
    if (t - tokStart >= tokDur || injected) nextToken(t)
    const dark = theme.mode === 'dark'
    const ink: RGB = dark ? [232, 226, 216] : theme.ink
    const hot: RGB = dark ? [255, 150, 80] : [226, 104, 36]
    const hotHi: RGB = dark ? [255, 226, 180] : [150, 60, 10]
    const top = thumb ? 10 : 92
    const bottom = h - (thumb ? 10 : 34)
    const nL = LANES.length
    const LH = (bottom - top) / nL
    const px = thumb ? w * 0.86 : w < 1000 ? w - 70 : w - Math.max(160, w * 0.14)
    const labelR = thumb ? 0 : Math.min(176, w * 0.13)
    for (let i = 0; i < nL; i++) laneHeat[i] = Math.max(0, laneHeat[i] - dt * 0.7)

    // lanes
    for (let i = 0; i < nL; i++) {
      const y = top + i * LH + LH / 2
      ctx.fillStyle = rgba(ink, i % 5 === 0 ? 0.055 : 0.03)
      ctx.fillRect(0, y, w, 1)
      if (!thumb) {
        const heat = laneHeat[i]
        ctx.font = `${heat > 0.3 ? 500 : 400} 9.5px ${mono}`
        ctx.textAlign = 'right'
        ctx.fillStyle = heat > 0.05 ? rgba(hot, 0.45 + 0.55 * heat) : rgba(ink, 0.3)
        ctx.fillText(LANES[i], labelR, y + 3)
        ctx.textAlign = 'left'
      }
    }

    // notes drifting left from the playhead
    for (let k = notes.length - 1; k >= 0; k--) {
      const n = notes[k]
      const age = t - n.born
      const len = Math.min(n.dur, age) * V
      const right = px - Math.max(0, age - n.dur) * V
      const x = right - len
      if (right < labelR + 8) {
        notes.splice(k, 1)
        continue
      }
      const y = top + n.lane * LH + LH / 2
      const s = clamp(n.act / 6)
      const fadeL = clamp((x - labelR - 8) / 120)
      if (n.weak) {
        ctx.fillStyle = rgba(hot, 0.14 + 0.3 * s)
        ctx.globalAlpha = fadeL
        ctx.fillRect(x, y - 1, Math.max(2, len), 2)
        ctx.globalAlpha = 1
        continue
      }
      const hh = Math.max(3, LH * (0.34 + 0.34 * s))
      ctx.globalAlpha = fadeL
      if (s > 0.55 && dark) {
        ctx.shadowColor = rgba(hot, 0.9)
        ctx.shadowBlur = 12 * s
      }
      ctx.fillStyle = s > 0.75 ? rgba(hotHi, 0.95) : rgba(hot, 0.25 + 0.7 * s)
      ctx.beginPath()
      ctx.roundRect(x, y - hh / 2, Math.max(2, len), hh, hh / 2)
      ctx.fill()
      ctx.shadowBlur = 0
      if (n.label && !thumb && age > n.dur) {
        ctx.font = `9.5px ${mono}`
        ctx.fillStyle = rgba(hot, 0.85 * clamp(1 - (age - n.dur) / 7))
        ctx.fillText(`${LANES[n.lane]} ${n.act.toFixed(1)}`, x, y - hh / 2 - 3)
      }
      ctx.globalAlpha = 1
    }

    // playhead
    const pg = ctx.createLinearGradient(0, top, 0, bottom)
    pg.addColorStop(0, rgba(ink, 0))
    pg.addColorStop(0.5, rgba(ink, 0.3))
    pg.addColorStop(1, rgba(ink, 0))
    ctx.fillStyle = pg
    ctx.fillRect(px, top, 1.5, bottom - top)
    for (const [lane, act] of currentFires) {
      const y = top + lane * LH + LH / 2
      const pulse = clamp(1 - (t - tokStart) / tokDur)
      ctx.fillStyle = rgba(hotHi, 0.5 + 0.5 * pulse)
      ctx.beginPath()
      ctx.arc(px, y, 3 + 3 * clamp(act / 6) * pulse, 0, Math.PI * 2)
      ctx.fill()
    }

    // the token being "heard", plus what's coming
    if (!thumb) {
      const shown = current.replace(/^\s+/, '▁')
      const hover = current === hoverTok && t - hoverT < 1.5
      ctx.font = `500 15px ${mono}`
      const tw = ctx.measureText(shown).width
      const bx = Math.min(w - tw - 30, px - tw / 2 - 12)
      ctx.fillStyle = hover ? rgba(hot, 0.95) : dark ? 'rgba(236,231,223,0.1)' : 'rgba(0,0,0,0.06)'
      ctx.beginPath()
      ctx.roundRect(bx, top - 52, tw + 24, 28, 14)
      ctx.fill()
      ctx.fillStyle = hover ? (dark ? '#1b1410' : '#fff') : rgba(ink, 0.95)
      ctx.fillText(shown, bx + 12, top - 33)
      const topFire = currentFires[0]
      if (topFire) {
        ctx.font = `10px ${mono}`
        ctx.fillStyle = rgba(hot, 0.9)
        ctx.textAlign = 'right'
        ctx.fillText(`${LANES[topFire[0]]} ${topFire[1].toFixed(2)}`, bx + tw + 24, top - 9)
        ctx.textAlign = 'left'
      }
      ctx.font = `12px ${mono}`
      let nx = bx + tw + 34
      for (let k = 0; k < 3; k++) {
        const nt = TOKENS[(ti + k) % TOKENS.length]?.replace(/^\s+/, '▁') ?? ''
        const nw = ctx.measureText(nt).width
        if (nx + nw > w - 8) break
        ctx.fillStyle = rgba(ink, 0.28 - k * 0.07)
        ctx.fillText(nt, nx, top - 33)
        nx += nw + 10
      }
    }
  }

  prefill()
  const loop = runLoop(step, { host })
  return {
    destroy() {
      loop.stop()
      surf.destroy()
      unsub()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
      clearHover()
      legend?.remove()
      tip?.remove()
      hlStyle?.remove()
      audio?.close()
    },
    setPaused: (p) => loop.setPaused(p),
  }
}
