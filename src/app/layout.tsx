import '@/lib/env'
import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth'
import './globals.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}

