'use client'

import { useRef, useState } from 'react'

/**
 * 19 · Explorable — build a client. Illustrates the Mechanistic KYC design (README): willingness,
 * capacity and goals are separate; implicit twins never use risk words; counterfactual pairs
 * change exactly one field. No model outputs, no results.
 */

const BANNED = ['risk', 'tolerance', 'aggressive', 'conservative', 'volatile', 'volatility', 'moderate', 'averse', 'cautious']
const GOALS = {
  house: { label: 'a house in 10 years', text: 'a down payment on a house in about ten years' },
  retire: { label: 'retirement', text: 'retirement, roughly twenty-five years away' },
  growth: { label: 'maximum growth', text: 'growing it as much as possible, with no set date' },
  keep: { label: 'keep it safe', text: 'keeping what she has intact for the next few years' },
} as const
type Goal = keyof typeof GOALS

type Field = 'drawdown' | 'experience' | 'fund' | 'income' | 'dependents'
const FIELD_LABEL: Record<Field, string> = {
  drawdown: 'reaction to a crash',
  experience: 'investing experience',
  fund: 'emergency fund',
  income: 'income stability',
  dependents: 'dependents',
}

function fields(w: number, c: number) {
  return {
    drawdown: w < 0.25 ? 0 : w < 0.5 ? 1 : w < 0.75 ? 2 : 3,
    experience: w < 0.33 ? 0 : w < 0.66 ? 1 : 2,
    fund: Math.max(1, Math.round(1 + c * 11)),
    income: c < 0.33 ? 0 : c < 0.66 ? 1 : 2,
    dependents: c < 0.4 ? 0 : c < 0.7 ? 1 : 2,
  }
}
type F = ReturnType<typeof fields>

const DRAWDOWN = [
  'When the market fell by a third in 2022, Priya sold everything within a week',
  'When the market fell in 2022, Priya sold about half of what she held',
  'When the market fell in 2022, Priya held on and stopped checking the app',
  'When the market fell in 2022, Priya bought more on the way down',
]
const EXPERIENCE = [
  'She had never owned a stock before last year',
  'She has kept money in index funds for a few years',
  'She has picked her own stocks for over a decade',
]
const INCOME = [
  'freelance income that changes month to month',
  'a steady salary at a hospital',
  'a tenured job plus rent from a small flat',
]
const DEPENDENTS = ['She supports two young kids.', 'She helps support her mother.', 'Nobody depends on her income.']

function story(f: F, goal: Goal) {
  return [
    `${DRAWDOWN[f.drawdown]}.`,
    `${EXPERIENCE[f.experience]}.`,
    `She keeps about ${f.fund} ${f.fund === 1 ? 'month' : 'months'} of expenses in savings and earns ${INCOME[f.income]}.`,
    DEPENDENTS[f.dependents],
    `The money is for ${GOALS[goal].text}.`,
  ]
}

function flip(f: F, field: Field): F {
  const g = { ...f }
  if (field === 'drawdown') g.drawdown = f.drawdown >= 2 ? 0 : 3
  if (field === 'experience') g.experience = f.experience >= 1 ? 0 : 2
  if (field === 'fund') g.fund = f.fund >= 6 ? 1 : 12
  if (field === 'income') g.income = f.income >= 1 ? 0 : 2
  if (field === 'dependents') g.dependents = f.dependents >= 1 ? 0 : 2
  return g
}

