'use client'

import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { RefreshCw, Radiation, ScanLine, Heart, Scan, Sparkles, ExternalLink } from 'lucide-react'
import { SectionBlock } from './tab-ui'
import { toast } from 'sonner'
import { upsertCheckupSection } from '@/lib/actions/checkup/checkup-actions'
import {
  fetchPatientUltrasoundCharts,
  fetchUltrasoundOrganData,
  fetchPatientEchoCharts,
  fetchEchoChartResults,
  createLinkedSubChart,
  linkSubChartToCheckup,
  importEchoScanImagesToCheckup,
  type UltrasoundChartListItem,
  type UltrasoundOrganData,
  type EchoChartListItem,
} from '@/lib/actions/checkup/linked-chart-actions'
import { fillCheckupEchoFromChart } from '@/lib/actions/checkup/echo-chart-fill-action'
import type { CheckupSection, CheckupPatient } from '@/types/hospital/checkup-type'
import type { ExtractedImaging } from '@/lib/actions/checkup/pdf-extraction'
import {
  xrayCategories,
  thoraxMeasurements,
  interpretXrayMeasurement,
  type XrayCategoryId,
} from '@/constants/hospital/checkup/xray-ref'
import {
  echoCategories,
  echoMeasurements,
  interpretEchoMeasurement,
  SEVERITY_BG_ECHO,
  type EchoCategoryId,
} from '@/constants/hospital/checkup/echo-ref'
import {
  buildChartSummary,
  organSections,
} from '@/constants/hospital/ultrasound'
import type { Organ } from '@/constants/hospital/ultrasound/types'
import LinkedChartPanel, { type ChartListItem } from './linked-chart-panel'
import CheckupImageStrip from './checkup-image-strip'
import CheckupImageUploadDialog from './checkup-image-uploader/checkup-image-upload-dialog'
import { useCheckupImages } from '@/hooks/use-checkup-images'
import { Camera } from 'lucide-react'

// ── 저장 데이터 타입 ─────────────────────────────────────────

type XrayData = {
  checked: Record<string, boolean>
  notes: Record<XrayCategoryId, string>
  measurements: Record<string, string>   // vhs, vlas 등 수치 입력
}

type UltrasoundData = {
  chart_id: string | null
  organ_notes: Record<string, string>        // organ_name → 임상 소견 (AI 분석용)
  organ_notes_owner: Record<string, string>  // organ_name → 보호자 설명 (리포트 표시용)
}

type CtMriData = {
  notes: string
}

type EchoData = {
  checked: Record<string, boolean>
  notes: Record<EchoCategoryId, string>
  measurements: Record<string, string>
}

// ── Props ───────────────────────────────────────────────────

export interface Tab4Ref {
  save: () => Promise<void>
}

interface Props {
  checkupId: string
  hosId: string
  patientId: string
  patient: CheckupPatient
  checkupDate: string
  xraySection: CheckupSection | undefined
  ultrasoundSection: CheckupSection | undefined
  echoSection: CheckupSection | undefined
  ctMriSection: CheckupSection | undefined
  extractedImaging: ExtractedImaging | null
  subCharts: Record<string, string | null>
  onSubChartChange: (chartType: string, chartId: string | null) => void
  onDirty?: () => void
}

// ── 이미지 태그 매핑 ─────────────────────────────────────────

const XRAY_CAT_TAG: Record<XrayCategoryId, string> = {
  thorax:    'xray_thorax',
  abdomen:   'xray_abdomen',
  extremity: 'xray_extremity',
  skull:     'xray_skull',
  spine:     'xray_spine',
}

const ECHO_CAT_TAG: Record<EchoCategoryId, string> = {
  lv_systolic:   'echo_lv',
  lv_size:       'echo_lv',
  lv_myocardial: 'echo_lv',
  lv_diastolic:  'echo_lv',
  mitral_valve:  'echo_mv',
  left_atrium:   'echo_la',
  aortic_valve:  'echo_av',
  right_heart:   'echo_rv_ra',
  pulmonary_ht:  'echo_rv_ra',
  pericardium:   'echo_pericardium',
  overall:       'echo_overview',
}

// ── 심각도 배지 ──────────────────────────────────────────────

const SEVERITY_BG: Record<string, string> = {
  mild:     'bg-slate-100 text-slate-600',
  moderate: 'bg-amber-50  text-amber-700',
  severe:   'bg-red-50    text-red-700',
}

