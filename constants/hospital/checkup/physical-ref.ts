// ============================================================
// physical-ref.ts — 신체검사 항목 정의
// 안과/치과는 별도 전문 모듈로 분리되므로 제외
// ============================================================

export type PhysicalSection =
  | 'vitals'          // 활력징후
  | 'body_condition'  // 체형·근육 상태
  | 'hydration'       // 수화 상태
  | 'lymph_nodes'     // 체표림프절
  | 'cardiovascular'  // 심장혈관계
  | 'respiratory'     // 호흡기계
  | 'abdomen'         // 복부
  | 'musculoskeletal' // 근골격계
  | 'skin'            // 피부·피모
  | 'mentation'       // 정신 상태

export const PHYSICAL_SECTION_LABEL: Record<PhysicalSection, string> = {
  vitals: '활력징후 (Vital Signs)',
  body_condition: '체형·근육 상태',
  hydration: '수화 상태',
  lymph_nodes: '체표림프절',
  cardiovascular: '심장혈관계',
  respiratory: '호흡기계',
  abdomen: '복부',
  musculoskeletal: '근골격계',
  skin: '피부·피모',
  mentation: '정신 상태',
}

export type PhysicalInputType = 'number' | 'select' | 'multiselect' | 'text' | 'boolean'

export interface PhysicalRefItem {
  id: string
  nameKo: string
  nameEn: string
  section: PhysicalSection
  inputType: PhysicalInputType
  unit?: string
  referenceRange?: {
    dog?: string
    cat?: string
    common?: string   // 종 공통
  }
  options?: string[]   // select 타입 전용
  comment?: string     // 임상적 해석 가이드
}

// ────────────────────────────────────────────────────────────
// 활력징후
// ────────────────────────────────────────────────────────────
const vitals: PhysicalRefItem[] = [
  {
    id: 'body_weight',
    nameKo: '체중',
    nameEn: 'Body Weight',
    section: 'vitals',
    inputType: 'number',
    unit: 'kg',
  },
  {
    id: 'temperature',
    nameKo: '체온',
    nameEn: 'Temperature',
    section: 'vitals',
    inputType: 'number',
    unit: '°C',
    referenceRange: { dog: '37.5–39.2', cat: '38.1–39.2' },
    comment: '직장 체온 기준. 38.5℃ 이상 발열, 37.5℃ 미만 저체온',
  },
  {
    id: 'heart_rate',
    nameKo: '심박수',
    nameEn: 'Heart Rate',
    section: 'vitals',
    inputType: 'number',
    unit: 'bpm',
    referenceRange: { dog: '60–180', cat: '140–220' },
    comment: '소형견은 상한이 높음. 고양이는 스트레스 보정 필요',
  },
  {
    id: 'respiratory_rate',
    nameKo: '호흡수',
    nameEn: 'Respiratory Rate',
    section: 'vitals',
    inputType: 'number',
    unit: '회/분',
    referenceRange: { dog: '15–30', cat: '20–40' },
  },
  {
    id: 'systolic_bp',
    nameKo: '수축기 혈압',
    nameEn: 'Systolic BP',
    section: 'vitals',
    inputType: 'number',
    unit: 'mmHg',
    referenceRange: { common: '110–160' },
    comment: '>160 mmHg: 고혈압 의심. >180 mmHg: 심각한 고혈압 (표적장기 손상 위험)',
  },
  {
    id: 'diastolic_bp',
    nameKo: '이완기 혈압',
    nameEn: 'Diastolic BP',
    section: 'vitals',
    inputType: 'number',
    unit: 'mmHg',
    referenceRange: { common: '60–100' },
  },
]

// ────────────────────────────────────────────────────────────
// 체형·근육 상태
// ────────────────────────────────────────────────────────────
const bodyCondition: PhysicalRefItem[] = [
  {
    id: 'bcs',
    nameKo: '체형 점수',
    nameEn: 'BCS',
    section: 'body_condition',
    inputType: 'select',
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    referenceRange: { common: '4–5' },
    comment: '1: 극도 저체중 / 5: 이상적 / 9: 비만. 늑골 촉진 + 허리 윤곽 기준',
  },
  {
    id: 'mcs',
    nameKo: '근육 상태 점수',
    nameEn: 'MCS',
    section: 'body_condition',
    inputType: 'select',
    options: ['1 - 심한 근육감소', '2 - 중등도 근육감소', '3 - 경미한 근육감소', '4 - 정상'],
    referenceRange: { common: '4' },
    comment: '측두근, 어깨, 척추, 골반 근육 촉진 평가. 만성질환/노령 환자에서 중요',
  },
  {
    id: 'weight_change',
    nameKo: '체중 변화',
    nameEn: 'Weight Change',
    section: 'body_condition',
    inputType: 'select',
    options: ['변화 없음', '경미한 감소 (<5%)', '중등도 감소 (5–10%)', '심한 감소 (>10%)', '체중 증가'],
  },
]

