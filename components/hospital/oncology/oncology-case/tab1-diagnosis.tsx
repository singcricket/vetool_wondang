'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils/utils'
import { saveDiagnosisInput, updateCaseInfo } from '@/lib/actions/oncology/diagnosis-input-actions'
import { uploadAndExtractDiagnosis, type ExtractedDiagnosisFields } from '@/lib/actions/oncology/document-extraction-actions'
import type { OncologyCaseDetail } from '@/types/hospital/oncology-type'
import type { OncologyDiagnosisInputRow } from '@/lib/services/oncology/fetch-oncology-case'
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Save,
  Sparkles,
  UploadCloud,
  Users,
  X,
} from 'lucide-react'
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

type SavedFileInfo = { name: string; url: string | null; mediaType: string }

function parseSavedFiles(documentInput: OncologyDiagnosisInputRow | null): SavedFileInfo[] {
  if (!documentInput) return []
  try {
    if (documentInput.additional_notes) {
      const parsed = JSON.parse(documentInput.additional_notes)
      if (Array.isArray(parsed)) return parsed as SavedFileInfo[]
    }
    if (documentInput.file_name) {
      return [{ name: documentInput.file_name, url: documentInput.file_url ?? null, mediaType: documentInput.file_type ?? '' }]
    }
  } catch { /* ignore */ }
  return []
}

// Fields that can be AI-suggested
type AiSuggestionKey = 'diagnosis_name' | 'stage' | 'diagnosis_methods' | 'clinical_signs' | 'clinical_course' | 'raw_text' | 'owner_note'

type AiSuggestion = Pick<ExtractedDiagnosisFields, AiSuggestionKey>

interface Tab1DiagnosisProps {
  caseDetail: OncologyCaseDetail
  diagnosisInput: OncologyDiagnosisInputRow | null
  documentInput: OncologyDiagnosisInputRow | null
}

