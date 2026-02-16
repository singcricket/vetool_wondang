import { Toaster } from '@/components/ui/sonner'

import type { Metadata } from 'next'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vetool-wondang-ppip.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: '신원당동물의료센터-VETOOL',
  description: '동물병원 전문차트 서비스',
  openGraph: {
    siteName: '신원당동물의료센터-VETOOL',
    title: '신원당동물의료센터-VETOOL',
    description: '동물병원 전문차트 서비스',
    url: APP_URL,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'SITE OPENGRAPH IMAGE',
      },
    ],
  },
  keywords: ['동물병원', '전문차트', '수의사', 'VETOOL'],
  twitter: {
    card: 'summary_large_image',
    title: '신원당동물의료센터-VETOOL',
    description: '동물병원 전문차트 서비스',
    images: [
      {
        url: '/opengraph-image.png',
        alt: 'SITE OPENGRAPH IMAGE',
      },
    ],
  },
  authors: [{ name: 'howoo', url: process.env.NEXT_PUBLIC_APP_URL! }],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL!,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}

        <Toaster richColors />
      </body>
    </html>
  )
}
