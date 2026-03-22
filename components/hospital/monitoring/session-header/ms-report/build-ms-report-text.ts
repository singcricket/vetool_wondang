import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { MsMemo, VITAL_REFERENCE_DATA } from '@/types/monitoring/monitoring-type'
import { User, Vet } from '@/types'
import { differenceInDays, differenceInMinutes, format } from 'date-fns'

function ageDisplay(birth: string | null): string {
  if (!birth) return '-'
  const days = differenceInDays(new Date(), new Date(birth))
  const years = Math.floor(days / 365)
  const months = Math.floor((days % 365) / 30)
  return years > 0 ? `${years}세 ${months}개월` : `${months}개월`
}

function line(label: string, value: string): string {
  return `${label}: ${value}`
}

function section(title: string, body: string[]): string {
  return [`\n[${title}]`, ...body].join('\n')
}

// ── 1. 환자 정보 ──────────────────────────────────────────
function buildPatientSection(msData: MsWithPatientWithWeight): string {
  const p = msData.patient
  if (!p) return section('1. 환자 정보', ['환자 정보 없음'])
  return section('1. 환자 정보', [
    `이름: ${p.name ?? '-'}(${p.hos_patient_id ?? '-'})`,
    `종/품종/성별: ${p.species ?? '-'}/${p.breed ?? '-'}/${p.gender ?? '-'}`,
    `생년월일: ${p.birth ?? '-'}(${ageDisplay(p.birth ?? null)})`,
    `체중: ${p.body_weight ? `${p.body_weight} kg` : '-'}`,
  ])
}

// ── 2. 수의사 정보 ────────────────────────────────────────
function buildVetSection(msData: MsWithPatientWithWeight, vetsListData: Vet[]): string {
  const sub = msData.vet_sub
  const rows: string[] = []
  
  const getVetName = (id: string | null | undefined) => 
    vetsListData.find((vet) => vet.user_id === id)?.name ?? ''

  if (msData.vet_main) rows.push(line('담당의', getVetName(msData.vet_main)))
  if (msData.vet_primary) rows.push(line('집도의', getVetName(msData.vet_primary)))
  if (sub?.secondary) rows.push(line('보조의', getVetName(sub.secondary)))
  if (sub?.anesthesia) rows.push(line('마취의', getVetName(sub.anesthesia)))
  if (sub?.other) rows.push(line('기타', sub.other ?? ''))
  
  return section('2. 수의사 정보', rows.length ? rows.filter(r => r.split(': ')[1] !== '') : ['-'])
}

// ── 3. 처치 정보 ──────────────────────────────────────────
function buildTreatmentSection(msData: MsWithPatientWithWeight): string {
  const memos = (msData.memo_tx as MsMemo[])
    .filter((m) => !m.is_realtime_memo)
    .sort((a, b) => {
      if (!a.done_timestamp && !b.done_timestamp) return 0
      if (!a.done_timestamp) return 1
      if (!b.done_timestamp) return -1
      return (
        new Date(a.done_timestamp).getTime() -
        new Date(b.done_timestamp).getTime()
      )
    })

  if (!memos.length) return section('3. 처치 정보', ['처치 정보 없음'])

  const rows = memos.map((m) => {
    const time = m.done_timestamp
      ? format(new Date(m.done_timestamp), 'HH:mm')
      : '-'
    const done = m.is_done ? '✓' : '☐'
    return `${done} [${time}] ${m.memo}`
  })
  return section('3. 처치 정보', rows)
}

