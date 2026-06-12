'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { PlusIcon, Trash2Icon, FlaskConicalIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDownIcon } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { getLabResults, deleteLabResult, type LabResult } from '@/lib/actions/icu/lab-result-actions'
import { FileTextIcon } from 'lucide-react'
import AddLabResultDialog from './add-lab-result-dialog'

const PANEL_LABELS: Record<string, string> = {
  cbc: 'CBC',
  chem: '혈청화학',
  ua: '소변검사',
  coag: '응고검사',
  other: '기타',
}

const PANEL_COLORS: Record<string, string> = {
  cbc: 'bg-blue-100 text-blue-700',
  chem: 'bg-green-100 text-green-700',
  ua: 'bg-yellow-100 text-yellow-700',
  coag: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-600',
}

interface Props {
  hosId: string
  icuIoId: string
  icuChartId: string
}

export default function LabResultSection({ hosId, icuIoId, icuChartId }: Props) {
  const [results, setResults] = useState<LabResult[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLabResults(icuIoId)
      setResults(data)
    } catch {
      toast.error('검사결과 불러오기 실패')
    } finally {
      setLoading(false)
    }
  }, [icuIoId])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    try {
      await deleteLabResult(id)
      setResults((prev) => prev.filter((r) => r.id !== id))
      toast.success('삭제되었습니다.')
    } catch {
      toast.error('삭제 실패')
    }
  }

  const handleAdded = () => {
    setAddOpen(false)
    load()
  }

  return (
    <div className="flex h-full flex-col pt-3">
      <div className="flex items-center justify-between pb-3">
        <span className="text-sm font-medium text-muted-foreground">
          총 {results.length}건
        </span>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setAddOpen(true)}>
          <PlusIcon size={12} />
          검사결과 추가
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <FlaskConicalIcon size={32} strokeWidth={1.2} />
            <p className="text-sm">등록된 검사결과가 없습니다</p>
            <Button size="sm" variant="outline" className="mt-1 text-xs" onClick={() => setAddOpen(true)}>
              <PlusIcon size={12} className="mr-1" />
              첫 결과 추가
            </Button>
          </div>
        ) : (
          <div className="space-y-2 pr-1">
            {results.map((r) => (
              <LabResultCard key={r.id} result={r} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </ScrollArea>

      <AddLabResultDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        hosId={hosId}
        icuIoId={icuIoId}
        icuChartId={icuChartId}
        onAdded={handleAdded}
      />
    </div>
  )
}

function LabResultCard({
  result,
  onDelete,
}: {
  result: LabResult
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const entries = Object.entries(result.items ?? {})
  const dateLabel = result.tested_at
    ? format(new Date(result.tested_at), 'MM/dd HH:mm', { locale: ko })
    : format(new Date(result.created_at), 'MM/dd 등록', { locale: ko })

  return (
    <div className="rounded-md border bg-white">
      <div
        className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted/40"
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${PANEL_COLORS[result.panel_type] ?? PANEL_COLORS.other}`}
        >
          {PANEL_LABELS[result.panel_type] ?? result.panel_type}
        </span>
        <span className="text-xs text-muted-foreground">{dateLabel}</span>
        {result.source_type === 'ocr' && (
          <Badge variant="outline" className="h-4 px-1 text-[10px]">OCR</Badge>
        )}
        {result.source_type === 'pdf' && (
          <Badge variant="outline" className="h-4 border-red-200 bg-red-50 px-1 text-[10px] text-red-600">PDF</Badge>
        )}
        <ChevronDownIcon
          size={14}
          className={`ml-auto text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {open && (
        <div className="border-t px-3 py-2">
          {/* 임상 요약 */}
          {result.clinical_summary && (
            <div className="mb-2.5 rounded bg-blue-50 px-2.5 py-2">
              <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-blue-700">
                <FileTextIcon size={10} />
                임상 요약
              </div>
              <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700">
                {result.clinical_summary}
              </p>
            </div>
          )}

          {/* 검사 수치 */}
          {entries.length > 0 && (
            <div className="mb-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
              {entries.map(([key, val]) => (
                <div key={key} className="flex items-baseline gap-1">
                  <span className="min-w-[56px] text-[11px] font-medium text-muted-foreground">{key}</span>
                  <span className="text-xs">{val}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 gap-1 text-[11px] text-destructive hover:text-destructive">
                  <Trash2Icon size={11} />
                  삭제
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>검사결과 삭제</AlertDialogTitle>
                  <AlertDialogDescription>이 검사결과를 삭제하시겠습니까? 되돌릴 수 없습니다.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={() => onDelete(result.id)}
                  >
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  )
}
