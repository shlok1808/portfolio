"use client"

import { useEffect, useRef, useState } from "react"
import { Mail, Github, Linkedin, Twitter } from "lucide-react"

function GoogleScholarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5 12 0z" />
    </svg>
  )
}

const links = [
  {
    name: "Email",
    href: "mailto:alex@example.com",
    label: "alex@example.com",
    icon: Mail,
  },
  {
    name: "GitHub",
    href: "https://github.com",
    label: "@alexchen",
    icon: Github,
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    label: "Alex Chen",
    icon: Linkedin,
  },
  {
    name: "Twitter",
    href: "https://twitter.com",
    label: "@alexchen_ai",
    icon: Twitter,
  },
  {
    name: "Google Scholar",
    href: "https://scholar.google.com",
    label: "Publications",
    icon: GoogleScholarIcon,
  },
]

export function ContactSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-16 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <h2
          className={`text-2xl font-bold text-foreground mb-6 ${
            isVisible ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          Get in Touch
        </h2>
        <div
          className={`flex flex-wrap gap-4 ${
            isVisible ? "animate-fade-in-up animate-delay-100" : "opacity-0"
          }`}
        >
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target={link.name !== "Email" ? "_blank" : undefined}
              rel={link.name !== "Email" ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:shadow-[0_2px_8px_rgba(196,101,26,0.1)] transition-all duration-200"
            >
              <link.icon className="w-4 h-4" />
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
