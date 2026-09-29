'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { captionAt, duration, locate, renderAt, SHOW, type Episode, type Fonts } from './engine'
import { buildNarrated, loadManifest, type Narrated } from './narration'

export function readFonts(el: Element): Fonts {
  const serif = getComputedStyle(document.body).fontFamily || 'Georgia, serif'
  const monoVar = getComputedStyle(el).getPropertyValue('--lab-mono').trim()
  return { serif, mono: `${monoVar ? monoVar + ', ' : ''}ui-monospace, Menlo, monospace` }
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const VOICE_KEY = 'lab-voice'

/** Keeps a canvas' backing store matched to its CSS size × DPR and redraws on change. */
function useCanvasSize(canvas: React.RefObject<HTMLCanvasElement | null>, onSize: () => void) {
  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const ro = new ResizeObserver(() => {
      const r = c.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      c.width = Math.max(1, Math.round(r.width * dpr))
      c.height = Math.max(1, Math.round(r.height * dpr))
      onSize()
    })
    ro.observe(c)
    return () => ro.disconnect()
  }, [canvas, onSize])
}

export function EpisodePlayer({
  episode,
  autoPlay = true,
  loop = false,
  chrome = true,
  narration = false,
  onEnded,
  className = '',
}: {
  episode: Episode
  autoPlay?: boolean
  loop?: boolean
  chrome?: boolean
  /** offer the narrator (the reader can still mute) */
  narration?: boolean
  onEnded?: () => void
  className?: string
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const clock = useRef<HTMLSpanElement>(null)
  const D = duration(episode)
  const [playing, setPlaying] = useState(false)
  const [ended, setEnded] = useState(false)
  const [cap, setCap] = useState({ html: '', key: '' })
  const [chapter, setChapter] = useState(0)
  const [voice, setVoice] = useState(false)
  const [nar, setNar] = useState<Narrated | null>(null)
  const st = useRef({
    T: 0, // episode time, or narrated time when the voice is on
    raf: 0,
    last: 0,
    fonts: null as Fonts | null,
    userPaused: false,
    playing: false,
    drag: false,
    voice: false,
    nar: null as Narrated | null,
    clipIdx: -1,
    audios: [] as HTMLAudioElement[],
  })

  const total = () => (st.current.voice && st.current.nar ? st.current.nar.DN : D)
  const epTime = () => (st.current.voice && st.current.nar ? st.current.nar.toE(st.current.T) : st.current.T)

  // ── narration: manifest, clips, preference ────────────────────────────────
  useEffect(() => {
    if (!narration) return
    let alive = true
    loadManifest().then((m) => {
      const e = m?.episodes[episode.slug]
      if (!alive || !e) return
      const n = buildNarrated(D, e.clips)
      st.current.nar = n
      st.current.audios = n.clips.map((c) => {
        const a = new Audio(c.src)
        a.preload = 'auto'
        return a
      })
      setNar(n)
      let pref = 'on'
      try {
        pref = localStorage.getItem(VOICE_KEY) ?? 'on'
      } catch {}
      if (pref === 'on') {
        st.current.T = n.toN(st.current.T)
        st.current.voice = true
        setVoice(true)
      }
    })
    const s = st.current
    return () => {
      alive = false
      s.audios.forEach((a) => a.pause())
    }
  }, [narration, episode.slug, D])

  const stopAudio = () => {
    const s = st.current
    if (s.clipIdx >= 0) s.audios[s.clipIdx]?.pause()
    s.clipIdx = -1
  }

  const syncAudio = useCallback(() => {
    const s = st.current
    if (!s.voice || !s.nar || !s.playing) return
    const N = s.T
    const k = s.nar.clips.findIndex((c) => N >= c.N && N < c.N + c.dur)
    if (k === s.clipIdx) return
    stopAudio()
    if (k < 0) return
    const a = s.audios[k]
    if (!a) return
    s.clipIdx = k
    try {
      a.currentTime = Math.max(0, N - s.nar.clips[k].N)
    } catch {}
    a.play().catch(() => {
      // the browser blocked sound (no click yet): fall back to silent captions
      s.voice = false
      s.T = s.nar ? s.nar.toE(s.T) : s.T
      s.clipIdx = -1
      setVoice(false)
    })
  }, [])

  const draw = useCallback(() => {
    const c = canvas.current
    const s = st.current
    if (!c || !s.fonts) return
    const E = epTime()
    renderAt(c.getContext('2d')!, episode, E, c.width, c.height, s.fonts)
    const tot = total()
    if (fill.current) fill.current.style.transform = `scaleX(${Math.min(1, s.T / tot)})`
    if (clock.current) clock.current.textContent = `${fmt(s.T)} / ${fmt(tot)}`
    const cp = captionAt(episode, E)
    setCap((old) => (old.key === cp.key ? old : cp))
    const i = locate(episode, E).i
    setChapter((old) => (old === i ? old : i))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode, D])

  useCanvasSize(canvas, draw)

  useEffect(() => {
    if (!wrap.current) return
    st.current.fonts = readFonts(wrap.current)
    draw()
    document.fonts?.ready.then(() => {
      if (wrap.current) st.current.fonts = readFonts(wrap.current)
      draw()
    })
  }, [draw])

  const stop = useCallback(() => {
    cancelAnimationFrame(st.current.raf)
    st.current.raf = 0
    st.current.playing = false
    stopAudio()
    setPlaying(false)
  }, [])

  const tick = useCallback(
    (now: number) => {
      const s = st.current
      const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 0
      s.last = now
      if (!s.drag) s.T += dt
      const tot = total()
      if (s.T >= tot) {
        if (loop) {
          s.T = 0
          stopAudio()
        } else {
          s.T = tot
          draw()
          stop()
          setEnded(true)
          onEnded?.()
          return
        }
      }
      syncAudio()
      draw()
      s.raf = requestAnimationFrame(tick)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [D, draw, loop, onEnded, stop, syncAudio],
  )

  const play = useCallback(() => {
    const s = st.current
    if (s.playing) return
    if (s.T >= total() - 0.01) s.T = 0
    setEnded(false)
    s.playing = true
    s.last = 0
    s.clipIdx = -1
    setPlaying(true)
    s.raf = requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  const seek = useCallback(
    (T: number) => {
      st.current.T = Math.max(0, Math.min(total(), T))
      stopAudio()
      if (st.current.T < total()) setEnded(false)
      draw()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draw],
  )

  const toggle = useCallback(() => {
    if (st.current.playing) {
      st.current.userPaused = true
      stop()
    } else {
      st.current.userPaused = false
      play()
    }
  }, [play, stop])

  const toggleVoice = () => {
    const s = st.current
    if (!s.nar) return
    const on = !s.voice
    s.T = on ? s.nar.toN(s.T) : s.nar.toE(s.T)
    s.voice = on
    stopAudio()
    setVoice(on)
    try {
      localStorage.setItem(VOICE_KEY, on ? 'on' : 'off')
    } catch {}
    draw()
  }

  // autoplay when mostly visible, pause when scrolled away
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(
      ([en]) => {
        const s = st.current
        if (en.intersectionRatio >= 0.55 && autoPlay && !s.userPaused && s.T < total() - 0.01) play()
        else if (en.intersectionRatio < 0.2 && s.playing) stop()
      },
      { threshold: [0, 0.2, 0.55, 0.8] },
    )
    io.observe(el)
    const s = st.current
    return () => {
      io.disconnect()
      cancelAnimationFrame(s.raf)
      s.audios.forEach((a) => a.pause())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, play, stop])

  const scrubAt = (clientX: number, track: HTMLElement) => {
    const r = track.getBoundingClientRect()
    seek(((clientX - r.left) / r.width) * total())
  }

  const tot = voice && nar ? nar.DN : D
  const chapters = episode.scenes.reduce<{ start: number; title: string }[]>((acc, sc, i) => {
    const start = i === 0 ? 0 : acc[i - 1].start + episode.scenes[i - 1].dur
    acc.push({ start, title: sc.title })
    return acc
  }, [])
  const tickAt = (E: number) => (voice && nar ? nar.toN(E) : E) / tot

  return (
    <div
      ref={wrap}
      className={`ep ${chrome ? '' : 'ep--bare'} ${className}`}
      tabIndex={0}
      data-keys
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'k') {
          e.preventDefault()
          toggle()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          seek(st.current.T + 5)
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          seek(st.current.T - 5)
        } else if (e.key === 'm') toggleVoice()
      }}
      aria-label={`${SHOW}, episode ${episode.number}: ${episode.title}. Space to play or pause, arrows to seek, M to mute the narrator.`}
    >
      {chrome && (
        <div className="ep-head">
          <span className="ep-show">
            <i className={`ep-live ${playing ? 'on' : ''}`} />
            {SHOW} · Ep. {episode.number}
          </span>
          <span className="ep-chapter">{chapters[chapter]?.title}</span>
        </div>
      )}
      <div className="ep-stage" onClick={toggle}>
        <canvas ref={canvas} className="ep-canvas" />
        {!playing && !ended && (
          <button type="button" className="ep-bigplay" aria-label="Play">
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
              <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
            </svg>
          </button>
        )}
        {ended && (
          <div className="ep-end" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ep-replay" onClick={() => play()}>
              ↺ replay
            </button>
            {episode.link && (
              <a className="ep-read" href={episode.link.href} target="_blank" rel="noopener noreferrer">
                {episode.link.label} →
              </a>
            )}
          </div>
        )}
      </div>
      <div className="ep-cap" aria-live="polite">
        <p key={cap.key} dangerouslySetInnerHTML={{ __html: cap.html || '&nbsp;' }} />
      </div>
      <div className="ep-controls">
        <button type="button" className="ep-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <rect x="6.5" y="5" width="3.6" height="14" rx="1" fill="currentColor" />
              <rect x="13.9" y="5" width="3.6" height="14" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
            </svg>
          )}
        </button>
        <div
          className="ep-track"
          onPointerDown={(e) => {
            const tr = e.currentTarget
            tr.setPointerCapture(e.pointerId)
            st.current.drag = true
            scrubAt(e.clientX, tr)
          }}
          onPointerMove={(e) => {
            if (st.current.drag) scrubAt(e.clientX, e.currentTarget)
          }}
          onPointerUp={() => {
            st.current.drag = false
          }}
        >
          <div className="ep-fill" ref={fill} />
          {chapters.map((c, i) => (
            <button
              type="button"
              key={i}
              className={`ep-tick ${i <= chapter ? 'on' : ''}`}
              style={{ left: `${tickAt(c.start) * 100}%` }}
              title={c.title}
              onPointerDown={(e) => {
                e.stopPropagation()
                seek((voice && nar ? nar.toN(c.start) : c.start) + 0.01)
              }}
            />
          ))}
        </div>
        <span className="ep-time" ref={clock}>
          0:00 / {fmt(tot)}
        </span>
        {nar && (
          <button
            type="button"
            className={`ep-btn ep-voice ${voice ? 'on' : ''}`}
            onClick={toggleVoice}
            aria-pressed={voice}
            aria-label={voice ? 'Mute the narrator' : 'Turn on the narrator'}
            title={voice ? 'Narrator on (M)' : 'Narrator off (M)'}
          >
            {voice ? (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
                <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

/** A single frame of an episode (index thumbnails); plays while hovered. */
export function EpisodePoster({ episode }: { episode: Episode }) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const st = useRef({ T: episode.poster, raf: 0, last: 0, fonts: null as Fonts | null })
  const draw = useCallback(() => {
    const c = canvas.current
    if (!c || !st.current.fonts) return
    renderAt(c.getContext('2d')!, episode, st.current.T, c.width, c.height, st.current.fonts)
  }, [episode])
  useCanvasSize(canvas, draw)
  useEffect(() => {
    if (!wrap.current) return
    st.current.fonts = readFonts(wrap.current)
    draw()
    document.fonts?.ready.then(() => {
      if (wrap.current) st.current.fonts = readFonts(wrap.current)
      draw()
    })
    const s = st.current
    return () => cancelAnimationFrame(s.raf)
  }, [draw])
  const D = duration(episode)
  const loopFrame = (now: number) => {
    const s = st.current
    const dt = s.last ? (now - s.last) / 1000 : 0
    s.last = now
    s.T = (s.T + dt) % D
    draw()
    s.raf = requestAnimationFrame(loopFrame)
  }
  return (
    <div
      ref={wrap}
      className="ep-poster"
      onPointerEnter={() => {
        st.current.last = 0
        st.current.raf = requestAnimationFrame(loopFrame)
      }}
      onPointerLeave={() => {
        cancelAnimationFrame(st.current.raf)
        st.current.T = episode.poster
        draw()
      }}
    >
      <canvas ref={canvas} className="ep-canvas" />
    </div>
  )
}
