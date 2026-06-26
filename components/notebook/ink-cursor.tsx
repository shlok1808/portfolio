"use client"

import { useEffect, useRef } from "react"

type Point = { x: number; y: number; life: number }

const TEXT_SELECTOR = "p, h1, h2, h3, li, a, span"
const FADE_RADIUS = 80

export function InkCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // Skip on touch / coarse pointers — no hover cursor there.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    const points: Point[] = []
    const mouse = { x: -100, y: -100 }
    const trail = { x: -100, y: -100 }
    let pointerInside = false
    // proximity opacity: 1 = visible, 0 = hidden near text
    let proximity = 1
    let targetProximity = 1

    function nearText(x: number, y: number) {
      const els = document.querySelectorAll<HTMLElement>(TEXT_SELECTOR)
      for (const el of els) {
        if (!el.textContent || !el.textContent.trim()) continue
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        const dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0
        const dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0
        if (dx * dx + dy * dy <= FADE_RADIUS * FADE_RADIUS) return true
      }
      return false
    }

    function onMove(e: MouseEvent) {
      mouse.x = e.clientX
      mouse.y = e.clientY
      pointerInside = true
      targetProximity = nearText(e.clientX, e.clientY) ? 0 : 1
    }
    function onLeave() {
      pointerInside = false
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseout", onLeave)

    let raf = 0
    function frame() {
      // drag/delay: trail eases toward the mouse
      trail.x += (mouse.x - trail.x) * 0.18
      trail.y += (mouse.y - trail.y) * 0.18
      // ease proximity opacity (~200ms feel)
      proximity += (targetProximity - proximity) * 0.18

      if (pointerInside) {
        points.push({ x: trail.x, y: trail.y, life: 1 })
      }

      ctx.clearRect(0, 0, width, height)
      for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i]
        p.life -= 0.045
        if (p.life <= 0) {
          points.splice(i, 1)
          continue
        }
        const alpha = p.life * 0.5 * proximity
        if (alpha <= 0.01) continue
        const radius = 1 + p.life * 3.5
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(42, 38, 32, ${alpha})`
        ctx.fill()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseout", onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />
  )
}
