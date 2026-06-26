// core/dogLifeStageStandards.ts
//
// 출처: FEDIAF Nutritional Guidelines for Complete and Complementary
//       Pet Food for Cats and Dogs, Publication July 2024
//       Table III-3a (Unit per 100 g dry matter, DM)
//
// 주의:
// - FEDIAF는 규제기관이 아니며 본 가이드라인은 법적 구속력이 없음 (자율 규제 산업표준)
// - 여기 수치는 "최소권장수준(minimum recommended level)"이며
//   "최소요구량(minimum requirement)"이나 "최적섭취량(optimal intake)"이 아님
// - Adult 기준은 MER 95 kcal/kgBW^0.75 가정값 사용 (FEDIAF가 제시하는 2가지 중 보존적 값)
//   * 110 kcal/kgBW^0.75 기준 컬럼은 향후 필요시 별도 추가 가능
// - 단위는 모두 100g DM(건물) 기준으로 통일
// - "-"로 표기된 항목(수치 없음)은 null로 처리
// - (N) = nutritional maximum, (L) = EU legal maximum  → maxType 필드로 구분

export type NutrientUnit =
  | "g/100gDM"
  | "mg/100gDM"
  | "ug/100gDM"
  | "IU/100gDM";

export type MaxType = "nutritional" | "legal" | null;

export interface NutrientRange {
  min: number | null;
  max: number | null;
  maxType: MaxType;
  unit: NutrientUnit;
  note?: string;        // 각주(a-h) 또는 보충 설명
}

export type DogLifeStage =
  | "early_growth_and_reproduction"  // 이른 성장기(<14주) & 번식기
  | "late_growth"                    // 늦은 성장기(>=14주)
  | "adult_maintenance";             // 성견 유지기

export interface LifeStageStandard {
  species: "dog";
  lifeStage: DogLifeStage;
  merAssumption: string;             // 이 표가 가정하는 일일 에너지 요구량 전제
  source: string;
  nutrients: Record<string, NutrientRange>;
}

