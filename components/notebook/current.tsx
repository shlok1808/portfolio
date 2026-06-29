const items = [
  { text: "junior @ Penn State, applied data science", note: null },
  { text: "researching mech interp + AI safety", note: "currently enjoying" },
  { text: "AI safety fellow @ BlueDot", note: null },
  { text: "building interp tooling for finance", note: null },
]

export function Current() {
  return (
    <section id="current" className="py-20">
      <p className="italic text-muted-foreground mb-10">Current</p>

      <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-start">
        <div className="max-w-xl">
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <span className="text-muted-foreground select-none">—</span>
                <span className="text-foreground">
                  {item.text}
                  {item.note && (
                    <span className="annotate-circle ml-3 italic text-sm text-muted-foreground">
                      {item.note}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-8 leading-relaxed text-foreground max-w-md text-pretty">
            Mostly I&apos;m trying to figure out what models actually represent
            inside, and whether we can steer it. When I&apos;m not doing that:
            poker, chess, and pointing a camera at the night sky.
          </p>
        </div>

        {/* Polaroid — my Orion Nebula astrophotography shot. */}
        <figure className="relative mx-auto md:mx-0 w-[260px] rotate-2">
          <span
            aria-hidden="true"
            className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-24 -rotate-2 bg-muted-foreground/20"
          />
          <div className="bg-[#fbfaf6] p-3 pb-12 shadow-sm border border-foreground/10">
            <img
              src="/orion-nebula.jpg"
              alt="The Orion Nebula — one of my astrophotography shots"
              className="block h-[300px] w-full object-cover bg-foreground/5"
            />
          </div>
        </figure>
      </div>
    </section>
  )
}
