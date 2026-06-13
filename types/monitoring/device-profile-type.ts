import { VITAL_REFERENCE_DATA } from './monitoring-type'

// 장비 화면의 라벨 ↔ 우리 항목 매핑 한 행
export type FieldMapping = {
  device_label: string      // 장비 화면에 표시되는 라벨 (예: "SpO2", "NIBP Sys")
  our_vital: string | null  // VITAL_REFERENCE_DATA의 vitalName, 커스텀명, null=무시
  parse_hint: string | null // 파싱 힌트 (예: "슬래시 앞 숫자만")
}

// AI few-shot 학습용 검증 샘플
export type VerifiedSample = {
  raw_extracted: { label: string; value: string }[]   // AI가 처음 뽑은 원본
  confirmed: { label: string; value: string }[]        // 유저가 확인/수정한 최종값
  memo: string | null
}

// DB Row 타입
export type DeviceProfile = {
  id: string
  hos_id: string
  device_name: string
  device_memo: string | null
  layout_hint: string | null
  field_mappings: FieldMapping[]
  verified_samples: VerifiedSample[]
  created_at: string
  updated_at: string
}

// 캘리브레이션 단계에서 AI가 반환하는 원시 추출 결과
export type CalibrationExtractedItem = {
  label: string   // 장비 화면에서 감지된 라벨
  value: string   // 감지된 값
}

// 스캔 결과 (runtime: 사진 → 수치 추출)
export type MonitorScanResult = {
  vital_name: string    // 우리 측정 항목명 (our_vital에서 매핑)
  value: string         // 추출된 값
  device_label: string  // 원본 장비 라벨 (참고용)
  is_abnormal: boolean  // 정상 범위 이탈 여부
}

// AI 임상 해석 결과
export type MonitorScanAssessment = {
  alerts: string[]      // 즉각 주의 항목 (범위 이탈, 급격한 변화)
  status: string        // 현재 환자 상태 요약 (1-2문장)
  suggestions: string[] // 구체적 대응 방법
}

// scanMonitorImage 전체 반환값
export type MonitorScanResponse = {
  vitals: MonitorScanResult[]
  assessment: MonitorScanAssessment | null
}

export const VITAL_NAMES = VITAL_REFERENCE_DATA.map((v) => v.vitalName)
