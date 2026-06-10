// ============================================================
// life-stage-ref.ts — 사람나이 환산 + 생애단계 참조 데이터
//
// 출처: AAHA Senior Care Guidelines, ISFM Senior Care Guidelines
// 개: 소형(<10kg) / 대형(≥25kg) 별도 환산
// 고양이: 단일 환산표
// ============================================================

export type Species = 'dog' | 'cat'
export type DogSizeClass = 'small' | 'large'  // <25kg / ≥25kg

export type LifeStage =
  | 'puppy_kitten'   // 0–6개월
  | 'junior'         // 7개월–2세
  | 'prime'          // 3–6세
  | 'mature'         // 7–10세
  | 'senior'         // 11–14세
  | 'geriatric'      // 15세↑

export interface LifeStageInfo {
  stage: LifeStage
  stageKo: string
  /** 동물 나이 범위 (월 단위) */
  ageMonthMin: number
  ageMonthMax: number | null
  /** 사람나이 환산 범위 표시 문자열 */
  humanAgeRange: string
  /** 생애단계 색상 클래스 (Tailwind) */
  colorClass: string
  /** 권장 검사 항목 */
  recommendedTests: string[]
  /** 주의 질환 */
  watchDiseases: string[]
  /** 검진 권장 주기 */
  checkupInterval: string
}

// ── 고양이 생애단계 ─────────────────────────────────────────
export const CAT_LIFE_STAGES: LifeStageInfo[] = [
  {
    stage: 'puppy_kitten',
    stageKo: '유년기',
    ageMonthMin: 0,
    ageMonthMax: 6,
    humanAgeRange: '0–10세',
    colorClass: 'bg-violet-100 text-violet-700',
    recommendedTests: ['기생충 검사', '선천성 기형 평가', '예방접종', '중성화 상담'],
    watchDiseases: ['선천성 심장질환', '저혈당', '범백혈구감소증', '호흡기감염'],
    checkupInterval: '2~4주 간격 (접종 완료까지)',
  },
  {
    stage: 'junior',
    stageKo: '성장기',
    ageMonthMin: 7,
    ageMonthMax: 24,
    humanAgeRange: '10–24세',
    colorClass: 'bg-blue-100 text-blue-700',
    recommendedTests: ['기본 혈액검사', '요검사', '중성화 수술', '구강 평가'],
    watchDiseases: ['비만', '구강질환', '요로감염', '외부기생충'],
    checkupInterval: '연 1회',
  },
  {
    stage: 'prime',
    stageKo: '성숙기',
    ageMonthMin: 25,
    ageMonthMax: 72,
    humanAgeRange: '28–40세',
    colorClass: 'bg-emerald-100 text-emerald-700',
    recommendedTests: ['기본 혈액검사', '요검사', '구강 검사', '체중·BCS 평가'],
    watchDiseases: ['비만', '치과질환', '구내염 (고양이)', '행동 변화'],
    checkupInterval: '연 1회',
  },
  {
    stage: 'mature',
    stageKo: '중년기',
    ageMonthMin: 73,
    ageMonthMax: 120,
    humanAgeRange: '44–56세',
    colorClass: 'bg-amber-100 text-amber-700',
    recommendedTests: ['혈액검사 (full panel)', '요검사', '혈압 측정', '흉부방사선', '복부초음파'],
    watchDiseases: ['만성신장질환 (CKD)', '갑상선기능항진증', 'HCM', '당뇨', '종양'],
    checkupInterval: '연 1–2회',
  },
  {
    stage: 'senior',
    stageKo: '노령기',
    ageMonthMin: 121,
    ageMonthMax: 168,
    humanAgeRange: '60–72세',
    colorClass: 'bg-orange-100 text-orange-700',
    recommendedTests: ['전신 혈액검사', '요검사 + UPC', '혈압', 'T4 (갑상선)', '흉부방사선', '복부초음파', 'NT-proBNP'],
    watchDiseases: ['CKD', '갑상선기능항진증', 'HCM', '고혈압', '당뇨', '림프종', 'CDS (인지기능장애)'],
    checkupInterval: '6개월 간격',
  },
  {
    stage: 'geriatric',
    stageKo: '초고령',
    ageMonthMin: 169,
    ageMonthMax: null,
    humanAgeRange: '76세↑',
    colorClass: 'bg-red-100 text-red-700',
    recommendedTests: ['6개월 간격 전신검사', '혈압', '신장 기능 (SDMA·CREA)', '심장 평가', '통증 스코어', '인지기능 평가'],
    watchDiseases: ['CKD 진행', 'CDS', '고혈압', '관절염', '종양', 'HCM 악화'],
    checkupInterval: '3–6개월 간격',
  },
]