// ── 초기값 헬퍼 ──────────────────────────────────────────────

function initXrayData(section: CheckupSection | undefined): XrayData {
  const raw = (section?.data ?? {}) as Partial<XrayData>
  const emptyNotes = Object.fromEntries(
    xrayCategories.map((c) => [c.id, '']),
  ) as Record<XrayCategoryId, string>
  return {
    checked: (raw.checked ?? {}) as Record<string, boolean>,
    notes: { ...emptyNotes, ...(raw.notes ?? {}) },
    measurements: (raw.measurements ?? {}) as Record<string, string>,
  }
}

function initUltrasoundData(section: CheckupSection | undefined): UltrasoundData {
  const raw = (section?.data ?? {}) as Partial<UltrasoundData>
  return {
    chart_id: raw.chart_id ?? null,
    organ_notes: (raw.organ_notes ?? {}) as Record<string, string>,
    organ_notes_owner: (raw.organ_notes_owner ?? {}) as Record<string, string>,
  }
}

function initCtMriData(section: CheckupSection | undefined): CtMriData {
  const raw = (section?.data ?? {}) as Partial<CtMriData>
  return { notes: raw.notes ?? '' }
}

function initEchoData(section: CheckupSection | undefined): EchoData {
  const raw = (section?.data ?? {}) as Partial<EchoData>
  const emptyNotes = Object.fromEntries(
    echoCategories.map((c) => [c.id, '']),
  ) as Record<EchoCategoryId, string>
  return {
    checked: (raw.checked ?? {}) as Record<string, boolean>,
    notes: { ...emptyNotes, ...(raw.notes ?? {}) },
    measurements: (raw.measurements ?? {}) as Record<string, string>,
  }
}

// ── 장기 소견 텍스트 생성 ────────────────────────────────────

function buildOrganNotes(organsData: UltrasoundOrganData[]): {
  vet: Record<string, string>
  owner: Record<string, string>
} {
  const vet: Record<string, string> = {}
  const owner: Record<string, string> = {}

  for (const organ of organsData) {
    const vetLines: string[] = []
    const ownerLines: string[] = []
    const organKey = organ.organ_name

    if ((organ.status === 'abnormal' || organ.status === 'absent') && organ.findings_data) {
      const fd = organ.findings_data as Record<string, string | number>
      vetLines.push(...buildChartSummary(fd, 'ko', organKey as Organ, 'vet'))
      ownerLines.push(...buildChartSummary(fd, 'ko', organKey as Organ, 'owner'))
    } else if (organ.status === 'normal') {
      vetLines.push('특이적인 이상 소견이 관찰되지 않음')
      ownerLines.push('특이적인 이상 소견이 관찰되지 않습니다.')
    } else if (organ.status === 'not_examined') {
      vetLines.push('검사 불가')
      ownerLines.push('이번 검진에서는 검사하지 않았습니다.')
    }

    if (organ.organ_memo?.trim()) {
      const memo = organ.organ_memo.trim()
      vetLines.push(`(메모) ${memo}`)
      ownerLines.push(memo)
    }

    if (vetLines.length > 0) vet[organKey] = vetLines.join('\n')
    if (ownerLines.length > 0) owner[organKey] = ownerLines.join('\n')
  }

  return { vet, owner }
}

// ── 컴포넌트 ──────────────────────────────────────────────────

