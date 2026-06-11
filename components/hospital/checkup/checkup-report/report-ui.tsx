'use client'

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

// ssr: false — fabric.js depends on a native canvas binary that can't run on the server
const CheckupImageWithMark = dynamic(
  () =>
    import(
      '@/components/hospital/checkup/checkup-case/checkup-image-uploader/checkup-image-with-mark'
    ),
  { ssr: false },
)

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <div className="h-12 w-2 shrink-0 rounded-full bg-gradient-to-b from-teal-500 to-emerald-400" />
      <h2 className="text-3xl font-black tracking-tight text-slate-800">{children}</h2>
    </div>
  )
}

export function AppendixSection({
  tag,
  title,
  children,
}: {
  tag: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-10 print:break-before-page">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-12 w-2 shrink-0 rounded-full bg-gradient-to-b from-teal-400 to-cyan-400" />
        <span className="rounded-full bg-teal-100 px-3 py-0.5 text-xs font-bold text-teal-700">{tag}</span>
        <h2 className="text-3xl font-black tracking-tight text-slate-800">{title}</h2>
      </div>
      {children}
    </section>
  )
}

/** 섹션 내 중제목 — "계통별 평가", "주요 이상 수치" 등 */
export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-sm font-bold tracking-wide text-slate-600">
      {children}
    </p>
  )
}

/** 이미지 + 하단 메모 (mark 있으면 마킹 합성 렌더링) */
export function ImgWithMemo({
  src,
  alt,
  className,
  memo,
  mark,
}: {
  src: string
  alt: string
  className?: string
  memo?: string | null
  mark?: Record<string, unknown> | null
}) {
  return (
    <div className="flex flex-col gap-1">
      {mark ? (
        <Suspense
          fallback={
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} className={className} />
          }
        >
          <CheckupImageWithMark
            imageUrl={src}
            mark={mark}
            className={className}
            aspectRatio=""
            noHover
          />
        </Suspense>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className={className} />
      )}
      {memo && (
        <p className="px-0.5 text-[11px] leading-snug text-slate-500">{memo}</p>
      )}
    </div>
  )
}
