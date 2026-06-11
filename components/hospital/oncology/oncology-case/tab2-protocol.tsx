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
import { createCaseProtocol, deleteCaseProtocol, updateCaseProtocolStatus, updateCaseProtocolNotes } from '@/lib/actions/oncology/protocol-actions'
import {
  getAiOncologyGuide,
  getAiRescueGuide,
  type AiProtocolOption,
} from '@/lib/actions/oncology/ai-oncology-guide'
import {
  searchProtocolTemplates,
  searchRelatedProtocols,
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
  BookOpen,
  Library,
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

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateCaseProtocolStatus(cp.id, newStatus)
      toast.success('상태가 업데이트되었습니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '상태 업데이트 실패')
    }
  }

  const handleNotesChange = async (newNotes: string) => {
    if (newNotes === (cp.notes ?? '')) return
    try {
      await updateCaseProtocolNotes(cp.id, newNotes)
      toast.success('노트가 저장되었습니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '노트 저장 실패')
    }
  }


  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800">{cp.protocol.protocol_name}</span>
          <Select value={cp.status} onValueChange={handleStatusChange}>
            <SelectTrigger
              className={cn(
                'h-6 w-auto min-w-[80px] border-0 text-xs px-2 py-0.5 rounded-full ring-0 focus:ring-0',
                CP_STATUS_COLORS[cp.status] ?? 'bg-slate-100 text-slate-600',
                '[&>span]:font-medium'
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CP_STATUS_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          
          <div className="mb-4">
            <Label className="text-xs font-semibold text-slate-700 mb-1 block">프로토콜 노트</Label>
            <Textarea
              className="min-h-[60px] text-xs resize-none bg-white"
              placeholder="프로토콜 진행에 관한 참고사항이나 메모를 입력하세요 (포커스 아웃 시 자동 저장)"
              defaultValue={cp.notes ?? ''}
              onBlur={(e) => handleNotesChange(e.target.value)}
            />
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

// ─── Protocol inline preview ─────────────────────────────────────────────────

function ProtocolPreview({ protocol }: { protocol: AiProtocolOption }) {
  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3 text-xs">
      {protocol.description && (
        <p className="text-slate-600 leading-relaxed">{protocol.description}</p>
      )}

      {protocol.drugs && protocol.drugs.length > 0 && (
        <div>
          <p className="font-semibold text-slate-700 mb-1">투약 약물</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white">
                  <th className="border px-2 py-1 text-left font-medium text-slate-600">약물명</th>
                  <th className="border px-2 py-1 text-left font-medium text-slate-600">경로</th>
                  <th className="border px-2 py-1 text-left font-medium text-slate-600">용량</th>
                  <th className="border px-2 py-1 text-left font-medium text-slate-600">단위</th>
                  <th className="border px-2 py-1 text-left font-medium text-slate-600">빈도</th>
                </tr>
              </thead>
              <tbody>
                {protocol.drugs.map((drug, i) => (
                  <tr key={i} className="hover:bg-white">
                    <td className="border px-2 py-1 font-medium">{drug.drug_name}</td>
                    <td className="border px-2 py-1 uppercase">{drug.route}</td>
                    <td className="border px-2 py-1">{drug.dose_value}</td>
                    <td className="border px-2 py-1">{drug.dose_unit}</td>
                    <td className="border px-2 py-1">{drug.frequency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {protocol.adverse_effects && protocol.adverse_effects.length > 0 && (
        <div>
          <p className="font-semibold text-slate-700 mb-1">주요 부작용</p>
          <div className="flex flex-wrap gap-1.5">
            {protocol.adverse_effects.map((ae, i) => (
              <span
                key={i}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded',
                  ae.vcog_grade >= 4 ? 'bg-red-100 text-red-800' :
                  ae.vcog_grade >= 3 ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                )}
              >
                {ae.name} <span className="font-bold">G{ae.vcog_grade}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {protocol.precautions && (
        <div>
          <p className="font-semibold text-slate-700 mb-0.5">주의사항</p>
          <p className="text-slate-600 leading-relaxed">{protocol.precautions}</p>
        </div>
      )}

      {protocol.is_ai_generated && !protocol.is_verified && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded p-2 text-amber-800">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          <span>AI 생성 프로토콜 — 임상 적용 전 전문가 검토 필요</span>
        </div>
      )}
    </div>
  )
}

// ─── Protocol select item (library + search results 공통) ────────────────────

function ProtocolSelectItem({
  protocol: p,
  selected,
  previewOpen,
  onSelect,
  onTogglePreview,
}: {
  protocol: AiProtocolOption
  selected: boolean
  previewOpen: boolean
  onSelect: () => void
  onTogglePreview: () => void
}) {
  return (
    <div className="mb-2">
      <div
        onClick={onSelect}
        className={cn(
          'w-full cursor-pointer px-3 py-2.5 rounded-lg border transition-colors',
          selected
            ? 'border-rose-400 bg-rose-50'
            : 'border-slate-200 hover:border-rose-200 hover:bg-rose-50',
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-slate-800">{p.protocol_name}</span>
            {p.is_ai_generated && !p.is_verified && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">AI</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{p.phase}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onTogglePreview() }}
              className={cn(
                'text-xs px-2 py-0.5 rounded border transition-colors',
                previewOpen
                  ? 'border-rose-300 bg-rose-50 text-rose-600'
                  : 'border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-500',
              )}
            >
              <BookOpen size={11} className="inline mr-0.5" />
              미리보기
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-0.5">
          <span className="text-xs text-slate-500">{p.protocol_type}</span>
          {p.response_rate && (
            <span className="text-xs text-emerald-600">반응률 {Math.round(p.response_rate * 100)}%</span>
          )}
          {p.mst_days && (
            <span className="text-xs text-slate-400">MST {p.mst_days}일</span>
          )}
          {p.description && (
            <span className="text-xs text-slate-400 truncate">{p.description}</span>
          )}
        </div>
      </div>
      {previewOpen && <ProtocolPreview protocol={p} />}
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

// ─── Main component ───────────────────────────────────────────────────────────

interface Tab2ProtocolProps {
  caseDetail: OncologyCaseDetail
  caseProtocols: OncologyCaseProtocolRow[]
}

export default function Tab2Protocol({ caseDetail, caseProtocols: initialProtocols }: Tab2ProtocolProps) {
  const router = useRouter()

  const [protocols, setProtocols] = useState(initialProtocols)
  const [addPanelOpen, setAddPanelOpen] = useState(false)

  // 라이브러리 (자동 검색)
  const [librarySuggestions, setLibrarySuggestions] = useState<AiProtocolOption[]>([])
  const [librarySuggestionsLoading, setLibrarySuggestionsLoading] = useState(false)
  const [previewProtocolId, setPreviewProtocolId] = useState<string | null>(null)

  // 수동 검색
  const [manualSearchQuery, setManualSearchQuery] = useState('')
  const [manualSearchResults, setManualSearchResults] = useState<AiProtocolOption[]>([])
  const [manualSearching, setManualSearching] = useState(false)

  // AI 생성
  const [isRescue, setIsRescue] = useState(false)
  const [rescueContext, setRescueContext] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  const [selectedProtocol, setSelectedProtocol] = useState<AiProtocolOption | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  // 공통 AddForm
  const [bodyWeight, setBodyWeight] = useState(caseDetail.body_weight?.toString() ?? '')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [adding, setAdding] = useState(false)

  const openAddPanel = async () => {
    setAddPanelOpen(true)
    setLibrarySuggestionsLoading(true)
    setLibrarySuggestions([])
    setSelectedProtocol(null)
    try {
      const results = await searchRelatedProtocols(
        caseDetail.hos_id,
        caseDetail.diagnosis_name,
        caseDetail.user_tags ?? '',
      )
      setLibrarySuggestions(results)
    } catch {
      toast.error('라이브러리 검색 실패')
    } finally {
      setLibrarySuggestionsLoading(false)
    }
  }

  const resetAll = () => {
    setAddPanelOpen(false)
    setLibrarySuggestions([])
    setPreviewProtocolId(null)
    setManualSearchQuery('')
    setManualSearchResults([])
    setIsRescue(false)
    setRescueContext('')
    setSelectedProtocol(null)
    setEditorOpen(false)
  }

  const handleManualSearch = async (value: string) => {
    setManualSearchQuery(value)
    if (!value.trim()) { setManualSearchResults([]); return }
    setManualSearching(true)
    try {
      const found = await searchProtocolTemplates(caseDetail.hos_id, value)
      setManualSearchResults(found)
    } catch {
      toast.error('검색 실패')
    } finally {
      setManualSearching(false)
    }
  }

  const handleGenerateAi = async () => {
    setAiGenerating(true)
    try {
      const result = isRescue
        ? await getAiRescueGuide(caseDetail.id, rescueContext)
        : await getAiOncologyGuide(caseDetail.id)
      if (result.protocols.length === 0) {
        toast.info('추천 프로토콜이 없습니다.')
      } else {
        setLibrarySuggestions((prev) => {
          const existingIds = new Set(prev.map((p) => p.id))
          return [...prev, ...result.protocols.filter((p) => p.id && !existingIds.has(p.id))]
        })
        toast.success(`${result.protocols.length}개의 AI 프로토콜이 추가되었습니다.`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '프로토콜 생성 실패')
    } finally {
      setAiGenerating(false)
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
          {addPanelOpen && (
            <button type="button" onClick={resetAll} className="text-xs text-slate-400 hover:text-slate-600 underline">
              취소
            </button>
          )}
        </div>

        {/* 추가 버튼 */}
        {!addPanelOpen && (
          <Button
            onClick={openAddPanel}
            variant="outline"
            className="w-full border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            <PlusCircle size={15} className="mr-2" />
            프로토콜 추가
          </Button>
        )}

        {/* ── 통합 추가 패널 ── */}
        {addPanelOpen && (
          <div className="space-y-4">

            {/* ① 라이브러리 자동 검색 결과 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Library size={13} className="text-rose-500" />
                <span className="text-xs font-semibold text-slate-700">라이브러리</span>
                {librarySuggestionsLoading && <Loader2 size={12} className="animate-spin text-slate-400" />}
                {!librarySuggestionsLoading && (
                  <span className="text-xs text-slate-400">
                    — {caseDetail.diagnosis_name} 관련 {librarySuggestions.length}건
                  </span>
                )}
              </div>

              {librarySuggestionsLoading && (
                <p className="text-xs text-slate-400 py-3 text-center">검색 중...</p>
              )}

              {!librarySuggestionsLoading && librarySuggestions.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center border border-dashed rounded-lg">
                  저장된 관련 프로토콜이 없습니다.
                </p>
              )}

              {librarySuggestions.filter((p) => !!p.id).map((p) => (
                <ProtocolSelectItem
                  key={p.id}
                  protocol={p}
                  selected={selectedProtocol?.id === p.id}
                  previewOpen={previewProtocolId === p.id}
                  onSelect={() => setSelectedProtocol(selectedProtocol?.id === p.id ? null : p)}
                  onTogglePreview={() => setPreviewProtocolId(previewProtocolId === p.id ? null : p.id!)}
                />
              ))}
            </div>

            {/* ② 수동 검색 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Search size={13} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">직접 검색</span>
              </div>
              <Autocomplete
                label=""
                defaultValue={manualSearchQuery}
                handleUpdate={handleManualSearch}
                onInputChange={handleManualSearch}
                placeholder="진단명 또는 약물 키워드"
              />
              {manualSearching && (
                <div className="flex justify-center py-2">
                  <Loader2 size={16} className="animate-spin text-slate-400" />
                </div>
              )}
              {!manualSearching && manualSearchResults.length === 0 && manualSearchQuery.trim() && (
                <p className="text-xs text-slate-400 text-center py-2">검색 결과가 없습니다.</p>
              )}
              {manualSearchResults.filter((p) => !!p.id).map((p) => (
                <ProtocolSelectItem
                  key={p.id}
                  protocol={p}
                  selected={selectedProtocol?.id === p.id}
                  previewOpen={previewProtocolId === p.id}
                  onSelect={() => setSelectedProtocol(selectedProtocol?.id === p.id ? null : p)}
                  onTogglePreview={() => setPreviewProtocolId(previewProtocolId === p.id ? null : p.id!)}
                />
              ))}
            </div>

            {/* ③ 두 버튼: AI 추천 / 직접 작성 */}
            <div className="flex flex-col gap-3 border-t pt-3">
              {isRescue && (
                <Textarea
                  value={rescueContext}
                  onChange={(e) => setRescueContext(e.target.value)}
                  placeholder="이전 치료 내역, 부작용, 내성 등 Rescue 프로토콜 추천에 필요한 추가 정보를 입력하세요..."
                  className="min-h-[60px] text-xs resize-none bg-white"
                />
              )}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <div
                      onClick={() => setIsRescue((v) => !v)}
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer',
                        isRescue ? 'bg-amber-500' : 'bg-slate-200',
                      )}
                    >
                      <span className={cn('pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform', isRescue ? 'translate-x-4' : 'translate-x-0')} />
                    </div>
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      {isRescue && <AlertTriangle size={11} className="text-amber-500" />}
                      {isRescue ? 'Rescue' : '1차'}
                    </span>
                  </label>
                  <Button
                    onClick={handleGenerateAi}
                    disabled={aiGenerating}
                    variant="outline"
                    size="sm"
                    className="border-rose-300 text-rose-700 hover:bg-rose-50"
                  >
                    {aiGenerating
                      ? <><Loader2 size={13} className="mr-1 animate-spin" />생성 중...</>
                      : <><Sparkles size={13} className="mr-1" />AI 프로토콜 추천</>
                    }
                  </Button>
                </div>
                <Button
                  onClick={() => setEditorOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <PenLine size={13} className="mr-1" />
                  직접 작성
                </Button>
              </div>
            </div>

            {/* ④ 선택된 프로토콜 → 케이스 추가 */}
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
