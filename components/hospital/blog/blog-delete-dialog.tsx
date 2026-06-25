'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteBlogPost } from '@/lib/actions/blog/blog-actions'
import type { BlogPost } from '@/types/hospital/blog-type'

interface Props {
  hosId: string
  post: BlogPost | undefined
  onClose: () => void
  onDeleted: () => void
}

const CONFIRM_KEYWORDS = ['삭제', '동의']

export default function BlogDeleteDialog({ hosId, post, onClose, onDeleted }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const isConfirmed = CONFIRM_KEYWORDS.includes(input.trim())

  const handleClose = () => {
    setInput('')
    onClose()
  }

  const handleDelete = async () => {
    if (!post || !isConfirmed) return
    setLoading(true)
    try {
      await deleteBlogPost(hosId, post.id)
      toast.success('케이스가 삭제됐습니다.')
      setInput('')
      onDeleted()
    } catch {
      toast.error('삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!post} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 size={16} />
            케이스 삭제
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {post && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-medium text-slate-700 line-clamp-2">{post.title}</p>
              {post.diagnosis && (
                <p className="mt-0.5 text-[11px] text-slate-400">{post.diagnosis}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-slate-600">
              삭제를 확인하려면 아래에 <span className="font-semibold text-red-600">삭제</span> 또는{' '}
              <span className="font-semibold text-red-600">동의</span>를 입력하세요.
            </label>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && isConfirmed) handleDelete() }}
              placeholder="삭제 또는 동의"
              className="text-sm"
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 text-xs"
            >
              취소
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!isConfirmed || loading}
              className="flex-1 bg-red-600 text-xs hover:bg-red-700"
            >
              {loading && <Loader2 size={13} className="mr-1 animate-spin" />}
              삭제
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
