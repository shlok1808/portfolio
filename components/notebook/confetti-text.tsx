"use client"

import { useCallback, useEffect, useRef } from "react"
import type { ReactNode } from "react"

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vrot: number
  w: number
  h: number
  color: string
  life: number
}

const COLORS = [
  "#e23636",
  "#f5a623",
  "#f8e71c",
  "#4a90d9",
  "#7ed321",
  "#bd10e0",
  "#50e3c2",
]

/**
 * Wraps text in a highlighter-style mark. Hovering it fires a short,
 * full-screen confetti burst — a little bait to get people to mouse over.
 */
export function ConfettiText({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(false)

  useEffect(() => {
    const canvas = document.createElement("canvas")
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "100",
    })
    document.body.appendChild(canvas)
    canvasRef.current = canvas

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    return () => {
      window.removeEventListener("resize", resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      canvas.remove()
      canvasRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const W = window.innerWidth
    const H = window.innerHeight
    ctx.clearRect(0, 0, W, H)

    for (const p of particlesRef.current) {
      p.vy += 0.1 // gravity (gentle, so it drifts down slowly)
      p.vx *= 0.985
      p.vy *= 0.992
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vrot
      p.life -= 1

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }

    particlesRef.current = particlesRef.current.filter(
      (p) => p.life > 0 && p.y < H + 40,
    )

    if (particlesRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      ctx.clearRect(0, 0, W, H)
      runningRef.current = false
    }
  }, [])

  const burst = useCallback(() => {
    if (runningRef.current || !canvasRef.current) return
    runningRef.current = true

    const W = window.innerWidth
    const H = window.innerHeight
    const perSide = 80
    const parts: Particle[] = []

    // Two cannons firing inward from the lower-left and lower-right corners.
    const cannon = (originX: number, dir: 1 | -1) => {
      for (let i = 0; i < perSide; i++) {
        // launch up and inward, between ~25° and ~70° above horizontal
        const angle = (25 + Math.random() * 45) * (Math.PI / 180)
        const speed = 8 + Math.random() * 7
        parts.push({
          x: originX,
          y: H * 0.78 + Math.random() * H * 0.18,
          vx: dir * Math.cos(angle) * speed,
          vy: -Math.sin(angle) * speed,
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 0.25,
          w: 5 + Math.random() * 6,
          h: 8 + Math.random() * 8,
          color: COLORS[i % COLORS.length],
          life: 150 + Math.random() * 70,
        })
      }
    }

    cannon(-10, 1)
    cannon(W + 10, -1)

    particlesRef.current = parts
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  return (
    <span
      onMouseEnter={burst}
      className="box-decoration-clone cursor-default rounded-[2px] bg-[rgba(176,92,74,0.28)] px-1 transition-colors hover:bg-[rgba(176,92,74,0.5)]"
    >
      {children}
    </span>
  )
}
