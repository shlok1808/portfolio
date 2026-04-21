"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-3xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="#"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            alex chen
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="#about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              about
            </Link>
            <Link
              href="#research"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              research
            </Link>
            <Link
              href="#blog"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              blog
            </Link>
            <Link
              href="#reading"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              reading
            </Link>
            <Link
              href="/cv"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              cv
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
