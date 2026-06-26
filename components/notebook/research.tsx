const roles = [
  {
    org: "Algoverse AI Research",
    role: "AI Researcher",
    meta: "2025 – 2026 · Remote",
    bullets: [
      "co-first authored \"Look Before You Steer\" on SAE feature steerability",
      "accepted to the ICML 2026 Mechanistic Interpretability Workshop",
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
    <section id="research" className="py-12">
      <p className="italic text-muted-foreground mb-8">Research</p>

      <div className="space-y-10">
        {roles.map((r) => (
          <div key={r.org}>
            <h2 className="text-lg font-bold text-foreground">{r.org}</h2>
            <p className="text-foreground">{r.role}</p>
            <p className="text-sm text-muted-foreground mt-1">{r.meta}</p>
            <ul className="mt-3 space-y-2">
              {r.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="text-muted-foreground select-none">—</span>
                  <span className="text-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
