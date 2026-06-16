'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sparkles, LoaderCircle, CheckCircle2, ChevronRight,
  Clock, AlertTriangle, Trash2, BookTemplate, UserX,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  searchTreatmentTemplates,
  generateTreatmentPlan,
  saveTreatmentAsTemplate,
  type TreatmentStep,
  type PatientInfoForPlan,
} from '@/lib/actions/monitoring/treatment-plan-action'
import { stepsToMemos } from '@/lib/utils/treatment-plan-utils'
import type { MsTemplateChart } from '@/lib/services/monitoring/fetch-ms-data'
import type { MsMemo } from '@/types/monitoring/monitoring-type'

interface Props {
  hosId: string
  species: 'canine' | 'feline' | null
  patientInfo: PatientInfoForPlan | null
  onApply: (memos: MsMemo[]) => void
}

type DetailLevel = 'detailed' | 'brief'
type Step = 'input' | 'preview'

function calcAgeLabel(birth: string): string {
  const totalMonths =
    (new Date().getFullYear() - new Date(birth).getFullYear()) * 12 +
    (new Date().getMonth() - new Date(birth).getMonth())
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (years >= 1) return months > 0 ? `${years}세 ${months}개월` : `${years}세`
  return `${totalMonths}개월`
}

const SCHEDULE_LABEL = (s: TreatmentStep['schedule']) => {
  if (!s) return null
  if (s.type === 'absolute') return `⏰ ${s.value}`
  if (s.type === 'after_start') return `▶ 시작 후 ${s.value}분`
  if (s.type === 'after_prev') return `→ 이전 후 ${s.value}분`
  return null
}

