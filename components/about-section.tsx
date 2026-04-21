"use client"

import { useEffect, useRef, useState } from "react"

export function AboutSection() {
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
    <section id="about" ref={sectionRef} className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h2
          className={`text-2xl font-bold text-foreground mb-6 ${
            isVisible ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          About
        </h2>
        <div
          className={`prose prose-neutral max-w-none ${
            isVisible ? "animate-fade-in-up animate-delay-100" : "opacity-0"
          }`}
        >
          <p className="text-foreground/90 leading-relaxed mb-4">
            I&apos;m a PhD student at Stanford working on AI safety and interpretability. 
            My research focuses on understanding how neural networks work internally — 
            specifically, I&apos;m interested in reverse-engineering the algorithms that 
            emerge during training.
          </p>
          <p className="text-foreground/90 leading-relaxed mb-4">
            Before this, I did my undergrad in computer science at MIT, where I got 
            interested in the intersection of cognitive science and machine learning. 
            I spent a summer at Anthropic working on mechanistic interpretability, 
            which shaped a lot of how I think about these problems today.
          </p>
          <p className="text-foreground/90 leading-relaxed">
            Outside of research, I enjoy reading philosophy (currently working through 
            some Wittgenstein), hiking in the Bay Area, and making unnecessarily 
            elaborate pour-over coffee. I also maintain a few open-source tools for 
            the interpretability community.
          </p>
        </div>
      </div>
    </section>
  )
}
