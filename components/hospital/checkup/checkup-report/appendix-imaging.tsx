import { IMAGING_SECTION_CONFIGS } from '@/lib/config/checkup-report-modules'
import {
  xrayCategories,
  thoraxMeasurements,
} from '@/constants/hospital/checkup/xray-ref'
import {
  echoCategories,
  echoMeasurements,
} from '@/constants/hospital/checkup/echo-ref'
import { organSections } from '@/constants/hospital/ultrasound'
import { AppendixSection } from './report-ui'
import CheckupImgCard from './checkup-img-card'

type ImageItem = {
  id: string
  img_url: string
  tags: string[]
  img_memo?: string | null
  mark?: Record<string, unknown> | null
  is_cover?: boolean
}

// ── 공통: 이미지 왼쪽 / 소견 오른쪽 레이아웃 ─────────────────

function PhotoFindingRow({
  images, findings, checkupId, isShared,
}: {
  images: ImageItem[]
  findings: React.ReactNode | null
  checkupId?: string
  isShared?: boolean
}) {
  if (images.length === 0 && !findings) return null
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:w-1/2 sm:shrink-0">
          {images.map((img) => (
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
      {findings && (
        <div className={images.length > 0 ? 'sm:flex-1' : 'w-full'}>
          {findings}
        </div>
      )}
    </div>
  )
}

// ── 방사선 카테고리별 블록 ────────────────────────────────────

function XrayCategoryBlock({
  categoryId, categoryLabel, images, checked, notes, measurements, checkupId, isShared,
}: {
  categoryId: string
  categoryLabel: string
  images: ImageItem[]
  checked: Record<string, boolean>
  notes: string
  measurements?: Record<string, string>
  checkupId?: string
  isShared?: boolean
}) {
  const catFindings = xrayCategories.find((c) => c.id === categoryId)?.findings ?? []
  const checkedFindings = catFindings.filter((f) => checked[f.id])

  const measurementRows = categoryId === 'thorax' && measurements
    ? thoraxMeasurements.map((m) => ({ m, val: measurements[m.id] })).filter(({ val }) => val)
    : []

  const hasFindings = checkedFindings.length > 0 || !!notes || measurementRows.length > 0
  if (!hasFindings && images.length === 0) return null

  const findingsPanel = hasFindings ? (
    <div className="flex flex-col gap-3 text-sm">
      {measurementRows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {measurementRows.map(({ m, val }) => (
            <div key={m.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5">
              <span className="text-xs font-semibold text-slate-500">{m.nameKo}</span>
              <span className="ml-1.5 font-bold text-slate-800">{val}</span>
              <span className="ml-0.5 text-xs text-slate-400">{m.unit}</span>
            </div>
          ))}
        </div>
      )}
      {checkedFindings.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">이상 소견</p>
          {checkedFindings.map((f) => {
            const color =
              f.severity === 'severe'   ? 'border-red-200 bg-red-50 text-red-700' :
              f.severity === 'moderate' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                         'border-yellow-200 bg-yellow-50 text-yellow-700'
            return (
              <div key={f.id} className={`rounded-md border px-3 py-1.5 text-xs font-medium ${color}`}>
                {f.label}
              </div>
            )
          })}
        </div>
      )}
      {notes && <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{notes}</p>}
    </div>
  ) : null

  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-[10px] border border-blue-100">
      <div className="border-b bg-blue-50 px-4 py-2.5">
        <h3 className="text-sm font-bold text-blue-800">{categoryLabel}</h3>
      </div>
      <div className="p-4">
        <PhotoFindingRow images={images} findings={findingsPanel} checkupId={checkupId} isShared={isShared} />
      </div>
    </div>
  )
}

// ── 복부 초음파: 장기별 블록 ──────────────────────────────────

