const notes = [
  "the inside of a model is more interesting than its outputs",
  "most of research is just asking a better question",
  "you learn the most by trying to break your own results",
  "pineapple belongs on pizza",
]

export function Notes() {
  return (
    <section id="notes" className="py-12">
      <p className="italic text-muted-foreground mb-8">Notes</p>

      <ul className="space-y-3 max-w-2xl border-l border-foreground/20 pl-5">
        {notes.map((n) => (
          <li key={n} className="flex items-start gap-3">
            <span className="text-muted-foreground select-none">—</span>
            <span className="text-foreground">{n}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
