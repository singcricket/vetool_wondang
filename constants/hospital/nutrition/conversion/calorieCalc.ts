// conversion/calorieCalc.ts
//
// RER(안정시 에너지 요구량) / DER(일일 에너지 요구량) 계산 함수.
//
// 참고 표준:
// - RER 공식: FEDIAF Nutritional Guidelines 2024, ANNEX 7.2 (Energy)
//   및 NRC 2006 기반 — 업계 표준 공식 70 × (체중kg)^0.75
// - DER 생활계수(activity factor): NRC 2006 / WSAVA 가이드라인에서
//   널리 사용되는 범위를 채택. 질병별 보정(예: 신부전 RER×1.0~1.2)은
//   conditions/ override가 추가되면 그쪽에서 처리 — 이 파일은 "일반" 계수만 다룸
//
// 이 파일이 다루는 범위:
// - RER 계산 (체중 기반, 종 구분 없이 동일 공식)
// - DER 계산 (생활계수 적용)
// - 체중감량/증량 목표를 위한 보정 DER
// - 일일 급여량(g) 환산 (사료 칼로리밀도 기준)

// ────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────

export type ActivityFactorKey =
  | "intact_adult"              // 중성화 안 한 성견/성묘
  | "neutered_adult"             // 중성화한 성견/성묘 (가장 흔한 케이스)
  | "inactive_obese_prone"       // 비활동적/비만 경향
  | "weight_loss"                 // 체중감량 목표
  | "weight_gain"                 // 체중증량 목표 (저체중 회복)
  | "active_working"              // 활동량 많음/작업견
  | "growth_under_4_months"       // 성장기 (4개월 미만)
  | "growth_4_to_12_months"       // 성장기 (4~12개월)
  | "senior";                      // 노령 (대사량 저하 경향)

export interface ActivityFactorDefinition {
  key: ActivityFactorKey;
  label: string;
  factorRange: { min: number; max: number }; // DER = RER × factor
  note: string;
}

// ────────────────────────────────────────────────────────────
// 생활계수 테이블 (DER = RER × factor)
// ────────────────────────────────────────────────────────────
// 출처: NRC 2006 / WSAVA Global Nutrition Guidelines에서 일반적으로 인용되는
// 범위를 정리. 동일 범위를 개·고양이 공통으로 적용 (종 차이가 큰 항목은
// 별도 주석으로 표시)
export const activityFactors: ActivityFactorDefinition[] = [
  {
    key: "intact_adult",
    label: "중성화 안 한 성견/성묘 (유지기)",
    factorRange: { min: 1.8, max: 1.8 },
    note: "성호르몬 영향으로 중성화 동물보다 대사량 약간 높음",
  },
  {
    key: "neutered_adult",
    label: "중성화한 성견/성묘 (유지기)",
    factorRange: { min: 1.6, max: 1.6 },
    note: "가장 흔한 일반 가정견/가정묘 케이스",
  },
  {
    key: "inactive_obese_prone",
    label: "비활동적 또는 비만 경향",
    factorRange: { min: 1.2, max: 1.4 },
    note: "활동량이 매우 적거나 비만 경향이 있는 경우",
  },
  {
    key: "weight_loss",
    label: "체중감량 목표",
    factorRange: { min: 1.0, max: 1.0 },
    note: "RER의 100% — 목표체중이 아닌 '현재체중' 기준 RER에 곱해서 사용해야 함. 급격한 감량은 위험",
  },
  {
    key: "weight_gain",
    label: "체중증량 목표 (저체중 회복)",
    factorRange: { min: 1.2, max: 1.8 },
    note: "목표체중 기준 RER에 곱해서 사용. 점진적 증량 권장",
  },
  {
    key: "active_working",
    label: "활동량 많음 / 작업견",
    factorRange: { min: 2.0, max: 5.0 },
    note: "강도에 따라 편차가 매우 큼 — 가정용 활동견은 통상 2.0대 적용",
  },
  {
    key: "growth_under_4_months",
    label: "성장기 (생후 4개월 미만)",
    factorRange: { min: 3.0, max: 3.0 },
    note: "이른 성장기 — 빠른 체중 증가 반영",
  },
  {
    key: "growth_4_to_12_months",
    label: "성장기 (생후 4~12개월)",
    factorRange: { min: 2.0, max: 2.0 },
    note: "늦은 성장기 — 성장 속도 둔화 반영",
  },
  {
    key: "senior",
    label: "노령",
    factorRange: { min: 1.4, max: 1.6 },
    note: "FEDIAF 시니어 영양 statement 참고 — 대사량 저하 경향이나 개체차 큼, 체중 추세로 보정 권장",
  },
];

export function getActivityFactor(key: ActivityFactorKey): ActivityFactorDefinition {
  const found = activityFactors.find(f => f.key === key);
  if (!found) {
    throw new Error(`알 수 없는 활동계수 key: ${key}`);
  }
  return found;
}

// ────────────────────────────────────────────────────────────
// RER (Resting Energy Requirement, 안정시 에너지 요구량)
// ────────────────────────────────────────────────────────────
//
// 공식: RER(kcal/day) = 70 × (체중kg)^0.75
// 이 공식은 개·고양이 공통이며 2kg~70kg 범위에서 가장 신뢰도가 높음
//
export function calculateRER(bodyWeightKg: number): number {
  if (bodyWeightKg <= 0) {
    throw new Error(`체중 값이 비정상적입니다: ${bodyWeightKg}kg. 0보다 커야 합니다.`);
  }
  if (bodyWeightKg < 1 || bodyWeightKg > 80) {
    // 에러는 아니지만 신뢰구간 밖이라는 점을 호출부에서 경고로 활용할 수 있게 함
    // (이 함수 자체는 계산을 막지 않음 — 판단은 상위 레이어에 위임)
  }
  return round1(70 * Math.pow(bodyWeightKg, 0.75));
}

