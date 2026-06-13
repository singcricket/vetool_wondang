import { UltrasoundReference, OrganSection, Organ } from './types';
import { makeGate } from './utils';

// Import organ tests
import { liverTests } from './organs/liver';
import { gallbladderTests } from './organs/gallbladder';
import { spleenTests } from './organs/spleen';
import { kidneyTests } from './organs/kidney';
import { urinaryBladderTests } from './organs/urinary_bladder';
import { pancreasTests } from './organs/pancreas';
import { stomachTests } from './organs/stomach';
import { duodenumTests } from './organs/duodenum';
import { smallIntestineTests } from './organs/small_intestine';
import { colonTests } from './organs/colon';
import { giTractTests } from './organs/gi_tract';
import { adrenalTests } from './organs/adrenal';
import { lymphNodeTests } from './organs/lymph_node';
import { freeFluidTests } from './organs/free_fluid';

// Import impression rules
import { impressionRules } from './impression_rules';

export const organSections: OrganSection[] = [
  {
    organ: 'liver',
    organName: 'Liver',
    organNameKo: '간',
    scanningOrder: 1,
    statusGate: makeGate('liver', 'Liver', '간'),
    tests: liverTests,
  },
  {
    organ: 'gallbladder',
    organName: 'Gallbladder & Biliary System',
    organNameKo: '담낭 및 담도계',
    scanningOrder: 2,
    statusGate: makeGate('gallbladder', 'Gallbladder', '담낭', true),
    tests: gallbladderTests,
  },
  {
    organ: 'spleen',
    organName: 'Spleen',
    organNameKo: '비장',
    scanningOrder: 3,
    statusGate: makeGate('spleen', 'Spleen', '비장', true),
    tests: spleenTests,
  },
  {
    organ: 'pancreas',
    organName: 'Pancreas',
    organNameKo: '췌장',
    scanningOrder: 4,
    statusGate: makeGate('pancreas', 'Pancreas', '췌장'),
    tests: pancreasTests,
  },
  {
    organ: 'left_kidney',
    organName: 'Left Kidney',
    organNameKo: '좌측 신장',
    scanningOrder: 5.1,
    statusGate: makeGate('left_kidney', 'Left Kidney', '좌측 신장', true),
    tests: kidneyTests.map(t => ({ ...t, organ: 'left_kidney' as Organ })),
  },
  {
    organ: 'right_kidney',
    organName: 'Right Kidney',
    organNameKo: '우측 신장',
    scanningOrder: 5.2,
    statusGate: makeGate('right_kidney', 'Right Kidney', '우측 신장', true),
    tests: kidneyTests.map(t => ({ ...t, organ: 'right_kidney' as Organ })),
  },
  {
    organ: 'urinary_bladder',
    organName: 'Urinary Bladder',
    organNameKo: '방광',
    scanningOrder: 6,
    statusGate: makeGate('urinary_bladder', 'Urinary Bladder', '방광'),
    tests: urinaryBladderTests,
  },
  {
    organ: 'left_adrenal',
    organName: 'Left Adrenal Gland',
    organNameKo: '좌측 부신',
    scanningOrder: 7.1,
    statusGate: makeGate('left_adrenal', 'Left Adrenal Gland', '좌측 부신', true),
    tests: adrenalTests.map(t => ({ ...t, organ: 'left_adrenal' as Organ })),
  },
  {
    organ: 'right_adrenal',
    organName: 'Right Adrenal Gland',
    organNameKo: '우측 부신',
    scanningOrder: 7.2,
    statusGate: makeGate('right_adrenal', 'Right Adrenal Gland', '우측 부신', true),
    tests: adrenalTests.map(t => ({ ...t, organ: 'right_adrenal' as Organ })),
  },
  {
    organ: 'stomach',
    organName: 'Stomach',
    organNameKo: '위',
    scanningOrder: 8.1,
    statusGate: makeGate('stomach', 'Stomach', '위', true),
    tests: stomachTests,
  },
  {
    organ: 'duodenum',
    organName: 'Duodenum',
    organNameKo: '십이지장',
    scanningOrder: 8.2,
    statusGate: makeGate('duodenum', 'Duodenum', '십이지장'),
    tests: duodenumTests,
  },
  {
    organ: 'small_intestine',
    organName: 'Small Intestine (Jejunum/Ileum)',
    organNameKo: '소장 (공장/회장)',
    scanningOrder: 8.3,
    statusGate: makeGate('small_intestine', 'Small Intestine', '소장'),
    tests: smallIntestineTests,
  },
  {
    organ: 'colon',
    organName: 'Colon',
    organNameKo: '결장',
    scanningOrder: 8.4,
    statusGate: makeGate('colon', 'Colon', '결장'),
    tests: colonTests,
  },
  {
    organ: 'gi_tract',
    organName: 'GI Tract (General)',
    organNameKo: '위장관 전반',
    scanningOrder: 8.5,
    statusGate: makeGate('gi_tract', 'GI Tract', '위장관'),
    tests: giTractTests,
  },
  {
    organ: 'lymph_node',
    organName: 'Abdominal Lymph Nodes',
    organNameKo: '복강 림프절',
    scanningOrder: 9,
    statusGate: makeGate('lymph_node', 'Abdominal Lymph Nodes', '복강 림프절'),
    tests: lymphNodeTests,
  },
  {
    organ: 'free_fluid',
    organName: 'Abdominal Free Fluid',
    organNameKo: '복강 내 유리액',
    scanningOrder: 10,
    statusGate: makeGate('free_fluid', 'Abdominal Free Fluid', '복강 내 유리액'),
    tests: freeFluidTests,
  },
];

export const ultrasoundReference: UltrasoundReference = {
  version: '1.1.0',
  lastUpdated: '2025-05-06',
  organs: organSections,
  impressionRules,
};

export default ultrasoundReference;

import * as utils from './utils';

export const isOrganVisible = utils.isOrganVisible;
export const isTestVisible = utils.isTestVisible;

export const buildChartSummary = (
  results: Record<string, string | number>,
  lang: 'en' | 'ko' = 'ko',
  targetOrgan?: Organ,
  audience: 'vet' | 'owner' = 'vet',
  species?: string
) => utils.buildChartSummary(results, organSections, lang, targetOrgan, audience, species);

export const evaluateImpressionRules = (
  results: Record<string, any>
) => utils.evaluateImpressionRules(results, impressionRules);

export * from './types';
export { utils };
