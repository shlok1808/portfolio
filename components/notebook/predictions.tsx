// Add your own predictions here — one line each.
const predictions = [
  "we'll understand a frontier model's internals before we can fully control them",
  "interpretability becomes a standard part of every serious safety case by 2030",
]

export function Predictions() {
  return (
    <section id="predictions" className="py-20">
      <p className="italic text-muted-foreground mb-10">Predictions</p>

      <ul className="space-y-4 max-w-2xl">
        {predictions.map((p) => (
          <li key={p} className="flex items-start gap-3">
            <span className="text-muted-foreground select-none">—</span>
            <span className="text-foreground">{p}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
