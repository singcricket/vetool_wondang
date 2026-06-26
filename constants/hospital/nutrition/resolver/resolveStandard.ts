// resolver/resolveStandard.ts
//
// 핵심 병합 엔진: 일반(생애주기) 기준 + 질병 override를 합쳐서
// 최종적으로 비교에 사용할 영양소 기준표를 만들어줌.
//
// 동작 원칙:
// 1. 일반 기준(core/)은 항상 존재 — 안전망 역할
// 2. activeConditionIds가 비어있거나, 등록 안 된 질병이면 → 그냥 일반 기준만 적용 (에러 없음)
// 3. 등록된 질병이 있으면 → 해당 영양소만 override, 나머지는 일반 기준 유지
// 4. 여러 질병 동시 적용 시 → conditionPriority 순서대로 누적 적용 (낮은 우선순위 → 높은 우선순위)

import { dogLifeStageStandards, DogLifeStage, NutrientRange } from "../core/dogLifeStageStandards";
import { catLifeStageStandards, CatLifeStage } from "../core/catLifeStageStandards";
import { conditionOverrides, findConditionById } from "../conditions";
import { conditionPriority } from "../conditions/types";

export type AppliedSource = "general" | "condition_override";

export interface ResolvedNutrientStandard {
  nutrientId: string;
  min: number | null;
  max: number | null;
  maxType: "nutritional" | "legal" | null;
  unit: string;
  appliedSource: AppliedSource;
  conditionLabel?: string;   // override가 적용됐다면 어떤 질병 때문인지
  rationale?: string;        // override 적용 이유
  generalNote?: string;      // 일반기준 자체의 note (각주 등)
}

export interface ResolveStandardParams {
  species: "dog" | "cat";
  lifeStage: string;              // DogLifeStage 또는 CatLifeStage 문자열
  activeConditionIds?: string[];  // 보호자가 선택한 질병들, 없으면 빈 배열로 취급
}

export interface ResolveStandardResult {
  species: "dog" | "cat";
  lifeStage: string;
  appliedConditions: { conditionId: string; conditionLabel: string }[]; // 실제로 적용된 질병만 (등록 안 된 건 제외)
  skippedConditions: string[];    // 선택했지만 아직 ref가 없어서 스킵된 질병 ID
  nutrients: Record<string, ResolvedNutrientStandard>;
}

export function resolveStandard(params: ResolveStandardParams): ResolveStandardResult {
  const { species, lifeStage, activeConditionIds = [] } = params;

  // 1단계: 일반(생애주기) 기준 가져오기 — 여기서 못 찾으면 코드 버그이므로 명확히 throw
  const baseStandards = species === "dog" ? dogLifeStageStandards : catLifeStageStandards;
  const base = baseStandards.find(s => s.lifeStage === lifeStage);
  if (!base) {
    throw new Error(
      `일반 기준을 찾을 수 없습니다: species=${species}, lifeStage=${lifeStage}. ` +
      `core/${species}LifeStageStandards.ts 에 해당 생애주기가 정의되어 있는지 확인하세요.`
    );
  }

  const nutrients: Record<string, ResolvedNutrientStandard> = {};
  for (const [nutrientId, range] of Object.entries(base.nutrients)) {
    nutrients[nutrientId] = {
      nutrientId,
      min: range.min,
      max: range.max,
      maxType: range.maxType,
      unit: range.unit,
      appliedSource: "general",
      generalNote: range.note,
    };
  }

  // 2단계: 질병 override 적용
  const appliedConditions: { conditionId: string; conditionLabel: string }[] = [];
  const skippedConditions: string[] = [];

  // 우선순위 낮은 것부터 적용 (높은 우선순위가 마지막에 적용되어 최종값이 됨)
  const sortedConditionIds = [...activeConditionIds].sort(
    (a, b) => (conditionPriority[a] ?? 0) - (conditionPriority[b] ?? 0)
  );

  for (const conditionId of sortedConditionIds) {
    const condition = findConditionById(conditionId);

    if (!condition) {
      // 아직 ref가 만들어지지 않은 질병 — 조용히 스킵 (에러 없이 일반기준 유지)
      skippedConditions.push(conditionId);
      continue;
    }

    // 종(species) 불일치 체크 — 예: 고양이 환자에게 개 전용 질병 ref가 잘못 선택된 경우
    if (condition.species !== "both" && condition.species !== species) {
      skippedConditions.push(conditionId);
      continue;
    }

    // 생애주기 제한이 있는 질병이면 체크 (예: 질병 ref가 adult/senior에만 적용되는 경우)
    if (condition.appliesToLifeStage && !condition.appliesToLifeStage.includes(lifeStage)) {
      skippedConditions.push(conditionId);
      continue;
    }

    appliedConditions.push({ conditionId: condition.conditionId, conditionLabel: condition.conditionLabel });

    for (const [nutrientId, override] of Object.entries(condition.overrides)) {
      const existing = nutrients[nutrientId];
      nutrients[nutrientId] = {
        nutrientId,
        min: override.min !== undefined ? override.min : existing?.min ?? null,
        max: override.max !== undefined ? override.max : existing?.max ?? null,
        maxType: existing?.maxType ?? null,
        unit: existing?.unit ?? "g/100gDM",
        appliedSource: "condition_override",
        conditionLabel: condition.conditionLabel,
        rationale: override.rationale,
        generalNote: existing?.generalNote,
      };
    }
  }

  return {
    species,
    lifeStage,
    appliedConditions,
    skippedConditions,
    nutrients,
  };
}

// ────────────────────────────────────────────────────────────
// 보조 함수: 특정 영양소 하나만 빠르게 조회 (UI에서 단일 항목 표시할 때 유용)
// ────────────────────────────────────────────────────────────
export function resolveNutrientStandard(
  params: ResolveStandardParams,
  nutrientId: string
): ResolvedNutrientStandard | undefined {
  const result = resolveStandard(params);
  return result.nutrients[nutrientId];
}