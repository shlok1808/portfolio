"use client"

import { useEffect, useRef } from "react"

/**
 * Site-wide cursor ripple layer.
 *
 * Very faint rings that bloom out from the pointer as it moves — just
 * enough motion to make the page feel alive without competing with text.
 * The rAF loop only runs while ripples are on screen.
 */

interface Ring {
  x: number
  y: number
  r: number
  life: number
}

const DARK_RGB = [179, 174, 135] as const
const LIGHT_RGB = [108, 104, 69] as const

export function CursorRipple() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const context = canvasEl.getContext("2d")
    if (!context) return
    const canvas: HTMLCanvasElement = canvasEl
    const ctx: CanvasRenderingContext2D = context

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let width = 0
    let height = 0
    let dpr = 1
    let rings: Ring[] = []
    let raf = 0
    let animating = false
    let lastTime = 0
    let rgb = document.documentElement.classList.contains("light") ? LIGHT_RGB : DARK_RGB
    const last = { x: -9999, y: -9999, at: 0 }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function loop(time: number) {
      if (!animating) return
      const dt = Math.min((time - (lastTime || time)) / 1000, 0.05)
      lastTime = time

      ctx.clearRect(0, 0, width, height)
      for (const ring of rings) {
        ring.r += 150 * dt
        ring.life -= dt * 0.85
        if (ring.life <= 0) continue
        const alpha = 0.055 * ring.life * ring.life
        ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2)
        ctx.stroke()
      }
      rings = rings.filter((r) => r.life > 0)

      if (rings.length) {
        raf = requestAnimationFrame(loop)
      } else {
        animating = false
        ctx.clearRect(0, 0, width, height)
      }
    }

    function wake() {
      if (animating) return
      animating = true
      lastTime = 0
      raf = requestAnimationFrame(loop)
    }

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now()
      const moved = Math.hypot(e.clientX - last.x, e.clientY - last.y)
      if (now - last.at > 160 && moved > 32) {
        rings.push({ x: e.clientX, y: e.clientY, r: 6, life: 1 })
        if (rings.length > 8) rings.shift()
        last.x = e.clientX
        last.y = e.clientY
        last.at = now
        wake()
      }
    }

    const themeObserver = new MutationObserver(() => {
      rgb = document.documentElement.classList.contains("light") ? LIGHT_RGB : DARK_RGB
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("pointermove", onPointerMove, { passive: true })

    return () => {
      animating = false
      cancelAnimationFrame(raf)
      themeObserver.disconnect()
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", onPointerMove)
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
