// conversion/macroCalculations.ts
//
// 사료/간식 라벨(보장성분표)에서 얻은 as-fed(원물 기준) 값을
// %DM(건물 기준)으로 환산하고, 칼로리 기준 매크로(단백질/지방/탄수화물)
// 비율을 계산하는 핵심 함수 모음.
//
// 참고 표준:
// - FEDIAF Nutritional Guidelines 2024 (영양소 기준은 %DM 기준)
// - AAFCO 변형 Atwater 계수 (펫푸드 라벨링 표준 칼로리 환산 계수)
//
// 이 파일이 다루는 범위 (의도적으로 한정함):
// - 조단백질, 조지방, 조섬유, 조회분, 수분 → 라벨에 실제로 존재하는 항목만
// - 탄수화물(NFE)은 "추정치"이며 실측값이 아님 — 모든 관련 결과에 추정 표시 필수
// - 개별 아미노산/비타민/미량무기질은 다루지 않음 (라벨에 보통 없음)

// ────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────

/** 라벨(보장성분표)에서 그대로 읽어온 as-fed 기준 원시 데이터 */
export interface AsFedLabelData {
  crudeProteinPct: number;       // 조단백질 (%, as-fed)
  crudeFatPct: number;           // 조지방 (%, as-fed)
  crudeFiberPct: number;         // 조섬유 (%, as-fed)
  moisturePct: number;           // 수분 (%, as-fed)
  crudeAshPct?: number;          // 조회분 (%, as-fed) — 라벨에 없는 경우가 많아 optional
  kcalPerKg?: number;            // 라벨에 칼로리가 직접 표기된 경우 (선택)
}

/** %DM(건물 기준)으로 환산된 데이터 */
export interface DryMatterBasis {
  crudeProteinPctDM: number;
  crudeFatPctDM: number;
  crudeFiberPctDM: number;
  crudeAshPctDM: number | null;     // 조회분 없으면 null (탄수화물 추정 정확도에 영향)
  estimatedCarbPctDM: number;       // NFE 추정값 — 항상 "추정"임을 표시해야 함
  carbEstimateConfidence: "with_ash" | "without_ash"; // 조회분 유무에 따른 신뢰도 구분
}

/** 칼로리 기준 매크로 비율 결과 */
export interface MacroCalorieRatio {
  proteinKcalPct: number;
  fatKcalPct: number;
  carbKcalPct: number;
  totalKcalPer100gDM: number;        // 계산된 ME 추정치 (100g DM 기준)
  carbEstimateConfidence: "with_ash" | "without_ash";
}

// ────────────────────────────────────────────────────────────
// 변형 Atwater 계수 (AAFCO/FEDIAF 펫푸드 라벨링 표준)
// ────────────────────────────────────────────────────────────
export const MODIFIED_ATWATER_KCAL_PER_G = {
  protein: 3.5,
  fat: 8.5,
  carbohydrate: 3.5,
} as const;

// ────────────────────────────────────────────────────────────
// 1단계: as-fed → %DM 환산
// ────────────────────────────────────────────────────────────
//
// 원리: DM 비율(건물 비율) = as-fed 비율 ÷ (100 - 수분%) × 100
// 즉, 수분을 제거한 "고형분"을 100으로 다시 정규화하는 것.
//
export function convertAsFedToDM(label: AsFedLabelData): DryMatterBasis {
  if (label.moisturePct >= 100 || label.moisturePct < 0) {
    throw new Error(`수분 함량 값이 비정상적입니다: ${label.moisturePct}%. 0~100 사이여야 합니다.`);
  }

  const dryMatterPct = 100 - label.moisturePct; // 건물(고형분) 총량
  if (dryMatterPct <= 0) {
    throw new Error("건물 함량이 0% 이하입니다 — 수분 함량을 다시 확인하세요.");
  }

  const toDM = (asFedValue: number) => (asFedValue / dryMatterPct) * 100;

  const crudeProteinPctDM = toDM(label.crudeProteinPct);
  const crudeFatPctDM = toDM(label.crudeFatPct);
  const crudeFiberPctDM = toDM(label.crudeFiberPct);
  const crudeAshPctDM = label.crudeAshPct !== undefined ? toDM(label.crudeAshPct) : null;

  // 탄수화물(NFE) 추정:
  // 조회분이 있으면: 100 - 단백질 - 지방 - 섬유 - 회분 (더 정확)
  // 조회분이 없으면: 회분을 평균값(약 6%DM, 건식기준 업계 평균 추정)으로 가정하고 보정
  //   → 이 경우 추정 정확도가 낮으므로 confidence를 "without_ash"로 명시
  let estimatedCarbPctDM: number;
  let carbEstimateConfidence: "with_ash" | "without_ash";

  if (crudeAshPctDM !== null) {
    estimatedCarbPctDM = 100 - crudeProteinPctDM - crudeFatPctDM - crudeFiberPctDM - crudeAshPctDM;
    carbEstimateConfidence = "with_ash";
  } else {
    const ASSUMED_AVERAGE_ASH_PCT_DM = 6.0; // 업계 평균 추정값 (실측 아님)
    estimatedCarbPctDM = 100 - crudeProteinPctDM - crudeFatPctDM - crudeFiberPctDM - ASSUMED_AVERAGE_ASH_PCT_DM;
    carbEstimateConfidence = "without_ash";
  }

  // 음수 방지 (라벨 오류나 OCR 오인식으로 합이 100을 초과하는 경우 0으로 클램프)
  estimatedCarbPctDM = Math.max(0, estimatedCarbPctDM);

  return {
    crudeProteinPctDM: round2(crudeProteinPctDM),
    crudeFatPctDM: round2(crudeFatPctDM),
    crudeFiberPctDM: round2(crudeFiberPctDM),
    crudeAshPctDM: crudeAshPctDM !== null ? round2(crudeAshPctDM) : null,
    estimatedCarbPctDM: round2(estimatedCarbPctDM),
    carbEstimateConfidence,
  };
}

