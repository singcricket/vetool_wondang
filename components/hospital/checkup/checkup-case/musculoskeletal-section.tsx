'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import JointEvalPanel from './joint-eval-panel'
import type { PhysicalValues } from './physical-exam-section'

const GAIT_OPTIONS = ['정상', '파행 (Lameness)', '실조 (Ataxia)', '편마비 (Hemiparesis)', '하반신마비 (Paraparesis)']
const LAMENESS_GRADE_OPTIONS = [
  'Grade 1 — 간헐적, 경미',
  'Grade 2 — 지속적, 경미',
  'Grade 3 — 지속적, 중등도',
  'Grade 4 — 심함, 부분 부하',
  'Grade 5 — 부하 불가',
]
const LAMENESS_LIMB_OPTIONS = ['우전지 (RF)', '좌전지 (LF)', '우후지 (RH)', '좌후지 (LH)']
const JOINT_OPTIONS = [
  '어깨(우)', '어깨(좌)',
  '팔꿈치(우)', '팔꿈치(좌)',
  '앞발목(우)', '앞발목(좌)',
  '고관절(우)', '고관절(좌)',
  '무릎(우)', '무릎(좌)',
  '뒷발목(우)', '뒷발목(좌)',
]
const POSTURE_OPTIONS = ['정상', '등허리 굽힘 (Hunched)', '머리 기울임 (Head tilt)', '사경 (Torticollis)', 'Schiff-Sherrington 자세']
const ATROPHY_OPTIONS = ['없음', '경미 (국소/대칭)', '중등도', '심함', '비대칭성 위축']
const SPINAL_OPTIONS = ['경추부', '흉추부', '요추부', '요천추부', '광범위']

interface Props {
  values: PhysicalValues
  onChange: (id: string, value: string) => void
}

function SubHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 pb-1">
      <div className="h-3 w-0.5 rounded-full bg-violet-400" />
      <p className="text-xs font-bold text-slate-600">{label}</p>
    </div>
  )
}

function MultiCheckRow({
  id,
  options,
  values,
  onChange,
}: {
  id: string
  options: string[]
  values: PhysicalValues
  onChange: (id: string, value: string) => void
}) {
  const selected = (values[id] ?? '').split(',').map((v) => v.trim()).filter(Boolean)
  const toggle = (opt: string) => {
    const next = selected.includes(opt)
      ? selected.filter((v) => v !== opt)
      : [...selected, opt]
    onChange(id, next.join(','))
  }
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {options.map((opt) => (
        <label key={opt} className="flex cursor-pointer items-center gap-1 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => toggle(opt)}
            className="h-3.5 w-3.5 accent-teal-600"
          />
          {opt}
        </label>
      ))}
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-slate-600">{label}</p>
      {children}
    </div>
  )
}

export default function MusculoskeletalSection({ values, onChange }: Props) {
  const gait = values['gait'] ?? ''
  const isLameness = gait === '파행 (Lameness)'
  const selectedJoints = (values['joint_affected'] ?? '').split(',').map((v) => v.trim()).filter(Boolean)

  return (
    <div className="flex flex-col gap-5">

      {/* ── 보행 평가 ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <SubHeader label="보행 평가" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FieldRow label="보행 상태">
            <Select value={gait} onValueChange={(v) => onChange('gait', v)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {GAIT_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          {isLameness && (
            <FieldRow label="파행 등급">
              <Select value={values['lameness_grade'] ?? ''} onValueChange={(v) => onChange('lameness_grade', v)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {LAMENESS_GRADE_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          )}
        </div>

        {isLameness && (
          <FieldRow label="파행 지체">
            <MultiCheckRow id="lameness_limb" options={LAMENESS_LIMB_OPTIONS} values={values} onChange={onChange} />
          </FieldRow>
        )}
      </div>

      {/* ── 관절 평가 ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <SubHeader label="관절 평가" />
        <FieldRow label="이상 관절">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            {JOINT_OPTIONS.map((opt) => {
              const selected = (values['joint_affected'] ?? '').split(',').map((v) => v.trim()).filter(Boolean)
              const checked = selected.includes(opt)
              const toggle = () => {
                const next = checked ? selected.filter((v) => v !== opt) : [...selected, opt]
                onChange('joint_affected', next.join(','))
              }
              return (
                <label key={opt} className="flex cursor-pointer items-center gap-1 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={toggle}
                    className="h-3.5 w-3.5 accent-teal-600"
                  />
                  {opt}
                </label>
              )
            })}
          </div>
        </FieldRow>

        {selectedJoints.length > 0 && (
          <JointEvalPanel
            selectedJoints={selectedJoints}
            evalJson={values['joint_eval_json'] ?? ''}
            onChange={(json) => onChange('joint_eval_json', json)}
          />
        )}

        <FieldRow label="관절 추가 소견">
          <Input
            value={values['joint_detail'] ?? ''}
            onChange={(e) => onChange('joint_detail', e.target.value)}
            className="h-7 text-sm"
            placeholder="직접 입력"
          />
        </FieldRow>
      </div>

      {/* ── 자세·근육·척추 ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <SubHeader label="자세 · 근육 · 척추" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FieldRow label="자세">
            <Select value={values['posture'] ?? ''} onValueChange={(v) => onChange('posture', v)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {POSTURE_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label="근육 위축">
            <Select value={values['muscle_atrophy'] ?? ''} onValueChange={(v) => onChange('muscle_atrophy', v)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {ATROPHY_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        </div>

        <FieldRow label="척추 통증">
          <MultiCheckRow id="spinal_pain" options={SPINAL_OPTIONS} values={values} onChange={onChange} />
        </FieldRow>
      </div>

    </div>
  )
}
