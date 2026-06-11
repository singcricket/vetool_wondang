import { Activity, Dumbbell, AlertCircle, CheckCircle2, Bone } from 'lucide-react'
import { SectionTitle } from './report-ui'

const LIMB_LABEL: Record<string, string> = {
  '우전지 (RF)': 'RF',
  '좌전지 (LF)': 'LF',
  '우후지 (RH)': 'RH',
  '좌후지 (LH)': 'LH',
}

function GaitCard({ physical }: { physical: Record<string, unknown> }) {
  const gait = physical['gait'] as string | undefined
  const grade = physical['lameness_grade'] as string | undefined
  const limbRaw = physical['lameness_limb'] as string | undefined
  const limbs = limbRaw ? limbRaw.split(',').map((l) => l.trim()).filter(Boolean) : []

  const isAbnormal = gait && gait !== '정상'

  return (
    <div className={`overflow-hidden rounded-[10px] border shadow-sm ${isAbnormal ? 'border-amber-200' : 'border-slate-200'}`}>
      <div className={`flex items-center gap-2 px-3 py-2 ${isAbnormal ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-teal-500 to-emerald-400'}`}>
        <Activity size={13} className="text-white/80" strokeWidth={2} />
        <p className="text-xs font-bold text-white">보행 평가</p>
      </div>
      <div className="bg-white px-3 py-2.5 text-xs">
        {!gait ? (
          <p className="text-slate-400">미입력</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-2.5 py-0.5 font-semibold ${isAbnormal ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
              {gait}
            </span>
            {grade && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                {grade}
              </span>
            )}
            {limbs.length > 0 && (
              <div className="flex items-center gap-1">
                {limbs.map((l) => (
                  <span key={l} className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 font-bold text-amber-700">
                    {LIMB_LABEL[l] ?? l}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function JointCard({ physical }: { physical: Record<string, unknown> }) {
  const affectedRaw = physical['joint_affected'] as string | undefined
  const evalJsonRaw = physical['joint_eval_json'] as string | undefined
  const detail = physical['joint_detail'] as string | undefined

  const selectedJoints = affectedRaw
    ? affectedRaw.split(',').map((j) => j.trim()).filter(Boolean)
    : []

  type EvalEntry = { findings: string[]; note?: string } | string[]
  const rawMap: Record<string, EvalEntry> = (() => {
    try { return JSON.parse(evalJsonRaw || '{}') } catch { return {} }
  })()
  const evalMap: Record<string, { findings: string[]; note: string }> = {}
  for (const [k, v] of Object.entries(rawMap)) {
    evalMap[k] = Array.isArray(v)
      ? { findings: v, note: '' }
      : { findings: (v as { findings: string[] }).findings ?? [], note: (v as { note?: string }).note ?? '' }
  }

  if (selectedJoints.length === 0 && !detail) return null

  return (
    <div className="overflow-hidden rounded-[10px] border border-indigo-200 shadow-sm">
      <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-400 px-3 py-2">
        <Bone size={13} className="text-white/80" strokeWidth={2} />
        <p className="text-xs font-bold text-white">관절 소견</p>
        <span className="ml-auto rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
          {selectedJoints.length > 0 ? `${selectedJoints.length}개 관절` : ''}
        </span>
      </div>
      <div className="divide-y divide-slate-100 bg-white">
        {selectedJoints.length === 0 && (
          <div className="flex items-center gap-2 px-3 py-2">
            <CheckCircle2 size={12} className="text-emerald-500" strokeWidth={2} />
            <p className="text-xs text-emerald-700">이상 관절 없음</p>
          </div>
        )}
        {selectedJoints.map((joint) => {
          const entry = evalMap[joint] ?? { findings: [], note: '' }
          const { findings, note } = entry
          return (
            <div key={joint} className={`px-3 py-2 ${findings.length > 0 ? 'bg-amber-50/60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {findings.length > 0
                    ? <AlertCircle size={11} className="shrink-0 text-amber-500 mt-0.5" strokeWidth={2} />
                    : <CheckCircle2 size={11} className="shrink-0 text-emerald-400 mt-0.5" strokeWidth={2} />
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
              {note && (
                <p className="mt-1 pl-4 text-[11px] text-slate-500">{note}</p>
              )}
            </div>
          )
        })}
        {detail && (
          <div className="px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">추가 소견 </span>{detail}
          </div>
        )}
      </div>
    </div>
  )
}

function OtherMusculoCard({ physical }: { physical: Record<string, unknown> }) {
  const posture = physical['posture'] as string | undefined
  const atrophy = physical['muscle_atrophy'] as string | undefined
  const spinalRaw = physical['spinal_pain'] as string | undefined
  const spinals = spinalRaw ? spinalRaw.split(',').map((s) => s.trim()).filter(Boolean) : []

  const hasData = posture || atrophy || spinals.length > 0
  if (!hasData) return null

  return (
    <div className="overflow-hidden rounded-[10px] border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 px-3 py-2">
        <Dumbbell size={13} className="text-white/80" strokeWidth={2} />
        <p className="text-xs font-bold text-white">자세 · 근육 · 척추</p>
      </div>
      <div className="divide-y divide-slate-100 bg-white">
        {posture && (
          <div className={`flex items-baseline justify-between gap-3 px-3 py-2 ${posture !== '정상' ? 'bg-amber-50' : ''}`}>
            <span className="text-xs font-semibold text-slate-500">자세</span>
            <span className={`text-xs ${posture !== '정상' ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>{posture}</span>
          </div>
        )}
        {atrophy && (
          <div className={`flex items-baseline justify-between gap-3 px-3 py-2 ${atrophy !== '없음' ? 'bg-amber-50' : ''}`}>
            <span className="text-xs font-semibold text-slate-500">근육 위축</span>
            <span className={`text-xs ${atrophy !== '없음' ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>{atrophy}</span>
          </div>
        )}
        {spinals.length > 0 && (
          <div className="flex items-start justify-between gap-3 px-3 py-2 bg-amber-50">
            <span className="text-xs font-semibold text-slate-500 shrink-0">척추 통증</span>
            <div className="flex flex-wrap justify-end gap-1">
              {spinals.map((s) => (
                <span key={s} className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  physical: Record<string, unknown>
}

export function JointSection({ physical }: Props) {
  const hasAny = !!(
    physical['gait'] || physical['joint_affected'] || physical['posture'] ||
    physical['muscle_atrophy'] || physical['spinal_pain']
  )
  if (!hasAny) return null

  return (
    <section className="mb-10">
      <SectionTitle>근골격계 · 관절검사</SectionTitle>
      <div className="flex flex-col gap-1 sm:gap-3">
        <GaitCard physical={physical} />
        <JointCard physical={physical} />
        <OtherMusculoCard physical={physical} />
      </div>
    </section>
  )
}