// ────────────────────────────────────────────────────────────
// 수화 상태
// ────────────────────────────────────────────────────────────
const hydration: PhysicalRefItem[] = [
  {
    id: 'skin_turgor',
    nameKo: '피부 탄력 (Skin Turgor)',
    nameEn: 'Skin Turgor',
    section: 'hydration',
    inputType: 'select',
    options: ['정상 (<2초)', '경미한 지연 (2–3초)', '지연 (3–5초)', '심한 지연 (>5초)'],
    referenceRange: { common: '정상 (<2초)' },
    comment: '목 뒤 피부를 당겼다가 놓아 회복 시간 측정. 탈수 >5% 시 지연',
  },
  {
    id: 'mmc',
    nameKo: '점막색 (MMC)',
    nameEn: 'Mucous Membrane Color',
    section: 'hydration',
    inputType: 'select',
    options: [
      '핑크 (정상)',
      '창백 (Pale)',
      '흰색 (White/극도 창백)',
      '청색 (Cyanotic)',
      '황달 (Icteric)',
      '벽돌색/충혈 (Brick red)',
      '점상출혈 (Petechiae)',
    ],
    referenceRange: { common: '핑크 (정상)' },
    comment: '잇몸(구강점막) 색상 평가. 창백: 빈혈/쇼크. 황달: 간담도/용혈. 청색: 저산소혈증',
  },
  {
    id: 'crt',
    nameKo: '모세혈관 재충만 시간 (CRT)',
    nameEn: 'CRT',
    section: 'hydration',
    inputType: 'select',
    options: ['<2초 (정상)', '2–3초 (경계)', '>3초 (지연/순환 부전)'],
    referenceRange: { common: '<2초' },
    comment: '잇몸 압박 후 핑크색 회복 시간. >2초: 순환 부전/탈수/쇼크 시사',
  },
  {
    id: 'mucous_moisture',
    nameKo: '점막 습윤도',
    nameEn: 'Mucous Moisture',
    section: 'hydration',
    inputType: 'select',
    options: ['촉촉함 (정상)', '약간 끈적 (Tacky)', '건조 (Dry)'],
    referenceRange: { common: '촉촉함 (정상)' },
    comment: '끈적: 탈수 5–7%. 건조: 탈수 7–9% 이상 시사',
  },
  {
    id: 'dehydration_estimate',
    nameKo: '탈수 추정',
    nameEn: 'Dehydration Estimate',
    section: 'hydration',
    inputType: 'select',
    options: ['<5% (임상 징후 없음)', '5–7%', '7–9%', '10–12%', '>12% (쇼크)'],
    comment: '피부 탄력 + MMC + CRT + 안구함몰 종합 평가',
  },
]

// ────────────────────────────────────────────────────────────
// 체표림프절
// ────────────────────────────────────────────────────────────
const lymphNodes: PhysicalRefItem[] = [
  {
    id: 'ln_mandibular',
    nameKo: '하악 림프절',
    nameEn: 'Mandibular LN',
    section: 'lymph_nodes',
    inputType: 'select',
    options: ['정상', '경미한 종대', '중등도 종대', '심한 종대', '통증 동반', '비대칭'],
    comment: '두경부 구역 배액. 구강/치과 질환, 두경부 종양 시 종대',
  },
  {
    id: 'ln_prescapular',
    nameKo: '전견갑 림프절',
    nameEn: 'Prescapular LN',
    section: 'lymph_nodes',
    inputType: 'select',
    options: ['정상', '경미한 종대', '중등도 종대', '심한 종대', '촉진 불가'],
    comment: '앞다리/흉부 전방 배액',
  },
  {
    id: 'ln_axillary',
    nameKo: '액와 림프절',
    nameEn: 'Axillary LN',
    section: 'lymph_nodes',
    inputType: 'select',
    options: ['정상/촉진 불가', '촉진됨 (비대)', '종대', '심한 종대'],
    comment: '정상 시 촉진 어려움. 촉진 시 종대 의심',
  },
  {
    id: 'ln_inguinal',
    nameKo: '서혜부 림프절',
    nameEn: 'Inguinal LN',
    section: 'lymph_nodes',
    inputType: 'select',
    options: ['정상', '촉진됨 (비대)', '종대', '심한 종대'],
    comment: '뒷다리/복부 후방 배액',
  },
  {
    id: 'ln_popliteal',
    nameKo: '슬와 림프절',
    nameEn: 'Popliteal LN',
    section: 'lymph_nodes',
    inputType: 'select',
    options: ['정상', '경미한 종대', '중등도 종대', '심한 종대'],
    comment: '뒷다리 말단 배액. 림프종 스테이징에서 중요',
  },
  {
    id: 'ln_generalized',
    nameKo: '림프절 종대 패턴',
    nameEn: 'LN Pattern',
    section: 'lymph_nodes',
    inputType: 'select',
    options: ['국소성', '전신성 (다발성)', '해당 없음'],
    comment: '전신성 림프절종대: 림프종, 전신감염(진균 등), 면역매개성 질환 시사',
  },
]

