// ingredients/toxicIngredients.ts
//
// 개·고양이에게 위험하거나 독성이 있는 식재료 목록.
//
// ⚠️ 이 파일은 영양 계산용 DB(rawIngredientDictionary.ts)보다 우선순위가 높음.
//    검색 결과에 이 목록의 항목이 매칭되면, 영양소 계산을 진행하기 전에
//    반드시 경고를 먼저 표시해야 함.
//
// 출처:
// - FEDIAF Nutritional Guidelines 2024, ANNEX 7.7
//   (Risk of some human foods regularly given to pets: 포도/건포도, 초콜릿, 양파/마늘)
// - ASPCA Animal Poison Control Center (People Foods to Avoid Feeding Your Pets)
// - Merck Veterinary Manual (Xylitol Toxicosis in Dogs)
// - WSAVA 2014 Congress (Household Toxins: Dogs and Cats)
//
// 주의:
// - severity는 "이 양을 먹으면 항상 이렇다"가 아니라 일반적 위험도를 나타냄.
//   실제 독성은 체중, 섭취량, 개체차에 따라 크게 달라짐.
// - 이 파일은 진단/치료 지침이 아님 — 의심되는 경우 반드시 수의사 또는
//   동물 중독관리센터(Animal Poison Control)에 즉시 연락해야 함.
// - toxicDoseNote는 "안전한 양"을 알려주는 게 아니라 "이 정도부터 위험하다"는
//   참고치임. 소량이라도 급여하지 않는 것이 원칙.

export type ToxicitySeverity =
  | "lethal_risk"      // 사망 가능성 있는 심각한 독성 (초콜릿 다량, 자일리톨 다량 등)
  | "severe"           // 응급 치료가 필요한 심각한 증상 (신부전, 간부전, 용혈성 빈혈 등)
  | "moderate"         // 치료가 필요하지만 일반적으로 생명에 즉각적 위협은 아님 (소화기 증상 등)
  | "mild_caution";    // 다량/장기 섭취 시에만 문제, 소량은 일반적으로 무해

export type ToxicitySpecies = "dog" | "cat" | "both";

export interface ToxicIngredient {
  id: string;
  nameKo: string;
  nameEn: string;
  aliasesKo?: string[];           // 검색 매칭을 위한 다른 표기 (예: "포도", "건포도", "청포도")
  affectedSpecies: ToxicitySpecies;
  severity: ToxicitySeverity;
  toxicAgent: string;             // 독성 원인 물질/기전 (간략히)
  clinicalSigns: string[];        // 주요 임상증상 (간략 나열)
  toxicDoseNote: string;          // 독성 발현 가능 용량에 대한 참고 (절대적 안전 기준 아님)
  sourceRefs: string[];
}

