'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ShareResourceType, ShareTargetType, ResourceShare } from '@/types/share/share-type'
import { fetchShares, createShare, deleteShare } from '@/lib/services/share/share'
import { resolveShareTargetId } from '@/lib/services/share/share-server'
import { Link as LinkIcon, Trash2 as TrashIcon, Copy as CopyIcon, Globe as GlobeIcon, Building as BuildingIcon, User as UserIcon, Loader2 as Loader2Icon } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  resourceType: ShareResourceType
  resourceId: string
  title: string
  hosId: string
  userId?: string
}

export default function ShareResourceDialog({
  isOpen,
  onOpenChange,
  resourceType,
  resourceId,
  title,
  hosId,
  userId
}: Props) {
  const [shares, setShares] = useState<ResourceShare[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // New Share Form State
  const [targetType, setTargetType] = useState<ShareTargetType>('public')
  const [targetId, setTargetId] = useState('')
  const [durationDays, setDurationDays] = useState('7') // '1', '7', '30', 'unlimited'
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadShares()
    }
  }, [isOpen, resourceId])

  const loadShares = async () => {
    setIsLoading(true)
    try {
      const data = await fetchShares(resourceType, resourceId)
      setShares(data)
    } catch (e) {
      console.error(e)
      toast.error('공유 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateShare = async () => {
    if ((targetType === 'hospital' || targetType === 'user') && !targetId.trim()) {
      toast.error('대상의 ID를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const now = new Date()
      let validUntil: string | null = null

      if (durationDays !== 'unlimited') {
        const until = new Date(now)
        until.setDate(until.getDate() + parseInt(durationDays, 10))
        validUntil = until.toISOString()
      }

      let resolvedTargetId: string | null = null

      if (targetType !== 'public') {
        const resolution = await resolveShareTargetId(targetType, targetId)
        if (resolution.error || !resolution.id) {
          toast.error(resolution.error || '대상을 찾을 수 없습니다.')
          setIsSubmitting(false)
          return
        }
        resolvedTargetId = resolution.id
      }

      await createShare({
        owner_hos_id: hosId,
        owner_user_id: userId || null,
        resource_type: resourceType,
        resource_id: resourceId,
        share_target_type: targetType,
        target_id: resolvedTargetId,
        permission_level: 'read',
        valid_from: now.toISOString(),
        valid_until: validUntil,
      })

      toast.success('새로운 공유 링크가 생성되었습니다.')
      
      // 폼 초기화
      setTargetId('')
      setDurationDays('7')
      
      await loadShares()
    } catch (e: any) {
      console.error(e)
      toast.error('링크생성 실패: ' + (e.message || '알 수 없는 오류'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteShare = async (shareId: string) => {
    if (!confirm('이 공유 링크를 삭제하시겠습니까? 더 이상 접근할 수 없게 됩니다.')) return

    try {
      await deleteShare(shareId)
      toast.success('공유 링크가 삭제되었습니다.')
      setShares(prev => prev.filter(s => s.id !== shareId))
    } catch (e: any) {
      console.error(e)
      toast.error('삭제 실패: ' + (e.message || '알 수 없는 오류'))
    }
  }

  const handleCopyLink = (shareId: string) => {
    const url = `${window.location.origin}/shared/${shareId}`
    navigator.clipboard.writeText(url)
    toast.success('공유 링크가 복사되었습니다!')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon size={18} className="text-blue-500" />
            문서 공유하기
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            대상: <span className="font-semibold text-slate-700">{title}</span>
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-6 mt-4">
          
          {/* 활성화된 공유 링크 목록 */}
          <div className="flex flex-col gap-2">
            <Label className="font-semibold text-slate-700">현재 활성화된 공유 링크 ({shares.length})</Label>
            
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="flex justify-center py-6 text-slate-400">
                  <Loader2Icon className="animate-spin" size={24} />
                </div>
              ) : shares.length === 0 ? (
                <div className="text-center py-6 border rounded-lg bg-slate-50 text-slate-500 text-sm">
                  활성화된 공유 링크가 없습니다.
                </div>
              ) : (
                shares.map(share => {
                  const isExpired = share.valid_until ? new Date(share.valid_until) < new Date() : false
                  
                  return (
                    <div key={share.id} className={`flex items-center justify-between p-3 border rounded-lg shadow-sm ${isExpired ? 'bg-red-50/50 border-red-200 opacity-60' : 'bg-white'}`}>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                          {share.share_target_type === 'public' && <GlobeIcon size={14} className="text-emerald-500" />}
                          {share.share_target_type === 'hospital' && <BuildingIcon size={14} className="text-blue-500" />}
                          {share.share_target_type === 'user' && <UserIcon size={14} className="text-orange-500" />}
                          
                          {share.share_target_type === 'public' ? '전체 공개 링크' : `지정 공유 (${share.target_id})`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {share.valid_until ? `${format(new Date(share.valid_until), 'yyyy-MM-dd HH:mm')} 만료` : '무제한'}
                          {isExpired && <span className="ml-1 font-bold text-red-500">(만료됨)</span>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="outline" size="sm" className="h-8 gap-1 font-semibold" onClick={() => handleCopyLink(share.id)}>
                          <CopyIcon size={13} />
                          복사
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteShare(share.id)}>
                          <TrashIcon size={14} />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="h-px w-full bg-border" />

          {/* 새 링크 생성 폼 */}
          <div className="flex flex-col gap-4 bg-slate-50 border rounded-lg p-4">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1">
              <PlusIcon size={14} />
              새로운 공유 링크 만들기
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">공유 대상</Label>
                <Select value={targetType} onValueChange={(v) => setTargetType(v as ShareTargetType)}>
                  <SelectTrigger className="h-9 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">🌐 링크접속 모두 허용 (Public)</SelectItem>
                    <SelectItem value="hospital">🏥 특정 병원 지정 (이름)</SelectItem>
                    <SelectItem value="user">👤 특정 수의사 지정 (이메일)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">유효 기간</Label>
                <Select value={durationDays} onValueChange={setDurationDays}>
                  <SelectTrigger className="h-9 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1일 동안</SelectItem>
                    <SelectItem value="3">3일 동안</SelectItem>
                    <SelectItem value="7">7일 동안</SelectItem>
                    <SelectItem value="30">30일 동안</SelectItem>
                    <SelectItem value="unlimited">무제한 (만료 없음)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {targetType !== 'public' && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  {targetType === 'hospital' ? '병원 이름 입력' : '수의사 이메일 입력'}
                </Label>
                <Input 
                  value={targetId} 
                  onChange={(e) => setTargetId(e.target.value)} 
                  placeholder={targetType === 'hospital' ? "예) 튼튼동물병원 (일부만 입력해도 자동 검색)" : "예) doctor@vetool.com (또는 고유 UUID)"}
                  className="h-9 bg-white"
                />
              </div>
            )}

            <Button onClick={handleCreateShare} disabled={isSubmitting} className="w-full font-bold">
              {isSubmitting ? (
                <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> 생성 중...</>
              ) : (
                '링크 생성하기'
              )}
            </Button>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PlusIcon({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
