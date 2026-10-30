'use client'

import { useEffect, useRef, useState } from 'react'
import type { ArtController } from './art/types'

/** Mounts the dithered background and keeps it told where the reading column is. */
export function ArtStage() {
  const host = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el) return
    let ctrl: ArtController | null = null
    let cancelled = false
    let raf = 0
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const measure = () => {
      raf = 0
      const col = document.querySelector('.v2-col')?.getBoundingClientRect()
      if (ctrl && col) ctrl.setLane({ left: col.left, right: col.right })
    }
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }

    import('./art/dither').then((mod) => {
      if (cancelled || !host.current) return
      ctrl = mod.mount(host.current)
      if (still) setTimeout(() => ctrl?.setPaused(true), 200)
      measure()
      requestAnimationFrame(() => setOn(true))
    })
    window.addEventListener('resize', queue)
    const ro = new ResizeObserver(queue)
    ro.observe(document.body)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', queue)
      ro.disconnect()
      ctrl?.destroy()
    }
  }, [])

  return <div ref={host} className={`v2-art ${on ? 'on' : ''}`} aria-hidden="true" />
}
