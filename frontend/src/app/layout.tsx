/**
 * Root Layout for the Application
 * Wraps all pages with AuthProvider to enable authentication context
 * 
 * See: AuthProvider in src/lib/auth.tsx
 * See: DECISIONS.md #5 (Frontend Authentication State)
 */

import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth'
import './globals.css'

export const metadata: Metadata = {
  title: 'Community Space Sharing Platform',
  description: 'Share and discover spaces in your community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
