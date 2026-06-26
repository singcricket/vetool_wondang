// core/catLifeStageStandards.ts
//
// 출처: FEDIAF Nutritional Guidelines for Complete and Complementary
//       Pet Food for Cats and Dogs, Publication July 2024
//       Table III-4a (Unit per 100 g dry matter, DM)
//
// 주의:
// - FEDIAF는 규제기관이 아니며 본 가이드라인은 법적 구속력이 없음 (자율 규제 산업표준)
// - 여기 수치는 "최소권장수준(minimum recommended level)"이며
//   "최소요구량(minimum requirement)"이나 "최적섭취량(optimal intake)"이 아님
// - Adult 기준은 MER 75 kcal/kgBW^0.67 가정값 사용 (FEDIAF가 제시하는 2가지 중 보존적 값)
//   * 100 kcal/kgBW^0.67 기준 컬럼은 향후 필요시 별도 추가 가능
// - 성장기/번식기는 "growth/reproduction" 한 컬럼으로 합쳐져 있고,
//   값이 다른 항목만 "성장값/번식값" 형태로 원문에 표기됨 → 본 파일은 growth, reproduction 각각의
//   필드로 분리해서 저장 (값이 같으면 동일하게 채움)
// - 단위는 모두 100g DM(건물) 기준으로 통일
// - "-"로 표기된 항목(수치 없음)은 null로 처리
// - (N) = nutritional maximum, (L) = EU legal maximum  → maxType 필드로 구분
// - 개와 달리 고양이는 타우린·아라키돈산이 필수 영양소로 추가됨

import type { NutrientRange } from "./dogLifeStageStandards";

export type CatLifeStage =
  | "growth"            // 성장기 (자묘)
  | "reproduction"       // 번식기 (임신·수유묘)
  | "adult_maintenance"; // 성묘 유지기

export interface CatLifeStageStandard {
  species: "cat";
  lifeStage: CatLifeStage;
  merAssumption: string;
  source: string;
  nutrients: Record<string, NutrientRange>;
}

