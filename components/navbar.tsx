"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

const navItems = [
  { label: "about", href: "/#about" },
  { label: "research", href: "/#research" },
  { label: "reading", href: "/#reading" },
  { label: "cv", href: "/cv" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [isLight, setIsLight] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      const total = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(total > 0 ? window.scrollY / total : 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "light") setIsLight(true)
  }, [])

  const toggleTheme = () => {
    const next = !isLight
    setIsLight(next)
    if (next) {
      document.documentElement.classList.add("light")
      localStorage.setItem("theme", "light")
    } else {
      document.documentElement.classList.remove("light")
      localStorage.setItem("theme", "dark")
    }
  }

  return (
    <>
      <div
        className="fixed top-0 left-0 z-[60] h-px bg-accent"
        style={{ width: `${scrollProgress * 100}%`, transition: "width 60ms linear" }}
      />
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/70 backdrop-blur-xl border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-serif text-base text-foreground hover:text-accent transition-colors whitespace-nowrap">
            <span className="sm:hidden">SC</span>
            <span className="hidden sm:inline">Shlok Channawar</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-7">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLight ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
