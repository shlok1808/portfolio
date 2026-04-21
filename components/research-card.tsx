import { ExternalLink, Github } from "lucide-react"

interface ResearchCardProps {
  title: string
  description: string
  tags: string[]
  links: {
    paper?: string
    github?: string
    demo?: string
  }
}

export function ResearchCard({ title, description, tags, links }: ResearchCardProps) {
  return (
    <article className="group p-5 rounded-xl bg-card border border-border hover:border-primary/20 hover:shadow-[0_4px_20px_rgba(196,101,26,0.08)] transition-all duration-300 hover:-translate-y-0.5">
      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {description}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 text-xs font-medium rounded-full bg-secondary text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {links.paper && (
          <a
            href={links.paper}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Paper
          </a>
        )}
        {links.github && (
          <a
            href={links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2"
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
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Demo
          </a>
        )}
      </div>
    </article>
  )
}
