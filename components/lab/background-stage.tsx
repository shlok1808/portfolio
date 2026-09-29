'use client'

import { useEffect, useRef } from 'react'
import type { BgController, BgMount } from './lib/types'
import type { LabOption } from './registry'

type Loader = () => Promise<{ mount: BgMount }>

export const BG_LOADERS: Record<string, Loader> = {
  'living-horizon': () => import('./backgrounds/living-horizon'),
  'star-trails': () => import('./backgrounds/star-trails'),
  aurora: () => import('./backgrounds/aurora'),
  constellation: () => import('./backgrounds/constellation'),
  'residual-stream': () => import('./backgrounds/residual-stream'),
  'loss-landscape': () => import('./backgrounds/loss-landscape'),
  'logit-lens': () => import('./backgrounds/logit-lens'),
  'dither-sky': () => import('./backgrounds/dither-sky'),
  superposition: () => import('./backgrounds/superposition'),
  nebula: () => import('./backgrounds/nebula'),
  activations: () => import('./backgrounds/activations'),
}

/** Mounts a vanilla background module into a positioned host and tears it down on unmount. */
export function useBackground(slug: string, host: React.RefObject<HTMLElement | null>, thumb = false, still = false) {
  const ctrl = useRef<BgController | null>(null)
  useEffect(() => {
    let cancelled = false
    const el = host.current
    const load = BG_LOADERS[slug]
    if (!el || !load) return
    load().then((mod) => {
      if (cancelled || !host.current) return
      ctrl.current = mod.mount(host.current, { thumb })
      // reduced motion: keep the first frame, stop animating
      if (still) setTimeout(() => ctrl.current?.setPaused(true), 150)
    })
    return () => {
      cancelled = true
      ctrl.current?.destroy()
      ctrl.current = null
    }
  }, [slug, host, thumb, still])
  return ctrl
}

export function BackgroundStage({ opt, still = false }: { opt: LabOption; still?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useBackground(opt.slug, ref, false, still)

  // Fixed backgrounds keep a clear reading lane: the text column sits on calm ground, the
  // animation lives in the margins and behind the name. --hb tracks the bottom of the masthead
  // (in viewport px) so the lane is only "open" to the animation up in the header.
  useEffect(() => {
    if (opt.layer !== 'fixed') return
    const el = ref.current
    if (!el) return
    const rest = opt.rest ?? 0.8
    const mast = document.querySelector('.masthead')
    let raf = 0
    const update = () => {
      raf = 0
      const p = Math.min(1, window.scrollY / (window.innerHeight * 0.75))
      el.style.opacity = String(1 - (1 - rest) * p)
      const hb = mast ? mast.getBoundingClientRect().bottom : window.innerHeight * 0.5
      el.style.setProperty('--hb', `${Math.round(hb)}px`)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [opt])

  return (
    <div
      ref={ref}
      className={`bg-stage bg-${opt.layer ?? 'hero'} ${opt.layer === 'fixed' ? 'has-lane' : ''}`}
      data-bg={opt.slug}
      aria-hidden="true"
    />
  )
}
