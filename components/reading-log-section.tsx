"use client"

import { useState, useEffect } from "react"
import { ExternalLink } from "lucide-react"

interface ReadingEntry {
  title: string
  authors: string
  summary: string
  whyItMatters: string
  myTake: string
  paperUrl: string
}

const readingLog: ReadingEntry[] = [
  {
    title: "Towards Interpretable Protein Structure Prediction with Sparse Autoencoders",
    authors: "Parsan, Yang, Yang (Reticular / UPenn), 2025",
    summary: "Scales SAEs to ESM2-3B, the base model underlying ESMFold, enabling mechanistic interpretability of protein structure prediction for the first time. Also introduces Matryoshka SAEs — a hierarchical architecture where nested feature groups capture biology at different scales, from local amino acid patterns to full domain folds.",
    whyItMatters: "First paper to apply mechanistic interpretability to protein structure prediction. The Swiss-Prot concept evaluation finds 2,677 feature-concept pairs with F1 > 0.5 across 476 biological concepts, showing SAEs scale to non-language domains.",
    myTake: "The steering case study is the most interesting result — modifying a single hydrophobicity feature at layer 36 changes the predicted 3D structure even when the correct input sequence is provided. Clean causal evidence. The limitation is it's one feature on one protein. The gap between 2,677 interpretable features and one steering demo is real, but for a workshop paper the first result is enough.",
    paperUrl: "https://arxiv.org/abs/2503.08764",
  },
]

function storageKey(title: string) {
  return `reading-views-${title.slice(0, 30).toLowerCase().replace(/\s+/g, '-')}`
}

function ReadingCard({ entry }: { entry: ReadingEntry }) {
  const key = storageKey(entry.title)
  const [views, setViews] = useState(0)

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(key) || '0', 10)
    setViews(stored)
  }, [key])

  const handleClick = () => {
    const next = views + 1
    setViews(next)
    localStorage.setItem(key, String(next))
  }

  return (
    <article
      className="p-5 rounded-xl bg-card border border-border cursor-default"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            {entry.title}
          </h3>
          <p className="text-xs text-muted-foreground">{entry.authors}</p>
        </div>
        <a
          href={entry.paperUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-2 rounded-lg bg-secondary text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
          aria-label="View paper"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-muted-foreground leading-relaxed">{entry.summary}</p>
        </div>
        <div>
          <p className="text-muted-foreground leading-relaxed">{entry.whyItMatters}</p>
        </div>
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-medium text-primary/80 uppercase tracking-wide mb-1">My take</p>
          <p className="text-foreground/90 leading-relaxed italic">{entry.myTake}</p>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <span className="text-xs text-muted-foreground/40">
          {views} {views === 1 ? 'view' : 'views'}
        </span>
      </div>
    </article>
  )
}

export function ReadingLogSection() {
  return (
    <section id="reading" className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-2">Reading Log</h2>
        <p className="text-muted-foreground mb-8">
          Papers I&apos;ve been reading, with notes on what they do and why they matter.
        </p>
        <div className="grid gap-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin">
          {readingLog.map((entry) => (
            <ReadingCard key={entry.title} entry={entry} />
          ))}
        </div>
      </div>
    </section>
  )
}
