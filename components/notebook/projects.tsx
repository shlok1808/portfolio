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

function FavoriteArrow({ className }: { className?: string }) {
  return (
    <svg
      width="36"
      height="30"
      viewBox="0 0 36 30"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2 27 C 11 23, 19 15, 32 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M23 5 L33 3 L31 13"
        stroke="currentColor"
        strokeWidth="1.2"
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
                <div className="pointer-events-none absolute right-full top-2 mr-4 hidden sm:flex flex-col items-end text-muted-foreground">
                  <FavoriteArrow className="mr-1" />
                  <span className="italic text-sm leading-tight text-right">
                    my
                    <br />
                    favorite
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
