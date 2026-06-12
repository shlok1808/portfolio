"use client"

import { useEffect, useRef } from "react"

/**
 * Hero-scoped neural network backdrop.
 *
 * - Layered MLP-style graph with activation pulses flowing left → right.
 * - A slow "activation band" sweeps back and forth through the layers.
 * - Cursor movement emits ripples that physically displace nodes (spring
 *   return), plus a soft aura that follows the pointer.
 * - Renders only behind the hero (absolute within it) and pauses entirely
 *   once the hero scrolls out of view.
 */

interface NNode {
  ox: number
  oy: number
  x: number
  y: number
  vx: number
  vy: number
  r: number
  layer: number
  phase: number
  act: number
  flash: number
}

interface NEdge {
  a: number
  b: number
  cx: number
  cy: number
  glow: number
}

interface Pulse {
  edge: number
  t: number
  speed: number
  hops: number
}

interface Ripple {
  x: number
  y: number
  r: number
  life: number
  strength: number
}

interface Palette {
  edge: [number, number, number]
  node: [number, number, number]
  core: [number, number, number]
  additive: boolean
  edgeAlpha: number
  nodeAlpha: number
  auraAlpha: number
}

const DARK: Palette = {
  edge: [212, 176, 144],
  node: [228, 140, 98],
  core: [255, 226, 204],
  additive: true,
  edgeAlpha: 0.14,
  nodeAlpha: 0.85,
  auraAlpha: 0.07,
}

const LIGHT: Palette = {
  edge: [124, 94, 68],
  node: [180, 78, 40],
  core: [96, 44, 22],
  additive: false,
  edgeAlpha: 0.16,
  nodeAlpha: 0.8,
  auraAlpha: 0.05,
}

function qPoint(ax: number, ay: number, cx: number, cy: number, bx: number, by: number, t: number) {
  const u = 1 - t
  return {
    x: u * u * ax + 2 * u * t * cx + t * t * bx,
    y: u * u * ay + 2 * u * t * cy + t * t * by,
  }
}

