import { Navbar } from "@/components/navbar"
import { NeuralBackground } from "@/components/neural-background"
import { Hero } from "@/components/hero"
import { MilestonesSection } from "@/components/milestones-section"
import { AboutSection } from "@/components/about-section"
import { ResearchSection } from "@/components/research-section"
import { ReadingLogSection } from "@/components/reading-log-section"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <>
      <NeuralBackground />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <MilestonesSection />
        <AboutSection />
        <ResearchSection />
        <ReadingLogSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
