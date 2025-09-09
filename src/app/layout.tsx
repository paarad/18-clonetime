import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Clonetime - Estimate How Long It Takes to Clone Any Product',
  description: 'Paste any product website and get an instant estimate of how long it would take to rebuild it from scratch. Perfect for developers, indie hackers, and product builders.',
  keywords: ['development time estimation', 'product analysis', 'clone estimation', 'build time calculator'],
  authors: [{ name: 'Clonetime' }],
  openGraph: {
    title: 'Clonetime - Product Clone Time Estimator',
    description: 'Get instant build time estimates for any product website',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800`}
      >
        <div className="flex flex-col min-h-screen">
          <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-slate-900">
                    🔨 Clonetime
                  </h1>
                  <span className="text-sm text-slate-500 hidden sm:inline">
                    How long to rebuild this?
                  </span>
                </div>
                <nav className="flex items-center space-x-4">
                  <a 
                    href="/precedents" 
                    className="text-slate-600 hover:text-slate-900 text-sm font-medium"
                  >
                    Precedents
                  </a>
                </nav>
              </div>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
          
          <footer className="border-t bg-white/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-6">
              <div className="text-center text-sm text-slate-500">
                <p>
                  Built for developers, indie hackers, and product builders.{' '}
                  <a 
                    href="https://github.com/paarad/18-clonetime" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-700 hover:text-slate-900 underline"
                  >
                    Open source
                  </a>
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
