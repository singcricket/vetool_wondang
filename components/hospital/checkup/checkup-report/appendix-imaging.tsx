import { IMAGING_SECTION_CONFIGS } from '@/lib/config/checkup-report-modules'
import { AppendixSection } from './report-ui'
import CheckupImgCard from './checkup-img-card'

const ORGAN_NAME_KO: Record<string, string> = {
  liver:           '간',
  gallbladder:     '담낭 및 담도계',
  spleen:          '비장',
  pancreas:        '췌장',
  left_kidney:     '좌측 신장',
  right_kidney:    '우측 신장',
  urinary_bladder: '방광',
  left_adrenal:    '좌측 부신',
  right_adrenal:   '우측 부신',
  stomach:         '위',
  duodenum:        '십이지장',
  small_intestine: '소장',
  colon:           '결장',
  gi_tract:        '위장관 전반',
  lymph_node:      '복강 림프절',
  free_fluid:      '복강 내 유리액',
}

type ImageItem = { id: string; img_url: string; tags: string[]; img_memo?: string | null; mark?: Record<string, unknown> | null; is_cover?: boolean }

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
        Object.entries(notes)
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <p key={k} className="mb-1">
              <span className="font-medium">{k}:</span> {v}
            </p>
          ))}
      {organNotes &&
        Object.entries(organNotes)
          .filter(([, v]) => v?.trim())
          .map(([organ, note]) => (
            <div key={organ} className="mb-2.5">
              <p className="mb-0.5 text-xs font-semibold text-slate-500">
                {ORGAN_NAME_KO[organ] ?? organ}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{note}</p>
            </div>
          ))}
    </div>
  )

  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
        {purpose && <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{purpose}</p>}
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

interface AppendixImagingProps {
  getSection: (type: string) => Record<string, unknown>
  images: ImageItem[]
  checkupId?: string
  isShared?: boolean
}

export function AppendixImaging({ getSection, images, checkupId, isShared }: AppendixImagingProps) {
  // 부록 B: X-ray
  const xrayBlock = (() => {
    const cfg = IMAGING_SECTION_CONFIGS.find((c) => c.key === 'xray')
    if (!cfg) return null
    const d = getSection(cfg.key)
    const imgs = images.filter((img) => img.tags?.some((t) => cfg.imageTagPrefixes.some((p) => t.startsWith(p))))
    if (Object.keys(d).length === 0 && imgs.length === 0) return null
    return (
      <AppendixSection key="xray" tag="부록 B" title="방사선 (X-ray) 검사">
        <ImagingBlock label={cfg.label} purpose={cfg.purpose} data={d} images={imgs} checkupId={checkupId} isShared={isShared} />
      </AppendixSection>
    )
  })()

  // 부록 C: 초음파
  const usBlock = (() => {
    const usCfgs = IMAGING_SECTION_CONFIGS.filter(
      (c) => c.key === 'ultrasound_basic' || c.key === 'echo_basic',
    )
    const hasUs = usCfgs.some((c) => {
      const d = getSection(c.key)
      return (
        Object.keys(d).length > 0 ||
        images.some((img) => img.tags?.some((t) => c.imageTagPrefixes.some((p) => t.startsWith(p))))
      )
    })
    if (!hasUs) return null
    return (
      <AppendixSection key="us" tag="부록 C" title="초음파 검사">
        {usCfgs.map((c) => (
          <ImagingBlock
            key={c.key}
            label={c.label}
            purpose={c.purpose}
            data={getSection(c.key)}
            images={images.filter((img) => img.tags?.some((t) => c.imageTagPrefixes.some((p) => t.startsWith(p))))}
            checkupId={checkupId}
            isShared={isShared}
          />
        ))}
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
      <AppendixSection key="ct" tag="부록 D" title="정밀 검사 (CT / MRI / 내시경)">
        <ImagingBlock label={cfg.label} purpose={cfg.purpose} data={d} images={imgs} checkupId={checkupId} isShared={isShared} />
      </AppendixSection>
    )
  })()

  if (!xrayBlock && !usBlock && !ctBlock) return null
  return <>{xrayBlock}{usBlock}{ctBlock}</>
}