function UltrasoundOrganBlock({
  organNameKo, note, images, checkupId, isShared,
}: {
  organNameKo: string
  note: string
  images: ImageItem[]
  checkupId?: string
  isShared?: boolean
}) {
  if (!note && images.length === 0) return null

  const findingsPanel = note ? (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{note}</p>
  ) : null

  return (
    <div className="mb-3 break-inside-avoid overflow-hidden rounded-[10px] border border-sky-100">
      <div className="border-b bg-sky-50 px-3 py-2">
        <p className="text-xs font-bold text-sky-800">{organNameKo}</p>
      </div>
      <div className="p-3">
        <PhotoFindingRow images={images} findings={findingsPanel} checkupId={checkupId} isShared={isShared} />
      </div>
    </div>
  )
}

// ── 심장 초음파: 카테고리별 소견 블록 ────────────────────────

function EchoCategoryBlock({
  categoryId, categoryLabel, checked, notes, measurements, images, checkupId, isShared,
}: {
  categoryId: string
  categoryLabel: string
  checked: Record<string, boolean>
  notes: string
  measurements: Record<string, string>
  images: ImageItem[]
  checkupId?: string
  isShared?: boolean
}) {
  const catFindings = echoCategories.find((c) => c.id === categoryId)?.findings ?? []
  const checkedFindings = catFindings.filter((f) => checked[f.id])

  const catMeasurements = echoMeasurements
    .filter((m) => m.categoryId === categoryId)
    .map((m) => ({ m, val: measurements[m.id] }))
    .filter(({ val }) => val)

  const hasFindings = checkedFindings.length > 0 || !!notes || catMeasurements.length > 0
  if (!hasFindings && images.length === 0) return null

  const findingsPanel = hasFindings ? (
    <div className="flex flex-col gap-3 text-sm">
      {catMeasurements.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {catMeasurements.map(({ m, val }) => (
            <div key={m.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5">
              <span className="text-xs font-semibold text-slate-500">{m.nameKo}</span>
              <span className="ml-1.5 font-bold text-slate-800">{val}</span>
              <span className="ml-0.5 text-xs text-slate-400">{m.unit}</span>
            </div>
          ))}
        </div>
      )}
      {checkedFindings.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">이상 소견</p>
          {checkedFindings.map((f) => {
            const color =
              f.severity === 'severe'   ? 'border-red-200 bg-red-50 text-red-700' :
              f.severity === 'moderate' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                         'border-yellow-200 bg-yellow-50 text-yellow-700'
            return (
              <div key={f.id} className={`rounded-md border px-3 py-1.5 text-xs font-medium ${color}`}>
                {f.label}
              </div>
            )
          })}
        </div>
      )}
      {notes && <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{notes}</p>}
    </div>
  ) : null

  return (
    <div className="mb-3 break-inside-avoid overflow-hidden rounded-[10px] border border-indigo-100">
      <div className="border-b bg-indigo-50 px-3 py-2">
        <p className="text-xs font-bold text-indigo-800">{categoryLabel}</p>
      </div>
      <div className="p-3">
        <PhotoFindingRow images={images} findings={findingsPanel} checkupId={checkupId} isShared={isShared} />
      </div>
    </div>
  )
}

// ── CT/MRI 블록 (기존 유지) ───────────────────────────────────

