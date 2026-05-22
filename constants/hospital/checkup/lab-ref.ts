// ============================================================
// lab-ref.ts — 임상병리 ref barrel export
// ============================================================

export * from './lab-types'
export * from './lab-ref-cbc'
export * from './lab-ref-chemistry'
export * from './lab-ref-endocrine'
export * from './lab-ref-urinalysis'
export * from './lab-ref-special'

import { labRefCbc } from './lab-ref-cbc'
import { labRefChemistry } from './lab-ref-chemistry'
import { labRefEndocrine } from './lab-ref-endocrine'
import { labRefUrinalysis } from './lab-ref-urinalysis'
import { labRefSpecial } from './lab-ref-special'
import type { LabRefItem, LabSection } from './lab-types'

export const labRefAll: LabRefItem[] = [
  ...labRefCbc,
  ...labRefChemistry,
  ...labRefEndocrine,
  ...labRefUrinalysis,
  ...labRefSpecial,
]

export const labRefMap: Record<string, LabRefItem> = Object.fromEntries(
  labRefAll.map((item) => [item.id, item]),
)

export function getLabRefBySection(section: LabSection): LabRefItem[] {
  return labRefAll.filter((item) => item.section.includes(section))
}

export function findLabRefByKeyword(keyword: string): LabRefItem | undefined {
  const lower = keyword.toLowerCase().trim()
  return labRefAll.find((item) =>
    item.nameEn.toLowerCase() === lower ||
    item.nameKo === keyword.trim() ||
    item.aiExtractKeywords?.some((k) => k.toLowerCase() === lower),
  )
}
