import { Toaster } from '@/components/ui/sonner'
import { createClient } from '@/lib/supabase/server'

import type { Metadata } from 'next'
import './globals.css'

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://vetool-wondang.vercel.app'
).replace(/['"]/g, '')

export async function generateMetadata(): Promise<Metadata> {
  let titleTitle = 'VETOOL'

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: userData } = await supabase.from('users').select('hos_id').eq('user_id', user.id).single()
      if (userData?.hos_id) {
        const { data: hosData } = await supabase.from('hospitals').select('name').eq('hos_id', userData.hos_id).single()
        if (hosData?.name) {
          titleTitle = `${hosData.name} - VETOOL`
        }
      }
    }
  } catch (error) {
    // 세션이 없거나 DB 에러 시 기본 타이틀 유지
  }

  return {
    metadataBase: new URL(APP_URL),
    title: titleTitle,
    description: '동물병원 전문차트 서비스',
    openGraph: {
      siteName: titleTitle,
      title: titleTitle,
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
      title: titleTitle,
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
