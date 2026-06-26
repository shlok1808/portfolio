const schools = [
  {
    org: "Penn State · College of IST",
    role: "Applied Data Science",
    meta: "2023 – Present · State College, PA",
    bullets: [
      "originally in mechanical engineering, switched to applied data science in fall 2025 after getting into ai research",
    ],
  },
]

export function Education() {
  return (
    <section id="education" className="py-12">
      <p className="italic text-muted-foreground mb-8">Education</p>

      <div className="space-y-10">
        {schools.map((s) => (
          <div key={s.org}>
            <h2 className="text-lg font-bold text-foreground">{s.org}</h2>
            <p className="text-foreground">{s.role}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.meta}</p>
            <ul className="mt-3 space-y-2">
              {s.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="text-muted-foreground select-none">—</span>
                  <span className="text-foreground text-pretty">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
