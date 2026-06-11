import type React from 'react'
import { AlertCircle, CheckCircle2, Microscope, Activity, FileText, FlaskConical, ExternalLink, Bone } from 'lucide-react'
import type { LabResultItem } from '@/constants/hospital/checkup/lab-types'
import type { ResolvedOrganSection, DxEvaluation } from '@/lib/config/checkup-report-modules'
import { isDxEvaluation, SEVERITY_BADGE } from './report-utils'
import { SectionTitle } from './report-ui'
import CheckupImgCard from './checkup-img-card'
import type { SkinLesion } from '@/types/hospital/checkup-type'

export interface BasicFinding {
  id: string
  nameKo: string
  value: string
  isAbnormal: boolean
  eye?: 'OD' | 'OS'
}

// ── 상태별 스타일 (파스텔 톤) ─────────────────────────────────

const DX_STATUS_STYLE: Record<DxEvaluation['status'], {
  badge: string; action: string;
  headerGradient: string; cardBorder: string;
  headerText: string; headerSubText: string;
  countBadge: string;
}> = {
  normal:   {
    badge: 'bg-emerald-100 text-emerald-700',
    action: 'bg-emerald-50 border-emerald-200',
    headerGradient: 'from-teal-500 to-emerald-400', cardBorder: 'border-teal-200',
    headerText: 'text-white',   headerSubText: 'text-white/80',
    countBadge: 'bg-white/90 text-teal-700',
  },
  mild:     {
    badge: 'bg-amber-100 text-amber-700',
    action: 'bg-amber-50 border-amber-200',
    headerGradient: 'from-amber-500 to-yellow-400', cardBorder: 'border-amber-200',
    headerText: 'text-white',   headerSubText: 'text-white/80',
    countBadge: 'bg-white/90 text-amber-700',
  },
  moderate: {
    badge: 'bg-orange-100 text-orange-700',
    action: 'bg-orange-50 border-orange-200',
    headerGradient: 'from-orange-500 to-amber-400', cardBorder: 'border-orange-200',
    headerText: 'text-white',   headerSubText: 'text-white/80',
    countBadge: 'bg-white/90 text-orange-700',
  },
  severe:   {
    badge: 'bg-red-100 text-red-700',
    action: 'bg-red-50 border-red-200',
    headerGradient: 'from-red-500 to-rose-400',    cardBorder: 'border-red-200',
    headerText: 'text-white',   headerSubText: 'text-white/80',
    countBadge: 'bg-white/90 text-red-700',
  },
}

const DX_STATUS_LABEL: Record<DxEvaluation['status'], string> = {
  normal: '정상', mild: '경도 이상', moderate: '중등도 이상', severe: '중증 이상',
}

// ── 개별 검사항목 카드 ─────────────────────────────────────────

function LabItemCard({ item }: { item: LabResultItem }) {
  const badgeClass = item.is_abnormal
    ? item.severity ? SEVERITY_BADGE[item.severity] : 'bg-red-100 text-red-700'
    : 'bg-emerald-100 text-emerald-700'
  const badgeText = item.result_text ?? (item.is_abnormal ? '이상' : '정상')
  const borderColor = item.is_abnormal ? 'border-amber-200' : 'border-slate-200'
  const bgColor     = item.is_abnormal ? 'bg-amber-50/60' : 'bg-white'

  return (
    <div className={`flex flex-col gap-2 rounded-[10px] border p-4 ${borderColor} ${bgColor}`}>

      {/* 이름 + 배지 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight text-slate-800">{item.nameEn || item.nameKo}</p>
          {item.nameEn && item.nameKo && (
            <p className="mt-0.5 text-xs text-slate-400">{item.nameKo}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
          {badgeText}
        </span>
      </div>

      {/* 결과값 + 참고범위 */}
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-lg font-bold text-slate-900">{item.value ?? '—'}</span>
        {item.unit && <span className="text-xs text-slate-400">{item.unit}</span>}
        {item.ref_range && (
          <span className="ml-auto shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            참고: {item.ref_range}
          </span>
        )}
      </div>

      {/* 이상 코멘트 */}
      {item.is_abnormal && item.comment && (
        <p className="text-xs leading-relaxed text-amber-700">{item.comment}</p>
      )}

      {/* 검사 설명 (descriptionKo) */}
      {item.descriptionKo && (
        <p className="border-t border-slate-100 pt-2 text-xs leading-relaxed text-slate-500">
          {item.descriptionKo}
        </p>
      )}
    </div>
  )
}

