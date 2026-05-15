'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils/utils'
import { saveDiagnosisInput, updateCaseInfo } from '@/lib/actions/oncology/diagnosis-input-actions'
import { getAiOncologyGuide, refreshAiOncologyGuide, type AiProtocolOption } from '@/lib/actions/oncology/ai-oncology-guide'
import { uploadAndExtractDiagnosis } from '@/lib/actions/oncology/document-extraction-actions'
import { useOncologyContext } from '@/providers/oncology-context-provider'
import type { OncologyCaseDetail } from '@/types/hospital/oncology-type'
import type { OncologyDiagnosisInputRow } from '@/lib/services/oncology/fetch-oncology-case'
import { AlertTriangle, BookOpen, Brain, ChevronDown, ChevronUp, Clock, FileText, Loader2, RefreshCw, Save, Sparkles, StethoscopeIcon, UploadCloud, Users, X } from 'lucide-react'
import Autocomplete from '@/components/common/auto-complete/auto-complete'

const DIAGNOSIS_METHODS = [
  { value: 'biopsy', label: '생검(Biopsy)' },
  { value: 'cytology', label: '세포진(Cytology)' },
  { value: 'histopathology', label: '조직병리(Histopathology)' },
  { value: 'imaging', label: '영상진단(Imaging)' },
  { value: 'bloodwork', label: '혈액검사(Bloodwork)' },
  { value: 'clinical', label: '임상진단(Clinical)' },
]

const STAGE_OPTIONS = [
  'I', 'II', 'III', 'IV',
  'Ia', 'Ib', 'IIa', 'IIb', 'IIIa', 'IIIb',
  'T1N0M0', 'T2N0M0', 'T1N1M0', 'T2N1M0', 'TxNxM1',
]

const SEX_OPTIONS = [
  { value: 'male', label: '수컷' },
  { value: 'female', label: '암컷' },
  { value: 'male_neutered', label: '중성화 수컷' },
  { value: 'female_neutered', label: '중성화 암컷' },
]

