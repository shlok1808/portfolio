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

// Runs before first paint so a saved palette/mode/background never flashes.
// Defaults are moss + dark for first-time visitors, regardless of OS theme. On the homepage the
// background defaults to the logit lens; visitors can switch it in the footer.
const themeInit = `(function(){var r=document.documentElement,p=null,m=null,b=null;try{p=localStorage.getItem('palette');m=localStorage.getItem('mode');b=localStorage.getItem('bg')}catch(e){}r.setAttribute('data-palette',p||'moss');r.setAttribute('data-mode',m==='light'?'light':'dark');if(location.pathname==='/'){r.setAttribute('data-bg',['constellation','logit-lens','activations','none'].indexOf(b)>-1?b:'logit-lens')}})()`

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
