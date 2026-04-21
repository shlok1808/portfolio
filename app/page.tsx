import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { AboutSection } from "@/components/about-section"
import { ResearchSection } from "@/components/research-section"
import { ReadingLogSection } from "@/components/reading-log-section"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AboutSection />
        <ResearchSection />
        <ReadingLogSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