function ImagingBlock({
  label, purpose, data, images, checkupId, isShared,
}: {
  label: string
  purpose?: string
  data: Record<string, unknown>
  images: ImageItem[]
  checkupId?: string
  isShared?: boolean
}) {
  const notes = data.notes as Record<string, string> | string | undefined
  const organNotes =
    (data.organ_notes_owner as Record<string, string> | undefined) ??
    (data.organ_notes as Record<string, string> | undefined)
  const checked = data.checked as Record<string, boolean> | undefined
  const checkedList = checked ? Object.entries(checked).filter(([, v]) => v).map(([k]) => k) : []

  const hasContent =
    (typeof notes === 'string' && notes) ||
    (typeof notes === 'object' && notes && Object.values(notes).some(Boolean)) ||
    (organNotes && Object.values(organNotes).some((v) => v?.trim())) ||
    checkedList.length > 0 ||
    images.length > 0

  if (!hasContent) return null

  const textContent = (
    <div className="text-sm text-slate-700">
      {checkedList.length > 0 && (
        <p className="mb-1.5">
          <span className="font-medium">이상소견:</span> {checkedList.join(', ')}
        </p>
      )}
      {typeof notes === 'string' && notes && (
        <p className="whitespace-pre-wrap leading-relaxed">{notes}</p>
      )}
      {typeof notes === 'object' && notes &&
        Object.entries(notes).filter(([, v]) => v).map(([k, v]) => (
          <p key={k} className="mb-1">
            <span className="font-medium">{k}:</span> {v}
          </p>
        ))}
      {organNotes &&
        Object.entries(organNotes).filter(([, v]) => v?.trim()).map(([organ, note]) => (
          <div key={organ} className="mb-2.5">
            <p className="mb-0.5 text-xs font-semibold text-slate-500">
              {organSections.find((s) => s.organ === organ)?.organNameKo ?? organ}
            </p>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{note}</p>
          </div>
        ))}
    </div>
  )

  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-[10px] border border-slate-200">
      <div className="border-b bg-slate-100 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-800">{label}</h3>
        {purpose && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{purpose}</p>}
      </div>
      <div className="p-4">
        {images.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">{textContent}</div>
            <div className="flex flex-col gap-2">
              {images.map((img) => (
                <CheckupImgCard key={img.img_url} img={img} checkupId={checkupId ?? ''} isShared={isShared} />
              ))}
            </div>
          </div>
        ) : (
          textContent
        )}
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

interface AppendixImagingProps {
  getSection: (type: string) => Record<string, unknown>
  images: ImageItem[]
  checkupId?: string
  isShared?: boolean
}

