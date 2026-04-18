import type { DentalTest, UrgencyLevel } from './dentalTest_types';
import { DENTAL_CHART_TESTS } from './dentalChartTests';
import { DENTAL_TOOTH_TESTS } from './dentalToothTestsA';

// ============================================================
// 리포트 타입
// ============================================================

export interface DentalFinding {
  testID: string;
  value:  string | string[];  // select → string, multiselect → string[]
}

export interface ToothFindings {
  toothId:  number;           // Triadan 번호 (예: 104)
  findings: DentalFinding[];
}

export interface DentalReport {
  // 수의사용 전문 리포트
  professional: string;
  // 약어 리포트
  abbreviated:  string;
  // 보호자 설명
  clientFriendly: string;
  // 치료 계획 (중복 제거된 AVDC 약어 목록)
  suggestedTreatments: string[];
  // 최고 긴급도
  maxUrgency: UrgencyLevel;
}

// ============================================================
// 유틸리티
// ============================================================

const URGENCY_ORDER: Record<UrgencyLevel, number> = {
  urgent:      4,
  recommended: 3,
  elective:    2,
  monitor:     1,
  none:        0,
};

export function compareUrgency(a: UrgencyLevel, b: UrgencyLevel): UrgencyLevel {
  return URGENCY_ORDER[a] >= URGENCY_ORDER[b] ? a : b;
}

export function urgencyLabel(u: UrgencyLevel): string {
  const map: Record<UrgencyLevel, string> = {
    urgent:      '긴급',
    recommended: '권장',
    elective:    '선택적',
    monitor:     '경과 관찰',
    none:        '해당 없음',
  };
  return map[u];
}

/** value에서 detail 추출 */
export function getDetail(test: DentalTest, value: string): string {
  return test.options?.find((o) => o.value === value)?.detail ?? value;
}

/** value에서 약어 추출 (AVDC 약어 형식인 경우 그대로, 아닌 경우 value 반환) */
export function getAbbr(value: string): string {
  return value;
}

// ============================================================
// 단일 치아 리포트 생성
// ============================================================

export function generateToothReport(
  toothFindings: ToothFindings
): DentalReport {
  const { toothId, findings } = toothFindings;

  const professionalLines: string[] = [];
  const abbrLines:         string[] = [];
  const clientLines:       string[] = [];
  const allTx:             string[] = [];
  let   maxUrgency: UrgencyLevel = 'none';

  for (const { testID, value } of findings) {
    const test = DENTAL_TOOTH_TESTS[testID];
    if (!test) continue;

    // multiselect 처리
    if (Array.isArray(value)) {
      const details = value.map((v) => getDetail(test, v)).join(', ');
      const abbrs   = value.join('+');
      professionalLines.push(`[${test.testName}] ${details}`);
      abbrLines.push(`${abbrs}`);
      continue;
    }

    if (value === 'none' || value === '') continue;

    const detail  = getDetail(test, value);
    const comment = test.optComment?.[value] ?? '';
    const client  = test.generalComment?.[value] ?? '';
    const urgency = (test.urgency?.[value] ?? 'none') as UrgencyLevel;
    const txList  = test.suggestedTx?.[value] ?? [];

    professionalLines.push(
      `[${test.testName}] ${detail}${comment ? ` — ${comment}` : ''}`
    );
    abbrLines.push(`${value}`);
    if (client) clientLines.push(client);
    allTx.push(...txList);
    maxUrgency = compareUrgency(maxUrgency, urgency);
  }

  return {
    professional:        `Tooth ${toothId}: ${professionalLines.join('; ')}`,
    abbreviated:         `${toothId}: ${abbrLines.join(', ')}`,
    clientFriendly:      clientLines.join(' '),
    suggestedTreatments: [...new Set(allTx)],
    maxUrgency,
  };
}

// ============================================================
// 전체 구강 차트 리포트 생성
// ============================================================

export interface ChartReportInput {
  chartFindings: DentalFinding[];
  toothFindingsList: ToothFindings[];
}

export interface FullDentalReport {
  chartSummary: {
    professional:   string;
    abbreviated:    string;
    clientFriendly: string;
  };
  toothReports: Array<{
    toothId: number;
    report:  DentalReport;
  }>;
  overallSuggestedTx: string[];
  overallMaxUrgency:  UrgencyLevel;
  // 완성된 전체 리포트 텍스트
  fullProfessionalReport: string;
  fullAbbreviatedReport:  string;
  fullClientReport:       string;
}

export function generateFullDentalReport(
  input: ChartReportInput
): FullDentalReport {
  // ── 차트 수준 리포트 ──
  const chartProfLines: string[] = [];
  const chartAbbrLines: string[] = [];
  const chartClientLines: string[] = [];

  for (const { testID, value } of input.chartFindings) {
    const test = DENTAL_CHART_TESTS[testID];
    if (!test || !value || value === 'none') continue;

    const detail  = getDetail(test, value as string);
    const comment = test.optComment?.[value as string] ?? '';
    const client  = test.generalComment?.[value as string] ?? '';

    chartProfLines.push(`[${test.testName}] ${detail}${comment ? ` — ${comment}` : ''}`);
    chartAbbrLines.push(`${value}`);
    if (client) chartClientLines.push(client);
  }

  // ── 치아별 리포트 ──
  const toothReports = input.toothFindingsList.map((tf) => ({
    toothId: tf.toothId,
    report:  generateToothReport(tf),
  }));

  // ── 전체 Tx / 긴급도 집계 ──
  const allTx: string[] = [];
  let overallUrgency: UrgencyLevel = 'none';

  for (const { report } of toothReports) {
    allTx.push(...report.suggestedTreatments);
    overallUrgency = compareUrgency(overallUrgency, report.maxUrgency);
  }

  // ── 이상 소견 있는 치아만 리포트에 포함 ──
  const abnormalToothReports = toothReports.filter(
    (t) => t.report.abbreviated !== `${t.toothId}: `
  );

  // ── 전체 리포트 조합 ──
  const fullProfessional = [
    '■ Overall Assessment',
    chartProfLines.join('\n'),
    '',
    '■ Tooth Findings',
    ...abnormalToothReports.map((t) => t.report.professional),
    '',
    `■ Recommended Treatments: ${[...new Set(allTx)].join(', ')}`,
  ].join('\n');

  const fullAbbreviated = [
    chartAbbrLines.join('; '),
    abnormalToothReports.map((t) => t.report.abbreviated).join(' | '),
    `Tx: ${[...new Set(allTx)].join('+')}`,
  ]
    .filter(Boolean)
    .join('\n');

  const fullClient = [
    chartClientLines.join(' '),
    '',
    ...abnormalToothReports
      .filter((t) => t.report.clientFriendly)
      .map((t) => `• ${t.toothId}번 치아: ${t.report.clientFriendly}`),
  ]
    .filter(Boolean)
    .join('\n');

  return {
    chartSummary: {
      professional:   chartProfLines.join('; '),
      abbreviated:    chartAbbrLines.join('; '),
      clientFriendly: chartClientLines.join(' '),
    },
    toothReports,
    overallSuggestedTx:     [...new Set(allTx)],
    overallMaxUrgency:      overallUrgency,
    fullProfessionalReport: fullProfessional,
    fullAbbreviatedReport:  fullAbbreviated,
    fullClientReport:       fullClient,
  };
}
