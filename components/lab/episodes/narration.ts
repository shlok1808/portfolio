/**
 * Narration: one pre-rendered clip per subtitle (scripts/lab/narrate.py → public/lab/narration).
 * Clips are often longer than the gap to the next subtitle, so the narrated timeline inserts
 * short holds: the picture freezes on a steady frame until the narrator finishes. toE maps
 * narrated time → episode time; toN is the inverse.
 */

export interface Clip {
  start: number
  dur: number
  src: string
  text?: string
}
interface Manifest {
  voice: string
  episodes: Record<string, { duration: number; clips: Clip[] }>
}

let manifest: Promise<Manifest | null> | null = null
export function loadManifest() {
  if (!manifest)
    manifest = fetch('/lab/narration/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
  return manifest
}

export interface Narrated {
  /** narrated duration */
  DN: number
  toE(N: number): number
  toN(E: number): number
  clips: { N: number; dur: number; src: string }[]
}

const GAP = 0.3 // breathing room after each line

/**
 * Piecewise-linear time map. Each subtitle's window [start, next) plays at normal speed if the
 * narrator fits inside it, and in gentle slow motion if they need longer, so the picture never
 * freezes and never races ahead of the voice.
 */
export function buildNarrated(D: number, clips: Clip[]): Narrated {
  const cs = clips.slice().sort((a, b) => a.start - b.start)
  const segs: { e0: number; e1: number; n0: number; n1: number }[] = []
  let N = 0
  const push = (e0: number, e1: number, len: number) => {
    if (e1 <= e0) return
    segs.push({ e0, e1, n0: N, n1: N + len })
    N += len
  }
  if (!cs.length || cs[0].start > 0) push(0, cs[0]?.start ?? D, cs[0]?.start ?? D)
  cs.forEach((c, k) => {
    const e1 = Math.min(D, cs[k + 1]?.start ?? D)
    const avail = e1 - c.start
    push(c.start, e1, Math.max(avail, c.dur + GAP))
  })
  const toE = (n: number) => {
    for (const s of segs) if (n < s.n1) return s.e0 + (Math.max(0, n - s.n0) * (s.e1 - s.e0)) / (s.n1 - s.n0)
    return D
  }
  const toN = (e: number) => {
    for (const s of segs) if (e < s.e1) return s.n0 + (Math.max(0, e - s.e0) * (s.n1 - s.n0)) / (s.e1 - s.e0)
    return N
  }
  return { DN: N, toE, toN, clips: cs.map((c) => ({ N: toN(c.start), dur: c.dur, src: c.src })) }
}
