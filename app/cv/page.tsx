import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"
import { SectionLabel } from "@/components/section-label"

export default function CVPage() {
  return (
    <main className="relative z-10 min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>

        <div className="flex items-end justify-between gap-4 mb-14">
          <h1 className="font-serif text-4xl sm:text-5xl text-foreground leading-none">
            Curriculum
            <br />
            Vitae
          </h1>
          <a
            href="/Shlok_Channawar_Resume.pdf"
            download
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm text-foreground hover:border-accent/40 hover:bg-secondary transition-all"
          >
            <Download className="w-4 h-4" />
            PDF
          </a>
        </div>

        {/* Education */}
        <section className="mb-14">
          <SectionLabel index="01">Education</SectionLabel>
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="font-serif text-xl text-foreground">B.S. in Applied Data Science</h3>
              <p className="text-muted-foreground">The Pennsylvania State University</p>
            </div>
            <span className="font-mono text-xs text-muted-foreground whitespace-nowrap pt-1.5">
              Expected Dec 2027
            </span>
          </div>
        </section>

        {/* Technical Skills */}
        <section className="mb-14">
          <SectionLabel index="02">Technical Skills</SectionLabel>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-foreground mr-2">Languages</span>
              Python (Pandas, NumPy, Matplotlib, Seaborn), R, SQL
            </p>
            <p>
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-foreground mr-2">Tools</span>
              Git, Jupyter, Scikit-learn, PyTorch, TensorFlow, APIs, Hugging Face, VS Code
            </p>
          </div>
        </section>

        {/* Research & Projects */}
        <section className="mb-14">
          <SectionLabel index="03">Research &amp; Projects</SectionLabel>
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-serif text-xl text-foreground">Mechanistic Interpretability in LLMs</h3>
                  <p className="font-mono text-[11px] text-muted-foreground mt-1">Python · PyTorch</p>
                </div>
                <span className="font-mono text-xs text-muted-foreground whitespace-nowrap pt-1.5">
                  In Progress (Spring 2026)
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground list-disc list-inside marker:text-accent/50">
                <li>Investigating whether geometric properties of SAE decoder vectors can predict feature steerability in LLMs.</li>
                <li>Designed end-to-end evaluation pipeline over 100 SAE features × 75 prompts × 12 steering magnitudes on Gemma-2-2b-IT.</li>
                <li>Optimized batched inference to reduce model calls by 94%.</li>
              </ul>
            </div>
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-serif text-xl text-foreground">Stock Price Forecasting Using ML</h3>
                <p className="font-mono text-[11px] text-muted-foreground mt-1">Python · Scikit-learn</p>
              </div>
              <span className="font-mono text-xs text-muted-foreground whitespace-nowrap pt-1.5">July 2025</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-serif text-xl text-foreground">Multi-Asset Financial Portfolio Risk Analysis</h3>
                <p className="font-mono text-[11px] text-muted-foreground mt-1">Python</p>
              </div>
              <span className="font-mono text-xs text-muted-foreground whitespace-nowrap pt-1.5">June 2025</span>
            </div>
          </div>
        </section>

        {/* Experience */}
        <section className="mb-10">
          <SectionLabel index="04">Experience</SectionLabel>
          <div className="space-y-8">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-serif text-xl text-foreground">Research Assistant</h3>
                <p className="text-muted-foreground">Humanitarian Engineering and Social Entrepreneurship</p>
              </div>
              <span className="font-mono text-xs text-muted-foreground whitespace-nowrap pt-1.5">
                Jan – June 2025
              </span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-serif text-xl text-foreground">Team Member, Commons Desk Operations</h3>
                <p className="text-muted-foreground">Penn State</p>
              </div>
              <span className="font-mono text-xs text-muted-foreground whitespace-nowrap pt-1.5">
                Aug 2024 – Present
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
