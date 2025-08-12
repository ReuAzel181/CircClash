import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Circlash! - Circle Battle Arena',
  description: 'The ultimate circle battle game. Fast-paced action, strategic gameplay, and instant fun!',
  keywords: ['game', 'battle', 'circle', 'arena', 'browser game', 'instant play'],
  openGraph: {
    title: 'Circlash! - Circle Battle Arena',
    description: 'The ultimate circle battle game. Fast-paced action, strategic gameplay, and instant fun!',
    url: 'https://circlash.game',
    siteName: 'Circlash!',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Circlash! Game Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Circlash! - Circle Battle Arena',
    description: 'The ultimate circle battle game. Fast-paced action, strategic gameplay, and instant fun!',
    images: ['/og-image.jpg'],
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0ea5e9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen flex flex-col antialiased`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