export function KycPlay() {
  const [w, setW] = useState(0.82)
  const [c, setC] = useState(0.22)
  const [goal, setGoal] = useState<Goal>('house')
  const [cf, setCf] = useState<Field | null>(null)
  const grid = useRef<SVGSVGElement>(null)
  const drag = useRef(false)

  const f = fields(w, c)
  const s1 = story(f, goal)
  const s2 = cf ? story(flip(f, cf), goal) : null
  const banned = BANNED.filter((b) => s1.join(' ').toLowerCase().includes(b))
  const conflicted = (w > 0.6 && c < 0.4) || (w < 0.4 && c > 0.6)

  const setFromPointer = (e: React.PointerEvent) => {
    const r = grid.current!.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    const pad = 36 / 300
    setW(Math.min(1, Math.max(0, (x - pad) / (1 - 2 * pad))))
    setC(Math.min(1, Math.max(0, 1 - (y - pad) / (1 - 2 * pad))))
  }
  const P = (v: number) => 36 + v * 228

  return (
    <div className="xp" data-keys>
      <div className="xp-head">
        <span>
          <b>Explorable</b> · build a client
        </span>
        <span className="xp-tag">illustrates the method · no model outputs</span>
      </div>
      <div className="xp-body xp-kyc">
        <div>
          <svg
            ref={grid}
            viewBox="0 0 300 300"
            className="xp-svg xp-grid"
            onPointerDown={(e) => {
              drag.current = true
              ;(e.target as Element).setPointerCapture?.(e.pointerId)
              setFromPointer(e)
            }}
            onPointerMove={(e) => drag.current && setFromPointer(e)}
            onPointerUp={() => (drag.current = false)}
          >
            <rect x={P(0.6)} y={P(1) - 228 + 228 * 0.6} width={228 * 0.4} height={228 * 0.4} className="xp-conflict" />
            <rect x={P(0)} y={P(0) - 0 + 0} width={228 * 0.4} height={228 * 0.4} className="xp-conflict" />
            {Array.from({ length: 6 }, (_, k) => (
              <g key={k}>
                <line x1={P(k / 5)} x2={P(k / 5)} y1={36} y2={264} className="xp-gridline" />
                <line x1={36} x2={264} y1={36 + (228 * k) / 5} y2={36 + (228 * k) / 5} className="xp-gridline" />
              </g>
            ))}
            <text x={150} y={292} textAnchor="middle" className="xp-tick xp-red">
              willingness →
            </text>
            <text x={16} y={150} textAnchor="middle" className="xp-tick xp-blue" transform="rotate(-90 16 150)">
              capacity →
            </text>
            <circle cx={P(w)} cy={300 - P(c)} r={16} className="xp-client-halo" />
            <circle cx={P(w)} cy={300 - P(c)} r={9} className="xp-client" />
          </svg>
          <p className="xp-note">Drag the client. Shaded corners are conflicted: willingness and capacity point opposite ways.</p>
          <div className="xp-seg xp-goals">
            {(Object.keys(GOALS) as Goal[]).map((g) => (
              <button type="button" key={g} className={goal === g ? 'on' : ''} onClick={() => setGoal(g)}>
                {GOALS[g].label}
              </button>
            ))}
          </div>
        </div>
        <div className="xp-right">
          <div className="xp-scores">
            <span>
              willingness <b className="xp-red">{w.toFixed(2)}</b>
            </span>
            <span>
              capacity <b className="xp-blue">{c.toFixed(2)}</b>
            </span>
            <span>
              goal <b>{GOALS[goal].label}</b>
            </span>
            {conflicted && <span className="xp-badge">conflicted</span>}
          </div>
          <div className="xp-twins">
            <div className="xp-profile">
              <p className="xp-k">explicit card</p>
              {[
                ['crash reaction', ['sold all', 'sold half', 'held', 'bought more'][f.drawdown]],
                ['experience', ['none', 'a few years', '10+ years'][f.experience]],
                ['emergency fund', `${f.fund} months`],
                ['income', ['variable', 'steady', 'very stable'][f.income]],
                ['dependents', ['two kids', 'a parent', 'none'][f.dependents]],
              ].map(([k, v]) => (
                <p key={k} className="xp-field">
                  <span>{k}</span>
                  {v}
                </p>
              ))}
            </div>
            <div className="xp-story">
              <p className="xp-k">
                implicit twin <span className={banned.length ? 'xp-bad' : 'xp-ok'}>{banned.length ? `banned: ${banned.join(', ')}` : '0 risk words ✓'}</span>
              </p>
              <p className="xp-prose">
                {s1.map((sent, i) => (
                  <span key={i} className={s2 && s2[i] !== sent ? 'xp-old' : ''}>
                    {sent}{' '}
                  </span>
                ))}
              </p>
            </div>
          </div>
          <div className="xp-cf">
            <p className="xp-k">make a counterfactual pair: change exactly one field</p>
            <div className="xp-seg">
              {(Object.keys(FIELD_LABEL) as Field[]).map((k) => (
                <button type="button" key={k} className={cf === k ? 'on' : ''} onClick={() => setCf(cf === k ? null : k)}>
                  {FIELD_LABEL[k]}
                </button>
              ))}
            </div>
            {s2 && (
              <p className="xp-prose xp-twin2">
                {s2.map((sent, i) => (
                  <span key={i} className={sent !== s1[i] ? 'xp-new' : 'xp-same'}>
                    {sent}{' '}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
