"use client"

import { useEffect, useRef, useState } from "react"
import { ResearchCard, type ResearchCardProps } from "./research-card"

const projects: ResearchCardProps[] = [
  {
    id: "steer",
    title: "Look Before You Steer",
    subtitle: "Geometry Predicts SAE Feature Steerability",
    description:
      "With Algoverse AI Research: can geometric properties of SAE features predict how steerable they are — before you ever run a steering experiment? We show that decoder-space geometry (neighbor density, max cosine similarity) ranks features by steering cost across Gemma-2 scales, SAE widths, and architectures.",
    meta: "Algoverse AI Research · 2025 – 2026",
    tags: ["SAE", "Mechanistic Interpretability", "Python", "PyTorch"],
    status: { label: "ICML 2026 · Mech Interp Workshop", accepted: true },
    links: {
      paper: "/papers/look-before-you-steer.pdf",
      workshop: "https://mechinterpworkshop.com/",
    },
  },
  {
    id: "contextual-privacy",
    title: "Contextual Privacy",
    subtitle: "NLA Probing for Contextual Integrity",
    description:
      "Exploring how language models internally represent contextual privacy norms using Natural Language Autoencoders — and whether models “know” when information sharing violates context-appropriate norms.",
    meta: "June 2026 – Present",
    tags: ["Python", "PyTorch", "In Progress"],
    links: {},
  },
  {
    id: "mech-interp-finance",
    title: "Mechanistic Interpretability for Finance",
    description:
      "Applying mechanistic interpretability tools to finance applications.",
    tags: ["Mechanistic Interpretability", "Exploratory"],
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
          className={`font-display text-3xl font-medium text-foreground mb-8 ${
            isVisible ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          <span className="text-xs font-mono text-primary align-middle mr-3">02</span>
          Research &amp; Projects
        </h2>
        <div className="grid gap-4">
          {projects.map((project, index) => (
            <div
              key={project.id}
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