// ── 개 생애단계 ─────────────────────────────────────────────
export const DOG_LIFE_STAGES: LifeStageInfo[] = [
  {
    stage: 'puppy_kitten',
    stageKo: '유년기',
    ageMonthMin: 0,
    ageMonthMax: 12,
    humanAgeRange: '0–15세',
    colorClass: 'bg-violet-100 text-violet-700',
    recommendedTests: ['기생충 검사', '예방접종', '선천성 기형 평가', '중성화 상담'],
    watchDiseases: ['선천성 심장질환', '저혈당', '파보바이러스', '슬개골탈구 (소형견)'],
    checkupInterval: '2–4주 간격 (접종 완료까지)',
  },
  {
    stage: 'junior',
    stageKo: '성장기',  
    ageMonthMin: 13,
    ageMonthMax: 24,
    humanAgeRange: '15–24세',
    colorClass: 'bg-blue-100 text-blue-700',
    recommendedTests: ['기본 혈액검사', '요검사', '중성화', '고관절 평가 (대형견)', '슬개골 평가 (소형견)'],
    watchDiseases: ['비만', '구강질환', '슬개골탈구', '고관절이형성증 (대형견)'],
    checkupInterval: '연 1회',
  },
  {
    stage: 'prime',
    stageKo: '성숙기',
    ageMonthMin: 25,
    ageMonthMax: 72,
    humanAgeRange: '24–40세',
    colorClass: 'bg-emerald-100 text-emerald-700',
    recommendedTests: ['기본 혈액검사', '요검사', '구강 검사', '체중·BCS', '사상충 검사'],
    watchDiseases: ['비만', '치과질환', '슬개골탈구', '피부질환'],
    checkupInterval: '연 1회',
  },
  {
    stage: 'mature',
    stageKo: '중년기' ,
    ageMonthMin: 73,
    ageMonthMax: 120,
    humanAgeRange: '44–56세 (소형) / 56–78세 (대형)',
    colorClass: 'bg-amber-100 text-amber-700',
    recommendedTests: ['혈액검사 (full panel)', '요검사', '혈압', '흉부방사선 (심비대 VHS)', '복부초음파', 'NT-proBNP (심장 위험군)'],
    watchDiseases: ['심장판막질환 (소형견)', '쿠싱증후군', '갑상선기능저하', '신장질환', '관절염', '종양'],
    checkupInterval: '연 1–2회',
  },
  {
    stage: 'senior',
    stageKo: '노령기',
    ageMonthMin: 121,
    ageMonthMax: 168,
    humanAgeRange: '56–76세 (소형) / 78–115세 (대형)',
    colorClass: 'bg-orange-100 text-orange-700',
    recommendedTests: ['전신 혈액검사', '요검사 + UPC', '혈압', 'T4·코르티솔', '흉부방사선', '복부초음파', 'NT-proBNP'],
    watchDiseases: ['CKD', '심장판막질환', '쿠싱', '종양', '관절염', '인지기능장애 (CDS)'],
    checkupInterval: '6개월 간격',
  },
  {
    stage: 'geriatric',
    stageKo: '초고령',
    ageMonthMin: 169,
    ageMonthMax: null,
    humanAgeRange: '76세↑ (소형) / 115세↑ (대형)',
    colorClass: 'bg-red-100 text-red-700',
    recommendedTests: ['6개월 간격 전신검사', '혈압', '신장 기능', '심장 평가', '통증 스코어', '인지기능 (DISHAA 설문)'],
    watchDiseases: ['CKD', '심부전', '고혈압', '종양', '관절염', 'CDS', '실금'],
    checkupInterval: '3–6개월 간격',
  },
]

// ── 사람나이 환산 룩업 테이블 ───────────────────────────────
// [동물나이(세), 소형견 사람나이, 대형견 사람나이, 고양이 사람나이]
const HUMAN_AGE_TABLE: [number, number, number, number][] = [
  [0.5,  10,  10,  10],
  [1,    15,  15,  15],
  [2,    24,  24,  24],
  [3,    28,  28,  28],
  [4,    32,  34,  32],
  [5,    36,  40,  36],
  [6,    40,  45,  40],
  [7,    44,  56,  44],
  [8,    48,  64,  48],
  [9,    52,  71,  52],
  [10,   56,  78,  56],
  [11,   60,  86,  60],
  [12,   64,  93,  64],
  [13,   68, 101,  68],
  [14,   72, 108,  72],
  [15,   76, 115,  76],
  [16,   80, 120,  80],
  [18,   88, 130,  88],
  [20,   96, 140,  96],
]