export function NeuralBackground() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrapEl = wrapRef.current
    const canvasEl = canvasRef.current
    if (!wrapEl || !canvasEl) return
    const context = canvasEl.getContext("2d")
    if (!context) return
    // non-null aliases so nested closures keep the narrowed types
    const wrap: HTMLDivElement = wrapEl
    const canvas: HTMLCanvasElement = canvasEl
    const ctx: CanvasRenderingContext2D = context

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let width = 0
    let height = 0
    let dpr = 1
    let nodes: NNode[] = []
    let edges: NEdge[] = []
    let outgoing: number[][] = []
    let pulses: Pulse[] = []
    let ripples: Ripple[] = []
    let layerCount = 6
    let palette = document.documentElement.classList.contains("light") ? LIGHT : DARK

    let raf = 0
    let lastTime = 0
    let running = false
    let inView = true
    let lastSpawn = 0
    const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, lastRippleAt: 0, lastX: -9999, lastY: -9999 }

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = wrap.clientWidth
      height = wrap.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const mobile = width < 768
      layerCount = mobile ? 5 : 7
      const perLayerMin = mobile ? 4 : 5
      const perLayerMax = mobile ? 5 : 8

      nodes = []
      edges = []
      pulses = []
      ripples = []

      const xMin = width * 0.05
      const xMax = width * 0.95
      const yMin = height * 0.1
      const yMax = height * 0.9

      const layerNodes: number[][] = []
      for (let l = 0; l < layerCount; l++) {
        const count = perLayerMin + Math.floor(Math.random() * (perLayerMax - perLayerMin + 1))
        const ids: number[] = []
        const lx = xMin + ((xMax - xMin) * l) / (layerCount - 1)
        for (let i = 0; i < count; i++) {
          const ly = yMin + ((yMax - yMin) * (i + 0.5)) / count
          const ox = lx + (Math.random() - 0.5) * width * 0.035
          const oy = ly + (Math.random() - 0.5) * height * 0.07
          ids.push(nodes.length)
          nodes.push({
            ox, oy, x: ox, y: oy, vx: 0, vy: 0,
            r: 1.6 + Math.random() * 1.6,
            layer: l,
            phase: Math.random() * Math.PI * 2,
            act: 0, flash: 0,
          })
        }
        layerNodes.push(ids)
      }

      for (let l = 0; l < layerCount - 1; l++) {
        for (const a of layerNodes[l]) {
          const candidates = [...layerNodes[l + 1]].sort(
            (p, q) => Math.abs(nodes[p].oy - nodes[a].oy) - Math.abs(nodes[q].oy - nodes[a].oy)
          )
          const n = 2 + (Math.random() < 0.35 ? 1 : 0)
          for (const b of candidates.slice(0, n)) {
            const ax = nodes[a].ox, ay = nodes[a].oy
            const bx = nodes[b].ox, by = nodes[b].oy
            const mx = (ax + bx) / 2, my = (ay + by) / 2
            const dx = bx - ax, dy = by - ay
            const len = Math.hypot(dx, dy) || 1
            const bow = len * 0.12 * (Math.random() - 0.5)
            edges.push({ a, b, cx: mx + (-dy / len) * bow, cy: my + (dx / len) * bow, glow: 0 })
          }
        }
      }

      outgoing = nodes.map(() => [])
      edges.forEach((e, i) => outgoing[e.a].push(i))
    }

    function spawnPulse(now: number) {
      const interval = width < 768 ? 420 : 240
      if (now - lastSpawn < interval) return
      lastSpawn = now
      const starts = outgoing
        .map((out, i) => ({ i, out }))
        .filter((n) => nodes[n.i].layer === 0 && n.out.length > 0)
      if (!starts.length) return
      const start = starts[Math.floor(Math.random() * starts.length)]
      const edge = start.out[Math.floor(Math.random() * start.out.length)]
      pulses.push({ edge, t: 0, speed: 0.55 + Math.random() * 0.5, hops: layerCount })
    }

    function addRipple(x: number, y: number, strength: number) {
      ripples.push({ x, y, r: 4, life: 1, strength })
      if (ripples.length > 14) ripples.shift()
    }

    function update(dt: number, now: number) {
      // slow ping-pong activation sweep through the layers
      const sweep = (now * 0.00009) % 2
      const frontier = (sweep < 1 ? sweep : 2 - sweep) * (layerCount - 1)

      mouse.sx += (mouse.x - mouse.sx) * Math.min(dt * 8, 1)
      mouse.sy += (mouse.y - mouse.sy) * Math.min(dt * 8, 1)

      spawnPulse(now)

      for (const node of nodes) {
        const band = Math.exp(-((node.layer - frontier) ** 2) / (2 * 0.95 * 0.95))
        const targetAct = 0.32 + 0.68 * band
        node.act += (targetAct - node.act) * Math.min(dt * 3, 1)
        node.flash = Math.max(0, node.flash - dt * 2.2)

        // spring back to home position after ripple displacement
        node.vx += (node.ox - node.x) * 14 * dt
        node.vy += (node.oy - node.y) * 14 * dt
        node.vx *= Math.exp(-6 * dt)
        node.vy *= Math.exp(-6 * dt)
        node.x += node.vx * dt * 60
        node.y += node.vy * dt * 60
      }

      for (const ripple of ripples) {
        ripple.r += 320 * dt
        ripple.life -= dt * 1.1
        if (ripple.life <= 0) continue
        const bandWidth = 70
        for (const node of nodes) {
          const dx = node.x - ripple.x
          const dy = node.y - ripple.y
          const d = Math.hypot(dx, dy) || 1
          const offset = Math.abs(d - ripple.r)
          if (offset < bandWidth) {
            const force = (1 - offset / bandWidth) * ripple.strength * ripple.life * 26 * dt
            node.vx += (dx / d) * force
            node.vy += (dy / d) * force
            node.flash = Math.min(1, node.flash + force * 0.05)
          }
        }
      }
      ripples = ripples.filter((r) => r.life > 0)

      for (const edge of edges) {
        edge.glow = Math.max(0, edge.glow - dt * 1.6)
      }

      const nextPulses: Pulse[] = []
      for (const pulse of pulses) {
        const edge = edges[pulse.edge]
        pulse.t += pulse.speed * dt
        edge.glow = Math.min(1, edge.glow + dt * 3)
        if (pulse.t >= 1) {
          const arrived = edge.b
          nodes[arrived].flash = 1
          const out = outgoing[arrived]
          if (pulse.hops > 0 && out.length) {
            nextPulses.push({
              edge: out[Math.floor(Math.random() * out.length)],
              t: 0,
              speed: pulse.speed * (0.92 + Math.random() * 0.18),
              hops: pulse.hops - 1,
            })
          }
        } else {
          nextPulses.push(pulse)
        }
      }
      pulses = nextPulses.slice(-60)
    }

    function draw(time: number) {
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = palette.additive ? "lighter" : "source-over"

      const [er, eg, eb] = palette.edge
      const [nr, ng, nb] = palette.node
      const [cr, cg, cb] = palette.core

      // cursor aura
      if (mouse.sx > -999 && !reduceMotion) {
        const aura = ctx.createRadialGradient(mouse.sx, mouse.sy, 0, mouse.sx, mouse.sy, 260)
        aura.addColorStop(0, `rgba(${nr},${ng},${nb},${palette.auraAlpha})`)
        aura.addColorStop(1, `rgba(${nr},${ng},${nb},0)`)
        ctx.fillStyle = aura
        ctx.fillRect(0, 0, width, height)
      }

      // edges
      ctx.lineWidth = 1
      for (const edge of edges) {
        const a = nodes[edge.a]
        const b = nodes[edge.b]
        const act = Math.min(a.act, b.act)
        const alpha = palette.edgeAlpha * (0.45 + 0.55 * act) + edge.glow * 0.22
        ctx.strokeStyle = `rgba(${er},${eg},${eb},${alpha})`
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.quadraticCurveTo(edge.cx, edge.cy, b.x, b.y)
        ctx.stroke()
      }

      // pulses with short trails
      for (const pulse of pulses) {
        const edge = edges[pulse.edge]
        const a = nodes[edge.a]
        const b = nodes[edge.b]
        for (let k = 0; k < 4; k++) {
          const t = Math.max(0, pulse.t - k * 0.045)
          const p = qPoint(a.x, a.y, edge.cx, edge.cy, b.x, b.y, t)
          const alpha = 0.55 - k * 0.13
          const radius = 5.5 - k
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius)
          grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`)
          grad.addColorStop(0.4, `rgba(${nr},${ng},${nb},${alpha * 0.7})`)
          grad.addColorStop(1, `rgba(${nr},${ng},${nb},0)`)
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ripple rings
      for (const ripple of ripples) {
        ctx.strokeStyle = `rgba(${nr},${ng},${nb},${0.16 * ripple.life})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2)
        ctx.stroke()
      }

      // nodes
      for (const node of nodes) {
        const breathe = 0.82 + 0.18 * Math.sin(time * 0.0012 + node.phase)
        const level = Math.min(1.4, node.act * breathe + node.flash * 0.9)
        const glowRadius = node.r * (3 + level * 5)
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius)
        glow.addColorStop(0, `rgba(${nr},${ng},${nb},${0.32 * level})`)
        glow.addColorStop(1, `rgba(${nr},${ng},${nb},0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2)
        ctx.fill()

        const coreMix = Math.min(1, node.flash)
        const rr = Math.round(nr + (cr - nr) * coreMix)
        const rg = Math.round(ng + (cg - ng) * coreMix)
        const rb = Math.round(nb + (cb - nb) * coreMix)
        ctx.fillStyle = `rgba(${rr},${rg},${rb},${Math.min(1, palette.nodeAlpha * (0.5 + 0.6 * level))})`
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r * (1 + 0.45 * level), 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalCompositeOperation = "source-over"
    }

    function loop(time: number) {
      if (!running) return
      const dt = Math.min((time - (lastTime || time)) / 1000, 0.05)
      lastTime = time
      update(dt, time)
      draw(time)
      raf = requestAnimationFrame(loop)
    }

    function drawStatic() {
      // reduced-motion: light the whole network gently, no animation
      for (const node of nodes) node.act = 0.55
      draw(0)
    }

    function setRunning(next: boolean) {
      if (next === running) return
      running = next
      if (running) {
        lastTime = 0
        raf = requestAnimationFrame(loop)
      } else {
        cancelAnimationFrame(raf)
      }
    }

    // --- listeners ---

    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const onPointerMove = (e: PointerEvent) => {
      const p = toLocal(e)
      mouse.x = p.x
      mouse.y = p.y
      if (reduceMotion || p.y < 0 || p.y > height) return
      const now = performance.now()
      const moved = Math.hypot(p.x - mouse.lastX, p.y - mouse.lastY)
      if (now - mouse.lastRippleAt > 110 && moved > 26) {
        addRipple(p.x, p.y, Math.min(moved / 30, 2.2))
        mouse.lastRippleAt = now
        mouse.lastX = p.x
        mouse.lastY = p.y
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      const p = toLocal(e)
      if (!reduceMotion && p.y >= 0 && p.y <= height) addRipple(p.x, p.y, 3.4)
    }

    const onPointerLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    const onResize = () => {
      build()
      if (reduceMotion) drawStatic()
    }

    const onVisibility = () => {
      if (document.hidden) setRunning(false)
      else if (!reduceMotion && inView) setRunning(true)
    }

    // pause the loop entirely once the hero scrolls out of view
    const viewObserver = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        if (reduceMotion) return
        setRunning(inView && !document.hidden)
      },
      { threshold: 0 }
    )
    viewObserver.observe(wrap)

    const themeObserver = new MutationObserver(() => {
      palette = document.documentElement.classList.contains("light") ? LIGHT : DARK
      if (reduceMotion) drawStatic()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(wrap)

    build()
    if (reduceMotion) {
      drawStatic()
    } else {
      setRunning(true)
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerdown", onPointerDown, { passive: true })
    document.documentElement.addEventListener("pointerleave", onPointerLeave)

    return () => {
      setRunning(false)
      viewObserver.disconnect()
      themeObserver.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerdown", onPointerDown)
      document.documentElement.removeEventListener("pointerleave", onPointerLeave)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none [mask-image:linear-gradient(to_bottom,black_72%,transparent)]"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
