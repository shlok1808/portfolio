'use client'

import { Figure, Panel, Chevron, Chips } from './figure'

// the 30 originally-"refused" cases under the evidence-span rubric
const VERDICT = (() => {
  const v: number[] = [...Array(23).fill(0), ...Array(5).fill(1), 2, 3]
  let s = 5
  for (let i = v.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648
    const j = s % (i + 1)
    ;[v[i], v[j]] = [v[j], v[i]]
  }
  return v
})()
const VCLS = ['f-orange', 'f-red', 'f-green', 'f-teal']

const arc = (cx: number, cy: number, r: number, v: number) => {
  const a0 = Math.PI
  const a1 = Math.PI + Math.PI * v
  const x0 = cx + r * Math.cos(a0)
  const y0 = cy + r * Math.sin(a0)
  const x1 = cx + r * Math.cos(a1)
  const y1 = cy + r * Math.sin(a1)
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${v > 1 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`
}

export function AuditFigure() {
  const base = 300
  const Y = (v: number) => base - ((v - 0.4) / 0.5) * 200
  return (
    <Figure
      kicker="Fig."
      title="The probe that read the labels, in one picture"
      caption={
        <>
          A probe on Qwen2.5-7B-Instruct’s layer-20 activations seemed to predict refusal (AUC 0.89). Re-annotation
          showed the label mostly marked answers that disclosed the secret and then hedged. What survives: whether the
          model will <i>limit</i> a disclosure is decodable before the first token, +0.16 over a text baseline.
        </>
      }
    >
      {/* ① the claim */}
      <Panel x={10} n="①" title="the claim" at={0} />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={30} y={274 - i * 17} width={40} height={10} rx={3} className={i === 8 ? 'f-acc' : 'f-faint2'} data-at={0.2 + i * 0.03} data-k="fade" />
      ))}
      <text x={50} y={302} textAnchor="middle" className="t-tiny t-dim" data-at={0.4}>
        final token
      </text>
      <text x={76} y={142} className="t-tiny t-acc" data-at={0.6}>
        L20
      </text>
      <path d="M100 138 C 128 138, 136 112, 158 112" className="s-acc" strokeWidth={2} data-at={0.7} data-k="draw" data-d="0.5" />
      <g data-at={1.0} data-k="pop">
        <circle cx={178} cy={110} r={17} className="s-acc" strokeWidth={3} />
        <path d="M190 122 L204 136" className="s-acc" strokeWidth={5} strokeLinecap="round" />
      </g>
      <text x={178} y={82} textAnchor="middle" className="t-small t-ink" data-at={1.1}>
        linear probe
      </text>
      <path d={arc(206, 282, 64, 1)} className="s-faint" strokeWidth={11} strokeLinecap="round" data-at={1.2} data-k="fade" />
      <path d={arc(206, 282, 64, 0.89)} className="s-green" strokeWidth={11} strokeLinecap="round" data-at={1.4} data-k="draw" data-d="1" />
      <text x={206} y={276} textAnchor="middle" className="t-big t-ink" data-at={1.8}>
        0.89
      </text>
      <text x={206} y={304} textAnchor="middle" className="t-tiny t-dim" data-at={1.8}>
        AUC · “refused”
      </text>
      <text x={206} y={328} textAnchor="middle" className="t-small t-dim" data-at={2.0}>
        case closed?
      </text>
      <Chevron x={320} y={190} at={2.1} />

      {/* ② the audit */}
      <Panel x={330} n="②" title="the audit" at={2.1} />
      {VERDICT.map((v, i) => {
        const r = Math.floor(i / 6)
        const c = i % 6
        return <rect key={i} x={362 + c * 40} y={66 + r * 34} width={32} height={26} rx={6} className={VCLS[v]} data-at={2.4 + i * 0.05} data-k="pop" />
      })}
      <text x={480} y={262} textAnchor="middle" className="t-big t-red" data-at={4.0}>
        28 / 30
      </text>
      <text x={480} y={284} textAnchor="middle" className="t-small t-ink" data-at={4.1}>
        “refused” answers disclosed the secret
      </text>
      <text x={480} y={316} textAnchor="middle" className="t-small t-dim" data-at={4.3}>
        old label → chance (AUC 0.47)
      </text>
      <Chevron x={640} y={190} at={4.4} />

      {/* ③ what survives */}
      <Panel x={650} n="③" title="what survives" at={4.4} />
      <text x={668} y={78} className="t-small t-ink" data-at={4.6}>
        will it limit a disclosure? (n = 188)
      </text>
      <line x1={680} x2={900} y1={base} y2={base} className="s-dim" strokeWidth={1.5} data-at={4.6} data-k="draw" data-d="0.4" />
      <rect x={700} y={Y(0.728)} width={70} height={base - Y(0.728)} rx={6} className="f-acc" data-at={4.8} data-k="grow" />
      <rect x={800} y={Y(0.567)} width={70} height={base - Y(0.567)} rx={6} className="f-dim" data-at={5.0} data-k="grow" />
      <text x={735} y={Y(0.728) - 8} textAnchor="middle" className="t-small t-ink" data-at={5.4}>
        0.728
      </text>
      <text x={835} y={Y(0.567) - 8} textAnchor="middle" className="t-small t-ink" data-at={5.4}>
        0.567
      </text>
      <text x={735} y={318} textAnchor="middle" className="t-tiny t-dim" data-at={4.9}>
        activations
      </text>
      <text x={835} y={318} textAnchor="middle" className="t-tiny t-dim" data-at={5.1}>
        scenario text
      </text>
      <path d={`M886 ${Y(0.728)} H900 V${Y(0.567)} H886`} className="s-acc" strokeWidth={2} data-at={5.6} data-k="draw" data-d="0.4" />
      <text x={906} y={(Y(0.728) + Y(0.567)) / 2 + 4} className="t-small t-acc" data-at={5.8}>
        +0.16
      </text>
      <text x={800} y={332} textAnchor="middle" className="t-tiny t-dim" data-at={6.0}>
        leaking itself: +0.057, n.s.
      </text>

      <Chips
        y={372}
        at={6.3}
        items={['eval-awareness erased: 0.737 → 0.736', 'pre-registered onset test: null', 'Llama-3.1-8B: Δ +0.05', 'the label moved it most']}
      />
    </Figure>
  )
}
