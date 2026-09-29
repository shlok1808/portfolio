'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Paper } from './registry'

const ep = (name: string) =>
  dynamic(() => import('./episodes/bundles').then((m) => (m as unknown as Record<string, ComponentType>)[name]), { ssr: false })
const fig = (name: string) =>
  dynamic(() => import('./abstracts/bundles').then((m) => (m as unknown as Record<string, ComponentType>)[name]), { ssr: false })

const CONTENT: Record<Paper, { Ep: ComponentType; Fig: ComponentType; title: string }> = {
  lbys: { Ep: ep('EpisodeSteer'), Fig: fig('SteerFigure'), title: 'Look Before You Steer' },
  audit: { Ep: ep('EpisodeAudit'), Fig: fig('AuditFigure'), title: 'Auditing Behavioral Probes for Contextual Privacy' },
  kyc: { Ep: ep('EpisodeKyc'), Fig: fig('KycFigure'), title: 'Interpretability for AI Financial Advisors' },
}

/**
 * The paper's link row: `paper · video explanation · summary figure`. The video and the figure
 * stay hidden until clicked, then open over the page and close with the button, Esc, or a click
 * outside.
 */
export function ExplainerLinks({ paper, paperHref }: { paper: Paper; paperHref?: string }) {
  const [open, setOpen] = useState<null | 'ep' | 'fig'>(null)
  const c = CONTENT[paper]
  return (
    <>
      <p className="links xl-row">
        {paperHref && (
          <>
            <a href={paperHref} target="_blank" rel="noopener noreferrer">
              paper
            </a>
            <span className="sep">·</span>
          </>
        )}
        <button type="button" className="xl-link" onClick={() => setOpen('ep')}>
          video explanation
        </button>
        <span className="sep">·</span>
        <button type="button" className="xl-link" onClick={() => setOpen('fig')}>
          summary figure
        </button>
      </p>
      {open && (
        <Lightbox onClose={() => setOpen(null)} label={`${open === 'ep' ? 'Video explanation' : 'Summary figure'} · ${c.title}`}>
          {open === 'ep' ? <c.Ep /> : <c.Fig />}
        </Lightbox>
      )}
    </>
  )
}

export function Lightbox({ children, onClose, label }: { children: ReactNode; onClose: () => void; label?: string }) {
  const [host, setHost] = useState<Element | null>(null)
  useEffect(() => {
    // stay inside .lab-root so the lab's font variables still apply
    setHost(document.querySelector('.lab-root, .site-fx') ?? document.body)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      html.style.overflow = prev
    }
  }, [onClose])
  if (!host) return null
  return createPortal(
    <div className="lb" role="dialog" aria-modal="true" aria-label={label} onClick={onClose} data-lenis-prevent>
      <div className="lb-panel" onClick={(e) => e.stopPropagation()}>
        <div className="lb-bar">
          <span className="lb-label">{label}</span>
          <button type="button" className="lb-close" onClick={onClose}>
            close <b aria-hidden="true">✕</b>
          </button>
        </div>
        {children}
        <p className="lb-hint">esc or click outside to close</p>
      </div>
    </div>,
    host,
  )
}
