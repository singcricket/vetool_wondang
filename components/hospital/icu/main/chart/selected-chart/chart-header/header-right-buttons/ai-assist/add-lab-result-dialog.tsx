'use client'

import {
  useRef, useState, useEffect, useCallback,
  type Dispatch, type SetStateAction,
} from 'react'
import { PlusIcon, Trash2Icon, Upload, ClipboardPaste, Loader2, X, ChevronDownIcon, FileTextIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  extractLabResultFromFile,
  checkDuplicatePanels,
  saveMultipleLabResults,
  saveLabResult,
  type ExtractedLabResult,
  type ExtractedLabPanel,
  type DuplicateCheckResult,
} from '@/lib/actions/icu/lab-result-actions'

const PANEL_OPTIONS = [
  { value: 'cbc', label: 'CBC (전혈구)' },
  { value: 'chem', label: '혈청화학' },
  { value: 'ua', label: '소변검사' },
  { value: 'coag', label: '응고검사' },
  { value: 'other', label: '기타' },
]

const PANEL_LABELS: Record<string, string> = {
  cbc: 'CBC',
  chem: '혈청화학',
  ua: '소변검사',
  coag: '응고검사',
  other: '기타',
}

type ItemRow = { key: string; value: string }

type PanelDraft = {
  panel_type: string
  tested_at: string
  rows: ItemRow[]
  expanded: boolean
  isDuplicate?: boolean     // DB에 같은 날짜+타입 존재
  overwrite?: boolean       // 덮어쓰기 여부 (기본 false = skip)
  existingId?: string
}

interface Props {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  hosId: string
  icuIoId: string
  icuChartId: string
  onAdded: () => void
}

export default function AddLabResultDialog({
  open,
  onOpenChange,
  hosId,
  icuIoId,
  icuChartId,
  onAdded,
}: Props) {
  const [tab, setTab] = useState<'ocr' | 'manual'>('ocr')
  const handleClose = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[580px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>검사결과 추가</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'ocr' | 'manual')} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="w-full shrink-0">
            <TabsTrigger value="ocr" className="w-full text-xs">이미지 / PDF 분석</TabsTrigger>
            <TabsTrigger value="manual" className="w-full text-xs">직접 입력</TabsTrigger>
          </TabsList>

          <TabsContent value="ocr" className="mt-3 flex min-h-0 flex-1 flex-col">
            <OcrTab
              hosId={hosId}
              icuIoId={icuIoId}
              icuChartId={icuChartId}
              onAdded={onAdded}
              onClose={handleClose}
            />
          </TabsContent>

          <TabsContent value="manual" className="mt-3 flex min-h-0 flex-1 flex-col">
            <ManualTab
              hosId={hosId}
              icuIoId={icuIoId}
              icuChartId={icuChartId}
              onAdded={onAdded}
              onClose={handleClose}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ── OCR 탭 ────────────────────────────────────────────────────

type OcrStep = 'idle' | 'analyzing' | 'review'
type FileState = { base64: string; mediaType: string; name: string } | null

