'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CATS, OPTIONS, pad, type LabOption } from './registry'

const KEY = 'lab-shortlist'

export function readShortlist(): number[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function useShortlist() {
  const [list, setList] = useState<number[]>([])
  useEffect(() => {
    setList(readShortlist())
    const sync = () => setList(readShortlist())
    window.addEventListener('storage', sync)
    window.addEventListener('lab-shortlist', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('lab-shortlist', sync)
    }
  }, [])
  const toggle = (n: number) => {
    const cur = readShortlist()
    const next = cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n].sort((a, b) => a - b)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {}
    setList(next)
    window.dispatchEvent(new Event('lab-shortlist'))
  }
  return { list, toggle }
}

export function LabBar({ opt }: { opt: LabOption }) {
  const router = useRouter()
  const idx = OPTIONS.findIndex((o) => o.slug === opt.slug)
  const prev = OPTIONS[(idx - 1 + OPTIONS.length) % OPTIONS.length]
  const next = OPTIONS[(idx + 1) % OPTIONS.length]
  const { list, toggle } = useShortlist()
  const [collapsed, setCollapsed] = useState(false)
  const loved = list.includes(opt.n)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.closest('input, textarea, select, [contenteditable], [data-keys]') || e.metaKey || e.ctrlKey)) return
      if (e.key === 'ArrowRight') router.push(`/lab/${next.slug}`)
      else if (e.key === 'ArrowLeft') router.push(`/lab/${prev.slug}`)
      else if (e.key === 's') toggle(opt.n)
      else if (e.key === 'Escape') router.push('/lab')
      else if (e.key === '.') setCollapsed((c) => !c)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (collapsed) {
    return (
      <button type="button" className="labbar labbar--mini" onClick={() => setCollapsed(false)} title="Show lab bar (.)">
        <span className="labbar-num">{pad(opt.n)}</span> lab
      </button>
    )
  }

  return (
    <div className="labbar" role="navigation" aria-label="Design lab">
      <Link className="labbar-btn" href={`/lab/${prev.slug}`} title={`${pad(prev.n)} · ${prev.name} (←)`}>
        ←
      </Link>
      <div className="labbar-info">
        <div className="labbar-top">
          <span className="labbar-num">
            {pad(opt.n)}
            <span className="labbar-of">/{OPTIONS.length}</span>
          </span>
          <span className="labbar-cat">{CATS[opt.cat].label}</span>
        </div>
        <div className="labbar-name">{opt.name}</div>
        <div className="labbar-blurb">{opt.blurb}</div>
      </div>
      <Link className="labbar-btn" href={`/lab/${next.slug}`} title={`${pad(next.n)} · ${next.name} (→)`}>
        →
      </Link>
      <span className="labbar-div" />
      <button
        type="button"
        className={`labbar-btn labbar-love ${loved ? 'is-on' : ''}`}
        onClick={() => toggle(opt.n)}
        aria-pressed={loved}
        title={loved ? 'Remove from shortlist (s)' : 'Add to shortlist (s)'}
      >
        {loved ? '♥' : '♡'}
      </button>
      <Link className="labbar-btn labbar-grid" href="/lab" title="All 23 options (esc)">
        ⌗
      </Link>
      <button type="button" className="labbar-btn labbar-hide" onClick={() => setCollapsed(true)} title="Hide (.)">
        ×
      </button>
    </div>
  )
}
