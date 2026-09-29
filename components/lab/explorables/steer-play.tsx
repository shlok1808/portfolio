'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * 17 · Explorable — steer a feature (toy model, labelled as such).
 * 240 features live in a 16-D space with clusters; their 2-D positions are a layout for the eye,
 * neighbours and densities come from real cosines in 16-D. Each feature's α* is drawn from a
 * noisy decreasing function of its neighbour density, which is the paper's finding, and the
 * scatter computes Spearman ρ for this toy population live.
 */

const GRID = [0, 0.25, 0.5, 1, 2, 3, 5, 10, 20]
const D = 16
const K = 12
const N = 240
const B0 = 0.12
const T = 0.1

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Feat {
  id: number
  x: number
  y: number
  nbrs: number[]
  density: number
  maxcos: number
  alphaStar: number // continuous
  alphaGrid: number // first grid value that reaches T (Infinity if censored)
}

function build(): { feats: Feat[]; rho: number } {
  const r = rng(546)
  const g = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, r()))) * Math.cos(2 * Math.PI * r())
  const nC = 11
  const centers = Array.from({ length: nC }, () => {
    const v = Array.from({ length: D }, g)
    const l = Math.hypot(...v)
    return v.map((x) => x / l)
  })
  const c2 = Array.from({ length: nC }, (_, j) => {
    const a = (j / nC) * Math.PI * 2 + r() * 0.4
    const d = 0.25 + r() * 0.2
    return [0.5 + Math.cos(a) * d, 0.5 + Math.sin(a) * d]
  })
  const spread = Array.from({ length: nC }, () => 0.18 + r() * 0.45)
  const vecs: number[][] = []
  const pos: number[][] = []
  for (let i = 0; i < N; i++) {
    let v: number[]
    let p: number[]
    if (r() < 0.3) {
      v = Array.from({ length: D }, g)
      p = [0.06 + r() * 0.88, 0.06 + r() * 0.88]
    } else {
      const j = Math.floor(r() * nC)
      const s = spread[j]
      const n = Array.from({ length: D }, g)
      v = centers[j].map((c, k) => c + s * n[k] * 0.35)
      p = [c2[j][0] + n[0] * s * 0.07, c2[j][1] + n[1] * s * 0.07]
    }
    const l = Math.hypot(...v)
    vecs.push(v.map((x) => x / l))
    pos.push([Math.min(0.97, Math.max(0.03, p[0])), Math.min(0.97, Math.max(0.03, p[1]))])
  }
  const feats: Feat[] = []
  for (let i = 0; i < N; i++) {
    const cs: [number, number][] = []
    for (let j = 0; j < N; j++) if (j !== i) cs.push([j, vecs[i].reduce((s, x, k) => s + x * vecs[j][k], 0)])
    cs.sort((a, b) => b[1] - a[1])
    const top = cs.slice(0, K)
    feats.push({
      id: 1000 + Math.floor(r() * 15000),
      x: pos[i][0],
      y: pos[i][1],
      nbrs: top.map((t) => t[0]),
      density: top.reduce((s, t) => s + t[1], 0) / K,
      maxcos: top[0][1],
      alphaStar: 0,
      alphaGrid: 0,
    })
  }
  // α*: decreasing in density (z-scored) plus noise — the paper's direction, in a toy
  const ds = feats.map((f) => f.density)
  const mu = ds.reduce((a, b) => a + b, 0) / N
  const sd = Math.sqrt(ds.reduce((a, b) => a + (b - mu) ** 2, 0) / N)
  for (const f of feats) {
    const z = (f.density - mu) / sd
    f.alphaStar = Math.min(26, Math.max(0.6, Math.exp(1.25 - 0.62 * z + 0.95 * g())))
    f.alphaGrid = GRID.find((a) => a >= f.alphaStar) ?? Infinity
  }
  // Spearman ρ(density, log α*) with average ranks for ties
  const rank = (vals: number[]) => {
    const idx = vals.map((v, i) => [v, i] as [number, number]).sort((a, b) => a[0] - b[0])
    const out = new Array(vals.length).fill(0)
    for (let i = 0; i < idx.length; ) {
      let j = i
      while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++
      const avg = (i + j) / 2
      for (let k = i; k <= j; k++) out[idx[k][1]] = avg
      i = j + 1
    }
    return out
  }
  const ra = rank(feats.map((f) => f.density))
  const rb = rank(feats.map((f) => (Number.isFinite(f.alphaGrid) ? f.alphaGrid : 40)))
  const ma = ra.reduce((a, b) => a + b, 0) / N
  const mb = rb.reduce((a, b) => a + b, 0) / N
  let num = 0
  let da = 0
  let db = 0
  for (let i = 0; i < N; i++) {
    num += (ra[i] - ma) * (rb[i] - mb)
    da += (ra[i] - ma) ** 2
    db += (rb[i] - mb) ** 2
  }
  return { feats, rho: num / Math.sqrt(da * db) }
}

