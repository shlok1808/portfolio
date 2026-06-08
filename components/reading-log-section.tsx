"use client"

import { useState, useEffect } from "react"
import { ArrowUpRight } from "lucide-react"
import { useReveal } from "@/hooks/use-reveal"
import { SectionLabel } from "./section-label"

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
    myTake: "The steering case study is the most interesting result, they modified a single hydrophobicity feature at layer 36 changes the predicted 3D structure even when the correct input sequence is provided. Clean causal evidence. The limitation is it's one feature on one protein. The gap between 2,677 interpretable features and one steering demo is real, but for a workshop paper the first result is enough.",
    paperUrl: "https://arxiv.org/pdf/2503.08764",
  },
]

function storageKey(title: string) {
  return `reading-views-${title.slice(0, 30).toLowerCase().replace(/\s+/g, "-")}`
}

function ReadingCard({ entry, index }: { entry: ReadingEntry; index: string }) {
  const key = storageKey(entry.title)
  const [views, setViews] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const stored = Number.parseInt(localStorage.getItem(key) || "0", 10)
    setViews(stored)
  }, [key])

  const handleToggle = () => {
    setOpen((o) => !o)
    if (!open) {
      const next = views + 1
      setViews(next)
      localStorage.setItem(key, String(next))
    }
  }

  return (
    <article className="group border-t border-border py-8">
      <button onClick={handleToggle} className="w-full text-left grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-8">
        <span className="font-mono text-xs text-muted-foreground pt-1.5 group-hover:text-accent transition-colors">
          {index}
        </span>
        <div>
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-serif text-xl sm:text-2xl text-foreground leading-tight group-hover:text-accent transition-colors text-balance">
              {entry.title}
            </h3>
            <a
              href={entry.paperUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 mt-1 text-muted-foreground hover:text-accent transition-colors"
              aria-label="View paper"
            >
              <ArrowUpRight className="w-5 h-5" />
            </a>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground mt-2">{entry.authors}</p>

          <div className={`grid transition-all duration-500 ease-out ${open ? "grid-rows-[1fr] opacity-100 mt-5" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground leading-relaxed text-pretty">{entry.summary}</p>
                <p className="text-muted-foreground leading-relaxed text-pretty">{entry.whyItMatters}</p>
                <div className="pl-4 border-l-2 border-accent/40">
                  <p className="font-mono text-[10px] text-accent uppercase tracking-[0.2em] mb-1.5">My take</p>
                  <p className="text-foreground/90 leading-relaxed italic font-serif text-pretty">{entry.myTake}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.15em]">
              {open ? "click to collapse" : "click to expand"}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/40">
              {views} {views === 1 ? "read" : "reads"}
            </span>
          </div>
        </div>
      </button>
    </article>
  )
}

export function ReadingLogSection() {
  const { ref, visible } = useReveal<HTMLElement>()

  return (
    <section id="reading" ref={ref} className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionLabel index="03">Reading Log</SectionLabel>
        <div className={`grid lg:grid-cols-[0.4fr_1fr] gap-8 lg:gap-16 ${visible ? "animate-fade-in-up" : "opacity-0"}`}>
          <div className="lg:pt-2">
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground leading-tight text-balance">
              Papers I&apos;ve been reading
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70 mt-4 leading-relaxed">
              Notes on what they do<br className="hidden lg:block" /> and why they matter.<br className="hidden lg:block" /> Click any entry to expand.
            </p>
          </div>
          <div>
            {readingLog.map((entry, i) => (
              <ReadingCard key={entry.title} entry={entry} index={String(i + 1).padStart(2, "0")} />
            ))}
            <div className="border-t border-border" />
          </div>
        </div>
      </div>
    </section>
  )
}
