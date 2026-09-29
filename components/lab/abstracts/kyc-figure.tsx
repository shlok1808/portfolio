'use client'

import { Figure, Panel, Chevron, Chips } from './figure'

const DOTS = (() => {
  let s = 21
  const r = () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
  const pts: [number, number][] = []
  for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 5; gx++) for (let k = 0; k < 3; k++) pts.push([(gx + 0.15 + r() * 0.7) / 5, (gy + 0.15 + r() * 0.7) / 5])
  return pts
})()

export function KycFigure() {
  const gx = 56
  const gy = 70
  const G = 210
  return (
    <Figure
      kicker="Fig."
      title="Does the advisor know? The study, in one picture"
      caption={
        <>
          Synthetic clients, a frozen Gemma-2-9B-it advisor, and per-factor probes on its residual stream. The question:
          does it represent a client’s willingness, capacity and goals separately, and does that representation drive
          the advice? Ongoing. This figure shows the design, not results.
        </>
      }
    >
      {/* ① clients */}
      <Panel x={10} n="①" title="clients" at={0} />
      <rect x={gx + G * 0.6} y={gy + G * 0.6} width={G * 0.4} height={G * 0.4} className="fill-conflict" data-at={0.2} data-k="fade" />
      {Array.from({ length: 6 }, (_, k) => (
        <g key={k} data-at={0.1 + k * 0.03} data-k="fade">
          <line x1={gx + (G * k) / 5} x2={gx + (G * k) / 5} y1={gy} y2={gy + G} className="s-faint" />
          <line x1={gx} x2={gx + G} y1={gy + (G * k) / 5} y2={gy + (G * k) / 5} className="s-faint" />
        </g>
      ))}
      {DOTS.map(([u, v], i) => {
        const conflicted = u > 0.6 && v < 0.4
        return (
          <circle key={i} cx={gx + u * G} cy={gy + G - v * G} r={3.4} className={conflicted ? 'f-yellow' : 'f-teal'} data-at={0.4 + i * 0.012} data-k="pop" />
        )
      })}
      <text x={gx + G / 2} y={gy + G + 22} textAnchor="middle" className="t-small t-red" data-at={0.5}>
        willingness →
      </text>
      <text x={gx - 12} y={gy + G / 2} textAnchor="middle" className="t-small t-blue" transform={`rotate(-90 ${gx - 12} ${gy + G / 2})`} data-at={0.5}>
        capacity →
      </text>
      <text x={gx + G * 0.8} y={gy + G * 0.6 - 14} textAnchor="middle" className="t-tiny t-yellow" data-at={1.4}>
        conflicted
      </text>
      <text x={160} y={330} textAnchor="middle" className="t-tiny t-dim" data-at={1.5}>
        explicit cards + implicit twins
      </text>
      <Chevron x={320} y={190} at={1.6} />

      {/* ② the advisor */}
      <Panel x={330} n="②" title="the advisor" at={1.6} />
      <g data-at={1.9} data-k="pop">
        <circle cx={400} cy={150} r={30} className="f-periwinkle" />
        <circle cx={391} cy={146} r={4} className="f-white" />
        <circle cx={409} cy={146} r={4} className="f-white" />
        <path d="M394 184 L406 184 L402 190 L408 212 L400 220 L392 212 L398 190 Z" className="f-red" />
      </g>
      <text x={400} y={242} textAnchor="middle" className="t-tiny t-dim" data-at={2.0}>
        Gemma-2-9B-it
      </text>
      <text x={400} y={256} textAnchor="middle" className="t-tiny t-dim" data-at={2.0}>
        frozen
      </text>
      {[
        ['A', '20%', 0.12],
        ['B', '40%', 0.38],
        ['C', '70%', 0.36],
        ['D', '90%', 0.14],
      ].map(([k, s, p], i) => (
        <g key={k as string}>
          <text x={458} y={108 + i * 46} className="t-small t-acc" data-at={2.2 + i * 0.1}>
            {k as string}
          </text>
          <text x={476} y={108 + i * 46} className="t-small t-ink" data-at={2.2 + i * 0.1}>
            {s as string}
          </text>
          <rect x={518} y={96 + i * 46} width={(p as number) * 220} height={14} rx={4} className="f-acc" data-at={2.6 + i * 0.1} data-k="fade" />
        </g>
      ))}
      <text x={480} y={330} textAnchor="middle" className="t-tiny t-dim" data-at={3.0}>
        option logits, averaged over 4 orderings
      </text>
      <Chevron x={640} y={190} at={3.1} />

      {/* ③ inside */}
      <Panel x={650} n="③" title="inside the model" at={3.1} />
      <rect x={670} y={232} width={260} height={30} rx={15} className="fill-stream" data-at={3.3} data-k="fade" />
      <text x={800} y={282} textAnchor="middle" className="t-tiny t-dim" data-at={3.4}>
        residual stream
      </text>
      {[
        ['willingness', 710, 's-red', 't-red'],
        ['capacity', 800, 's-blue', 't-blue'],
        ['goals', 890, 's-teal', 't-teal'],
      ].map(([n, x, s, t], i) => (
        <g key={n as string}>
          <path d={`M${x} 230 V130`} className={s as string} strokeWidth={2.5} data-at={3.6 + i * 0.2} data-k="draw" data-d="0.5" />
          <path d={`M${(x as number) - 6} 138 L${x} 128 L${(x as number) + 6} 138`} className={s as string} strokeWidth={2.5} data-at={4.0 + i * 0.2} data-k="fade" />
          <text x={x as number} y={116} textAnchor="middle" className={`t-small ${t}`} data-at={4.0 + i * 0.2}>
            {n as string}
          </text>
        </g>
      ))}
      <text x={800} y={82} textAnchor="middle" className="t-small t-ink" data-at={4.6}>
        one linear probe per factor
      </text>
      <text x={800} y={318} textAnchor="middle" className="t-small t-dim" data-at={4.8}>
        what it knows vs what it says: ?
      </text>

      <Chips
        y={372}
        at={5.1}
        items={['RQ1 · do the factors exist inside?', 'RQ2 · do they drive the advice?', 'RQ3 · belief capture or compliance?', 'status · model runs next']}
      />
    </Figure>
  )
}
