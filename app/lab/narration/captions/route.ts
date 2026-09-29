import { STEER } from '@/components/lab/episodes/steer'
import { AUDIT } from '@/components/lab/episodes/audit'
import { KYC } from '@/components/lab/episodes/kyc'
import type { Episode } from '@/components/lab/episodes/engine'

// built once at deploy time; only scripts/lab/narrate.py reads it (narration is off for now)
export const dynamic = 'force-static'

/** Every subtitle with its start time in the episode — input for scripts/lab/narrate.py. */
function lines(ep: Episode) {
  const out: { start: number; html: string }[] = []
  let acc = 0
  for (const sc of ep.scenes) {
    for (const [at, html] of sc.captions) out.push({ start: +(acc + at).toFixed(3), html })
    acc += sc.dur
  }
  return { duration: acc, lines: out }
}

export function GET() {
  return Response.json({ steer: lines(STEER), audit: lines(AUDIT), kyc: lines(KYC) })
}
