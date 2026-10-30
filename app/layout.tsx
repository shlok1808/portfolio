import type { Metadata } from 'next'
import { Newsreader, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SmoothScroll } from '@/components/smooth-scroll'
import './globals.css'

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
})

// labels in the backgrounds, figures and videos
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--lab-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'shlok channawar',
  description:
    'Shlok Channawar — Applied Data Science at Penn State, working on mechanistic interpretability.',
}

// Runs before first paint so a saved palette/mode never flashes.
// The homepage is cream in light mode and cocoa in dark, and follows the system until a visitor
// picks. Other pages (photography, the design lab) keep the old palettes: moss + dark by default.
const themeInit = `(function(){var r=document.documentElement,p=null,m=null;if(location.pathname==='/'){try{m=localStorage.getItem('v2-mode')}catch(e){}if(m!=='dark'&&m!=='light')m=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';r.setAttribute('data-palette','v2-cream');r.setAttribute('data-mode',m);return}try{p=localStorage.getItem('palette');m=localStorage.getItem('mode')}catch(e){}r.setAttribute('data-palette',p||'moss');r.setAttribute('data-mode',m==='light'?'light':'dark')})()`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-palette="moss" data-mode="dark" className={`${newsreader.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="antialiased">
        {children}
        <SmoothScroll />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
