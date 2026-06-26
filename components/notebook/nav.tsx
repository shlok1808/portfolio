"use client"

import { useEffect, useState } from "react"

const items = [
  { id: "current", label: "current" },
  { id: "research", label: "research" },
  { id: "projects", label: "projects" },
  { id: "predictions", label: "predictions" },
  { id: "notes", label: "notes" },
  { id: "education", label: "education" },
  { id: "contact", label: "contact" },
]

export function Nav() {
  const [active, setActive] = useState("current")

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <nav
      aria-label="Sections"
      className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm py-4"
    >
      <ul className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
        {items.map((item, idx) => (
          <li key={item.id} className="flex items-center">
            <a
              href={`#${item.id}`}
              className={`transition-colors hover:text-foreground ${
                active === item.id
                  ? "text-foreground underline underline-offset-4"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </a>
            {idx < items.length - 1 && (
              <span className="px-2 text-muted-foreground/50" aria-hidden="true">
                /
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
