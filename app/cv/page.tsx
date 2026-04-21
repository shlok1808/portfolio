import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"

export default function CVPage() {
  return (
    <main className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Curriculum Vitae
          </h1>
          <a
            href="/resume.pdf"
            download
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </a>
        </div>

        {/* Education */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Education
          </h2>
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-foreground">
                  B.S. in Applied Data Science
                </h3>
                <p className="text-muted-foreground">The Pennsylvania State University</p>
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Expected December 2027
              </span>
            </div>
          </div>
        </section>

        {/* Technical Skills */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Technical Skills
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="text-foreground font-medium">Languages:</span>{" "}
              Python (Pandas, NumPy, Matplotlib, Seaborn), R, SQL
            </p>
            <p>
              <span className="text-foreground font-medium">Tools &amp; Frameworks:</span>{" "}
              Git, Jupyter Notebook, Scikit-learn, PyTorch, TensorFlow, APIs, Hugging Face, VS Code
            </p>
          </div>
        </section>

        {/* Research & Projects */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Research &amp; Projects
          </h2>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-medium text-foreground">
                    Research on Mechanistic Interpretability in LLMs
                  </h3>
                  <p className="text-sm text-muted-foreground">Python, PyTorch</p>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  In Progress (Spring 2026)
                </span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>Investigating whether geometric properties of SAE decoder vectors can predict feature steerability in LLMs.</li>
                <li>Designed end-to-end evaluation pipeline over 100 SAE features × 75 prompts × 12 steering magnitudes on Gemma-2-2b-IT.</li>
                <li>Optimized batched inference to reduce model calls by 94%.</li>
              </ul>
            </div>
            <div>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-medium text-foreground">
                    Stock Price Forecasting Using ML
                  </h3>
                  <p className="text-sm text-muted-foreground">Python, Scikit-learn</p>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  July 2025
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-medium text-foreground">
                    Multi-Asset Financial Portfolio Risk Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground">Python</p>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  June 2025
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Experience */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Experience
          </h2>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-medium text-foreground">Research Assistant</h3>
                  <p className="text-muted-foreground">Humanitarian Engineering and Social Entrepreneurship</p>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Jan 2025 – June 2025
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-medium text-foreground">Team Member, Commons Desk Operations</h3>
                  <p className="text-muted-foreground">Penn State</p>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Aug 2024 – Present
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
