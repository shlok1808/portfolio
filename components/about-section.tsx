"use client"

import { useReveal } from "@/hooks/use-reveal"
import { SectionLabel } from "./section-label"

export function AboutSection() {
  const { ref, visible } = useReveal<HTMLElement>()

  return (
    <section id="about" ref={ref} className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionLabel index="01">About</SectionLabel>
        <div className={`grid lg:grid-cols-[0.4fr_1fr] gap-8 lg:gap-16 ${visible ? "animate-fade-in-up" : "opacity-0"}`}>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/70 lg:pt-2">
            Background
          </div>
          <div className="space-y-6 max-w-2xl">
            <p className="font-serif text-xl sm:text-2xl text-foreground leading-snug text-pretty">
              I started college as a mechanical engineering major before switching to Applied Data
              Science at Penn State&apos;s{" "}
              <a href="https://ist.psu.edu" target="_blank" rel="noopener noreferrer" className="underline decoration-accent/40 underline-offset-4 hover:decoration-accent transition-colors">College of IST</a>.
              {" "}That pivot pointed me toward AI research &mdash; specifically interpretability and
              safety, trying to understand what&apos;s actually going on inside these models.
            </p>
            <p className="text-foreground/80 leading-relaxed text-pretty">
              Currently working on a mechanistic{" "}
              <a href="https://www.anthropic.com/research/team/interpretability" target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-accent/40 underline-offset-4 hover:decoration-accent transition-colors">interpretability</a>
              {" "}project exploring how geometric properties of SAE features predict their
              steerability in language models.
            </p>
            <p className="text-foreground/80 leading-relaxed text-pretty">
              Outside of research, I play poker with friends, play{" "}
              <a href="https://www.chess.com/member/flossyjam" target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-accent/40 underline-offset-4 hover:decoration-accent transition-colors">chess</a>,
              {" "}listen to a lot of music, and just hang out. Originally from Nagpur, India. I also
              love astronomy and astrophotography &mdash; you can see some of my shots{" "}
              <a href="https://www.instagram.com/shlok_astro/" target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-accent/40 underline-offset-4 hover:decoration-accent transition-colors">here</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
