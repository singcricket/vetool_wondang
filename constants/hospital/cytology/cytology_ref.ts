// ============================================================
// cytology_ref.ts — Barrel export + cytologyReference facade
// ============================================================

export * from './cytology-types'
export * from './cytology-routine'
export * from './cytology-specialist'
export * from './cytology-diagnosis'

import { cytologyRoutineSamples, cytologyRoutineMap } from './cytology-routine'
import { cytologyCellTypes, cytologySpecialistSteps } from './cytology-specialist'
import { cytologyDiagnosisRules, collectCytologySigns, runCytologyDiagnosisEngine, buildCytologyChartSummary } from './cytology-diagnosis'
import type { CytologySign, CytologySampleType, CytologyEngineOutput } from './cytology-types'

export const cytologyReference = {
  // Data
  routineSamples: cytologyRoutineSamples,
  routineMap: cytologyRoutineMap,
  cellTypes: cytologyCellTypes,
  specialistSteps: cytologySpecialistSteps,
  diagnosisRules: cytologyDiagnosisRules,

  // Engine
  collectSigns(
    findings: Record<string, string | string[]>,
    sampleType: CytologySampleType,
  ): CytologySign[] {
    return collectCytologySigns(findings, sampleType)
  },

  runFullAnalysis(
    findings: Record<string, string | string[]>,
    sampleType: CytologySampleType,
  ): CytologyEngineOutput {
    const signs = collectCytologySigns(findings, sampleType)
    return runCytologyDiagnosisEngine(signs, sampleType)
  },

  buildSummary(
    findings: Record<string, string | string[]>,
    sampleType: CytologySampleType,
    output: CytologyEngineOutput,
  ): string {
    return buildCytologyChartSummary(findings, sampleType, output)
  },

  // Helpers
  getSampleDef(sampleType: CytologySampleType) {
    return cytologyRoutineMap[sampleType] ?? null
  },

  getSampleName(sampleType: CytologySampleType): string {
    return cytologyRoutineMap[sampleType]?.nameKo ?? sampleType
  },
} as const
