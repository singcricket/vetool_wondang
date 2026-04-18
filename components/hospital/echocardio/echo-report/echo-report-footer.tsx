'use client'

import { useEffect, useState } from 'react'

export default function EchoReportFooter() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="mt-auto hidden pt-8 text-center text-[10px] text-muted-foreground print:block">
      <p>
        © {mounted ? new Date().getFullYear() : '2026'} Hospital Veterinary
        Information System - Echocardiography Report
      </p>
    </div>
  )
}
