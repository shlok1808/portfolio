'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/**
 * Inertial smooth scrolling (wheel/trackpad) for the photography page and the design lab. The
 * homepage scrolls natively: the easing read as lag there. Touch keeps native scrolling; reduced
 * motion opts out.
 */
export function SmoothScroll() {
  const pathname = usePathname()
  useEffect(() => {
    if (pathname === '/' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.085 })
    return () => lenis.destroy()
  }, [pathname])
  return null
}
