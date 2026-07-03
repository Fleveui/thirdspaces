/**
 * Root Layout for the Application
 * Wraps all pages with AuthProvider to enable authentication context
 */

import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import { AuthProvider } from '@/lib/auth'
import './globals.css'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
})

export const metadata: Metadata = {
  title: 'Match for Space',
  description: 'Share and discover spaces in your community',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.variable} ${ibmPlexSans.className} font-sans`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