// ────────────────────────────────────────────────────────────
// DER (Daily Energy Requirement, 일일 에너지 요구량)
// ────────────────────────────────────────────────────────────
export interface DERResult {
  rer: number;
  der: number;
  activityFactorUsed: number;
  activityFactorKey: ActivityFactorKey;
  bodyWeightKgUsed: number;
  warnings: string[];
}

export interface CalculateDERParams {
  bodyWeightKg: number;          // 체중감량/증량 목표 시: "목표체중" 또는 "현재체중" 중 의도에 맞게 입력
  activityFactorKey: ActivityFactorKey;
  customFactor?: number;          // factorRange 대신 특정 계수를 직접 지정하고 싶을 때 (예: 1.5)
}

export function calculateDER(params: CalculateDERParams): DERResult {
  const { bodyWeightKg, activityFactorKey, customFactor } = params;
  const rer = calculateRER(bodyWeightKg);
  const factorDef = getActivityFactor(activityFactorKey);

  const warnings: string[] = [];

  let factorUsed: number;
  if (customFactor !== undefined) {
    factorUsed = customFactor;
    warnings.push(`사용자 지정 계수(${customFactor})를 사용했습니다 — 표준 범위(${factorDef.factorRange.min}~${factorDef.factorRange.max})와 다를 수 있습니다.`);
  } else {
    // 범위의 중간값 사용 (min===max인 경우 그 값 그대로)
    factorUsed = (factorDef.factorRange.min + factorDef.factorRange.max) / 2;
  }

  if (bodyWeightKg < 1 || bodyWeightKg > 80) {
    warnings.push(
      `체중 ${bodyWeightKg}kg은 RER 공식(70×체중^0.75)의 일반적 신뢰구간(1~80kg)을 벗어납니다. ` +
      `초소형/초대형 동물은 추정치 오차가 클 수 있어 수의사 확인을 권장합니다.`
    );
  }

  if (activityFactorKey === "weight_loss") {
    warnings.push(
      "체중감량 목표는 '현재체중' 기준 RER에 계수를 곱해야 합니다 (목표체중 기준이 아님). " +
      "급격한 체중감량(주당 1~2% 초과)은 건강에 해로울 수 있으므로 점진적 접근을 권장합니다."
    );
  }
  if (activityFactorKey === "weight_gain") {
    warnings.push("체중증량 목표는 '목표체중' 기준 RER에 계수를 곱해야 합니다 (현재체중 기준이 아님).");
  }

  const der = round1(rer * factorUsed);

  return {
    rer,
    der,
    activityFactorUsed: factorUsed,
    activityFactorKey,
    bodyWeightKgUsed: bodyWeightKg,
    warnings,
  };
}

// ────────────────────────────────────────────────────────────
// 일일 급여량(g) 계산 — DER을 실제 사료 무게로 환산
// ────────────────────────────────────────────────────────────
export interface DailyFeedingAmountResult {
  totalGramsPerDay: number;
  gramsPerMeal: number;          // mealsPerDay로 나눈 값
  derUsed: number;
  foodKcalPerGramUsed: number;
}

export interface CalculateDailyFeedingAmountParams {
  der: number;                    // calculateDER() 결과의 der 값
  foodKcalPerKg: number;          // 사료 라벨의 kcal/kg (as-fed 기준 — 사료는 보통 이 단위로 표기됨)
  mealsPerDay?: number;           // 하루 급여 횟수 (기본 2회)
}

export function calculateDailyFeedingAmount(
  params: CalculateDailyFeedingAmountParams
): DailyFeedingAmountResult {
  const { der, foodKcalPerKg, mealsPerDay = 2 } = params;

  if (foodKcalPerKg <= 0) {
    throw new Error(`사료 칼로리밀도 값이 비정상적입니다: ${foodKcalPerKg} kcal/kg`);
  }
  if (mealsPerDay <= 0) {
    throw new Error(`하루 급여 횟수가 비정상적입니다: ${mealsPerDay}`);
  }

  const foodKcalPerGram = foodKcalPerKg / 1000;
  const totalGramsPerDay = der / foodKcalPerGram;

  return {
    totalGramsPerDay: round1(totalGramsPerDay),
    gramsPerMeal: round1(totalGramsPerDay / mealsPerDay),
    derUsed: der,
    foodKcalPerGramUsed: round2(foodKcalPerGram),
  };
}

// ────────────────────────────────────────────────────────────
// 통합 함수: 체중 + 활동계수 + 사료 칼로리밀도 → 하루 급여량까지 한 번에
// ────────────────────────────────────────────────────────────
export interface FullFeedingPlanParams {
  bodyWeightKg: number;
  activityFactorKey: ActivityFactorKey;
  foodKcalPerKg: number;
  mealsPerDay?: number;
  customFactor?: number;
}

export interface FullFeedingPlanResult {
  der: DERResult;
  feeding: DailyFeedingAmountResult;
}

export function calculateFullFeedingPlan(params: FullFeedingPlanParams): FullFeedingPlanResult {
  const derResult = calculateDER({
    bodyWeightKg: params.bodyWeightKg,
    activityFactorKey: params.activityFactorKey,
    customFactor: params.customFactor,
  });

  const feeding = calculateDailyFeedingAmount({
    der: derResult.der,
    foodKcalPerKg: params.foodKcalPerKg,
    mealsPerDay: params.mealsPerDay,
  });

  return { der: derResult, feeding };
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