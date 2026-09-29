'use client'

import { useState } from 'react'

/**
 * 18 · Explorable — be the auditor. Paper numbers only (paper_v3):
 * 30 "refused" → 23 disclose-then-limit, 5 direct, 1 explicit refusal, 1 soft deflection;
 * limiting 0.728 vs text 0.567 (Δ +0.162, Holm p = .006); substantive leak vs appropriate
 * 0.814 vs 0.757 (Δ +0.057, n.s.); Llama descriptive max 0.728 at L11 vs in-fold 0.647.
 */

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
const V = [
  { name: 'disclosed, then hedged', short: 'hedged', cls: 'v-hedge', leaked: true },
  { name: 'disclosed', short: 'leaked', cls: 'v-leak', leaked: true },
  { name: 'refused', short: 'refused', cls: 'v-refuse', leaked: false },
  { name: 'deflected', short: 'deflected', cls: 'v-deflect', leaked: false },
]

const CONTRASTS = {
  limit: { label: 'will it limit a disclosure?', n: 'n = 188', act: 0.728, base: 0.567, delta: '+0.162', ci: '[+0.083, +0.234]', p: 'Holm p = .006', sig: true },
  leak: { label: 'will it leak at all?', n: 'n = 81', act: 0.814, base: 0.757, delta: '+0.057', ci: '[−0.035, +0.147]', p: 'Holm p = .53', sig: false },
}

export function AuditPlay() {
  const [flipped, setFlipped] = useState<boolean[]>(() => Array(30).fill(false))
  const [contrast, setContrast] = useState<'limit' | 'leak'>('leak')
  const [view, setView] = useState<'raw' | 'delta'>('raw')
  const [layerMode, setLayerMode] = useState<'none' | 'peek' | 'infold'>('none')
  const nFlipped = flipped.filter(Boolean).length
  const nLeaked = flipped.reduce((s, f, i) => s + (f && V[VERDICT[i]].leaked ? 1 : 0), 0)
  const allDone = nFlipped === 30
  const c = CONTRASTS[contrast]
  const Y = (v: number) => 100 - ((v - 0.4) / 0.6) * 100

  const flipAll = () => {
    VERDICT.forEach((_, i) =>
      setTimeout(() => setFlipped((f) => (f[i] ? f : f.map((x, k) => (k === i ? true : x)))), i * 70),
    )
  }

  return (
    <div className="xp" data-keys>
      <div className="xp-head">
        <span>
          <b>Explorable</b> · be the auditor
        </span>
        <span className="xp-tag">every number is from the paper</span>
      </div>

      <div className="xp-step">
        <p className="xp-lede">
          <span className="xp-num">1</span> A probe on layer-20 activations predicts the judge’s <q>refused</q> label at{' '}
          <b>AUC 0.89</b>. Here are the 30 answers it called refused. Click to re-annotate each with the evidence-span
          rubric. Did the model keep the secret?
        </p>
        <div className="xp-cards">
          {VERDICT.map((v, i) => (
            <button
              type="button"
              key={i}
              className={`xp-card ${flipped[i] ? `is-flipped ${V[v].cls}` : ''}`}
              onClick={() => setFlipped((f) => f.map((x, k) => (k === i ? true : x)))}
              aria-label={flipped[i] ? `case ${i + 1}: ${V[v].name}` : `case ${i + 1}: re-annotate`}
            >
              <span className="xp-card-front">
                <i>#{String(i + 1).padStart(2, '0')}</i>refused
              </span>
              <span className="xp-card-back">
                <b>{V[v].leaked ? '🔓' : '🔒'}</b>
                {V[v].short}
              </span>
            </button>
          ))}
        </div>
        <div className="xp-row">
          <span className="xp-count">
            re-annotated <b>{nFlipped}</b>/30 · disclosed the protected fact <b className="xp-red">{nLeaked}</b>
          </span>
          {!allDone && (
            <button type="button" className="xp-go" onClick={flipAll}>
              re-annotate all
            </button>
          )}
        </div>
        {allDone && (
          <p className="xp-reveal">
            28 of 30 disclosed. As a predictor of <i>keeping the secret</i>, the old label is at chance:{' '}
            <b>AUC 0.47</b>. The probe was reading the labels, not the model.
          </p>
        )}
      </div>

      <div className={`xp-step ${allDone ? '' : 'is-dim'}`}>
        <p className="xp-lede">
          <span className="xp-num">2</span> So what <i>is</i> decodable before the first token? Compare two questions,
          then switch from raw AUC to the <b>increment over a scenario-text baseline</b>.
        </p>
        <div className="xp-toggles">
          <div className="xp-seg">
            <button type="button" className={contrast === 'leak' ? 'on' : ''} onClick={() => setContrast('leak')}>
              will it leak?
            </button>
            <button type="button" className={contrast === 'limit' ? 'on' : ''} onClick={() => setContrast('limit')}>
              will it limit?
            </button>
          </div>
          <div className="xp-seg">
            <button type="button" className={view === 'raw' ? 'on' : ''} onClick={() => setView('raw')}>
              raw AUC
            </button>
            <button type="button" className={view === 'delta' ? 'on' : ''} onClick={() => setView('delta')}>
              increment Δ
            </button>
          </div>
        </div>
        <div className="xp-bars">
          <div className="xp-bar-wrap">
            <div className="xp-bar is-act" style={{ height: `${100 - Y(c.act)}%` }}>
              <span>{c.act.toFixed(3)}</span>
            </div>
            <em>activations</em>
          </div>
          <div className={`xp-bar-wrap ${view === 'raw' ? 'is-ghost' : ''}`}>
            <div className="xp-bar is-base" style={{ height: `${100 - Y(c.base)}%` }}>
              <span>{c.base.toFixed(3)}</span>
            </div>
            <em>scenario text only</em>
          </div>
          <div className="xp-verdict">
            <p className="xp-q">{c.label}</p>
            <p className="xp-n">{c.n}</p>
            {view === 'raw' ? (
              <p>
                Raw AUC <b>{c.act.toFixed(3)}</b>.{' '}
                {contrast === 'leak' ? 'The highest in the study. Impressive?' : 'Decent, not dazzling.'}
              </p>
            ) : (
              <p>
                Δ = <b className={c.sig ? 'xp-acc' : ''}>{c.delta}</b> {c.ci} · {c.p}.{' '}
                {c.sig
                  ? 'This survives: the model’s own processing makes “will it hedge?” extractable where text readers can’t.'
                  : 'Mostly scenario-predictable. No privileged increment.'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={`xp-step ${allDone ? '' : 'is-dim'}`}>
        <p className="xp-lede">
          <span className="xp-num">3</span> Second model, Llama-3.1-8B-Instruct. Which layer should you read? Try
          the tempting way first.
        </p>
        <div className="xp-toggles">
          <button type="button" className={`xp-go ${layerMode === 'peek' ? 'on' : ''}`} onClick={() => setLayerMode('peek')}>
            pick the best layer on the test set
          </button>
          <button type="button" className={`xp-go ${layerMode === 'infold' ? 'on' : ''}`} onClick={() => setLayerMode('infold')}>
            choose it inside each fold
          </button>
        </div>
        {layerMode !== 'none' && (
          <p className="xp-reveal">
            {layerMode === 'peek' ? (
              <>
                Layer 11 scores <b>0.728</b>, almost exactly Qwen’s number. A complete explanation?
              </>
            ) : (
              <>
                Chosen on training rows only, it’s <b>0.647</b>, and the folds scatter across all five candidate
                layers. The 0.728 was the max of five correlated test-set AUCs: a <b>selection trap</b>.
              </>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
