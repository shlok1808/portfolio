import Image from 'next/image'
import { PaletteSwitcher } from '@/components/palette-switcher'

export default function Home() {
  return (
    <main className="page">
      <header>
        <h1 className="name">Shlok Channawar</h1>
        <nav className="nav" aria-label="Sections">
          <a href="#about">about</a>
          <span className="sep">·</span>
          <a href="#research">research</a>
          <span className="sep">·</span>
          <a href="#contact">contact</a>
          <span className="sep">·</span>
          <a href="/photography">photography</a>
        </nav>
      </header>

      <section id="about" className="prose">
        <h2 className="label">About</h2>
        <p>
          I was studying engineering when I watched one of Neel Nanda’s videos on{' '}
          <a
            href="https://www.anthropic.com/research/team/interpretability"
            target="_blank"
            rel="noopener noreferrer"
          >
            mechanistic interpretability
          </a>
          , and it moved me enough to switch my major to data science.
        </p>
        <p>
          The questions I keep circling: how do we decode activations into language we can actually
          trust, when today’s methods hallucinate or read out little more than a bag of words? How do
          we get from knowing what a model represents to showing that representation caused what it
          did? What does it take to probe for something a model never says out loud — deception, or
          the sense that it’s being watched?
        </p>
        <p>
          I’m currently working with{' '}
          <a href="https://louise-lulin.github.io/" target="_blank" rel="noopener noreferrer">
            Dr. Lu Lin
          </a>{' '}
          at Penn State’s{' '}
          <a href="https://ist.psu.edu" target="_blank" rel="noopener noreferrer">
            College of IST
          </a>{' '}
          on interpretability research. I’ve completed{' '}
          <a href="https://bluedot.org" target="_blank" rel="noopener noreferrer">
            BlueDot Impact
          </a>
          ’s Technical AI Safety course, and start their Technical AI Safety Project Sprint in
          October.
        </p>
        <p>
          I’ll be at COLM in San Francisco this October — feel free to reach out if you’ll be there
          too.
        </p>
        <p>
          Apart from research, I like music, chess, poker, pickleball and badminton, or just Xbox
          with friends.
        </p>

        <figure className="plate">
          <Image
            src="/orion.jpg"
            alt="The Orion Nebula: a bright core of ionized gas wrapped in dust lanes, against a field of stars."
            width={1200}
            height={772}
            priority
          />
          <figcaption>
            The Orion Nebula — more of these under <a href="/photography">photography</a>.
          </figcaption>
        </figure>
      </section>

      <section id="research">
        <h2 className="label">Research</h2>
        <div className="entries">
          <article className="entry">
            <h3>Look Before You Steer: Geometry Predicts SAE Feature Steerability</h3>
            <p className="venue">
              Co-first author ·{' '}
              <a href="https://mechinterpworkshop.com/" target="_blank" rel="noopener noreferrer">
                ICML 2026 Mechanistic Interpretability Workshop
              </a>
              , Seoul ·{' '}
              <a
                href="https://actionable-interpretability.github.io/"
                target="_blank"
                rel="noopener noreferrer"
              >
                COLM 2026 Actionable Interpretability Workshop
              </a>
            </p>
            <p>
              Showed that SAE decoder-space geometry predicts how steerable a feature is before any
              intervention, tested across Gemma-2, Llama-3.1, and Qwen3. Worked under{' '}
              <a href="https://girishgupta.com/" target="_blank" rel="noopener noreferrer">
                Girish Gupta
              </a>{' '}
              and Aditya Shah, through{' '}
              <a href="https://algoverseairesearch.org/" target="_blank" rel="noopener noreferrer">
                Algoverse
              </a>
              .
            </p>
            <p className="links">
              <a
                href="https://openreview.net/pdf?id=UIaLI9XPpq"
                target="_blank"
                rel="noopener noreferrer"
              >
                paper
              </a>
            </p>
          </article>

          <article className="entry">
            <h3>Auditing Behavioral Probes for Contextual Privacy</h3>
            <p className="venue">ConfAIde · Under review</p>
            <p>
              Audited a probe that seemed to predict, from Qwen2.5-7B-Instruct’s activations, whether
              it would refuse to reveal a secret in ConfAIde role-play scenarios. Re-annotating the
              responses showed the “refused” label mostly marked answers that disclosed the secret
              and then hedged, so the probe was reading the labels, not the model. What survives is
              narrower: whether the model will limit a disclosure it is about to make is decodable
              before the first response token, with no comparable signal in Llama-3.1-8B-Instruct.
            </p>
          </article>

          <article className="entry">
            <h3>Interpretability for AI Financial Advisors</h3>
            <p className="venue">Mechanistic KYC · Ongoing since May 2026</p>
            <p>
              Probing a frozen Gemma-2-9B financial advisor to see whether it internally represents
              client risk tolerance differently from what it outputs. Built a synthetic
              client-profile generator grounded in the Grable &amp; Lytton risk scale.
            </p>
          </article>
        </div>
      </section>

      <section id="contact">
        <h2 className="label">Contact</h2>
        <dl className="contact">
          <dt>email</dt>
          <dd>
            <a href="mailto:shlokchannawar05@gmail.com">shlokchannawar05@gmail.com</a>
          </dd>
          <dt>github</dt>
          <dd>
            <a href="https://github.com/shlok1808" target="_blank" rel="noopener noreferrer">
              shlok1808
            </a>
          </dd>
          <dt>x</dt>
          <dd>
            <a href="https://x.com/shlok_ch" target="_blank" rel="noopener noreferrer">
              @shlok_ch
            </a>
          </dd>
          <dt>linkedin</dt>
          <dd>
            <a
              href="https://www.linkedin.com/in/shlok-channawar/"
              target="_blank"
              rel="noopener noreferrer"
            >
              shlok-channawar
            </a>
          </dd>
          <dt>chess</dt>
          <dd>
            <a
              href="https://www.chess.com/member/andrej_karpathys_hair"
              target="_blank"
              rel="noopener noreferrer"
            >
              I like playing bullet chess
            </a>
          </dd>
          <dt>resume</dt>
          <dd>
            <a href="/Shlok_Channawar_Resume.pdf" target="_blank" rel="noopener noreferrer">
              view
            </a>{' '}
            <span className="sep">·</span>{' '}
            <a href="/Shlok_Channawar_Resume.pdf" download="Shlok_Channawar_Resume.pdf">
              download
            </a>
          </dd>
        </dl>
      </section>

      <PaletteSwitcher />
    </main>
  )
}