// ── 소제목 ────────────────────────────────────────────────────

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">{children}</p>
  )
}

// ── 근골격계 관절 소견 블록 ───────────────────────────────────

const LIMB_LABEL: Record<string, string> = {
  '우전지 (RF)': 'RF', '좌전지 (LF)': 'LF', '우후지 (RH)': 'RH', '좌후지 (LH)': 'LH',
}

type EvalEntry = { findings: string[]; note?: string }

function parseJointEvalMap(json: string): Record<string, EvalEntry> {
  try {
    const raw = JSON.parse(json || '{}')
    const result: Record<string, EvalEntry> = {}
    for (const [k, v] of Object.entries(raw)) {
      result[k] = Array.isArray(v)
        ? { findings: v as string[], note: '' }
        : { findings: (v as EvalEntry).findings ?? [], note: (v as EvalEntry).note ?? '' }
    }
    return result
  } catch { return {} }
}

function MusculoskeletalJointBlock({ extraData }: { extraData: Record<string, unknown> }) {
  const gait = (extraData['gait'] as string) || ''
  const lamenessGrade = (extraData['lameness_grade'] as string) || ''
  const lamenessLimbRaw = (extraData['lameness_limb'] as string) || ''
  const limbList = lamenessLimbRaw ? lamenessLimbRaw.split(',').map((l) => l.trim()).filter(Boolean) : []

  const affectedRaw = (extraData['joint_affected'] as string) || ''
  const selectedJoints = affectedRaw ? affectedRaw.split(',').map((j) => j.trim()).filter(Boolean) : []
  const evalJsonRaw = (extraData['joint_eval_json'] as string) || ''
  const evalMap = parseJointEvalMap(evalJsonRaw)

  const hasGaitData = !!gait
  const hasJointData = selectedJoints.length > 0

  if (!hasGaitData && !hasJointData) return null

  const isLameness = gait === '파행 (Lameness)'
  const isAbnormalGait = gait && gait !== '정상'

  return (
    <div className="flex flex-col gap-3">
      {/* 보행 */}
      {hasGaitData && (
        <div className={`flex flex-wrap items-center gap-2 rounded-[10px] border px-3 py-2 ${isAbnormalGait ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <Activity size={12} className={isAbnormalGait ? 'shrink-0 text-amber-500' : 'shrink-0 text-emerald-500'} strokeWidth={2} />
          <span className={`text-xs font-semibold ${isAbnormalGait ? 'text-amber-700' : 'text-emerald-700'}`}>보행</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isAbnormalGait ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>{gait}</span>
          {isLameness && lamenessGrade && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{lamenessGrade}</span>
          )}
          {isLameness && limbList.length > 0 && limbList.map((l) => (
            <span key={l} className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">{LIMB_LABEL[l] ?? l}</span>
          ))}
        </div>
      )}

      {/* 관절 소견 */}
      {hasJointData && (
        <div className="overflow-hidden rounded-[10px] border border-indigo-200">
          <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-400 px-3 py-2">
            <Bone size={12} className="text-white/80" strokeWidth={2} />
            <p className="text-xs font-bold text-white">관절 소견</p>
            <span className="ml-auto rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">{selectedJoints.length}개 관절</span>
          </div>
          <div className="divide-y divide-slate-100 bg-white">
            {selectedJoints.map((joint) => {
              const entry = evalMap[joint] ?? { findings: [], note: '' }
              const { findings, note } = entry
              return (
                <div key={joint} className={`px-3 py-2 ${findings.length > 0 ? 'bg-amber-50/60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      {findings.length > 0
                        ? <AlertCircle size={11} className="mt-0.5 shrink-0 text-amber-500" strokeWidth={2} />
                        : <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-emerald-400" strokeWidth={2} />
                      }
                      <span className="text-xs font-semibold text-slate-700">{joint}</span>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1">
                      {findings.length === 0
                        ? <span className="text-[11px] text-slate-400">이상 없음</span>
                        : findings.map((f) => (
                          <span key={f} className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">{f}</span>
                        ))
                      }
                    </div>
                  </div>
                  {note && <p className="mt-1 pl-4 text-[11px] text-slate-500">{note}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 피부·귀 전용 블록 ─────────────────────────────────────────

type CheckupImageItem = { id: string; img_url: string; tags: string[]; img_memo?: string | null; mark?: Record<string, unknown> | null; is_cover?: boolean }

function DermaBlock({ extraData, images, checkupId, isShared }: {
  extraData: Record<string, unknown>
  images: CheckupImageItem[]
  checkupId?: string
  isShared?: boolean
}) {
  const lesions: SkinLesion[] = (() => {
    try { return JSON.parse((extraData.skin_lesions_json as string) || '[]') } catch { return [] }
  })()

  const odFindings: string[] = (() => { try { return JSON.parse((extraData.ear_od_findings as string) || '[]') } catch { return [] } })()
  const osFindings: string[] = (() => { try { return JSON.parse((extraData.ear_os_findings as string) || '[]') } catch { return [] } })()
  const odDischarge = (extraData.ear_od_discharge as string) || ''
  const osDischarge = (extraData.ear_os_discharge as string) || ''
  const earNotes = (extraData.ear_notes as string) || ''
  const coatCondition = (extraData.coat_condition as string) || ''
  const parasite = (extraData.parasite as string) || ''

  const hasLesions = lesions.length > 0
  const hasEar = odFindings.length > 0 || osFindings.length > 0 || earNotes
  const hasCoat = coatCondition || parasite

  if (!hasLesions && !hasEar && !hasCoat) return null

  return (
    <div className="flex flex-col gap-4">
      {/* 피모·기생충 */}
      {hasCoat && (
        <div className="flex flex-wrap gap-2">
          {coatCondition && (
            <div className={`flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 ${
              coatCondition.includes('정상') ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
            }`}>
              {coatCondition.includes('정상')
                ? <CheckCircle2 size={12} className="shrink-0 text-emerald-500" strokeWidth={2} />
                : <AlertCircle size={12} className="shrink-0 text-amber-500" strokeWidth={2} />
              }
              <span className={`text-xs font-semibold ${coatCondition.includes('정상') ? 'text-emerald-700' : 'text-amber-700'}`}>피모</span>
              <span className="text-xs text-slate-600">{coatCondition}</span>
            </div>
          )}
          {parasite && (
            <div className={`flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 ${
              parasite === '없음' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
            }`}>
              {parasite === '없음'
                ? <CheckCircle2 size={12} className="shrink-0 text-emerald-500" strokeWidth={2} />
                : <AlertCircle size={12} className="shrink-0 text-amber-500" strokeWidth={2} />
              }
              <span className={`text-xs font-semibold ${parasite === '없음' ? 'text-emerald-700' : 'text-amber-700'}`}>기생충</span>
              <span className="text-xs text-slate-600">{parasite}</span>
            </div>
          )}
        </div>
      )}

      {/* 피부 병변 카드 */}
      {hasLesions && (
        <div>
          <SubHeading>피부 병변 ({lesions.length}개)</SubHeading>
          <div className="flex flex-col gap-2">
            {lesions.map((lesion, i) => {
              const lesionImages = images.filter((img) => img.tags?.includes(`skin_lesion_${lesion.id}`))
              return (
                <div key={lesion.id} className="overflow-hidden rounded-[10px] border border-amber-100 bg-amber-50">
                  <div className="flex gap-0">
                    {/* 왼쪽: 병변 이미지 */}
                    {lesionImages.length > 0 && (
                      <div className="flex shrink-0 flex-col gap-1 bg-amber-100/60 p-2">
                        {lesionImages.map((img) => (
                          <CheckupImgCard
                            key={img.img_url}
                            img={img}
                            checkupId={checkupId ?? ''}
                            isShared={isShared}
                            className="h-28 w-28 rounded-md object-cover"
                          />
                        ))}
                      </div>
                    )}

                    {/* 오른쪽: 소견 */}
                    <div className="flex flex-1 flex-col justify-center px-4 py-3">
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">병변 {i + 1}</span>
                        {lesion.location && <span className="text-xs text-slate-600">{lesion.location}</span>}
                        {lesion.distribution && <span className="text-[11px] text-slate-400">{lesion.distribution}</span>}
                        {lesion.size_mm && <span className="text-[11px] text-slate-400">{lesion.size_mm}mm</span>}
                      </div>
                      {lesion.types.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {lesion.types.map((t) => (
                            <span key={t} className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">{t}</span>
                          ))}
                        </div>
                      )}
                      {lesion.notes && <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{lesion.notes}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 귀 검사 */}
      {hasEar && (
        <div>
          <SubHeading>귀 검사</SubHeading>
          <div className="grid grid-cols-2 gap-3">
            {([
              { label: '우이 (OD)', findings: odFindings, discharge: odDischarge, tagKey: 'ear_od' as const },
              { label: '좌이 (OS)', findings: osFindings, discharge: osDischarge, tagKey: 'ear_os' as const },
            ]).map(({ label, findings, discharge, tagKey }) => {
              const earImgs = images.filter((img) => img.tags?.includes(tagKey))
              return (
                <div key={label} className="rounded-[10px] border border-slate-100 bg-slate-50 p-3">
                  <p className="mb-1.5 text-xs font-bold text-slate-500">{label}</p>
                  {/* 귀 사진 */}
                  {earImgs.length > 0 && (
                    <div className="mb-2 grid grid-cols-3 gap-1">
                      {earImgs.map((img) => (
                        <CheckupImgCard
                          key={img.img_url}
                          img={img}
                          checkupId={checkupId ?? ''}
                          isShared={isShared}
                          className="aspect-square w-full rounded-md object-cover"
                        />
                      ))}
                    </div>
                  )}
                  {findings.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {findings.map((f) => (
                        <div
                          key={f}
                          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 ${
                            f === '정상' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
                          }`}
                        >
                          {f === '정상'
                            ? <CheckCircle2 size={10} className="shrink-0 text-emerald-500" strokeWidth={2} />
                            : <AlertCircle size={10} className="shrink-0 text-amber-500" strokeWidth={2} />
                          }
                          <span className={`text-xs ${f === '정상' ? 'text-emerald-700' : 'text-amber-700'}`}>{f}</span>
                        </div>
                      ))}
                      {discharge && (
                        <p className="mt-0.5 text-[11px] text-slate-500">삼출물: {discharge}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300">소견 없음</p>
                  )}
                </div>
              )
            })}
          </div>
          {earNotes && <p className="mt-2 text-xs leading-relaxed text-slate-600">{earNotes}</p>}
        </div>
      )}
    </div>
  )
}

// ── 계통별 소견 카드 ───────────────────────────────────────────

interface OrganCardProps {
  section: ResolvedOrganSection
  subCharts?: Record<string, string | null>
  dentalBasicFindings?: BasicFinding[]
  ophthalmicBasicFindings?: BasicFinding[]
  checkupId?: string
  isShared?: boolean
}

function OrganCard({ section, subCharts, dentalBasicFindings, ophthalmicBasicFindings, checkupId, isShared }: OrganCardProps) {
  const abnormalItems = section.labItems.filter((i) => i.is_abnormal)
  const hasImages = section.images.length > 0
  const eval_  = section.aiEval
  const isDx   = isDxEvaluation(eval_)
  const hasAi  = isDx ? !!eval_.summary : !!(eval_ as string)

  const isOphthalmic = section.key === 'ophthalmic'
  const isOral = section.key === 'oral'
  const isDerma = section.key === 'derma'
  const isMusculoskeletal = section.key === 'musculoskeletal'

  // 상태 결정 — Dx 평가가 없을 때는 이상 항목 여부로 자동 추정
  // derma: lab 항목 없으므로 extraData(병변·귀·피모)로 이상 여부 판단
  const dermaHasFindings = isDerma && (() => {
    if (!section.extraData) return false
    const d = section.extraData as Record<string, string>
    const lesions: unknown[] = (() => { try { return JSON.parse(d.skin_lesions_json || '[]') } catch { return [] } })()
    if (lesions.length > 0) return true
    const odFindings: string[] = (() => { try { return JSON.parse(d.ear_od_findings || '[]') } catch { return [] } })()
    const osFindings: string[] = (() => { try { return JSON.parse(d.ear_os_findings || '[]') } catch { return [] } })()
    const hasEarAbnormal = [...odFindings, ...osFindings].some((f) => f !== '정상')
    if (hasEarAbnormal) return true
    const coatAbnormal = d.coat_condition && !d.coat_condition.includes('정상')
    const parasiteAbnormal = d.parasite && d.parasite !== '없음'
    return !!(coatAbnormal || parasiteAbnormal)
  })()
  const statusKey: DxEvaluation['status'] = isDx
    ? eval_.status
    : (abnormalItems.length > 0 || dermaHasFindings) ? 'mild' : 'normal'
  const style = DX_STATUS_STYLE[statusKey]
  const topImageUrls = new Set<string>()
  const odImages = isOphthalmic ? section.images.filter((img) => img.tags?.includes('ophthalmic_od')) : []
  const osImages = isOphthalmic ? section.images.filter((img) => img.tags?.includes('ophthalmic_os')) : []
  const oralImages = isOral ? section.images : []
  if (isOphthalmic) { odImages.forEach((img) => topImageUrls.add(img.img_url)); osImages.forEach((img) => topImageUrls.add(img.img_url)) }
  if (isOral) { oralImages.forEach((img) => topImageUrls.add(img.img_url)) }

  // 장기 단독 이미지: organ_* 태그가 있고 ultrasound / xray* 태그가 없는 이미지
  // derma는 DermaBlock에서 직접 렌더링하므로 여기서 제외
  const organOnlyImages = (!isOphthalmic && !isOral && !isDerma)
    ? section.images.filter((img) =>
        img.tags?.some((t) => t.startsWith('organ_')) &&
        !img.tags?.includes('ultrasound') &&
        !img.tags?.some((t) => t.startsWith('xray')),
      )
    : []
  organOnlyImages.forEach((img) => topImageUrls.add(img.img_url))
  // derma: 모든 이미지를 topImageUrls에 등록 → 하단 remainingImages 중복 방지
  if (isDerma) section.images.forEach((img) => topImageUrls.add(img.img_url))

  return (
    <div id={`organ-${section.key}`} className={`break-inside-avoid overflow-hidden rounded-[10px] border shadow-sm ${style.cardBorder}`}>

      {/* ── 헤더 (그라데이션) ── */}
      <div className={`flex items-center justify-between gap-3 bg-gradient-to-r px-3 py-2.5 sm:px-5 sm:py-4 ${style.headerGradient}`}>
        <div className="flex min-w-0 flex-col">
          <h3 className={`text-base font-bold ${style.headerText}`}>{section.label}</h3>
          {isDx && eval_.summary && (
            <p className={`mt-0.5 text-xs leading-relaxed ${style.headerSubText}`}>{eval_.summary}</p>
          )}
          {!hasAi && (
            <p className="mt-0.5 text-xs text-white/60">* 종합 소견 미작성</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {isDx && (
            <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${style.badge}`}>
              {DX_STATUS_LABEL[eval_.status]}
            </span>
          )}
          <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${style.countBadge}`}>
            {abnormalItems.length > 0 ? `이상 ${abnormalItems.length}건` : '이상 없음'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3 sm:gap-6 sm:p-5">

        {/* 안과 — 우안(OD) / 좌안(OS) 2컬럼 */}
        {isOphthalmic && (
          <div className="grid grid-cols-2 gap-4">
            {(['od', 'os'] as const).map((side) => {
              const imgs = side === 'od' ? odImages : osImages
              const sideLabel = side === 'od' ? '우안 (OD)' : '좌안 (OS)'
              const sideFindings = (ophthalmicBasicFindings ?? []).filter((f) =>
                f.eye ? f.eye === (side === 'od' ? 'OD' : 'OS') : f.id.endsWith(`_${side}`),
              )
              return (
                <div key={side} className="rounded-[10px] border border-slate-100 bg-slate-50 p-3 flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{sideLabel}</p>

                  {/* 사진 */}
                  {imgs.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      {imgs.map((img) => (
                        <CheckupImgCard key={img.img_url} img={img} checkupId={checkupId ?? ''} isShared={isShared} className="aspect-square w-full rounded-md object-cover" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300">사진 없음</p>
                  )}

                  {/* 소견 */}
                  {sideFindings.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {sideFindings.map((f) => (
                        <div
                          key={f.id}
                          className={`flex items-start gap-1.5 rounded-md border px-2.5 py-1.5 ${f.isAbnormal ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}
                        >
                          {f.isAbnormal
                            ? <AlertCircle size={11} className="mt-0.5 shrink-0 text-amber-500" strokeWidth={2} />
                            : <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-emerald-500" strokeWidth={2} />
                          }
                          <div className="min-w-0">
                            <span className={`text-xs font-semibold ${f.isAbnormal ? 'text-amber-700' : 'text-emerald-700'}`}>{f.nameKo.replace(/\s*\(우안\)|\s*\(좌안\)/g, '')}</span>
                            <span className="ml-1 text-xs text-slate-600">{f.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 구강 이미지 */}
        {isOral && oralImages.length > 0 && (
          <div>
            <SubHeading>구강 사진</SubHeading>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {oralImages.map((img) => (
                <CheckupImgCard key={img.img_url} img={img} checkupId={checkupId ?? ''} isShared={isShared} />
              ))}
            </div>
          </div>
        )}

        {/* 구강: 전문 차트 연동 여부에 따른 소견 */}
        {isOral && (
          subCharts?.dental
            ? (
              <div className="flex items-center gap-2 rounded-[10px] border border-sky-200 bg-sky-50 px-4 py-3">
                <ExternalLink size={14} className="shrink-0 text-sky-500" />
                <p className="text-sm font-medium text-sky-700">치과 전문 리포트 참조 — 별도 첨부된 치과 검진 리포트를 확인하세요.</p>
              </div>
            )
            : dentalBasicFindings && dentalBasicFindings.length > 0 && (
              <div>
                <SubHeading>치과 기본 소견</SubHeading>
                <div className="flex flex-wrap gap-2">
                  {dentalBasicFindings.map((f) => (
                    <div
                      key={f.id}
                      className={`flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 ${f.isAbnormal ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}
                    >
                      {f.isAbnormal
                        ? <AlertCircle size={12} className="shrink-0 text-amber-500" strokeWidth={2} />
                        : <CheckCircle2 size={12} className="shrink-0 text-emerald-500" strokeWidth={2} />
                      }
                      <span className={`text-xs font-semibold ${f.isAbnormal ? 'text-amber-700' : 'text-emerald-700'}`}>{f.nameKo}</span>
                      <span className="text-xs text-slate-600">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
        )}

        {/* 안과: 전문 차트 연동 배너 */}
        {isOphthalmic && subCharts?.ophthalmic && (
          <div className="flex items-center gap-2 rounded-[10px] border border-sky-200 bg-sky-50 px-4 py-3">
            <ExternalLink size={14} className="shrink-0 text-sky-500" />
            <p className="text-sm font-medium text-sky-700">안과 전문 리포트 참조 — 별도 첨부된 안과 검진 리포트를 확인하세요.</p>
          </div>
        )}

        {/* 신체검사 소견 (oral/ophthalmic/derma 제외: 별도 블록으로 처리) */}
        {section.physicalFindings.length > 0 && !isOral && !isOphthalmic && !isDerma && (
          <div>
            <SubHeading>신체검사 소견</SubHeading>
            <div className="flex flex-wrap gap-2">
              {section.physicalFindings.map((f) => (
                <div
                  key={f.id}
                  className={`flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 ${f.isAbnormal ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}
                >
                  {f.isAbnormal
                    ? <AlertCircle size={12} className="shrink-0 text-amber-500" strokeWidth={2} />
                    : <CheckCircle2 size={12} className="shrink-0 text-emerald-500" strokeWidth={2} />
                  }
                  <span className={`text-xs font-semibold ${f.isAbnormal ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {f.nameKo}
                  </span>
                  <span className="text-xs text-slate-600">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 근골격계 관절 소견 */}
        {isMusculoskeletal && section.extraData && (
          <MusculoskeletalJointBlock extraData={section.extraData} />
        )}

        {/* 피부·귀 전용 렌더링 */}
        {isDerma && section.extraData && (
          <DermaBlock extraData={section.extraData} images={section.images} checkupId={checkupId} isShared={isShared} />
        )}

        {/* 혈액·임상병리 검사 결과 카드 */}
        {section.labItems.length > 0 && (
          <div>
            <div className="mb-2.5 flex items-center gap-1.5">
              <FlaskConical size={13} className="text-slate-400" strokeWidth={2} />
              <SubHeading>임상병리 검사 결과</SubHeading>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {section.labItems.map((item) => (
                <LabItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* 장기 단독 이미지 (modality 태그 없이 organ_* 태그만 있는 이미지) */}
        {organOnlyImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {organOnlyImages.map((img) => (
              <CheckupImgCard key={img.img_url} img={img} checkupId={checkupId ?? ''} isShared={isShared} />
            ))}
          </div>
        )}

        {/* 방사선 이미지 → 방사선 소견 순으로 묶음 */}
        {(() => {
          const xrayImages = section.images.filter((img) =>
            img.tags?.some((t) => t.startsWith('xray')),
          )
          const hasXray = xrayImages.length > 0 || section.xrayFindings.length > 0
          if (!hasXray) return null
          return (
            <div className="flex flex-col gap-3">
              {xrayImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {xrayImages.map((img) => (
                    <CheckupImgCard key={img.img_url} img={img} checkupId={checkupId ?? ''} isShared={isShared} />
                  ))}
                </div>
              )}
              {section.xrayFindings.length > 0 && (
                <div>
                  <SubHeading>방사선 소견</SubHeading>
                  <div className="flex flex-wrap gap-2">
                    {section.xrayFindings.map((f) => {
                      const color = f.isNormal
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : f.severity === 'severe'   ? 'border-red-200 bg-red-50 text-red-700'
                        : f.severity === 'moderate' ? 'border-orange-200 bg-orange-50 text-orange-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                      return (
                        <div key={f.id} className={`rounded-[10px] border px-3 py-1.5 ${color}`}>
                          <span className="text-xs font-semibold">{f.label}</span>
                          {f.valueLabel && <span className="ml-1.5 font-mono text-xs">{f.valueLabel}</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* 초음파 소견 (장기별 이미지 포함) */}
        {section.usNotes.length > 0 && (() => {
          return (
            <div>
              <SubHeading>초음파 소견</SubHeading>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {section.usNotes.map((n) => {
                  const organImages = section.images.filter((img) =>
                    img.tags?.includes('ultrasound') && img.tags?.includes(`organ_${n.organKey}`),
                  )
                  return (
                    <div key={n.organKey} className="overflow-hidden rounded-[10px] border border-sky-100 bg-sky-50">
                      <div className="flex flex-col sm:flex-row">
                        {/* 이미지: 왼쪽(넓은화면) / 위(모바일) */}
                        {organImages.length > 0 && (
                          <div className="flex flex-col gap-2 p-2 sm:w-1/2 sm:shrink-0">
                            {organImages.map((img) => (
                              <CheckupImgCard
                                key={img.img_url}
                                img={img}
                                checkupId={checkupId ?? ''}
                                isShared={isShared}
                                className="aspect-[4/3] w-full rounded-md object-cover"
                              />
                            ))}
                          </div>
                        )}
                        {/* 소견: 오른쪽(넓은화면) / 아래(모바일) */}
                        <div className={`flex flex-col justify-center px-4 py-3 ${organImages.length > 0 ? 'sm:flex-1' : ''}`}>
                          <div className="mb-1 flex items-center gap-1.5">
                            <Microscope size={13} className="text-sky-500" strokeWidth={2} />
                            <p className="text-xs font-bold text-sky-700">{n.label}</p>
                          </div>
                          <ul className="space-y-1">
                            {n.note.split('\n').filter((line) => line.trim()).map((line, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-sm leading-relaxed text-slate-700">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                                <span>{line.trim()}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* AI 소견 + 나머지 이미지 (초음파 장기, 방사선, 상단 이미지 제외) */}
        {(() => {
          const usNotesOrganTags = new Set(section.usNotes.map((n) => `organ_${n.organKey}`))
          const remainingImages = section.images.filter((img) => {
            if (topImageUrls.has(img.img_url)) return false
            if (img.tags?.includes('ultrasound') && img.tags?.some((t) => usNotesOrganTags.has(t))) return false
            if (img.tags?.some((t) => t.startsWith('xray'))) return false
            return true
          })
          const hasRemainingImages = remainingImages.length > 0
          return (
        hasAi && (
          <div className={hasRemainingImages ? 'grid grid-cols-1 gap-4 sm:grid-cols-3' : ''}>
            <div className={`${hasRemainingImages ? 'sm:col-span-2 ' : ''}flex flex-col gap-3`}>
              {isDx ? (
                <>
                  {eval_.detail && (
                    <div className="rounded-[10px] border border-slate-100 bg-slate-50 p-4">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <FileText size={13} className="text-teal-600" strokeWidth={2} />
                        <p className="text-xs font-bold uppercase tracking-wide text-teal-700">종합 소견</p>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{eval_.detail}</p>
                    </div>
                  )}
                  {eval_.action && (
                    <div className={`rounded-[10px] border p-4 ${style.action}`}>
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Activity size={13} className="text-slate-600" strokeWidth={2} />
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">권장 조치</p>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{eval_.action}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-[10px] border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <FileText size={13} className="text-teal-600" strokeWidth={2} />
                    <p className="text-xs font-bold uppercase tracking-wide text-teal-700">종합 소견</p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{eval_ as string}</p>
                </div>
              )}
            </div>
            {hasRemainingImages && (
              <div className="flex flex-col gap-2">
                {remainingImages.map((img) => (
                  <CheckupImgCard key={img.img_url} img={img} checkupId={checkupId ?? ''} isShared={isShared} />
                ))}
              </div>
            )}
          </div>
        ))
        })()}

        {!hasAi && (() => {
          const usNotesOrganTags = new Set(section.usNotes.map((n) => `organ_${n.organKey}`))
          const remainingImages = section.images.filter((img) => {
            if (topImageUrls.has(img.img_url)) return false
            if (img.tags?.includes('ultrasound') && img.tags?.some((t) => usNotesOrganTags.has(t))) return false
            if (img.tags?.some((t) => t.startsWith('xray'))) return false
            return true
          })
          if (remainingImages.length === 0) return null
          return (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {remainingImages.map((img) => (
                <CheckupImgCard key={img.img_url} img={img} checkupId={checkupId ?? ''} isShared={isShared} />
              ))}
            </div>
          )
        })()}

        {!hasAi && !hasImages && section.labItems.length === 0 && section.usNotes.length === 0 && !isDerma && (
          <p className="text-xs text-slate-400">종합 소견이 작성되지 않았습니다.</p>
        )}

      </div>
    </div>
  )
}

// ── 장기별 섹션 래퍼 ───────────────────────────────────────────

interface OrganSectionsBlockProps {
  organSections: ResolvedOrganSection[]
  subCharts?: Record<string, string | null>
  dentalBasicFindings?: BasicFinding[]
  ophthalmicBasicFindings?: BasicFinding[]
  checkupId?: string
  isShared?: boolean
}

export function OrganSectionsBlock({ organSections, subCharts, dentalBasicFindings, ophthalmicBasicFindings, checkupId, isShared }: OrganSectionsBlockProps) {
  if (organSections.length === 0) return null
  return (
    <section className="mb-10 print:break-before-page">
      <SectionTitle>장기별 종합 평가</SectionTitle>
      <div className="flex flex-col gap-1 sm:gap-4">
        {organSections.map((section) => (
          <OrganCard
            key={section.key}
            section={section}
            subCharts={subCharts}
            dentalBasicFindings={dentalBasicFindings}
            ophthalmicBasicFindings={ophthalmicBasicFindings}
            checkupId={checkupId}
            isShared={isShared}
          />
        ))}
      </div>
    </section>
  )
}
