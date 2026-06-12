"use client"

import { Mail, Github, Linkedin, Twitter, ArrowUpRight } from "lucide-react"
import { useReveal } from "@/hooks/use-reveal"
import { SectionLabel } from "./section-label"

const links = [
  { name: "Email", href: "mailto:shlokchannawar05@gmail.com", label: "shlokchannawar05@gmail.com", icon: Mail },
  { name: "GitHub", href: "https://github.com/shlok1808", label: "@shlok1808", icon: Github },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/shlok-channawar/", label: "Shlok Channawar", icon: Linkedin },
  { name: "Twitter", href: "https://x.com/shlok_ch", label: "@shlok_ch", icon: Twitter },
]

export function ContactSection() {
  const { ref, visible } = useReveal<HTMLElement>()

  return (
    <section id="contact" ref={ref} className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionLabel index="04">Get in Touch</SectionLabel>
        <div className={`grid lg:grid-cols-[0.4fr_1fr] gap-8 lg:gap-16 ${visible ? "animate-fade-in-up" : "opacity-0"}`}>
          <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-foreground text-balance">
            Always happy to talk interpretability, safety, or anything in between.
          </h2>
          <div className="divide-y divide-border border-t border-border">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target={link.name !== "Email" ? "_blank" : undefined}
                rel={link.name !== "Email" ? "noopener noreferrer" : undefined}
                className="group flex items-center justify-between gap-4 py-4"
              >
                <div className="flex items-center gap-4">
                  <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground w-20">
                    {link.name}
                  </span>
                  <span className="text-foreground group-hover:text-accent transition-colors">
                    {link.label}
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
