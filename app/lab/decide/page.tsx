import type { Metadata } from 'next'
import { Decide } from '@/components/lab/decide'

export const metadata: Metadata = { title: 'decide — design lab', robots: { index: false } }

export default function DecidePage() {
  return <Decide />
}
