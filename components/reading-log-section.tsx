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
    title: "Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet",
    authors: "Anthropic, 2024",
    summary: "This paper extends sparse autoencoders to production-scale language models. They train SAEs on Claude 3 Sonnet's residual stream and find interpretable features spanning abstract concepts, multilingual representations, and even potentially safety-relevant behaviors.",
    whyItMatters: "It's the first convincing demonstration that SAE-based interpretability can work on frontier models, not just toy systems. The features they find are genuinely surprising and suggest there's real structure to uncover.",
    myTake: "This changed my research direction. Before reading it, I was skeptical SAEs would scale. Now I think they might be our best shot at understanding large models. The safety-relevant features section is particularly interesting — feels like early hints at something important.",
    paperUrl: "https://transformer-circuits.pub/2024/scaling-monosemanticity/",
  },
  {
    title: "Attention Is All You Need",
    authors: "Vaswani et al., 2017",
    summary: "The paper that introduced the Transformer architecture. They show that self-attention mechanisms alone, without recurrence or convolution, can achieve state-of-the-art results on translation tasks while being more parallelizable and faster to train.",
    whyItMatters: "This is the foundation of basically everything in modern ML. Understanding how attention works is prerequisite knowledge for any interpretability work. The architectural simplicity is also what makes mechanistic analysis tractable.",
    myTake: "I re-read this paper every few months and always notice something new. The positional encoding section is more subtle than it first appears. Also, their original model is tiny by today's standards — wild to think about how far things have come.",
    paperUrl: "https://arxiv.org/abs/1706.03762",
  },
  {
    title: "A Mathematical Framework for Transformer Circuits",
    authors: "Elhage et al., 2021",
    summary: "Develops a mathematical framework for understanding how transformers process information. Introduces concepts like the residual stream as a communication channel, attention heads as information movers, and MLPs as feature transformers.",
    whyItMatters: "This paper basically created the field of mechanistic interpretability as we know it. The conceptual framework it provides — residual streams, composition, etc. — is now standard vocabulary in the field.",
    myTake: "The best paper I've ever read for building intuition about transformers. I'd recommend it to anyone, even if you think you understand transformers well. The 'how to think about' sections are gold.",
    paperUrl: "https://transformer-circuits.pub/2021/framework/",
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
