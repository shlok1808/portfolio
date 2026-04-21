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
            href="#"
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
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-foreground">
                    Ph.D. in Computer Science
                  </h3>
                  <p className="text-muted-foreground">Stanford University</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  2022 – Present
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Focus: AI Safety and Interpretability. Advisor: Prof. Jane Doe
              </p>
            </div>
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-foreground">
                    B.S. in Computer Science
                  </h3>
                  <p className="text-muted-foreground">
                    Massachusetts Institute of Technology
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  2018 – 2022
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Minor in Cognitive Science. GPA: 4.9/5.0
              </p>
            </div>
          </div>
        </section>

        {/* Experience */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Research Experience
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-foreground">
                    Research Intern
                  </h3>
                  <p className="text-muted-foreground">Anthropic</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  Summer 2023
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Worked on mechanistic interpretability, focusing on understanding
                feature representations in large language models.
              </p>
            </div>
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-foreground">
                    Undergraduate Researcher
                  </h3>
                  <p className="text-muted-foreground">MIT CSAIL</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  2020 – 2022
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Research on probing methods for neural network representations.
              </p>
            </div>
          </div>
        </section>

        {/* Publications */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Selected Publications
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-foreground">
                Scaling Sparse Autoencoders to GPT-4 Scale Models
              </h3>
              <p className="text-sm text-muted-foreground">
                <span className="text-primary">A. Chen</span>, J. Smith, M.
                Johnson
              </p>
              <p className="text-sm text-muted-foreground">
                NeurIPS 2024 (Spotlight)
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                Circuit Discovery in Transformer Attention Heads
              </h3>
              <p className="text-sm text-muted-foreground">
                <span className="text-primary">A. Chen</span>, K. Williams
              </p>
              <p className="text-sm text-muted-foreground">ICML 2024</p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                Feature Visualization for Language Models
              </h3>
              <p className="text-sm text-muted-foreground">
                <span className="text-primary">A. Chen</span>, L. Davis, R.
                Brown
              </p>
              <p className="text-sm text-muted-foreground">ACL 2023</p>
            </div>
          </div>
        </section>

        {/* Skills */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Python",
              "PyTorch",
              "JAX",
              "Transformer Architectures",
              "Mechanistic Interpretability",
              "Sparse Autoencoders",
              "Distributed Training",
              "Technical Writing",
            ].map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 text-sm rounded-full bg-secondary text-muted-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
