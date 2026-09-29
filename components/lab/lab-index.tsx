'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useBackground } from './background-stage'
import { useShortlist } from './lab-bar'
import { CATS, OPTIONS, pad, type Cat, type LabOption } from './registry'
import { EXPLAINERS, CONCEPTS, POSTERS } from './slots'

const PICKS: { title: string; items: number[]; why: string }[] = [
  {
    title: 'If you only look at three',
    items: [4, 11, 22],
    why: 'Your paper as a star map you can hover, Episode 1 (the Saturday-morning explainer you asked for), and the retro TV that plays all three episodes.',
  },
  {
    title: 'Closest to the site you have now',
    items: [1, 14, 21],
    why: 'Your wallpaper, alive. One quiet summary figure per paper, and scrolling that tells the story.',
  },
]

function isReady(o: LabOption) {
  if (o.cat === 'background') return true
  if (o.cat === 'concept') return !!CONCEPTS[o.slug]
  return !!EXPLAINERS[o.slug]
}

function BgThumb({ o }: { o: LabOption }) {
  const ref = useRef<HTMLDivElement>(null)
  useBackground(o.slug, ref, true)
  return (
    <div className={`thumb thumb-bg sky-${o.sky}`}>
      {o.sky !== 'none' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="thumb-photo" src="/horizon/landscape.webp" alt="" />
      )}
      <div ref={ref} className="thumb-stage" data-bg={o.slug} />
    </div>
  )
}

function PosterThumb({ o }: { o: LabOption }) {
  const Poster = POSTERS[o.slug]
  if (Poster)
    return (
      <div className="thumb">
        <Poster />
      </div>
    )
  return (
    <div className="thumb thumb-placeholder">
      <span className="thumb-big">{pad(o.n)}</span>
      <span className="thumb-soon">{isReady(o) ? CATS[o.cat].label : 'being built — check back'}</span>
    </div>
  )
}

function Card({ o, loved, onLove }: { o: LabOption; loved: boolean; onLove: () => void }) {
  const ready = isReady(o)
  const body = (
    <>
      {o.cat === 'background' ? <BgThumb o={o} /> : <PosterThumb o={o} />}
      <div className="card-meta">
        <div className="card-top">
          <span className="card-num">{pad(o.n)}</span>
          {!ready && <span className="card-badge">in the works</span>}
        </div>
        <h3 className="card-name">{o.name}</h3>
        <p className="card-blurb">{o.blurb}</p>
        <p className="card-tech">{o.tech}</p>
      </div>
    </>
  )
  return (
    <article className={`card ${ready ? '' : 'is-pending'}`}>
      {ready ? (
        <Link href={`/lab/${o.slug}`} className="card-link">
          {body}
        </Link>
      ) : (
        <div className="card-link">{body}</div>
      )}
      <button
        type="button"
        className={`card-love ${loved ? 'is-on' : ''}`}
        onClick={onLove}
        aria-pressed={loved}
        title={loved ? 'Remove from shortlist' : 'Add to shortlist'}
      >
        {loved ? '♥' : '♡'}
      </button>
    </article>
  )
}

export function LabIndex() {
  const { list, toggle } = useShortlist()
  const [, force] = useState(0)
  useEffect(() => force(1), [])
  const cats = Object.keys(CATS) as Cat[]
  const readyCount = OPTIONS.filter(isReady).length

  return (
    <main className="lab-index">
      <header className="li-head">
        <p className="li-kicker">shlok.space · design lab · preview only</p>
        <h1 className="li-title">{OPTIONS.length} ways to bring the site to life</h1>
        <p className="li-lede">
          Every option opens as a live preview on your real page, with your real words. The site at{' '}
          <Link href="/">/</Link> is untouched: all of this lives on the <code>design-lab</code> branch, and your old
          designs are still in the repo.
        </p>
        <p className="li-keys">
          <kbd>←</kbd> <kbd>→</kbd> flip through options · <kbd>s</kbd> shortlist · <kbd>esc</kbd> back here · <kbd>.</kbd>{' '}
          hide the lab bar
          <span className="li-ready">
            {readyCount}/{OPTIONS.length} ready
          </span>
        </p>
      </header>

      <Link href="/lab/decide" className="li-decide">
        <span className="li-decide-k">new</span>
        <span className="li-decide-t">Can’t decide? Try your finalists side by side</span>
        <span className="li-decide-d">
          Feature Constellation, Logit Lens and the new Activations, switchable on the real page, with the quiet
          “prefer pictures?” links under each paper →
        </span>
      </Link>

      <section className="li-picks">
        {PICKS.map((p) => (
          <div className="pick" key={p.title}>
            <h2>{p.title}</h2>
            <p>{p.why}</p>
            <div className="pick-items">
              {p.items.map((n) => {
                const o = OPTIONS.find((x) => x.n === n)!
                return (
                  <Link key={n} href={`/lab/${o.slug}`} className="pick-chip">
                    <span>{pad(n)}</span> {o.name.replace(/^(Concept · |Ep\. \d · |Summary figure · |Explorable · )/, '')}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
        <div className="pick pick-short">
          <h2>Your shortlist</h2>
          {list.length ? (
            <div className="pick-items">
              {list.map((n) => {
                const o = OPTIONS.find((x) => x.n === n)!
                return (
                  <Link key={n} href={`/lab/${o.slug}`} className="pick-chip is-on">
                    <span>{pad(n)}</span> {o.name}
                  </Link>
                )
              })}
            </div>
          ) : (
            <p>Tap ♡ on anything you like. When you’re done, just tell me the numbers.</p>
          )}
        </div>
      </section>

      {cats.map((c) => (
        <section className="li-cat" key={c}>
          <div className="li-cat-head">
            <h2>
              <span>{CATS[c].range}</span> {CATS[c].label}
            </h2>
            <p>{CATS[c].note}</p>
          </div>
          <div className="li-grid">
            {OPTIONS.filter((o) => o.cat === c).map((o) => (
              <Card key={o.slug} o={o} loved={list.includes(o.n)} onLove={() => toggle(o.n)} />
            ))}
          </div>
        </section>
      ))}

      <footer className="li-foot">
        Built for Shlok on the <code>design-lab</code> branch. Nothing here is deployed or committed yet.
      </footer>
    </main>
  )
}