export const toxicIngredients: ToxicIngredient[] = [

  // ──────────────────────────────────────────────
  // 1. 포도/건포도류 — FEDIAF ANNEX 7.7, severe~lethal
  // ──────────────────────────────────────────────
  {
    id: "grapes_raisins",
    nameKo: "포도/건포도/커런트",
    nameEn: "Grapes, Raisins, Currants, Sultanas",
    aliasesKo: ["포도", "건포도", "청포도", "캠벨포도", "커런트", "술타나"],
    affectedSpecies: "both",
    severity: "severe",
    toxicAgent: "정확한 독성물질 미확인 (타르타르산 관련 추정), 신장 손상 유발",
    clinicalSigns: ["구토", "설사", "식욕부진", "무기력", "복통", "급성신부전(섭취 후 최대 24시간 후 발현 가능)"],
    toxicDoseNote: "체중 20kg 기준 생포도 약 40g 또는 건포도 약 60g부터 위험 보고 있음. 개체차가 매우 커서 소량에도 반응하는 경우가 있어 '안전량'은 존재하지 않는 것으로 간주해야 함",
    sourceRefs: ["FEDIAF Nutritional Guidelines 2024, ANNEX 7.7.1", "ASPCA Animal Poison Control", "WSAVA 2014 Congress"],
  },

  // ──────────────────────────────────────────────
  // 2. 초콜릿/카카오 — FEDIAF ANNEX 7.7, severe~lethal
  // ──────────────────────────────────────────────
  {
    id: "chocolate_cacao",
    nameKo: "초콜릿/카카오",
    nameEn: "Chocolate, Cacao",
    aliasesKo: ["다크초콜릿", "코코아", "카카오파우더", "초콜릿케이크"],
    affectedSpecies: "both",
    severity: "lethal_risk",
    toxicAgent: "테오브로민, 카페인 (메틸잔틴류) — 개는 사람보다 대사 속도가 훨씬 느림",
    clinicalSigns: ["과다흥분", "심박수 증가/부정맥", "구토", "설사", "다뇨/다갈", "진전", "발작", "심한 경우 사망"],
    toxicDoseNote: "코코아 함량이 높을수록(다크초콜릿, 베이킹초콜릿) 위험. 체중이 적을수록, 섭취량이 많을수록 위험도 증가",
    sourceRefs: ["FEDIAF Nutritional Guidelines 2024, ANNEX 7.7.2", "ASPCA Animal Poison Control"],
  },

  // ──────────────────────────────────────────────
  // 3. 양파/마늘/파류 — FEDIAF ANNEX 7.7, severe
  // ──────────────────────────────────────────────
  {
    id: "onion_garlic_allium",
    nameKo: "양파/마늘/대파/쪽파/부추",
    nameEn: "Onion, Garlic, Leek, Chives (Allium species)",
    aliasesKo: ["양파", "마늘", "대파", "쪽파", "부추", "양파즙", "마늘가루"],
    affectedSpecies: "both",
    severity: "severe",
    toxicAgent: "황화합물(thiosulfate 등) — 적혈구 산화손상 유발",
    clinicalSigns: ["용혈성 빈혈", "구토", "설사", "혈색소뇨(붉은갈색 소변)", "무기력", "쇠약"],
    toxicDoseNote: "생것/익힌것/건조분말 모두 위험. 고양이가 개보다 더 민감. 반복적인 소량 섭취도 누적되어 빈혈을 유발할 수 있음",
    sourceRefs: ["FEDIAF Nutritional Guidelines 2024, ANNEX 7.7.3", "WSAVA 2014 Congress", "ASPCA Animal Poison Control"],
  },

  // ──────────────────────────────────────────────
  // 4. 자일리톨 — Merck Veterinary Manual, lethal (개 전용)
  // ──────────────────────────────────────────────
  {
    id: "xylitol",
    nameKo: "자일리톨",
    nameEn: "Xylitol",
    aliasesKo: ["무설탕껌", "자일리톨껌", "다이어트베이킹재료"],
    affectedSpecies: "dog",
    severity: "lethal_risk",
    toxicAgent: "급격한 인슐린 분비 자극 → 저혈당, 고용량에서는 간세포 괴사",
    clinicalSigns: ["저혈당(구토, 무기력, 운동실조)", "섭취 30분~수시간 내 발현 가능", "고용량 시 간부전(12~48시간 내 간수치 상승)", "발작"],
    toxicDoseNote: "체중 1kg당 약 0.1g 이상에서 저혈당 위험, 0.5g/kg 이상에서 간부전 위험 보고. 고양이는 현재까지 이 독성기전 보고 없음(개에서만 확인됨)",
    sourceRefs: ["Merck Veterinary Manual, Xylitol Toxicosis in Dogs", "ASPCA Animal Poison Control", "Cornell University College of Veterinary Medicine"],
  },

  // ──────────────────────────────────────────────
  // 5. 마카다미아넛 — ASPCA, moderate
  // ──────────────────────────────────────────────
  {
    id: "macadamia_nuts",
    nameKo: "마카다미아너트",
    nameEn: "Macadamia Nuts",
    aliasesKo: ["마카다미아"],
    affectedSpecies: "dog",
    severity: "moderate",
    toxicAgent: "정확한 독성기전 미확인",
    clinicalSigns: ["쇠약(특히 뒷다리)", "운동실조", "구토", "진전", "고체온", "섭취 후 12시간 내 발현, 보통 24~72시간 내 회복"],
    toxicDoseNote: "생명을 위협하는 경우는 드물지만 불편감이 크고 증상이 뚜렷함. 초콜릿과 함께 섭취 시(예: 마카다미아 초콜릿) 위험 가중",
    sourceRefs: ["ASPCA Animal Poison Control"],
  },

  // ──────────────────────────────────────────────
  // 6. 알코올 — ASPCA/WSAVA, severe
  // ──────────────────────────────────────────────
  {
    id: "alcohol",
    nameKo: "알코올(주류, 발효 반죽 포함)",
    nameEn: "Alcohol (alcoholic beverages, unbaked yeast dough)",
    aliasesKo: ["술", "맥주", "와인", "발효빵반죽", "이스트반죽"],
    affectedSpecies: "both",
    severity: "severe",
    toxicAgent: "에탄올 (발효 중인 반죽은 추가로 체내에서 에탄올 생성 및 가스로 위 팽창 유발)",
    clinicalSigns: ["구토", "중추신경 억제(보행장애, 혼수)", "체온저하", "호흡억제", "발효반죽의 경우 위 팽창/꼬임 위험 동반"],
    toxicDoseNote: "체구가 작을수록 같은 양에도 더 위험. 발효 중인 반죽은 알코올 중독과 위장관 폐쇄 위험이 동시에 있어 특히 주의",
    sourceRefs: ["ASPCA Animal Poison Control", "WSAVA 2014 Congress"],
  },

  // ──────────────────────────────────────────────
  // 7. 유제품 — ASPCA, mild_caution
  // ──────────────────────────────────────────────
  {
    id: "dairy_milk",
    nameKo: "우유 및 유제품(다량)",
    nameEn: "Milk and dairy products (in excess)",
    aliasesKo: ["우유", "치즈(다량)", "아이스크림"],
    affectedSpecies: "both",
    severity: "mild_caution",
    toxicAgent: "락타아제(젖당분해효소) 부족",
    clinicalSigns: ["설사", "구토", "소화불량"],
    toxicDoseNote: "독성보다는 소화불량 문제. 소량의 플레인 요거트/치즈는 대부분 개체에서 문제없이 급여되는 경우가 많으나 개체차가 있음",
    sourceRefs: ["ASPCA Animal Poison Control"],
  },

  // ──────────────────────────────────────────────
  // 8. 날반죽/생달걀 등 — moderate (참고: ASPCA 목록 중 일부)
  // ──────────────────────────────────────────────
  {
    id: "raw_dough",
    nameKo: "생반죽(이스트 포함, 베이킹 전)",
    nameEn: "Raw yeast dough",
    aliasesKo: ["빵반죽", "생반죽"],
    affectedSpecies: "both",
    severity: "moderate",
    toxicAgent: "위 내에서 발효가 계속되어 가스 생성 → 위 팽창, 추가로 에탄올 생성",
    clinicalSigns: ["복부팽만", "구토 시도(실패)", "복통", "위확장-꼬임증후군(GDV) 위험"],
    toxicDoseNote: "alcohol 항목과 기전이 겹치므로 함께 고려. 특히 대형견에서 위확장-꼬임 위험이 더 큼",
    sourceRefs: ["ASPCA Animal Poison Control"],
  },
];

