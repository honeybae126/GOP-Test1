import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { AuthProvider } from '@/components/providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GOP Automation System | Intercare Hospital',
  description: 'Guarantee of Payment pre-authorisation workflow — Phase 1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