// ────────────────────────────────────────────────────────────
// Adult Maintenance (성묘 유지기) — MER 75 kcal/kgBW^0.67 기준
// ────────────────────────────────────────────────────────────
const catAdultMaintenance: CatLifeStageStandard = {
  species: "cat",
  lifeStage: "adult_maintenance",
  merAssumption: "75 kcal/kgBW^0.67",
  source: "FEDIAF Nutritional Guidelines 2024, Table III-4a",
  nutrients: {
    // 주요 영양소
    crude_protein: { min: 33.30, max: null, maxType: null, unit: "g/100gDM" },
    crude_fat:     { min: 9.00,  max: null, maxType: null, unit: "g/100gDM" },

    // 필수 지방산 — 고양이는 아라키돈산이 전 생애주기 필수
    linoleic_acid:        { min: 0.67, max: null, maxType: null, unit: "g/100gDM" },
    arachidonic_acid:     { min: 8.00, max: null, maxType: null, unit: "mg/100gDM", note: "고양이는 성묘도 필수 (자체 합성 불가)" },
    alpha_linolenic_acid: { min: null, max: null, maxType: null, unit: "g/100gDM", note: "성묘 유지기는 권장 미설정" },
    epa_dha:              { min: null, max: null, maxType: null, unit: "g/100gDM", note: "성묘 유지기는 권장 미설정" },

    // 필수 아미노산
    arginine:                { min: 1.30, max: null, maxType: null, unit: "g/100gDM" },
    histidine:                { min: 0.35, max: null, maxType: null, unit: "g/100gDM" },
    isoleucine:                { min: 0.57, max: null, maxType: null, unit: "g/100gDM" },
    leucine:                   { min: 1.36, max: null, maxType: null, unit: "g/100gDM" },
    lysine:                    { min: 0.45, max: null, maxType: null, unit: "g/100gDM" },
    methionine:                { min: 0.23, max: null, maxType: null, unit: "g/100gDM" },
    methionine_cystine:        { min: 0.45, max: null, maxType: null, unit: "g/100gDM" },
    phenylalanine:             { min: 0.53, max: null, maxType: null, unit: "g/100gDM" },
    phenylalanine_tyrosine:    { min: 2.04, max: null, maxType: null, unit: "g/100gDM" },
    threonine:                 { min: 0.69, max: null, maxType: null, unit: "g/100gDM" },
    tryptophan:                { min: 0.17, max: null, maxType: null, unit: "g/100gDM" },
    valine:                    { min: 0.68, max: null, maxType: null, unit: "g/100gDM" },

    // 고양이 전용 필수물질
    taurine: { min: 0.10, max: null, maxType: null, unit: "g/100gDM", note: "건식 기준 0.10%DM. 습식(통조림)은 0.20%DM — 가열처리로 생체이용률 저하" },
    choline: { min: 240.00, max: null, maxType: null, unit: "mg/100gDM" },

    // 다량 무기질
    calcium:    { min: 0.53, max: 1.00,  maxType: "nutritional", unit: "g/100gDM" },
    phosphorus: { min: 0.35, max: 0.84,  maxType: "nutritional", unit: "g/100gDM", note: "각주 f: 고생체이용률 무기인 과다섭취 시 신장기능 영향 가능성" },
    ca_p_ratio: { min: 1.0,  max: 2.0,   maxType: "nutritional", unit: "g/100gDM", note: "Ca:P 비율, 성묘 최대 2/1(N)" },
    potassium:  { min: 0.80, max: null,  maxType: null, unit: "g/100gDM" },
    sodium:     { min: 0.10, max: 0.16,  maxType: null, unit: "g/100gDM", note: "각주 e: 나트륨 1.5%DM까지는 건강한 성묘에서 안전 범위로 보고됨" },
    chloride:   { min: 0.15, max: null,  maxType: null, unit: "g/100gDM" },
    magnesium:  { min: 0.05, max: null,  maxType: null, unit: "g/100gDM" },

    // 미량 무기질
    copper:     { min: 0.67,  max: 2.80,  maxType: "legal", unit: "mg/100gDM" },
    iodine:     { min: 0.17,  max: 1.10,  maxType: "legal", unit: "mg/100gDM" },
    iron:       { min: 10.70, max: 68.18, maxType: "legal", unit: "mg/100gDM" },
    manganese:  { min: 0.67,  max: 17.00, maxType: "legal", unit: "mg/100gDM" },
    selenium:   { min: 28.00, max: 56.80, maxType: "legal", unit: "ug/100gDM", note: "건식 기준. 습식은 35.00 µg/100gDM" },
    zinc:       { min: 10.00, max: 22.70, maxType: "legal", unit: "mg/100gDM" },

    // 지용성 비타민
    vitamin_a: { min: 444.00, max: 40000.00, maxType: "nutritional", unit: "IU/100gDM" },
    vitamin_d: { min: 33.30,  max: 227.00,   maxType: "legal",       unit: "IU/100gDM", note: "영양학적 최대치는 3000 IU/100gDM(N)" },
    vitamin_e: { min: 5.07,   max: null,     maxType: null,          unit: "IU/100gDM" },
    vitamin_k: { min: null,   max: null,     maxType: null,          unit: "ug/100gDM", note: "통상 보충 불필요. 단, 생선 위주 습식사료는 보충 권고 (각주 참고)" },

    // 수용성 비타민 — 고양이는 비오틴(B7) 수치 존재 (개와 차이점)
    vitamin_b1:  { min: 0.59,   max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b2:  { min: 0.42,   max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b3:  { min: 4.21,   max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b5:  { min: 0.77,   max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b6:  { min: 0.33,   max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b7:  { min: 8.00,   max: null, maxType: null, unit: "ug/100gDM", note: "고양이는 수치 존재 (개 기준표엔 미설정)" },
    vitamin_b9:  { min: 101.00, max: null, maxType: null, unit: "ug/100gDM" },
    vitamin_b12: { min: 2.35,   max: null, maxType: null, unit: "ug/100gDM" },
  }
};

// ────────────────────────────────────────────────────────────
// Growth (성장기, 자묘)
// ────────────────────────────────────────────────────────────
const catGrowth: CatLifeStageStandard = {
  species: "cat",
  lifeStage: "growth",
  merAssumption: "100 kcal/kgBW^0.67 (성장기 가정)",
  source: "FEDIAF Nutritional Guidelines 2024, Table III-4a",
  nutrients: {
    crude_protein: { min: 28.00, max: null, maxType: null, unit: "g/100gDM" },
    crude_fat:     { min: 9.00,  max: null, maxType: null, unit: "g/100gDM" },

    linoleic_acid:        { min: 0.55, max: null, maxType: null, unit: "g/100gDM" },
    arachidonic_acid:     { min: 20.00, max: null, maxType: null, unit: "mg/100gDM" },
    alpha_linolenic_acid: { min: 0.02, max: null, maxType: null, unit: "g/100gDM" },
    epa_dha:              { min: 0.01, max: null, maxType: null, unit: "g/100gDM" },

    arginine:                { min: 1.07, max: 3.50, maxType: "nutritional", unit: "g/100gDM", note: "성장기 최대치(N), Taylor et al. 1996 근거" },
    histidine:                { min: 0.33, max: null, maxType: null, unit: "g/100gDM" },
    isoleucine:                { min: 0.54, max: null, maxType: null, unit: "g/100gDM" },
    leucine:                   { min: 1.28, max: null, maxType: null, unit: "g/100gDM" },
    lysine:                    { min: 0.85, max: null, maxType: null, unit: "g/100gDM" },
    methionine:                { min: 0.44, max: 1.30, maxType: "nutritional", unit: "g/100gDM", note: "성장기 최대치(N)" },
    methionine_cystine:        { min: 0.88, max: null, maxType: null, unit: "g/100gDM" },
    phenylalanine:             { min: 0.50, max: null, maxType: null, unit: "g/100gDM" },
    phenylalanine_tyrosine:    { min: 1.91, max: null, maxType: null, unit: "g/100gDM" },
    threonine:                 { min: 0.65, max: null, maxType: null, unit: "g/100gDM" },
    tryptophan:                { min: 0.16, max: 1.70, maxType: "nutritional", unit: "g/100gDM", note: "성장기 최대치(N), Herwill 1994 근거" },
    valine:                    { min: 0.64, max: null, maxType: null, unit: "g/100gDM" },

    taurine: { min: 0.10, max: null, maxType: null, unit: "g/100gDM", note: "건식 기준. 습식(통조림)은 0.25%DM" },
    choline: { min: 240.00, max: null, maxType: null, unit: "mg/100gDM" },

    calcium:    { min: 1.00, max: null, maxType: null, unit: "g/100gDM" },
    phosphorus: { min: 0.84, max: null, maxType: null, unit: "g/100gDM" },
    ca_p_ratio: { min: 1.0,  max: 1.5,  maxType: "nutritional", unit: "g/100gDM", note: "성장기 Ca:P 최대 1.5/1(N)" },
    potassium:  { min: 0.60, max: null, maxType: null, unit: "g/100gDM" },
    sodium:     { min: 0.16, max: null, maxType: null, unit: "g/100gDM" },
    chloride:   { min: 0.24, max: null, maxType: null, unit: "g/100gDM" },
    magnesium:  { min: 0.05, max: null, maxType: null, unit: "g/100gDM" },

    copper:     { min: 1.00,  max: 2.80,  maxType: "legal", unit: "mg/100gDM" },
    iodine:     { min: 0.18,  max: 1.10,  maxType: "legal", unit: "mg/100gDM" },
    iron:       { min: 8.00,  max: 68.18, maxType: "legal", unit: "mg/100gDM" },
    manganese:  { min: 1.00,  max: 17.00, maxType: "legal", unit: "mg/100gDM" },
    selenium:   { min: 30.00, max: 56.80, maxType: "legal", unit: "ug/100gDM" },
    zinc:       { min: 7.50,  max: 22.70, maxType: "legal", unit: "mg/100gDM" },

    vitamin_a: { min: 900.00, max: 40000.00, maxType: "nutritional", unit: "IU/100gDM" },
    vitamin_d: { min: 28.00,  max: 227.00,   maxType: "legal",       unit: "IU/100gDM", note: "영양학적 최대치는 3000 IU/100gDM(N)" },
    vitamin_e: { min: 3.80,   max: null,     maxType: null,          unit: "IU/100gDM" },
    vitamin_k: { min: null,   max: null,     maxType: null,          unit: "ug/100gDM" },

    vitamin_b1:  { min: 0.55,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b2:  { min: 0.32,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b3:  { min: 3.20,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b5:  { min: 0.57,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b6:  { min: 0.25,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b7:  { min: 7.00,  max: null, maxType: null, unit: "ug/100gDM" },
    vitamin_b9:  { min: 75.00, max: null, maxType: null, unit: "ug/100gDM" },
    vitamin_b12: { min: 1.80,  max: null, maxType: null, unit: "ug/100gDM" },
  }
};

// ────────────────────────────────────────────────────────────
// Reproduction (번식기, 임신·수유묘)
// ────────────────────────────────────────────────────────────
// 원문에서 growth/reproduction 값이 동일한 항목이 대부분이며,
// 일부(단백질, 아르기닌)만 "성장값/번식값"으로 다르게 표기됨.
// 다른 항목은 growth와 동일한 수치를 그대로 사용.
const catReproduction: CatLifeStageStandard = {
  species: "cat",
  lifeStage: "reproduction",
  merAssumption: "100 kcal/kgBW^0.67 (번식기 가정)",
  source: "FEDIAF Nutritional Guidelines 2024, Table III-4a",
  nutrients: {
    ...catGrowth.nutrients, // 동일 항목은 growth 값 재사용 후 차이나는 항목만 override
    crude_protein: { min: 30.00, max: null, maxType: null, unit: "g/100gDM", note: "성장기(28.00)보다 높은 번식기 전용 수치" },
    arginine:      { min: 1.11, max: 3.50, maxType: "nutritional", unit: "g/100gDM", note: "성장기(1.07)보다 높은 번식기 전용 수치" },
  }
};

export const catLifeStageStandards: CatLifeStageStandard[] = [
  catAdultMaintenance,
  catGrowth,
  catReproduction,
];

// ────────────────────────────────────────────────────────────
// 공통 각주 (FEDIAF Table III-4c 하단 footnotes, 고양이 관련 항목만)
// ────────────────────────────────────────────────────────────
export const catStandardFootnotes: Record<string, string> = {
  d: "유기 셀레늄의 경우 최대 보충 수준은 22.73 µg organic Se/100g DM",
  e: "나트륨 1.5%DM (3.75g/1000kcal ME)까지는 건강한 성묘에서 안전한 것으로 보고됨 (더 높은 수치의 안전성 데이터는 없음)",
  f: "고생체이용률 무기인 화합물(예: 인산이수소나트륨)을 1.5g/1000kcal ME 이상 섭취 시 신장기능 지표에 영향 가능. " +
     "1g Pi/1000kcal ME 수준은 건강한 성묘에서 30주~5년 장기연구에서 이상반응 없이 안전하게 사용된 사례 있음. " +
     "인 공급원과 영양소 상호작용에 대한 추가 연구 필요",
  g: "미네랄의 생체이용률은 권장량에 근접한 농도로 설계된 사료에서 특히 신중히 고려해야 함. " +
     "예: 고섬유사료, 피틴산이 풍부한 식물성 원료를 인의 주공급원으로 사용하는 경우",
};