"use client"

import { useReveal } from "@/hooks/use-reveal"
import { SectionLabel } from "./section-label"
import { ResearchCard, type ResearchCardProps } from "./research-card"

const projects: Omit<ResearchCardProps, "index">[] = [
  {
    id: "steer",
    title: "Look Before You Steer",
    subtitle: "Geometry Predicts SAE Feature Steerability",
    meta: "Algoverse AI Research · 2025 – 2026",
    description:
      "Can geometric properties of SAE features predict how steerable they are — before you ever run a steering experiment? We show that decoder-space geometry (neighbor density, max cosine similarity) ranks features by steering cost, replicating across Gemma-2 scales, SAE widths, and architectures.",
    tags: ["SAE", "Mechanistic Interpretability", "Python", "PyTorch"],
    status: { label: "ICML 2026 · MI Workshop", accepted: true },
    links: {
      paper: "/papers/look-before-you-steer.pdf",
      workshop: "https://mechinterpworkshop.com/",
    },
  },
  {
    id: "contextual-privacy",
    title: "Contextual Privacy",
    subtitle: "NLA Probing for Contextual Integrity",
    meta: "Python · PyTorch · June 2026 – Present",
    description:
      "Exploring how language models internally represent contextual privacy norms using Natural Language Autoencoders — and whether models “know” when information sharing violates context-appropriate norms.",
    tags: ["Interpretability", "Privacy", "Python", "PyTorch"],
    status: { label: "In Progress" },
    links: {},
  },
  {
    id: "mech-interp-finance",
    title: "Mechanistic Interpretability for Finance",
    description: "Applying mechanistic interpretability tools to finance applications.",
    tags: ["Mechanistic Interpretability", "Finance"],
    status: { label: "Exploratory" },
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
              key={project.id}
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
