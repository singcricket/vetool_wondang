'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updateMsComment } from '@/lib/services/monitoring/update-ms'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { EditIcon, FileTextIcon, SaveIcon, XIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

type Props = {
  msData: MsWithPatientWithWeight
}

type Mode = 'collapsed' | 'view' | 'edit'

export default function MsVetComment({ msData }: Props) {
  const [mode, setMode] = useState<Mode>('collapsed')
  const [comment, setComment] = useState(msData.memo_etc ?? '')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setComment(msData.memo_etc ?? '')
  }, [msData.memo_etc])

  const handleSave = async () => {
    if (comment === msData.memo_etc) {
      setMode('view')
      return
    }

    setIsSaving(true)
    try {
      const success = await updateMsComment(msData.session_id, comment)

      if (success) {
        toast.success('코멘트가 저장되었습니다.')
        setMode('view')
      } else {
        toast.error('저장에 실패했습니다.')
      }
    } catch (error) {
      console.error(error)
      toast.error('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setComment(msData.memo_etc ?? '')
    setMode('view')
  }

  // ─── 1. 편집 모드 ───
  if (mode === 'edit') {
    return (
      <div className="flex flex-col gap-2 rounded-md border bg-card p-2 shadow-sm">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Edit Comment</span>
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="수의사 코멘트를 입력하세요..."
          className="min-h-[120px] resize-none text-xs leading-relaxed"
          autoFocus
        />
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 text-xs"
          >
            <XIcon className="mr-1 h-3.5 w-3.5" />
            취소
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 text-xs font-semibold px-4"
          >
            {isSaving ? (
              '저장 중...'
            ) : (
              <>
                <SaveIcon className="mr-1 h-3.5 w-3.5" />
                저장
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ─── 2. 내용 보기 모드 (Expanded View) ───
  if (mode === 'view') {
    return (
      <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3 shadow-sm transition-all duration-200">
        <div className="flex items-center justify-between border-b pb-2 mb-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileTextIcon className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Veterinary Comment</span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-background"
              onClick={() => setMode('edit')}
            >
              <EditIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-background"
              onClick={() => setMode('collapsed')}
            >
              <ChevronUpIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="text-xs leading-relaxed text-foreground min-h-[40px]">
          {msData.memo_etc ? (
            <p className="whitespace-pre-wrap">{msData.memo_etc}</p>
          ) : (
            <p className="italic text-muted-foreground opacity-70">등록된 코멘트가 없습니다.</p>
          )}
        </div>
      </div>
    )
  }

  // ─── 3. 일반 버튼 모드 (Collapsed) ───
  return (
    <Button
      variant="outline"
      className="group h-9 w-full justify-between border-dashed bg-background/50 px-3 transition-colors hover:bg-muted/50"
      onClick={() => setMode('view')}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <FileTextIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="truncate text-xs font-medium">
          {msData.memo_etc ? (
            msData.memo_etc.split('\n')[0]
          ) : (
            "수의사 코멘트"
          )}
        </span>
      </div>
      <div className="flex items-center gap-2">
         {msData.memo_etc && (
           <span className="hidden sm:inline text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
             {msData.memo_etc.length}자
           </span>
         )}
         <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </Button>
  )
}