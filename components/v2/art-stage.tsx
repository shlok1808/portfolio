'use client'

import { useEffect, useRef, useState } from 'react'
import type { ArtController } from './art/types'
import { VARIANTS, type VariantId } from './art/variants'

const KEY = 'v2-bg'

const initialVariant = (): VariantId => {
  const fromUrl = new URLSearchParams(location.search).get('bg')
  let saved: string | null = null
  try {
    saved = localStorage.getItem(KEY)
  } catch {}
  const pick = fromUrl ?? saved
  return VARIANTS.some((v) => v.id === pick) ? (pick as VariantId) : 'contour'
}

type Ctrl = ArtController & { setMode?(id: VariantId): void }

// sunset is its own module; the rest share one shader in ./art/variants
const mountArt = async (host: HTMLElement, id: VariantId): Promise<Ctrl> => {
  document.documentElement.setAttribute('data-bg', id)
  if (id === 'sunset') return (await import('./art/sunset')).mount(host)
  return (await import('./art/variants')).mount(host, id)
}

/**
 * Mounts the dithered background and keeps it told where the reading column is.
 * PREVIEW: also shows a small switcher for comparing background ideas (remove once one is picked).
 */
export function ArtStage() {
  const host = useRef<HTMLDivElement>(null)
  const ctrlRef = useRef<Ctrl | null>(null)
  const bgRef = useRef<VariantId>('contour')
  const measureRef = useRef<() => void>(() => {})
  const [on, setOn] = useState(false)
  const [bg, setBg] = useState<VariantId>('contour')

  useEffect(() => {
    const el = host.current
    if (!el) return
    let cancelled = false
    let raf = 0
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const first = initialVariant()
    setBg(first)
    bgRef.current = first

    const measure = () => {
      raf = 0
      const col = document.querySelector('.v2-col')?.getBoundingClientRect()
      if (ctrlRef.current && col) ctrlRef.current.setLane({ left: col.left, right: col.right })
    }
    measureRef.current = measure
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }

    mountArt(el, first).then((ctrl) => {
      if (cancelled) return ctrl.destroy()
      ctrlRef.current = ctrl
      if (still) setTimeout(() => ctrlRef.current?.setPaused(true), 200)
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
      ctrlRef.current?.destroy()
      ctrlRef.current = null
    }
  }, [])

  const choose = async (id: VariantId) => {
    const was = bgRef.current
    setBg(id)
    bgRef.current = id
    if (was !== 'sunset' && id !== 'sunset' && ctrlRef.current?.setMode) {
      document.documentElement.setAttribute('data-bg', id)
      ctrlRef.current.setMode(id)
    } else if (host.current) {
      ctrlRef.current?.destroy()
      ctrlRef.current = await mountArt(host.current, id)
      measureRef.current()
    }
    try {
      localStorage.setItem(KEY, id)
    } catch {}
    const url = new URL(location.href)
    url.searchParams.set('bg', id)
    history.replaceState(null, '', url)
  }

  return (
    <>
      <div ref={host} className={`v2-art ${on ? 'on' : ''}`} aria-hidden="true" />
      <div className="v2-bgpick" role="group" aria-label="Background preview">
        {VARIANTS.map((v, i) => (
          <button key={v.id} type="button" aria-pressed={bg === v.id} onClick={() => choose(v.id)}>
            <b>{i}</b> {v.label}
          </button>
        ))}
      </div>
    </>
  )
}
