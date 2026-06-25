'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { BLOG_CATEGORIES, STATUS_LABEL, type BlogPost, type BlogPostStatus } from '@/types/hospital/blog-type'
import BlogPostCard from './blog-post-card'
import BlogEditorSheet from './blog-editor/blog-editor-sheet'
import BlogDeleteDialog from './blog-delete-dialog'

interface Props {
  hosId: string
  posts: BlogPost[]
}

const STATUS_FILTERS: { key: BlogPostStatus | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'published', label: STATUS_LABEL.published },
  { key: 'draft', label: STATUS_LABEL.draft },
  { key: 'archived', label: STATUS_LABEL.archived },
]

export default function BlogListClient({ hosId, posts }: Props) {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<BlogPostStatus | 'all'>('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editPost, setEditPost] = useState<BlogPost | undefined>()
  const [deletePost, setDeletePost] = useState<BlogPost | undefined>()
  const router = useRouter()

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return posts.filter((p) => {
      if (categoryFilter !== 'all' && p.case_category !== categoryFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (q && !p.title.toLowerCase().includes(q) && !(p.diagnosis ?? '').toLowerCase().includes(q) && !(p.summary ?? '').toLowerCase().includes(q)) return false
      return true
    })
  }, [posts, query, categoryFilter, statusFilter])

  const openNew = () => { setEditPost(undefined); setEditorOpen(true) }
  const openEdit = (post: BlogPost) => { setEditPost(post); setEditorOpen(true) }

  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        {/* 상단 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제목, 진단명 검색"
              className="pl-8 text-sm"
            />
          </div>
          <Button size="sm" onClick={openNew} className="shrink-0 bg-teal-600 hover:bg-teal-700 gap-1">
            <Plus size={14} />
            새 케이스
          </Button>
        </div>

        {/* 상태 필터 */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={cn(
                'rounded-full border px-3 py-0.5 text-xs transition-colors',
                statusFilter === key
                  ? 'border-teal-500 bg-teal-50 font-semibold text-teal-700'
                  : 'border-slate-200 text-slate-500 hover:border-teal-300',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'rounded-full border px-3 py-0.5 text-xs transition-colors',
              categoryFilter === 'all'
                ? 'border-slate-500 bg-slate-100 font-semibold text-slate-700'
                : 'border-slate-200 text-slate-400 hover:border-slate-300',
            )}
          >
            전체
          </button>
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'rounded-full border px-3 py-0.5 text-xs transition-colors',
                categoryFilter === cat
                  ? 'border-slate-500 bg-slate-100 font-semibold text-slate-700'
                  : 'border-slate-200 text-slate-400 hover:border-slate-300',
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 결과 수 */}
        <p className="text-xs text-slate-400">{filtered.length}개 케이스</p>

        {/* 카드 그리드 */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <p className="text-sm">케이스가 없습니다.</p>
            <Button size="sm" variant="outline" onClick={openNew}>새 케이스 작성</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <div key={post.id} className="relative group">
                <BlogPostCard post={post} hosId={hosId} />
                <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                  <button
                    type="button"
                    onClick={() => openEdit(post)}
                    className="rounded bg-white/90 px-2 py-1 text-[11px] text-slate-600 shadow hover:bg-white"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletePost(post)}
                    className="rounded bg-white/90 p-1 text-slate-400 shadow hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BlogEditorSheet
        hosId={hosId}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        post={editPost}
      />

      <BlogDeleteDialog
        hosId={hosId}
        post={deletePost}
        onClose={() => setDeletePost(undefined)}
        onDeleted={() => { setDeletePost(undefined); router.refresh() }}
      />
    </>
  )
}
