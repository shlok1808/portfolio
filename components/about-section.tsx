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
          <div className="space-y-5 max-w-2xl">
            <p className="font-serif text-[17px] text-foreground/85 leading-relaxed text-pretty">
              I started college as a mechanical engineering major before switching to Applied Data
              Science at Penn State&apos;s{" "}
              <a href="https://ist.psu.edu" target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-accent/40 underline-offset-4 hover:decoration-accent transition-colors">College of IST</a>.
              {" "}That pivot led me toward AI research &mdash; specifically interpretability and
              safety, trying to understand what&apos;s actually going on inside language models.
            </p>
            <p className="font-serif text-[17px] text-foreground/85 leading-relaxed text-pretty">
              Recently co-first authored a paper on whether geometric properties of SAE decoder vectors
              can predict feature steerability &mdash; currently in submission. Now working on two new threads: applying
              interpretability methods to understand how models handle private information, and
              building practical mech interp tooling for finance. Also attending{" "}
              <a href="https://bluedot.org" target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-accent/40 underline-offset-4 hover:decoration-accent transition-colors">BlueDot&apos;s</a>
              {" "}AI Safety program &mdash; thinking carefully about alignment and what it actually
              takes to make these systems safe.
            </p>
            <p className="font-serif text-[17px] text-foreground/85 leading-relaxed text-pretty">
              Outside of research, I play poker with friends, play{" "}
              <a href="https://www.chess.com/member/andrej_karpathys_hair" target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-accent/40 underline-offset-4 hover:decoration-accent transition-colors">chess</a>,
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
