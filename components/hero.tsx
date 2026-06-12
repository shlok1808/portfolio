"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ArrowUpRight, Github, Linkedin, Twitter } from "lucide-react"

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
    href: "https://github.com/shlok1808",
    icon: Github,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/shlok-channawar/",
    icon: Linkedin,
  },
  {
    name: "Twitter",
    href: "https://x.com/Shlok496665",
    icon: Twitter,
  },
  {
    name: "Google Scholar",
    href: "https://scholar.google.com",
    icon: GoogleScholarIcon,
  },
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
    <section
      ref={rootRef}
      className="relative min-h-[100svh] flex items-center px-6 pt-24 pb-20"
    >
      <div className="max-w-3xl mx-auto w-full">
        <a
          href="https://mechinterpworkshop.com/"
          target="_blank"
          rel="noopener noreferrer"
          data-hero-fade
          className="group inline-flex items-center gap-2.5 mb-8 pl-3 pr-4 py-1.5 rounded-full border border-primary/25 bg-card/60 backdrop-blur-sm text-[10px] sm:text-xs font-mono text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-primary animate-soft-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-primary" />
          </span>
          <span className="sm:hidden">Paper accepted · ICML 2026 MI Workshop</span>
          <span className="hidden sm:inline">Paper accepted — ICML 2026 Mech Interp Workshop</span>
          <ArrowUpRight className="w-3 h-3 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>

        <h1 className="font-display font-medium tracking-tight leading-[0.95] mb-5">
          <span className="block overflow-hidden">
            <span data-hero-line className="block text-6xl sm:text-7xl md:text-8xl text-primary italic">
              Shlok
            </span>
          </span>
          <span className="block overflow-hidden">
            <span data-hero-line className="block text-6xl sm:text-7xl md:text-8xl text-foreground">
              Channawar
            </span>
          </span>
        </h1>

        <p data-hero-fade className="text-xs font-mono text-muted-foreground mb-6">
          &ldquo;sh-loke&rdquo; (rhymes with cloak) · AI Safety &amp; Interpretability
        </p>

        <p data-hero-fade className="text-base sm:text-lg text-foreground/90 leading-relaxed max-w-xl mb-9">
          I&apos;m a junior at Penn State studying Applied Data Science, working on AI
          interpretability and safety research. Trying to figure out what&apos;s actually
          happening inside these models.
        </p>

        <div data-hero-fade className="flex items-center gap-3">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg bg-card/70 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:shadow-[0_2px_12px_var(--glow)] transition-all duration-200"
              aria-label={link.name}
            >
              <link.icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>

      <div
        data-hero-cue
        className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground/70">
          scroll
        </span>
        <span className="block w-px h-10 bg-gradient-to-b from-primary/70 to-transparent animate-scroll-cue" />
      </div>
    </section>
  )
}
