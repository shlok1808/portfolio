"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUpRight } from "lucide-react"

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
    title: "BlueDot AI Safety cohort",
    detail: "Completed BlueDot Impact's AI Safety Fundamentals course",
  },
]

export function MilestonesSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="milestones" ref={sectionRef} className="py-14 px-6">
      <div className="max-w-3xl mx-auto">
        <p
          className={`text-[11px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-8 ${
            isVisible ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          Recent milestones
        </p>
        <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          {/* connecting line, echoes the network aesthetic */}
          <span
            aria-hidden="true"
            className="hidden lg:block absolute top-[3px] left-2 right-2 h-px bg-gradient-to-r from-primary/40 via-border to-border"
          />
          {milestones.map((m, index) => {
            const body = (
              <>
                <span className="relative flex w-[7px] h-[7px] mb-4">
                  {m.highlight && (
                    <span className="absolute inline-flex w-full h-full rounded-full bg-primary animate-soft-ping" />
                  )}
                  <span
                    className={`relative inline-flex w-[7px] h-[7px] rounded-full ${
                      m.highlight ? "bg-primary" : "bg-muted-foreground/50"
                    }`}
                  />
                </span>
                <time className="block text-xs font-mono text-primary mb-1.5">{m.date}</time>
                <h3 className="text-sm font-semibold text-foreground mb-1 inline-flex items-center gap-1">
                  {m.title}
                  {m.href && (
                    <ArrowUpRight className="w-3 h-3 text-primary opacity-0 -translate-x-0.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  )}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{m.detail}</p>
              </>
            )
            return (
              <li
                key={m.title}
                className={isVisible ? "animate-fade-in-up" : "opacity-0"}
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                {m.href ? (
                  <a
                    href={m.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
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
