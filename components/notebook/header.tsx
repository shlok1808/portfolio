import { Github, Linkedin, Send } from "lucide-react"

const socials = [
  { name: "GitHub", href: "https://github.com/shlok1808", icon: Github },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/shlok-channawar/", icon: Linkedin },
  { name: "Email", href: "mailto:shlokchannawar05@gmail.com", icon: Send },
]

export function Header() {
  return (
    <header className="pt-16 pb-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Shlok Channawar
          </h1>
          <p className="mt-2 text-lg sm:text-xl text-foreground">
            Poking around inside language models.
          </p>
        </div>

        <div className="flex flex-col items-end gap-4 shrink-0">
          <span className="italic text-sm text-muted-foreground">vol. i</span>
          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target={s.name === "Email" ? undefined : "_blank"}
                rel={s.name === "Email" ? undefined : "noopener noreferrer"}
                aria-label={s.name}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <s.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-foreground/15" />
    </header>
  )
}
