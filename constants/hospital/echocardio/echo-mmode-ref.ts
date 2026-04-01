import type {
  CatMmodeRefFormula,
  MmodeRefKey,
} from '@/types/echocardio/echocardio-type'
import { MMODE_REF_DOG } from './mmode-ref-dog'

// ============================================================
// 개: 체중별 lookup table (기존 데이터 유지)
// ============================================================
export { MMODE_REF_DOG } from './mmode-ref-dog'

// ============================================================
// 고양이: allometric formula (Y = a × BW^b)
// 출처: Häggström et al. 2016 (n=19,866)
// 정상범위 계산: mean ± 95% PI (±약 18% 근사 적용)
// ============================================================

export const MMODE_REF_CAT_FORMULA: CatMmodeRefFormula = {
  VSd: { a: 2.83, b: 0.204 }, // IVSd  — IVSd > LVWd 가 정상
  LVd: { a: 6.80, b: 0.294 }, // LVIDd
  LVWd: { a: 2.77, b: 0.204 }, // LVPWd — IVSd보다 약간 얇음
  VSs: { a: 4.77, b: 0.191 }, // IVSs
  LVs: { a: 3.70, b: 0.236 }, // LVIDs
  LVWs: { a: 4.62, b: 0.181 }, // LVPWs
  AO: { a: 8.00, b: 0.296 }, // Ao
  LA: { a: 8.40, b: 0.296 }, // LA
}

// ============================================================
// 정상범위 계산 유틸
// ============================================================

/**
 * 개: 체중(kg) → lookup table에서 정상범위 반환
 */
export function getDogMmodeRef(
  param: MmodeRefKey,
  bw: number // kg
): [number, number] {
  // kg to lbs conversion (1kg = 2.20462 lbs)
  const lbsWeight = bw * 2.20462
  const key = Math.min(Math.max(Math.round(lbsWeight), 1), 99)
  const ref = (MMODE_REF_DOG as any)[key]
  if (!ref) return [0, 0]
  return ref[param] || [0, 0]
}

/**
 * 고양이: 체중(kg) → allometric formula로 정상범위 계산
 * 95% PI 근사: mean × 0.82 ~ mean × 1.18
 * (정확한 PI는 논문 Table 2의 Sxy값 필요 — 임상 근사값 사용)
 */
export function getCatMmodeRef(
  param: MmodeRefKey,
  bw: number
): [number, number] {
  const formula = MMODE_REF_CAT_FORMULA[param]
  if (!formula) return [0, 0]
  const { a, b } = formula
  const mean = a * Math.pow(bw, b)
  return [
    parseFloat((mean * 0.82).toFixed(2)),
    parseFloat((mean * 1.18).toFixed(2)),
  ]
}
