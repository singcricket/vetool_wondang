import type React from 'react'
import { AlertCircle, CheckCircle2, Microscope, Activity, FileText, FlaskConical, ExternalLink } from 'lucide-react'
import type { LabResultItem } from '@/constants/hospital/checkup/lab-types'
import type { ResolvedOrganSection, DxEvaluation } from '@/lib/config/checkup-report-modules'
import { isDxEvaluation, SEVERITY_BADGE } from './report-utils'
import { SectionTitle } from './report-ui'
import CheckupImgCard from './checkup-img-card'

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
  headerBg: string; headerBorder: string; headerText: string; headerSubText: string;
  accentBar: string; countBadge: string;
}> = {
  normal:   {
    badge: 'bg-emerald-100 text-emerald-700',
    action: 'bg-emerald-50 border-emerald-200',
    headerBg: 'bg-teal-50',        headerBorder: 'border-teal-200',
    headerText: 'text-teal-800',   headerSubText: 'text-teal-600',
    accentBar: 'bg-teal-400',      countBadge: 'bg-teal-100 text-teal-700',
  },
  mild:     {
    badge: 'bg-amber-100 text-amber-700',
    action: 'bg-amber-50 border-amber-200',
    headerBg: 'bg-amber-50',       headerBorder: 'border-amber-200',
    headerText: 'text-amber-800',  headerSubText: 'text-amber-600',
    accentBar: 'bg-amber-400',     countBadge: 'bg-amber-100 text-amber-700',
  },
  moderate: {
    badge: 'bg-orange-100 text-orange-700',
    action: 'bg-orange-50 border-orange-200',
    headerBg: 'bg-orange-50',      headerBorder: 'border-orange-200',
    headerText: 'text-orange-800', headerSubText: 'text-orange-600',
    accentBar: 'bg-orange-400',    countBadge: 'bg-orange-100 text-orange-700',
  },
  severe:   {
    badge: 'bg-red-100 text-red-700',
    action: 'bg-red-50 border-red-200',
    headerBg: 'bg-red-50',         headerBorder: 'border-red-200',
    headerText: 'text-red-800',    headerSubText: 'text-red-600',
    accentBar: 'bg-red-400',       countBadge: 'bg-red-100 text-red-700',
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
    <div className={`flex flex-col gap-2 rounded-2xl border p-4 ${borderColor} ${bgColor}`}>

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
          <span className="ml-auto shrink-0 rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
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
    <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-slate-400">{children}</p>
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

  // 상태 결정 — Dx 평가가 없을 때는 이상 항목 여부로 자동 추정
  const statusKey: DxEvaluation['status'] = isDx
    ? eval_.status
    : abnormalItems.length > 0 ? 'mild' : 'normal'
  const style = DX_STATUS_STYLE[statusKey]

  // 안과/구강: 상단에 배치할 이미지 및 나머지에서 제외할 집합
  const isOphthalmic = section.key === 'ophthalmic'
  const isOral = section.key === 'oral'
  const topImageUrls = new Set<string>()
  const odImages = isOphthalmic ? section.images.filter((img) => img.tags?.includes('ophthalmic_od')) : []
  const osImages = isOphthalmic ? section.images.filter((img) => img.tags?.includes('ophthalmic_os')) : []
  const oralImages = isOral ? section.images : []
  if (isOphthalmic) { odImages.forEach((img) => topImageUrls.add(img.img_url)); osImages.forEach((img) => topImageUrls.add(img.img_url)) }
  if (isOral) { oralImages.forEach((img) => topImageUrls.add(img.img_url)) }

  // 장기 단독 이미지: organ_* 태그가 있고 ultrasound / xray* 태그가 없는 이미지
  const organOnlyImages = (!isOphthalmic && !isOral)
    ? section.images.filter((img) =>
        img.tags?.some((t) => t.startsWith('organ_')) &&
        !img.tags?.includes('ultrasound') &&
        !img.tags?.some((t) => t.startsWith('xray')),
      )
    : []
  organOnlyImages.forEach((img) => topImageUrls.add(img.img_url))

  return (
    <div className="break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 shadow-sm">

      {/* ── 헤더 (파스텔 배경) ── */}
      <div className={`relative flex items-center justify-between gap-3 border-b px-5 py-4 ${style.headerBg} ${style.headerBorder}`}>
        {/* 좌측 색상 바 */}
        <div className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl ${style.accentBar}`} />

        <div className="flex min-w-0 flex-col pl-2">
          <h3 className={`text-base font-bold ${style.headerText}`}>{section.label}</h3>
          {isDx && eval_.summary && (
            <p className={`mt-0.5 text-xs leading-relaxed ${style.headerSubText}`}>{eval_.summary}</p>
          )}
          {!hasAi && (
            <p className="mt-0.5 text-xs text-slate-400">* AI 종합 평가 미포함</p>
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

      <div className="flex flex-col gap-6 p-5">

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
                <div key={side} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{sideLabel}</p>

                  {/* 사진 */}
                  {imgs.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      {imgs.map((img) => (
                        <CheckupImgCard key={img.img_url} img={img} checkupId={checkupId ?? ''} isShared={isShared} className="aspect-square w-full rounded-lg object-cover" />
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
                          className={`flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5 ${f.isAbnormal ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}
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
              <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
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
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 ${f.isAbnormal ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}
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
          <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
            <ExternalLink size={14} className="shrink-0 text-sky-500" />
            <p className="text-sm font-medium text-sky-700">안과 전문 리포트 참조 — 별도 첨부된 안과 검진 리포트를 확인하세요.</p>
          </div>
        )}

        {/* 신체검사 소견 (oral/ophthalmic 제외: 별도 블록으로 처리) */}
        {section.physicalFindings.length > 0 && !isOral && !isOphthalmic && (
          <div>
            <SubHeading>신체검사 소견</SubHeading>
            <div className="flex flex-wrap gap-2">
              {section.physicalFindings.map((f) => (
                <div
                  key={f.id}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 ${f.isAbnormal ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}
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

        {/* 방사선 소견 */}
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
                  <div key={f.id} className={`rounded-xl border px-3 py-1.5 ${color}`}>
                    <span className="text-xs font-semibold">{f.label}</span>
                    {f.valueLabel && <span className="ml-1.5 font-mono text-xs">{f.valueLabel}</span>}
                  </div>
                )
              })}
            </div>
          </div>
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

        {/* 방사선 이미지 (장기 태그 + xray 태그 조합) */}
        {(() => {
          const xrayImages = section.images.filter((img) =>
            img.tags?.some((t) => t.startsWith('xray')),
          )
          if (xrayImages.length === 0) return null
          return (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {xrayImages.map((img) => (
                <CheckupImgCard key={img.img_url} img={img} checkupId={checkupId ?? ''} isShared={isShared} />
              ))}
            </div>
          )
        })()}

        {/* 초음파 소견 (장기별 이미지 포함) */}
        {section.usNotes.length > 0 && (() => {
          return (
            <div>
              <SubHeading>초음파 소견</SubHeading>
              <div className="flex flex-col gap-3">
                {section.usNotes.map((n) => {
                  const organImages = section.images.filter((img) =>
                    img.tags?.includes('ultrasound') && img.tags?.includes(`organ_${n.organKey}`),
                  )
                  return (
                    <div key={n.organKey} className="overflow-hidden rounded-xl border border-sky-100 bg-sky-50">
                      {/* 장기별 초음파 이미지 */}
                      {organImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-1 border-b border-sky-100 p-2 sm:grid-cols-4">
                          {organImages.map((img) => (
                            <CheckupImgCard
                              key={img.img_url}
                              img={img}
                              checkupId={checkupId ?? ''}
                              isShared={isShared}
                            />
                          ))}
                        </div>
                      )}
                      {/* 소견 텍스트 */}
                      <div className="px-4 py-3">
                        <div className="mb-1 flex items-center gap-1.5">
                          <Microscope size={13} className="text-sky-500" strokeWidth={2} />
                          <p className="text-xs font-bold text-sky-700">{n.label}</p>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{n.note}</p>
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
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <FileText size={13} className="text-teal-600" strokeWidth={2} />
                        <p className="text-xs font-bold uppercase tracking-wide text-teal-700">종합 소견</p>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{eval_.detail}</p>
                    </div>
                  )}
                  {eval_.action && (
                    <div className={`rounded-xl border p-4 ${style.action}`}>
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Activity size={13} className="text-slate-600" strokeWidth={2} />
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">권장 조치</p>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{eval_.action}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
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
                <img key={img.img_url} src={img.img_url} alt={section.label} className="w-full rounded-xl object-cover" />
              ))}
            </div>
          )
        })()}

        {!hasAi && !hasImages && section.labItems.length === 0 && section.usNotes.length === 0 && (
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
      <div className="flex flex-col gap-4">
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
