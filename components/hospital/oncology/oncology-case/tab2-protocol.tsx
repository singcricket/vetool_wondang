'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils/utils'
import { createCaseProtocol, deleteCaseProtocol } from '@/lib/actions/oncology/protocol-actions'
import {
  getAiOncologyGuide,
  getAiRescueGuide,
  type AiProtocolOption,
} from '@/lib/actions/oncology/ai-oncology-guide'
import {
  searchProtocolTemplates,
  createManualProtocol,
  saveProtocolAsTemplate,
} from '@/lib/actions/oncology/protocol-template-actions'
import type {
  OncologyCaseProtocolRow,
  OncologyScheduleRow,
} from '@/lib/services/oncology/fetch-oncology-case'
import type { OncologyCaseDetail } from '@/types/hospital/oncology-type'
import Autocomplete from '@/components/common/auto-complete/auto-complete'
import ProtocolEditor from '@/components/hospital/oncology/protocol-editor/protocol-editor'
import { createFullProtocol } from '@/lib/actions/oncology/protocol-template-actions'
import type { ProtocolFormData } from '@/lib/actions/oncology/protocol-template-actions'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  CalendarDays,
  Loader2,
  PlusCircle,
  Sparkles,
  Search,
  PenLine,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  BookmarkPlus,
  Check,
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-slate-100 text-slate-700',
  completed: 'bg-emerald-100 text-emerald-800',
  delayed: 'bg-yellow-100 text-yellow-800',
  reduced: 'bg-orange-100 text-orange-800',
  skipped: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: '예정',
  completed: '완료',
  delayed: '연기',
  reduced: '감량',
  skipped: '건너뜀',
}

const CP_STATUS_LABELS: Record<string, string> = {
  active: '진행 중',
  completed: '완료',
  discontinued: '중단',
  paused: '일시정지',
}

const CP_STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-blue-100 text-blue-800',
  discontinued: 'bg-red-100 text-red-800',
  paused: 'bg-yellow-100 text-yellow-800',
}

const PROTOCOL_TYPES = ['chemo', 'radiation', 'surgery', 'targeted', 'palliative', 'combination']
const PHASES = ['induction', 'maintenance', 'rescue', 'adjuvant', 'palliative']

type AddMode = 'ai' | 'template' | 'manual' | null

