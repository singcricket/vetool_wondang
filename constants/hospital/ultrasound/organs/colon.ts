import { UltrasoundTestItem } from '../types';

export const colonTests: UltrasoundTestItem[] = [
  {
    testID: 'colon_wall_thickness',
    testName: 'Colon Wall Thickness',
    testNameKo: '결장 벽 두께',
    organ: 'colon',
    partOfOrgan: 'wall',
    testType: 'range',
    unit: 'mm',
    clinicalSignificance: 'high',
    species: 'both',
    required: true,
    displayLevel: 1,
    note: 'Normal: <2.0-3.0mm. Usually very thin.',
    normalRange: { dog: { max: 3 }, cat: { max: 3 } },
    ranges: [
      { min: 0, max: 3, resultText: 'Colonic wall thickness within normal limits', resultTextKo: '결장 벽 두께 정상 범위', isAbnormal: false },
      { min: 3, max: null, resultText: 'Colonic wall thickening; colitis suspected', resultTextKo: '결장 벽 비후; 결장염 의심', isAbnormal: true, severity: 'mild' },
    ],
  },
  {
    testID: 'colon_content',
    testName: 'Colon Content',
    testNameKo: '결장 내강물',
    organ: 'colon',
    partOfOrgan: 'lumen',
    testType: 'select',
    clinicalSignificance: 'low',
    species: 'both',
    required: false,
    displayLevel: 1,
    options: [
      { value: 'feces', label: 'Feces (normal)', labelKo: '변 (정상)', resultText: 'Colonic content consists of normal feces', resultTextKo: '결장 내 정상 변 관찰됨', isAbnormal: false },
      { value: 'gas', label: 'Gas', labelKo: '가스', resultText: '', resultTextKo: '', isAbnormal: false },
      { value: 'empty', label: 'Empty', labelKo: '비어있음', resultText: '', resultTextKo: '', isAbnormal: false },
    ],
  },
];