const Tab4Imaging = forwardRef<Tab4Ref, Props>(function Tab4Imaging({
  checkupId,
  hosId,
  patientId,
  patient,
  checkupDate,
  xraySection,
  ultrasoundSection,
  echoSection,
  ctMriSection,
  extractedImaging,
  subCharts,
  onSubChartChange,
  onDirty,
}, ref) {
  const { getByTags, reload: reloadImages } = useCheckupImages(checkupId)

  const [xray, setXray] = useState<XrayData>(() => initXrayData(xraySection))
  const [ultrasound, setUltrasound] = useState<UltrasoundData>(() =>
    initUltrasoundData(ultrasoundSection),
  )
  const [echo, setEcho] = useState<EchoData>(() => initEchoData(echoSection))
  const [ctMri, setCtMri] = useState<CtMriData>(() => initCtMriData(ctMriSection))

  const [usList, setUsList] = useState<UltrasoundChartListItem[]>([])
  const [echoList, setEchoList] = useState<EchoChartListItem[]>([])
  const [loadingOrgan, setLoadingOrgan] = useState(false)
  const [loadingEcho, setLoadingEcho] = useState(false)
  const [, setSaving] = useState(false)

  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) return
    onDirty?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xray, ultrasound, echo, ctMri])
  useEffect(() => { mountedRef.current = true }, [])

  useEffect(() => {
    fetchPatientUltrasoundCharts(patientId).then(setUsList)
    fetchPatientEchoCharts(patientId).then(setEchoList)
  }, [patientId])

  // PDF 추출 결과 → 방사선 소견 반영
  useEffect(() => {
    if (!extractedImaging) return
    const MAP: Record<XrayCategoryId, keyof ExtractedImaging> = {
      thorax:    'thorax_notes',
      abdomen:   'abdomen_notes',
      extremity: 'extremity_notes',
      skull:     'skull_notes',
      spine:     'spine_notes',
    }
    setXray((prev) => {
      const notes = { ...prev.notes }
      for (const cat of xrayCategories) {
        const text = extractedImaging[MAP[cat.id]] ?? ''
        if (text) notes[cat.id] = text
      }
      return { ...prev, notes }
    })
  }, [extractedImaging])

  // 장기 소견 로드
  const loadOrganNotes = async (chartId: string) => {
    try {
      setLoadingOrgan(true)
      const organsData = await fetchUltrasoundOrganData(chartId)
      const { vet, owner } = buildOrganNotes(organsData)
      setUltrasound((prev) => ({ ...prev, organ_notes: vet, organ_notes_owner: owner }))
    } catch {
      toast.error('장기 소견을 불러오지 못했습니다.')
    } finally {
      setLoadingOrgan(false)
    }
  }

  const handleUltrasoundLinkChange = async (chartId: string | null) => {
    onSubChartChange('ultrasound', chartId)
    setUltrasound((prev) => ({ ...prev, chart_id: chartId }))
    if (chartId) await loadOrganNotes(chartId)
  }

  const handleCreateUltrasoundChart = async () => {
    const chartId = await createLinkedSubChart({
      checkupId,
      chartType: 'ultrasound',
      hosId,
      patientId,
      patient,
      chartDate: checkupDate,
    })
    onSubChartChange('ultrasound', chartId)
    setUltrasound((prev) => ({ ...prev, chart_id: chartId }))
    const updated = await fetchPatientUltrasoundCharts(patientId)
    setUsList(updated)
    window.open(`/hospital/${hosId}/ultrasound/${checkupDate}/${chartId}`, '_blank')
  }

  const handleEchoLinkChange = async (chartId: string | null) => {
    onSubChartChange('echo', chartId)
    if (chartId) await linkSubChartToCheckup(checkupId, 'echo', chartId)
  }

  const handleImportEchoImages = async (chartId: string) => {
    const toastId = toast.loading('심장초음파 이미지를 가져오는 중...')
    try {
      const { imported, skipped } = await importEchoScanImagesToCheckup({
        echoChartId: chartId,
        checkupId,
        hosId,
      })
      if (imported === 0 && skipped > 0) {
        toast.info('이미 모든 이미지가 추가되어 있습니다.', { id: toastId })
      } else if (imported === 0) {
        toast.info('가져올 이미지가 없습니다.', { id: toastId })
      } else {
        toast.success(`${imported}장 추가됨${skipped > 0 ? ` (${skipped}장 중복 제외)` : ''}`, { id: toastId })
      }
    } catch {
      toast.error('이미지 가져오기 실패', { id: toastId })
    }
  }

  const handleFillEchoFromChart = async (chartId: string) => {
    setLoadingEcho(true)
    const toastId = toast.loading('심장초음파 결과를 불러오는 중...')
    try {
      const echoData = await fetchEchoChartResults(chartId)
      toast.loading('AI가 소견을 분석하는 중...', { id: toastId })
      const { data, error } = await fillCheckupEchoFromChart(echoData, speciesKey)
      if (error || !data) {
        toast.error(error ?? '분석 실패', { id: toastId })
        return
      }
      setEcho((prev) => ({
        checked: { ...prev.checked, ...data.checked },
        notes: { ...prev.notes, ...data.notes },
        measurements: { ...prev.measurements, ...data.measurements },
      }))
      toast.success('심장초음파 결과가 자동 입력되었습니다.', { id: toastId })
    } catch {
      toast.error('불러오기 실패', { id: toastId })
    } finally {
      setLoadingEcho(false)
    }
  }

  const toggleFinding = (findingId: string, checked: boolean, categoryId?: XrayCategoryId) => {
    setXray((prev) => {
      const next = { ...prev.checked, [findingId]: checked }
      if (checked && categoryId) {
        // 일반 소견 체크 → 해당 카테고리의 '정상' 해제
        delete next[`xray_normal_${categoryId}`]
      }
      return { ...prev, checked: next }
    })
  }

  const toggleNormal = (categoryId: XrayCategoryId, checked: boolean) => {
    setXray((prev) => {
      const next: Record<string, boolean> = {}
      // 해당 카테고리의 모든 기존 소견 해제
      const catFindingIds = new Set(
        xrayCategories.find((c) => c.id === categoryId)?.findings.map((f) => f.id) ?? [],
      )
      for (const [k, v] of Object.entries(prev.checked)) {
        if (!catFindingIds.has(k)) next[k] = v
      }
      if (checked) next[`xray_normal_${categoryId}`] = true
      return { ...prev, checked: next }
    })
  }

  const setXrayNote = (categoryId: XrayCategoryId, value: string) => {
    setXray((prev) => ({
      ...prev,
      notes: { ...prev.notes, [categoryId]: value },
    }))
  }

  const setMeasurement = (id: string, value: string) => {
    setXray((prev) => ({
      ...prev,
      measurements: { ...prev.measurements, [id]: value },
    }))
  }

  const toggleEchoFinding = (findingId: string, checked: boolean) => {
    setEcho((prev) => ({
      ...prev,
      checked: { ...prev.checked, [findingId]: checked },
    }))
  }

  const setEchoNote = (categoryId: EchoCategoryId, value: string) => {
    setEcho((prev) => ({
      ...prev,
      notes: { ...prev.notes, [categoryId]: value },
    }))
  }

  const setEchoMeasurement = (id: string, value: string) => {
    setEcho((prev) => ({
      ...prev,
      measurements: { ...prev.measurements, [id]: value },
    }))
  }

  const setOrganNote = (organName: string, value: string) => {
    setUltrasound((prev) => ({
      ...prev,
      organ_notes: { ...prev.organ_notes, [organName]: value },
      organ_notes_owner: { ...prev.organ_notes_owner, [organName]: value },
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await Promise.all([
        upsertCheckupSection({ checkupId, sectionType: 'xray', data: xray }),
        upsertCheckupSection({ checkupId, sectionType: 'ultrasound_basic', data: ultrasound }),
        upsertCheckupSection({ checkupId, sectionType: 'echo_basic', data: echo }),
        upsertCheckupSection({ checkupId, sectionType: 'ct_mri', data: ctMri }),
      ])
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({ save: handleSave }))

  const usChartItems: ChartListItem[] = usList.map((c) => ({
    id: c.id,
    chartDate: c.chartDate,
    previewText: c.impressionSummary,
  }))

  const echoChartItems: ChartListItem[] = echoList.map((c) => ({
    id: c.id,
    chartDate: c.chartDate,
    previewText: c.memo,
  }))

  const linkedUsId = subCharts['ultrasound'] ?? null
  const linkedEchoId = subCharts['echo'] ?? null

  // species 정규화 ('dog' | 'cat')
  const speciesKey: 'dog' | 'cat' = /^(cat|feline)$/i.test(patient.species) ? 'cat' : 'dog'

  const SEVERITY_BADGE: Record<string, string> = {
    mild:     'bg-amber-50 text-amber-700 border-amber-200',
    moderate: 'bg-orange-50 text-orange-700 border-orange-200',
    severe:   'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4">

      {/* ── 방사선 ─────────────────────────────────────── */}
      <SectionBlock icon={Radiation} title="방사선 (X-ray)" color="slate">
        <div className="flex flex-col gap-5">
          {xrayCategories.map((cat) => {
            const isNormal = !!xray.checked[`xray_normal_${cat.id}`]
            const checkedCount = cat.findings.filter((f) => xray.checked[f.id]).length
            return (
              <div key={cat.id}>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <div className="h-3.5 w-0.5 shrink-0 rounded-full bg-slate-400" />
                  <p className="text-xs font-bold text-slate-600">
                    {cat.label}
                    {isNormal && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-1.5 text-emerald-700">정상</span>
                    )}
                    {!isNormal && checkedCount > 0 && (
                      <span className="ml-2 rounded-full bg-teal-100 px-1.5 text-teal-700">
                        {checkedCount}
                      </span>
                    )}
                  </p>
                </div>

                <div className="mb-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                  {/* 정상 체크박스 */}
                  <label className={`flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5 text-xs ${isNormal ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'}`}>
                    <Checkbox
                      checked={isNormal}
                      onCheckedChange={(v) => toggleNormal(cat.id, !!v)}
                      className="h-3.5 w-3.5 shrink-0"
                    />
                    정상
                  </label>
                  {cat.findings.map((finding) => (
                    <label
                      key={finding.id}
                      className={`flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5 text-xs ${
                        xray.checked[finding.id]
                          ? SEVERITY_BG[finding.severity]
                          : 'text-slate-600'
                      }`}
                    >
                      <Checkbox
                        checked={!!xray.checked[finding.id]}
                        onCheckedChange={(v) => toggleFinding(finding.id, !!v, cat.id)}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      {finding.label}
                    </label>
                  ))}
                </div>

                {/* VHS / VLAS — 흉부 전용 계측 입력 */}
                {cat.id === 'thorax' && (
                  <div className="mb-2 rounded-md border border-slate-100 bg-slate-50 p-2">
                    <p className="mb-1.5 text-[11px] font-semibold text-slate-500">
                      심장 계측 (정상: VHS {speciesKey === 'cat' ? '7.5–9.0' : '8.5–10.5'} v &nbsp;/&nbsp; VLAS {speciesKey === 'cat' ? '< 2.0' : '< 2.3'} v)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {thoraxMeasurements.map((m) => {
                        const raw = xray.measurements[m.id] ?? ''
                        const num = parseFloat(raw)
                        const interp = !isNaN(num)
                          ? interpretXrayMeasurement(m, num, speciesKey)
                          : null
                        return (
                          <div key={m.id}>
                            <label className="mb-0.5 block text-[11px] font-medium text-slate-600">
                              {m.nameEn} ({m.nameKo})
                            </label>
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="number"
                                step="0.1"
                                value={raw}
                                onChange={(e) => setMeasurement(m.id, e.target.value)}
                                placeholder="—"
                                className="h-7 w-24 border-slate-200 text-xs"
                              />
                              <span className="text-[11px] text-slate-400">{m.unit}</span>
                              {interp && (
                                <span
                                  className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${
                                    interp.isAbnormal
                                      ? (SEVERITY_BADGE[interp.severity ?? 'mild'])
                                      : 'border-teal-200 bg-teal-50 text-teal-700'
                                  }`}
                                >
                                  {interp.resultTextKo}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <Textarea
                  value={xray.notes[cat.id] ?? ''}
                  onChange={(e) => setXrayNote(cat.id, e.target.value)}
                  placeholder={`${cat.label} 소견 직접 입력 또는 AI 추출 결과`}
                  className="min-h-[60px] resize-none text-xs"
                />
                {/* 방사선 이미지 썸네일 */}
                <div className="mt-1.5 flex items-center gap-2">
                  <CheckupImageUploadDialog
                    checkupId={checkupId}
                    hosId={hosId}
                    defaultTags={[XRAY_CAT_TAG[cat.id]]}
                    onClose={reloadImages}
                    trigger={
                      <button
                        type="button"
                        className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-teal-300 hover:text-teal-600"
                        title={`${cat.label} 사진 업로드`}
                      >
                        <Camera size={10} />
                        사진
                      </button>
                    }
                  />
                  <CheckupImageStrip
                    checkupId={checkupId}
                    images={getByTags([XRAY_CAT_TAG[cat.id]])}
                    onEdited={reloadImages}
                    maxVisible={6}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </SectionBlock>

      {/* ── 복부초음파 ──────────────────────────────────── */}
      <SectionBlock
        icon={ScanLine}
        title="복부 초음파"
        color="cyan"
        action={
          <div className="flex items-center gap-2">
            {linkedUsId && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-white/80 hover:bg-white/20 hover:text-white"
                onClick={() => loadOrganNotes(linkedUsId)}
                disabled={loadingOrgan}
              >
                <RefreshCw size={11} className={`mr-1 ${loadingOrgan ? 'animate-spin' : ''}`} />
                결과 불러오기
              </Button>
            )}
            <LinkedChartPanel
              label="초음파 차트"
              chartType="ultrasound"
              checkupId={checkupId}
              charts={usChartItems}
              linkedChartId={linkedUsId}
              buildChartUrl={(id, date) => `/hospital/${hosId}/ultrasound/${date}/${id}`}
              onLinkChange={handleUltrasoundLinkChange}
              onCreateNew={handleCreateUltrasoundChart}
            />
          </div>
        }
      >
        {/* 장기별 textarea */}
        <div className="flex flex-col gap-3">
          {/* 초음파 전체 이미지 */}
          {getByTags(['ultrasound']).length > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 p-2">
              <p className="shrink-0 text-[11px] font-medium text-slate-500">초음파</p>
              <CheckupImageStrip checkupId={checkupId} images={getByTags(['ultrasound'])} onEdited={reloadImages} maxVisible={6} />
            </div>
          )}
          {organSections.map((section) => {
            const organTag = `organ_${section.organ}`
            const organImgs = getByTags([organTag])
            return (
              <div key={section.organ}>
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-xs font-medium text-slate-600">{section.organNameKo}</p>
                  <CheckupImageUploadDialog
                    checkupId={checkupId}
                    hosId={hosId}
                    defaultTags={[organTag]}
                    onClose={reloadImages}
                    trigger={
                      <button
                        type="button"
                        className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-white px-1.5 py-0 text-[10px] text-slate-400 transition-colors hover:border-teal-300 hover:text-teal-600"
                      >
                        <Camera size={9} />
                      </button>
                    }
                  />
                  {organImgs.length > 0 && (
                    <CheckupImageStrip checkupId={checkupId} images={organImgs} onEdited={reloadImages} maxVisible={4} />
                  )}
                </div>
                <Textarea
                  value={ultrasound.organ_notes[section.organ] ?? ''}
                  onChange={(e) => setOrganNote(section.organ, e.target.value)}
                  placeholder={`${section.organNameKo} 소견`}
                  className="min-h-[56px] resize-none text-xs"
                />
              </div>
            )
          })}
        </div>
      </SectionBlock>

      {/* ── 심장초음파 ────────────────────────────────── */}
      <SectionBlock
        icon={Heart}
        title="심장초음파 (Echocardiography)"
        color="rose"
        action={
          <div className="flex items-center gap-2">
            {linkedEchoId && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-white/80 hover:bg-white/20 hover:text-white gap-1"
                  onClick={() => handleFillEchoFromChart(linkedEchoId)}
                  disabled={loadingEcho}
                >
                  {loadingEcho
                    ? <RefreshCw size={11} className="animate-spin" />
                    : <Sparkles size={11} />}
                  AI 자동 입력
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-white/80 hover:bg-white/20 hover:text-white gap-1"
                  onClick={() => handleImportEchoImages(linkedEchoId)}
                >
                  <ScanLine size={11} />
                  이미지 가져오기
                </Button>
                <a
                  href={`/hospital/${hosId}/echocardio/${echoList.find(c => c.id === linkedEchoId)?.chartDate ?? ''}/${linkedEchoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-white/80 hover:bg-white/20 hover:text-white"
                >
                  <ExternalLink size={11} />
                  차트 열기
                </a>
              </>
            )}
            <LinkedChartPanel
              label="심장초음파 차트"
              chartType="echo"
              checkupId={checkupId}
              charts={echoChartItems}
              linkedChartId={linkedEchoId}
              buildChartUrl={(id, date) => `/hospital/${hosId}/echocardio/${date}/${id}`}
              onLinkChange={handleEchoLinkChange}
              onCreateNew={async () => {
                const chartId = await createLinkedSubChart({
                  checkupId,
                  chartType: 'echo',
                  hosId,
                  patientId,
                  patient,
                  chartDate: checkupDate,
                })
                onSubChartChange('echo', chartId)
                const updated = await fetchPatientEchoCharts(patientId)
                setEchoList(updated)
                window.open(`/hospital/${hosId}/echocardio/${checkupDate}/${chartId}`, '_blank')
              }}
            />
          </div>
        }
      >
        {/* 소견 체크박스 */}
        <div className="flex flex-col gap-5">
          {echoCategories.map((cat) => {
            const checkedCount = cat.findings.filter((f) => echo.checked[f.id]).length
            return (
              <div key={cat.id}>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <div className="h-3.5 w-0.5 shrink-0 rounded-full bg-rose-400" />
                  <p className="text-xs font-bold text-slate-600">
                    {cat.label}
                    {checkedCount > 0 && (
                      <span className="ml-2 rounded-full bg-teal-100 px-1.5 text-teal-700">
                        {checkedCount}
                      </span>
                    )}
                  </p>
                </div>

                <div className="mb-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                  {cat.findings.map((finding) => (
                    <label
                      key={finding.id}
                      className={`flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5 text-xs ${
                        echo.checked[finding.id]
                          ? SEVERITY_BG_ECHO[finding.severity]
                          : 'text-slate-600'
                      }`}
                    >
                      <Checkbox
                        checked={!!echo.checked[finding.id]}
                        onCheckedChange={(v) => toggleEchoFinding(finding.id, !!v)}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      {finding.label}
                    </label>
                  ))}
                </div>

                <Textarea
                  value={echo.notes[cat.id] ?? ''}
                  onChange={(e) => setEchoNote(cat.id, e.target.value)}
                  placeholder={`${cat.label} 소견 메모`}
                  className="min-h-[48px] resize-none text-xs"
                />
                {/* Echo 이미지 썸네일 */}
                <div className="mt-1.5 flex items-center gap-2">
                  <CheckupImageUploadDialog
                    checkupId={checkupId}
                    hosId={hosId}
                    defaultTags={[ECHO_CAT_TAG[cat.id]]}
                    onClose={reloadImages}
                    trigger={
                      <button
                        type="button"
                        className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-rose-300 hover:text-rose-500"
                        title={`${cat.label} 사진 업로드`}
                      >
                        <Camera size={10} />
                        사진
                      </button>
                    }
                  />
                  <CheckupImageStrip
                    checkupId={checkupId}
                    images={getByTags([ECHO_CAT_TAG[cat.id]])}
                    onEdited={reloadImages}
                    maxVisible={6}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* 계측 수치 입력 */}
        <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-3">
          <p className="mb-2 text-[11px] font-semibold text-slate-500">심장초음파 계측 수치</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {echoMeasurements.map((m) => {
              const raw = echo.measurements[m.id] ?? ''
              const num = parseFloat(raw)
              const interp = !isNaN(num) ? interpretEchoMeasurement(m, num, speciesKey) : null
              const refRange = m.defaultRefRange[speciesKey]
              return (
                <div key={m.id}>
                  <label className="mb-0.5 block text-[11px] font-medium text-slate-600">
                    {m.nameEn}
                    <span className="ml-1 font-normal text-slate-400">({m.nameKo})</span>
                    {m.speciesNote && (
                      <span className="ml-1 text-[10px] text-teal-600">[{m.speciesNote}]</span>
                    )}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      step="0.01"
                      value={raw}
                      onChange={(e) => setEchoMeasurement(m.id, e.target.value)}
                      placeholder="—"
                      className="h-7 w-24 border-slate-200 text-xs"
                    />
                    {m.unit && <span className="text-[11px] text-slate-400">{m.unit}</span>}
                    <span className="text-[10px] text-slate-400">정상: {refRange}</span>
                    {interp && (
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${
                          interp.isAbnormal
                            ? (SEVERITY_BADGE[interp.severity ?? 'mild'])
                            : 'border-teal-200 bg-teal-50 text-teal-700'
                        }`}
                      >
                        {interp.resultTextKo}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </SectionBlock>

      {/* ── CT / MRI / 내시경 ──────────────────────────── */}
      <SectionBlock icon={Scan} title="CT / MRI / 내시경" color="violet">
        <Textarea
          value={ctMri.notes}
          onChange={(e) => setCtMri({ notes: e.target.value })}
          placeholder="CT, MRI, 내시경 소견 자유 입력"
          className="min-h-[100px] resize-none text-sm"
        />
      </SectionBlock>

        </div>
      </div>
    </div>
  )
})

export default Tab4Imaging
