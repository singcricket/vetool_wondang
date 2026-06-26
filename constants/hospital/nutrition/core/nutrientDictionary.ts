// core/nutrientDictionary.ts

export type NutrientCategory =
  | "macronutrient"      // 단백질, 지방
  | "fatty_acid"          // 오메가3/6 계열
  | "amino_acid"          // 필수 아미노산
  | "mineral"             // 다량/미량 무기질
  | "vitamin"             // 지용성/수용성 비타민
  | "vitamin_like";       // 타우린, 콜린 등 비타민 유사물질

export type NutrientUnit =
  | "g/100gDM"      // g per 100g dry matter
  | "mg/100gDM"
  | "ug/100gDM"     // µg per 100g dry matter
  | "IU/100gDM";

export interface NutrientDefinition {
  id: string;                  // 코드상 고유 키
  nameKo: string;               // 한글 표기
  nameEn: string;               // FEDIAF 원문 표기
  category: NutrientCategory;
  unit: NutrientUnit;           // 기본 저장 단위 (100g DM 기준 통일)
  appliesTo: ("dog" | "cat")[]; // 어느 종에 적용되는 항목인지
  essentialNote?: string;       // 비고 (예: "고양이 전용 필수")
}

export const nutrientDictionary: NutrientDefinition[] = [

  // ───────────── 주요 영양소 (Major nutrients) ─────────────
  { id: "crude_protein", nameKo: "조단백질", nameEn: "Crude Protein", category: "macronutrient", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "crude_fat",     nameKo: "조지방",   nameEn: "Crude Fat",     category: "macronutrient", unit: "g/100gDM", appliesTo: ["dog", "cat"] },

  // ───────────── 필수 지방산 (Fatty acids) ─────────────
  { id: "linoleic_acid",      nameKo: "리놀레산 (ω-6)",       nameEn: "Linoleic acid (ω-6)",      category: "fatty_acid", unit: "g/100gDM",  appliesTo: ["dog", "cat"] },
  { id: "arachidonic_acid",   nameKo: "아라키돈산 (ω-6)",     nameEn: "Arachidonic acid (ω-6)",   category: "fatty_acid", unit: "mg/100gDM", appliesTo: ["cat"], essentialNote: "고양이 필수 (개는 자체 합성 가능)" },
  { id: "alpha_linolenic_acid", nameKo: "알파리놀렌산 (ω-3)", nameEn: "Alpha-linolenic acid (ω-3)", category: "fatty_acid", unit: "g/100gDM", appliesTo: ["dog", "cat"], essentialNote: "성장기/번식기 필수" },
  { id: "epa_dha",            nameKo: "EPA+DHA (ω-3)",       nameEn: "EPA + DHA (ω-3)",          category: "fatty_acid", unit: "g/100gDM",  appliesTo: ["dog", "cat"], essentialNote: "성장기/번식기 필수" },

  // ───────────── 필수 아미노산 (Amino acids) ─────────────
  { id: "arginine",       nameKo: "아르기닌",   nameEn: "Arginine",       category: "amino_acid", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "histidine",      nameKo: "히스티딘",   nameEn: "Histidine",      category: "amino_acid", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "isoleucine",     nameKo: "이소루신",   nameEn: "Isoleucine",     category: "amino_acid", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "leucine",        nameKo: "류신",       nameEn: "Leucine",        category: "amino_acid", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "lysine",         nameKo: "라이신",     nameEn: "Lysine",         category: "amino_acid", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "methionine",     nameKo: "메티오닌",   nameEn: "Methionine",     category: "amino_acid", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "methionine_cystine", nameKo: "메티오닌+시스틴", nameEn: "Methionine + Cystine", category: "amino_acid", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "phenylalanine",  nameKo: "페닐알라닌", nameEn: "Phenylalanine",  category: "amino_acid", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "phenylalanine_tyrosine", nameKo: "페닐알라닌+타이로신", nameEn: "Phenylalanine + Tyrosine", category: "amino_acid", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "threonine",      nameKo: "트레오닌",   nameEn: "Threonine",      category: "amino_acid", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "tryptophan",     nameKo: "트립토판",   nameEn: "Tryptophan",     category: "amino_acid", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "valine",         nameKo: "발린",       nameEn: "Valine",         category: "amino_acid", unit: "g/100gDM", appliesTo: ["dog", "cat"] },

  // ───────────── 비타민 유사물질 (Vitamin-like substances) ─────────────
  { id: "taurine",  nameKo: "타우린", nameEn: "Taurine",  category: "vitamin_like", unit: "g/100gDM",  appliesTo: ["cat"], essentialNote: "고양이 필수 (개는 일반적으로 자체 합성)" },
  { id: "choline",  nameKo: "콜린",   nameEn: "Choline",  category: "vitamin_like", unit: "mg/100gDM", appliesTo: ["dog", "cat"] },

  // ───────────── 다량 무기질 (Macro-minerals) ─────────────
  { id: "calcium",     nameKo: "칼슘",   nameEn: "Calcium",     category: "mineral", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "phosphorus",  nameKo: "인",     nameEn: "Phosphorus",  category: "mineral", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "ca_p_ratio",  nameKo: "칼슘:인 비율", nameEn: "Ca/P ratio", category: "mineral", unit: "g/100gDM", appliesTo: ["dog", "cat"], essentialNote: "비율 항목 — min/max 대신 ratio 필드로 별도 처리 권장" },
  { id: "potassium",   nameKo: "칼륨",   nameEn: "Potassium",   category: "mineral", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "sodium",      nameKo: "나트륨", nameEn: "Sodium",      category: "mineral", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "chloride",    nameKo: "염소",   nameEn: "Chloride",    category: "mineral", unit: "g/100gDM", appliesTo: ["dog", "cat"] },
  { id: "magnesium",   nameKo: "마그네슘", nameEn: "Magnesium", category: "mineral", unit: "g/100gDM", appliesTo: ["dog", "cat"] },

  // ───────────── 미량 무기질 (Trace elements) ─────────────
  { id: "copper",     nameKo: "구리",   nameEn: "Copper",     category: "mineral", unit: "mg/100gDM", appliesTo: ["dog", "cat"] },
  { id: "iodine",     nameKo: "요오드", nameEn: "Iodine",     category: "mineral", unit: "mg/100gDM", appliesTo: ["dog", "cat"] },
  { id: "iron",       nameKo: "철",     nameEn: "Iron",       category: "mineral", unit: "mg/100gDM", appliesTo: ["dog", "cat"] },
  { id: "manganese",  nameKo: "망간",   nameEn: "Manganese",  category: "mineral", unit: "mg/100gDM", appliesTo: ["dog", "cat"] },
  { id: "selenium",   nameKo: "셀레늄", nameEn: "Selenium",   category: "mineral", unit: "ug/100gDM", appliesTo: ["dog", "cat"], essentialNote: "습식/건식 사료에 따라 기준치 다름" },
  { id: "zinc",       nameKo: "아연",   nameEn: "Zinc",       category: "mineral", unit: "mg/100gDM", appliesTo: ["dog", "cat"] },

  // ───────────── 지용성 비타민 (Fat-soluble vitamins) ─────────────
  { id: "vitamin_a", nameKo: "비타민 A", nameEn: "Vitamin A", category: "vitamin", unit: "IU/100gDM", appliesTo: ["dog", "cat"] },
  { id: "vitamin_d", nameKo: "비타민 D", nameEn: "Vitamin D", category: "vitamin", unit: "IU/100gDM", appliesTo: ["dog", "cat"] },
  { id: "vitamin_e", nameKo: "비타민 E", nameEn: "Vitamin E", category: "vitamin", unit: "IU/100gDM", appliesTo: ["dog", "cat"] },
  { id: "vitamin_k", nameKo: "비타민 K", nameEn: "Vitamin K", category: "vitamin", unit: "ug/100gDM", appliesTo: ["dog", "cat"], essentialNote: "통상 보충 불필요, 항생제 투여 시 예외" },

  // ───────────── 수용성 비타민 (Water-soluble vitamins) ─────────────
  { id: "vitamin_b1", nameKo: "비타민 B1 (티아민)",     nameEn: "Vitamin B1 (Thiamine)",        category: "vitamin", unit: "mg/100gDM", appliesTo: ["dog", "cat"] },
  { id: "vitamin_b2", nameKo: "비타민 B2 (리보플라빈)", nameEn: "Vitamin B2 (Riboflavin)",      category: "vitamin", unit: "mg/100gDM", appliesTo: ["dog", "cat"] },
  { id: "vitamin_b3", nameKo: "비타민 B3 (니아신)",     nameEn: "Vitamin B3 (Niacin)",          category: "vitamin", unit: "mg/100gDM", appliesTo: ["dog", "cat"] },
  { id: "vitamin_b5", nameKo: "비타민 B5 (판토텐산)",   nameEn: "Vitamin B5 (Pantothenic acid)",category: "vitamin", unit: "mg/100gDM", appliesTo: ["dog", "cat"] },
  { id: "vitamin_b6", nameKo: "비타민 B6 (피리독신)",   nameEn: "Vitamin B6 (Pyridoxine)",      category: "vitamin", unit: "mg/100gDM", appliesTo: ["dog", "cat"] },
  { id: "vitamin_b7", nameKo: "비타민 B7 (비오틴)",     nameEn: "Vitamin B7 (Biotin)",          category: "vitamin", unit: "ug/100gDM", appliesTo: ["cat"], essentialNote: "FEDIAF 개 기준표엔 수치 없음(-), 고양이만 수치 존재" },
  { id: "vitamin_b9", nameKo: "비타민 B9 (엽산)",       nameEn: "Vitamin B9 (Folic acid)",      category: "vitamin", unit: "ug/100gDM", appliesTo: ["dog", "cat"] },
  { id: "vitamin_b12",nameKo: "비타민 B12 (코발라민)",  nameEn: "Vitamin B12 (Cyanocobalamin)", category: "vitamin", unit: "ug/100gDM", appliesTo: ["dog", "cat"] },
];