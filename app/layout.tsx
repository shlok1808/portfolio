import type { Metadata } from 'next'
import { Newsreader } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
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

// Runs before first paint so the saved palette/mode never flashes.
const themeInit = `(function(){var r=document.documentElement,p=null,m=null;try{p=localStorage.getItem('palette');m=localStorage.getItem('mode')}catch(e){}if(!p)p='slate';if(!m)m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';r.setAttribute('data-palette',p);r.setAttribute('data-mode',m)})()`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-palette="slate" data-mode="light" className={newsreader.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
