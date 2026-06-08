"use client"

import { useReveal } from "@/hooks/use-reveal"
import { SectionLabel } from "./section-label"
import { ResearchCard } from "./research-card"

const projects = [
  {
    title: "Predict Before You Steer",
    description:
      "Working with Algoverse on whether geometric properties of SAE features can predict how steerable they are — before you ever run a steering experiment. We look at neighbor density, co-activation patterns, and an alpha_star metric across features on models such as Gemma, Llama and etc. and evaluated on SALADBench.",
    tags: ["SAE", "Mechanistic Interpretability", "Under Review"],
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
  const { ref, visible } = useReveal<HTMLElement>()

  return (
    <section id="research" ref={ref} className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionLabel index="02">Research &amp; Projects</SectionLabel>
        <div className={visible ? "animate-fade-in-up" : "opacity-0"}>
          {projects.map((project, index) => (
            <ResearchCard
              key={project.title}
              index={String(index + 1).padStart(2, "0")}
              {...project}
            />
          ))}
          <div className="border-t border-border" />
        </div>
      </div>
    </section>
  )
}
