"use client"

import { useEffect, useRef, useState } from "react"
import { ResearchCard } from "./research-card"

const projects = [
  {
    title: "Scaling Sparse Autoencoders to GPT-4 Scale Models",
    description:
      "We trained sparse autoencoders on the residual stream of large language models, discovering interpretable features that explain model behavior. This work enables mechanistic analysis at unprecedented scale.",
    tags: ["SAE", "Interpretability", "Scaling"],
    links: {
      paper: "#",
      github: "#",
    },
  },
  {
    title: "Circuit Discovery in Transformer Attention Heads",
    description:
      "A systematic approach to identifying computational circuits in transformer attention mechanisms. We found recurring motifs that explain how models perform in-context learning.",
    tags: ["Circuits", "Attention", "Mechanistic"],
    links: {
      paper: "#",
      github: "#",
      demo: "#",
    },
  },
  {
    title: "Feature Visualization for Language Models",
    description:
      "Adapting computer vision interpretability techniques to understand what language model neurons encode. We develop new methods to visualize and understand learned representations.",
    tags: ["NLP", "Visualization", "Features"],
    links: {
      paper: "#",
      demo: "#",
    },
  },
  {
    title: "Probing Emergent Capabilities in LLMs",
    description:
      "Investigating when and how emergent capabilities arise during training. We use causal interventions to understand the mechanisms behind sudden capability jumps.",
    tags: ["Emergence", "Probing", "Training Dynamics"],
    links: {
      paper: "#",
      github: "#",
    },
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
        <div className="grid gap-4 sm:grid-cols-2">
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
