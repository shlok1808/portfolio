import type { Metadata } from 'next'
import { JetBrains_Mono, Caveat, VT323 } from 'next/font/google'
import './lab.css'

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--lab-mono', display: 'swap' })
const hand = Caveat({ subsets: ['latin'], variable: '--lab-hand', display: 'swap' })
const pixel = VT323({ subsets: ['latin'], weight: '400', variable: '--lab-pixel', display: 'swap' })

export const metadata: Metadata = {
  title: 'design lab — shlok channawar',
  description: '23 design options for shlok.space. Preview only.',
  robots: { index: false, follow: false },
}

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <div className={`lab-root ${mono.variable} ${hand.variable} ${pixel.variable}`}>{children}</div>
}
