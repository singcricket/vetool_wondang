'use client'

import { Plus, X, Camera } from 'lucide-react'
import SkinMapPanel, { type SkinMapMarker } from './skin-map-panel'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SkinLesion, EarExam } from '@/types/hospital/checkup-type'
import CheckupImageUploadDialog from './checkup-image-uploader/checkup-image-upload-dialog'
import CheckupImageStrip from './checkup-image-strip'
import type { CheckupImageTagGroup } from '@/constants/hospital/checkup/checkup-image-tags'
import type { CheckupImage } from '@/lib/actions/checkup/checkup-image-actions'

// ── 상수 ──────────────────────────────────────────────────────

const LESION_TYPES = [
  '홍반 (Erythema)',
  '구진 (Papule)',
  '농포 (Pustule)',
  '소수포 (Vesicle)',
  '가피 (Crust)',
  '궤양 (Ulcer)',
  '미란 (Erosion)',
  '태선화 (Lichenification)',
  '색소침착 변화',
  '종괴/결절',
  '비늘/각질 (Scale)',
  '탈모 (Alopecia)',
]

const LESION_LOCATIONS = [
  '두부 (얼굴/코/입 주변)',
  '귀 외이',
  '목/경부',
  '등 (흉배부)',
  '복부/서혜부',
  '겨드랑이 (액와)',
  '앞다리',
  '뒷다리',
  '발가락 사이 (지간)',
  '발바닥 (육구)',
  '꼬리 주변/항문 주위',
  '전신',
]

const LESION_DISTRIBUTIONS = ['단발 (Solitary)', '다발 (Multifocal)', '광범위 (Generalized)']

const EAR_FINDINGS = [
  '정상',
  '삼출물 (분비물)',
  '발적 (Erythema)',
  '부종',
  '비정상적인 냄새',
  '소양감 (가려움)',
  '고막 이상',
  '이물',
  '종괴/폴립',
]

const EAR_DISCHARGE_TYPES = [
  '없음',
  '갈색/건성 (귀지 과다)',
  '노란색/화농성',
  '검은색/갈색 (이진균증 의심)',
  '혈성',
  '투명/장액성',
]

// ── 헬퍼 ──────────────────────────────────────────────────────

function newLesion(): SkinLesion {
  return { id: crypto.randomUUID(), types: [], location: '', distribution: '', size_mm: '', notes: '' }
}

function defaultEarExam(): EarExam {
  return { od_findings: [], od_discharge: '', os_findings: [], os_discharge: '', notes: '' }
}

// ── 병변 카드 ─────────────────────────────────────────────────

