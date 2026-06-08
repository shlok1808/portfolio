import { ArrowUpRight, Github } from "lucide-react"

interface ResearchCardProps {
  index: string
  title: string
  description: string
  tags: string[]
  links: {
    paper?: string
    github?: string
    demo?: string
  }
}

export function ResearchCard({ index, title, description, tags, links }: ResearchCardProps) {
  const status = tags[tags.length - 1]
  const topics = tags.slice(0, -1)

  return (
    <article className="group relative grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-8 py-8 border-t border-border transition-colors">
      <span className="font-mono text-xs text-muted-foreground pt-1.5 group-hover:text-accent transition-colors">
        {index}
      </span>
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="font-serif text-2xl sm:text-3xl text-foreground leading-tight group-hover:text-accent transition-colors text-balance">
            {title}
          </h3>
          <span className="shrink-0 mt-1 font-mono text-[10px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border border-border text-muted-foreground whitespace-nowrap">
            {status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-2xl text-pretty">
          {description}
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex flex-wrap gap-2">
            {topics.map((tag) => (
              <span key={tag} className="font-mono text-[11px] text-muted-foreground/80">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 ml-auto">
            {links.paper && (
              <a href={links.paper} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-foreground hover:text-accent transition-colors">
                Paper <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
            {links.github && (
              <a href={links.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-accent transition-colors">
                <Github className="w-3.5 h-3.5" /> Code
              </a>
            )}
            {links.demo && (
              <a href={links.demo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-foreground hover:text-accent transition-colors">
                Demo <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
