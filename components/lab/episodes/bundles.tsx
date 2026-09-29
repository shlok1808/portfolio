'use client'

import { EpisodePlayer, EpisodePoster } from './player'
import { STEER } from './steer'
import { AUDIT } from './audit'
import { KYC } from './kyc'

export const EpisodeSteer = () => <EpisodePlayer episode={STEER} />
export const EpisodeAudit = () => <EpisodePlayer episode={AUDIT} />
export const EpisodeKyc = () => <EpisodePlayer episode={KYC} />
export const PosterSteer = () => <EpisodePoster episode={STEER} />
export const PosterAudit = () => <EpisodePoster episode={AUDIT} />
export const PosterKyc = () => <EpisodePoster episode={KYC} />