export function AppendixImaging({ getSection, images, checkupId, isShared }: AppendixImagingProps) {
  // 부록 B: X-ray — 카테고리별
  const xrayBlock = (() => {
    const d = getSection('xray')
    const checked      = (d.checked      as Record<string, boolean> | undefined) ?? {}
    const notes        = (d.notes        as Record<string, string>  | undefined) ?? {}
    const measurements = (d.measurements as Record<string, string>  | undefined) ?? {}

    const visibleCats = xrayCategories.filter((cat) => {
      const catImages = images.filter((img) =>
        img.tags?.some((t) => t === `xray_${cat.id}` || t.startsWith(`xray_${cat.id}_`)),
      )
      const catFindingIds = new Set(cat.findings.map((f) => f.id))
      const hasChecked = Object.entries(checked).some(([k, v]) => v && catFindingIds.has(k))
      const hasNote = !!notes[cat.id]
      const hasMeasurement = cat.id === 'thorax' && thoraxMeasurements.some((m) => measurements[m.id])
      return catImages.length > 0 || hasChecked || hasNote || hasMeasurement
    })

    if (visibleCats.length === 0) return null
    return (
      <AppendixSection tag="부록 B" title="방사선 (X-ray) 검사">
        {visibleCats.map((cat) => (
          <XrayCategoryBlock
            key={cat.id}
            categoryId={cat.id}
            categoryLabel={cat.label}
            images={images.filter((img) =>
              img.tags?.some((t) => t === `xray_${cat.id}` || t.startsWith(`xray_${cat.id}_`)),
            )}
            checked={checked}
            notes={notes[cat.id] ?? ''}
            measurements={cat.id === 'thorax' ? measurements : undefined}
            checkupId={checkupId}
            isShared={isShared}
          />
        ))}
      </AppendixSection>
    )
  })()

  // 부록 C: 초음파 — 복부(장기별) + 심장(카테고리별)
  const usBlock = (() => {
    const usData   = getSection('ultrasound_basic')
    const echoData = getSection('echo_basic')

    // 복부 초음파: 장기별
    const usOrganNotes =
      (usData.organ_notes_owner as Record<string, string> | undefined) ??
      (usData.organ_notes       as Record<string, string> | undefined) ?? {}

    const usOrganBlocks = organSections.filter((sec) => {
      const note = usOrganNotes[sec.organ] ?? ''
      const imgs = images.filter((img) =>
        img.tags?.includes('ultrasound') && img.tags?.includes(`organ_${sec.organ}`),
      )
      return note || imgs.length > 0
    })

    // 심장 초음파: 카테고리별
    const echoChecked      = (echoData.checked      as Record<string, boolean> | undefined) ?? {}
    const echoNotes        = (echoData.notes        as Record<string, string>  | undefined) ?? {}
    const echoMeasValues   = (echoData.measurements as Record<string, string>  | undefined) ?? {}
    const echoImgs = images.filter((img) =>
      img.tags?.some((t) => t.startsWith('echo')),
    )

    const visibleEchoCats = echoCategories.filter((cat) => {
      const catFindings = cat.findings.filter((f) => echoChecked[f.id])
      const catMeasurements = echoMeasurements
        .filter((m) => m.categoryId === cat.id)
        .some((m) => echoMeasValues[m.id])
      return catFindings.length > 0 || !!echoNotes[cat.id] || catMeasurements
    })

    const hasUs = usOrganBlocks.length > 0 || visibleEchoCats.length > 0 || echoImgs.length > 0
    if (!hasUs) return null

    return (
      <AppendixSection tag="부록 C" title="초음파 검사">
        {/* 복부 초음파 */}
        {usOrganBlocks.length > 0 && (
          <div className="mb-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-sky-400" />
              <p className="text-sm font-bold text-slate-700">복부 초음파</p>
            </div>
            {usOrganBlocks.map((sec) => (
              <UltrasoundOrganBlock
                key={sec.organ}
                organNameKo={sec.organNameKo}
                note={usOrganNotes[sec.organ] ?? ''}
                images={images.filter((img) =>
                  img.tags?.includes('ultrasound') && img.tags?.includes(`organ_${sec.organ}`),
                )}
                checkupId={checkupId}
                isShared={isShared}
              />
            ))}
          </div>
        )}

        {/* 심장 초음파 */}
        {(visibleEchoCats.length > 0 || echoImgs.length > 0) && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-indigo-400" />
              <p className="text-sm font-bold text-slate-700">심장 초음파 (Echo)</p>
            </div>
            {/* Echo 이미지: 카테고리 구분 없이 상단에 모아 표시 */}
            {echoImgs.length > 0 && (
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {echoImgs.map((img) => (
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
            {visibleEchoCats.map((cat) => (
              <EchoCategoryBlock
                key={cat.id}
                categoryId={cat.id}
                categoryLabel={cat.label}
                checked={echoChecked}
                notes={echoNotes[cat.id] ?? ''}
                measurements={echoMeasValues}
                images={[]}
                checkupId={checkupId}
                isShared={isShared}
              />
            ))}
          </div>
        )}
      </AppendixSection>
    )
  })()

  // 부록 D: CT/MRI
  const ctBlock = (() => {
    const cfg = IMAGING_SECTION_CONFIGS.find((c) => c.key === 'ct_mri')
    if (!cfg) return null
    const d = getSection(cfg.key)
    const imgs = images.filter((img) => img.tags?.some((t) => cfg.imageTagPrefixes.some((p) => t.startsWith(p))))
    if (Object.keys(d).length === 0 && imgs.length === 0) return null
    return (
      <AppendixSection tag="부록 D" title="정밀 검사 (CT / MRI / 내시경)">
        <ImagingBlock label={cfg.label} purpose={cfg.purpose} data={d} images={imgs} checkupId={checkupId} isShared={isShared} />
      </AppendixSection>
    )
  })()

  if (!xrayBlock && !usBlock && !ctBlock) return null
  return <>{xrayBlock}{usBlock}{ctBlock}</>
}
