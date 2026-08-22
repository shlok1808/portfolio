// Add your own predictions here — one line each.
const predictions = [
  "the models we call \"aligned\" are just the ones we haven't looked at closely enough yet",
  "SAEs are a stepping stone, not the answer — something less lossy replaces them before 2028",
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
