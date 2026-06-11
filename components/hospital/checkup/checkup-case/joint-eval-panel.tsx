'use client'

import { Input } from '@/components/ui/input'

const JOINT_FINDINGS = ['부종', '통증', 'ROM 감소', '염발음', '불안정성', '관절액 증가', '탈구', '아탈구'] as const
type JointFinding = (typeof JOINT_FINDINGS)[number]

export interface JointEvalEntry {
  findings: JointFinding[]
  note: string
}
export type JointEvalMap = Record<string, JointEvalEntry>

function parseEvalMap(json: string): JointEvalMap {
  try {
    const raw = JSON.parse(json || '{}')
    const result: JointEvalMap = {}
    for (const [joint, val] of Object.entries(raw)) {
      if (Array.isArray(val)) {
        // 이전 형식 호환 (string[])
        result[joint] = { findings: val as JointFinding[], note: '' }
      } else if (val && typeof val === 'object' && 'findings' in val) {
        result[joint] = val as JointEvalEntry
      }
    }
    return result
  } catch {
    return {}
  }
}

interface Props {
  selectedJoints: string[]
  evalJson: string
  onChange: (json: string) => void
}

export default function JointEvalPanel({ selectedJoints, evalJson, onChange }: Props) {
  if (selectedJoints.length === 0) return null

  const evalMap = parseEvalMap(evalJson)

  const toggleFinding = (joint: string, finding: JointFinding) => {
    const entry = evalMap[joint] ?? { findings: [], note: '' }
    const next = entry.findings.includes(finding)
      ? entry.findings.filter((f) => f !== finding)
      : [...entry.findings, finding]
    onChange(JSON.stringify({ ...evalMap, [joint]: { ...entry, findings: next } }))
  }

  const setNote = (joint: string, note: string) => {
    const entry = evalMap[joint] ?? { findings: [], note: '' }
    onChange(JSON.stringify({ ...evalMap, [joint]: { ...entry, note } }))
  }

  return (
    <div className="col-span-full flex flex-col gap-2">
      <p className="text-xs font-medium text-slate-500">관절별 소견</p>
      <div className="flex flex-col gap-1.5">
        {selectedJoints.map((joint) => {
          const entry = evalMap[joint] ?? { findings: [], note: '' }
          return (
            <div key={joint} className="rounded-lg border border-slate-100 bg-white px-3 py-2.5">
              <p className="mb-2 text-[11px] font-bold text-slate-700">{joint}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-2">
                {JOINT_FINDINGS.map((f) => (
                  <label key={f} className="flex cursor-pointer items-center gap-1 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={entry.findings.includes(f)}
                      onChange={() => toggleFinding(joint, f)}
                      className="h-3.5 w-3.5 accent-teal-600"
                    />
                    {f}
                  </label>
                ))}
              </div>
              <Input
                value={entry.note}
                onChange={(e) => setNote(joint, e.target.value)}
                className="h-7 text-xs"
                placeholder="추가 소견 (선택)"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