// ────────────────────────────────────────────────────────────
// Adult Maintenance (성견 유지기) — MER 95 kcal/kgBW^0.75 기준
// ────────────────────────────────────────────────────────────
const dogAdultMaintenance: LifeStageStandard = {
  species: "dog",
  lifeStage: "adult_maintenance",
  merAssumption: "95 kcal/kgBW^0.75",
  source: "FEDIAF Nutritional Guidelines 2024, Table III-3a",
  nutrients: {
    // 주요 영양소
    crude_protein: { min: 21.00, max: null, maxType: null, unit: "g/100gDM" },
    crude_fat:     { min: 5.50,  max: null, maxType: null, unit: "g/100gDM" },

    // 필수 지방산
    linoleic_acid:        { min: 1.53, max: null, maxType: null, unit: "g/100gDM" },
    alpha_linolenic_acid: { min: null, max: null, maxType: null, unit: "g/100gDM", note: "성견 유지기는 권장 미설정" },
    epa_dha:              { min: null, max: null, maxType: null, unit: "g/100gDM", note: "성견 유지기는 권장 미설정" },

    // 필수 아미노산
    arginine:                { min: 0.60, max: null, maxType: null, unit: "g/100gDM" },
    histidine:                { min: 0.27, max: null, maxType: null, unit: "g/100gDM" },
    isoleucine:                { min: 0.53, max: null, maxType: null, unit: "g/100gDM" },
    leucine:                   { min: 0.95, max: null, maxType: null, unit: "g/100gDM" },
    lysine:                    { min: 0.46, max: null, maxType: null, unit: "g/100gDM" },
    methionine:                { min: 0.46, max: null, maxType: null, unit: "g/100gDM" },
    methionine_cystine:        { min: 0.88, max: null, maxType: null, unit: "g/100gDM" },
    phenylalanine:             { min: 0.63, max: null, maxType: null, unit: "g/100gDM" },
    phenylalanine_tyrosine:    { min: 1.03, max: null, maxType: null, unit: "g/100gDM" },
    threonine:                 { min: 0.60, max: null, maxType: null, unit: "g/100gDM" },
    tryptophan:                { min: 0.20, max: null, maxType: null, unit: "g/100gDM" },
    valine:                    { min: 0.68, max: null, maxType: null, unit: "g/100gDM" },

    // 비타민 유사물질
    choline: { min: 189.00, max: null, maxType: null, unit: "mg/100gDM" },

    // 다량 무기질
    calcium:    { min: 0.58, max: 2.50, maxType: "nutritional", unit: "g/100gDM" },
    phosphorus: { min: 0.46, max: 1.60, maxType: "nutritional", unit: "g/100gDM", note: "각주 h: 무기인 과다섭취 주의" },
    ca_p_ratio: { min: 1.0,  max: 2.0,  maxType: "nutritional", unit: "g/100gDM", note: "Ca:P 비율, 1/1 ~ 2/1(N)" },
    potassium:  { min: 0.58, max: null, maxType: null, unit: "g/100gDM" },
    sodium:     { min: 0.12, max: null, maxType: null, unit: "g/100gDM", note: "각주 c: 1.5%DM까지는 안전 범위로 보고됨" },
    chloride:   { min: 0.17, max: null, maxType: null, unit: "g/100gDM", note: "각주 c: 2.35%DM까지는 안전 범위로 보고됨" },
    magnesium:  { min: 0.08, max: null, maxType: null, unit: "g/100gDM" },

    // 미량 무기질
    copper:     { min: 0.83, max: 2.80,  maxType: "legal", unit: "mg/100gDM" },
    iodine:     { min: 0.12, max: 1.10,  maxType: "legal", unit: "mg/100gDM" },
    iron:       { min: 4.17, max: 68.18, maxType: "legal", unit: "mg/100gDM" },
    manganese:  { min: 0.67, max: 17.00, maxType: "legal", unit: "mg/100gDM" },
    selenium:   { min: 22.00, max: 56.80, maxType: "legal", unit: "ug/100gDM", note: "건식 기준. 습식은 27.00 µg/100gDM" },
    zinc:       { min: 8.34, max: 22.70, maxType: "legal", unit: "mg/100gDM" },

    // 지용성 비타민
    vitamin_a: { min: 702.00, max: 40000.00, maxType: "nutritional", unit: "IU/100gDM" },
    vitamin_d: { min: 63.90,  max: 227.00,   maxType: "legal",       unit: "IU/100gDM", note: "영양학적 최대치는 320 IU/100gDM(N)" },
    vitamin_e: { min: 4.17,   max: null,     maxType: null,          unit: "IU/100gDM" },
    vitamin_k: { min: null,   max: null,     maxType: null,          unit: "ug/100gDM", note: "통상 보충 불필요" },

    // 수용성 비타민
    vitamin_b1:  { min: 0.25,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b2:  { min: 0.69,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b3:  { min: 1.89,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b5:  { min: 1.64,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b6:  { min: 0.17,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b9:  { min: 29.90, max: null, maxType: null, unit: "ug/100gDM" },
    vitamin_b12: { min: 3.87,  max: null, maxType: null, unit: "ug/100gDM" },
    // vitamin_b7 (비오틴): FEDIAF 개 기준표엔 수치 없음(-) → dictionary에서도 appliesTo: ["cat"]로 처리, 여기 생략
  }
};

// ────────────────────────────────────────────────────────────
// Early Growth (<14주) & Reproduction (이른 성장기 & 번식기)
// ────────────────────────────────────────────────────────────
const dogEarlyGrowthAndReproduction: LifeStageStandard = {
  species: "dog",
  lifeStage: "early_growth_and_reproduction",
  merAssumption: "성장기/번식기 별도 가정 (FEDIAF ANNEX 7.2 참조)",
  source: "FEDIAF Nutritional Guidelines 2024, Table III-3a",
  nutrients: {
    crude_protein: { min: 25.00, max: null, maxType: null, unit: "g/100gDM" },
    crude_fat:     { min: 8.50,  max: null, maxType: null, unit: "g/100gDM" },

    linoleic_acid:        { min: 1.30, max: 6.50, maxType: "nutritional", unit: "g/100gDM", note: "이른 성장기 최대치(N) 적용" },
    arachidonic_acid:     { min: 30.00, max: null, maxType: null, unit: "mg/100gDM", note: "고양이 전용 — 개는 dictionary상 비활성" },
    alpha_linolenic_acid: { min: 0.08, max: null, maxType: null, unit: "g/100gDM" },
    epa_dha:              { min: 0.05, max: null, maxType: null, unit: "g/100gDM" },

    arginine:                { min: 0.82, max: null, maxType: null, unit: "g/100gDM" },
    histidine:                { min: 0.39, max: null, maxType: null, unit: "g/100gDM" },
    isoleucine:                { min: 0.65, max: null, maxType: null, unit: "g/100gDM" },
    leucine:                   { min: 1.29, max: null, maxType: null, unit: "g/100gDM" },
    lysine:                    { min: 0.88, max: 2.80, maxType: "nutritional", unit: "g/100gDM", note: "성장기 최대치(N), Czarnecki et al. 1985 근거" },
    methionine:                { min: 0.35, max: null, maxType: null, unit: "g/100gDM" },
    methionine_cystine:        { min: 0.70, max: null, maxType: null, unit: "g/100gDM" },
    phenylalanine:             { min: 0.65, max: null, maxType: null, unit: "g/100gDM" },
    phenylalanine_tyrosine:    { min: 1.30, max: null, maxType: null, unit: "g/100gDM" },
    threonine:                 { min: 0.81, max: null, maxType: null, unit: "g/100gDM" },
    tryptophan:                { min: 0.23, max: null, maxType: null, unit: "g/100gDM" },
    valine:                    { min: 0.68, max: null, maxType: null, unit: "g/100gDM" },

    choline: { min: 170.00, max: null, maxType: null, unit: "mg/100gDM" },

    calcium:    { min: 1.00, max: 1.60, maxType: "nutritional", unit: "g/100gDM", note: "이른 성장기 최대치(N)" },
    phosphorus: { min: 0.90, max: null, maxType: null, unit: "g/100gDM" },
    ca_p_ratio: { min: 1.0,  max: 1.6,  maxType: "nutritional", unit: "g/100gDM", note: "이른 성장기/번식기 Ca:P 최대 1.6/1(N)" },
    potassium:  { min: 0.44, max: null, maxType: null, unit: "g/100gDM" },
    sodium:     { min: 0.22, max: null, maxType: null, unit: "g/100gDM" },
    chloride:   { min: 0.33, max: null, maxType: null, unit: "g/100gDM" },
    magnesium:  { min: 0.04, max: null, maxType: null, unit: "g/100gDM" },

    copper:     { min: 1.10, max: 2.80,  maxType: "legal", unit: "mg/100gDM" },
    iodine:     { min: 0.15, max: 1.10,  maxType: "legal", unit: "mg/100gDM" },
    iron:       { min: 8.80, max: 68.18, maxType: "legal", unit: "mg/100gDM" },
    manganese:  { min: 0.56, max: 17.00, maxType: "legal", unit: "mg/100gDM" },
    selenium:   { min: 40.00, max: 56.80, maxType: "legal", unit: "ug/100gDM", note: "건식/습식 동일 (40.00)" },
    zinc:       { min: 10.00, max: 22.70, maxType: "legal", unit: "mg/100gDM" },

    vitamin_a: { min: 500.00, max: 40000.00, maxType: "nutritional", unit: "IU/100gDM" },
    vitamin_d: { min: 55.20,  max: 227.00,   maxType: "legal",       unit: "IU/100gDM", note: "영양학적 최대치는 320 IU/100gDM(N)" },
    vitamin_e: { min: 5.00,   max: null,     maxType: null,          unit: "IU/100gDM" },
    vitamin_k: { min: null,   max: null,     maxType: null,          unit: "ug/100gDM" },

    vitamin_b1:  { min: 0.18,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b2:  { min: 0.42,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b3:  { min: 1.36,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b5:  { min: 1.20,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b6:  { min: 0.12,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b9:  { min: 21.60, max: null, maxType: null, unit: "ug/100gDM" },
    vitamin_b12: { min: 2.80,  max: null, maxType: null, unit: "ug/100gDM" },
  }
};

// ────────────────────────────────────────────────────────────
// Late Growth (>=14주, 늦은 성장기)
// ────────────────────────────────────────────────────────────
const dogLateGrowth: LifeStageStandard = {
  species: "dog",
  lifeStage: "late_growth",
  merAssumption: "110 kcal/kgBW^0.75 (FEDIAF 후기성장 가정)",
  source: "FEDIAF Nutritional Guidelines 2024, Table III-3a",
  nutrients: {
    crude_protein: { min: 20.00, max: null, maxType: null, unit: "g/100gDM" },
    crude_fat:     { min: 8.50,  max: null, maxType: null, unit: "g/100gDM" },

    linoleic_acid:        { min: 1.30, max: null, maxType: null, unit: "g/100gDM" },
    arachidonic_acid:     { min: 30.00, max: null, maxType: null, unit: "mg/100gDM", note: "고양이 전용 — 개는 dictionary상 비활성" },
    alpha_linolenic_acid: { min: 0.08, max: null, maxType: null, unit: "g/100gDM" },
    epa_dha:              { min: 0.05, max: null, maxType: null, unit: "g/100gDM" },

    arginine:                { min: 0.74, max: null, maxType: null, unit: "g/100gDM" },
    histidine:                { min: 0.25, max: null, maxType: null, unit: "g/100gDM" },
    isoleucine:                { min: 0.50, max: null, maxType: null, unit: "g/100gDM" },
    leucine:                   { min: 0.80, max: null, maxType: null, unit: "g/100gDM" },
    lysine:                    { min: 0.70, max: 2.80, maxType: "nutritional", unit: "g/100gDM", note: "성장기 최대치(N) 공통 적용" },
    methionine:                { min: 0.26, max: null, maxType: null, unit: "g/100gDM" },
    methionine_cystine:        { min: 0.53, max: null, maxType: null, unit: "g/100gDM" },
    phenylalanine:             { min: 0.50, max: null, maxType: null, unit: "g/100gDM" },
    phenylalanine_tyrosine:    { min: 1.00, max: null, maxType: null, unit: "g/100gDM" },
    threonine:                 { min: 0.64, max: null, maxType: null, unit: "g/100gDM" },
    tryptophan:                { min: 0.21, max: null, maxType: null, unit: "g/100gDM" },
    valine:                    { min: 0.56, max: null, maxType: null, unit: "g/100gDM" },

    choline: { min: 170.00, max: null, maxType: null, unit: "mg/100gDM" },

    // 칼슘은 체구별로 다름(각주 a, b) — 아래 dogLateGrowthCalciumNote 참고
    calcium:    { min: 0.80, max: 1.80, maxType: "nutritional", unit: "g/100gDM",
                  note: "각주 a/b: 성견체중 15kg 이하 소형견은 0.8%DM, 15kg 초과 대형견은 생후 6개월까지 1.0%DM 유지 후 0.8%DM으로 감량 가능. 최대치는 소형 1.8%DM(N), 대형 1.6%DM(N)" },
    phosphorus: { min: 0.70, max: null, maxType: null, unit: "g/100gDM" },
    ca_p_ratio: { min: 1.0,  max: 1.8,  maxType: "nutritional", unit: "g/100gDM", note: "소형견 1.8/1(N) 또는 대형견 1.6/1(N)" },
    potassium:  { min: 0.44, max: null, maxType: null, unit: "g/100gDM" },
    sodium:     { min: 0.22, max: null, maxType: null, unit: "g/100gDM" },
    chloride:   { min: 0.33, max: null, maxType: null, unit: "g/100gDM" },
    magnesium:  { min: 0.04, max: null, maxType: null, unit: "g/100gDM" },

    copper:     { min: 1.10, max: 2.80,  maxType: "legal", unit: "mg/100gDM" },
    iodine:     { min: 0.15, max: 1.10,  maxType: "legal", unit: "mg/100gDM" },
    iron:       { min: 8.80, max: 68.18, maxType: "legal", unit: "mg/100gDM" },
    manganese:  { min: 0.56, max: 17.00, maxType: "legal", unit: "mg/100gDM" },
    selenium:   { min: 40.00, max: 56.80, maxType: "legal", unit: "ug/100gDM" },
    zinc:       { min: 10.00, max: 22.70, maxType: "legal", unit: "mg/100gDM" },

    vitamin_a: { min: 500.00, max: 40000.00, maxType: "nutritional", unit: "IU/100gDM" },
    vitamin_d: { min: 50.00,  max: 227.00,   maxType: "legal",       unit: "IU/100gDM", note: "영양학적 최대치: 소형견 425 IU/100gDM(N), 대형/거대종 320 IU/100gDM(N)" },
    vitamin_e: { min: 5.00,   max: null,     maxType: null,          unit: "IU/100gDM" },
    vitamin_k: { min: null,   max: null,     maxType: null,          unit: "ug/100gDM" },

    vitamin_b1:  { min: 0.18,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b2:  { min: 0.42,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b3:  { min: 1.36,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b5:  { min: 1.20,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b6:  { min: 0.12,  max: null, maxType: null, unit: "mg/100gDM" },
    vitamin_b9:  { min: 21.60, max: null, maxType: null, unit: "ug/100gDM" },
    vitamin_b12: { min: 2.80,  max: null, maxType: null, unit: "ug/100gDM" },
  }
};

export const dogLifeStageStandards: LifeStageStandard[] = [
  dogAdultMaintenance,
  dogEarlyGrowthAndReproduction,
  dogLateGrowth,
];

// ────────────────────────────────────────────────────────────
// 공통 각주 (FEDIAF Table III-4c 하단 footnotes a-h)
// ────────────────────────────────────────────────────────────
export const dogStandardFootnotes: Record<string, string> = {
  a: "성견체중 15kg 이하 견종의 경우, 늦은 성장기(14주 이후) 전체 기간 동안 적용",
  b: "성견체중 15kg 초과 견종의 경우, 생후 약 6개월까지 적용. 이후 칼슘 0.8%DM으로 감량 가능, Ca:P 비율 1.8/1까지 증가 가능",
  c: "나트륨 1.5%DM, 염소 2.35%DM까지는 건강한 성견에서 안전한 것으로 보고됨 (더 높은 수치의 안전성 데이터는 없음)",
  d: "유기 셀레늄의 경우 최대 보충 수준은 22.73 µg organic Se/100g DM",
  e: "(고양이 전용, 본 파일에는 미적용)",
  f: "(고양이 전용, 본 파일에는 미적용)",
  g: "(고양이 전용, 본 파일에는 미적용)",
  h: "고생체이용률 무기인 화합물의 과다 섭취는 개의 칼슘-인 항상성에 영향. 신장/골격/심혈관 건강과의 연관성에 대해 추가 연구 필요",
};