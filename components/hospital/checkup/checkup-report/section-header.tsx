import { PawPrint, MapPin, Phone, Clock } from 'lucide-react'
import { calcAge, speciesLabel } from './report-utils'
import type { getLifeStageFromBirth } from '@/constants/hospital/checkup/life-stage-ref'
import type { HosInfo } from '@/lib/services/checkup/fetch-checkup-report'

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
  hosInfo?: HosInfo | null
  abnormalCount: number
  coverImage?: { img_url: string } | null
  lifeStage: LifeStageResult
}

export function ReportHeader({
  patientName, species, breed, gender, birth, ownerName,
  checkupDateLabel, vetName, hospitalName, hosInfo,
  abnormalCount, coverImage, lifeStage,
}: ReportHeaderProps) {
  return (
    <div className="mb-8 overflow-hidden rounded-[10px] border border-slate-200 shadow-sm">
      {/* 메인 헤더 */}
      <div className="bg-teal-600">
        <div className="flex items-stretch">

          {/* 좌측 — 환자 사진 */}
          <div className="shrink-0 p-5 pr-0">
            {coverImage ? (
              <img
                src={coverImage.img_url}
                alt={patientName}
                className="h-40 w-40 rounded-[10px] border-2 border-white/30 object-cover shadow-md"
              />
            ) : (
              <div className="flex h-40 w-40 flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-white/30 bg-white/10">
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
      <div className="bg-slate-50 px-4 py-3 text-xs text-slate-500">
        {/* 검진 정보 행 */}
        <div className="flex flex-wrap gap-4">
          <span>검진일 <strong className="text-slate-700">{checkupDateLabel}</strong></span>
          {vetName && <span>담당의 <strong className="text-slate-700">{vetName}</strong></span>}
          {ownerName && <span>보호자 <strong className="text-slate-700">{ownerName}</strong></span>}
        </div>

        {/* 병원 정보 행 */}
        {(hospitalName || hosInfo?.address || hosInfo?.phone || hosInfo?.hours) && (
          <div className="mt-2 flex flex-wrap items-start gap-x-4 gap-y-1 border-t border-slate-200 pt-2">
            {hospitalName && (
              <span className="font-semibold text-slate-700">{hospitalName}</span>
            )}
            {hosInfo?.address && (
              <span className="flex items-center gap-1">
                <MapPin size={11} className="shrink-0 text-slate-400" />
                {hosInfo.address}
              </span>
            )}
            {hosInfo?.phone && (
              <span className="flex items-center gap-1">
                <Phone size={11} className="shrink-0 text-slate-400" />
                {hosInfo.phone}
              </span>
            )}
            {hosInfo?.hours && (
              <span className="flex items-center gap-1">
                <Clock size={11} className="shrink-0 text-slate-400" />
                <span className="whitespace-pre-line">{hosInfo.hours}</span>
              </span>
            )}
          </div>
        )}

        {/* 표지 문구 */}
        {hosInfo?.tagline && (
          <p className="mt-2 border-t border-slate-200 pt-2 text-center text-[11px] italic text-slate-400">
            {hosInfo.tagline}
          </p>
        )}
      </div>
    </div>
  )
}
