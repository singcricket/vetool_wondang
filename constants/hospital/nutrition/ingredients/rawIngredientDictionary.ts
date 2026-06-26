// ingredients/rawIngredientDictionary.ts
//
// 자주 사용되는 홈메이드 식재료의 영양 정보 DB.
// 보호자가 닭가슴살, 브로콜리 등을 검색해서 입력하면, 이 DB에서 수치를 가져와
// 기존 conversion/macroCalculations.ts의 함수를 그대로 재사용해 %DM 환산 및
// 칼로리 계산을 수행함.
//
// 출처: USDA FoodData Central (SR Legacy / Foundation Foods)
// - Public Domain, CC0 1.0 — 출처 표기만 권장 (저작권 제약 없음)
// - 인용 형식: U.S. Department of Agriculture, Agricultural Research Service,
//   Beltsville Human Nutrition Research Center. FoodData Central.
//
// 필드명은 conversion/macroCalculations.ts 의 AsFedLabelData와 의도적으로
// 통일되어 있음 (moisturePct, crudeProteinPct 등) — 그래야 같은 변환 함수를
// 재사용할 수 있음.
//
// 주의:
// - "조섬유(crude fiber)"는 USDA가 보통 "총 식이섬유(total dietary fiber)"로
//   제공하는데, 사료 라벨의 "조섬유"보다 더 넓은 개념임. 여기서는 실용적 근사치로
//   total dietary fiber 값을 그대로 사용 — 정밀한 사료 비교 시 약간의 과대평가
//   가능성이 있음을 인지해야 함.
// - crudeAshPct(조회분)는 USDA가 "Ash"로 직접 제공하는 항목을 사용.
// - 모든 수치는 "조리 전(생것)" 또는 "기본 조리법(삶음/구움)" 기준이며,
//   실제 조리법(기름 사용 여부 등)에 따라 달라질 수 있음.
// - ⚠️ 이 DB를 사용하기 전에 ingredients/toxicIngredients.ts 로 먼저
//   독성 여부를 확인해야 함 (검색 흐름에서 toxicIngredients 체크가 선행되어야 함).

export type IngredientCategory =
  | "protein_meat"      // 육류
  | "protein_fish"       // 어류
  | "protein_egg_dairy"   // 계란/유제품
  | "vegetable"
  | "fruit"
  | "grain_starch";       // 곡류/전분류

export interface RawIngredientNutrition {
  kcal: number;                  // per 100g, as-fed(조리상태 그대로) 기준
  moisturePct: number;           // 수분 (%)
  crudeProteinPct: number;       // 조단백질 (%)
  crudeFatPct: number;           // 조지방 (%)
  crudeFiberPct: number;         // 조섬유 — 근사치로 total dietary fiber 사용 (위 주의사항 참고)
  crudeAshPct: number;           // 조회분 (%)
}

export interface RawIngredient {
  id: string;
  nameKo: string;
  nameEn: string;
  aliasesKo?: string[];          // 검색 매칭용 다른 표기
  category: IngredientCategory;
  preparationNote: string;       // "생것", "삶은것(기름 없이)" 등 — 조리법이 다르면 수치가 달라짐을 명시
  sourceDb: "USDA";
  sourceId: string;              // USDA FDC ID 또는 NDB 번호
  per100g: RawIngredientNutrition;
  petFeedingNote?: string;       // 반려동물 급여 시 참고사항 (독성은 아니지만 주의할 점)
}