// ────────────────────────────────────────────────────────────
// 검색/매칭 함수: 사용자가 입력한 재료명이 독성 목록에 매칭되는지 확인
// ────────────────────────────────────────────────────────────
export interface ToxicityCheckResult {
  isMatch: boolean;
  matchedIngredient?: ToxicIngredient;
}

export function checkIngredientToxicity(searchTerm: string): ToxicityCheckResult {
  const normalized = searchTerm.trim().toLowerCase();
  if (normalized.length === 0) {
    return { isMatch: false };
  }

  for (const toxic of toxicIngredients) {
    const namesToCheck = [toxic.nameKo, toxic.nameEn, ...(toxic.aliasesKo ?? [])];
    const matched = namesToCheck.some(name =>
      normalized.includes(name.toLowerCase()) || name.toLowerCase().includes(normalized)
    );
    if (matched) {
      return { isMatch: true, matchedIngredient: toxic };
    }
  }

  return { isMatch: false };
}

// ────────────────────────────────────────────────────────────
// 경고 메시지 생성 — UI에서 그대로 사용 가능한 형태
// ────────────────────────────────────────────────────────────
export function buildToxicityWarningMessage(ingredient: ToxicIngredient, species: "dog" | "cat"): string | null {
  if (ingredient.affectedSpecies !== "both" && ingredient.affectedSpecies !== species) {
    return null; // 해당 종에는 영향 없음 (예: 자일리톨은 고양이에 미해당)
  }

  const severityLabel: Record<ToxicitySeverity, string> = {
    lethal_risk: "🚨 치명적 위험",
    severe: "⚠️ 심각한 위험",
    moderate: "⚠️ 주의 필요",
    mild_caution: "ℹ️ 경미한 주의",
  };

  return (
    `${severityLabel[ingredient.severity]}: "${ingredient.nameKo}"는 ${species === "dog" ? "개" : "고양이"}에게 ` +
    `급여해서는 안 되는 식재료입니다. 주요 증상: ${ingredient.clinicalSigns.slice(0, 3).join(", ")} 등. ` +
    `이미 섭취했다면 즉시 동물병원 또는 동물 중독관리센터에 연락하세요.`
  );
}