export default function AiTreatmentPlanDialog({ hosId, species, patientInfo, onApply }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('input')

  // 입력
  const [procedureName, setProcedureName] = useState('')
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('detailed')
  const [includePatient, setIncludePatient] = useState(!!patientInfo)

  // 템플릿 검색
  const [templates, setTemplates] = useState<MsTemplateChart[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // AI 생성
  const [generating, setGenerating] = useState(false)
  const [steps, setSteps] = useState<TreatmentStep[]>([])
  const [sourceLabel, setSourceLabel] = useState<string>('')

  // 추가 임상 정보
  const [additionalInfo, setAdditionalInfo] = useState('')

  // 템플릿 저장
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [saving, setSaving] = useState(false)

  // 처치명 입력 시 실시간 템플릿 검색
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!procedureName.trim()) { setTemplates([]); return }

    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true)
      const { data } = await searchTreatmentTemplates(procedureName, hosId)
      setTemplates(data)
      setSearchLoading(false)
    }, 400)

    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [procedureName, hosId])

  const handleUseTemplate = (template: MsTemplateChart) => {
    const memoTx = (template.memo_tx ?? []) as MsMemo[]
    if (memoTx.length === 0) {
      toast.error('이 템플릿에 처치 단계가 없습니다.')
      return
    }
    // MsMemo → TreatmentStep 역변환 (미리보기용)
    const converted: TreatmentStep[] = memoTx.map((m) => ({
      memo: m.memo,
      description: m.check ?? '',
      caution: null,
      schedule: m.schedule ?? null,
      color: m.color as TreatmentStep['color'],
    }))
    setSteps(converted)
    setSourceLabel(`템플릿: ${template.session_template_title}`)
    setTemplateName(template.session_template_title ?? '')
    setStep('preview')
  }

  const handleGenerate = async () => {
    if (!procedureName.trim()) return
    setGenerating(true)
    const { data, error } = await generateTreatmentPlan({
      procedureName,
      species,
      detailLevel,
      patientInfo: includePatient && patientInfo
        ? { ...patientInfo, additionalInfo: additionalInfo.trim() || null }
        : null,
    })
    setGenerating(false)
    if (error || !data) {
      toast.error(error ?? '생성 실패')
      return
    }
    setSteps(data)
    setSourceLabel(`AI 생성: ${procedureName}`)
    setTemplateName(procedureName)
    setStep('preview')
  }

  const updateStep = (idx: number, field: Partial<TreatmentStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...field } : s)))
  }

  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleApply = async () => {
    if (steps.length === 0) return

    if (saveAsTemplate && templateName.trim()) {
      setSaving(true)
      const { error } = await saveTreatmentAsTemplate({
        hosId,
        templateName: templateName.trim(),
        steps,
        procedureDescription: procedureName,
      })
      setSaving(false)
      if (error) {
        toast.error(`템플릿 저장 실패: ${error}`)
        return
      }
      toast.success('템플릿으로 저장되었습니다.')
    }

    onApply(stepsToMemos(steps))
    toast.success(`${steps.length}개 처치 단계가 추가되었습니다.`)
    handleClose()
  }

  const handleClose = () => {
    setOpen(false)
    setStep('input')
    setProcedureName('')
    setTemplates([])
    setSteps([])
    setSourceLabel('')
    setSaveAsTemplate(false)
    setTemplateName('')
    setIncludePatient(!!patientInfo)
    setAdditionalInfo('')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-violet-300 text-violet-600 hover:bg-violet-50">
          <Sparkles size={13} />
          AI 처치 계획
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-500" />
            AI 처치 계획 생성
          </DialogTitle>
        </DialogHeader>

        {/* ── STEP 1: 입력 ── */}
        {step === 'input' && (
          <div className="flex flex-col gap-4 pt-1">
            {/* 처치명 */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-slate-600">처치명</Label>
              <Input
                placeholder="예: Doxorubicin 항암, ACTH 자극시험, 흉관 삽입"
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !generating && handleGenerate()}
                className="text-sm"
                autoFocus
              />
            </div>

            {/* 기존 템플릿 검색 결과 */}
            {(searchLoading || templates.length > 0) && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <BookTemplate size={12} />
                  저장된 템플릿
                  {searchLoading && <LoaderCircle size={11} className="animate-spin ml-1" />}
                </p>
                {templates.map((t) => (
                  <button
                    key={t.session_template_id}
                    type="button"
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left hover:border-violet-300 hover:bg-violet-50 transition-colors"
                    onClick={() => handleUseTemplate(t)}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">{t.session_template_title}</p>
                      {t.session_comment && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{t.session_comment}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">
                        단계 {(t.memo_tx as MsMemo[])?.filter(m => !m.is_realtime_memo).length ?? 0}개
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  </button>
                ))}
                <Separator className="mt-1" />
              </div>
            )}

            {/* 상세도 */}
            <div className="flex items-center gap-3">
              <Label className="text-xs text-slate-600 shrink-0">단계 상세도</Label>
              <Select value={detailLevel} onValueChange={(v) => setDetailLevel(v as DetailLevel)}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detailed">상세 — 설명·팁·주의사항 포함</SelectItem>
                  <SelectItem value="brief">간략 — 핵심 단계만</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 환자 맞춤형 옵션 */}
            <div
              className={[
                'flex flex-col gap-2 rounded-lg border px-3 py-2.5 transition-colors',
                !patientInfo
                  ? 'border-slate-200 bg-slate-50 opacity-60'
                  : includePatient
                  ? 'border-violet-300 bg-violet-50 cursor-pointer'
                  : 'border-slate-200 bg-slate-50 cursor-pointer',
              ].join(' ')}
              onClick={() => {
                if (!patientInfo) return
                setIncludePatient((v) => !v)
              }}
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-patient"
                  checked={includePatient}
                  disabled={!patientInfo}
                  onCheckedChange={(v) => {
                    if (!patientInfo) return
                    setIncludePatient(!!v)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-3.5 w-3.5 border-violet-400"
                />
                <Label
                  htmlFor="include-patient"
                  className={[
                    'text-xs font-semibold',
                    !patientInfo
                      ? 'cursor-not-allowed text-slate-400'
                      : includePatient
                      ? 'cursor-pointer text-violet-700'
                      : 'cursor-pointer text-slate-500',
                  ].join(' ')}
                  onClick={(e) => e.stopPropagation()}
                >
                  환자 맞춤형
                </Label>
                {includePatient && (
                  <span className="ml-auto rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">
                    ON
                  </span>
                )}
              </div>

              {/* 환자 미연결 안내 */}
              {!patientInfo && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <UserX size={12} />
                  환자가 연결되지 않았습니다. 사이드바에서 환자를 먼저 연결해주세요.
                </div>
              )}

              {/* 환자 연결됨 + OFF */}
              {patientInfo && !includePatient && (
                <p className="text-[11px] text-slate-400">
                  체크 시 환자 체중·품종·나이 기반 투여량 및 맞춤 팁을 포함합니다
                </p>
              )}

              {/* 환자 연결됨 + ON */}
              {patientInfo && includePatient && (
                <div className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-violet-700">
                    <span><span className="text-violet-400">종/품종</span> {patientInfo.species === 'feline' ? '고양이' : '개'} / {patientInfo.breed}</span>
                    <span><span className="text-violet-400">체중</span> {patientInfo.weight ? `${patientInfo.weight} kg` : '미기록'}</span>
                    <span><span className="text-violet-400">성별</span> {patientInfo.gender}</span>
                    <span><span className="text-violet-400">나이</span> {calcAgeLabel(patientInfo.birth)}</span>
                  </div>

                  {/* 추가 임상 정보 */}
                  <div
                    className="flex flex-col gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Label className="text-[11px] font-medium text-violet-600">
                      추가 임상 정보 <span className="font-normal text-violet-400">(선택)</span>
                    </Label>
                    <Textarea
                      className="min-h-[72px] resize-none text-xs border-violet-200 bg-white placeholder:text-slate-300 focus-visible:ring-violet-300"
                      placeholder={`현재 상태나 검사 수치를 입력하면 AI가 반영합니다.\n예) 현재 PCV 15%, 공혈견 PCV 45% → 수혈량 계산\n예) 기저질환: 당뇨, CKD stage 3 → 금기 약물 주의`}
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              className="gap-2 bg-violet-500 hover:bg-violet-600 text-white"
              onClick={handleGenerate}
              disabled={!procedureName.trim() || generating}
            >
              {generating
                ? <><LoaderCircle size={15} className="animate-spin" />AI 생성 중...</>
                : <><Sparkles size={15} />AI로 처치 계획 생성</>
              }
            </Button>
          </div>
        )}

        {/* ── STEP 2: 미리보기 & 편집 ── */}
        {step === 'preview' && (
          <div className="flex flex-col gap-4 pt-1">
            {/* 소스 배지 */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs text-violet-600 border-violet-300">
                {sourceLabel}
              </Badge>
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-slate-600"
                onClick={() => setStep('input')}
              >
                ← 다시 입력
              </button>
            </div>

            {/* 단계 목록 */}
            <div className="flex flex-col gap-2 pr-1">
              {steps.map((s, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 overflow-hidden"
                  style={{ borderLeftColor: s.color, borderLeftWidth: 4 }}
                >
                  <div className="flex items-start gap-2 px-3 py-2.5 bg-white">
                    <span className="text-xs font-bold text-slate-400 mt-0.5 shrink-0 w-5">{idx + 1}</span>
                    <div className="flex-1 flex flex-col gap-1.5">
                      {/* 단계명 */}
                      <Input
                        className="h-7 text-sm font-medium border-none p-0 bg-transparent shadow-none focus-visible:ring-0"
                        value={s.memo}
                        onChange={(e) => updateStep(idx, { memo: e.target.value })}
                      />
                      {/* 설명 */}
                      {s.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">{s.description}</p>
                      )}
                      {/* 주의사항 */}
                      {s.caution && (
                        <div className="flex items-start gap-1 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                          <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                          {s.caution}
                        </div>
                      )}
                      {/* 스케줄 */}
                      {SCHEDULE_LABEL(s.schedule) && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={10} />
                          {SCHEDULE_LABEL(s.schedule)}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-slate-300 hover:text-red-400 shrink-0"
                      onClick={() => removeStep(idx)}
                    >
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* 템플릿 저장 옵션 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="save-template"
                  checked={saveAsTemplate}
                  onCheckedChange={(v) => setSaveAsTemplate(!!v)}
                />
                <Label htmlFor="save-template" className="text-xs text-slate-600 cursor-pointer">
                  이 계획을 템플릿으로 저장
                </Label>
              </div>
              {saveAsTemplate && (
                <Input
                  className="h-8 text-xs"
                  placeholder="템플릿 이름"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleClose}>
                취소
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs bg-violet-500 hover:bg-violet-600 text-white"
                onClick={handleApply}
                disabled={steps.length === 0 || saving}
              >
                {saving
                  ? <LoaderCircle size={13} className="animate-spin" />
                  : <CheckCircle2 size={13} />
                }
                처치 계획에 추가 ({steps.length}단계)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
