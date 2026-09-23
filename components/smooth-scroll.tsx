'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/** Inertial smooth scrolling (wheel/trackpad). Touch keeps native scrolling; reduced motion opts out. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.085 })
    return () => lenis.destroy()
  }, [])
  return null
}
