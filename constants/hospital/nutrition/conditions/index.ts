// conditions/index.ts
//
// 질병/계통별 ref 레지스트리.
// 지금은 비어있는 배열 — 질병 ref를 만들 때마다 여기에 한 줄씩만 추가하면 됨.
//
// 사용 예시 (나중에 신부전 ref를 만들었다면):
//
//   import { renalDiseaseOverride } from "./renalDisease";
//
//   export const conditionOverrides: ConditionOverride[] = [
//     renalDiseaseOverride,
//   ];
//
// 이 배열이 비어 있어도 resolver는 정상 동작하며, 전체 프로그램은
// "일반 기준만 적용된 상태"로 완전히 동작함.

import { ConditionOverride } from "./types";

export const conditionOverrides: ConditionOverride[] = [
  // ── 질병별 (disease) ──
  // renalDiseaseOverride,        // 신부전 (예정)
  // cardiacDiseaseOverride,      // 심부전 (예정)
  // hepaticDiseaseOverride,      // 간질환 (예정)
  // diabetesMellitusOverride,    // 당뇨 (예정)
  // ibdOverride,                 // 염증성장질환 (예정)

  // ── 계통별 (systemic) ──
  // gastrointestinalOverride,    // 소화기 계통 (예정)
  // dermatologicOverride,        // 피부 계통 (예정)
];

// 질병 ID로 빠르게 조회하기 위한 헬퍼 (resolver에서 사용)
export function findConditionById(conditionId: string): ConditionOverride | undefined {
  return conditionOverrides.find(c => c.conditionId === conditionId);
}

// 현재 등록된 모든 질병 목록 (UI에서 선택 체크박스 렌더링 시 사용)
export function listAvailableConditions(species?: "dog" | "cat"): ConditionOverride[] {
  if (!species) return conditionOverrides;
  return conditionOverrides.filter(c => c.species === species || c.species === "both");
}