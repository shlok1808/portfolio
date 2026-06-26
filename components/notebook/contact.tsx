import { Send, Github, Linkedin, Twitter } from "lucide-react"

const links = [
  { label: "email", value: "shlokchannawar05@gmail.com", href: "mailto:shlokchannawar05@gmail.com", icon: Send },
  { label: "github", value: "github.com/shlok1808", href: "https://github.com/shlok1808", icon: Github },
  { label: "x", value: "x.com/shlok_ch", href: "https://x.com/shlok_ch", icon: Twitter },
  { label: "linkedin", value: "linkedin.com/in/shlok-channawar", href: "https://www.linkedin.com/in/shlok-channawar/", icon: Linkedin },
]

export function Contact() {
  return (
    <section id="contact" className="py-12 pb-24">
      <p className="italic text-muted-foreground mb-8">Contact</p>

      <p className="text-muted-foreground mb-8">State College, PA · originally Nagpur, India</p>

      <div className="space-y-3">
        {links.map((l) => (
          <div key={l.label} className="flex items-center gap-4">
            <span className="w-20 text-sm text-muted-foreground">{l.label}</span>
            <l.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <a
              href={l.href}
              target={l.label === "email" ? undefined : "_blank"}
              rel={l.label === "email" ? undefined : "noopener noreferrer"}
              className="text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-colors"
            >
              {l.value}
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
