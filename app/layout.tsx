import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OpenInApp - Smart Link Redirects',
  description: 'Redirect users to the right app based on their device',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

