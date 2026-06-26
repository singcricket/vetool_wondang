// conditions/types.ts
//
// 질병/계통별 영양 기준 override의 타입 정의.
// 이 파일은 "껍데기"만 정의하며, 실제 질병 데이터는 conditions/ 폴더에
// 하나씩 추가되는 개별 파일(예: renalDisease.ts)에 작성됨.
//
// 핵심 원칙:
// - 질병 ref는 일반 기준(core/)을 "완전히 대체"하지 않고 "필요한 영양소만 덮어씀"
// - 질병 ref에 없는 영양소는 자동으로 일반 기준이 적용됨 (resolver가 처리)
// - 질병 ref가 통째로 없어도 프로그램은 정상 동작해야 함 (fallback 보장)

export type EvidenceLevel =
  | "A"   // 다수의 RCT/임상연구 근거
  | "B"   // 전문가 컨센서스, 가이드라인 (예: IRIS, ACVIM)
  | "C";  // 개별 전문가 의견, 사례 기반

export type NutrientDirection =
  | "restrict"   // 제한 (상한 강화)
  | "increase"   // 보충 권장 (하한 강화)
  | "maintain"   // 일반기준 유지하되 모니터링 필요
  | "monitor";   // 수치 자체보다 추적관찰이 더 중요한 경우

export interface ConditionNutrientOverride {
  min?: number | null;
  max?: number | null;
  direction: NutrientDirection;
  rationale: string;          // 왜 이 수치로 조정하는지 (한 줄 요약)
  evidenceLevel: EvidenceLevel;
  sourceRefs: string[];       // 출처 목록 (예: ["IRIS CKD Guidelines 2023"])
}

export interface ConditionOverride {
  conditionId: string;                 // 고유 ID, 예: "ckd_stage2"
  conditionLabel: string;              // 화면 표시용 한글명, 예: "만성신부전 2기"
  conditionGroup: "disease" | "systemic"; // 질병별 vs 계통별 구분
  species: "dog" | "cat" | "both";
  appliesToLifeStage?: string[];       // 보통 adult/senior에만 적용, 비우면 전체 적용
  description?: string;                // 이 상태에 대한 1~2줄 설명
  overrides: Record<string, ConditionNutrientOverride>;
  // 질병 ref에 언급되지 않은 영양소는 resolver가 자동으로 core 기준으로 처리함
}

// 질병 우선순위 규칙 (복수 질병 동시 적용 시 충돌 해결용)
// 숫자가 클수록 우선순위 높음 (나중에 적용되어 이전 값을 덮어씀)
// 아직 질병 ref가 없으므로 빈 객체로 시작 — 질병 추가 시 함께 등록
export const conditionPriority: Record<string, number> = {};