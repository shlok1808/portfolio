'use client'

import { Figure, Panel, Chevron, Chips } from './figure'

// ── ① decoder geometry: deterministic dots, a crowded feature and an isolated one ──
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
const CX = 160
const CY = 190
const R = 118
const RED: [number, number] = [214, 150]
const BLUE: [number, number] = [98, 250]
const DOTS = (() => {
  const r = rng(9)
  const g = () => Math.sqrt(-2 * Math.log(Math.max(1e-6, r()))) * Math.cos(2 * Math.PI * r())
  const pts: [number, number][] = []
  const ok = (x: number, y: number) =>
    Math.hypot(x - CX, y - CY) < R - 8 && Math.hypot(x - BLUE[0], y - BLUE[1]) > 58 && Math.hypot(x - RED[0], y - RED[1]) > 10
  for (let i = 0; i < 24; i++) {
    const x = RED[0] + g() * 20
    const y = RED[1] + g() * 18
    if (ok(x, y)) pts.push([x, y])
  }
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r()) * R
    const x = CX + Math.cos(a) * d
    const y = CY + Math.sin(a) * d
    if (ok(x, y)) pts.push([x, y])
  }
  return pts
})()
const nn = (p: [number, number], k: number) =>
  DOTS.map((d) => ({ d, r: Math.hypot(d[0] - p[0], d[1] - p[1]) }))
    .sort((a, b) => a.r - b.r)
    .slice(0, k)
    .map((o) => o.d)

// ── ② dose–response (schematic, as in the paper's Fig. 1) ──
const GRID = [0, 0.25, 0.5, 1, 2, 3, 5, 10, 20]
const sig = (x: number) => 1 / (1 + Math.exp(-x))
const Bred = (a: number) => 0.12 + 0.6 * sig(1.7 * (a - 2.3))
const Bblue = (a: number) => 0.12 + 0.45 * sig(0.55 * (a - 11))
const alphaAt = (u: number) => {
  const i = Math.min(7, Math.floor(u))
  return GRID[i] + (GRID[i + 1] - GRID[i]) * (u - i)
}
const X2 = (u: number) => 365 + (u / 8) * 245
const Y2 = (b: number) => 300 - (b / 0.8) * 215
const curve = (B: (a: number) => number) => {
  let d = ''
  for (let k = 0; k <= 80; k++) {
    const u = (k / 80) * 8
    d += `${k ? 'L' : 'M'}${X2(u).toFixed(1)} ${Y2(B(alphaAt(u))).toFixed(1)}`
  }
  return d
}

// ── ③ the paper's Figure 3: ρ (neighbour density vs log α*) against relative depth ──
const FIG3 = [
  { d: 48, r: -0.546, c: 'red', s: 'sq', l: '9B L20' },
  { d: 86, r: -0.327, c: 'red', s: 'sq', l: '9B L36' },
  { d: 77, r: -0.288, c: 'blue', s: 'o', l: '2B L20' },
  { d: 85, r: -0.512, c: 'blue', s: 'o', l: '2B L22' },
  { d: 92, r: -0.125, c: 'blue', s: 'open', l: '2B L24' },
  { d: 47, r: -0.188, c: 'green', s: 'dia', l: 'Llama L15' },
  { d: 72, r: -0.22, c: 'green', s: 'dia', l: 'Llama L23' },
] as const
const X3 = (d: number) => 690 + ((d - 42) / 55) * 240
const Y3 = (r: number) => 75 + ((0.05 - r) / 0.7) * 225

