import type { Metadata } from 'next'
import { Portfolio } from '@/components/v2/portfolio'
import './lab/lab.css'
import '@/components/v2/v2.css'

export const metadata: Metadata = {
  title: 'Shlok Channawar',
  description: 'Shlok Channawar — mechanistic interpretability research at Penn State.',
}

// No web fonts: Georgia for headings and the system sans for text, like a classic academic page.
// .site-fx lets the lab's episode player, figures and lightbox work on the homepage.
export default function Home() {
  return (
    <div className="v2 site-fx">
      <Portfolio />
    </div>
  )
}
