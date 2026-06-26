// comparison/compareLabelToStandard.ts
//
// 라벨에서 추출한 영양소 값(%DM)을 resolveStandard()가 반환한 기준값과
// 대조해서 부족(deficient) / 적정(adequate) / 과잉(excessive)을 판정.
//
// 전제: 이 함수는 "라벨에서 실제로 추출 가능한 영양소"만 비교 대상으로 삼음.
// (조단백질, 조지방 등 — 개별 아미노산/비타민/미량무기질은 다루지 않음.
//  이유는 conversation 앞부분에서 합의된 현실적 범위 제한 때문)
//
// 의존 관계:
// - resolver/resolveStandard.ts 의 ResolvedNutrientStandard 와 동일한 구조를 입력으로 받음
// - conversion/macroCalculations.ts 의 DryMatterBasis 결과를 입력으로 받음

export type ComparisonStatus = "deficient" | "adequate" | "excessive" | "not_comparable";

export interface NutrientComparisonResult {
  nutrientId: string;
  nutrientLabel: string;          // 화면 표시용 한글명
  labelValuePctDM: number | null; // 라벨에서 얻은 값 (없으면 null → not_comparable)
  standardMin: number | null;
  standardMax: number | null;
  maxType: "nutritional" | "legal" | null;
  status: ComparisonStatus;
  appliedSource: "general" | "condition_override"; // resolveStandard()에서 그대로 전달
  conditionLabel?: string;        // override가 적용된 경우 어떤 질병 때문인지
  message: string;                // 사람이 읽을 수 있는 한 줄 설명
}

export interface ComparisonReport {
  results: NutrientComparisonResult[];
  summary: {
    deficientCount: number;
    excessiveCount: number;
    adequateCount: number;
    notComparableCount: number;
  };
  overallWarnings: string[];      // 비교 자체의 한계(추정치 사용 등)에 대한 경고
}

// 라벨로 비교 가능한 영양소 화이트리스트와 한글 라벨
// (지금 단계에서는 macroCalculations.ts가 제공하는 두 항목만 — 추후 확장 가능)
const COMPARABLE_NUTRIENT_LABELS: Record<string, string> = {
  crude_protein: "조단백질",
  crude_fat: "조지방",
};

/**
 * 라벨 비교 가능 영양소 1개에 대해 deficient/adequate/excessive 판정
 *
 * 판정 로직:
 * - standardMin이 있고 labelValue < standardMin → deficient
 * - standardMax가 있고 labelValue > standardMax → excessive
 * - 그 사이 → adequate
 * - standardMin, standardMax 둘 다 없으면 → adequate (기준 자체가 없으므로 통과 처리)
 */
function judgeStatus(
  labelValue: number,
  standardMin: number | null,
  standardMax: number | null
): ComparisonStatus {
  if (standardMin !== null && labelValue < standardMin) {
    return "deficient";
  }
  if (standardMax !== null && labelValue > standardMax) {
    return "excessive";
  }
  return "adequate";
}

function buildMessage(
  nutrientLabel: string,
  status: ComparisonStatus,
  labelValue: number | null,
  standardMin: number | null,
  standardMax: number | null,
  maxType: "nutritional" | "legal" | null
): string {
  if (status === "not_comparable") {
    return `${nutrientLabel}: 라벨에서 값을 확인할 수 없어 비교하지 못했습니다.`;
  }

  const valueStr = labelValue !== null ? `${labelValue}%DM` : "-";

  switch (status) {
    case "deficient":
      return `${nutrientLabel}: 현재 ${valueStr}로 권장 최소치(${standardMin}%DM)보다 부족합니다.`;
    case "excessive": {
      const maxTypeLabel = maxType === "legal" ? "법적 최대치" : "영양학적 권장 최대치";
      return `${nutrientLabel}: 현재 ${valueStr}로 ${maxTypeLabel}(${standardMax}%DM)를 초과합니다.`;
    }
    case "adequate":
      return `${nutrientLabel}: 현재 ${valueStr}로 권장 범위 내에 있습니다.`;
    default:
      return `${nutrientLabel}: 판정 불가.`;
  }
}

// ────────────────────────────────────────────────────────────
// 입력 타입: resolver와 macroCalculations 양쪽의 결과를 그대로 받음
// (각 파일을 직접 import하지 않고 구조적 타입(duck typing)으로 받아서
//  두 모듈 간 결합도를 낮춤 — resolver나 macroCalculations의 세부 구현이
//  바뀌어도 이 비교 함수는 영향받지 않음)
// ────────────────────────────────────────────────────────────

export interface StandardNutrientInput {
  nutrientId: string;
  min: number | null;
  max: number | null;
  maxType: "nutritional" | "legal" | null;
  appliedSource: "general" | "condition_override";
  conditionLabel?: string;
}

