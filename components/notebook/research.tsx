import { ConfettiText } from "./confetti-text"

type Bullet =
  | string
  | { text: string; href: string; linkText: string }
  | { text: string; confetti: string }

const roles: { org: string; role: string; meta: string; bullets: Bullet[] }[] = [
  {
    org: "Algoverse AI Research",
    role: "AI Researcher",
    meta: "2025 – 2026 · Remote",
    bullets: [
      {
        text: "co-first authored \"Look Before You Steer\" on SAE feature steerability",
        href: "https://openreview.net/pdf?id=UIaLI9XPpq",
        linkText: "Look Before You Steer",
      },
      {
        text: "accepted to the ICML 2026 Mechanistic Interpretability Workshop",
        confetti: "ICML 2026 Mechanistic Interpretability Workshop",
      },
    ],
  },
  {
    org: "BlueDot Impact",
    role: "AI Safety Fellow",
    meta: "2025 · Remote",
    bullets: [
      "thinking carefully about alignment and what it takes to make models safe",
    ],
  },
]

export function Research() {
  return (
    <section id="research" className="py-20">
      <p className="italic text-muted-foreground mb-10">Research</p>

      <div className="space-y-10">
        {roles.map((r) => (
          <div key={r.org}>
            <h2 className="text-lg font-bold text-foreground">{r.org}</h2>
            <p className="text-foreground">{r.role}</p>
            <p className="text-sm text-muted-foreground mt-1">{r.meta}</p>
            <ul className="mt-3 space-y-2">
              {r.bullets.map((b) => {
                const text = typeof b === "string" ? b : b.text
                return (
                  <li key={text} className="flex items-start gap-3">
                    <span className="text-muted-foreground select-none">—</span>
                    <span className="text-foreground">
                      {typeof b === "string" ? (
                        b
                      ) : "confetti" in b ? (
                        <>
                          {b.text.split(b.confetti)[0]}
                          <ConfettiText>{b.confetti}</ConfettiText>
                          {b.text.split(b.confetti)[1]}
                        </>
                      ) : (
                        <>
                          {b.text.split(b.linkText)[0]}
                          <a
                            href={b.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-colors"
                          >
                            {b.linkText}
                          </a>
                          {b.text.split(b.linkText)[1]}
                        </>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
