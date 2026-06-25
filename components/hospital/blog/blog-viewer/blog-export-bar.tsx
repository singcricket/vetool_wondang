'use client'

import { RefObject } from 'react'
import { Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { BlogPost, BlogSection, SectionAudience } from '@/types/hospital/blog-type'
import type { ViewAudience } from './blog-viewer'

interface Props {
  post: BlogPost
  contentRef: RefObject<HTMLElement | null>
  viewAudience: ViewAudience
}

function buildPlainText(post: BlogPost, viewAudience: ViewAudience): string {
  const lines: string[] = []
  lines.push(post.title)
  if (post.diagnosis) lines.push(`진단: ${post.diagnosis}`)
  if (post.summary) lines.push(`\n${post.summary}`)
  lines.push('')

  for (const section of post.content as BlogSection[]) {
    if (section.type === 'image_row') continue
    const a: SectionAudience = section.audience ?? 'both'
    if (viewAudience === 'vet' && a === 'owner') continue
    if (viewAudience === 'owner' && a === 'vet') continue
    if (section.title) lines.push(`[${section.title}]`)
    if (section.body) lines.push(section.body)
    lines.push('')
  }
  return lines.join('\n').trim()
}

export default function BlogExportBar({ post, contentRef, viewAudience }: Props) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPlainText(post, viewAudience))
      toast.success('텍스트가 클립보드에 복사됐습니다.')
    } catch {
      toast.error('복사 실패')
    }
  }

  const handleExportPNG = async () => {
    if (!contentRef.current) return
    toast.loading('이미지 저장 중...', { id: 'blog-png' })
    try {
      const html2canvas = (await import('html2canvas')).default
      const element = contentRef.current
      const height = element.scrollHeight
      let scale = 2
      if (height * scale > 15000) scale = Math.max(1, 15000 / height)

      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      const suffix = viewAudience === 'vet' ? '_수의사' : viewAudience === 'owner' ? '_보호자' : ''
      link.download = `case_${post.title}${suffix}_${new Date(post.created_at).toLocaleDateString('ko-KR')}.png`
      link.href = url
      link.click()
      toast.success('이미지 저장 완료', { id: 'blog-png' })
    } catch {
      toast.error('PNG 저장 실패', { id: 'blog-png' })
    }
  }

  return (
    <div className="flex items-center justify-end gap-2 border-t bg-white px-6 py-3">
      <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
        <Copy size={13} />
        텍스트 복사
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportPNG} className="gap-1.5 text-xs">
        <Download size={13} />
        PNG 저장
      </Button>
    </div>
  )
}