function OcrTab({
  hosId,
  icuIoId,
  icuChartId,
  onAdded,
  onClose,
}: {
  hosId: string
  icuIoId: string
  icuChartId: string
  onAdded: () => void
  onClose: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<OcrStep>('idle')
  const [fileState, setFileState] = useState<FileState>(null)
  const [extracted, setExtracted] = useState<ExtractedLabResult | null>(null)
  const [panels, setPanels] = useState<PanelDraft[]>([])
  const [clinicalSummary, setClinicalSummary] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const analyze = useCallback(async (base64: string, mediaType: string, name: string) => {
    setStep('analyzing')
    setFileState({ base64, mediaType, name })
    try {
      const result = await extractLabResultFromFile({ base64, mediaType, hosId })
      setExtracted(result)
      setClinicalSummary(result.clinical_summary ?? '')

      if (result.lab_panels.length > 0) {
        const drafts: PanelDraft[] = result.lab_panels.map((p, i) => ({
          panel_type: p.panel_type,
          tested_at: p.tested_at ? p.tested_at.slice(0, 16) : '',
          rows: Object.entries(p.items).map(([key, value]) => ({ key, value })),
          expanded: i === 0,
        }))

        // 중복 체크
        const dupResults = await checkDuplicatePanels({
          icuIoId,
          panels: drafts.map((d) => ({
            panelType: d.panel_type,
            testedAt: d.tested_at ? new Date(d.tested_at).toISOString() : null,
          })),
        })
        dupResults.forEach((dup, i) => {
          drafts[i].isDuplicate = dup.isDuplicate
          drafts[i].existingId = dup.existingId
          drafts[i].overwrite = false
        })

        setPanels(drafts)
      } else {
        setPanels([])
      }

      setStep('review')
    } catch (e: any) {
      toast.error(e?.message ?? '파일 분석 실패')
      setStep('idle')
      setFileState(null)
    }
  }, [hosId, icuIoId])

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      analyze(base64, file.type, file.name)
    }
    reader.readAsDataURL(file)
  }

  const isAcceptedFile = (file: File) =>
    file.type.startsWith('image/') || file.type === 'application/pdf'

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && isAcceptedFile(file)) handleFile(file)
  }

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(
        (i) => i.type.startsWith('image/'),
      )
      if (item) {
        const file = item.getAsFile()
        if (file) handleFile(file)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!fileState) return
    setSaving(true)
    try {
      const sourceType = fileState.mediaType === 'application/pdf' ? 'pdf' : 'ocr'
      const hasPanels = panels.some((p) => p.rows.some((r) => r.key.trim()))

      if (hasPanels) {
        const result = await saveMultipleLabResults({
          icuIoId,
          icuChartId,
          hosId,
          panels: panels
            .filter((p) => p.rows.some((r) => r.key.trim()))
            .map((p) => ({
              panelType: p.panel_type,
              items: Object.fromEntries(p.rows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value])),
              testedAt: p.tested_at ? new Date(p.tested_at).toISOString() : null,
              overwrite: p.overwrite ?? false,
            })),
          clinicalSummary: clinicalSummary.trim() || null,
          rawText: extracted?.raw_text,
          sourceType,
        })
        const msg = [
          result.savedIds.length > 0 && `${result.savedIds.length}건 저장`,
          result.overwrittenCount > 0 && `${result.overwrittenCount}건 덮어씀`,
          result.skippedCount > 0 && `${result.skippedCount}건 중복 건너뜀`,
        ].filter(Boolean).join(', ')
        toast.success(`분석 결과 저장 완료 (${msg})`)
      } else if (clinicalSummary.trim()) {
        // 임상 요약만 있는 경우 — panel_type: 'other', items: {} 로 저장
        await saveLabResult({
          icuIoId,
          icuChartId,
          hosId,
          panelType: 'other',
          items: {},
          clinicalSummary: clinicalSummary.trim(),
          rawText: extracted?.raw_text,
          sourceType,
          testedAt: null,
        })
      } else {
        toast.error('저장할 검사 항목 또는 임상 요약이 없습니다.')
        return
      }

      toast.success('분석 결과가 저장되었습니다.')
      onAdded()
    } catch {
      toast.error('저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setStep('idle')
    setFileState(null)
    setExtracted(null)
    setPanels([])
    setClinicalSummary('')
  }

  const updatePanel = (idx: number, patch: Partial<PanelDraft>) => {
    setPanels((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)))
  }

  if (step === 'idle') {
    return (
      <div
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 py-10 transition hover:border-muted-foreground/60"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={28} strokeWidth={1.4} className="text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">검사결과지 / 진료차트 업로드</p>
          <p className="mt-0.5 text-xs text-muted-foreground">이미지 또는 PDF — 클릭, 드래그앤드롭, Ctrl+V</p>
          <p className="mt-1 text-[11px] text-muted-foreground/70">혈액검사 수치와 임상 정보를 자동으로 분리하여 추출합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}>
            <Upload size={12} /> 파일 선택
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={(e) => e.stopPropagation()}>
            <ClipboardPaste size={12} /> 붙여넣기
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>
    )
  }

  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {fileState?.mediaType === 'application/pdf' ? 'PDF 분석 중...' : '이미지 분석 중...'}
        </p>
        <p className="text-xs text-muted-foreground/70">검사 수치와 임상 정보를 추출하고 있습니다</p>
      </div>
    )
  }

  const isPdf = fileState?.mediaType === 'application/pdf'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 pr-1">
          {/* 파일 표시 */}
          <div className="relative">
            {isPdf ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-600">PDF</span>
                <span className="flex-1 truncate text-xs text-muted-foreground">{fileState?.name}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={reset}>
                  <X size={12} />
                </Button>
              </div>
            ) : (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${fileState?.mediaType};base64,${fileState?.base64}`}
                  alt="업로드 이미지"
                  className="max-h-28 w-full rounded-md border object-contain"
                />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-6 w-6" onClick={reset}>
                  <X size={12} />
                </Button>
              </div>
            )}
          </div>

          {/* 임상 요약 */}
          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
              <FileTextIcon size={11} />
              임상 요약
              <span className="font-normal text-blue-500">(문진·신체검사·이력 등)</span>
            </div>
            <Textarea
              value={clinicalSummary}
              onChange={(e) => setClinicalSummary(e.target.value)}
              placeholder="AI가 추출한 임상 정보가 없습니다. 직접 입력할 수 있습니다."
              className="min-h-[72px] resize-none bg-white text-xs"
              rows={3}
            />
          </div>

          {/* 혈액검사 패널 목록 */}
          {panels.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-medium text-muted-foreground">검사 패널 ({panels.length}개)</p>
                {panels.some((p) => p.isDuplicate) && (
                  <span className="text-[10px] text-amber-600">
                    ⚠ 이미 등록된 날짜 포함 — 기본적으로 건너뜁니다
                  </span>
                )}
              </div>
              {panels.map((panel, idx) => (
                <div
                  key={idx}
                  className={`rounded-md border bg-white ${panel.isDuplicate && !panel.overwrite ? 'opacity-60' : ''}`}
                >
                  <div
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted/30"
                    onClick={() => updatePanel(idx, { expanded: !panel.expanded })}
                  >
                    <Select
                      value={panel.panel_type}
                      onValueChange={(v) => updatePanel(idx, { panel_type: v })}
                    >
                      <SelectTrigger
                        className="h-6 w-28 shrink-0 text-[11px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PANEL_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="datetime-local"
                      value={panel.tested_at}
                      onChange={(e) => updatePanel(idx, { tested_at: e.target.value })}
                      className="h-6 flex-1 text-[11px]"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {panel.isDuplicate ? (
                      <button
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                          panel.overwrite
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          updatePanel(idx, { overwrite: !panel.overwrite })
                        }}
                        title={panel.overwrite ? '클릭하면 건너뜀으로 변경' : '클릭하면 덮어쓰기로 변경'}
                      >
                        {panel.overwrite ? '덮어쓰기' : '이미 등록됨'}
                      </button>
                    ) : (
                      <span className="shrink-0 text-[11px] text-muted-foreground">{panel.rows.filter(r => r.key.trim()).length}항목</span>
                    )}
                    <ChevronDownIcon
                      size={13}
                      className={`shrink-0 text-muted-foreground transition-transform ${panel.expanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {panel.expanded && (
                    <div className="border-t px-3 pb-2 pt-2">
                      <ItemEditor
                        rows={panel.rows}
                        onChange={(rows) => updatePanel(idx, { rows })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-center">
              <p className="text-xs text-muted-foreground">추출된 혈액검사 수치가 없습니다</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">임상 요약만 저장되거나, 직접 패널을 추가할 수 있습니다</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 저장 버튼 — 스크롤 영역 밖, 항상 하단 고정 */}
      <div className="flex shrink-0 justify-end gap-2 border-t pt-3">
        <Button variant="outline" size="sm" onClick={reset} disabled={saving}>다시 선택</Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || (panels.every(p => !p.rows.some(r => r.key.trim())) && !clinicalSummary.trim())}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : '저장'}
        </Button>
      </div>
    </div>
  )
}

// ── 직접 입력 탭 ──────────────────────────────────────────────

function ManualTab({
  hosId,
  icuIoId,
  icuChartId,
  onAdded,
  onClose,
}: {
  hosId: string
  icuIoId: string
  icuChartId: string
  onAdded: () => void
  onClose: () => void
}) {
  const [panelType, setPanelType] = useState<string>('cbc')
  const [testedAt, setTestedAt] = useState<string>('')
  const [rows, setRows] = useState<ItemRow[]>([{ key: '', value: '' }])
  const [clinicalNote, setClinicalNote] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const validRows = rows.filter((r) => r.key.trim())
    const hasNote = clinicalNote.trim().length > 0

    if (validRows.length === 0 && !hasNote) {
      toast.error('검사 항목 또는 임상 소견을 1개 이상 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      if (validRows.length > 0) {
        await saveLabResult({
          icuIoId,
          icuChartId,
          hosId,
          panelType,
          items: Object.fromEntries(validRows.map((r) => [r.key.trim(), r.value])),
          clinicalSummary: hasNote ? clinicalNote.trim() : null,
          sourceType: 'manual',
          testedAt: testedAt ? new Date(testedAt).toISOString() : null,
        })
      } else {
        // 소견만 있는 경우
        await saveLabResult({
          icuIoId,
          icuChartId,
          hosId,
          panelType: 'other',
          items: {},
          clinicalSummary: clinicalNote.trim(),
          sourceType: 'manual',
          testedAt: null,
        })
      }
      toast.success('저장되었습니다.')
      onAdded()
    } catch {
      toast.error('저장 실패')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 pr-1">
          {/* 임상 소견 */}
          <div>
            <Label className="text-xs">
              임상 소견
              <span className="ml-1 font-normal text-muted-foreground">(주관적·객관적 소견, 경과 등 자유롭게 작성)</span>
            </Label>
            <Textarea
              value={clinicalNote}
              onChange={(e) => setClinicalNote(e.target.value)}
              placeholder="예) 오늘 컨디션은 계속 좋지 않고, 초음파상 복수가 더 늘고 있음. 식욕 없음, BCS 3/9..."
              className="mt-1 min-h-[80px] resize-none text-xs"
              rows={3}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-2 text-[11px] text-muted-foreground">검사 수치 입력 (선택)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">검사 종류</Label>
              <Select value={panelType} onValueChange={setPanelType}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PANEL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">검사 일시</Label>
              <Input
                type="datetime-local"
                value={testedAt}
                onChange={(e) => setTestedAt(e.target.value)}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <ItemEditor rows={rows} onChange={setRows} />
        </div>
      </ScrollArea>

      {/* 저장 버튼 — 스크롤 영역 밖, 항상 하단 고정 */}
      <div className="flex shrink-0 justify-end gap-2 border-t pt-3">
        <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>취소</Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || (rows.every((r) => !r.key.trim()) && !clinicalNote.trim())}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : '저장'}
        </Button>
      </div>
    </div>
  )
}