function ScheduleTable({ schedules }: { schedules: OncologyScheduleRow[] }) {
  const grouped = schedules.reduce<Record<number, OncologyScheduleRow[]>>((acc, s) => {
    acc[s.cycle_number] = acc[s.cycle_number] ?? []
    acc[s.cycle_number].push(s)
    return acc
  }, {})

  return (
    <div className="space-y-3 mt-3">
      {Object.entries(grouped).map(([cycle, rows]) => (
        <div key={cycle}>
          <div className="text-xs font-semibold text-slate-500 mb-1">사이클 {cycle}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border px-2 py-1 text-left">예정일</th>
                  <th className="border px-2 py-1 text-left">약물</th>
                  <th className="border px-2 py-1 text-left">경로</th>
                  <th className="border px-2 py-1 text-right">계산용량</th>
                  <th className="border px-2 py-1 text-left">단위</th>
                  <th className="border px-2 py-1 text-center">상태</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="border px-2 py-1">{s.scheduled_date}</td>
                    <td className="border px-2 py-1 font-medium">{s.drug_name}</td>
                    <td className="border px-2 py-1 uppercase">{s.drug_route}</td>
                    <td className="border px-2 py-1 text-right">{s.dose_calculated ?? '—'}</td>
                    <td className="border px-2 py-1">{s.dose_unit}</td>
                    <td className="border px-2 py-1 text-center">
                      <span className={cn('px-1.5 py-0.5 rounded text-xs', STATUS_COLORS[s.status] ?? 'bg-slate-100 text-slate-700')}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

function SaveTemplateDialog({
  cp,
  open,
  onClose,
}: {
  cp: OncologyCaseProtocolRow
  open: boolean
  onClose: () => void
}) {
  const [templateName, setTemplateName] = useState(cp.protocol.protocol_name)
  const [tagString, setTagString] = useState(cp.protocol.user_tags ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!templateName.trim()) return toast.error('프로토콜 이름을 입력하세요.')
    setSaving(true)
    try {
      await saveProtocolAsTemplate(cp.protocol_id, templateName, tagString)
      setSaved(true)
      toast.success('라이브러리에 저장되었습니다.')
      setTimeout(() => { setSaved(false); onClose() }, 1200)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkPlus size={16} className="text-rose-500" />
            라이브러리에 저장
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div>
            <Label className="text-xs text-slate-600 mb-1">프로토콜 이름 *</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="예: Canine CHOP UW-25"
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-600 mb-1">태그 (검색 키워드)</Label>
            <Autocomplete
              defaultValue={cp.protocol.user_tags ?? ''}
              handleUpdate={setTagString}
              onInputChange={setTagString}
              placeholder="예: 림프종, CHOP, 개"
            />
            <p className="text-xs text-slate-400 mt-1">키워드는 콤마로 구분 · keywords 테이블 자동 확장 적용</p>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500 space-y-0.5">
            <div><span className="font-medium text-slate-600">프로토콜:</span> {cp.protocol.protocol_name}</div>
            <div><span className="font-medium text-slate-600">종류:</span> {cp.protocol.protocol_type} · {cp.protocol.phase}</div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={saving || saved}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {saved
                ? <><Check size={14} className="mr-1" />저장 완료</>
                : saving
                  ? <><Loader2 size={14} className="mr-2 animate-spin" />저장 중</>
                  : <><BookmarkPlus size={14} className="mr-1" />라이브러리 저장</>
              }
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CaseProtocolCard({ cp, patientName, onDelete }: { cp: OncologyCaseProtocolRow; patientName: string; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const progress = cp.total_doses > 0 ? Math.round((cp.completed_doses / cp.total_doses) * 100) : 0

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteCaseProtocol(cp.id)
      onDelete(cp.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패')
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800">{cp.protocol.protocol_name}</span>
          <span className={cn('text-xs px-2 py-0.5 rounded-full', CP_STATUS_COLORS[cp.status] ?? 'bg-slate-100 text-slate-600')}>
            {CP_STATUS_LABELS[cp.status] ?? cp.status}
          </span>
          <span className="text-xs text-slate-500">시작: {cp.start_date}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-600">
            {cp.completed_doses}/{cp.total_doses} 회 완료 ({progress}%)
          </div>
          <>
            <button
              type="button"
              onClick={() => setSaveTemplateOpen(true)}
              className="text-slate-300 hover:text-rose-500 transition-colors"
              title="라이브러리에 저장"
            >
              <BookmarkPlus size={14} />
            </button>
            <button
              type="button"
              onClick={() => { setDeleteConfirmInput(''); setDeleteOpen(true) }}
              className="text-slate-300 hover:text-red-500 transition-colors"
              title="프로토콜 삭제"
            >
              <Trash2 size={14} />
            </button>
          </>

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600">
                  프로토콜을 케이스에서 삭제하시겠습니까?
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-sm">
                    <p className="font-semibold text-slate-800">{cp.protocol.protocol_name}</p>
                    <div className="rounded-md bg-red-50 border border-red-200 p-3 space-y-1 text-red-700 text-xs">
                      <p>• 이 프로토콜에 연결된 <span className="font-bold">모든 투약 스케줄</span>이 삭제됩니다.</p>
                      <p>• 완료·지연·감량 등 <span className="font-bold">그간의 투약 기록이 모두 사라집니다.</span></p>
                      <p>• 이 작업은 <span className="font-bold">되돌릴 수 없습니다.</span></p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-slate-600">
                        계속하려면 환자 이름 <span className="font-bold text-slate-800">{patientName}</span> 을(를) 입력하세요.
                      </p>
                      <Input
                        value={deleteConfirmInput}
                        onChange={(e) => setDeleteConfirmInput(e.target.value)}
                        placeholder={patientName}
                        className="h-9 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
                  취소
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteConfirmInput !== patientName || deleting}
                  onClick={handleDelete}
                >
                  {deleting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                  삭제
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-slate-400 hover:text-slate-600"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4 text-xs text-slate-600 mb-3">
            <div>초기 체중: <span className="font-medium text-slate-800">{cp.initial_body_weight} kg</span></div>
            <div>연기: <span className="font-medium text-slate-800">{cp.delayed_doses}회</span></div>
            <div>감량: <span className="font-medium text-slate-800">{cp.reduced_doses}회</span></div>
          </div>
          {cp.schedules.length === 0 ? (
            <p className="text-xs text-slate-400">스케줄이 없습니다.</p>
          ) : (
            <ScheduleTable schedules={cp.schedules} />
          )}
        </div>
      )}
      <SaveTemplateDialog cp={cp} open={saveTemplateOpen} onClose={() => setSaveTemplateOpen(false)} />
    </div>
  )
}

// ─── Protocol add form (shared across modes) ─────────────────────────────────

interface AddFormProps {
  protocol: AiProtocolOption
  bodyWeight: string
  startDate: string
  adding: boolean
  onWeightChange: (v: string) => void
  onDateChange: (v: string) => void
  onAdd: () => void
  onCancel: () => void
}

function AddForm({ protocol, bodyWeight, startDate, adding, onWeightChange, onDateChange, onAdd, onCancel }: AddFormProps) {
  return (
    <div className="space-y-3 pt-3 border-t">
      <div className="text-xs font-medium text-slate-700 bg-slate-50 rounded px-3 py-2">
        선택된 프로토콜: <span className="font-semibold text-slate-900">{protocol.protocol_name}</span>
        <span className="ml-2 text-slate-400">({protocol.phase})</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-slate-600 mb-1">체중 (kg)</Label>
          <Input type="number" step="0.1" value={bodyWeight} onChange={(e) => onWeightChange(e.target.value)} placeholder="0.0" className="h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-slate-600 mb-1">시작일</Label>
          <Input type="date" value={startDate} onChange={(e) => onDateChange(e.target.value)} className="h-9 text-sm" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onAdd} disabled={adding} className="bg-rose-600 hover:bg-rose-700 text-white">
          {adding && <Loader2 size={14} className="mr-2 animate-spin" />}
          케이스에 추가
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">취소</Button>
      </div>
    </div>
  )
}

// ─── Template search dialog ───────────────────────────────────────────────────

interface TemplateSearchDialogProps {
  hosId: string
  open: boolean
  onSelect: (p: AiProtocolOption) => void
  onClose: () => void
}

function TemplateSearchDialog({ hosId, open, onSelect, onClose }: TemplateSearchDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AiProtocolOption[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async (value: string) => {
    setQuery(value)
    if (!value.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const found = await searchProtocolTemplates(hosId, value)
      setResults(found)
    } catch {
      toast.error('라이브러리 검색 실패')
    } finally {
      setSearching(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>프로토콜 라이브러리 검색</DialogTitle>
        </DialogHeader>
        <Autocomplete
          label="진단명 또는 약물 키워드"
          defaultValue={query}
          handleUpdate={handleSearch}
          onInputChange={handleSearch}
          placeholder="예: 림프종, CHOP, doxorubicin"
        />
        <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
          {searching && (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin text-slate-400" />
            </div>
          )}
          {!searching && results.length === 0 && query.trim() && (
            <p className="text-xs text-slate-400 text-center py-4">검색 결과가 없습니다.</p>
          )}
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onSelect(p); onClose() }}
              className="w-full text-left px-3 py-2.5 rounded-lg border hover:bg-rose-50 hover:border-rose-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-slate-800">{p.protocol_name}</span>
                <span className="text-xs text-slate-400">{p.phase}</span>
              </div>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-slate-500">{p.protocol_type}</span>
                {p.description && (
                  <span className="text-xs text-slate-400 truncate">{p.description}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Tab2ProtocolProps {
  caseDetail: OncologyCaseDetail
  caseProtocols: OncologyCaseProtocolRow[]
}

export default function Tab2Protocol({ caseDetail, caseProtocols: initialProtocols }: Tab2ProtocolProps) {
  const router = useRouter()

  const [protocols, setProtocols] = useState(initialProtocols)
  const [addMode, setAddMode] = useState<AddMode>(null)
  const [isRescue, setIsRescue] = useState(false)

  // AI mode
  const [availableProtocols, setAvailableProtocols] = useState<AiProtocolOption[]>([])
  const [loadingProtocols, setLoadingProtocols] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState<AiProtocolOption | null>(null)

  // Template mode
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)

  // Manual mode
  const [editorOpen, setEditorOpen] = useState(false)

  // Shared add form
  const [bodyWeight, setBodyWeight] = useState(caseDetail.body_weight?.toString() ?? '')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [adding, setAdding] = useState(false)

  const resetAll = () => {
    setAddMode(null)
    setIsRescue(false)
    setAvailableProtocols([])
    setSelectedProtocol(null)
    setEditorOpen(false)
  }

  const loadAiProtocols = async () => {
    setLoadingProtocols(true)
    setAvailableProtocols([])
    setSelectedProtocol(null)
    try {
      const result = isRescue
        ? await getAiRescueGuide(caseDetail.id)
        : await getAiOncologyGuide(caseDetail.id)
      setAvailableProtocols(result.protocols)
      if (result.protocols.length === 0) toast.info('추천 프로토콜이 없습니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '프로토콜 조회 실패')
    } finally {
      setLoadingProtocols(false)
    }
  }

  const handleAdd = async (protocolId: string) => {
    if (!bodyWeight || isNaN(parseFloat(bodyWeight))) return toast.error('체중을 입력하세요.')
    if (!startDate) return toast.error('시작일을 선택하세요.')

    setAdding(true)
    try {
      await createCaseProtocol(caseDetail.id, protocolId, parseFloat(bodyWeight), startDate)
      toast.success('프로토콜이 추가되었습니다.')
      resetAll()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '프로토콜 추가 실패')
    } finally {
      setAdding(false)
    }
  }

  const handleManualCreate = async (data: ProtocolFormData) => {
    const diagnosisKey = (caseDetail as any).diagnosis_key ?? caseDetail.diagnosis_name.toLowerCase().replace(/\s+/g, '_')
    const protocolId = await createFullProtocol(caseDetail.hos_id, diagnosisKey, data)
    setEditorOpen(false)
    setSelectedProtocol({ ...data, id: protocolId, is_ai_generated: false, is_verified: false, origin_diagnosis: diagnosisKey })
    toast.success('프로토콜이 생성되었습니다. 체중과 시작일을 입력 후 케이스에 추가하세요.')
  }

  return (
    <div className="space-y-6">
      {/* Registered protocols */}
      {protocols.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <CalendarDays size={16} className="text-rose-600" />
            등록된 프로토콜 ({protocols.length}개)
          </h3>
          {protocols.map((cp) => (
            <CaseProtocolCard
              key={cp.id}
              cp={cp}
              patientName={caseDetail.patient.name}
              onDelete={(id) => setProtocols((prev) => prev.filter((p) => p.id !== id))}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <CalendarDays size={40} className="mb-3 opacity-40" />
          <p className="text-sm">등록된 프로토콜이 없습니다.</p>
        </div>
      )}

      {/* Add protocol section */}
      <div className="rounded-lg border border-dashed border-rose-300 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <PlusCircle size={16} className="text-rose-600" />
            프로토콜 추가
          </h3>
          {addMode && (
            <button type="button" onClick={resetAll} className="text-xs text-slate-400 hover:text-slate-600 underline">
              취소
            </button>
          )}
        </div>

        {/* Mode selector */}
        {!addMode && (
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAddMode('ai')}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-4 hover:border-rose-300 hover:bg-rose-50 transition-colors"
            >
              <Sparkles size={18} className="text-rose-500" />
              <span className="text-xs font-medium text-slate-700">AI 추천</span>
              <span className="text-xs text-slate-400">진단 기반 자동 생성</span>
            </button>
            <button
              type="button"
              onClick={() => setAddMode('template')}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-4 hover:border-rose-300 hover:bg-rose-50 transition-colors"
            >
              <Search size={18} className="text-rose-500" />
              <span className="text-xs font-medium text-slate-700">라이브러리 검색</span>
              <span className="text-xs text-slate-400">저장된 프로토콜에서 선택</span>
            </button>
            <button
              type="button"
              onClick={() => setAddMode('manual')}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-4 hover:border-rose-300 hover:bg-rose-50 transition-colors"
            >
              <PenLine size={18} className="text-rose-500" />
              <span className="text-xs font-medium text-slate-700">직접 입력</span>
              <span className="text-xs text-slate-400">수동으로 프로토콜 생성</span>
            </button>
          </div>
        )}

        {/* ── AI mode ── */}
        {addMode === 'ai' && (
          <div className="space-y-3">
            {/* Rescue toggle */}
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <div
                onClick={() => { setIsRescue((v) => !v); setAvailableProtocols([]); setSelectedProtocol(null) }}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer',
                  isRescue ? 'bg-amber-500' : 'bg-slate-200',
                )}
              >
                <span className={cn('pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform', isRescue ? 'translate-x-4' : 'translate-x-0')} />
              </div>
              <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                {isRescue && <AlertTriangle size={12} className="text-amber-500" />}
                {isRescue ? 'Rescue 프로토콜' : '1차 프로토콜'}
              </span>
            </label>

            {availableProtocols.length === 0 ? (
              <Button
                onClick={loadAiProtocols}
                disabled={loadingProtocols}
                variant="outline"
                size="sm"
                className="border-rose-300 text-rose-700 hover:bg-rose-50"
              >
                {loadingProtocols
                  ? <><Loader2 size={14} className="mr-1 animate-spin" />불러오는 중</>
                  : <><Sparkles size={14} className="mr-1" />{isRescue ? 'Rescue 프로토콜 불러오기' : '추천 프로토콜 불러오기'}</>
                }
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">추천 프로토콜 목록에서 선택하세요</p>
                {availableProtocols.filter((p) => !!p.id).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProtocol(p)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg border transition-colors',
                      selectedProtocol?.id === p.id
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-slate-200 hover:border-rose-200 hover:bg-rose-50',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-800">{p.protocol_name}</span>
                      <span className="text-xs text-slate-400">{p.phase}</span>
                    </div>
                    {p.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>}
                  </button>
                ))}
                {availableProtocols.some((p) => !p.id) && (
                  <p className="text-xs text-slate-400">일부 프로토콜은 ID가 없어 표시되지 않습니다. 페이지를 새로고침 해주세요.</p>
                )}
              </div>
            )}

            {selectedProtocol && (
              <AddForm
                protocol={selectedProtocol}
                bodyWeight={bodyWeight}
                startDate={startDate}
                adding={adding}
                onWeightChange={setBodyWeight}
                onDateChange={setStartDate}
                onAdd={() => handleAdd(selectedProtocol.id!)}
                onCancel={resetAll}
              />
            )}
          </div>
        )}

        {/* ── Template mode ── */}
        {addMode === 'template' && (
          <div className="space-y-3">
            <Button
              onClick={() => setTemplateDialogOpen(true)}
              variant="outline"
              size="sm"
              className="border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              <Search size={14} className="mr-1" />
              라이브러리 검색하기
            </Button>
            {selectedProtocol && (
              <AddForm
                protocol={selectedProtocol}
                bodyWeight={bodyWeight}
                startDate={startDate}
                adding={adding}
                onWeightChange={setBodyWeight}
                onDateChange={setStartDate}
                onAdd={() => handleAdd(selectedProtocol.id!)}
                onCancel={resetAll}
              />
            )}
            <TemplateSearchDialog
              hosId={caseDetail.hos_id}
              open={templateDialogOpen}
              onSelect={(p) => { setSelectedProtocol(p); setTemplateDialogOpen(false) }}
              onClose={() => setTemplateDialogOpen(false)}
            />
          </div>
        )}

        {/* ── Manual mode ── */}
        {addMode === 'manual' && (
          <div className="space-y-3">
            <Button
              onClick={() => setEditorOpen(true)}
              variant="outline"
              size="sm"
              className="border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              <PenLine size={14} className="mr-1" />
              프로토콜 에디터 열기
            </Button>
            {selectedProtocol && (
              <AddForm
                protocol={selectedProtocol}
                bodyWeight={bodyWeight}
                startDate={startDate}
                adding={adding}
                onWeightChange={setBodyWeight}
                onDateChange={setStartDate}
                onAdd={() => handleAdd(selectedProtocol.id!)}
                onCancel={resetAll}
              />
            )}
          </div>
        )}

        {/* ── Protocol Editor Sheet ── */}
        <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2">
                <PenLine size={16} className="text-rose-500" />
                프로토콜 직접 작성
              </SheetTitle>
            </SheetHeader>
            <ProtocolEditor
              onSubmit={handleManualCreate}
              onCancel={() => setEditorOpen(false)}
              submitLabel="프로토콜 생성"
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
