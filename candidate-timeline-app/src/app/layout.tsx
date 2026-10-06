import type { Metadata, Viewport } from 'next'
import { I18nProvider } from '@/i18n'
import './globals.css'

export const metadata: Metadata = {
  title: 'Germany Nursing Profile',
  description: 'Build your education and work timeline – simple, guided and checked.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d7a6b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}
