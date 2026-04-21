"use client"

import { useEffect, useRef, useState } from "react"
import { ResearchCard } from "./research-card"

const projects = [
  {
    title: "Predict Before You Steer",
    description:
      "Working with Algoverse on whether geometric properties of SAE features can predict how steerable they are — before you ever run a steering experiment. We look at neighbor density, co-activation patterns, and an alpha_star metric across GemmaScope features on Gemma-2-2b-IT, evaluated on SALADBench. Targeting the ICML 2026 Mechanistic Interpretability Workshop.",
    tags: ["SAE", "Mechanistic Interpretability", "In Progress"],
    links: {},
  },
  {
    title: "Quantization Safety",
    description:
      "With Penn State collaborators. Post-training quantization can quietly degrade a model's safety alignment — we're trying to pin down exactly why. We introduce a V-score diagnostic and identify read-side collapse as the core failure mechanism.",
    tags: ["Quantization", "Safety Alignment", "In Progress"],
    links: {},
  },
]

export function ResearchSection() {
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
    <section id="research" ref={sectionRef} className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h2
          className={`text-2xl font-bold text-foreground mb-8 ${
            isVisible ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          Research & Projects
        </h2>
        <div className="grid gap-4">
          {projects.map((project, index) => (
            <div
              key={project.title}
              className={`${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <ResearchCard {...project} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