export function SteerFigure() {
  const redNN = nn(RED, 9)
  const blueNN = nn(BLUE, 9)
  return (
    <Figure
      kicker="Fig."
      title="Look Before You Steer, in one picture"
      caption={
        <>
          Decoder geometry, computed from <i>W</i>
          <sub>dec</sub> before any intervention, ranks SAE features by the steering coefficient α* they need.
          Panel ② is schematic, as in the paper’s Figure 1; panel ③ redraws its Figure 3.
        </>
      }
    >
      {/* ① */}
      <Panel x={10} n="①" title="decoder geometry" at={0} />
      <circle cx={CX} cy={CY} r={R} className="s-faint" strokeWidth={1.5} data-at={0.2} data-k="draw" />
      {DOTS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.6} className="f-dim" data-at={0.35 + i * 0.008} data-k="pop" />
      ))}
      {redNN.map(([x, y], i) => (
        <line key={`r${i}`} x1={RED[0]} y1={RED[1]} x2={x} y2={y} className="s-red" strokeWidth={1.4} strokeOpacity={0.8} data-at={1.1 + i * 0.05} data-k="draw" data-d="0.35" />
      ))}
      {blueNN.map(([x, y], i) => (
        <line key={`b${i}`} x1={BLUE[0]} y1={BLUE[1]} x2={x} y2={y} className="s-blue" strokeWidth={1.2} strokeOpacity={0.55} data-at={1.1 + i * 0.05} data-k="draw" data-d="0.45" />
      ))}
      <circle cx={RED[0]} cy={RED[1]} r={8} className="f-red glow-red" data-at={0.9} data-k="pop" />
      <circle cx={BLUE[0]} cy={BLUE[1]} r={8} className="f-blue glow-blue" data-at={0.95} data-k="pop" />
      <text x={RED[0] + 14} y={RED[1] - 18} className="t-serif t-lab t-red" data-at={1.6}>
        crowded
      </text>
      <text x={BLUE[0] - 12} y={BLUE[1] + 30} className="t-serif t-lab t-blue" data-at={1.6} textAnchor="middle">
        isolated
      </text>
      <text x={24} y={326} className="t-small t-dim" data-at={1.8}>
        density 0.29 vs 0.14 · from W_dec alone
      </text>
      <Chevron x={320} y={190} at={1.9} />

      {/* ② */}
      <Panel x={330} n="②" title="steering cost" at={1.9} />
      <path d={`M365 85 V300 H615`} className="s-dim" strokeWidth={1.5} data-at={2.1} data-k="draw" data-d="0.5" />
      <line x1={365} x2={615} y1={Y2(0.22)} y2={Y2(0.22)} className="s-acc" strokeWidth={1.4} strokeDasharray="5 5" data-at={2.4} data-k="fade" />
      <text x={372} y={Y2(0.22) - 7} className="t-small t-acc" data-at={2.5}>
        threshold T
      </text>
      <path d={curve(Bred)} className="s-red" strokeWidth={3} data-at={2.6} data-k="draw" data-d="1.1" />
      <path d={curve(Bblue)} className="s-blue" strokeWidth={3} data-at={2.8} data-k="draw" data-d="1.3" />
      <g data-at={3.6} data-k="pop">
        <circle cx={X2(4)} cy={Y2(Bred(2))} r={5.5} className="f-red" />
        <text x={X2(4) - 8} y={Y2(Bred(2)) - 12} textAnchor="end" className="t-small t-red">
          α* = 2
        </text>
      </g>
      <g data-at={4.0} data-k="pop">
        <circle cx={X2(7)} cy={Y2(Bblue(10))} r={5.5} className="f-blue" />
        <text x={X2(7) - 10} y={Y2(Bblue(10)) - 8} textAnchor="end" className="t-small t-blue">
          α* = 10
        </text>
      </g>
      <text x={490} y={326} textAnchor="middle" className="t-small t-dim" data-at={2.2}>
        steering coefficient α → · refusal rate ↑
      </text>
      <text x={612} y={98} textAnchor="end" className="t-tiny t-dim" data-at={2.2}>
        schematic
      </text>
      <Chevron x={640} y={190} at={4.2} />

      {/* ③ */}
      <Panel x={650} n="③" title="geometry predicts α*" at={4.2} />
      <rect x={X3(85)} y={62} width={X3(97) - X3(85)} height={252} className="fill-deep" data-at={4.4} data-k="fade" />
      <text x={(X3(85) + X3(97)) / 2} y={80} textAnchor="middle" className="t-tiny t-dim" data-at={4.5}>
        deep
      </text>
      <path d={`M690 70 V300 H935`} className="s-dim" strokeWidth={1.5} data-at={4.4} data-k="draw" data-d="0.5" />
      <line x1={690} x2={935} y1={Y3(0)} y2={Y3(0)} className="s-faint" strokeWidth={1.2} strokeDasharray="3 5" data-at={4.6} data-k="fade" />
      {FIG3.map((p, i) => {
        const x = X3(p.d)
        const y = Y3(p.r)
        const cls = p.c === 'red' ? 'f-red' : p.c === 'blue' ? 'f-blue' : 'f-green'
        return (
          <g key={p.l} data-at={4.8 + i * 0.12} data-k="pop">
            {p.s === 'sq' ? (
              <rect x={x - 5.5} y={y - 5.5} width={11} height={11} className={cls} />
            ) : p.s === 'dia' ? (
              <path d={`M${x} ${y - 7} L${x + 6} ${y} L${x} ${y + 7} L${x - 6} ${y} Z`} className={cls} />
            ) : p.s === 'open' ? (
              <circle cx={x} cy={y} r={5.5} className="s-blue" strokeWidth={2} />
            ) : (
              <circle cx={x} cy={y} r={5.5} className={cls} />
            )}
          </g>
        )
      })}
      <g data-at={5.8} data-k="fade">
        <circle cx={X3(48)} cy={Y3(-0.546)} r={12} className="s-red pulse" strokeWidth={1.5} />
        <text x={X3(48) + 18} y={Y3(-0.546) - 12} className="t-small t-ink">
          ρ = −0.546 · Gemma-2-9B L20
        </text>
      </g>
      <text x={812} y={326} textAnchor="middle" className="t-small t-dim" data-at={4.6}>
        relative depth → · Spearman ρ ↓
      </text>
      <text x={700} y={292} className="t-tiny" data-at={5.6}>
        <tspan className="t-red">■</tspan> <tspan className="t-dim">9B</tspan> <tspan className="t-blue">●</tspan>{' '}
        <tspan className="t-dim">2B</tspan> <tspan className="t-green">◆</tspan> <tspan className="t-dim">Llama</tspan>
      </text>

      <Chips
        y={372}
        at={6.2}
        items={['ρ up to −0.546, p < 10⁻⁶', 'AUROC 0.61–0.82', 'Gemma-2 2B & 9B · 16K & 65K', 'Llama-3.1-8B: ρ −0.266', 'weakens near the output']}
      />
    </Figure>
  )
}
