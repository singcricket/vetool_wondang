'use client'

import { useRef, useState } from 'react'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import { useRouter } from 'next/navigation'
import type { BlogPost } from '@/types/hospital/blog-type'
import BlogViewer, { type ViewAudience } from './blog-viewer'
import BlogExportBar from './blog-export-bar'
import BlogEditorSheet from '../blog-editor/blog-editor-sheet'

interface Props {
  hosId: string
  post: BlogPost
}

const AUDIENCE_TABS: { key: ViewAudience; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'vet', label: '수의사' },
  { key: 'owner', label: '보호자' },
]

export default function BlogDetailClient({ hosId, post }: Props) {
  const router = useRouter()
  const contentRef = useRef<HTMLElement>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [viewAudience, setViewAudience] = useState<ViewAudience>('all')

  return (
    <div className="flex h-full flex-col">
      {/* 상단 내비 */}
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1 text-xs text-slate-500">
          <ArrowLeft size={13} />
          목록
        </Button>

        {/* 대상 독자 전환 탭 */}
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {AUDIENCE_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setViewAudience(key)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                viewAudience === key
                  ? key === 'vet'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : key === 'owner'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)} className="gap-1 text-xs">
          <Pencil size={12} />
          수정
        </Button>
      </div>

      {/* 뷰어 */}
      <div className="flex-1 overflow-y-auto">
        <BlogViewer post={post} contentRef={contentRef} viewAudience={viewAudience} />
      </div>

      {/* 내보내기 바 */}
      <BlogExportBar post={post} contentRef={contentRef} viewAudience={viewAudience} />

      <BlogEditorSheet hosId={hosId} open={editorOpen} onOpenChange={setEditorOpen} post={post} />
    </div>
  )
}
