'use client'

import { cn } from '@/lib/utils/utils'
import type { OncologyCaseDetail } from '@/types/hospital/oncology-type'
import type { OncologyDiagnosisInputRow } from '@/lib/services/oncology/fetch-oncology-case'
import { CalendarDays, Cat, Dog, FileText, PawPrint, User } from 'lucide-react'

function calcAge(birth: string | null): string {
  if (!birth) return '—'
  const birthDate = new Date(birth)
  const today = new Date()
  const years = today.getFullYear() - birthDate.getFullYear()
  const months =
    today.getMonth() - birthDate.getMonth() +
    (today.getDate() < birthDate.getDate() ? -1 : 0)
  const totalMonths = years * 12 + months
  if (totalMonths < 12) return `${totalMonths}개월`
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  return m > 0 ? `${y}세 ${m}개월` : `${y}세`
}

const STATUS_LABEL: Record<string, string> = {
  active: '치료 진행 중',
  completed: '치료 완료',
  discontinued: '치료 중단',
  deceased: '사망',
}
const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-blue-100 text-blue-800',
  discontinued: 'bg-slate-100 text-slate-700',
  deceased: 'bg-red-100 text-red-800',
}
const SPECIES_LABEL: Record<string, string> = {
  dog: '개',
  cat: '고양이',
  rabbit: '토끼',
  bird: '조류',
  exotic: '특수동물',
}
const SEX_LABEL: Record<string, string> = {
  male: '수컷',
  female: '암컷',
  male_neutered: '중성화 수컷',
  female_neutered: '중성화 암컷',
}

interface OwnerTab1InfoProps {
  caseDetail: OncologyCaseDetail
  diagnosisInput: OncologyDiagnosisInputRow | null
}

export default function OwnerTab1Info({ caseDetail, diagnosisInput }: OwnerTab1InfoProps) {
  const p = caseDetail.patient
  const ownerNote = diagnosisInput?.additional_notes ?? null

  return (
    <div className="space-y-4">
      {/* Patient card */}
      <div className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            {/^(cat|feline)$/i.test(p.species)
              ? <Cat size={26} className="text-rose-500" />
              : /^(dog|canine)$/i.test(p.species)
                ? <Dog size={26} className="text-rose-500" />
                : <PawPrint size={26} className="text-rose-500" />
            }
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{p.name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-slate-500">{SPECIES_LABEL[p.species] ?? p.species}</span>
              {p.breed && <span className="text-sm text-slate-400">{p.breed}</span>}
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLOR[caseDetail.status] ?? 'bg-slate-100 text-slate-700')}>
                {STATUS_LABEL[caseDetail.status] ?? caseDetail.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {p.birth && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-0.5">나이</p>
              <p className="text-sm font-semibold text-slate-800">{calcAge(p.birth)}</p>
            </div>
          )}
          {caseDetail.sex && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-0.5">성별</p>
              <p className="text-sm font-semibold text-slate-800">{SEX_LABEL[caseDetail.sex] ?? caseDetail.sex}</p>
            </div>
          )}
          {caseDetail.body_weight && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-0.5">체중</p>
              <p className="text-sm font-semibold text-slate-800">{caseDetail.body_weight} kg</p>
            </div>
          )}
          {p.owner_name && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-0.5">보호자</p>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                <User size={12} className="text-slate-400" />
                {p.owner_name}
              </p>
            </div>
          )}
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-0.5">진단일</p>
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
              <CalendarDays size={12} className="text-slate-400" />
              {caseDetail.case_date}
            </p>
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      <div className="rounded-xl border bg-white p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">진단명</p>
        <p className="text-lg font-bold text-slate-900">{caseDetail.diagnosis_name}</p>
        {caseDetail.stage && (
          <p className="text-sm text-slate-500 mt-1">병기: Stage {caseDetail.stage}</p>
        )}
      </div>

      {/* Owner guidance note */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-indigo-500" />
          <p className="text-sm font-semibold text-indigo-900">담당 수의사 안내</p>
        </div>
        {ownerNote ? (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ownerNote}</p>
        ) : (
          <p className="text-sm text-slate-400 italic">
            담당 수의사가 아직 안내문을 작성하지 않았습니다.
          </p>
        )}
      </div>
    </div>
  )
}