export interface LabelNutrientInput {
  nutrientId: string;
  valuePctDM: number;
}

export function compareLabelToStandard(
  labelNutrients: LabelNutrientInput[],
  standardNutrients: Record<string, StandardNutrientInput>,
  options?: { isEstimated?: boolean } // 탄수화물처럼 추정치인 경우 표시 (현재는 미사용, 확장 여지)
): ComparisonReport {
  const results: NutrientComparisonResult[] = [];
  const labelMap = new Map(labelNutrients.map(n => [n.nutrientId, n.valuePctDM]));

  // 비교 가능 화이트리스트를 기준으로 순회 (라벨에 있는 것만이 아니라,
  // "원래 비교했어야 하는데 라벨에 없는 경우"도 not_comparable로 명시하기 위함)
  for (const [nutrientId, nutrientLabel] of Object.entries(COMPARABLE_NUTRIENT_LABELS)) {
    const standard = standardNutrients[nutrientId];
    const labelValue = labelMap.get(nutrientId) ?? null;

    if (!standard) {
      // resolveStandard() 결과에 해당 항목이 없는 경우 (이론상 발생하면 안 되지만 안전망)
      results.push({
        nutrientId,
        nutrientLabel,
        labelValuePctDM: labelValue,
        standardMin: null,
        standardMax: null,
        maxType: null,
        status: "not_comparable",
        appliedSource: "general",
        message: `${nutrientLabel}: 기준 데이터가 없어 비교할 수 없습니다.`,
      });
      continue;
    }

    if (labelValue === null) {
      results.push({
        nutrientId,
        nutrientLabel,
        labelValuePctDM: null,
        standardMin: standard.min,
        standardMax: standard.max,
        maxType: standard.maxType,
        status: "not_comparable",
        appliedSource: standard.appliedSource,
        conditionLabel: standard.conditionLabel,
        message: buildMessage(nutrientLabel, "not_comparable", null, standard.min, standard.max, standard.maxType),
      });
      continue;
    }

    const status = judgeStatus(labelValue, standard.min, standard.max);
    results.push({
      nutrientId,
      nutrientLabel,
      labelValuePctDM: labelValue,
      standardMin: standard.min,
      standardMax: standard.max,
      maxType: standard.maxType,
      status,
      appliedSource: standard.appliedSource,
      conditionLabel: standard.conditionLabel,
      message: buildMessage(nutrientLabel, status, labelValue, standard.min, standard.max, standard.maxType),
    });
  }

  const summary = {
    deficientCount: results.filter(r => r.status === "deficient").length,
    excessiveCount: results.filter(r => r.status === "excessive").length,
    adequateCount: results.filter(r => r.status === "adequate").length,
    notComparableCount: results.filter(r => r.status === "not_comparable").length,
  };

  const overallWarnings: string[] = [
    "현재 비교는 조단백질, 조지방만 정밀 비교합니다. 개별 아미노산·비타민·미량무기질은 " +
    "일반 사료 라벨에 수치가 공개되지 않아 비교 대상에서 제외되었습니다.",
  ];
  if (options?.isEstimated) {
    overallWarnings.push("일부 값은 추정치를 기반으로 계산되었습니다.");
  }

  return { results, summary, overallWarnings };
}

// ────────────────────────────────────────────────────────────
// 보조 함수: 여러 항목(사료+간식+영양제)을 합산한 후 비교하고 싶을 때
// 칼로리 가중평균으로 %DM을 합산하는 헬퍼
// ────────────────────────────────────────────────────────────
export interface FeedingItemContribution {
  itemName: string;               // "메인사료", "닭가슴살 간식" 등
  nutrientId: string;
  valuePctDM: number;
  kcalContributedPerDay: number;  // 이 항목이 하루 칼로리에서 차지하는 양 (가중치로 사용)
}

/**
 * 여러 항목(사료+간식+영양제)의 동일 영양소를 "칼로리 가중평균"으로 합산.
 * 단순 산술평균이 아니라 칼로리 비중으로 가중하는 이유:
 * 하루 칼로리의 90%를 차지하는 메인사료와 5%인 간식의 영양소 농도를
 * 동일 비중으로 평균내면 실제 섭취 영양 상태를 왜곡하게 됨.
 */
export function aggregateWeightedNutrient(
  contributions: FeedingItemContribution[],
  nutrientId: string
): number | null {
  const relevant = contributions.filter(c => c.nutrientId === nutrientId);
  if (relevant.length === 0) return null;

  const totalKcal = relevant.reduce((sum, c) => sum + c.kcalContributedPerDay, 0);
  if (totalKcal <= 0) return null;

  const weightedSum = relevant.reduce(
    (sum, c) => sum + c.valuePctDM * (c.kcalContributedPerDay / totalKcal),
    0
  );

  return Math.round(weightedSum * 100) / 100;
}