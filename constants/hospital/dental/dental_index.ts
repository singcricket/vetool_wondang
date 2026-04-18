// ============================================================
// Dental Tests Module — Index
// ============================================================

// Types
export type {
  Species,
  UrgencyLevel,
  DentalTestType,
  GradeValue,
  DentalTestOption,
  DentalTest,
} from './dentalTest_types';

// Data
export { DENTAL_CHART_TESTS } from './dentalChartTests';
export { DENTAL_TOOTH_TESTS }  from './dentalToothTestsA';

// Report Generator
export type {
  DentalFinding,
  ToothFindings,
  DentalReport,
  ChartReportInput,
  FullDentalReport,
} from './dentalReportGenerator';

export {
  generateToothReport,
  generateFullDentalReport,
  compareUrgency,
  urgencyLabel,
  getDetail,
  getAbbr,
} from './dentalReportGenerator';

// ── 전체 테스트 통합 조회 ────────────────────────────────────
import { DENTAL_CHART_TESTS } from './dentalChartTests';
import { DENTAL_TOOTH_TESTS }  from './dentalToothTestsA';
import type { DentalTest }     from './dentalTest_types';

export const ALL_DENTAL_TESTS: Record<string, DentalTest> = {
  ...DENTAL_CHART_TESTS,
  ...DENTAL_TOOTH_TESTS,
};

export function getDentalTest(testID: string): DentalTest | undefined {
  return ALL_DENTAL_TESTS[testID];
}

// ── 사용 예시 ────────────────────────────────────────────────
/*
import {
  generateFullDentalReport,
  DENTAL_TOOTH_TESTS,
} from '@/data/dental';

const report = generateFullDentalReport({
  chartFindings: [
    { testID: 'skull_type',          value: 'brachycephalic' },
    { testID: 'calculus_overall',    value: 'moderate' },
    { testID: 'periodontitis_stage', value: 'PD2' },
  ],
  toothFindingsList: [
    {
      toothId: 104,
      findings: [
        { testID: 'tooth_fracture', value: 'T/FX/CCF' },
        { testID: 'pulp_exposure',  value: 'T/PE' },
        { testID: 'calculus',       value: 'severe' },
      ],
    },
    {
      toothId: 309,
      findings: [
        { testID: 'periodontal_stage', value: 'PD4' },
        { testID: 'mobility',          value: 'grade3' },
        { testID: 'furcation',         value: 'grade3' },
      ],
    },
  ],
});

console.log(report.fullProfessionalReport);
// ■ Overall Assessment
// [Skull Type] Brachycephalic — 단두형...
// [Calculus (Overall)] Moderate calculus (Grade 2) — ...
// ...
// ■ Tooth Findings
// Tooth 104: [Tooth Fracture] Complicated crown fracture — ...
// Tooth 309: [Periodontal Disease Stage] Advanced periodontitis — ...
// ...
// ■ Recommended Treatments: VPT, RCT, RAD, XSS

console.log(report.fullAbbreviatedReport);
// brachycephalic; moderate; PD2
// 104: T/FX/CCF, T/PE, severe | 309: PD4, grade3, grade3
// Tx: VPT+RCT+RAD+XSS

console.log(report.fullClientReport);
// 납작한 얼굴 형태입니다...
// • 104번 치아: 치아가 깨지면서 신경이 노출되었습니다...
// • 309번 치아: 이 치아의 지지 구조가 심하게 손상되어...
*/
