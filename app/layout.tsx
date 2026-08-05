import { Toaster } from '@/components/ui/sonner'
import './globals.css'

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
