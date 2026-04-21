"use client"

import { useEffect, useRef, useState } from "react"

export function AboutSection() {
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
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="about" ref={sectionRef} className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h2
          className={`text-2xl font-bold text-foreground mb-6 ${
            isVisible ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          About
        </h2>
        <div
          className={`prose prose-neutral max-w-none ${
            isVisible ? "animate-fade-in-up animate-delay-100" : "opacity-0"
          }`}
        >
          <p className="text-foreground/90 leading-relaxed mb-4">
            I started college as a mechanical engineering major before switching to Applied Data Science at Penn State&apos;s{" "}
            <a href="https://ist.psu.edu" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">College of IST</a>.
            {" "}That pivot ended up pointing me toward AI research, specifically interpretability and safety, trying to understand what&apos;s actually going on inside these models.
          </p>
          <p className="text-foreground/90 leading-relaxed mb-4">
            Currently working on a mechanistic{" "}
            <a href="https://www.anthropic.com/research/team/interpretability" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">interpretability</a>
            {" "}research project exploring how geometric properties of SAE features predict their steerability in language models.
          </p>
          <p className="text-foreground/90 leading-relaxed">
            Outside of research, I play poker with friends, play{" "}
            <a href="https://www.chess.com/member/flossyjam" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">chess</a>,
            {" "}listen to a lot of music, and just hang out. Originally from Nagpur, India.
          </p>
          <p className="text-foreground/90 leading-relaxed">
            I also love astronomy and astrophotography — you can see some of my shots{" "}
            <a href="https://www.instagram.com/shlok_astro/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">here</a>.
          </p>
        </div>
      </div>
    </section>
  )
}
