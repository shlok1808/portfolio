'use client'

import { useState } from 'react'
import { BackgroundStage } from '../background-stage'
import { PortfolioBody } from '../portfolio-body'
import { EpisodePlayer } from '../episodes/player'
import { STEER } from '../episodes/steer'
import { AUDIT } from '../episodes/audit'
import { KYC } from '../episodes/kyc'
import { bySlug } from '../registry'
import type { Episode } from '../episodes/engine'

// each paper as a constellation (points in a 200×120 box), shaped after its key figure
const SKY: { ep: Episode; title: string; venue: string; name: string; pts: [number, number][]; lines: [number, number][] }[] = [
  {
    ep: STEER,
    title: 'Look Before You Steer',
    venue: 'ICML 2026 MI Workshop · COLM 2026',
    name: 'the dose–response curve',
    pts: [[10, 100], [45, 98], [75, 92], [100, 70], [120, 38], [150, 20], [190, 16]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
  },
  {
    ep: AUDIT,
    title: 'Auditing Behavioral Probes for Contextual Privacy',
    venue: 'ConfAIde · under review',
    name: 'the magnifying glass',
    pts: [[70, 20], [104, 30], [114, 62], [96, 88], [62, 90], [42, 62], [48, 32], [128, 100], [160, 118]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [3, 7], [7, 8]],
  },
  {
    ep: KYC,
    title: 'Interpretability for AI Financial Advisors',
    venue: 'Mechanistic KYC · ongoing',
    name: 'the balance',
    pts: [[100, 14], [100, 104], [30, 40], [170, 40], [14, 76], [46, 76], [154, 76], [186, 76], [70, 110], [130, 110]],
    lines: [[0, 1], [2, 3], [2, 4], [2, 5], [4, 5], [3, 6], [3, 7], [6, 7], [8, 9]],
  },
]

export function Observatory() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="sky-none ob-page">
      <BackgroundStage opt={bySlug('constellation')!} />
      <PortfolioBody
        research={
          <div className="ob-grid">
            {SKY.map((s, i) => (
              <button type="button" key={s.title} className="ob-card" onClick={() => setOpen(i)}>
                <svg viewBox="-10 -10 220 140" className="ob-svg" aria-hidden="true">
                  {s.lines.map(([a, b], k) => (
                    <line key={k} x1={s.pts[a][0]} y1={s.pts[a][1]} x2={s.pts[b][0]} y2={s.pts[b][1]} />
                  ))}
                  {s.pts.map(([x, y], k) => (
                    <circle key={k} cx={x} cy={y} r={k % 3 === 0 ? 3.6 : 2.4} />
                  ))}
                </svg>
                <span className="ob-name">{s.name}</span>
                <span className="ob-title">{s.title}</span>
                <span className="ob-venue">{s.venue}</span>
                <span className="ob-cta">observe →</span>
              </button>
            ))}
          </div>
        }
      />
      {open !== null && (
        <div className="ob-modal" onClick={() => setOpen(null)}>
          <div className="ob-scope" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ob-close" onClick={() => setOpen(null)} aria-label="Close">
              ×
            </button>
            <EpisodePlayer episode={SKY[open].ep} />
          </div>
        </div>
      )}
    </div>
  )
}
