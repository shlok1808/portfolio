"use client"

import { useEffect, useRef } from "react"

/**
 * Full-viewport neural network background.
 *
 * - Layered MLP-style graph with activation pulses flowing left → right.
 * - Scroll sweeps a bright "activation band" through the layers, so each
 *   section of the page lights up a different depth of the network.
 * - Hovering a research card (via the `nn-card` CustomEvent) pulls glowing
 *   connection lines from nearby nodes toward that card.
 * - Cursor movement emits ripples that physically displace nodes (spring
 *   return), plus a soft aura that follows the pointer.
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
  hover: number
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

interface CardLink {
  key: string
  el: HTMLElement
  nodes: number[]
  progress: number
  target: number
  pulses: number[]
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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const context = canvasEl.getContext("2d")
    if (!context) return
    // non-null aliases so nested closures keep the narrowed types
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
    let links: CardLink[] = []
    let layerCount = 6
    let palette = document.documentElement.classList.contains("light") ? LIGHT : DARK

    let raf = 0
    let lastTime = 0
    let running = true
    let scrollSmooth = 0
    let lastSpawn = 0
    const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, lastRippleAt: 0, lastX: -9999, lastY: -9999 }

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
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
      links = []

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
            act: 0, flash: 0, hover: 0,
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

    function frontierAt(progress: number) {
      return progress * (layerCount - 1)
    }

    function update(dt: number, now: number) {
      const doc = document.documentElement
      const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1)
      const target = Math.min(window.scrollY / maxScroll, 1)
      scrollSmooth += (target - scrollSmooth) * Math.min(dt * 4, 1)
      const frontier = frontierAt(scrollSmooth)

      mouse.sx += (mouse.x - mouse.sx) * Math.min(dt * 8, 1)
      mouse.sy += (mouse.y - mouse.sy) * Math.min(dt * 8, 1)

      spawnPulse(now)

      for (const node of nodes) {
        const band = Math.exp(-((node.layer - frontier) ** 2) / (2 * 0.95 * 0.95))
        const targetAct = 0.32 + 0.68 * band
        node.act += (targetAct - node.act) * Math.min(dt * 3, 1)
        node.flash = Math.max(0, node.flash - dt * 2.2)
        node.hover = Math.max(0, node.hover - dt * 2.5)

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

      for (const link of links) {
        link.progress += (link.target - link.progress) * Math.min(dt * 6, 1)
        if (link.target > 0) {
          for (const id of link.nodes) nodes[id].hover = 1
          link.pulses = link.pulses
            .map((t) => t + dt * 0.9)
            .filter((t) => t < 1)
          if (Math.random() < dt * 6) link.pulses.push(0)
        }
      }
      links = links.filter((l) => l.target > 0 || l.progress > 0.02)
    }

    function cardAnchor(rect: DOMRect, fromX: number, fromY: number) {
      // point on the card border along the line from the node to card center
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = cx - fromX
      const dy = cy - fromY
      const hw = rect.width / 2 - 6
      const hh = rect.height / 2 - 6
      const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh, 1e-6)
      return { x: cx - dx * Math.min(scale, 1), y: cy - dy * Math.min(scale, 1) }
    }

    function draw(time: number) {
      ctx.clearRect(0, 0, width, height)

      const vh = window.innerHeight
      const fade = Math.max(0.4, 1 - (window.scrollY / vh) * 0.6)
      ctx.globalCompositeOperation = palette.additive ? "lighter" : "source-over"

      const [er, eg, eb] = palette.edge
      const [nr, ng, nb] = palette.node
      const [cr, cg, cb] = palette.core

      // cursor aura
      if (mouse.sx > -999 && !reduceMotion) {
        const aura = ctx.createRadialGradient(mouse.sx, mouse.sy, 0, mouse.sx, mouse.sy, 260)
        aura.addColorStop(0, `rgba(${nr},${ng},${nb},${palette.auraAlpha * fade})`)
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
        const alpha = (palette.edgeAlpha * (0.45 + 0.55 * act) + edge.glow * 0.22) * fade
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
          const alpha = (0.55 - k * 0.13) * fade
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
        ctx.strokeStyle = `rgba(${nr},${ng},${nb},${0.16 * ripple.life * fade})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2)
        ctx.stroke()
      }

      // card connection lines
      for (const link of links) {
        if (link.progress < 0.02) continue
        const rect = link.el.getBoundingClientRect()
        for (const id of link.nodes) {
          const node = nodes[id]
          const anchor = cardAnchor(rect, node.x, node.y)
          const mx = (node.x + anchor.x) / 2
          const my = (node.y + anchor.y) / 2
          const dx = anchor.x - node.x
          const dy = anchor.y - node.y
          const len = Math.hypot(dx, dy) || 1
          const bow = len * 0.14 * (id % 2 === 0 ? 1 : -1)
          const ctrlX = mx + (-dy / len) * bow
          const ctrlY = my + (dx / len) * bow

          const steps = 26
          const drawn = Math.max(2, Math.floor(steps * link.progress))
          ctx.strokeStyle = `rgba(${nr},${ng},${nb},${0.65 * link.progress})`
          ctx.lineWidth = 1.4
          ctx.beginPath()
          for (let s = 0; s <= drawn; s++) {
            const p = qPoint(node.x, node.y, ctrlX, ctrlY, anchor.x, anchor.y, s / steps)
            if (s === 0) ctx.moveTo(p.x, p.y)
            else ctx.lineTo(p.x, p.y)
          }
          ctx.stroke()

          // endpoint dot on the card border
          if (link.progress > 0.92) {
            ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.9 * link.progress})`
            ctx.beginPath()
            ctx.arc(anchor.x, anchor.y, 2, 0, Math.PI * 2)
            ctx.fill()
          }

          // pulses travelling toward the card
          for (const t of link.pulses) {
            if (t > link.progress) continue
            const p = qPoint(node.x, node.y, ctrlX, ctrlY, anchor.x, anchor.y, t)
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 5)
            grad.addColorStop(0, `rgba(${cr},${cg},${cb},${0.8 * link.progress})`)
            grad.addColorStop(1, `rgba(${nr},${ng},${nb},0)`)
            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // nodes
      for (const node of nodes) {
        const breathe = 0.82 + 0.18 * Math.sin(time * 0.0012 + node.phase)
        const level = Math.min(1.4, node.act * breathe + node.flash * 0.9 + node.hover * 0.8)
        const glowRadius = node.r * (3 + level * 5)
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius)
        glow.addColorStop(0, `rgba(${nr},${ng},${nb},${0.32 * level * fade})`)
        glow.addColorStop(1, `rgba(${nr},${ng},${nb},0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2)
        ctx.fill()

        const coreMix = Math.min(1, node.flash + node.hover)
        const rr = Math.round(nr + (cr - nr) * coreMix)
        const rg = Math.round(ng + (cg - ng) * coreMix)
        const rb = Math.round(nb + (cb - nb) * coreMix)
        ctx.fillStyle = `rgba(${rr},${rg},${rb},${Math.min(1, palette.nodeAlpha * (0.5 + 0.6 * level)) * fade})`
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

    // --- listeners ---

    const onPointerMove = (e: PointerEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      if (reduceMotion) return
      const now = performance.now()
      const moved = Math.hypot(e.clientX - mouse.lastX, e.clientY - mouse.lastY)
      if (now - mouse.lastRippleAt > 110 && moved > 26) {
        addRipple(e.clientX, e.clientY, Math.min(moved / 30, 2.2))
        mouse.lastRippleAt = now
        mouse.lastX = e.clientX
        mouse.lastY = e.clientY
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (!reduceMotion) addRipple(e.clientX, e.clientY, 3.4)
    }

    const onPointerLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    const onCardEvent = (e: Event) => {
      const { key, el, active } = (e as CustomEvent<{ key: string; el: HTMLElement; active: boolean }>).detail
      const existing = links.find((l) => l.key === key)
      if (!active) {
        if (existing) existing.target = 0
        return
      }
      if (existing) {
        existing.target = 1
        existing.el = el
        return
      }
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const picked = nodes
        .map((n, i) => ({ i, d: Math.hypot(n.x - cx, n.y - cy) }))
        .filter((n) => {
          const node = nodes[n.i]
          return node.x < rect.left - 16 || node.x > rect.right + 16 || node.y < rect.top - 16 || node.y > rect.bottom + 16
        })
        .sort((p, q) => p.d - q.d)
        .slice(0, width < 768 ? 4 : 7)
        .map((n) => n.i)
      links.push({ key, el, nodes: picked, progress: 0, target: 1, pulses: [0] })
      if (reduceMotion) drawStatic()
    }

    const onResize = () => {
      build()
      if (reduceMotion) drawStatic()
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!reduceMotion && !running) {
        running = true
        lastTime = 0
        raf = requestAnimationFrame(loop)
      }
    }

    const themeObserver = new MutationObserver(() => {
      palette = document.documentElement.classList.contains("light") ? LIGHT : DARK
      if (reduceMotion) drawStatic()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    build()
    if (reduceMotion) {
      drawStatic()
      running = false
    } else {
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerdown", onPointerDown, { passive: true })
    document.documentElement.addEventListener("pointerleave", onPointerLeave)
    window.addEventListener("nn-card", onCardEvent)
    window.addEventListener("resize", onResize)
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      themeObserver.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerdown", onPointerDown)
      document.documentElement.removeEventListener("pointerleave", onPointerLeave)
      window.removeEventListener("nn-card", onCardEvent)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
    />
  )
}

/** Helper for components that want to activate the network on hover. */
export function emitCardHover(key: string, el: HTMLElement, active: boolean) {
  window.dispatchEvent(new CustomEvent("nn-card", { detail: { key, el, active } }))
}