/** 동물 나이(세)를 사람 나이로 환산 */
export function toHumanAge(
  ageYears: number,
  species: 'cat' | 'dog',
  dogSize: DogSizeClass = 'small',
): number {
  const col = species === 'cat' ? 3 : dogSize === 'small' ? 1 : 2

  if (ageYears <= 0) return 0

  // 정확히 일치하는 값
  const exact = HUMAN_AGE_TABLE.find(([y]) => y === ageYears)
  if (exact) return exact[col]

  // 선형 보간
  const lower = [...HUMAN_AGE_TABLE].reverse().find(([y]) => y < ageYears)
  const upper = HUMAN_AGE_TABLE.find(([y]) => y > ageYears)

  if (!lower) return HUMAN_AGE_TABLE[0][col]
  if (!upper) {
    // 마지막 데이터 이후: 연간 +4세 추정
    const lastRow = HUMAN_AGE_TABLE[HUMAN_AGE_TABLE.length - 1]
    return Math.round(lastRow[col] + (ageYears - lastRow[0]) * 4)
  }

  const ratio = (ageYears - lower[0]) / (upper[0] - lower[0])
  return Math.round(lower[col] + ratio * (upper[col] - lower[col]))
}

/** 동물 나이(월)로 생애단계 결정 */
export function getLifeStage(
  ageMonths: number,
  species: 'cat' | 'dog',
): LifeStageInfo {
  const stages = species === 'cat' ? CAT_LIFE_STAGES : DOG_LIFE_STAGES
  return (
    stages.find(
      (s) =>
        ageMonths >= s.ageMonthMin &&
        (s.ageMonthMax === null || ageMonths <= s.ageMonthMax),
    ) ?? stages[stages.length - 1]
  )
}

/** 생년월일 문자열로 생애단계 정보 반환 */
export function getLifeStageFromBirth(
  birth: string | null,
  species: 'cat' | 'dog',
  dogSize: DogSizeClass = 'small',
): {
  stage: LifeStageInfo
  ageMonths: number
  ageYears: number
  humanAge: number
  ageLabel: string
} | null {
  if (!birth) return null

  const b = new Date(birth)
  const today = new Date()
  const totalMonths =
    (today.getFullYear() - b.getFullYear()) * 12 +
    (today.getMonth() - b.getMonth()) +
    (today.getDate() < b.getDate() ? -1 : 0)

  if (totalMonths < 0) return null

  const ageYears = totalMonths / 12
  const stage = getLifeStage(totalMonths, species)
  const humanAge = toHumanAge(ageYears, species, dogSize)

  const y = Math.floor(ageYears)
  const m = totalMonths % 12
  const ageLabel = y === 0 ? `${totalMonths}개월령` : m > 0 ? `${y}세 ${m}개월령` : `${y}세령`

  return { stage, ageMonths: totalMonths, ageYears, humanAge, ageLabel }
}

// ── BCS 기반 칼로리 계산 ─────────────────────────────────────

export interface CalorieResult {
  /** RER (kcal/day) = 70 × (이상체중)^0.75 */
  rer: number
  /** DER (kcal/day) = RER × 생활계수 */
  der: number
  /** 이상 체중 추정 (kg) */
  idealWeight: number
  /** 사용된 생활계수 */
  lifeFactor: number
}

/**
 * BCS 기반 이상체중 추정 및 칼로리 계산
 * @param currentWeight 현재 체중 (kg)
 * @param bcs BCS 점수 (1–9)
 * @param isNeutered 중성화 여부
 * @param ageStage 생애단계
 * @param species 종
 */
export function calcCalories(
  currentWeight: number,
  bcs: number,
  isNeutered: boolean,
  ageStage: LifeStage,
  species: 'cat' | 'dog',
): CalorieResult {
  // BCS 5가 이상 → 보정 계수 (BCS 1단계당 체중의 약 10% 차이)
  const bcsOffset = bcs - 5
  const idealWeight = Math.max(0.5, currentWeight / (1 + bcsOffset * 0.1))

  // RER
  const rer = Math.round(70 * Math.pow(idealWeight, 0.75))

  // 생활계수
  let lifeFactor: number
  if (ageStage === 'puppy_kitten') {
    lifeFactor = 3.0  // 성장기
  } else if (ageStage === 'junior') {
    lifeFactor = isNeutered ? 1.6 : 1.8
  } else if (ageStage === 'geriatric' || ageStage === 'senior') {
    lifeFactor = 1.1
  } else if (bcs >= 7) {
    lifeFactor = 0.8  // 체중 감량
  } else {
    lifeFactor = isNeutered ? 1.4 : 1.6
    if (species === 'cat' && isNeutered) lifeFactor = 1.2
  }

  const der = Math.round(rer * lifeFactor)

  return { rer, der, idealWeight: Math.round(idealWeight * 10) / 10, lifeFactor }
}

// ── 품종별 체형 분류 (개 사람나이 환산용) ───────────────────
export function getDogSizeClass(weightKg: number): DogSizeClass {
  return weightKg < 25 ? 'small' : 'large'
}
