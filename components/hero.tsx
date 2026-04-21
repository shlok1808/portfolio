import { Github, Linkedin, Twitter } from "lucide-react"

function GoogleScholarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5 12 0z" />
    </svg>
  )
}

const socialLinks = [
  {
    name: "GitHub",
    href: "https://github.com",
    icon: Github,
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    icon: Linkedin,
  },
  {
    name: "Twitter",
    href: "https://twitter.com",
    icon: Twitter,
  },
  {
    name: "Google Scholar",
    href: "https://scholar.google.com",
    icon: GoogleScholarIcon,
  },
]

export function Hero() {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">
          <span className="text-primary">Shlok</span>{" "}
          <span className="text-foreground">Asawa</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-4 italic">
          &quot;sh-loke&quot; — rhymes with cloak
        </p>
        <p className="text-lg text-muted-foreground mb-6">
          AI Safety Researcher · Interpretability · Mechanistic Understanding
        </p>
        <p className="text-base text-foreground/90 leading-relaxed max-w-2xl mb-8">
          I&apos;m a researcher focused on making neural networks more understandable. 
          Currently exploring sparse autoencoders and circuit-level analysis to uncover 
          how language models represent and process information.
        </p>
        <div className="flex items-center gap-3">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 hover:shadow-[0_2px_8px_rgba(218,119,86,0.15)] transition-all duration-200"
              aria-label={link.name}
            >
              <link.icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