export default function Tab1Diagnosis({ caseDetail, diagnosisInput, documentInput }: Tab1DiagnosisProps) {
  const router = useRouter()

  // ── Form state ───────────────────────────────────────────────────────────────
  const [diagnosisName, setDiagnosisName] = useState(caseDetail.diagnosis_name)
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

  // ── AI suggestion review state ───────────────────────────────────────────────
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null)
  const [selectedAiKeys, setSelectedAiKeys] = useState<Set<AiSuggestionKey>>(new Set())
  const [aiFilledFields, setAiFilledFields] = useState<Set<AiSuggestionKey>>(new Set())

  // ── File upload state ────────────────────────────────────────────────────────
  const [savedFiles, setSavedFiles] = useState<SavedFileInfo[]>(() => parseSavedFiles(documentInput))
  const [docFiles, setDocFiles] = useState<File[]>([])
  const [docExtracting, setDocExtracting] = useState(false)
  const [showSavedFiles, setShowSavedFiles] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 5 * 1024 * 1024
  const MAX_FILE_COUNT = 10
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

  // ── File handlers ────────────────────────────────────────────────────────────
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

  // ── AI extraction ─────────────────────────────────────────────────────────
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
      const result = await uploadAndExtractDiagnosis(caseDetail.id, caseDetail.hos_id, fileInputs)

      // Build suggestion object from non-empty fields only
      const suggestion: AiSuggestion = {
        diagnosis_name: result.diagnosis_name,
        stage: result.stage,
        diagnosis_methods: result.diagnosis_methods,
        clinical_signs: result.clinical_signs,
        clinical_course: result.clinical_course,
        raw_text: result.raw_text,
        owner_note: result.owner_note,
      }

      // Pre-select all non-empty fields
      const preSelected = new Set<AiSuggestionKey>(
        (Object.keys(suggestion) as AiSuggestionKey[]).filter((k) => {
          const v = suggestion[k]
          return Array.isArray(v) ? v.length > 0 : !!v
        })
      )

      setSavedFiles(result.uploadedFiles)
      setDocFiles([])
      setAiSuggestion(suggestion)
      setSelectedAiKeys(preSelected)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '문서 분석 오류')
    } finally {
      setDocExtracting(false)
    }
  }

  // ── Apply AI suggestion ──────────────────────────────────────────────────────
  const handleApplySuggestion = () => {
    if (!aiSuggestion) return
    const applied = new Set<AiSuggestionKey>()

    if (selectedAiKeys.has('diagnosis_name') && aiSuggestion.diagnosis_name) {
      setDiagnosisName(aiSuggestion.diagnosis_name)
      applied.add('diagnosis_name')
    }
    if (selectedAiKeys.has('stage') && aiSuggestion.stage) {
      setStage(aiSuggestion.stage)
      applied.add('stage')
    }
    if (selectedAiKeys.has('diagnosis_methods') && aiSuggestion.diagnosis_methods?.length) {
      setDiagMethods(aiSuggestion.diagnosis_methods)
      applied.add('diagnosis_methods')
    }
    if (selectedAiKeys.has('clinical_signs') && aiSuggestion.clinical_signs) {
      setClinicalSigns(aiSuggestion.clinical_signs)
      applied.add('clinical_signs')
    }
    if (selectedAiKeys.has('clinical_course') && aiSuggestion.clinical_course) {
      setClinicalCourse(aiSuggestion.clinical_course)
      applied.add('clinical_course')
    }
    if (selectedAiKeys.has('raw_text') && aiSuggestion.raw_text) {
      setRawText(aiSuggestion.raw_text)
      applied.add('raw_text')
    }
    if (selectedAiKeys.has('owner_note') && aiSuggestion.owner_note) {
      setOwnerNote(aiSuggestion.owner_note)
      applied.add('owner_note')
    }

    setAiFilledFields(applied)
    setAiSuggestion(null)
    setSelectedAiKeys(new Set())
    toast.success('AI 분석 결과가 적용되었습니다. 내용을 확인 후 저장해 주세요.')
  }

  const toggleAiKey = (key: AiSuggestionKey) => {
    setSelectedAiKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const toggleMethod = (val: string) => {
    setDiagMethods((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    )
    setAiFilledFields((prev) => { const n = new Set(prev); n.delete('diagnosis_methods'); return n })
  }

  const aiHighlight = (key: AiSuggestionKey) =>
    aiFilledFields.has(key) ? 'ring-2 ring-amber-300 bg-amber-50' : ''

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
        diagnosis_method: diagMethods,
      })
      setAiFilledFields(new Set())
      toast.success('저장되었습니다.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const SUGGESTION_LABELS: Record<AiSuggestionKey, string> = {
    diagnosis_name: '진단명',
    stage: '병기(Stage)',
    diagnosis_methods: '진단 방법',
    clinical_signs: '임상 증상',
    clinical_course: '임상 경과',
    raw_text: '추가 소견',
    owner_note: '보호자 안내문',
  }

  return (
    <div className="space-y-5">

      {/* ── AI 케이스 분석 섹션 (최상단) ───────────────────────────────────────── */}
      <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-500" />
            <h3 className="font-semibold text-slate-800">AI 케이스 분석</h3>
            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-2">
            {savedFiles.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSavedFiles((v) => !v)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              >
                <FileText size={12} />
                이전 분석 파일 {savedFiles.length}개
                {showSavedFiles ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
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
              className="border-violet-300 text-violet-700 hover:bg-violet-50 h-7 text-xs"
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

        <p className="text-xs text-slate-500 leading-relaxed">
          세포진 검사 결과지, 조직병리 보고서, CT/초음파 소견서, 혈액검사 결과 등 관련 자료(PDF·JPG·PNG, 각 5MB 이하, 최대 {MAX_FILE_COUNT}개)를 업로드하면
          AI가 <strong>진단명·병기·진단소견·보호자 안내문</strong>을 자동으로 작성합니다.
          분석 결과는 검토 후 선택적으로 적용할 수 있습니다.
        </p>

        {/* Previously saved files */}
        {showSavedFiles && savedFiles.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {savedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded px-3 py-1.5 border border-violet-200">
                <FileText size={13} className="text-violet-500 shrink-0" />
                {file.url ? (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-700 underline underline-offset-2 flex-1 truncate hover:text-violet-900"
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
          </div>
        )}

        {/* New files pending upload */}
        {docFiles.length > 0 && (
          <div className="space-y-1.5">
            {docFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded px-3 py-1.5 border group">
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
          <div className="flex items-center justify-center py-4 border border-dashed border-violet-200 rounded-lg">
            <p className="text-xs text-slate-400">
              파일을 추가하면 AI가 내용을 분석해 케이스 정보를 자동으로 채워드립니다.
            </p>
          </div>
        )}

        {docFiles.length > 0 && (
          <Button
            type="button"
            onClick={handleDocExtract}
            disabled={docExtracting}
            className="bg-violet-600 hover:bg-violet-700 text-white w-full sm:w-auto"
            size="sm"
          >
            {docExtracting
              ? <><Loader2 size={14} className="mr-1.5 animate-spin" />{docFiles.length}개 문서 분석 중...</>
              : <><Sparkles size={14} className="mr-1.5" />{docFiles.length}개 문서 AI 분석 시작</>
            }
          </Button>
        )}
      </div>

      {/* ── AI 분석 결과 검토 패널 ──────────────────────────────────────────────── */}
      {aiSuggestion && (
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900">AI 분석 결과 — 반드시 검토 후 적용하세요</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                AI가 업로드한 문서를 기반으로 아래 내용을 제안합니다.
                <strong> 진단명·병기는 문서 해석에 따라 부정확할 수 있으므로</strong> 반드시 확인하세요.
                적용할 항목을 선택하고 "선택 항목 적용" 버튼을 눌러주세요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setAiSuggestion(null); setSelectedAiKeys(new Set()) }}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Field rows */}
          <div className="space-y-2">
            {(Object.keys(SUGGESTION_LABELS) as AiSuggestionKey[]).map((key) => {
              const value = aiSuggestion[key]
              const isEmpty = Array.isArray(value) ? value.length === 0 : !value
              if (isEmpty) return null

              const displayValue = Array.isArray(value)
                ? value.map((v) => DIAGNOSIS_METHODS.find((m) => m.value === v)?.label ?? v).join(', ')
                : String(value)

              return (
                <div
                  key={key}
                  className={cn(
                    'flex items-start gap-3 rounded-md border px-3 py-2.5 bg-white transition-colors',
                    selectedAiKeys.has(key) ? 'border-amber-300' : 'border-slate-200',
                  )}
                >
                  <Checkbox
                    id={`ai-key-${key}`}
                    checked={selectedAiKeys.has(key)}
                    onCheckedChange={() => toggleAiKey(key)}
                    className="mt-0.5 shrink-0"
                  />
                  <label htmlFor={`ai-key-${key}`} className="flex-1 min-w-0 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-600 block mb-0.5">
                      {SUGGESTION_LABELS[key]}
                    </span>
                    <span className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap line-clamp-4">
                      {displayValue}
                    </span>
                  </label>
                </div>
              )
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleApplySuggestion}
              disabled={selectedAiKeys.size === 0}
              className="bg-amber-500 hover:bg-amber-600 text-white h-8 text-xs"
            >
              <CheckCircle size={13} className="mr-1.5" />
              선택 항목 적용 ({selectedAiKeys.size}개)
            </Button>
            <button
              type="button"
              onClick={() => {
                const all = new Set<AiSuggestionKey>(
                  (Object.keys(SUGGESTION_LABELS) as AiSuggestionKey[]).filter((k) => {
                    const v = aiSuggestion[k]
                    return Array.isArray(v) ? v.length > 0 : !!v
                  })
                )
                setSelectedAiKeys(all)
              }}
              className="text-xs text-amber-700 hover:text-amber-900 underline underline-offset-2"
            >
              전체 선택
            </button>
            <button
              type="button"
              onClick={() => setSelectedAiKeys(new Set())}
              className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
            >
              전체 해제
            </button>
            <button
              type="button"
              onClick={() => { setAiSuggestion(null); setSelectedAiKeys(new Set()) }}
              className="ml-auto text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <X size={12} /> 닫기
            </button>
          </div>
        </div>
      )}

      {/* ── 케이스 기본 정보 ──────────────────────────────────────────────────── */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="font-semibold text-slate-800">케이스 기본 정보</h3>

        {/* 진단명 */}
        <div>
          <Label className="text-xs text-slate-600 mb-1">
            진단명
            {aiFilledFields.has('diagnosis_name') && (
              <span className="ml-2 text-amber-600 font-normal">✦ AI 제안</span>
            )}
          </Label>
          <Input
            value={diagnosisName}
            onChange={(e) => { setDiagnosisName(e.target.value); setAiFilledFields((p) => { const n = new Set(p); n.delete('diagnosis_name'); return n }) }}
            placeholder="예: Canine Lymphoma (B-cell)"
            className={cn('h-8 text-sm', aiHighlight('diagnosis_name'))}
          />
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
            <Label className="text-xs text-slate-600 mb-1">
              병기(Stage)
              {aiFilledFields.has('stage') && (
                <span className="ml-1 text-amber-600 font-normal">✦ AI</span>
              )}
            </Label>
            <Select
              value={stage}
              onValueChange={(v) => { setStage(v); setAiFilledFields((p) => { const n = new Set(p); n.delete('stage'); return n }) }}
            >
              <SelectTrigger className={cn('h-8 text-sm', aiHighlight('stage'))}>
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
          <Label className="text-xs text-slate-600 mb-2 block">
            진단 방법
            {aiFilledFields.has('diagnosis_methods') && (
              <span className="ml-2 text-amber-600 font-normal">✦ AI 제안</span>
            )}
          </Label>
          <div className={cn('flex flex-wrap gap-3 rounded-md p-2', aiHighlight('diagnosis_methods'))}>
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

      {/* ── 진단 소견 입력 ───────────────────────────────────────────────────── */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="font-semibold text-slate-800">진단 소견</h3>
        <div>
          <Label className="text-xs text-slate-600 mb-1">
            임상 증상 (Clinical Signs)
            {aiFilledFields.has('clinical_signs') && (
              <span className="ml-2 text-amber-600 font-normal">✦ AI 제안</span>
            )}
          </Label>
          <Textarea
            value={clinicalSigns}
            onChange={(e) => { setClinicalSigns(e.target.value); setAiFilledFields((p) => { const n = new Set(p); n.delete('clinical_signs'); return n }) }}
            placeholder="관찰된 임상 증상을 입력하세요"
            className={cn('text-sm resize-none h-24', aiHighlight('clinical_signs'))}
          />
        </div>
        <div>
          <Label className="text-xs text-slate-600 mb-1">
            임상 경과 (Clinical Course)
            {aiFilledFields.has('clinical_course') && (
              <span className="ml-2 text-amber-600 font-normal">✦ AI 제안</span>
            )}
          </Label>
          <Textarea
            value={clinicalCourse}
            onChange={(e) => { setClinicalCourse(e.target.value); setAiFilledFields((p) => { const n = new Set(p); n.delete('clinical_course'); return n }) }}
            placeholder="질환의 경과를 입력하세요"
            className={cn('text-sm resize-none h-24', aiHighlight('clinical_course'))}
          />
        </div>
        <div>
          <Label className="text-xs text-slate-600 mb-1">
            추가 소견 / 검사 수치
            {aiFilledFields.has('raw_text') && (
              <span className="ml-2 text-amber-600 font-normal">✦ AI 제안</span>
            )}
          </Label>
          <Textarea
            value={rawText}
            onChange={(e) => { setRawText(e.target.value); setAiFilledFields((p) => { const n = new Set(p); n.delete('raw_text'); return n }) }}
            placeholder="검사 결과 수치, 조직병리 소견 등 추가 정보를 자유롭게 입력하세요"
            className={cn('text-sm resize-none h-24', aiHighlight('raw_text'))}
          />
        </div>
      </div>

      {/* ── 보호자 안내문 ─────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-indigo-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-indigo-500" />
          <h3 className="font-semibold text-slate-800">보호자 안내문</h3>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            보호자 페이지 공개 예정
          </span>
          {aiFilledFields.has('owner_note') && (
            <span className="text-xs text-amber-600 font-medium">✦ AI 제안</span>
          )}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          진단 경위, 진단명 및 질환 설명을 보호자가 이해하기 쉽게 작성합니다.
          AI 분석 시 자동으로 초안이 생성됩니다.
        </p>
        <Textarea
          value={ownerNote}
          onChange={(e) => { setOwnerNote(e.target.value); setAiFilledFields((p) => { const n = new Set(p); n.delete('owner_note'); return n }) }}
          placeholder="예: ○○이는 이번에 ○○ 검사를 통해 ○○ 종양으로 진단받았습니다. ○○ 종양은 ..."
          className={cn('text-sm resize-none h-40 border-indigo-200 focus-visible:ring-indigo-400', aiHighlight('owner_note'))}
        />
      </div>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-rose-600 hover:bg-rose-700 text-white"
      >
        {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
        저장
      </Button>

    </div>
  )
}