function ProtocolCard({ protocol, index }: { protocol: AiProtocolOption; index: number }) {
  const [expanded, setExpanded] = useState(index === 0)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-rose-50 hover:bg-rose-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-rose-800">{protocol.protocol_name}</span>
          <Badge variant="outline" className="text-xs border-rose-300 text-rose-700">
            {protocol.protocol_type}
          </Badge>
          <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
            {protocol.phase}
          </Badge>
          {protocol.response_rate && (
            <span className="text-xs text-emerald-700 font-medium">
              반응률 {Math.round(protocol.response_rate * 100)}%
            </span>
          )}
          {protocol.mst_days && (
            <span className="text-xs text-slate-500">
              MST {protocol.mst_days}일
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="text-rose-600" /> : <ChevronDown size={16} className="text-rose-600" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-4 text-sm">
          {protocol.description && (
            <p className="text-slate-600">{protocol.description}</p>
          )}

          {/* Drugs table */}
          {protocol.drugs && protocol.drugs.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-800 mb-2">투약 약물</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border px-2 py-1 text-left">약물명</th>
                      <th className="border px-2 py-1 text-left">투여경로</th>
                      <th className="border px-2 py-1 text-left">용량</th>
                      <th className="border px-2 py-1 text-left">단위</th>
                      <th className="border px-2 py-1 text-left">빈도</th>
                      <th className="border px-2 py-1 text-left">경구</th>
                    </tr>
                  </thead>
                  <tbody>
                    {protocol.drugs.map((drug, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="border px-2 py-1 font-medium">{drug.drug_name}</td>
                        <td className="border px-2 py-1 uppercase">{drug.route}</td>
                        <td className="border px-2 py-1">{drug.dose_value}</td>
                        <td className="border px-2 py-1">{drug.dose_unit}</td>
                        <td className="border px-2 py-1">{drug.frequency}</td>
                        <td className="border px-2 py-1">{drug.is_oral ? '예' : '아니오'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Adverse effects */}
          {protocol.adverse_effects && protocol.adverse_effects.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-800 mb-2">주요 부작용</h4>
              <div className="flex flex-wrap gap-2">
                {protocol.adverse_effects.map((ae, i) => (
                  <span
                    key={i}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs',
                      ae.vcog_grade >= 4 ? 'bg-red-100 text-red-800' :
                      ae.vcog_grade >= 3 ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    )}
                  >
                    {ae.name}
                    <span className="font-semibold">G{ae.vcog_grade}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Precautions */}
          {protocol.precautions && (
            <div>
              <h4 className="font-medium text-slate-800 mb-1">주의사항</h4>
              <p className="text-slate-600 text-xs leading-relaxed">{protocol.precautions}</p>
            </div>
          )}

          {/* Owner warning signs */}
          {protocol.owner_warning_signs && protocol.owner_warning_signs.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-800 mb-1">보호자 응급증상</h4>
              <ul className="list-disc list-inside space-y-0.5">
                {protocol.owner_warning_signs.map((sign, i) => (
                  <li key={i} className="text-xs text-red-700">{sign}</li>
                ))}
              </ul>
            </div>
          )}

          {/* References */}
          {protocol.ref_sources && protocol.ref_sources.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-800 mb-1 flex items-center gap-1">
                <BookOpen size={12} /> 참고문헌
              </h4>
              <ul className="space-y-0.5">
                {protocol.ref_sources.map((ref, i) => (
                  <li key={i} className="text-xs text-slate-500">
                    {ref.title} — {ref.journal} ({ref.year})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI warning */}
          {protocol.is_ai_generated && !protocol.is_verified && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>이 프로토콜은 AI가 생성한 권장사항입니다. 임상 적용 전 반드시 전문가 검토가 필요합니다.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type SavedFileInfo = { name: string; url: string | null; mediaType: string }

function parseSavedFiles(documentInput: OncologyDiagnosisInputRow | null): SavedFileInfo[] {
  if (!documentInput) return []
  try {
    if (documentInput.additional_notes) {
      const parsed = JSON.parse(documentInput.additional_notes)
      if (Array.isArray(parsed)) return parsed as SavedFileInfo[]
    }
    // fallback: file_name/file_url single file
    if (documentInput.file_name) {
      return [{ name: documentInput.file_name, url: documentInput.file_url ?? null, mediaType: documentInput.file_type ?? '' }]
    }
  } catch { /* ignore */ }
  return []
}

interface Tab1DiagnosisProps {
  caseDetail: OncologyCaseDetail
  diagnosisInput: OncologyDiagnosisInputRow | null
  documentInput: OncologyDiagnosisInputRow | null
}

export default function Tab1Diagnosis({ caseDetail, diagnosisInput, documentInput }: Tab1DiagnosisProps) {
  const router = useRouter()
  const { vetsList } = useOncologyContext()

  const [diagnosisName, setDiagnosisName] = useState(caseDetail.diagnosis_name)
  const [vetId, setVetId] = useState(caseDetail.vet_id ?? 'none')
  const [vetDialogOpen, setVetDialogOpen] = useState(false)
  const [pendingVetId, setPendingVetId] = useState(caseDetail.vet_id ?? 'none')

  const [bodyWeight, setBodyWeight] = useState(caseDetail.body_weight?.toString() ?? '')
  const [stage, setStage] = useState(caseDetail.stage ?? 'none')
  const [sex, setSex] = useState(caseDetail.sex ?? 'none')
  const [status, setStatus] = useState(caseDetail.status ?? 'active')
  const [notes, setNotes] = useState(caseDetail.notes ?? '')
  const [diagMethods, setDiagMethods] = useState<string[]>(caseDetail.diagnosis_method ?? [])
  const [userTags, setUserTags] = useState(caseDetail.user_tags ?? '')

  const [clinicalSigns, setClinicalSigns] = useState(diagnosisInput?.clinical_signs ?? '')
  const [clinicalCourse, setClinicalCourse] = useState(diagnosisInput?.clinical_course ?? '')
  const [rawText, setRawText] = useState(diagnosisInput?.raw_text ?? '')
  const [ownerNote, setOwnerNote] = useState(diagnosisInput?.additional_notes ?? '')

  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiRefreshing, setAiRefreshing] = useState(false)
  const [protocols, setProtocols] = useState<AiProtocolOption[]>([])
  const [isExpired, setIsExpired] = useState(false)
  const [cachedAt, setCachedAt] = useState<string | null>(null)
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false)

  const [savedFiles, setSavedFiles] = useState<SavedFileInfo[]>(() => parseSavedFiles(documentInput))
  const [docFiles, setDocFiles] = useState<File[]>([])
  const [docExtracting, setDocExtracting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB per file
  const MAX_FILE_COUNT = 10
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return

    const errors: string[] = []
    const valid: File[] = []

    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: PDF, JPG, PNG만 가능`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: 5MB 초과`)
        continue
      }
      valid.push(file)
    }

    if (errors.length) toast.error(errors.join('\n'))

    setDocFiles((prev) => {
      const merged = [...prev, ...valid]
      if (merged.length > MAX_FILE_COUNT) {
        toast.error(`파일은 최대 ${MAX_FILE_COUNT}개까지 추가할 수 있습니다.`)
        return merged.slice(0, MAX_FILE_COUNT)
      }
      return merged
    })

    e.target.value = ''
  }

  const removeDocFile = (index: number) => {
    setDocFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDocExtract = async () => {
    if (docFiles.length === 0) return
    setDocExtracting(true)
    try {
      const fileInputs = await Promise.all(
        docFiles.map(async (file) => {
          const arrayBuffer = await file.arrayBuffer()
          return {
            base64: Buffer.from(arrayBuffer).toString('base64'),
            mediaType: file.type,
            fileName: file.name,
          }
        }),
      )
      const result = await uploadAndExtractDiagnosis(
        caseDetail.id,
        caseDetail.hos_id,
        fileInputs,
      )
      if (result.clinical_signs) setClinicalSigns(result.clinical_signs)
      if (result.clinical_course) setClinicalCourse(result.clinical_course)
      if (result.raw_text) setRawText(result.raw_text)
      if (result.owner_note) setOwnerNote(result.owner_note)
      setSavedFiles(result.uploadedFiles)
      setDocFiles([])
      toast.success(`${docFiles.length}개 문서에서 임상 정보를 추출했습니다. 내용을 확인 후 저장해주세요.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '문서 분석 오류')
    } finally {
      setDocExtracting(false)
    }
  }

  const toggleMethod = (val: string) => {
    setDiagMethods((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveDiagnosisInput(caseDetail.id, {
        input_type: 'text',
        clinical_signs: clinicalSigns,
        clinical_course: clinicalCourse,
        raw_text: rawText,
        additional_notes: ownerNote || null,
      })
      await updateCaseInfo(caseDetail.id, {
        diagnosis_name: diagnosisName.trim() || '미입력',
        body_weight: bodyWeight ? parseFloat(bodyWeight) : null,
        stage: stage === 'none' ? null : stage || null,
        sex: sex === 'none' ? null : sex || null,
        status,
        notes: notes || null,
        user_tags: userTags || null,
        vet_id: vetId === 'none' ? null : vetId,
        diagnosis_method: diagMethods,
      })
      toast.success('저장되었습니다.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const handleAiGuide = async () => {
    setAiLoading(true)
    try {
      const result = await getAiOncologyGuide(caseDetail.id)
      setProtocols(result.protocols)
      setIsExpired(result.isExpired)
      setCachedAt(result.cachedAt)
      if (result.isExpired) {
        setShowRefreshConfirm(true)
      } else {
        toast.success(`${result.protocols.length}개의 프로토콜 추천을 받았습니다.`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI 가이드 오류')
    } finally {
      setAiLoading(false)
    }
  }

  const handleRefreshAiGuide = async () => {
    setShowRefreshConfirm(false)
    setAiRefreshing(true)
    try {
      const result = await refreshAiOncologyGuide(caseDetail.id)
      setProtocols(result.protocols)
      setIsExpired(false)
      setCachedAt(result.cachedAt)
      toast.success(`${result.protocols.length}개의 최신 프로토콜 추천을 받았습니다.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI 가이드 갱신 오류')
    } finally {
      setAiRefreshing(false)
    }
  }

  function formatCachedAge(cachedAtIso: string | null): string {
    if (!cachedAtIso) return ''
    const diffMs = Date.now() - new Date(cachedAtIso).getTime()
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (days >= 30) return `${Math.floor(days / 30)}개월 전`
    return `${days}일 전`
  }

  return (
    <div className="space-y-6">
      {/* Case info section */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="font-semibold text-slate-800">케이스 기본 정보</h3>

        {/* 진단명 + 담당의 — full-width row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-600 mb-1">진단명</Label>
            <Input
              value={diagnosisName}
              onChange={(e) => setDiagnosisName(e.target.value)}
              placeholder="예: Canine Lymphoma (B-cell)"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-600 mb-1">담당의</Label>
            <button
              type="button"
              onClick={() => { setPendingVetId(vetId); setVetDialogOpen(true) }}
              className="flex w-full items-center gap-2 h-8 rounded-md border border-input bg-background px-3 text-sm hover:bg-slate-50 transition-colors"
            >
              <StethoscopeIcon size={14} className="text-slate-400 shrink-0" />
              <span className={cn('truncate', vetId === 'none' ? 'text-slate-400' : 'text-slate-800')}>
                {vetId === 'none'
                  ? '미지정'
                  : (vetsList.find((v) => v.user_id === vetId)?.name ?? '미지정')}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-slate-600 mb-1">체중 (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={bodyWeight}
              onChange={(e) => setBodyWeight(e.target.value)}
              placeholder="0.0"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-600 mb-1">병기(Stage)</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">미지정</SelectItem>
                {STAGE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-600 mb-1">성별</Label>
            <Select value={sex} onValueChange={setSex}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">미지정</SelectItem>
                {SEX_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-600 mb-1">상태</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">진행 중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="discontinued">중단</SelectItem>
                <SelectItem value="deceased">사망</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Diagnosis methods */}
        <div>
          <Label className="text-xs text-slate-600 mb-2 block">진단 방법</Label>
          <div className="flex flex-wrap gap-3">
            {DIAGNOSIS_METHODS.map((m) => (
              <div key={m.value} className="flex items-center gap-1.5">
                <Checkbox
                  id={`dm-${m.value}`}
                  checked={diagMethods.includes(m.value)}
                  onCheckedChange={() => toggleMethod(m.value)}
                />
                <label htmlFor={`dm-${m.value}`} className="text-xs cursor-pointer">
                  {m.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label className="text-xs text-slate-600 mb-1">메모</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="케이스 메모를 입력하세요"
            className="text-sm resize-none h-20"
          />
        </div>

        {/* Tags */}
        <div>
          <Label className="text-xs text-slate-600 mb-1">태그 (검색 키워드)</Label>
          <Autocomplete
            defaultValue={userTags}
            handleUpdate={setUserTags}
            onInputChange={setUserTags}
            placeholder="예: 림프종, CHOP, 골든리트리버"
          />
          <p className="text-xs text-slate-400 mt-1">쉼표로 구분. 케이스 검색에 활용됩니다.</p>
        </div>
      </div>

      {/* Document upload section */}
      <div className="rounded-lg border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud size={16} className="text-slate-500" />
            <h3 className="font-semibold text-slate-800">진단 문서 업로드</h3>
            <span className="text-xs text-slate-400">PDF · JPG · PNG, 각 5MB 이하, 최대 {MAX_FILE_COUNT}개</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/jpeg,image/png"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={docExtracting || docFiles.length >= MAX_FILE_COUNT}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 h-7 text-xs"
            >
              <UploadCloud size={13} className="mr-1.5" />
              파일 추가
            </Button>
            {docFiles.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDocFiles([])}
                disabled={docExtracting}
                className="h-7 text-xs text-slate-400 hover:text-red-500"
              >
                전체 제거
              </Button>
            )}
          </div>
        </div>

        {/* Previously saved files (from DB/Storage) */}
        {savedFiles.length > 0 && docFiles.length === 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 font-medium">저장된 문서</p>
            {savedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-emerald-50 rounded px-3 py-1.5 border border-emerald-200">
                <FileText size={13} className="text-emerald-600 shrink-0" />
                {file.url ? (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-700 underline underline-offset-2 flex-1 truncate hover:text-emerald-900"
                  >
                    {file.name}
                  </a>
                ) : (
                  <span className="text-xs text-slate-600 flex-1 truncate">{file.name}</span>
                )}
                <span className="text-xs text-slate-400 shrink-0">
                  {file.mediaType === 'application/pdf' ? 'PDF' : (file.mediaType.split('/')[1] ?? '').toUpperCase()}
                </span>
              </div>
            ))}
            <p className="text-xs text-slate-400">
              파일을 다시 추가하면 분석 후 목록이 교체됩니다.
            </p>
          </div>
        )}

        {/* New files to upload */}
        {docFiles.length > 0 && (
          <div className="space-y-1.5">
            {docFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 rounded px-3 py-1.5 border group">
                <FileText size={13} className="text-rose-500 shrink-0" />
                <span className="text-xs text-slate-700 flex-1 truncate">{file.name}</span>
                <span className="text-xs text-slate-400 shrink-0">
                  {file.type === 'application/pdf' ? 'PDF' : file.type.split('/')[1].toUpperCase()}
                </span>
                <span className="text-xs text-slate-400 shrink-0">
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </span>
                <button
                  type="button"
                  onClick={() => removeDocFile(i)}
                  disabled={docExtracting}
                  className="text-slate-300 hover:text-red-500 shrink-0 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {docFiles.length === 0 && savedFiles.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-3 border border-dashed rounded-lg">
            파일을 추가하면 AI가 내용을 분석해 임상 정보를 자동으로 채워드립니다.
          </p>
        )}

        {docFiles.length > 0 && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleDocExtract}
              disabled={docExtracting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
              size="sm"
            >
              {docExtracting
                ? <><Loader2 size={14} className="mr-1.5 animate-spin" />{docFiles.length}개 문서 분석 중...</>
                : <><Sparkles size={14} className="mr-1.5" />{docFiles.length}개 문서 AI 분석</>
              }
            </Button>
            <p className="text-xs text-slate-400 leading-relaxed">
              모든 문서를 종합 분석해 아래 임상 정보 칸을 자동으로 채웁니다. 기존 입력값은 덮어씁니다.
            </p>
          </div>
        )}
      </div>

      {/* Diagnosis input section */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="font-semibold text-slate-800">진단 소견 입력</h3>
        <div>
          <Label className="text-xs text-slate-600 mb-1">임상 증상 (Clinical Signs)</Label>
          <Textarea
            value={clinicalSigns}
            onChange={(e) => setClinicalSigns(e.target.value)}
            placeholder="관찰된 임상 증상을 입력하세요"
            className="text-sm resize-none h-24"
          />
        </div>
        <div>
          <Label className="text-xs text-slate-600 mb-1">임상 경과 (Clinical Course)</Label>
          <Textarea
            value={clinicalCourse}
            onChange={(e) => setClinicalCourse(e.target.value)}
            placeholder="질환의 경과를 입력하세요"
            className="text-sm resize-none h-24"
          />
        </div>
        <div>
          <Label className="text-xs text-slate-600 mb-1">직접 입력 (Raw Text)</Label>
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="추가 정보, 검사 결과 등을 자유롭게 입력하세요"
            className="text-sm resize-none h-24"
          />
        </div>
      </div>

      {/* Owner guidance note */}
      <div className="rounded-lg border border-indigo-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-indigo-500" />
            <h3 className="font-semibold text-slate-800">보호자 안내문</h3>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
              보호자 페이지 공개 예정
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          진단 경위, 진단명 및 질환 설명을 보호자가 이해하기 쉽게 작성합니다. 진단 문서를 AI로 분석하면 자동으로 생성됩니다.
        </p>
        <Textarea
          value={ownerNote}
          onChange={(e) => setOwnerNote(e.target.value)}
          placeholder="예: ○○이는 이번에 ○○ 검사를 통해 ○○ 종양으로 진단받았습니다. ○○ 종양은 ..."
          className="text-sm resize-none h-40 border-indigo-200 focus-visible:ring-indigo-400"
        />
      </div>

      {/* Vet select dialog */}
      <Dialog open={vetDialogOpen} onOpenChange={setVetDialogOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>담당의 변경</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <Select value={pendingVetId} onValueChange={setPendingVetId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="선택 안 함" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">미지정</SelectItem>
                {vetsList.map((v) => (
                  <SelectItem key={v.user_id} value={v.user_id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setVetDialogOpen(false)}>
                닫기
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => { setVetId(pendingVetId); setVetDialogOpen(false) }}
              >
                적용
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-rose-600 hover:bg-rose-700 text-white"
      >
        {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
        저장
      </Button>

      {/* AI Guide section */}
      <div className="rounded-lg border border-rose-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-rose-600" />
            <h3 className="font-semibold text-slate-800">AI 프로토콜 추천</h3>
          </div>
          <Button
            onClick={handleAiGuide}
            disabled={aiLoading || aiRefreshing}
            variant="outline"
            className="border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            {aiLoading
              ? <><Loader2 size={14} className="mr-2 animate-spin" />분석 중...</>
              : <><Sparkles size={14} className="mr-2" />AI 프로토콜 추천 받기</>
            }
          </Button>
        </div>

        {/* Expired cache notice */}
        {isExpired && protocols.length > 0 && !showRefreshConfirm && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="text-amber-800 font-medium">
                {formatCachedAge(cachedAt)} 생성된 추천입니다.
              </p>
              <p className="text-amber-700 text-xs mt-0.5">
                최신 가이드라인으로 업데이트된 추천을 받으시겠습니까?
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                onClick={handleRefreshAiGuide}
                disabled={aiRefreshing}
                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                {aiRefreshing
                  ? <Loader2 size={12} className="mr-1 animate-spin" />
                  : <RefreshCw size={12} className="mr-1" />
                }
                새 추천 받기
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRefreshConfirm(false)}
                className="h-7 text-xs"
              >
                유지
              </Button>
            </div>
          </div>
        )}

        {/* Refresh confirm (shown immediately after loading expired cache) */}
        {showRefreshConfirm && protocols.length > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="text-amber-800 font-medium">
                {formatCachedAge(cachedAt)} 생성된 추천입니다.
              </p>
              <p className="text-amber-700 text-xs mt-0.5">
                아래는 기존 가이드라인입니다. 최신 추천으로 업데이트하시겠습니까?
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                onClick={handleRefreshAiGuide}
                disabled={aiRefreshing}
                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                {aiRefreshing
                  ? <Loader2 size={12} className="mr-1 animate-spin" />
                  : <RefreshCw size={12} className="mr-1" />
                }
                새 추천 받기
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRefreshConfirm(false)}
                className="h-7 text-xs"
              >
                기존 유지
              </Button>
            </div>
          </div>
        )}

        {aiRefreshing && (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 size={20} className="animate-spin mr-2" />
            <span className="text-sm">최신 가이드라인으로 업데이트 중...</span>
          </div>
        )}

        {protocols.length === 0 && !aiLoading && !aiRefreshing && (
          <p className="text-sm text-slate-400 text-center py-6">
            위 버튼을 클릭하여 {caseDetail.diagnosis_name}에 대한 AI 치료 프로토콜 추천을 받으세요.
          </p>
        )}

        {protocols.length > 0 && !aiRefreshing && (
          <div className="space-y-3">
            {protocols.map((p, i) => (
              <ProtocolCard key={p.id ?? i} protocol={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