// ── 공통 항목 에디터 ──────────────────────────────────────────

function ItemEditor({
  rows,
  onChange,
}: {
  rows: ItemRow[]
  onChange: (rows: ItemRow[]) => void
}) {
  const update = (idx: number, field: 'key' | 'value', val: string) => {
    onChange(rows.map((r, i) => (i === idx ? { ...r, [field]: val } : r)))
  }
  const remove = (idx: number) => onChange(rows.filter((_, i) => i !== idx))
  const add = () => onChange([...rows, { key: '', value: '' }])

  return (
    <div>
      <Label className="text-xs">검사 항목</Label>
      <ScrollArea className="mt-1 max-h-44">
        <div className="space-y-1.5 pr-1">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <Input
                value={row.key}
                onChange={(e) => update(idx, 'key', e.target.value)}
                placeholder="항목 (예: WBC)"
                className="h-7 w-28 shrink-0 text-xs"
              />
              <Input
                value={row.value}
                onChange={(e) => update(idx, 'value', e.target.value)}
                placeholder="결과 (예: 12.3 ×10³/μL)"
                className="h-7 flex-1 text-xs"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground"
                onClick={() => remove(idx)}
                disabled={rows.length === 1}
              >
                <Trash2Icon size={12} />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      <Button
        variant="ghost"
        size="sm"
        className="mt-1.5 h-7 gap-1 text-xs text-muted-foreground"
        onClick={add}
      >
        <PlusIcon size={12} />
        항목 추가
      </Button>
    </div>
  )
}
