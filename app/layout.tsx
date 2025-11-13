import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TubeAI - YouTube Content Idea Generator',
  description: 'Generate content ideas for your YouTube channel using AI',
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