function LesionCard({
  lesion,
  index,
  onChange,
  onRemove,
  checkupId,
  hosId,
  dynamicTagGroups,
  lesionImages,
  onImageEdited,
  onImageUploaded,
}: {
  lesion: SkinLesion
  index: number
  onChange: (updated: SkinLesion) => void
  onRemove: () => void
  checkupId: string
  hosId: string
  dynamicTagGroups: CheckupImageTagGroup[]
  lesionImages?: CheckupImage[]
  onImageEdited?: () => void
  onImageUploaded?: () => void
}) {
  const toggleType = (t: string) => {
    const next = lesion.types.includes(t)
      ? lesion.types.filter((x) => x !== t)
      : [...lesion.types, t]
    onChange({ ...lesion, types: next })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600">병변 {index + 1}</span>
        <div className="flex items-center gap-1">
          <CheckupImageUploadDialog
            checkupId={checkupId}
            hosId={hosId}
            defaultTags={['organ_skin', `skin_lesion_${lesion.id}`]}
            dynamicTagGroups={dynamicTagGroups}
            onClose={onImageUploaded}
            trigger={
              <button
                type="button"
                className="rounded-full p-0.5 text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors"
              >
                <Camera size={14} />
              </button>
            }
          />
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 병변 종류 (복수 선택) */}
      <div className="mb-2">
        <p className="mb-1 text-[11px] font-medium text-slate-500">병변 종류 (복수 선택)</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {LESION_TYPES.map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-1 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={lesion.types.includes(t)}
                onChange={() => toggleType(t)}
                className="h-3.5 w-3.5 accent-teal-600"
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      {/* 부위 + 분포 + 크기 */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <p className="mb-1 text-[11px] font-medium text-slate-500">부위</p>
          <Select value={lesion.location} onValueChange={(v) => onChange({ ...lesion, location: v })}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {LESION_LOCATIONS.map((loc) => (
                <SelectItem key={loc} value={loc} className="text-xs">{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium text-slate-500">분포</p>
          <Select value={lesion.distribution} onValueChange={(v) => onChange({ ...lesion, distribution: v })}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {LESION_DISTRIBUTIONS.map((d) => (
                <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium text-slate-500">크기 (mm)</p>
          <Input
            value={lesion.size_mm}
            onChange={(e) => onChange({ ...lesion, size_mm: e.target.value })}
            placeholder="예: 5"
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* 메모 */}
      <div className="mt-2">
        <p className="mb-1 text-[11px] font-medium text-slate-500">메모</p>
        <Input
          value={lesion.notes}
          onChange={(e) => onChange({ ...lesion, notes: e.target.value })}
          placeholder="추가 소견"
          className="h-7 text-xs"
        />
      </div>

      {/* 병변 이미지 썸네일 */}
      {lesionImages && lesionImages.length > 0 && (
        <div className="mt-2 border-t border-slate-100 pt-2">
          <CheckupImageStrip
            checkupId={checkupId}
            images={lesionImages}
            onEdited={onImageEdited}
            maxVisible={6}
          />
        </div>
      )}
    </div>
  )
}

// ── 귀 검사 패널 ──────────────────────────────────────────────

function EarPanel({
  side,
  label,
  findings,
  discharge,
  onFindingsChange,
  onDischargeChange,
  checkupId,
  hosId,
  earImages,
  onImageEdited,
  onImageUploaded,
}: {
  side: 'od' | 'os'
  label: string
  findings: string[]
  discharge: string
  onFindingsChange: (v: string[]) => void
  onDischargeChange: (v: string) => void
  checkupId: string
  hosId: string
  earImages?: CheckupImage[]
  onImageEdited?: () => void
  onImageUploaded?: () => void
}) {
  const showDischarge = findings.includes('삼출물 (분비물)')

  const toggle = (f: string) => {
    const next = findings.includes(f) ? findings.filter((x) => x !== f) : [...findings, f]
    onFindingsChange(next)
    if (f === '삼출물 (분비물)' && findings.includes(f)) onDischargeChange('')
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600">{label}</p>
        <CheckupImageUploadDialog
          checkupId={checkupId}
          hosId={hosId}
          defaultTags={['organ_ear', side === 'od' ? 'ear_od' : 'ear_os']}
          onClose={onImageUploaded}
          trigger={
            <button
              type="button"
              className="rounded-full p-0.5 text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors"
              title={`${label} 사진 업로드`}
            >
              <Camera size={13} />
            </button>
          }
        />
      </div>
      {earImages && earImages.length > 0 && (
        <div className="mb-2">
          <CheckupImageStrip
            checkupId={checkupId}
            images={earImages}
            onEdited={onImageEdited}
          />
        </div>
      )}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {EAR_FINDINGS.map((f) => (
          <label key={f} className="flex cursor-pointer items-center gap-1 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={findings.includes(f)}
              onChange={() => toggle(f)}
              className="h-3.5 w-3.5 accent-teal-600"
            />
            {f}
          </label>
        ))}
      </div>
      {showDischarge && (
        <div className="mt-2">
          <p className="mb-1 text-[11px] font-medium text-slate-500">삼출물 성상</p>
          <Select value={discharge} onValueChange={onDischargeChange}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {EAR_DISCHARGE_TYPES.map((d) => (
                <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export interface SkinEarValues {
  skin_lesions_json: string       // JSON.stringify(SkinLesion[])
  skin_lesions_summary: string    // 리포트용 텍스트 요약
  skin_map_json: string           // JSON.stringify(SkinMapMarker[])
  coat_condition: string
  parasite: string
  ear_od_findings: string         // JSON.stringify(string[])
  ear_od_discharge: string
  ear_os_findings: string         // JSON.stringify(string[])
  ear_os_discharge: string
  ear_notes: string
  ear_exam_summary: string        // 리포트용 텍스트 요약
}

interface Props {
  values: SkinEarValues
  onChange: (key: keyof SkinEarValues, value: string) => void
  checkupId: string
  hosId: string
  species?: string
  allImages?: CheckupImage[]
  onImageEdited?: () => void
  onImageUploaded?: () => void
}

function buildSkinSummary(lesions: SkinLesion[]): string {
  if (lesions.length === 0) return ''
  return lesions
    .map((l, i) => {
      const parts: string[] = [`병변${i + 1}`]
      if (l.location) parts.push(l.location)
      if (l.types.length) parts.push(l.types.join('/'))
      if (l.distribution) parts.push(l.distribution)
      if (l.size_mm) parts.push(`${l.size_mm}mm`)
      return parts.join(' · ')
    })
    .join('\n')
}

function buildEarSummary(ear: EarExam): string {
  const parts: string[] = []
  if (ear.od_findings.length) {
    const od = ear.od_findings.join(', ')
    const d = ear.od_discharge ? ` [${ear.od_discharge}]` : ''
    parts.push(`우이: ${od}${d}`)
  }
  if (ear.os_findings.length) {
    const os = ear.os_findings.join(', ')
    const d = ear.os_discharge ? ` [${ear.os_discharge}]` : ''
    parts.push(`좌이: ${os}${d}`)
  }
  if (ear.notes) parts.push(ear.notes)
  return parts.join('\n')
}

const COAT_OPTIONS = ['정상 (광택, 청결)', '건조/윤기 없음', '기름짐 (Seborrhea)', '탈모 (Alopecia)', '엉킴/매트']
const PARASITE_OPTIONS = ['없음', '벼룩 (Fleas)', '진드기 (Ticks)', '이 (Lice)', '기생충 분변 (Flea dirt)']

export default function SkinEarSection({ values, onChange, checkupId, hosId, species = 'dog', allImages = [], onImageEdited, onImageUploaded }: Props) {
  const lesions: SkinLesion[] = (() => {
    try { return JSON.parse(values.skin_lesions_json || '[]') } catch { return [] }
  })()

  const markers: SkinMapMarker[] = (() => {
    try { return JSON.parse(values.skin_map_json || '[]') } catch { return [] }
  })()

  const dynamicTagGroups: CheckupImageTagGroup[] = lesions.length > 0 ? [{
    group: 'skin_lesions',
    label: '피부 병변',
    color: 'teal',
    tags: lesions.map((l, i) => ({
      id: `skin_lesion_${l.id}`,
      label: l.location ? `병변${i + 1} · ${l.location}` : `병변 ${i + 1}`,
    })),
  }] : []

  const ear: EarExam = {
    od_findings: (() => { try { return JSON.parse(values.ear_od_findings || '[]') } catch { return [] } })(),
    od_discharge: values.ear_od_discharge,
    os_findings: (() => { try { return JSON.parse(values.ear_os_findings || '[]') } catch { return [] } })(),
    os_discharge: values.ear_os_discharge,
    notes: values.ear_notes,
  }

  const updateLesions = (next: SkinLesion[]) => {
    onChange('skin_lesions_json', JSON.stringify(next))
    onChange('skin_lesions_summary', buildSkinSummary(next))
  }

  const updateEar = (next: EarExam) => {
    onChange('ear_od_findings', JSON.stringify(next.od_findings))
    onChange('ear_od_discharge', next.od_discharge)
    onChange('ear_os_findings', JSON.stringify(next.os_findings))
    onChange('ear_os_discharge', next.os_discharge)
    onChange('ear_notes', next.notes)
    onChange('ear_exam_summary', buildEarSummary(next))
  }

  const addLesion = () => updateLesions([...lesions, newLesion()])

  const updateLesion = (i: number, updated: SkinLesion) => {
    const next = [...lesions]
    next[i] = updated
    updateLesions(next)
  }

  const removeLesion = (i: number) => updateLesions(lesions.filter((_, idx) => idx !== i))

  return (
    <div className="flex flex-col gap-5">

      {/* ── 피모 상태 & 기생충 ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-600">피모 상태</p>
          <Select value={values.coat_condition} onValueChange={(v) => onChange('coat_condition', v)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {COAT_OPTIONS.map((o) => (
                <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-600">외부 기생충</p>
          <Select value={values.parasite} onValueChange={(v) => onChange('parasite', v)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {PARASITE_OPTIONS.map((o) => (
                <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── 피부 병변 위치도 ── */}
      <SkinMapPanel
        species={species}
        lesions={lesions}
        markers={markers}
        onChange={(next) => onChange('skin_map_json', JSON.stringify(next))}
      />

      {/* ── 피부 병변 목록 ── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-0.5 rounded-full bg-teal-500" />
            <p className="text-xs font-bold text-slate-700">피부 병변</p>
            {lesions.length > 0 && (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                {lesions.length}개
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={addLesion}
            className="flex items-center gap-1 rounded-lg border border-teal-300 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors"
          >
            <Plus size={12} />
            병변 추가
          </button>
        </div>

        {lesions.length === 0 && (
          <p className="text-xs text-slate-400">병변 없음 — 추가하려면 버튼을 누르세요.</p>
        )}

        <div className="flex flex-col gap-2">
          {lesions.map((lesion, i) => (
            <LesionCard
              key={lesion.id}
              lesion={lesion}
              index={i}
              onChange={(updated) => updateLesion(i, updated)}
              onRemove={() => removeLesion(i)}
              checkupId={checkupId}
              hosId={hosId}
              dynamicTagGroups={dynamicTagGroups}
              lesionImages={allImages.filter((img) => img.tags.includes(`skin_lesion_${lesion.id}`))}
              onImageEdited={onImageEdited}
              onImageUploaded={onImageUploaded}
            />
          ))}
        </div>
      </div>

      {/* ── 귀 검사 ── */}
      <div>
        <div className="mb-2 flex items-center gap-1.5">
          <div className="h-3 w-0.5 rounded-full bg-amber-500" />
          <p className="text-xs font-bold text-slate-700">귀 검사</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <EarPanel
            side="od"
            label="우이 (OD)"
            findings={ear.od_findings}
            discharge={ear.od_discharge}
            onFindingsChange={(v) => updateEar({ ...ear, od_findings: v })}
            onDischargeChange={(v) => updateEar({ ...ear, od_discharge: v })}
            checkupId={checkupId}
            hosId={hosId}
            earImages={allImages.filter((img) => img.tags.includes('ear_od'))}
            onImageEdited={onImageEdited}
            onImageUploaded={onImageUploaded}
          />
          <EarPanel
            side="os"
            label="좌이 (OS)"
            findings={ear.os_findings}
            discharge={ear.os_discharge}
            onFindingsChange={(v) => updateEar({ ...ear, os_findings: v })}
            onDischargeChange={(v) => updateEar({ ...ear, os_discharge: v })}
            checkupId={checkupId}
            hosId={hosId}
            earImages={allImages.filter((img) => img.tags.includes('ear_os'))}
            onImageEdited={onImageEdited}
            onImageUploaded={onImageUploaded}
          />
        </div>
        <div className="mt-2">
          <p className="mb-1 text-[11px] font-medium text-slate-500">귀 검사 메모</p>
          <Textarea
            value={ear.notes}
            onChange={(e) => updateEar({ ...ear, notes: e.target.value })}
            placeholder="귀 추가 소견"
            className="min-h-[60px] resize-none text-xs"
          />
        </div>
      </div>

    </div>
  )
}
