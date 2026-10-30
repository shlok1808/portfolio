'use client'

import dynamic from 'next/dynamic'
import { useState, type ComponentType, type ReactNode } from 'react'
import { Lightbox } from '../lab/explainer-links'

const ep = (name: string) =>
  dynamic(() => import('../lab/episodes/bundles').then((m) => (m as unknown as Record<string, ComponentType>)[name]), { ssr: false })
const fig = (name: string) =>
  dynamic(() => import('../lab/abstracts/bundles').then((m) => (m as unknown as Record<string, ComponentType>)[name]), { ssr: false })

interface Item {
  id: string
  title: string
  venue: ReactNode
  summary: ReactNode
  credit?: ReactNode
  paper?: string
  Ep: ComponentType
  Poster: ComponentType
  Fig: ComponentType
}

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const

const WORK: Item[] = [
  {
    id: 'lbys',
    title: 'Look Before You Steer: Geometry Predicts SAE Feature Steerability',
    venue: (
      <>
        Co-first author. <a href="https://mechinterpworkshop.com/" {...ext}>ICML 2026 Mechanistic Interpretability Workshop</a>;{' '}
        <a href="https://actionable-interpretability.github.io/" {...ext}>COLM 2026 Actionable Interpretability Workshop</a>.
      </>
    ),
    summary: (
      <>
        We show that the decoder geometry of a sparse autoencoder feature predicts how easily it can be steered,
        before any intervention: features with denser decoder neighborhoods need smaller steering coefficients
        (Spearman ρ up to −0.55, AUROC up to 0.82). The result holds across Gemma-2, Llama-3.1 and Qwen3 and weakens
        in the final layers.
      </>
    ),
    credit: (
      <>
        With <a href="https://girishgupta.com/" {...ext}>Girish Gupta</a> and Aditya Shah, through{' '}
        <a href="https://algoverseairesearch.org/" {...ext}>Algoverse</a>.
      </>
    ),
    paper: 'https://openreview.net/pdf?id=UIaLI9XPpq',
    Ep: ep('EpisodeSteer'),
    Poster: ep('PosterSteer'),
    Fig: fig('SteerFigure'),
  },
  {
    id: 'audit',
    title: 'Auditing Behavioral Probes for Contextual Privacy',
    venue: <>Under review.</>,
    summary: (
      <>
        A linear probe on Qwen2.5-7B appeared to predict whether the model would refuse to reveal private information
        in ConfAIde scenarios. Re-annotating the responses showed that 28 of 30 labeled refusals had in fact disclosed
        it, so the probe was tracking the labels rather than the model. A narrower signal holds up: whether the model
        will limit a disclosure is decodable before the first response token (AUROC 0.73, +0.16 over text baselines),
        with no comparable signal in Llama-3.1-8B.
      </>
    ),
    Ep: ep('EpisodeAudit'),
    Poster: ep('PosterAudit'),
    Fig: fig('AuditFigure'),
  },
  {
    id: 'kyc',
    title: 'Interpretability for AI Financial Advisors',
    venue: <>Ongoing, since May 2026.</>,
    summary: (
      <>
        Studying whether a language model acting as a financial advisor represents a client’s risk tolerance
        differently from what it outputs. I built a synthetic client-profile generator grounded in the Grable &amp;
        Lytton risk scale (6,000 profiles) and am using linear probes and activation patching on Gemma-2-9B and
        Llama-3.1-8B to separate genuine belief change from compliance under client pressure.
      </>
    ),
    Ep: ep('EpisodeKyc'),
    Poster: ep('PosterKyc'),
    Fig: fig('KycFigure'),
  },
]

/** Papers and projects as a quiet list; each one opens into a short summary, its explainer and figure. */
export function Work() {
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const [seen, setSeen] = useState<Set<string>>(() => new Set())
  const [box, setBox] = useState<null | { item: Item; kind: 'ep' | 'fig' }>(null)

  const toggle = (id: string) => {
    setOpen((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
    setSeen((s) => new Set(s).add(id))
  }

  return (
    <>
      <ol className="w-list">
        {WORK.map((it) => {
          const isOpen = open.has(it.id)
          return (
            <li key={it.id} className="w-item" data-open={isOpen || undefined}>
              <button
                type="button"
                className="w-head"
                aria-expanded={isOpen}
                aria-controls={`w-${it.id}`}
                onClick={() => toggle(it.id)}
              >
                <span className="w-title">{it.title}</span>
                <span className="w-plus" aria-hidden="true" />
              </button>
              <p className="w-venue">{it.venue}</p>
              <div className="w-body" id={`w-${it.id}`} role="region" aria-label={it.title} inert={!isOpen || undefined}>
                <div className="w-inner">
                  <p className="w-summary">{it.summary}</p>
                  <button
                    type="button"
                    className="w-poster"
                    onClick={() => setBox({ item: it, kind: 'ep' })}
                    aria-label={`Play the explainer video for ${it.title}`}
                  >
                    {seen.has(it.id) && <it.Poster />}
                    <span className="w-poster-cta">
                      <b aria-hidden="true">▶</b> Explainer video
                    </span>
                  </button>
                  <p className="w-links">
                    {it.paper && (
                      <a href={it.paper} {...ext}>
                        Paper
                      </a>
                    )}
                    <button type="button" onClick={() => setBox({ item: it, kind: 'ep' })}>
                      Explainer video
                    </button>
                    <button type="button" onClick={() => setBox({ item: it, kind: 'fig' })}>
                      Summary figure
                    </button>
                  </p>
                  {it.credit && <p className="w-credit">{it.credit}</p>}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
      {box && (
        <Lightbox
          onClose={() => setBox(null)}
          label={`${box.kind === 'ep' ? 'Explainer video' : 'Summary figure'} · ${box.item.title}`}
        >
          {box.kind === 'ep' ? <box.item.Ep /> : <box.item.Fig />}
        </Lightbox>
      )}
    </>
  )
}
