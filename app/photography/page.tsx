import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'photography — shlok channawar',
  description: 'Astrophotography by Shlok Channawar.',
}

export default function Photography() {
  return (
    <main className="page">
      <header>
        <h1 className="name">Photography</h1>
        <nav className="nav" aria-label="Sections">
          <a href="/">back</a>
        </nav>
      </header>

      <section className="prose">
        <h2 className="label">Soon</h2>
        <p>
          A proper gallery is on its way — mostly astrophotography, shot from wherever the sky is
          dark enough. In the meantime there are a few on{' '}
          <a href="https://www.instagram.com/shlok_astro/" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          .
        </p>
      </section>
    </main>
  )
}
