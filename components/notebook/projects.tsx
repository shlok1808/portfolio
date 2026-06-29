"use client"

import { useState } from "react"

type Project = {
  name: string
  stack: string
  favorite?: boolean
  bullets: { text: string; href?: string; linkText?: string }[]
}

const projects: Project[] = [
  {
    name: "nla-ci",
    stack: "Python, PyTorch, Qwen2.5-7B",
    favorite: true,
    bullets: [
      {
        text: "extends Anthropic's Natural Language Autoencoders to investigate whether Qwen2.5-7B internally represents privacy violations before its outputs reveal them",
        href: "https://www.anthropic.com/research/natural-language-autoencoders",
        linkText: "Natural Language Autoencoders",
      },
      {
        text: "found that deflection is pre-committed before generation (AUC 0.89), leak signal emerges mid-output around token 42",
      },
      { text: "probing LLM internals for contextual integrity" },
    ],
  },
  {
    name: "look-before-you-steer",
    stack: "SAEs, Steering, Interpretability",
    bullets: [
      {
        text: "\"Look Before You Steer\" asks whether you can predict how hard an SAE feature is to steer straight from the SAE's own weights, before running a single intervention",
        href: "https://openreview.net/pdf?id=UIaLI9XPpq",
        linkText: "Look Before You Steer",
      },
      {
        text: "defines steerability as the smallest coefficient that produces a fixed behavioral change, then shows decoder-space geometry (neighbor density + cosine similarity to nearby features) rank-orders that cost",
      },
      {
        text: "geometry predicts steering cost across Gemma-2, Llama-3.1, and Qwen3 (Spearman ρ up to −0.55, AUROC up to 0.82) — a step toward screening features for controllability before deployment",
      },
    ],
  },
  {
    name: "mechanistic-kyc",
    stack: "Python, Interpretability",
    bullets: [
      {
        text: "built a mechanistic interpretability pipeline to audit AI financial advisors, probing internal representations to distinguish genuine belief change from sycophantic compliance under client pressure",
      },
      {
        text: "developed synthetic client profiling and vignette generation systems grounded in validated risk tolerance frameworks",
      },
    ],
  },
  {
    name: "rl-reasoning",
    stack: "Python, PyTorch, GRPO",
    bullets: [
      {
        text: "GRPO-style math reasoning project exploring how reinforcement learning shapes model reasoning behavior",
      },
      {
        text: "investigating emergent reasoning patterns through reward-driven training",
      },
    ],
  },
]

function FavoriteArrow({ className }: { className?: string }) {
  return (
    <svg
      width="104"
      height="46"
      viewBox="0 0 104 46"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* hand-drawn loop with a long tail that sweeps up toward the project */}
      <path
        d="M12 36 C 4 34, 4 24, 14 24 C 23 24, 24 36, 14 36 C 6 36, 8 25, 19 21 C 45 11, 70 9, 97 7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* arrowhead pointing up-right at the project name */}
      <path
        d="M89 3 L99 6 L93 15"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Projects() {
  // A Set lets several projects stay open at once — opening one never closes another.
  const [openSet, setOpenSet] = useState<Set<string>>(
    () => new Set([projects[0].name]),
  )

  const toggle = (name: string) =>
    setOpenSet((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  return (
    <section id="projects" className="py-20">
      <p className="italic text-muted-foreground mb-10">Projects</p>

      <div className="border-t border-foreground/15 sm:ml-32">
        {projects.map((p) => {
          const isOpen = openSet.has(p.name)
          return (
            <div key={p.name} className="relative border-b border-foreground/15">
              {p.favorite && (
                <div className="pointer-events-none absolute right-full top-6 mr-4 hidden sm:flex flex-col items-end text-muted-foreground">
                  <FavoriteArrow className="mr-1" />
                  <span className="italic text-sm leading-relaxed text-right">
                    <span className="block">my</span>
                    <span className="block -translate-x-1.5">favorite</span>
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => toggle(p.name)}
                aria-expanded={isOpen}
                className="flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4 text-left"
              >
                <span className="flex items-baseline gap-3">
                  <span className="text-muted-foreground select-none">
                    {isOpen ? "▾" : "▸"}
                  </span>
                  <span className="font-bold text-foreground">{p.name}</span>
                  {p.favorite && (
                    <span className="italic text-sm text-muted-foreground sm:hidden">
                      ← my favorite
                    </span>
                  )}
                </span>
                <span className="text-sm text-muted-foreground">{p.stack}</span>
              </button>

              {isOpen && (
                <ul className="space-y-2 pb-5 pl-7">
                  {p.bullets.map((b) => (
                    <li key={b.text} className="flex items-start gap-3">
                      <span className="text-muted-foreground select-none">—</span>
                      <span className="text-foreground text-pretty">
                        {b.href ? (
                          <>
                            {b.text.split(b.linkText ?? "")[0]}
                            <a
                              href={b.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-colors"
                            >
                              {b.linkText}
                            </a>
                            {b.text.split(b.linkText ?? "")[1]}
                          </>
                        ) : (
                          b.text
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