// ────────────────────────────────────────────────────────────
// 심장혈관계
// ────────────────────────────────────────────────────────────
const cardiovascular: PhysicalRefItem[] = [
  {
    id: 'heart_rhythm',
    nameKo: '심장 리듬',
    nameEn: 'Heart Rhythm',
    section: 'cardiovascular',
    inputType: 'select',
    options: ['정규 (Regular)', '불규칙 (Irregular)', '규칙적 불규칙 (Regularly irregular)'],
    referenceRange: { common: '정규 (Regular)' },
  },
  {
    id: 'heart_murmur',
    nameKo: '심잡음',
    nameEn: 'Heart Murmur',
    section: 'cardiovascular',
    inputType: 'select',
    options: ['없음', 'I/VI', 'II/VI', 'III/VI', 'IV/VI', 'V/VI', 'VI/VI'],
    comment: 'I–II: 경미, III: 흉벽 진전 없음, IV 이상: 진전(thrill) 동반. ACVIM 분류와 연계',
  },
  {
    id: 'murmur_location',
    nameKo: '심잡음 위치',
    nameEn: 'Murmur Location',
    section: 'cardiovascular',
    inputType: 'select',
    options: [
      '해당 없음',
      '좌측 심첨부 (승모판)',
      '좌측 기저부 (대동맥/폐동맥)',
      '우측 심첨부 (삼첨판)',
      '우측 기저부',
      '전반적',
    ],
  },
  {
    id: 'pulse_quality',
    nameKo: '맥박 질',
    nameEn: 'Pulse Quality',
    section: 'cardiovascular',
    inputType: 'select',
    options: ['강하고 동기적 (정상)', '약함 (Weak)', '과도한 도약맥 (Bounding)', '맥박 결손', '촉지 불가'],
    referenceRange: { common: '강하고 동기적 (정상)' },
  },
  {
    id: 'jugular_distension',
    nameKo: '경정맥 확장',
    nameEn: 'Jugular Distension',
    section: 'cardiovascular',
    inputType: 'select',
    options: ['없음 (정상)', '경미한 확장', '확장 동반 박동', '심한 확장'],
    comment: '우심부전, 심낭삼출, 상대정맥증후군 시사',
  },
]

// ────────────────────────────────────────────────────────────
// 호흡기계
// ────────────────────────────────────────────────────────────
const respiratory: PhysicalRefItem[] = [
  {
    id: 'respiratory_effort',
    nameKo: '호흡 노력',
    nameEn: 'Respiratory Effort',
    section: 'respiratory',
    inputType: 'select',
    options: ['정상', '경미한 증가', '중등도 호흡곤란', '심한 호흡곤란 (Open-mouth)', '복식호흡'],
    referenceRange: { common: '정상' },
  },
  {
    id: 'lung_sounds_left',
    nameKo: '폐음 (좌측)',
    nameEn: 'Lung Sounds (L)',
    section: 'respiratory',
    inputType: 'select',
    options: ['정상', '감소/소실', '거친 숨소리 (Harsh)', '수포음 (Crackles)', '천명음 (Wheezes)', '마찰음 (Friction rub)'],
  },
  {
    id: 'lung_sounds_right',
    nameKo: '폐음 (우측)',
    nameEn: 'Lung Sounds (R)',
    section: 'respiratory',
    inputType: 'select',
    options: ['정상', '감소/소실', '거친 숨소리 (Harsh)', '수포음 (Crackles)', '천명음 (Wheezes)', '마찰음 (Friction rub)'],
  },
  {
    id: 'respiratory_pattern',
    nameKo: '호흡 패턴',
    nameEn: 'Respiratory Pattern',
    section: 'respiratory',
    inputType: 'select',
    options: ['정상', '제한성 (Restrictive)', '폐쇄성 (Obstructive)', '역설적 호흡'],
    comment: '제한성: 흉수/폐렴/흉막질환. 폐쇄성: 기도 협착/천식',
  },
  {
    id: 'thoracic_percussion',
    nameKo: '흉부 타진',
    nameEn: 'Thoracic Percussion',
    section: 'respiratory',
    inputType: 'select',
    options: ['정상 (공명)', '탁음 (흉수/폐실질화)', '과공명 (기흉/폐기종)', '미실시'],
  },
]

