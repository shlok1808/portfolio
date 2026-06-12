"use client"

import { useRef } from "react"
import { ExternalLink, FileText, Github } from "lucide-react"
import { emitCardHover } from "./neural-background"

export interface ResearchCardProps {
  id: string
  title: string
  subtitle?: string
  description: string
  meta?: string
  tags: string[]
  status?: { label: string; accepted?: boolean }
  links: {
    paper?: string
    workshop?: string
    github?: string
    demo?: string
  }
}

export function ResearchCard({
  id,
  title,
  subtitle,
  description,
  meta,
  tags,
  status,
  links,
}: ResearchCardProps) {
  const ref = useRef<HTMLElement>(null)

  const setHover = (active: boolean) => {
    if (ref.current) emitCardHover(id, ref.current, active)
  }

  return (
    <article
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative p-6 rounded-xl bg-card/80 backdrop-blur-sm border border-border hover:border-primary/40 hover:shadow-[0_4px_28px_var(--glow)] transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-medium text-foreground group-hover:text-primary transition-colors text-balance">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground italic mt-0.5">{subtitle}</p>
          )}
        </div>
        {status && (
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-full border ${
              status.accepted
                ? "border-primary/35 bg-primary/10 text-primary"
                : "border-border bg-secondary text-muted-foreground"
            }`}
          >
            <span
              className={`w-1 h-1 rounded-full ${
                status.accepted ? "bg-primary" : "bg-muted-foreground/60"
              }`}
            />
            {status.label}
          </span>
        )}
      </div>

      {meta && (
        <p className="text-xs font-mono text-muted-foreground mb-3">{meta}</p>
      )}

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground/80"
          >
            {tag}
          </span>
        ))}
      </div>

      {(links.paper || links.workshop || links.github || links.demo) && (
        <div className="flex flex-wrap items-center gap-4">
          {links.paper && (
            <a
              href={links.paper}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4"
            >
              <FileText className="w-3.5 h-3.5" />
              Paper (PDF)
            </a>
          )}
          {links.workshop && (
            <a
              href={links.workshop}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Workshop
            </a>
          )}
          {links.github && (
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4"
            >
              <Github className="w-3.5 h-3.5" />
              Code
            </a>
          )}
          {links.demo && (
            <a
              href={links.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Demo
            </a>
          )}
        </div>
      )}
    </article>
  )
}
