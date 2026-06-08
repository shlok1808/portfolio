"use client"

import { Github, Linkedin, Twitter, ArrowDown } from "lucide-react"
import { NeuralField } from "./neural-field"

function GoogleScholarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5 12 0z" />
    </svg>
  )
}

const socialLinks = [
  { name: "GitHub", href: "https://github.com/shlok1808", icon: Github },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/shlok-channawar/", icon: Linkedin },
  { name: "Twitter", href: "https://x.com/shlok_ch", icon: Twitter },
  { name: "Google Scholar", href: "https://scholar.google.com", icon: GoogleScholarIcon },
]

export function Hero() {
  return (
    <section className="relative min-h-[100svh] flex items-center px-6">
      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center pt-28 pb-20">
        {/* Left: editorial intro */}
        <div className="animate-fade-in-up">
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-foreground mb-8 text-balance">
            Shlok
            <br />
            Channawar
          </h1>
          <p className="font-serif text-lg sm:text-xl text-foreground/80 leading-relaxed max-w-md mb-9 text-pretty">
            Junior at Penn State studying Applied Data Science. I work on
            interpretability and safety &mdash; trying to figure out what&apos;s
            actually happening inside language models.
          </p>

          <div className="flex items-center gap-2">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-accent/40 hover:bg-secondary transition-all duration-200"
                aria-label={link.name}
              >
                <link.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Right: live neural field */}
        <div className="relative h-[340px] sm:h-[420px] lg:h-[520px] animate-fade-in-up animate-delay-200">
          <NeuralField className="absolute inset-0 w-full h-full" />
          <div className="absolute bottom-2 right-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            activations · in motion
          </div>
        </div>
      </div>

      <a
        href="#about"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Scroll to about"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">scroll</span>
        <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
      </a>
    </section>
  )
}
