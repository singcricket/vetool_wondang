import type { DefaultRefRange, FoldProfile, LabRefItem, LabResultItem, LabSeverity, RangeEntry } from '@/constants/hospital/checkup/lab-types'

function normalizeSpecies(species: string): 'dog' | 'cat' | 'other' {
  if (/^(dog|canine)/i.test(species)) return 'dog'
  if (/^(cat|feline)/i.test(species)) return 'cat'
  return 'other'
}

type EvalResult = {
  isAbnormal: boolean
  resultTextKo: string
  severity: LabSeverity | null
  direction: 'high' | 'low' | null
}

/** range 타입: 수치를 종별 범위와 대조해 평가 결과 반환 */
export function evaluateRange(
  value: string | null,
  ref: LabRefItem,
  species: string,
): EvalResult | null {
  if (!value || !ref.ranges) return null
  const num = parseFloat(value)
  if (isNaN(num)) return null

  const sp = normalizeSpecies(species)
  const entries: RangeEntry[] | undefined =
    (sp === 'dog' ? ref.ranges.dog : sp === 'cat' ? ref.ranges.cat : undefined) ??
    ref.ranges.common

  if (!entries) return null

  const normalEntry = entries.find((e) => !e.isAbnormal)

  for (const entry of entries) {
    const minOk = entry.min === null || num >= entry.min
    const maxOk = entry.max === null || num < entry.max
    if (minOk && maxOk) {
      let direction: 'high' | 'low' | null = null
      if (entry.isAbnormal && normalEntry) {
        if (normalEntry.max !== null && num >= normalEntry.max) direction = 'high'
        else if (normalEntry.min !== null && num < normalEntry.min) direction = 'low'
      }
      return {
        isAbnormal: entry.isAbnormal,
        resultTextKo: entry.resultTextKo,
        severity: entry.severity ?? null,
        direction,
      }
    }
  }
  return null
}

/** select 타입: 선택된 옵션의 이상 여부 반환 */
export function evaluateSelect(
  value: string | null,
  ref: LabRefItem,
): EvalResult | null {
  if (!value || !ref.options) return null
  const opt = ref.options.find((o) => o.value === value)
  if (!opt) return null
  return {
    isAbnormal: opt.isAbnormal ?? false,
    resultTextKo: opt.labelKo ?? opt.value,
    severity: opt.severity ?? null,
    direction: null,
  }
}

/** multiselect 타입: 선택된 값들 중 가장 높은 severity 반환 */
export function evaluateMultiselect(
  value: string | null,
  ref: LabRefItem,
): EvalResult | null {
  if (!value || !ref.options) return null
  const selected = value.split(',').map((v) => v.trim()).filter(Boolean)
  if (selected.length === 0) return null

  const SEVERITY_RANK: Record<string, number> = { critical: 4, high: 3, moderate: 2, mild: 1 }

  let topResult: EvalResult | null = null
  let topRank = -1

  for (const val of selected) {
    const opt = ref.options.find((o) => o.value === val)
    if (!opt) continue
    const rank = opt.severity ? (SEVERITY_RANK[opt.severity] ?? 0) : 0
    if (!topResult || rank > topRank) {
      topRank = rank
      topResult = {
        isAbnormal: opt.isAbnormal ?? false,
        resultTextKo: opt.labelKo ?? opt.value,
        severity: opt.severity ?? null,
        direction: null,
      }
    }
  }
  return topResult
}

// ── Fold-change 평가 (AI 경로) ────────────────────────────────

type FoldThreshold = { maxFold: number; severity: LabSeverity; textKo: string }

const FOLD_PROFILES: Record<FoldProfile, FoldThreshold[]> = {
  // VCOG-CTCAE 기반 (간 효소, 빌리루빈, 단백질, 지질)
  enzyme: [
    { maxFold: 2,        severity: 'mild',     textKo: '경도' },
    { maxFold: 5,        severity: 'moderate', textKo: '중등도' },
    { maxFold: 20,       severity: 'high',     textKo: '심한' },
    { maxFold: Infinity, severity: 'critical', textKo: '매우 심한' },
  ],
  // 신장·대사 지표 (BUN, Crea, 혈당 등)
  renal: [
    { maxFold: 1.5,      severity: 'mild',     textKo: '경도' },
    { maxFold: 3,        severity: 'moderate', textKo: '중등도' },
    { maxFold: 6,        severity: 'high',     textKo: '심한' },
    { maxFold: Infinity, severity: 'critical', textKo: '매우 심한' },
  ],
  // 전해질·호르몬 (Na, K, Ca, T4 등 — 좁은 임계값)
  electrolyte: [
    { maxFold: 1.05,     severity: 'mild',     textKo: '경도' },
    { maxFold: 1.15,     severity: 'moderate', textKo: '중등도' },
    { maxFold: 1.30,     severity: 'high',     textKo: '심한' },
    { maxFold: Infinity, severity: 'critical', textKo: '매우 심한' },
  ],
  // 세포 수 (WBC, RBC, PLT 등)
  cell: [
    { maxFold: 1.5,      severity: 'mild',     textKo: '경도' },
    { maxFold: 3,        severity: 'moderate', textKo: '중등도' },
    { maxFold: 5,        severity: 'high',     textKo: '심한' },
    { maxFold: Infinity, severity: 'critical', textKo: '매우 심한' },
  ],
}

