// ============================================================
// types.ts
// Veterinary Abdominal Ultrasound Reference Types
// ============================================================

export type Species = 'dog' | 'cat' | 'both';
export type TestType = 'select' | 'multiselect' | 'range' | 'boolean' | 'score';
export type ClinicalSignificance = 'high' | 'medium' | 'low';
export type Organ =
  | 'liver'
  | 'gallbladder'
  | 'spleen'
  | 'kidney'
  | 'left_kidney'
  | 'right_kidney'
  | 'urinary_bladder'
  | 'pancreas'
  | 'stomach'
  | 'duodenum'
  | 'small_intestine'
  | 'colon'
  | 'gi_tract'
  | 'adrenal'
  | 'left_adrenal'
  | 'right_adrenal'
  | 'lymph_node'
  | 'free_fluid'
  | 'reproductive';

export type PartOfOrgan =
  | 'diffuse'
  | 'focal'
  | 'right_lobe'
  | 'left_lobe'
  | 'medial_lobe'
  | 'right_kidney'
  | 'left_kidney'
  | 'cortex'
  | 'medulla'
  | 'pelvis'
  | 'neck'
  | 'body'
  | 'tail'
  | 'fundus'
  | 'wall'
  | 'lumen'
  | 'solitary'
  | 'multiple'
  | 'bilateral'
  | 'right'
  | 'left'
  | 'cranial'
  | 'caudal'
  | 'parenchyma'
  | 'general';

export interface SelectOption {
  value: string;
  label: string;
  labelKo: string;
  resultText: string;
  resultTextKo: string;
  ownerResultTextKo?: string;
  isAbnormal: boolean;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface RangeSegment {
  min: number | null;
  max: number | null;
  resultText: string;
  resultTextKo: string;
  ownerResultTextKo?: string;
  isAbnormal: boolean;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface NormalRange {
  dog?: { min?: number; max?: number };
  cat?: { min?: number; max?: number };
}

export type DisplayLevel = 0 | 1 | 2 | 3;

export interface DependsOn {
  testID: string;
  triggerValues: string[];
  operator?: 'OR' | 'AND';
}

export interface OrganStatusGate {
  testID: string;
  testName: string;
  testNameKo: string;
  normalValue: string;
  abnormalValue: string;
  options: Array<{
    value: string;
    label: string;
    labelKo: string;
  }>;
}

interface BaseTestItem {
  testID: string;
  testName: string;
  testNameKo: string;
  organ: Organ;
  partOfOrgan: PartOfOrgan | PartOfOrgan[];
  clinicalSignificance: ClinicalSignificance;
  species: Species;
  required: boolean;
  displayLevel: DisplayLevel;
  dependsOn?: DependsOn | DependsOn[];
  dependsOnAny?: DependsOn[];
  relatedTests?: string[];
  note?: string;
}

export interface SelectTestItem extends BaseTestItem {
  testType: 'select';
  options: SelectOption[];
}

export interface MultiSelectTestItem extends BaseTestItem {
  testType: 'multiselect';
  options: SelectOption[];
  resultTemplate: string;
  resultTemplateKo: string;
  resultTemplateOwnerKo?: string;
}

export interface RangeTestItem extends BaseTestItem {
  testType: 'range';
  unit: string;
  normalRange: NormalRange;
  ranges: RangeSegment[];
  dogRanges?: RangeSegment[];
  catRanges?: RangeSegment[];
}

export interface BooleanTestItem extends BaseTestItem {
  testType: 'boolean';
  positiveResultText: string;
  positiveResultTextKo: string;
  positiveOwnerResultTextKo?: string;
  negativeResultText: string;
  negativeResultTextKo: string;
  negativeOwnerResultTextKo?: string;
  positiveIsAbnormal: boolean;
}

export interface ScoreTestItem extends BaseTestItem {
  testType: 'score';
  minScore: number;
  maxScore: number;
  unit?: string;
  ranges: RangeSegment[];
}

export type UltrasoundTestItem =
  | SelectTestItem
  | MultiSelectTestItem
  | RangeTestItem
  | BooleanTestItem
  | ScoreTestItem;

export interface ImpressionRule {
  ruleID: string;
  conditions: Partial<Record<string, string | string[]>>;
  impression: string;
  impressionKo: string;
  differentials: string[];
  differentialsKo: string[];
  recommendation: string;
  recommendationKo: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
}

export interface OrganSection {
  organ: Organ;
  organName: string;
  organNameKo: string;
  scanningOrder: number;
  statusGate: OrganStatusGate;
  tests: UltrasoundTestItem[];
}

export interface UltrasoundReference {
  version: string;
  lastUpdated: string;
  organs: OrganSection[];
  impressionRules: ImpressionRule[];
}
