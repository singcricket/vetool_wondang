// ============================================================
// ophthalmic_ref.ts — Index / Entry Point
// 소동물 안과 검진 Reference Database (v1.0.0)
// 각 서브 파일에서 re-export하고 ophthalmicReference 조합
// ============================================================

export * from './ophthalmic-types'
export * from './ophthalmic-exam-domains'
export * from './ophthalmic-diagnosis'
export * from './ophthalmic-treatments'

import { ophthalmicDomainSections } from './ophthalmic-exam-domains'
import { ophthalmicDiagnosisRules, collectOphSigns, runOphDiagnosisEngine, assessVisionStatus, buildOphChartSummary } from './ophthalmic-diagnosis'
import type { OphDomainSection, OphEngineOutput } from './ophthalmic-types'

export const ophthalmicReference = {
  domainSections: ophthalmicDomainSections,
  diagnosisRules: ophthalmicDiagnosisRules,

  isDomainVisible(section: OphDomainSection, results: Record<string, string>): boolean {
    return results[section.statusGate.testID] === section.statusGate.abnormalValue
  },

  collectSigns: collectOphSigns,
  runDiagnosisEngine: runOphDiagnosisEngine,
  assessVisionStatus,
  buildChartSummary: buildOphChartSummary,

  runFullAnalysis(results: Record<string, string | string[]>): OphEngineOutput {
    const activeSigns = collectOphSigns(results)
    const diagnoses = runOphDiagnosisEngine(activeSigns)
    const visionStatus = assessVisionStatus(activeSigns)

    const criticalFindings: string[] = []
    if (activeSigns.includes('bilateral_blindness')) criticalFindings.push('양안 실명')
    if (activeSigns.includes('descemetocele_od') || activeSigns.includes('descemetocele_os')) criticalFindings.push('데스메막 탈출 — 즉각 처치 필요')
    if (activeSigns.includes('very_high_iop_od') || activeSigns.includes('very_high_iop_os')) criticalFindings.push('심각한 안압 상승 — 급성 녹내장')
    if (activeSigns.includes('retinal_detachment_od') || activeSigns.includes('retinal_detachment_os')) criticalFindings.push('망막 박리')
    if (activeSigns.includes('proptosis_od') || activeSigns.includes('proptosis_os')) criticalFindings.push('안구 돌출 — 응급 처치 필요')
    if (activeSigns.includes('lens_luxation_od') || activeSigns.includes('lens_luxation_os')) criticalFindings.push('수정체 탈구 — 즉각 처치 필요')

    return { activeSigns, diagnoses, criticalFindings, visionStatus }
  },
}
