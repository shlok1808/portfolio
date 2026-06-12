"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ArrowUpRight, Github, Linkedin, Twitter } from "lucide-react"
import { NeuralBackground } from "./neural-background"

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
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
      tl.from("[data-hero-line]", { yPercent: 112, duration: 1.1, stagger: 0.14 }, 0.15)
        .from("[data-hero-fade]", { opacity: 0, y: 16, duration: 0.9, stagger: 0.1 }, 0.6)
        .from("[data-hero-cue]", { opacity: 0, duration: 1 }, 1.4)
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={rootRef} className="relative min-h-[100svh] flex items-center px-6">
      <NeuralBackground />
      <div className="relative z-10 max-w-6xl mx-auto w-full pt-28 pb-24">
        <a
          href="https://mechinterpworkshop.com/"
          target="_blank"
          rel="noopener noreferrer"
          data-hero-fade
          className="group inline-flex items-center gap-2.5 mb-9 pl-3 pr-4 py-1.5 rounded-full border border-accent/30 bg-card/60 backdrop-blur-sm font-mono text-[10px] sm:text-xs uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground hover:border-accent/60 transition-colors"
        >
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-accent animate-soft-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-accent" />
          </span>
          <span className="sm:hidden">Paper accepted · ICML 2026</span>
          <span className="hidden sm:inline">Paper accepted — ICML 2026 Mech Interp Workshop</span>
          <ArrowUpRight className="w-3 h-3 shrink-0 text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>

        <h1 className="font-serif tracking-tight leading-[0.95] mb-7">
          <span className="block overflow-hidden">
            <span data-hero-line className="block text-6xl sm:text-7xl lg:text-8xl text-accent italic">
              Shlok
            </span>
          </span>
          <span className="block overflow-hidden">
            <span data-hero-line className="block text-6xl sm:text-7xl lg:text-8xl text-foreground">
              Channawar
            </span>
          </span>
        </h1>

        <p data-hero-fade className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground mb-7">
          AI Safety &amp; Interpretability · Penn State
        </p>

        <p data-hero-fade className="text-base sm:text-lg text-foreground/85 leading-relaxed max-w-md mb-10 text-pretty">
          Junior at Penn State studying Applied Data Science. I work on
          interpretability and safety &mdash; trying to figure out what&apos;s
          actually happening inside language models.
        </p>

        <div data-hero-fade className="flex items-center gap-2">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-md border border-border bg-background/40 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:border-accent/40 hover:bg-secondary transition-all duration-200"
              aria-label={link.name}
            >
              <link.icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>

      <a
        href="#milestones"
        data-hero-cue
        className="absolute z-10 bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Scroll down"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">scroll</span>
        <span className="block w-px h-10 bg-gradient-to-b from-accent/70 to-transparent animate-scroll-cue" />
      </a>
    </section>
  )
}
