'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Sky } from '@/components/sky'
import { BackgroundStage } from './background-stage'
import { PortfolioBody } from './portfolio-body'
import { LabColophon } from './lab-colophon'
import { bySlug } from './registry'

const FINALISTS = [
  { slug: 'constellation', label: 'Feature Constellation', hint: 'hover a star' },
  { slug: 'logit-lens', label: 'Logit Lens', hint: 'move your cursor over the margins' },
  { slug: 'activations', label: 'Activations', hint: 'hover any word on the page' },
  { slug: 'none', label: 'Horizon', hint: 'your current site' },
] as const
const KEY = 'lab-decide'

/**
 * Finalists side by side on the real page. Switch from the floating bar (or 1–4), or from the
 * footer, which is how the finished site would let you and visitors change it any time.
 */
export function Decide() {
  const [bg, setBg] = useState<string>('constellation')

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('bg')
    let saved: string | null = null
    try {
      saved = localStorage.getItem(KEY)
    } catch {}
    const pick = [q, saved].find((s) => s && FINALISTS.some((f) => f.slug === s))
    if (pick) setBg(pick)
  }, [])

  const choose = (slug: string) => {
    setBg(slug)
    try {
      localStorage.setItem(KEY, slug)
    } catch {}
    history.replaceState(null, '', `?bg=${slug}`)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest('input, textarea, [data-keys]') || e.metaKey || e.ctrlKey) return
      const i = Number(e.key) - 1
      if (i >= 0 && i < FINALISTS.length) choose(FINALISTS[i].slug)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const current = FINALISTS.find((f) => f.slug === bg) ?? FINALISTS[0]
  const horizon = bg === 'none'
  return (
    <div className={`lab-view ${horizon ? 'sky-photo' : 'sky-none'}`} data-option={bg}>
      {horizon ? <Sky /> : <BackgroundStage key={bg} opt={bySlug(bg)!} />}
      <PortfolioBody explainerLinks footer={<LabColophon bg={bg} onBg={choose} />} />
      <div className="decide" role="toolbar" aria-label="Choose a background">
        <span className="decide-k">background</span>
        {FINALISTS.map((f, i) => (
          <button type="button" key={f.slug} className={bg === f.slug ? 'on' : ''} onClick={() => choose(f.slug)} aria-pressed={bg === f.slug}>
            <i>{i + 1}</i>
            {f.label}
          </button>
        ))}
        <span className="decide-hint">{current.hint}</span>
        <Link href="/lab" className="decide-all" title="All options">
          ⌗
        </Link>
      </div>
    </div>
  )
}
