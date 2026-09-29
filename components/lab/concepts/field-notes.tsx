'use client'

import { PortfolioBody } from '../portfolio-body'
import { SteerFigure } from '../abstracts/steer-figure'
import { AuditFigure } from '../abstracts/audit-figure'
import { KycFigure } from '../abstracts/kyc-figure'

/** 23 · Field Notes: a researcher's notebook. Paper, pencil figures, handwriting in the margins. */
export function FieldNotes() {
  return (
    <div className="fn">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="fn-pencil">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="2.6" />
        </filter>
      </svg>
      <p className="fn-note fn-note-name">← that’s me, hi</p>
      <p className="fn-note fn-note-fav">my favourite one ↓</p>
      <PortfolioBody
        explainers={{
          lbys: <SteerFigure />,
          audit: <AuditFigure />,
          kyc: <KycFigure />,
        }}
      />
    </div>
  )
}
