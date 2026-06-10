import { PawPrint } from 'lucide-react'
import { calcAge, speciesLabel } from './report-utils'
import type { getLifeStageFromBirth } from '@/constants/hospital/checkup/life-stage-ref'

type LifeStageResult = ReturnType<typeof getLifeStageFromBirth>

interface ReportHeaderProps {
  patientName: string
  species: string
  breed: string | null
  gender: string | null
  birth: string | null
  ownerName: string | null
  checkupDateLabel: string
  vetName: string | null
  hospitalName: string | null
  abnormalCount: number
  coverImage?: { img_url: string } | null
  lifeStage: LifeStageResult
}

export function ReportHeader({
  patientName, species, breed, gender, birth, ownerName,
  checkupDateLabel, vetName, hospitalName,
  abnormalCount, coverImage, lifeStage,
}: ReportHeaderProps) {
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* 메인 헤더 */}
      <div className="bg-teal-600">
        <div className="flex items-stretch">

          {/* 좌측 — 환자 사진 */}
          <div className="shrink-0 p-5 pr-0">
            {coverImage ? (
              <img
                src={coverImage.img_url}
                alt={patientName}
                className="h-40 w-40 rounded-xl border-2 border-white/30 object-cover shadow-md"
              />
            ) : (
              <div className="flex h-40 w-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/30 bg-white/10">
                <PawPrint size={32} className="text-white/40" />
                <p className="mt-2 text-[10px] font-medium text-white/40">사진 없음</p>
              </div>
            )}
          </div>

          {/* 우측 — 환자 정보 */}
          <div className="flex flex-1 flex-col justify-center px-6 py-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white">
                건강검진 리포트
              </span>
              {abnormalCount > 0 && (
                <span className="rounded bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                  이상 {abnormalCount}건
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-white">{patientName}</h1>

            <p className="mt-1 text-sm text-teal-100">
              {speciesLabel(species)}
              {breed && ` · ${breed}`}
              {gender && ` · ${gender}`}
              {lifeStage ? ` · ${lifeStage.ageLabel}` : birth ? ` · ${calcAge(birth)}` : ''}
            </p>

            {lifeStage && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${lifeStage.stage.colorClass}`}>
                  {lifeStage.stage.stageKo}
                </span>
                <span className="text-xs text-teal-100">
                  사람 나이 약 <strong className="text-white">{lifeStage.humanAge}세</strong> 상당
                </span>
                <span className="text-[11px] text-teal-200">
                  권장 검진 주기: {lifeStage.stage.checkupInterval}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 메타 */}
      <div className="flex flex-wrap gap-6 bg-slate-50 px-6 py-3 text-xs text-slate-500">
        <span>검진일 <strong className="text-slate-700">{checkupDateLabel}</strong></span>
        {vetName && <span>담당의 <strong className="text-slate-700">{vetName}</strong></span>}
        {hospitalName && <span>병원 <strong className="text-slate-700">{hospitalName}</strong></span>}
        {ownerName && <span>보호자 <strong className="text-slate-700">{ownerName}</strong></span>}
      </div>
    </div>
  )
}
