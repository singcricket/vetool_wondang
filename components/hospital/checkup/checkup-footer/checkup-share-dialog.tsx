'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  ClipboardList, FileBarChart2, Link as LinkIcon,
  Copy, Trash2, Loader2, Globe, CheckCircle2,
} from 'lucide-react'
import { fetchShares, createShare, deleteShare } from '@/lib/services/share/share'
import type { ResourceShare, ShareResourceType } from '@/types/share/share-type'
import { format } from 'date-fns'

type ShareMode = 'inquiry' | 'report'

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  checkupId: string
  hosId: string
  userId?: string | null
}

const MODE_CONFIG: Record<ShareMode, {
  label: string
  icon: React.ReactNode
  desc: string
  color: string
  restrictedData: Record<string, unknown> | null
}> = {
  inquiry: {
    label: '보호자 문진표',
    icon: <ClipboardList size={15} />,
    desc: '보호자가 생활환경·컨디션·병력을 직접 입력하는 페이지',
    color: 'border-teal-300 bg-teal-50 text-teal-700',
    restrictedData: { mode: 'inquiry' },
  },
  report: {
    label: '건강검진 리포트',
    icon: <FileBarChart2 size={15} />,
    desc: '검진 결과를 보호자에게 공유하는 읽기 전용 리포트',
    color: 'border-blue-300 bg-blue-50 text-blue-700',
    restrictedData: { mode: 'report' },
  },
}

export default function CheckupShareDialog({ isOpen, onOpenChange, checkupId, hosId, userId }: Props) {
  const [mode, setMode] = useState<ShareMode>('inquiry')
  const [shares, setShares] = useState<ResourceShare[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [durationDays, setDurationDays] = useState('7')
  const [copied, setCopied] = useState<string | null>(null)

  const cfg = MODE_CONFIG[mode]

  useEffect(() => {
    if (isOpen) loadShares(mode)
  }, [isOpen, mode])

  const loadShares = async (m: ShareMode) => {
    setLoading(true)
    try {
      const all = await fetchShares('checkup', checkupId)
      const modeKey = MODE_CONFIG[m].restrictedData?.mode
      setShares(all.filter((s) => (s.restricted_data as any)?.mode === modeKey))
    } catch {
      toast.error('공유 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleModeChange = (m: ShareMode) => {
    setMode(m)
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const now = new Date()
      let validUntil: string | null = null
      if (durationDays !== 'unlimited') {
        const until = new Date(now)
        until.setDate(until.getDate() + parseInt(durationDays, 10))
        validUntil = until.toISOString()
      }
      await createShare({
        owner_hos_id: hosId,
        owner_user_id: userId ?? null,
        resource_type: 'checkup',
        resource_id: checkupId,
        share_target_type: 'public',
        target_id: null,
        permission_level: mode === 'inquiry' ? 'edit' : 'read',
        valid_from: now.toISOString(),
        valid_until: validUntil,
        restricted_data: cfg.restrictedData,
      })
      toast.success('공유 링크가 생성되었습니다.')
      await loadShares(mode)
    } catch (e: any) {
      toast.error('링크 생성 실패: ' + (e.message ?? ''))
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = (shareId: string) => {
    const url = `${window.location.origin}/shared/${shareId}`
    navigator.clipboard.writeText(url)
    setCopied(shareId)
    toast.success('링크가 복사되었습니다!')
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = async (shareId: string) => {
    if (!confirm('이 공유 링크를 삭제할까요?')) return
    try {
      await deleteShare(shareId)
      setShares((prev) => prev.filter((s) => s.id !== shareId))
      toast.success('삭제되었습니다.')
    } catch {
      toast.error('삭제 실패')
    }
  }

  const activeShares = shares.filter(
    (s) => !s.valid_until || new Date(s.valid_until) >= new Date(),
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="z-[200] max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon size={17} className="text-teal-500" />
            보호자 공유
          </DialogTitle>
        </DialogHeader>

        {/* 탭 선택 */}
        <div className="mt-1 grid grid-cols-2 gap-2">
          {(Object.keys(MODE_CONFIG) as ShareMode[]).map((m) => {
            const c = MODE_CONFIG[m]
            const active = mode === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className={`flex items-start gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                  active ? c.color : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <span className="mt-0.5 shrink-0">{c.icon}</span>
                <div>
                  <p className="text-xs font-bold">{c.label}</p>
                  <p className="mt-0.5 text-[10px] leading-tight opacity-70">{c.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* 활성 링크 목록 */}
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-600">
            활성 링크 ({activeShares.length})
          </p>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : activeShares.length === 0 ? (
            <div className="rounded-lg border bg-slate-50 py-5 text-center text-xs text-slate-400">
              활성화된 공유 링크가 없습니다.
            </div>
          ) : (
            activeShares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Globe size={13} className="shrink-0 text-emerald-500" />
                  <span>
                    {share.valid_until
                      ? `${format(new Date(share.valid_until), 'MM/dd HH:mm')} 만료`
                      : '무제한'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    onClick={() => handleCopy(share.id)}
                  >
                    {copied === share.id
                      ? <CheckCircle2 size={12} className="text-teal-500" />
                      : <Copy size={12} />}
                    복사
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-red-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDelete(share.id)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 새 링크 생성 */}
        <div className="mt-1 flex items-center gap-2 rounded-lg border bg-slate-50 p-3">
          <Select value={durationDays} onValueChange={setDurationDays}>
            <SelectTrigger className="h-8 w-36 bg-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[250]">
              <SelectItem value="1">1일</SelectItem>
              <SelectItem value="3">3일</SelectItem>
              <SelectItem value="7">7일</SelectItem>
              <SelectItem value="30">30일</SelectItem>
              <SelectItem value="unlimited">무제한</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="h-8 flex-1 gap-1.5 bg-teal-600 text-xs hover:bg-teal-700"
          >
            {creating ? <Loader2 size={13} className="animate-spin" /> : <LinkIcon size={13} />}
            새 링크 생성
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
