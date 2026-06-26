// ingredients/homemadeFeedingItem.ts
//
// 홈메이드 식재료 1회 급여분을 계산하는 통합 함수.
// 흐름: 독성 체크(최우선) → DB 조회 → 기존 convertAsFedToDM/analyzeLabelMacros 재사용
//
// 이 파일이 보장하는 안전 원칙:
// "독성 재료가 검색되면, 영양 계산 결과를 절대 반환하지 않고 경고만 반환한다."
// 영양 계산이 위험 경고보다 먼저 보이거나 함께 보이면 안 됨 — 위험 경고 단독 응답이어야 함.

import { checkIngredientToxicity, buildToxicityWarningMessage, ToxicIngredient } from "./toxicIngredients";
import { searchIngredients, getIngredientById, RawIngredient } from "./rawIngredientDictionary";
import { analyzeLabelMacros, AsFedLabelData, LabelAnalysisResult } from "../conversion/macroCalculations";

// ────────────────────────────────────────────────────────────
// 결과 타입: 두 갈래로 명확히 분리
// (영양 계산 결과와 독성 경고가 같은 응답에 함께 담기지 않도록 타입 자체로 강제)
// ────────────────────────────────────────────────────────────

export interface ToxicityBlockedResult {
  blocked: true;
  warningMessage: string;
  matchedToxicIngredient: ToxicIngredient;
}

export interface HomemadeFeedingCalculationResult {
  blocked: false;
  ingredient: RawIngredient;
  gramsGiven: number;
  kcalContributed: number;
  analysis: LabelAnalysisResult;
}

export type HomemadeFeedingItemResult = ToxicityBlockedResult | HomemadeFeedingCalculationResult;

// ────────────────────────────────────────────────────────────
// 메인 함수: 검색어 + 무게 → 독성체크 우선 → 안전하면 영양계산
// ────────────────────────────────────────────────────────────
export function calculateHomemadeFeedingItem(
  searchTermOrId: string,
  gramsGiven: number,
  species: "dog" | "cat"
): HomemadeFeedingItemResult {

  // 1단계: 독성 체크 — 반드시 영양 계산보다 먼저 수행
  const toxicityCheck = checkIngredientToxicity(searchTermOrId);
  if (toxicityCheck.isMatch && toxicityCheck.matchedIngredient) {
    const warningMessage = buildToxicityWarningMessage(toxicityCheck.matchedIngredient, species);
    // 해당 종에 영향 없는 경우(예: 자일리톨+고양이)는 null이 반환되므로 통과
    if (warningMessage !== null) {
      return {
        blocked: true,
        warningMessage,
        matchedToxicIngredient: toxicityCheck.matchedIngredient,
      };
    }
  }

  // 2단계: 정상 식재료 DB에서 조회 (ID로 직접 조회 우선, 안되면 검색)
  let ingredient = getIngredientById(searchTermOrId);
  if (!ingredient) {
    const searchResults = searchIngredients(searchTermOrId);
    ingredient = searchResults[0]; // 가장 첫 매칭 결과 사용 (실제 UI에서는 검색결과 전체를 보여주고 사용자가 선택해야 함)
  }

  if (!ingredient) {
    throw new Error(
      `"${searchTermOrId}"에 해당하는 식재료를 찾을 수 없습니다. ` +
      `DB에 없는 재료는 직접 추가하거나, 일반적인 영양 정보를 참고해 수동 입력해야 합니다.`
    );
  }

  if (gramsGiven <= 0) {
    throw new Error(`급여량이 비정상적입니다: ${gramsGiven}g. 0보다 커야 합니다.`);
  }

  // 3단계: 기존 함수 재사용 — AsFedLabelData 형식으로 변환만 하고 계산 로직은 그대로 씀
  const asFedLabel: AsFedLabelData = {
    crudeProteinPct: ingredient.per100g.crudeProteinPct,
    crudeFatPct: ingredient.per100g.crudeFatPct,
    crudeFiberPct: ingredient.per100g.crudeFiberPct,
    moisturePct: ingredient.per100g.moisturePct,
    crudeAshPct: ingredient.per100g.crudeAshPct,
    kcalPerKg: ingredient.per100g.kcal * 10, // per100g kcal -> per kg
  };

  const analysis = analyzeLabelMacros(asFedLabel);
  const scaleFactor = gramsGiven / 100;
  const kcalContributed = Math.round(ingredient.per100g.kcal * scaleFactor * 10) / 10;

  return {
    blocked: false,
    ingredient,
    gramsGiven,
    kcalContributed,
    analysis,
  };
}

// ────────────────────────────────────────────────────────────
// 결과를 사람이 읽을 수 있는 메시지로 변환 (UI 표시용 헬퍼)
// ────────────────────────────────────────────────────────────
export function describeFeedingItemResult(result: HomemadeFeedingItemResult): string {
  if (result.blocked) {
    return result.warningMessage;
  }

  const { ingredient, gramsGiven, kcalContributed, analysis } = result;
  return (
    `${ingredient.nameKo} ${gramsGiven}g (${ingredient.preparationNote}) → ` +
    `약 ${kcalContributed}kcal 기여. ` +
    `단백질 ${analysis.dryMatterBasis.crudeProteinPctDM}%DM, 지방 ${analysis.dryMatterBasis.crudeFatPctDM}%DM` +
    (ingredient.petFeedingNote ? ` | 참고: ${ingredient.petFeedingNote}` : "")
  );
}