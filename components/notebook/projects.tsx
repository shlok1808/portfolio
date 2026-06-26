const projects = [
  {
    name: "Look Before You Steer",
    stack: "Python, PyTorch, SAEs",
    favorite: true,
    href: "https://mechinterpworkshop.com/",
  },
  {
    name: "Contextual Privacy (NLA Probing)",
    stack: "Python, PyTorch",
    favorite: false,
    href: null,
  },
  {
    name: "Mech Interp for Finance",
    stack: "Python, Interpretability",
    favorite: false,
    href: null,
  },
]

export function Projects() {
  return (
    <section id="projects" className="py-12">
      <p className="italic text-muted-foreground mb-8">Projects</p>

      <div className="border-t border-foreground/15">
        {projects.map((p) => {
          return (
            <div
              key={p.name}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-foreground/15 py-4"
            >
              <div className="flex items-baseline gap-3">
                {p.href ? (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-foreground hover:underline underline-offset-4"
                  >
                    {p.name}
                  </a>
                ) : (
                  <span className="font-bold text-foreground">{p.name}</span>
                )}
                {p.favorite && (
                  <span className="italic text-sm text-muted-foreground">
                    ← my favorite
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">{p.stack}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
