"use client"

import { useEffect, useRef } from "react"

/**
 * Site-wide dotted-grid backdrop that warps like jelly around the cursor.
 *
 * The dots near the pointer bulge away from a spring-lagged cursor point;
 * because the point overshoots and settles, the grid wobbles like a soft
 * material instead of snapping. Idle = zero work: the rAF loop stops once
 * the spring settles, leaving a static grid identical to a CSS dot grid.
 */

const SPACING = 56
const RADIUS = 170 // influence radius around the cursor, px
const AMPLITUDE = 12 // max dot displacement, px

export function JellyGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const context = canvasEl.getContext("2d")
    if (!context) return
    const canvas: HTMLCanvasElement = canvasEl
    const ctx: CanvasRenderingContext2D = context

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let width = 0
    let height = 0
    let dpr = 1
    let dotColor = "#202635"
    let raf = 0
    let animating = false
    let lastTime = 0

    // spring-lagged cursor: the lag + overshoot is what makes it feel like jelly
    const target = { x: -9999, y: -9999 }
    const spring = { x: -9999, y: -9999, vx: 0, vy: 0 }

    function readColor() {
      dotColor =
        getComputedStyle(document.documentElement).getPropertyValue("--grid").trim() || dotColor
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawGrid()
    }

    function drawGrid() {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = dotColor

      const offsetX = ((width / 2) % SPACING) - SPACING
      const offsetY = ((height / 2) % SPACING) - SPACING
      const sigma2 = 2 * (RADIUS / 2.2) ** 2
      const active = spring.x > -999

      for (let gx = offsetX; gx < width + SPACING; gx += SPACING) {
        for (let gy = offsetY; gy < height + SPACING; gy += SPACING) {
          let x = gx
          let y = gy
          let lift = 0
          if (active) {
            const dx = gx - spring.x
            const dy = gy - spring.y
            const d2 = dx * dx + dy * dy
            if (d2 < RADIUS * RADIUS * 2.5) {
              const d = Math.sqrt(d2) || 1
              const influence = Math.exp(-d2 / sigma2)
              // push away from the sprung point, plus a touch of its velocity
              // so the field shears in the direction of motion
              x += (dx / d) * influence * AMPLITUDE + spring.vx * influence * 0.045
              y += (dy / d) * influence * AMPLITUDE + spring.vy * influence * 0.045
              lift = influence
            }
          }
          ctx.beginPath()
          ctx.arc(x, y, 1 + lift * 0.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    function loop(time: number) {
      if (!animating) return
      const dt = Math.min((time - (lastTime || time)) / 1000, 0.05)
      lastTime = time

      // under-damped spring → soft overshoot
      spring.vx += (target.x - spring.x) * 90 * dt
      spring.vy += (target.y - spring.y) * 90 * dt
      spring.vx *= Math.exp(-7 * dt)
      spring.vy *= Math.exp(-7 * dt)
      spring.x += spring.vx * dt
      spring.y += spring.vy * dt

      drawGrid()

      const settled =
        Math.abs(target.x - spring.x) < 0.4 &&
        Math.abs(target.y - spring.y) < 0.4 &&
        Math.abs(spring.vx) < 0.5 &&
        Math.abs(spring.vy) < 0.5
      if (settled) {
        animating = false
      } else {
        raf = requestAnimationFrame(loop)
      }
    }

    function wake() {
      if (animating) return
      animating = true
      lastTime = 0
      raf = requestAnimationFrame(loop)
    }

    const onPointerMove = (e: PointerEvent) => {
      target.x = e.clientX
      target.y = e.clientY
      if (spring.x < -999) {
        spring.x = e.clientX
        spring.y = e.clientY
      }
      wake()
    }

    const onScroll = () => {
      // the grid is viewport-fixed, so nudge the spring on scroll too
      if (spring.x > -999) wake()
    }

    const themeObserver = new MutationObserver(() => {
      readColor()
      drawGrid()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    readColor()
    resize()
    window.addEventListener("resize", resize)
    if (!reduceMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true })
      window.addEventListener("scroll", onScroll, { passive: true })
    }

    return () => {
      animating = false
      cancelAnimationFrame(raf)
      themeObserver.disconnect()
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none [mask-image:radial-gradient(ellipse_100%_80%_at_50%_40%,#000_55%,transparent_100%)]"
    />
  )
}
