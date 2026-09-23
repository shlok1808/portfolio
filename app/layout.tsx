import type { Metadata } from 'next'
import { Newsreader } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SmoothScroll } from '@/components/smooth-scroll'
import './globals.css'

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'shlok channawar',
  description:
    'Shlok Channawar — Applied Data Science at Penn State, working on mechanistic interpretability.',
}

// Runs before first paint so a saved palette/mode never flashes.
// Defaults are moss + dark (the horizon sky) for first-time visitors, regardless of OS theme.
const themeInit = `(function(){var r=document.documentElement,p=null,m=null;try{p=localStorage.getItem('palette');m=localStorage.getItem('mode')}catch(e){}r.setAttribute('data-palette',p||'moss');r.setAttribute('data-mode',m==='light'?'light':'dark')})()`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-palette="moss" data-mode="dark" className={newsreader.variable}>
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
