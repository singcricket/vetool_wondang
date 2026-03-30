// =============================================
// 심장초음파 자동 계산 공식 (서버 전용)
// =============================================

import type { EchoFormula } from '@/types/echocardio/echocardio-type'

type CalcInput = Record<string, string>

/**
 * 수치 범위 판정
 * thresholds: [t1, t2, ...] → value < t1 → index 0, t1 ≤ value < t2 → index 1, ...
 */
export function getRangeIndex(value: number, thresholds: number[]): number {
  if (thresholds.length === 0) return 0
  const idx = thresholds.findIndex((t) => value < t)
  return idx === -1 ? thresholds.length : idx
}

/**
 * 공식별 계산 함수
 * 입력값이 없거나 계산 불가능한 경우 null 반환
 */
const CALCULATORS: Record<EchoFormula, (inputs: CalcInput) => number | null> =
  {
    // FS (Fractional Shortening) = (LVd - LVs) / LVd × 100
    LVFS: ({ LVd, LVs }) => {
      const d = parseFloat(LVd)
      const s = parseFloat(LVs)
      if (isNaN(d) || isNaN(s) || d === 0) return null
      return ((d - s) / d) * 100
    },

    // EF (Ejection Fraction) - 직접 입력이므로 계산 없음
    EF: () => null,

    // LVIDDN = LVd / BW^0.294
    LVIDDN: ({ LVd, BW_kg }) => {
      const d = parseFloat(LVd)
      const bw = parseFloat(BW_kg)
      if (isNaN(d) || isNaN(bw) || bw <= 0) return null
      return d / Math.pow(bw, 0.294)
    },

    // ESVI = ESV / BSA  (BSA = 0.1 × BW^0.67 for dogs)
    ESVI: ({ ESV, BW_kg }) => {
      const esv = parseFloat(ESV)
      const bw = parseFloat(BW_kg)
      if (isNaN(esv) || isNaN(bw) || bw <= 0) return null
      const bsa = 0.1 * Math.pow(bw, 0.67)
      return esv / bsa
    },

    // LA:AO ratio = LA / AO
    LAAOratio: ({ LA, AO }) => {
      const la = parseFloat(LA)
      const ao = parseFloat(AO)
      if (isNaN(la) || isNaN(ao) || ao === 0) return null
      return la / ao
    },

    // MV E:A ratio = MV_Ewave / MV_Awave
    MV_EAratio: ({ MV_Ewave, MV_Awave }) => {
      const e = parseFloat(MV_Ewave)
      const a = parseFloat(MV_Awave)
      if (isNaN(e) || isNaN(a) || a === 0) return null
      return e / a
    },

    // LVEIO = MV_Ewave / VTI
    LVEIO: ({ MV_Ewave, VTI }) => {
      const e = parseFloat(MV_Ewave)
      const vti = parseFloat(VTI)
      if (isNaN(e) || isNaN(vti) || vti === 0) return null
      return e / vti
    },

    // E/IVRT = MV_Ewave / IVRT
    EIVRT: ({ MV_Ewave, IVRT }) => {
      const e = parseFloat(MV_Ewave)
      const ivrt = parseFloat(IVRT)
      if (isNaN(e) || isNaN(ivrt) || ivrt === 0) return null
      return e / (ivrt / 100)
    },

    // E/Em = MV_Ewave / Em (TDI)
    EEm: ({ MV_Ewave, Em }) => {
      const e = parseFloat(MV_Ewave)
      const em = parseFloat(Em)
      if (isNaN(e) || isNaN(em) || em === 0) return null
      return e / em
    },

    // LA FS = (LAdMax - LAdMin) / LAdMax × 100
    LAFS: ({ LAdMax, LAdMin }) => {
      const max = parseFloat(LAdMax)
      const min = parseFloat(LAdMin)
      if (isNaN(max) || isNaN(min) || max === 0) return null
      return ((max - min) / max) * 100
    },

    // PG (Pressure Gradient) = 4 × v²
    PG: (inputs) => {
      // velocity keywordID는 단일 dependency에서 동적으로 전달
      const vel = Object.values(inputs)[0]
      const v = parseFloat(vel)
      if (isNaN(v)) return null
      return 4 * v * v
    },

    // Em / Am
    EmAm: ({ Em, Am }) => {
      const em = parseFloat(Em)
      const am = parseFloat(Am)
      if (isNaN(em) || isNaN(am) || am === 0) return null
      return em / am
    },
    //Ra pressure //
    RApressure : ({CVCcollapse}) => {
      //"<20%","20-50%",">50%"
      if(CVCcollapse === "<20%") return 5
      if(CVCcollapse === ">50%") return 15
      if(CVCcollapse === "20-50%") return 10
      return null
    },
    //Pa pressure//
    PApressure : ({RApressure,TRPG}) => {
      const rap = parseFloat(RApressure)
      const trpg = parseFloat(TRPG)
      if (isNaN(rap) || isNaN(trpg) || trpg === 0) return null
      return trpg + rap
    },
  }

/**
 * 계산 실행
 * @param formula 공식 이름
 * @param inputs { keywordID: value } 형태의 의존 필드 값
 * @returns 계산 결과 (소수점 2자리) 또는 null
 */
export function calculate(
  formula: EchoFormula,
  inputs: CalcInput,
): number | null {
  const fn = CALCULATORS[formula]
  if (!fn) return null
  const result = fn(inputs)
  if (result === null || isNaN(result)) return null
  return Math.round(result * 100) / 100
}
