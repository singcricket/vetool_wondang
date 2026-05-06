import { Organ, OrganSection, UltrasoundTestItem, ImpressionRule, OrganStatusGate } from './types';

/**
 * 장기 게이트 생성 헬퍼
 */
export function makeGate(organID: string, organNameEn: string, organNameKo: string, includeAbsent: boolean = false): OrganStatusGate {
  const options = [
    { value: 'normal',      label: 'Normal — no further evaluation needed', labelKo: '정상 — 추가 평가 불필요' },
    { value: 'abnormal',    label: 'Abnormal — evaluate sub-items',          labelKo: '이상 — 세부 항목 평가' },
  ];

  if (includeAbsent) {
    options.push({ value: 'absent', label: 'Absent / Removed', labelKo: '결손 / 적출됨' });
  }

  options.push({ value: 'not_examined', label: 'Not examined', labelKo: '검사 불가' });

  return {
    testID: `${organID}_status`,
    testName: `${organNameEn} — Overall Assessment`,
    testNameKo: `${organNameKo} 전반적 평가`,
    normalValue: 'normal',
    abnormalValue: 'abnormal',
    options: options,
  };
}

/**
 * 장기 섹션이 화면에 표시되어야 하는지 여부.
 */
export function isOrganVisible(
  section: OrganSection,
  results: Record<string, string>
): boolean {
  const gateValue = results[section.statusGate.testID];
  return gateValue === section.statusGate.abnormalValue;
}

/**
 * 개별 검사 항목이 화면에 표시되어야 하는지 여부.
 */
export function isTestVisible(
  test: UltrasoundTestItem,
  results: Record<string, any>
): boolean {
  const organStatusID = test.organ + '_status';
  const organStatus = results[organStatusID];

  if (!test.dependsOn) {
    return organStatus === 'abnormal';
  }

  const deps = Array.isArray(test.dependsOn) ? test.dependsOn : [test.dependsOn];

  return deps.every((dep) => {
    let currentValue = results[dep.testID];
    
    if (dep.testID === 'organ_status') {
      currentValue = organStatus;
    }

    if (!currentValue) return false;
    return dep.triggerValues.includes(String(currentValue));
  });
}

/**
 * 이상 소견만 필터링하여 최종 차트 문구 배열을 반환
 */
export function buildChartSummary(
  results: Record<string, string | number>,
  organSections: OrganSection[],
  lang: 'en' | 'ko' = 'ko',
  targetOrgan?: Organ
): string[] {
  const lines: string[] = [];
  const processedTestIDs = new Set<string>();

  for (const section of organSections) {
    if (targetOrgan && section.organ !== targetOrgan) continue;

    for (const test of section.tests) {
      if (processedTestIDs.has(test.testID)) continue;
      if (!targetOrgan) processedTestIDs.add(test.testID);

      const val = results[test.testID];
      if (val === undefined || val === null) continue;

      let resultText = '';

      if (test.testType === 'select') {
        if (val === 'other') {
          resultText = (results[test.testID + '_other'] as string) || '';
        } else {
          const opt = test.options.find((o) => o.value === val);
          if (opt && opt.isAbnormal) {
            resultText = lang === 'ko' ? opt.resultTextKo : opt.resultText;
          }
        }
      } else if (test.testType === 'range' && typeof val === 'number') {
        const seg = test.ranges.find(
          (r) =>
            (r.min === null || val >= r.min) &&
            (r.max === null || val < r.max)
        );
        if (seg && seg.isAbnormal) {
          resultText = lang === 'ko' ? seg.resultTextKo : seg.resultText;
        }
      } else if (test.testType === 'boolean') {
        if (val === 'true' && test.positiveIsAbnormal) {
          resultText = lang === 'ko' ? test.positiveResultTextKo : test.positiveResultText;
        }
      } else if (test.testType === 'multiselect' && Array.isArray(val)) {
        const selectedOptions = test.options.filter(o => val.includes(o.value));
        const otherVal = val.includes('other') ? (results[test.testID + '_other'] as string) : '';

        if (selectedOptions.length > 0 || otherVal) {
          const labels = selectedOptions.map(o => (lang === 'ko' ? o.labelKo : o.label));
          if (otherVal) labels.push(otherVal);

          const template = lang === 'ko' ? test.resultTemplateKo : test.resultTemplate;
          
          if (template) {
            resultText = template.replace('{values}', labels.join(', '));
          } else {
            resultText = lang === 'ko' 
              ? `${test.testNameKo}: ${labels.join(', ')}` 
              : `${test.testName}: ${labels.join(', ')}`;
          }
        }
      }

      if (resultText) {
        lines.push(resultText);
      }
    }
  }
  return lines;
}

/**
 * 임프레션 룰 평가
 */
export function evaluateImpressionRules(
  results: Record<string, string>,
  impressionRules: ImpressionRule[]
): ImpressionRule[] {
  return impressionRules.filter((rule) => {
    return Object.entries(rule.conditions).every(([testID, expected]) => {
      const actual = results[testID];
      if (!actual) return false;
      if (Array.isArray(expected)) return expected.includes(actual);
      return actual === expected;
    });
  });
}
