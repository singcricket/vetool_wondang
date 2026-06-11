// ============================================================
// lab-ref.ts — 임상병리 ref barrel export
// ============================================================

export * from './lab-types'
export * from './lab-ref-cbc'
export * from './lab-ref-chemistry'
export * from './lab-ref-endocrine'
export * from './lab-ref-urinalysis'
export * from './lab-ref-special'
export * from './lab-ref-blood-gas'
export * from './lab-ref-coagulation'

import { labRefCbc } from './lab-ref-cbc'
import { labRefChemistry } from './lab-ref-chemistry'
import { labRefEndocrine } from './lab-ref-endocrine'
import { labRefUrinalysis } from './lab-ref-urinalysis'
import { labRefSpecial } from './lab-ref-special'
import { labRefBloodGas } from './lab-ref-blood-gas'
import { labRefCoagulation } from './lab-ref-coagulation'
import type { LabRefItem, LabSection } from './lab-types'

export const labRefAll: LabRefItem[] = [
  ...labRefCbc,
  ...labRefChemistry,
  ...labRefEndocrine,
  ...labRefUrinalysis,
  ...labRefSpecial,
  ...labRefBloodGas,
  ...labRefCoagulation,
]

export const labRefMap: Record<string, LabRefItem> = Object.fromEntries(
  labRefAll.map((item) => [item.id, item]),
)

export function getLabRefBySection(section: LabSection): LabRefItem[] {
  return labRefAll.filter((item) => item.section.includes(section))
}

// 검사기기/소프트웨어별로 동일 검사를 다른 약어로 표기하는 경우 정규화
const LAB_ALIASES: Record<string, string> = {
  // ALP (Alkaline Phosphatase)
  'alkp': 'alp', 'alkph': 'alp', 'sap': 'alp', 'salp': 'alp',
  // ALT (Alanine Aminotransferase)
  'sgpt': 'alt', 'gpt': 'alt', 'alt/gpt': 'alt',
  // AST (Aspartate Aminotransferase)
  'sgot': 'ast', 'got': 'ast', 'ast/got': 'ast',
  // GGT
  'gamma-gt': 'ggt', 'γ-gt': 'ggt', 'ggtp': 'ggt',
  // Bilirubin
  'tbil': 't.bil', 't-bil': 't.bil', 'total bili': 't.bil', 'total bilirubin': 't.bil',
  'dbil': 'd.bil', 'd-bil': 'd.bil', 'direct bili': 'd.bil',
  // BUN
  'urea': 'bun', 'blood urea nitrogen': 'bun', 'bun/crea': 'bun',
  // Creatinine
  'crea': 'creatinine', 'cre': 'creatinine', 'creat': 'creatinine',
  // Cholesterol
  't-chol': 'cholesterol', 'tcho': 'cholesterol', 'tc': 'cholesterol', 'total chol': 'cholesterol',
  // Triglyceride
  'tg': 'triglyceride', 'trg': 'triglyceride', 'trig': 'triglyceride',
  // Total Protein
  'tpro': 'tp', 't.pro': 'tp', 'total protein': 'tp',
  // Albumin
  'alb': 'albumin',
  // Globulin
  'glob': 'globulin',
  // Glucose
  'bg': 'glucose', 'glu': 'glucose', 'blood glucose': 'glucose',
  // Amylase
  'amy': 'amylase',
  // Lipase
  'lipa': 'lipase', 'lip': 'lipase',
  // Electrolytes
  'sodium': 'na', 'potassium': 'k', 'chloride': 'cl', 'calcium': 'ca',
  'phosphorus': 'phos', 'phosphate': 'phos',
  'magnesium': 'mg',
  // CRP
  'c-reactive protein': 'crp',
  // NT-proBNP (심장표지자) — 기기마다 표기 방식이 다양
  'nt-probnp': 'nt_probnp',
  'nt probnp': 'nt_probnp',
  'ntprobnp': 'nt_probnp',
  'probnp': 'nt_probnp',
  'pro-bnp': 'nt_probnp',
  'cprobnp': 'nt_probnp',
  'c-probnp': 'nt_probnp',
  'fprobnp': 'nt_probnp',
  'f-probnp': 'nt_probnp',
  'cardiopet probnp': 'nt_probnp',
  'cardiopet nt-probnp': 'nt_probnp',
  'n-terminal probnp': 'nt_probnp',
  'n-terminal pro-bnp': 'nt_probnp',
  'bnp': 'nt_probnp',
  // CBC
  'leuko': 'wbc', 'leukocyte': 'wbc', 'white blood cell': 'wbc',
  'erythro': 'rbc', 'red blood cell': 'rbc',
  'platelet': 'plt', 'thrombo': 'plt', 'thrombocyte': 'plt',
  'hct': 'pcv', 'hematocrit': 'pcv',
  'hemoglobin': 'hgb', 'haemoglobin': 'hgb',
  'mcv': 'mcv', 'mch': 'mch', 'mchc': 'mchc',
  // Neutrophil
  'neu': 'neut', 'neutrophil': 'neut', 'neutrophils': 'neut', 'seg': 'neut',
  // Lymphocyte
  'lym': 'lymph', 'lymphocyte': 'lymph', 'lymphocytes': 'lymph',
  // Monocyte
  'mono': 'mono', 'monocyte': 'mono',
  // Eosinophil
  'eos': 'eosino', 'eosinophil': 'eosino',
  // Basophil
  'baso': 'basophil', 'basophils': 'basophil',
  // Reticulocyte
  'retic': 'reticulocyte',
  // SDMA
  'symmetric dimethylarginine': 'sdma',
  // Coagulation
  'prothrombin time': 'pt',
  'pro-time': 'pt',
  'activated partial thromboplastin time': 'aptt',
  'partial thromboplastin time': 'aptt',
  'ptt': 'aptt',
  'fibrin degradation products': 'fdp',
  'fsp': 'fdp',
  'thrombin time': 'thrombin_time',
  'tt': 'thrombin_time',
  'antithrombin': 'at3',
  'antithrombin iii': 'at3',
  'at-iii': 'at3',
  'von willebrand factor': 'vwf',
  'vwf antigen': 'vwf',
  'vwd': 'vwf',
  // Blood Gas
  'blood ph': 'ph',
  'arterial ph': 'ph',
  'pco2': 'pco2',
  'pco₂': 'pco2',
  'partial pressure co2': 'pco2',
  'po2': 'po2',
  'po₂': 'po2',
  'pao2': 'po2',
  'partial pressure o2': 'po2',
  'hco3': 'hco3',
  'hco3-': 'hco3',
  'bicarbonate': 'hco3',
  'bicarb': 'hco3',
  'be': 'base_excess',
  'bd': 'base_excess',
  'tco2': 'tco2',
  'total co2': 'tco2',
  'spo2': 'spo2',
  'spo₂': 'spo2',
  'oxygen saturation': 'spo2',
  'lactic acid': 'lactate',
  'ag': 'anion_gap',
}

export function findLabRefByKeyword(keyword: string): LabRefItem | undefined {
  const lower = keyword.toLowerCase().trim()
  const normalized = LAB_ALIASES[lower] ?? lower

  return labRefAll.find((item) => {
    const itemName = item.nameEn.toLowerCase()
    if (itemName === lower || itemName === normalized) return true
    if (item.nameKo === keyword.trim()) return true
    if (item.aiExtractKeywords?.some((k) => {
      const kl = k.toLowerCase()
      return kl === lower || kl === normalized
    })) return true
    return false
  })
}