// ────────────────────────────────────────────────────────────
// 2단계: ME(대사에너지) 추정 + 칼로리 기준 매크로 비율 계산
// ────────────────────────────────────────────────────────────
//
// 라벨에 kcal/kg이 명시되어 있으면 그 값을 우선 사용하고,
// 없으면 변형 Atwater 계수로 100g DM당 칼로리를 직접 계산.
//
export function calculateMacroCalorieRatio(
  dm: DryMatterBasis,
  label?: AsFedLabelData
): MacroCalorieRatio {
  const proteinKcal = dm.crudeProteinPctDM * MODIFIED_ATWATER_KCAL_PER_G.protein;
  const fatKcal = dm.crudeFatPctDM * MODIFIED_ATWATER_KCAL_PER_G.fat;
  const carbKcal = dm.estimatedCarbPctDM * MODIFIED_ATWATER_KCAL_PER_G.carbohydrate;

  // 라벨에 직접 kcal/kg이 있으면 그 값을 DM 기준으로 환산해서 우선 사용 (더 정확함)
  let totalKcalPer100gDM: number;
  if (label?.kcalPerKg) {
    const dryMatterPct = 100 - label.moisturePct;
    // kcal/kg(as-fed) → kcal/100g(as-fed) → kcal/100g(DM)
    const kcalPer100gAsFed = label.kcalPerKg / 10;
    totalKcalPer100gDM = (kcalPer100gAsFed / dryMatterPct) * 100;
  } else {
    // 라벨에 칼로리 표기가 없으면 Atwater 계수로 직접 합산해서 추정
    totalKcalPer100gDM = proteinKcal + fatKcal + carbKcal;
  }

  if (totalKcalPer100gDM <= 0) {
    throw new Error("총 칼로리 계산값이 0 이하입니다 — 입력값을 확인하세요.");
  }

  return {
    proteinKcalPct: round1((proteinKcal / totalKcalPer100gDM) * 100),
    fatKcalPct: round1((fatKcal / totalKcalPer100gDM) * 100),
    carbKcalPct: round1((carbKcal / totalKcalPer100gDM) * 100),
    totalKcalPer100gDM: round1(totalKcalPer100gDM),
    carbEstimateConfidence: dm.carbEstimateConfidence,
  };
}

// ────────────────────────────────────────────────────────────
// 통합 함수: 라벨 데이터 한 번에 분석 (위 두 단계를 한 번에 처리)
// ────────────────────────────────────────────────────────────
export interface LabelAnalysisResult {
  dryMatterBasis: DryMatterBasis;
  macroCalorieRatio: MacroCalorieRatio;
  warnings: string[];   // 추정 정확도, 데이터 누락 등에 대한 경고 메시지
}

export function analyzeLabelMacros(label: AsFedLabelData): LabelAnalysisResult {
  const dryMatterBasis = convertAsFedToDM(label);
  const macroCalorieRatio = calculateMacroCalorieRatio(dryMatterBasis, label);

  const warnings: string[] = [];
  if (dryMatterBasis.carbEstimateConfidence === "without_ash") {
    warnings.push(
      "조회분(crude ash) 정보가 라벨에 없어 업계 평균치(6%DM)로 가정하고 탄수화물을 추정했습니다. " +
      "실제 값과 다소 차이가 있을 수 있습니다."
    );
  }
  warnings.push(
    "탄수화물 함량은 라벨에 직접 표기되지 않으며, 나머지 성분을 뺀 추정치(NFE)입니다. 실측값이 아닙니다."
  );
  if (!label.kcalPerKg) {
    warnings.push(
      "라벨에 칼로리(kcal/kg) 표기가 없어 변형 Atwater 계수로 칼로리를 추정했습니다."
    );
  }

  return { dryMatterBasis, macroCalorieRatio, warnings };
}

// ────────────────────────────────────────────────────────────
// 비교용 헬퍼: FEDIAF 기준(%DM, g/100gDM)과 직접 비교할 수 있도록
// resolveStandard() 결과와 동일한 키 이름으로 묶어서 반환
// ────────────────────────────────────────────────────────────
export interface ComparableNutrientValue {
  nutrientId: "crude_protein" | "crude_fat";
  valuePctDM: number;
}

export function toComparableNutrients(dm: DryMatterBasis): ComparableNutrientValue[] {
  // crude_protein, crude_fat은 core/dogLifeStageStandards.ts, catLifeStageStandards.ts와
  // 동일한 nutrientId를 사용하므로, resolveStandard() 결과와 바로 대조 가능
  return [
    { nutrientId: "crude_protein", valuePctDM: dm.crudeProteinPctDM },
    { nutrientId: "crude_fat", valuePctDM: dm.crudeFatPctDM },
  ];
}

// ────────────────────────────────────────────────────────────
// 내부 유틸
// ────────────────────────────────────────────────────────────
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}