const B = (f: Feat, a: number) => {
  const k = 1.6 / Math.max(0.8, f.alphaStar * 0.45)
  const mid = f.alphaStar + 1.504 / k
  return B0 + 0.55 / (1 + Math.exp(-k * (a - mid)))
}
const u2a = (u: number) => {
  const i = Math.min(7, Math.floor(u))
  return GRID[i] + (GRID[i + 1] - GRID[i]) * (u - i)
}
const a2u = (a: number) => {
  for (let i = 1; i < GRID.length; i++) if (a <= GRID[i]) return i - 1 + (a - GRID[i - 1]) / (GRID[i] - GRID[i - 1])
  return 8
}

export function SteerPlay() {
  const { feats, rho } = useMemo(build, [])
  const dens = feats.map((f) => f.density)
  const dMin = Math.min(...dens)
  const dMax = Math.max(...dens)
  const cls = (f: Feat) => (f.density - dMin) / (dMax - dMin)
  const mcs = feats.map((ff) => ff.maxcos)
  const mMin = Math.min(...mcs)
  const mMax = Math.max(...mcs)
  // shown on the scale of real SAE decoders (the paper's range), not the toy's 16-D cosines
  const showDensity = (ff: Feat) => 0.12 + 0.19 * cls(ff)
  const showMaxcos = (ff: Feat) => 0.2 + 0.52 * ((ff.maxcos - mMin) / (mMax - mMin))
  const [sel, setSel] = useState(() => feats.reduce((b, f, i) => (f.density > feats[b].density ? i : b), 0))
  const [hover, setHover] = useState(-1)
  const [u, setU] = useState(0)
  const [sweeping, setSweeping] = useState(false)
  const raf = useRef(0)

  const f = feats[sel]
  const a = u2a(u)
  const b = B(f, a)
  const reached = b - B0 >= T
  const refusing = b > 0.36

  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  const sweep = () => {
    cancelAnimationFrame(raf.current)
    setSweeping(true)
    const t0 = performance.now()
    const go = (now: number) => {
      const p = Math.min(1, (now - t0) / 3800)
      setU(p * 8)
      if (p < 1) raf.current = requestAnimationFrame(go)
      else setSweeping(false)
    }
    raf.current = requestAnimationFrame(go)
  }
  const pickBy = (want: 'dense' | 'isolated') => {
    const sorted = feats.map((ff, i) => [ff.density, i] as [number, number]).sort((x, y) => x[0] - y[0])
    const pool = want === 'dense' ? sorted.slice(-30) : sorted.slice(0, 30)
    setSel(pool[Math.floor(Math.random() * pool.length)][1])
    setU(0)
  }

  // chart geometry
  const CW = 420
  const CH = 200
  const X = (uu: number) => 40 + (uu / 8) * (CW - 60)
  const Y = (bb: number) => CH - 30 - (bb / 0.8) * (CH - 50)
  let path = ''
  for (let k = 0; k <= 80; k++) {
    const uu = (k / 80) * 8
    path += `${k ? 'L' : 'M'}${X(uu).toFixed(1)} ${Y(B(f, u2a(uu))).toFixed(1)}`
  }
  const starU = Number.isFinite(f.alphaGrid) ? a2u(f.alphaGrid) : null

  // scatter
  const SW = 420
  const SH = 170
  const SX = (d: number) => 40 + ((d - dMin) / (dMax - dMin)) * (SW - 60)
  const SY = (ag: number) => {
    const la = Math.log(Number.isFinite(ag) ? ag : 30)
    return SH - 28 - ((la - Math.log(0.25)) / (Math.log(30) - Math.log(0.25))) * (SH - 48)
  }

  return (
    <div className="xp" data-keys>
      <div className="xp-head">
        <span>
          <b>Explorable</b> · steer a feature
        </span>
        <span className="xp-tag">toy model · mirrors the paper’s direction, not its data</span>
      </div>
      <div className="xp-body xp-steer">
        <div className="xp-space">
          <svg viewBox="0 0 400 400" className="xp-svg" onMouseLeave={() => setHover(-1)}>
            <circle cx={200} cy={200} r={194} className="xp-rim" />
            {f.nbrs.map((j) => (
              <line key={j} x1={f.x * 400} y1={f.y * 400} x2={feats[j].x * 400} y2={feats[j].y * 400} className="xp-nn" />
            ))}
            {feats.map((ff, i) => {
              const c = cls(ff)
              return (
                <circle
                  key={i}
                  cx={ff.x * 400}
                  cy={ff.y * 400}
                  r={i === sel ? 7 : i === hover ? 6 : 3.4}
                  className={`xp-dot ${i === sel ? 'is-sel' : ''}`}
                  style={{ fill: `hsl(${210 - c * 190} ${60 + c * 30}% ${62 + c * 6}%)` }}
                  onMouseEnter={() => setHover(i)}
                  onClick={() => {
                    setSel(i)
                    setU(0)
                  }}
                />
              )
            })}
          </svg>
          <p className="xp-note">
            Click any feature. Lines join its 12 nearest decoder directions by cosine. Warm = dense neighbourhood,
            cool = isolated.
          </p>
          <div className="xp-btns">
            <button type="button" onClick={() => pickBy('dense')}>
              a crowded one
            </button>
            <button type="button" onClick={() => pickBy('isolated')}>
              an isolated one
            </button>
          </div>
        </div>
        <div className="xp-right">
          <div className="xp-stats">
            <span>
              feature <b>#{f.id}</b>
            </span>
            <span>
              density <b>{showDensity(f).toFixed(3)}</b>
            </span>
            <span>
              max cos <b>{showMaxcos(f).toFixed(3)}</b>
            </span>
            <span>
              α* <b>{Number.isFinite(f.alphaGrid) ? f.alphaGrid : '> 20'}</b>
            </span>
          </div>
          <div className="xp-slider">
            <label htmlFor="xp-alpha">
              α = <b>{a < 1 ? a.toFixed(2) : a.toFixed(1)}</b>
            </label>
            <input
              id="xp-alpha"
              type="range"
              min={0}
              max={8}
              step={0.01}
              value={u}
              onChange={(e) => setU(parseFloat(e.target.value))}
              disabled={sweeping}
            />
            <button type="button" className="xp-go" onClick={sweep} disabled={sweeping}>
              {sweeping ? 'sweeping…' : '▶ sweep α'}
            </button>
          </div>
          <svg viewBox={`0 0 ${CW} ${CH}`} className="xp-svg xp-chart">
            <path d={`M40 14 V${CH - 30} H${CW - 20}`} className="xp-axis" />
            {GRID.map((g, i) => (
              <text key={g} x={X(i)} y={CH - 12} textAnchor="middle" className="xp-tick">
                {g}
              </text>
            ))}
            <line x1={40} x2={CW - 20} y1={Y(B0 + T)} y2={Y(B0 + T)} className="xp-thr" />
            <text x={CW - 22} y={Y(B0 + T) - 6} textAnchor="end" className="xp-tick xp-acc">
              B(0) + T
            </text>
            <path d={path} className="xp-curve" />
            {starU !== null && (
              <g>
                <line x1={X(starU)} x2={X(starU)} y1={Y(B(f, f.alphaGrid))} y2={CH - 30} className="xp-star-line" />
                <text x={X(starU) + 6} y={CH - 36} className="xp-tick xp-acc">
                  α*
                </text>
              </g>
            )}
            <circle cx={X(u)} cy={Y(b)} r={6} className={`xp-now ${reached ? 'on' : ''}`} />
          </svg>
          <div className={`xp-reply ${refusing ? 'is-refuse' : ''}`}>
            <span className="xp-reply-k">model reply</span>
            {refusing ? '“I can’t help with that.”' : '“Sure! Here’s how you…”'}
            <span className="xp-reply-r">refusal {(b * 100).toFixed(0)}%</span>
          </div>
          <svg viewBox={`0 0 ${SW} ${SH}`} className="xp-svg xp-scatter">
            <path d={`M40 10 V${SH - 28} H${SW - 20}`} className="xp-axis" />
            {feats.map((ff, i) => (
              <circle key={i} cx={SX(ff.density)} cy={SY(ff.alphaGrid) + ((i * 37) % 7) - 3} r={i === sel ? 6 : 2.4} className={i === sel ? 'xp-sel-pt' : 'xp-pt'} />
            ))}
            <text x={SW / 2} y={SH - 8} textAnchor="middle" className="xp-tick">
              neighbour density →
            </text>
            <text x={14} y={SH / 2} textAnchor="middle" className="xp-tick" transform={`rotate(-90 14 ${SH / 2})`}>
              log α*
            </text>
            <text x={SW - 22} y={24} textAnchor="end" className="xp-tick xp-acc">
              toy ρ = {rho.toFixed(2)} · paper, 9B L20: −0.546
            </text>
          </svg>
        </div>
      </div>
    </div>
  )
}
