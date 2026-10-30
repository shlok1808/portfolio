import { ArtStage } from './art-stage'
import { ModeToggle } from './tone'
import { Work } from './work'

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const

/** The homepage: a classic one-column page over a faint, live dithered background. */
export function Portfolio() {
  return (
    <>
      <ArtStage />
      <div className="v2-page">
        <div className="v2-corner">
          <ModeToggle />
        </div>

        <main className="v2-col">
          <header className="v2-hero">
            <h1 className="v2-name">Shlok Channawar</h1>
            <p className="v2-email">
              <code>shlokchannawar05 [at] gmail.com</code>
            </p>
          </header>

          <nav className="v2-nav" aria-label="Sections">
            <a href="#about">About</a>
            <a href="#research">Research</a>
            <a href="#contact">Contact</a>
            <a href="/Shlok_Channawar_Resume.pdf" {...ext}>
              CV
            </a>
          </nav>

          <section id="about" className="v2-sec">
            <h2>About</h2>
            <p>
              I’m an undergraduate in Applied Data Science at Penn State, working on mechanistic interpretability with{' '}
              <a href="https://louise-lulin.github.io/" {...ext}>
                Dr. Lu Lin
              </a>{' '}
              at the College of IST. I switched to data science from engineering after watching one of Neel Nanda’s
              videos on{' '}
              <a href="https://www.anthropic.com/research/team/interpretability" {...ext}>
                interpretability
              </a>
              .
            </p>
            <p>
              I think interpretability should be judged by what it lets us do. A finding about a model’s internals
              matters most when it supports a concrete decision or intervention outside interpretability, and when that
              action is actually tested: against simple baselines like prompting or fine-tuning, across models and
              seeds, on realistic data. I try to hold my own work to that standard, and I agree with the case made in{' '}
              <a href="https://actionable-interpretability-guide.github.io/paper.pdf" {...ext}>
                Interpretability Can Be Actionable
              </a>
              .
            </p>
            <p className="v2-quiet">
              Outside research: music, bullet chess, poker, pickleball, badminton, and{' '}
              <a href="/photography">astrophotography</a>.
            </p>
          </section>

          <section id="research" className="v2-sec">
            <h2>Research</h2>
            <Work />
          </section>

          <section id="contact" className="v2-sec">
            <h2>Contact</h2>
            <ul className="v2-contact">
              <li>
                <span>Email</span>
                <a href="mailto:shlokchannawar05@gmail.com">shlokchannawar05@gmail.com</a>
              </li>
              <li>
                <span>GitHub</span>
                <a href="https://github.com/shlok1808" {...ext}>
                  shlok1808
                </a>
              </li>
              <li>
                <span>X</span>
                <a href="https://x.com/shlok_ch" {...ext}>
                  @shlok_ch
                </a>
              </li>
              <li>
                <span>LinkedIn</span>
                <a href="https://www.linkedin.com/in/shlok-channawar/" {...ext}>
                  shlok-channawar
                </a>
              </li>
              <li>
                <span>CV</span>
                <a href="/Shlok_Channawar_Resume.pdf" {...ext}>
                  view
                </a>
                <a href="/Shlok_Channawar_Resume.pdf" download="Shlok_Channawar_Resume.pdf">
                  download
                </a>
              </li>
              <li>
                <span>Chess</span>
                <a href="https://www.chess.com/member/andrej_karpathys_hair" {...ext}>
                  andrej_karpathys_hair
                </a>
              </li>
            </ul>
          </section>

          <footer className="v2-foot">© 2026 Shlok Channawar</footer>
        </main>
      </div>
    </>
  )
}
