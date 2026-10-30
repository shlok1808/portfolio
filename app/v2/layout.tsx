import type { Metadata } from 'next'
import '../lab/lab.css'
import './v2.css'

export const metadata: Metadata = {
  title: 'Shlok Channawar',
  description: 'Shlok Channawar — mechanistic interpretability research at Penn State.',
  robots: { index: false, follow: false },
}

// No web fonts: Georgia for headings and the system sans for text, like a classic academic page.
// .site-fx lets the lab's episode player, figures and lightbox work inside the redesign.
export default function V2Layout({ children }: { children: React.ReactNode }) {
  return <div className="v2 site-fx">{children}</div>
}
