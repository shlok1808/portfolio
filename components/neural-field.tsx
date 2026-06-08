"use client"

import { useEffect, useRef } from "react"

interface Node {
  x: number
  y: number
  baseX: number
  baseY: number
  pulse: number
  pulseSpeed: number
  layer: number
}

/**
 * A live, layered node-graph reminiscent of a small neural network.
 * Nodes drift subtly, edges between adjacent layers shimmer, and faint
 * signals travel left-to-right along connections — evoking activations
 * flowing through a model. Rendered on canvas for performance.
 */
export function NeuralField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let nodes: Node[] = []
    const layers = [4, 6, 6, 5, 3]

    function readColors() {
      const styles = getComputedStyle(document.documentElement)
      const accent = styles.getPropertyValue("--accent").trim() || "#8fb4c4"
      const fg = styles.getPropertyValue("--muted-foreground").trim() || "#7c7f86"
      return { accent, fg }
    }
    let colors = readColors()

    function hexToRgb(hex: string) {
      const h = hex.replace("#", "")
      const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
      const n = Number.parseInt(full, 16)
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
    }

    function build() {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      nodes = []
      const padX = width * 0.12
      const usableW = width - padX * 2
      layers.forEach((count, li) => {
        const x = padX + (usableW * li) / (layers.length - 1)
        const padY = height * 0.16
        const usableH = height - padY * 2
        for (let i = 0; i < count; i++) {
          const y = count === 1 ? height / 2 : padY + (usableH * i) / (count - 1)
          nodes.push({
            x,
            y,
            baseX: x,
            baseY: y,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.4 + Math.random() * 0.6,
            layer: li,
          })
        }
      })
    }

    // Precompute edges between adjacent layers
    let edges: { a: number; b: number; phase: number; speed: number }[] = []
    function buildEdges() {
      edges = []
      for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes.length; j++) {
          if (nodes[j].layer === nodes[i].layer + 1) {
            edges.push({
              a: i,
              b: j,
              phase: Math.random(),
              speed: 0.06 + Math.random() * 0.12,
            })
          }
        }
      }
    }

    function resize() {
      build()
      buildEdges()
    }
    resize()

    const accentRgb = hexToRgb(colors.accent)
    const fgRgb = hexToRgb(colors.fg)

    const lastLayer = layers.length - 1

    // Activation waves sweep left→right through the layers, lighting up
    // nodes and edges as they pass — like a forward pass propagating through
    // the network. A new wave is spawned at a gentle cadence.
    let waves: { pos: number; speed: number }[] = [{ pos: 0, speed: 0.9 }]
    let spawnTimer = 0

    // Per-node activation level (0..1), eased toward its wave-driven target.
    const activation = new Float32Array(nodes.length)

    // gaussian falloff of a wave around a given layer
    function waveAt(layer: number) {
      let v = 0
      for (const w of waves) {
        const d = layer - w.pos
        v += Math.exp(-(d * d) / 0.18)
      }
      return Math.min(1, v)
    }

    let t = 0
    function frame(now: number) {
      t += 0.005
      ctx.clearRect(0, 0, width, height)

      if (!prefersReduced) {
        // advance + cull waves (slower so the pulse is readable)
        for (const w of waves) w.pos += w.speed * 0.008
        waves = waves.filter((w) => w.pos < lastLayer + 0.8)
        // spawn new waves periodically
        spawnTimer += 0.008
        if (spawnTimer > 0.9) {
          spawnTimer = 0
          waves.push({ pos: -0.6, speed: 0.75 + Math.random() * 0.4 })
        }
      }

      // update node activations
      for (let i = 0; i < nodes.length; i++) {
        const target = prefersReduced ? 0.3 : waveAt(nodes[i].layer)
        activation[i] += (target - activation[i]) * 0.14
      }

      // edges
      for (const e of edges) {
        const a = nodes[e.a]
        const b = nodes[e.b]
        // an edge lights up when the wave sits between its two layers
        const act = Math.min(activation[e.a], activation[e.b])
        const base = 0.05
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = `rgba(${fgRgb.r},${fgRgb.g},${fgRgb.b},${base + 0.04 * act})`
        ctx.lineWidth = 1
        ctx.stroke()

        // bright accent overlay on active edges
        if (act > 0.03) {
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${0.55 * act})`
          ctx.lineWidth = 1.2
          ctx.stroke()

          // travelling signal riding the active edge
          if (!prefersReduced) {
            e.phase += e.speed * 0.05
            if (e.phase > 1) e.phase -= 1
            const sx = a.x + (b.x - a.x) * e.phase
            const sy = a.y + (b.y - a.y) * e.phase
            const fade = Math.sin(e.phase * Math.PI)
            ctx.beginPath()
            ctx.arc(sx, sy, 1.8, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${0.85 * fade * act})`
            ctx.fill()
          }
        }
      }

      // nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        if (!prefersReduced) {
          n.pulse += 0.01 * n.pulseSpeed
          n.x = n.baseX + Math.sin(n.pulse + t) * 3
          n.y = n.baseY + Math.cos(n.pulse * 0.8 + t) * 3
        }
        const act = activation[i]
        const energy = Math.pow(act, 0.7)

        // outer glow halo — swells dramatically as the wave hits the node
        ctx.beginPath()
        ctx.arc(n.x, n.y, 4 + energy * 18, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${0.02 + energy * 0.22})`
        ctx.fill()

        // mid ring
        ctx.beginPath()
        ctx.arc(n.x, n.y, 3 + energy * 6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${0.06 + energy * 0.3})`
        ctx.fill()

        // core dot — dim at rest, bright when activated
        ctx.beginPath()
        ctx.arc(n.x, n.y, 2 + energy * 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${0.3 + energy * 0.7})`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)

    const handleResize = () => resize()
    window.addEventListener("resize", handleResize)

    // react to theme toggling
    const observer = new MutationObserver(() => {
      colors = readColors()
      const a = hexToRgb(colors.accent)
      const f = hexToRgb(colors.fg)
      accentRgb.r = a.r; accentRgb.g = a.g; accentRgb.b = a.b
      fgRgb.r = f.r; fgRgb.g = f.g; fgRgb.b = f.b
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", handleResize)
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  )
}