export const rawIngredientDictionary: RawIngredient[] = [

  // ════════════════════════════════════════════
  // 육류 (Protein - Meat)
  // ════════════════════════════════════════════
  {
    id: "chicken_breast_raw",
    nameKo: "닭가슴살 (생)",
    nameEn: "Chicken breast, skinless, boneless, raw",
    aliasesKo: ["닭가슴살", "닭고기", "치킨"],
    category: "protein_meat",
    preparationNote: "생것, 껍질/뼈 제거",
    sourceDb: "USDA",
    sourceId: "FDC 171077",
    per100g: { kcal: 114, moisturePct: 75.8, crudeProteinPct: 23.1, crudeFatPct: 1.2, crudeFiberPct: 0, crudeAshPct: 1.1 },
    petFeedingNote: "조미료(소금, 마늘, 양파 등) 없이 급여. 뼈는 절대 급여하지 않음(특히 익힌 뼈는 파편화 위험)",
  },
  {
    id: "chicken_breast_boiled",
    nameKo: "닭가슴살 (삶은것, 기름 없이)",
    nameEn: "Chicken breast, boiled, no skin, no added fat",
    aliasesKo: ["삶은닭가슴살", "닭가슴살삶은것"],
    category: "protein_meat",
    preparationNote: "삶은것, 기름/조미료 없음",
    sourceDb: "USDA",
    sourceId: "FDC 171477 (조정)",
    per100g: { kcal: 165, moisturePct: 65.6, crudeProteinPct: 31.0, crudeFatPct: 3.6, crudeFiberPct: 0, crudeAshPct: 1.2 },
    petFeedingNote: "조리하면 수분이 빠져나가 단백질 농도가 높아짐 — 같은 무게라도 생것보다 영양밀도가 높음",
  },
  {
    id: "chicken_thigh_raw",
    nameKo: "닭다리살 (생, 껍질제거)",
    nameEn: "Chicken thigh, skinless, boneless, raw",
    aliasesKo: ["닭다리살", "닭다리"],
    category: "protein_meat",
    preparationNote: "생것, 껍질 제거",
    sourceDb: "USDA",
    sourceId: "FDC 171076 (근사)",
    per100g: { kcal: 145, moisturePct: 74.0, crudeProteinPct: 20.0, crudeFatPct: 6.7, crudeFiberPct: 0, crudeAshPct: 1.0 },
  },
  {
    id: "beef_ground_90_10_raw",
    nameKo: "소고기 다짐육 (생, 90%살 10%지방)",
    nameEn: "Beef, ground, 90% lean / 10% fat, raw",
    aliasesKo: ["소고기다짐육", "소고기간것", "다짐육"],
    category: "protein_meat",
    preparationNote: "생것",
    sourceDb: "USDA",
    sourceId: "FDC 174030",
    per100g: { kcal: 176, moisturePct: 68.8, crudeProteinPct: 20.0, crudeFatPct: 10.0, crudeFiberPct: 0, crudeAshPct: 1.0 },
  },
  {
    id: "beef_sirloin_lean_raw",
    nameKo: "소고기 우둔살 (생, 살코기)",
    nameEn: "Beef, sirloin, lean, raw",
    aliasesKo: ["소고기살코기", "우둔살"],
    category: "protein_meat",
    preparationNote: "생것, 지방 제거",
    sourceDb: "USDA",
    sourceId: "FDC 23564 (근사)",
    per100g: { kcal: 137, moisturePct: 73.0, crudeProteinPct: 21.6, crudeFatPct: 5.0, crudeFiberPct: 0, crudeAshPct: 1.1 },
  },
  {
    id: "pork_loin_lean_raw",
    nameKo: "돼지고기 등심 (생, 살코기)",
    nameEn: "Pork, loin, lean, raw",
    aliasesKo: ["돼지고기", "돼지등심"],
    category: "protein_meat",
    preparationNote: "생것, 지방 제거",
    sourceDb: "USDA",
    sourceId: "FDC 167902 (근사)",
    per100g: { kcal: 143, moisturePct: 73.5, crudeProteinPct: 21.5, crudeFatPct: 5.6, crudeFiberPct: 0, crudeAshPct: 1.1 },
    petFeedingNote: "완전히 익혀서 급여 (생/덜 익은 돼지고기는 기생충 감염 위험)",
  },
  {
    id: "beef_liver_raw",
    nameKo: "소간 (생)",
    nameEn: "Beef liver, raw",
    aliasesKo: ["소간", "간"],
    category: "protein_meat",
    preparationNote: "생것",
    sourceDb: "USDA",
    sourceId: "FDC 169451 (근사)",
    per100g: { kcal: 135, moisturePct: 71.0, crudeProteinPct: 20.4, crudeFatPct: 3.6, crudeFiberPct: 0, crudeAshPct: 1.3 },
    petFeedingNote: "비타민A 함량이 매우 높음 — 소량만 급여, 과다 급여 시 비타민A 과잉증 위험. 전체 식단의 5~10% 이내 권장",
  },

  // ════════════════════════════════════════════
  // 어류 (Protein - Fish)
  // ════════════════════════════════════════════
  {
    id: "salmon_raw",
    nameKo: "연어 (생)",
    nameEn: "Salmon, Atlantic, raw",
    aliasesKo: ["연어"],
    category: "protein_fish",
    preparationNote: "생것, 가시 제거",
    sourceDb: "USDA",
    sourceId: "FDC 175167 (근사)",
    per100g: { kcal: 142, moisturePct: 68.5, crudeProteinPct: 19.9, crudeFatPct: 6.3, crudeFiberPct: 0, crudeAshPct: 1.2 },
    petFeedingNote: "반드시 완전히 익혀서 급여 (생연어는 기생충/세균 위험 — 특히 'salmon poisoning' 원인 기생충). 가시는 제거",
  },
  {
    id: "salmon_cooked",
    nameKo: "연어 (구운것/찐것, 기름 없이)",
    nameEn: "Salmon, Atlantic, cooked, dry heat",
    aliasesKo: ["익힌연어", "구운연어"],
    category: "protein_fish",
    preparationNote: "익힌것, 기름 없음",
    sourceDb: "USDA",
    sourceId: "FDC 175168 (근사)",
    per100g: { kcal: 206, moisturePct: 63.0, crudeProteinPct: 25.4, crudeFatPct: 12.4, crudeFiberPct: 0, crudeAshPct: 1.5 },
  },
  {
    id: "white_fish_cod_cooked",
    nameKo: "대구살 (찐것/삶은것)",
    nameEn: "Cod, cooked, dry heat",
    aliasesKo: ["대구", "흰살생선"],
    category: "protein_fish",
    preparationNote: "익힌것",
    sourceDb: "USDA",
    sourceId: "FDC 175158 (근사)",
    per100g: { kcal: 105, moisturePct: 76.0, crudeProteinPct: 23.0, crudeFatPct: 0.9, crudeFiberPct: 0, crudeAshPct: 1.3 },
  },

  // ════════════════════════════════════════════
  // 계란/유제품 (Egg & Dairy)
  // ════════════════════════════════════════════
  {
    id: "egg_whole_raw",
    nameKo: "계란 (전체, 생)",
    nameEn: "Egg, whole, raw, fresh",
    aliasesKo: ["계란", "달걀"],
    category: "protein_egg_dairy",
    preparationNote: "생것, 껍질 제외",
    sourceDb: "USDA",
    sourceId: "FDC 173424 (근사)",
    per100g: { kcal: 143, moisturePct: 76.1, crudeProteinPct: 12.6, crudeFatPct: 9.5, crudeFiberPct: 0, crudeAshPct: 1.0 },
    petFeedingNote: "완전히 익혀서 급여 권장 (생 흰자는 비오틴 흡수를 방해하는 아비딘 함유, 익히면 문제 없음)",
  },
  {
    id: "egg_whole_boiled",
    nameKo: "계란 (완숙)",
    nameEn: "Egg, whole, cooked, hard-boiled",
    aliasesKo: ["삶은계란", "완숙계란"],
    category: "protein_egg_dairy",
    preparationNote: "완숙",
    sourceDb: "USDA",
    sourceId: "FDC 173423 (근사)",
    per100g: { kcal: 155, moisturePct: 75.0, crudeProteinPct: 12.6, crudeFatPct: 10.6, crudeFiberPct: 0, crudeAshPct: 1.0 },
  },
  {
    id: "plain_yogurt_unsweetened",
    nameKo: "플레인 요거트 (무가당)",
    nameEn: "Yogurt, plain, whole milk, unsweetened",
    aliasesKo: ["요거트", "플레인요거트"],
    category: "protein_egg_dairy",
    preparationNote: "무가당, 첨가물 없음",
    sourceDb: "USDA",
    sourceId: "FDC 170886 (근사)",
    per100g: { kcal: 61, moisturePct: 87.9, crudeProteinPct: 3.5, crudeFatPct: 3.3, crudeFiberPct: 0, crudeAshPct: 0.8 },
    petFeedingNote: "무가당·무첨가 제품만 사용 (자일리톨 첨가 제품 절대 금지). 유당불내성 개체는 설사 가능 — 소량부터 시작",
  },
  {
    id: "cottage_cheese_plain",
    nameKo: "코티지치즈 (저지방, 무가당)",
    nameEn: "Cottage cheese, low-fat",
    aliasesKo: ["코티지치즈"],
    category: "protein_egg_dairy",
    preparationNote: "무가당, 첨가물 없음",
    sourceDb: "USDA",
    sourceId: "FDC 171256 (근사)",
    per100g: { kcal: 81, moisturePct: 80.0, crudeProteinPct: 11.1, crudeFatPct: 2.3, crudeFiberPct: 0, crudeAshPct: 1.0 },
  },

  // ════════════════════════════════════════════
  // 채소 (Vegetable)
  // ════════════════════════════════════════════
  {
    id: "broccoli_raw",
    nameKo: "브로콜리 (생)",
    nameEn: "Broccoli, raw",
    aliasesKo: ["브로콜리"],
    category: "vegetable",
    preparationNote: "생것",
    sourceDb: "USDA",
    sourceId: "FDC 170379",
    per100g: { kcal: 34, moisturePct: 89.3, crudeProteinPct: 2.8, crudeFatPct: 0.4, crudeFiberPct: 2.6, crudeAshPct: 0.9 },
    petFeedingNote: "다량 급여 시 갑상선 기능에 영향 가능성 보고 있음(고이트로젠 성분) — 소량/가끔 급여 권장. 잘게 썰거나 살짝 데치면 소화에 도움",
  },
  {
    id: "broccoli_steamed",
    nameKo: "브로콜리 (찐것)",
    nameEn: "Broccoli, steamed, no fat added",
    aliasesKo: ["찐브로콜리"],
    category: "vegetable",
    preparationNote: "찐것, 기름/조미료 없음",
    sourceDb: "USDA",
    sourceId: "FDC 170382 (근사)",
    per100g: { kcal: 35, moisturePct: 89.0, crudeProteinPct: 2.4, crudeFatPct: 0.4, crudeFiberPct: 3.3, crudeAshPct: 0.7 },
  },
  {
    id: "carrot_raw",
    nameKo: "당근 (생)",
    nameEn: "Carrot, raw",
    aliasesKo: ["당근"],
    category: "vegetable",
    preparationNote: "생것",
    sourceDb: "USDA",
    sourceId: "FDC 170393",
    per100g: { kcal: 41, moisturePct: 88.3, crudeProteinPct: 0.9, crudeFatPct: 0.2, crudeFiberPct: 2.8, crudeAshPct: 0.9 },
    petFeedingNote: "작게 썰어 급여 (덩어리째 급여 시 질식/장폐쇄 위험, 특히 소형견)",
  },
  {
    id: "pumpkin_canned_plain",
    nameKo: "단호박/펌킨 (캔, 무가당 순수)",
    nameEn: "Pumpkin, canned, without salt",
    aliasesKo: ["단호박", "펌킨", "호박"],
    category: "vegetable",
    preparationNote: "캔제품, 무가당·무첨가 순수 펌킨 퓨레만 해당 (파이용 시즈닝 첨가 제품 아님)",
    sourceDb: "USDA",
    sourceId: "FDC 168439",
    per100g: { kcal: 34, moisturePct: 90.2, crudeProteinPct: 1.1, crudeFatPct: 0.1, crudeFiberPct: 2.9, crudeAshPct: 0.6 },
    petFeedingNote: "소화기 증상(연변/변비) 완화 보조로 흔히 사용. 반드시 '무가당·무첨가 순수 펌킨'만 사용 — 파이용 펌킨필링(설탕, 향신료 첨가)은 절대 금지",
  },
  {
    id: "sweet_potato_raw",
    nameKo: "고구마 (생)",
    nameEn: "Sweet potato, raw",
    aliasesKo: ["고구마"],
    category: "vegetable",
    preparationNote: "생것, 껍질 제외",
    sourceDb: "USDA",
    sourceId: "FDC 168482",
    per100g: { kcal: 86, moisturePct: 77.3, crudeProteinPct: 1.6, crudeFatPct: 0.1, crudeFiberPct: 3.0, crudeAshPct: 1.0 },
    petFeedingNote: "반드시 익혀서 급여 (생 고구마는 소화가 어려움). 껍질 제거 권장",
  },
  {
    id: "sweet_potato_boiled",
    nameKo: "고구마 (삶은것/구운것)",
    nameEn: "Sweet potato, cooked, boiled, without skin",
    aliasesKo: ["삶은고구마", "구운고구마"],
    category: "vegetable",
    preparationNote: "삶은것, 껍질 제외, 조미료 없음",
    sourceDb: "USDA",
    sourceId: "FDC 168484",
    per100g: { kcal: 76, moisturePct: 80.0, crudeProteinPct: 1.4, crudeFatPct: 0.1, crudeFiberPct: 2.5, crudeAshPct: 0.7 },
  },
  {
    id: "spinach_raw",
    nameKo: "시금치 (생)",
    nameEn: "Spinach, raw",
    aliasesKo: ["시금치"],
    category: "vegetable",
    preparationNote: "생것",
    sourceDb: "USDA",
    sourceId: "FDC 168462",
    per100g: { kcal: 23, moisturePct: 91.4, crudeProteinPct: 2.9, crudeFatPct: 0.4, crudeFiberPct: 2.2, crudeAshPct: 1.7 },
    petFeedingNote: "옥살산 함량이 있어 신장결석(특히 옥살산칼슘) 병력이 있는 경우 과다 급여 주의, 소량/가끔 급여",
  },
  {
    id: "green_beans_raw",
    nameKo: "그린빈/꼬투리강낭콩 (생)",
    nameEn: "Green beans, raw",
    aliasesKo: ["그린빈", "꼬투리콩"],
    category: "vegetable",
    preparationNote: "생것",
    sourceDb: "USDA",
    sourceId: "FDC 168409 (근사)",
    per100g: { kcal: 31, moisturePct: 90.3, crudeProteinPct: 1.8, crudeFatPct: 0.2, crudeFiberPct: 2.7, crudeAshPct: 0.7 },
    petFeedingNote: "체중관리용 칼로리 낮은 간식/필러로 흔히 사용됨",
  },
  {
    id: "cucumber_raw",
    nameKo: "오이 (생)",
    nameEn: "Cucumber, raw, with peel",
    aliasesKo: ["오이"],
    category: "vegetable",
    preparationNote: "생것, 껍질 포함",
    sourceDb: "USDA",
    sourceId: "FDC 169225",
    per100g: { kcal: 15, moisturePct: 95.2, crudeProteinPct: 0.7, crudeFatPct: 0.1, crudeFiberPct: 0.5, crudeAshPct: 0.4 },
  },

  // ════════════════════════════════════════════
  // 과일 (Fruit) — 독성 과일(포도 등)은 toxicIngredients.ts에서 별도 관리
  // ════════════════════════════════════════════
  {
    id: "apple_raw_no_seeds",
    nameKo: "사과 (생, 씨/껍질 제외)",
    nameEn: "Apple, raw, without skin",
    aliasesKo: ["사과"],
    category: "fruit",
    preparationNote: "생것, 씨와 껍질 제거 필수",
    sourceDb: "USDA",
    sourceId: "FDC 171689 (근사)",
    per100g: { kcal: 48, moisturePct: 86.7, crudeProteinPct: 0.2, crudeFatPct: 0.1, crudeFiberPct: 1.9, crudeAshPct: 0.2 },
    petFeedingNote: "씨에는 소량의 시안화합물 전구체 존재 — 반드시 씨 제거. 과량 섭취 시 당분으로 인한 소화불량 가능, 소량만 급여",
  },
  {
    id: "banana_raw",
    nameKo: "바나나 (생)",
    nameEn: "Banana, raw",
    aliasesKo: ["바나나"],
    category: "fruit",
    preparationNote: "생것, 껍질 제외",
    sourceDb: "USDA",
    sourceId: "FDC 173944",
    per100g: { kcal: 89, moisturePct: 74.9, crudeProteinPct: 1.1, crudeFatPct: 0.3, crudeFiberPct: 2.6, crudeAshPct: 0.8 },
    petFeedingNote: "당분이 높은 편 — 소량만, 비만/당뇨 경향 있는 경우 제한 권장",
  },
  {
    id: "blueberry_raw",
    nameKo: "블루베리 (생)",
    nameEn: "Blueberries, raw",
    aliasesKo: ["블루베리"],
    category: "fruit",
    preparationNote: "생것",
    sourceDb: "USDA",
    sourceId: "FDC 171711",
    per100g: { kcal: 57, moisturePct: 84.2, crudeProteinPct: 0.7, crudeFatPct: 0.3, crudeFiberPct: 2.4, crudeAshPct: 0.2 },
    petFeedingNote: "항산화물질 함유로 흔히 건강 간식으로 사용됨. 소량씩 급여",
  },
  {
    id: "watermelon_raw_no_seeds",
    nameKo: "수박 (생, 씨/껍질 제외)",
    nameEn: "Watermelon, raw",
    aliasesKo: ["수박"],
    category: "fruit",
    preparationNote: "생것, 씨와 껍질 제거 필수",
    sourceDb: "USDA",
    sourceId: "FDC 167765",
    per100g: { kcal: 30, moisturePct: 91.4, crudeProteinPct: 0.6, crudeFatPct: 0.2, crudeFiberPct: 0.4, crudeAshPct: 0.3 },
    petFeedingNote: "씨는 장폐쇄 위험, 껍질은 소화불량 유발 가능 — 반드시 제거 후 급여",
  },

  // ════════════════════════════════════════════
  // 곡류/전분류 (Grain & Starch)
  // ════════════════════════════════════════════
  {
    id: "white_rice_cooked_plain",
    nameKo: "백미밥 (지은것, 무첨가)",
    nameEn: "White rice, cooked, plain",
    aliasesKo: ["밥", "백미밥", "쌀밥"],
    category: "grain_starch",
    preparationNote: "물로 지은 것, 기름/소금 없음",
    sourceDb: "USDA",
    sourceId: "FDC 168878",
    per100g: { kcal: 130, moisturePct: 68.4, crudeProteinPct: 2.7, crudeFatPct: 0.3, crudeFiberPct: 0.4, crudeAshPct: 0.2 },
    petFeedingNote: "소화기 증상(연변) 시 보조식으로 흔히 사용. 무첨가(소금/기름 없이) 지은 것만 사용",
  },
  {
    id: "oatmeal_cooked_plain",
    nameKo: "오트밀 (조리한것, 무첨가)",
    nameEn: "Oatmeal, cooked, plain, water",
    aliasesKo: ["오트밀", "귀리"],
    category: "grain_starch",
    preparationNote: "물로 조리, 설탕/우유/시즈닝 없음",
    sourceDb: "USDA",
    sourceId: "FDC 173904 (근사)",
    per100g: { kcal: 71, moisturePct: 84.0, crudeProteinPct: 2.5, crudeFatPct: 1.5, crudeFiberPct: 1.7, crudeAshPct: 0.3 },
    petFeedingNote: "곡물 알러지가 없는 개체에서 식이섬유 보충용으로 사용 가능. 인스턴트 오트밀(설탕/향료 첨가) 제품은 사용 금지",
  },
  {
    id: "plain_pasta_cooked",
    nameKo: "파스타/면 (삶은것, 무첨가)",
    nameEn: "Pasta, cooked, plain, unenriched",
    aliasesKo: ["파스타", "면"],
    category: "grain_starch",
    preparationNote: "삶은것, 소스/소금 없음",
    sourceDb: "USDA",
    sourceId: "FDC 169738 (근사)",
    per100g: { kcal: 131, moisturePct: 67.0, crudeProteinPct: 5.0, crudeFatPct: 0.9, crudeFiberPct: 1.8, crudeAshPct: 0.5 },
  },
];

// ────────────────────────────────────────────────────────────
// 검색 함수 (자동완성용)
// ────────────────────────────────────────────────────────────
export function searchIngredients(searchTerm: string): RawIngredient[] {
  const normalized = searchTerm.trim().toLowerCase();
  if (normalized.length === 0) return [];

  return rawIngredientDictionary.filter(ingredient => {
    const namesToCheck = [ingredient.nameKo, ingredient.nameEn, ...(ingredient.aliasesKo ?? [])];
    return namesToCheck.some(name => name.toLowerCase().includes(normalized));
  });
}

export function getIngredientById(id: string): RawIngredient | undefined {
  return rawIngredientDictionary.find(i => i.id === id);
}

export function listIngredientsByCategory(category: IngredientCategory): RawIngredient[] {
  return rawIngredientDictionary.filter(i => i.category === category);
}