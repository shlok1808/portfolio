/**
 * Canvas + animation-loop plumbing shared by every background and episode.
 *
 * - createSurface: a DPR-aware 2D canvas that fills its host and tracks resizes.
 * - runLoop: a requestAnimationFrame loop that pauses when the tab is hidden or the host
 *   scrolls out of view, and can be throttled to a target fps.
 */

export interface Surface {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  w: number
  h: number
  dpr: number
  /** can be (re)assigned after creation; called after every resize */
  onResize?: (s: Surface) => void
  destroy(): void
}

export function createSurface(
  host: HTMLElement,
  opts: { dprCap?: number; className?: string; onResize?: (s: Surface) => void } = {},
): Surface {
  const canvas = document.createElement('canvas')
  canvas.className = opts.className ?? 'lab-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  const ctx = canvas.getContext('2d', { alpha: true })!
  const s: Surface = {
    canvas,
    ctx,
    w: 1,
    h: 1,
    dpr: 1,
    onResize: opts.onResize,
    destroy() {
      ro.disconnect()
      canvas.remove()
    },
  }
  const resize = () => {
    const r = host.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, opts.dprCap ?? 2)
    const w = Math.max(1, Math.round(r.width))
    const h = Math.max(1, Math.round(r.height))
    if (w === s.w && h === s.h && dpr === s.dpr) return
    s.w = w
    s.h = h
    s.dpr = dpr
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    s.onResize?.(s)
  }
  const ro = new ResizeObserver(resize)
  ro.observe(host)
  resize()
  return s
}

export interface Loop {
  stop(): void
  setPaused(p: boolean): void
  readonly time: number
}

/**
 * step(t, dt): t is seconds of *running* time (it does not advance while paused), dt is capped
 * so a background tab never produces a giant jump.
 */
export function runLoop(
  step: (t: number, dt: number) => void,
  opts: { host?: Element; fps?: number; startTime?: number } = {},
): Loop {
  let raf = 0
  let last = 0
  let t = opts.startTime ?? 0
  let userPaused = false
  let hidden = document.hidden
  let offscreen = false
  let stopped = false
  const minInterval = opts.fps ? 1000 / opts.fps : 0
  let acc = 0

  const frame = (now: number) => {
    raf = 0
    if (stopped || userPaused || hidden || offscreen) {
      last = 0
      return
    }
    const dtMs = last ? now - last : 16.7
    last = now
    if (minInterval) {
      acc += dtMs
      if (acc < minInterval - 1) {
        raf = requestAnimationFrame(frame)
        return
      }
    }
    const dt = Math.min((minInterval ? acc : dtMs) / 1000, 0.05)
    acc = 0
    t += dt
    step(t, dt)
    raf = requestAnimationFrame(frame)
  }
  const kick = () => {
    if (!raf && !stopped && !userPaused && !hidden && !offscreen) raf = requestAnimationFrame(frame)
  }

  const onVis = () => {
    hidden = document.hidden
    kick()
  }
  document.addEventListener('visibilitychange', onVis)

  let io: IntersectionObserver | null = null
  if (opts.host) {
    io = new IntersectionObserver(
      (entries) => {
        offscreen = !entries[0]?.isIntersecting
        kick()
      },
      { rootMargin: '120px' },
    )
    io.observe(opts.host)
  }

  // Draw one frame immediately so a paused / thumbnail surface is never blank.
  step(t, 0)
  kick()

  return {
    stop() {
      stopped = true
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVis)
      io?.disconnect()
    },
    setPaused(p: boolean) {
      userPaused = p
      if (!p) kick()
    },
    get time() {
      return t
    },
  }
}

/** Pointer position relative to an element, tracked on window so canvases can stay pointer-events:none. */
export function trackPointer(el: Element) {
  const state = { x: -9999, y: -9999, active: false, down: false, lastMove: 0 }
  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect()
    state.x = e.clientX - r.left
    state.y = e.clientY - r.top
    state.active = state.x >= 0 && state.y >= 0 && state.x <= r.width && state.y <= r.height
    state.lastMove = performance.now()
  }
  const leave = () => {
    state.active = false
  }
  const down = () => (state.down = true)
  const up = () => (state.down = false)
  window.addEventListener('pointermove', move, { passive: true })
  document.addEventListener('pointerleave', leave)
  window.addEventListener('pointerdown', down, { passive: true })
  window.addEventListener('pointerup', up, { passive: true })
  return {
    state,
    destroy() {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    },
  }
}

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
