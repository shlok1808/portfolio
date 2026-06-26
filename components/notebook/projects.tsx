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

export function Projects() {
  const [open, setOpen] = useState<string | null>(projects[0].name)

  return (
    <section id="projects" className="py-12">
      <p className="italic text-muted-foreground mb-8">Projects</p>

      <div className="border-t border-foreground/15">
        {projects.map((p) => {
          const isOpen = open === p.name
          return (
            <div key={p.name} className="border-b border-foreground/15">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : p.name)}
                aria-expanded={isOpen}
                className="flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4 text-left"
              >
                <span className="flex items-baseline gap-3">
                  <span className="text-muted-foreground select-none">
                    {isOpen ? "▾" : "▸"}
                  </span>
                  <span className="font-bold text-foreground">{p.name}</span>
                  {p.favorite && (
                    <span className="italic text-sm text-muted-foreground">
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