function parseRefRange(str: string): { min: number | null; max: number | null } {
  const rangeMatch = str.match(/^\s*([\d.]+)\s*[-–]\s*([\d.]+)\s*$/)
  if (rangeMatch) return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) }
  const maxMatch = str.match(/^\s*[<≤]\s*([\d.]+)\s*$/)
  if (maxMatch) return { min: null, max: parseFloat(maxMatch[1]) }
  const minMatch = str.match(/^\s*[>≥]\s*([\d.]+)\s*$/)
  if (minMatch) return { min: parseFloat(minMatch[1]), max: null }
  return { min: null, max: null }
}

/** AI 경로: 병원 기기 참고범위 기준 fold-change 평가 */
export function evaluateByFoldChange(
  value: string | null,
  refRangeStr: string,
  profile: FoldProfile,
): EvalResult | null {
  if (!value) return null
  const num = parseFloat(value)
  if (isNaN(num)) return null

  const { min, max } = parseRefRange(refRangeStr)
  if (min === null && max === null) return null

  let fold: number
  let direction: '상승' | '저하'

  if (max !== null && num > max) {
    fold = num / max
    direction = '상승'
  } else if (min !== null && num < min) {
    fold = min / num
    direction = '저하'
  } else {
    return { isAbnormal: false, resultTextKo: '정상 (기기 기준)', severity: null, direction: null }
  }

  const thresholds = FOLD_PROFILES[profile]
  let severity: LabSeverity = 'critical'
  let textKo = '매우 심한'
  for (const t of thresholds) {
    if (fold <= t.maxFold) {
      severity = t.severity
      textKo = t.textKo
      break
    }
  }

  return {
    isAbnormal: true,
    resultTextKo: `${fold.toFixed(1)}배 ${direction} (기기 기준)`,
    severity,
    direction: direction === '상승' ? 'high' : 'low',
  }
}

/** 이상 방향에 따라 ref.comment 자동 선택 */
export function getAutoComment(ref: LabRefItem, direction: 'high' | 'low' | null): string | null {
  if (!direction) return ref.comment.increase || null
  return direction === 'high'
    ? (ref.comment.increase || null)
    : (ref.comment.decrease || null)
}

/** 종별 defaultRefRange 반환 — 객체 또는 문자열 모두 지원 */
export function getDefaultRefRange(ref: LabRefItem, species: string): string | null {
  if (!ref.defaultRefRange) return null
  if (typeof ref.defaultRefRange === 'string') return ref.defaultRefRange
  const r = ref.defaultRefRange as DefaultRefRange
  const sp = normalizeSpecies(species)
  return (sp === 'dog' ? r.dog : sp === 'cat' ? r.cat : null) ?? r.common ?? null
}

/** 통합 평가 함수 — testType 및 source에 따라 자동 분기 */
export function evaluateLabValue(
  value: string | null,
  ref: LabRefItem,
  species: string,
  source?: 'manual' | 'ai',
  hospitalRefRange?: string | null,
): EvalResult | null {
  if (!value) return null

  // AI 경로: fold-change (병원 기기 참고범위 기준)
  if (source === 'ai' && hospitalRefRange && ref.foldProfile) {
    return evaluateByFoldChange(value, hospitalRefRange, ref.foldProfile)
  }

  // 직접 입력 경로: 우리 species-specific ranges 기준
  switch (ref.testType) {
    case 'range':       return evaluateRange(value, ref, species)
    case 'select':      return evaluateSelect(value, ref)
    case 'multiselect': return evaluateMultiselect(value, ref)
    default:            return null
  }
}

/** LabResultItem 배열을 평가 결과로 업데이트 */
export function applyEvaluations(
  items: LabResultItem[],
  refMap: Record<string, LabRefItem>,
  species: string,
): LabResultItem[] {
  return items.map((item) => {
    const ref = refMap[item.id]
    if (!ref) return item
    const result = evaluateLabValue(
      item.value,
      ref,
      species,
      item.source,
      item.source === 'ai' ? item.ref_range : null,
    )
    if (!result) return item
    return {
      ...item,
      is_abnormal: result.isAbnormal,
      result_text: result.resultTextKo,
      severity: result.severity,
    }
  })
}
