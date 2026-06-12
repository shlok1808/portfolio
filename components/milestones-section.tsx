"use client"

import { ArrowUpRight } from "lucide-react"
import { useReveal } from "@/hooks/use-reveal"

const milestones: {
  date: string
  title: string
  detail: string
  href?: string
  highlight?: boolean
}[] = [
  {
    date: "Jun 2026",
    title: "ICML 2026 acceptance",
    detail: "“Look Before You Steer” accepted at the Mechanistic Interpretability Workshop, Seoul",
    href: "https://mechinterpworkshop.com/",
    highlight: true,
  },
  {
    date: "Jun 2026",
    title: "New research direction",
    detail: "Probing contextual privacy norms in LLMs with Natural Language Autoencoders",
  },
  {
    date: "2025",
    title: "Algoverse AI Research",
    detail: "Joined the research program — SAE steerability project with mentorship",
  },
  {
    date: "2025",
    title: "BlueDot AI Safety",
    detail: "Attending BlueDot Impact's AI Safety program — alignment fundamentals",
    href: "https://bluedot.org",
  },
]

export function MilestonesSection() {
  const { ref, visible } = useReveal<HTMLElement>()

  return (
    <section id="milestones" ref={ref} className="relative py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className={`flex items-center gap-3 mb-10 ${visible ? "animate-fade-in-up" : "opacity-0"}`}>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Recent milestones
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          {/* connecting line, echoes the network aesthetic */}
          <span
            aria-hidden="true"
            className="hidden lg:block absolute top-[3px] left-2 right-2 h-px bg-gradient-to-r from-accent/40 via-border to-border"
          />
          {milestones.map((m, index) => {
            const body = (
              <>
                <span className="relative flex w-[7px] h-[7px] mb-4">
                  {m.highlight && (
                    <span className="absolute inline-flex w-full h-full rounded-full bg-accent animate-soft-ping" />
                  )}
                  <span
                    className={`relative inline-flex w-[7px] h-[7px] rounded-full ${
                      m.highlight ? "bg-accent" : "bg-muted-foreground/50"
                    }`}
                  />
                </span>
                <time className="block font-mono text-xs text-accent mb-1.5">{m.date}</time>
                <h3 className="text-sm font-medium text-foreground mb-1 inline-flex items-center gap-1">
                  {m.title}
                  {m.href && (
                    <ArrowUpRight className="w-3 h-3 text-accent opacity-0 -translate-x-0.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  )}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{m.detail}</p>
              </>
            )
            return (
              <li
                key={m.title}
                className={visible ? "animate-fade-in-up" : "opacity-0"}
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                {m.href ? (
                  <a href={m.href} target="_blank" rel="noopener noreferrer" className="group block">
                    {body}
                  </a>
                ) : (
                  <div className="group">{body}</div>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
