'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

const ep = (name: string) =>
  dynamic(() => import('./episodes/bundles').then((m) => (m as unknown as Record<string, ComponentType>)[name]), { ssr: false })

const fig = (name: string) =>
  dynamic(() => import('./abstracts/bundles').then((m) => (m as unknown as Record<string, ComponentType>)[name]), { ssr: false })

const play = (name: string) =>
  dynamic(() => import('./explorables/bundles').then((m) => (m as unknown as Record<string, ComponentType>)[name]), { ssr: false })

/** Research explainers (options 11–19), keyed by option slug. */
export const EXPLAINERS: Record<string, ComponentType> = {
  'episode-steer': ep('EpisodeSteer'),
  'episode-audit': ep('EpisodeAudit'),
  'episode-kyc': ep('EpisodeKyc'),
  'figure-steer': fig('SteerFigure'),
  'figure-audit': fig('AuditFigure'),
  'figure-kyc': fig('KycFigure'),
  'play-steer': play('SteerPlay'),
  'play-audit': play('AuditPlay'),
  'play-kyc': play('KycPlay'),
}

const concept = (name: string) =>
  dynamic(() => import('./concepts/bundles').then((m) => (m as unknown as Record<string, ComponentType>)[name]), { ssr: false })

/** Full-site concepts (options 20–23). */
export const CONCEPTS: Record<string, ComponentType> = {
  'channel-shlok': concept('ChannelShlok'),
  'forward-pass': concept('ForwardPass'),
  'field-notes': concept('FieldNotes'),
  observatory: concept('Observatory'),
}

/** Poster thumbnails for the lab index (non-background options). */
export const POSTERS: Record<string, ComponentType> = {
  'episode-steer': ep('PosterSteer'),
  'episode-audit': ep('PosterAudit'),
  'episode-kyc': ep('PosterKyc'),
}