// ── 4. 체크리스트 (range type 항목만, min/max/avg) ─────────
function buildChecklistSection(msData: MsWithPatientWithWeight): string {
  const slots = (msData.vital_results ?? []).sort(
    (a, b) => Number(a.minTime) - Number(b.minTime),
  )

  const presentRangeNames: string[] = []
  for (const vd of VITAL_REFERENCE_DATA) {
    if (vd.type !== 'range') continue
    const hasData = slots.some((s) =>
      s.vitals.some((v) => v.vitalName === vd.vitalName && v.value !== ''),
    )
    if (hasData) presentRangeNames.push(vd.vitalName)
  }

  if (!presentRangeNames.length || !slots.length)
    return section('4. 체크리스트', ['측정 데이터 없음'])

  const rows = presentRangeNames.map((name) => {
    const values = slots
      .flatMap((s) => s.vitals)
      .filter((v) => v.vitalName === name && v.value !== '')
      .map((v) => parseFloat(v.value))
      .filter((n) => !isNaN(n))

    if (!values.length) return `${name}: 측정 데이터 없음`

    const min = Math.min(...values).toFixed(1)
    const max = Math.max(...values).toFixed(1)
    const avg = (values.reduce((s, v) => s + v, 0) / values.length).toFixed(1)
    const unit =
      VITAL_REFERENCE_DATA.find((v) => v.vitalName === name)?.unit ?? ''

    return `${name}: 최소 ${min}${unit} / 최대 ${max}${unit} / 평균 ${avg}${unit} (측정 ${values.length}회)`
  })

  return section('4. 체크리스트', rows)
}

// ── 5. 실시간 타임테이블 ──────────────────────────────────
function buildRealtimeSection(msData: MsWithPatientWithWeight): string {
  const startTime = msData.start_time ? new Date(msData.start_time) : null
  const memos = (msData.memo_tx as MsMemo[])
    .filter((m) => m.done_timestamp !== null)
    .sort(
      (a, b) =>
        new Date(a.done_timestamp!).getTime() -
        new Date(b.done_timestamp!).getTime(),
    )

  if (!memos.length) return section('5. 실시간 타임테이블', ['완료된 실시간 메모 없음'])

  const rows = memos.map((m) => {
    const doneTime = new Date(m.done_timestamp!)
    const timeStr = format(doneTime, 'HH:mm')
    const elapsed = startTime
      ? ` (+${differenceInMinutes(doneTime, startTime)}분)`
      : ''
    return `[${timeStr}${elapsed}] ${m.memo}`
  })
  return section('5. 실시간 타임테이블', rows)
}

// ── 6. 수의사 소견 ──────────────────────────────────
function buildVetCommentSection(msData: MsWithPatientWithWeight): string {
  const comment = msData.memo_etc
  return section('6. 수의사 소견', comment ? [comment] : ['등록된 소견이 없습니다.'])
}

// ── 전체 텍스트 생성 ──────────────────────────────────────
export function buildMsReportText(msData: MsWithPatientWithWeight, vetsListData: Vet[]): string {
  const patientName = msData.patient?.name ?? '미지정 환자'
  const reportDate = msData.due_date
    ? format(new Date(msData.due_date), 'yyyy년 MM월 dd일')
    : '-'

  const startTime = msData.start_time ? new Date(msData.start_time) : null
  const endTime = msData.end_time ? new Date(msData.end_time) : null
  const startLabel = startTime ? format(startTime, 'HH:mm') : '-'
  const endLabel = endTime ? format(endTime, 'HH:mm') : '-'
  const durationLabel =
    startTime && endTime
      ? (() => {
          const total = differenceInMinutes(endTime, startTime)
          const h = Math.floor(total / 60)
          const m = total % 60
          return h > 0 ? `${h}시간 ${m}분` : `${m}분`
        })()
      : '-'

  const header = [
    `${msData.session_title ?? ''} 모니터링 리포트`,
    `${patientName} | ${reportDate}`,
    `시작: ${startLabel}  종료: ${endLabel}  소요: ${durationLabel}`,
    '='.repeat(40),
  ].join('\n')

  return [
    header,
    buildPatientSection(msData),
    buildVetSection(msData, vetsListData),
    buildTreatmentSection(msData),
    buildChecklistSection(msData),
    buildRealtimeSection(msData),
    buildVetCommentSection(msData),
  ].join('\n')
}
