'use client'

import { useEffect } from 'react'
import { Sky } from '@/components/sky'
import { PortfolioBody } from './portfolio-body'
import { BackgroundStage } from './background-stage'
import { LabBar } from './lab-bar'
import { EXPLAINERS, CONCEPTS } from './slots'
import { bySlug } from './registry'

export function LabPreview({ slug }: { slug: string }) {
  const opt = bySlug(slug)!

  // Explainer previews open on the paper they belong to.
  useEffect(() => {
    if (!opt.paper) return
    // wait until the (lazy-loaded) explainer has real height, then centre it
    let tries = 0
    const id = setInterval(() => {
      const slot = document.querySelector<HTMLElement>(`#paper-${opt.paper} .explainer-slot`)
      tries++
      if ((slot && slot.offsetHeight > 120) || tries > 20) {
        clearInterval(id)
        ;(slot ?? document.getElementById(`paper-${opt.paper}`))?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 150)
    return () => clearInterval(id)
  }, [opt])

  if (opt.cat === 'concept') {
    const Concept = CONCEPTS[opt.slug]
    return (
      <div className="lab-view lab-concept" data-option={opt.slug}>
        {Concept ? <Concept /> : null}
        <LabBar opt={opt} />
      </div>
    )
  }

  if (opt.cat === 'background') {
    return (
      <div className={`lab-view sky-${opt.sky ?? 'photo'}`} data-option={opt.slug}>
        {opt.sky !== 'none' && <Sky />}
        <BackgroundStage opt={opt} />
        <PortfolioBody explainerLinks />
        <LabBar opt={opt} />
      </div>
    )
  }

  const Explainer = EXPLAINERS[opt.slug]
  return (
    <div className="lab-view sky-photo" data-option={opt.slug}>
      <Sky />
      <PortfolioBody explainers={Explainer && opt.paper ? { [opt.paper]: <Explainer /> } : {}} />
      <LabBar opt={opt} />
    </div>
  )
}
