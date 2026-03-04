'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LargeLoaderCircle from './large-loader-circle'

export default function ClientRedirect({ to }: { to: string }) {
  const router = useRouter()

  useEffect(() => {
    router.replace(to as any)
  }, [to, router])

  return <LargeLoaderCircle className="min-h-screen" />
}
