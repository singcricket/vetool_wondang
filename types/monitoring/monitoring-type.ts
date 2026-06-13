import type {Patient } from '@/types'
import type { MemoColor } from '@/types/icu/chart'


export type MsVetSub = {
  secondary : string // 보조의(assistant) name
  anesthesia: string // 마취의 name
  other: string // 기타 name
}

export type MsPatient = Omit<
  Patient,
  'hos_id' | 'created_at' | 'owner_id'
> & {
  body_weight: string | null
  weight_measured_date: string | null
}


export type MemoScheduleType = 'absolute' | 'after_start' | 'after_prev'

export type MsMemoSchedule = {
  type: MemoScheduleType
  value: string | number // '16:30', 30, 15
  target_memo_id?: string
}

export type MsMemo = { 
  id: string             // 보통 id나 순번 (문자열인 경우)
  memo: string              // 메모 내용
  check: string             // 체크 여부나 관련 텍스트
  create_timestamp: string  // 생성 시간 (보통 밀리초 단위 숫자로 관리)
  color: MemoColor             // 메모 색상 (예: "#ffffff" 또는 "red")
  is_done: boolean          // 완료 여부 (true/false)
  is_realtime_memo: boolean // 실시간 메모 여부
  done_timestamp: string | null // 완료 시간 (완료 전엔 없을 수 있으므로 null 허용)
  chosen: boolean           // 선택 여부
  has_imgs: boolean         // 이미지 포함 여부
  img_url: string[]         // 이미지 URL들의 배열 (문자열 배열)
  schedule?: MsMemoSchedule // 예정 시간 기록용
}
export type MsMemoTx = MsMemo[] | []

export type MsvitalResults = 
{
  id : string;
  체온 : string ;
  심박수 : string;
  호흡수 : string;
  혈압 : string;
  SPO2 : string;
  혈당 : string;
  EtCO2 : string;
  MMC : string;
  NIBP : string;
  SkinTurgor: string; 
  CRT : string;
  memo : string;
  기타 : string;
  create_timestamp: string;
  min : string;
}
export interface VitalConfig {
  vitalName: string;
  type: "range" | "select" | "text";
  canine?: { min: string; max: string };
  feline?: { min: string; max: string };
  unit?: string;
  options?: string[];
}

export const VITAL_REFERENCE_DATA: VitalConfig[] = [
  {
    vitalName: "체온(°C)", type: "range",
    canine: { min: "37.5", max: "39.2" },
    feline: { min: "37.8", max: "39.2" },
    unit: "°C",
  },
  {
    vitalName: "심박수(HR)", type: "range",
    canine: { min: "60", max: "160" },
    feline: { min: "120", max: "200" },
    unit: "bpm",
  },
  {
    vitalName: "호흡수(RR)", type: "range",
    canine: { min: "10", max: "30" },
    feline: { min: "15", max: "40" },
    unit: "회/분",
  },
  {
    vitalName: "혈압(BP)", type: "range",
    canine: { min: "110", max: "160" },
    feline: { min: "100", max: "160" },
    unit: "mmHg",
  },
  {
    vitalName: "MAP(평균동맥압)", type: "range",
    canine: { min: "60", max: "100" },
    feline: { min: "60", max: "100" },
    unit: "mmHg",
  },
  {
    vitalName: "SPO2", type: "range",
    canine: { min: "95", max: "100" },
    feline: { min: "95", max: "100" },
    unit: "%",
  },
  {
    vitalName: "EtCO2", type: "range",
    canine: { min: "35", max: "45" },
    feline: { min: "28", max: "40" },
    unit: "mmHg",
  },
  {
    vitalName: "혈당", type: "range",
    canine: { min: "70", max: "120" },
    feline: { min: "70", max: "150" },
    unit: "mg/dL",
  },
  {
    vitalName: "젖산(Lactate)", type: "range",
    canine: { min: "0", max: "2" },
    feline: { min: "0", max: "2" },
    unit: "mmol/L",
  },
  {
    vitalName: "CRT", type: "range",
    canine: { min: "0", max: "2" },
    feline: { min: "0", max: "2" },
    unit: "초",
  },
  {
    vitalName: "MMC", type: "select",
    options: ["Pink", "Pale", "Icteric(황달)", "Cyanotic(청색증)", "Congested"],
  },
  {
    vitalName: "Skin Turgor", type: "select",
    options: ["< 2s (정상)", "2-5s (중등도)", "> 5s (심함)"],
  },
  {
    vitalName: "Mental", type: "select",
    options: ["Alert", "Depressed", "Stupor", "Coma"],
  },
  {
    vitalName: "PLR", type: "select",
    options: ["Normal", "Sluggish", "Fixed"],
  },
  {
    vitalName: "통증점수(NRS)", type: "range",
    canine: { min: "0", max: "3" },
    feline: { min: "0", max: "3" },
    unit: "/10",
  },
  {
    vitalName: "MAC", type: "range",
    canine: { min: "0.8", max: "1.5" },
    feline: { min: "1.0", max: "1.5" },
    unit: "val",
  },
  {
    vitalName: "배뇨량", type: "range",
    canine: { min: "1", max: "2" },
    feline: { min: "1", max: "2" },
    unit: "ml/kg/hr",
  },
  {
    vitalName: "수액량", type: "range",
    canine: { min: "0", max: "500" },
    feline: { min: "0", max: "500" },
    unit: "ml/hr",
  },
  {
    vitalName: "체중", type: "range",
    canine: { min: "0", max: "100" },
    feline: { min: "0", max: "15" },
    unit: "kg",
  },
  {
    vitalName: "산소유량", type: "range",
    canine: { min: "0.5", max: "3" },
    feline: { min: "0.5", max: "3" },
    unit: "L/min",
  },
  { vitalName: "기타", type: "text" },
];

// const monitoringData = [
//   {
//     minTime: "10",
//     create_timestamp: "2026-03-07T16:10:00Z",
//     vitals: [
//       { vitalName: "체온", value: "38.5" },
//       { vitalName: "심박수", value: "110" },
//       { vitalName: "SPO2", value: "98" }
//     ]
//   },
//   {
//     minTime: "15",
//     create_timestamp: "2026-03-07T16:15:00Z",
//     vitals: [
//       { vitalName: "체온", value: "38.6" },
//       { vitalName: "심박수", value: "112" }
//     ]
//   },
//   {
//     minTime: "20",
//     create_timestamp: "2026-03-07T16:20:00Z",
//     vitals: [
//       { vitalName: "체온", value: "38.4" },
//       { vitalName: "SPO2", value: "99" }
//     ]
//   }
// ];

// 1. 개별 측정 항목 (예: 체온: 38.5)
export type VitalEntry = {
  vitalName: string; // "체온", "심박수" 등
  value: string;     // "38.5", "Pink" 등
}

// 2. 특정 시간대의 기록 묶음 (예: 10분 기록지)
export type VitalTimeSlot = {
  create_timestamp: string;    // "2026-03-07T16:10:00Z" (실제 측정 시간)
  minTime: string;   // " 10분" 또는 "16:10" (화면 표시용)
  vitals: VitalEntry[];  // 이 시간대에 측정된 여러 바이탈들의 배열
}

// 3. 전체 모니터링 데이터 (배열로 묶기)
export type VitalResults = VitalTimeSlot[];