// ────────────────────────────────────────────────────────────
// 복부
// ────────────────────────────────────────────────────────────
const abdomen: PhysicalRefItem[] = [
  {
    id: 'abdominal_palpation',
    nameKo: '복부 촉진',
    nameEn: 'Abdominal Palpation',
    section: 'abdomen',
    inputType: 'select',
    options: ['정상 (유연)', '긴장/방어 (Guarding)', '통증 반응', '종괴 촉진', '복수 의심 (Fluid wave)'],
    referenceRange: { common: '정상 (유연)' },
  },
  {
    id: 'abdominal_pain',
    nameKo: '복통',
    nameEn: 'Abdominal Pain',
    section: 'abdomen',
    inputType: 'select',
    options: ['없음', '경미 (촉진 시 약한 반응)', '중등도', '심함 (자발통 동반)'],
  },
  {
    id: 'liver_size',
    nameKo: '간 크기',
    nameEn: 'Liver Size',
    section: 'abdomen',
    inputType: 'select',
    options: ['정상 범위', '간종대 (Hepatomegaly)', '간 위축 (Microhepatica)', '평가 불가'],
    comment: '갈비뼈 아래 간 촉진. 간종대: 간질환/쿠싱/울혈. 간위축: 간경화/문맥단락',
  },
  {
    id: 'spleen_size',
    nameKo: '비장 크기',
    nameEn: 'Spleen Size',
    section: 'abdomen',
    inputType: 'select',
    options: ['정상', '비종대 (Splenomegaly)', '결절성 비종대', '평가 불가'],
    comment: '비종대: 비장종양, 울혈, 면역매개성 질환, 수축기(바르비투레이트계 마취제)',
  },
  {
    id: 'bladder',
    nameKo: '방광',
    nameEn: 'Bladder',
    section: 'abdomen',
    inputType: 'select',
    options: ['정상', '팽만', '소량 잔뇨', '촉진 불가'],
  },
  {
    id: 'intestinal_loops',
    nameKo: '장관',
    nameEn: 'Intestinal Loops',
    section: 'abdomen',
    inputType: 'select',
    options: ['정상', '비후 (Thickened)', '가스 팽창', '종괴 촉진', '통증 동반'],
  },
  {
    id: 'anal_glands',
    nameKo: '항문낭',
    nameEn: 'Anal Glands',
    section: 'abdomen',
    inputType: 'select',
    options: ['검사 미실시', '정상', '충만/분비물', '염증/농양'],
  },
]

// ────────────────────────────────────────────────────────────
// 근골격계
// ────────────────────────────────────────────────────────────
const musculoskeletal: PhysicalRefItem[] = [
  {
    id: 'gait',
    nameKo: '보행',
    nameEn: 'Gait',
    section: 'musculoskeletal',
    inputType: 'select',
    options: ['정상', '경미한 파행 (Grade 1)', '중등도 파행 (Grade 2)', '심한 파행 (Grade 3)', '지지 불가 (Grade 4)', '실조 (Ataxia)'],
    referenceRange: { common: '정상' },
  },
  {
    id: 'posture',
    nameKo: '자세',
    nameEn: 'Posture',
    section: 'musculoskeletal',
    inputType: 'select',
    options: ['정상', '등허리 굽힘 (Hunched)', '머리 기울임 (Head tilt)', '사경 (Torticollis)', 'Schiff-Sherrington 자세'],
  },
  {
    id: 'muscle_atrophy',
    nameKo: '근육 위축',
    nameEn: 'Muscle Atrophy',
    section: 'musculoskeletal',
    inputType: 'select',
    options: ['없음', '경미 (국소/대칭)', '중등도', '심함', '비대칭성 위축'],
  },
  {
    id: 'joint_swelling',
    nameKo: '관절 부종/통증',
    nameEn: 'Joint Swelling/Pain',
    section: 'musculoskeletal',
    inputType: 'select',
    options: ['없음', '한 관절 (단관절)', '여러 관절 (다관절)', '양측 대칭'],
  },
  {
    id: 'joint_detail',
    nameKo: '이상 관절 (직접 기입)',
    nameEn: 'Affected Joint(s)',
    section: 'musculoskeletal',
    inputType: 'text',
  },
  {
    id: 'spinal_pain',
    nameKo: '척추 통증',
    nameEn: 'Spinal Pain',
    section: 'musculoskeletal',
    inputType: 'multiselect',
    options: ['경추부', '흉추부', '요추부', '요천추부', '광범위'],
  },
]

// ────────────────────────────────────────────────────────────
// 피부·피모
// ────────────────────────────────────────────────────────────
const skin: PhysicalRefItem[] = [
  {
    id: 'coat_condition',
    nameKo: '피모 상태',
    nameEn: 'Coat Condition',
    section: 'skin',
    inputType: 'select',
    options: ['정상 (광택, 청결)', '건조/윤기 없음', '기름짐 (Seborrhea)', '탈모 (Alopecia)', '엉킴/매트'],
  },
  {
    id: 'skin_lesions',
    nameKo: '피부 병변',
    nameEn: 'Skin Lesions',
    section: 'skin',
    inputType: 'select',
    options: ['없음', '홍반 (Erythema)', '구진/농포', '궤양/미란', '가피 (Crust)', '색소 침착 변화', '종괴/결절'],
  },
  {
    id: 'skin_lesion_location',
    nameKo: '병변 위치',
    nameEn: 'Lesion Location',
    section: 'skin',
    inputType: 'text',
  },
  {
    id: 'parasite',
    nameKo: '외부 기생충',
    nameEn: 'External Parasite',
    section: 'skin',
    inputType: 'select',
    options: ['없음', '벼룩 (Fleas)', '진드기 (Ticks)', '이 (Lice)', '기생충 분변 (Flea dirt)'],
  },
  {
    id: 'ear_exam',
    nameKo: '귀 검사',
    nameEn: 'Ear Exam',
    section: 'skin',
    inputType: 'select',
    options: ['정상', '삼출물 (좌)', '삼출물 (우)', '삼출물 (양측)', '냄새', '발적/부종'],
    comment: '안과·치과는 전문 모듈로 분리. 귀는 피부 범주에서 기본 평가',
  },
]

// ────────────────────────────────────────────────────────────
// 정신 상태
// ────────────────────────────────────────────────────────────
const mentation: PhysicalRefItem[] = [
  {
    id: 'mentation_status',
    nameKo: '정신 상태',
    nameEn: 'Mentation',
    section: 'mentation',
    inputType: 'select',
    options: [
      'BAR (Bright, Alert, Responsive)',
      'QAR (Quiet, Alert, Responsive)',
      'Dull/Depressed',
      'Obtunded (둔감)',
      'Stupor (반혼수)',
      'Coma (혼수)',
    ],
    referenceRange: { common: 'BAR or QAR' },
    comment: 'BAR: 완전 정상. QAR: 정상범주. Dull 이하: 의식 저하 — 신경·전신질환 평가 필요',
  },
  {
    id: 'pain_assessment',
    nameKo: '통증 평가',
    nameEn: 'Pain Assessment',
    section: 'mentation',
    inputType: 'select',
    options: ['없음 (No pain signs)', '경미 (Mild)', '중등도 (Moderate)', '심함 (Severe)', '평가 불가'],
  },
]

// ────────────────────────────────────────────────────────────
// 전체 export
// ────────────────────────────────────────────────────────────
export const physicalRefAll: PhysicalRefItem[] = [
  ...vitals,
  ...bodyCondition,
  ...hydration,
  ...lymphNodes,
  ...cardiovascular,
  ...respiratory,
  ...abdomen,
  ...musculoskeletal,
  ...skin,
  ...mentation,
]

export const physicalRefMap: Record<string, PhysicalRefItem> = Object.fromEntries(
  physicalRefAll.map((item) => [item.id, item]),
)

export function getPhysicalRefBySection(section: PhysicalSection): PhysicalRefItem[] {
  return physicalRefAll.filter((item) => item.section === section)
}

export const PHYSICAL_SECTION_ORDER: PhysicalSection[] = [
  'vitals',
  'body_condition',
  'hydration',
  'lymph_nodes',
  'cardiovascular',
  'respiratory',
  'abdomen',
  'musculoskeletal',
  'skin',
  'mentation',
]
