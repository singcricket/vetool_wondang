// ============================================================
// cytology-diagnosis.ts — Veterinary Cytology Diagnosis Engine
// ============================================================

import type {
  CytologyDiagnosisRule,
  CytologyDiagnosisResult,
  CytologyEngineOutput,
  CytologySign,
  CytologySampleType,
} from './cytology-types'
import { cytologyRoutineMap } from './cytology-routine'
import { cytologyCellTypes } from './cytology-specialist'

// ── Diagnosis Rules ──────────────────────────────────────────
export const cytologyDiagnosisRules: CytologyDiagnosisRule[] = [
  // ── OTIC ─────────────────────────────────────────────────
  {
    diagnosisId: 'otic_malassezia_otitis',
    nameKo: '말라세지아 외이염',
    nameEn: 'Malassezia Otitis',
    abbreviation: 'M-otitis',
    category: 'infection',
    malignancyGrade: 'benign',
    applicableSampleTypes: ['otic'],
    requiredSigns: ['otic_malassezia_few'],
    supportingSigns: ['otic_malassezia_moderate', 'otic_malassezia_many', 'otic_neutrophils_present'],
    baseConfidence: 55,
    supportingWeight: 15,
    maxConfidence: 95,
    descriptionKo:
      '말라세지아(Malassezia pachydermatis)에 의한 효모성 외이염. 땅콩 모양의 출아형 효모균이 특징.',
    treatmentHintKo: '국소 항진균제(miconazole, clotrimazole). 전신 itraconazole 병용 시 효과적.',
    additionalTestsKo: ['피부도말 추가 검사 고려 (피부 말라세지아 피부염 동반 여부)'],
    ddx: ['otic_bacterial_otitis', 'otic_mixed_otitis'],
  },
  {
    diagnosisId: 'otic_bacterial_otitis',
    nameKo: '세균성 외이염',
    nameEn: 'Bacterial Otitis',
    abbreviation: 'B-otitis',
    category: 'infection',
    malignancyGrade: 'benign',
    applicableSampleTypes: ['otic'],
    requiredSigns: ['otic_cocci_few'],
    supportingSigns: ['otic_cocci_moderate', 'otic_cocci_many', 'otic_rods_few', 'otic_neutrophils_present', 'otic_degenerate_neutrophils'],
    baseConfidence: 55,
    supportingWeight: 10,
    maxConfidence: 95,
    descriptionKo: '세균성 외이염. 구균(Staphylococcus, Streptococcus) 또는 간균(Pseudomonas, Proteus) 감염.',
    treatmentHintKo: '내성 고려하여 배양·감수성 검사 후 적절한 국소 항생제 선택.',
    additionalTestsKo: ['배양·감수성 검사 권장 (특히 간균 다수 시)'],
    ddx: ['otic_malassezia_otitis', 'otic_mixed_otitis'],
  },
  {
    diagnosisId: 'otic_rod_otitis',
    nameKo: '간균성 외이염 (Pseudomonas 의심)',
    nameEn: 'Rod-type Bacterial Otitis',
    abbreviation: 'Rod-otitis',
    category: 'infection',
    malignancyGrade: 'benign',
    applicableSampleTypes: ['otic'],
    requiredSigns: ['otic_rods_few'],
    supportingSigns: ['otic_rods_moderate', 'otic_rods_many', 'otic_degenerate_neutrophils', 'otic_neutrophils_many'],
    baseConfidence: 55,
    supportingWeight: 12,
    maxConfidence: 93,
    descriptionKo: '간균(Pseudomonas aeruginosa, Proteus mirabilis 등) 우세 외이염. 내성 가능성 높음.',
    treatmentHintKo: '배양·감수성 후 항생제 선택 필수. fluoroquinolone 계열 or aminoglycoside 국소 도포.',
    additionalTestsKo: ['배양·감수성 검사 필수'],
  },
  {
    diagnosisId: 'otic_mixed_otitis',
    nameKo: '혼합 외이염 (세균+효모)',
    nameEn: 'Mixed Otitis (Bacteria + Yeast)',
    category: 'infection',
    malignancyGrade: 'benign',
    applicableSampleTypes: ['otic'],
    requiredSigns: ['otic_mixed_bacteria'],
    supportingSigns: ['otic_malassezia_few', 'otic_malassezia_moderate', 'otic_neutrophils_present'],
    baseConfidence: 65,
    supportingWeight: 10,
    maxConfidence: 90,
    descriptionKo: '세균과 효모가 혼합된 복합 외이염.',
    treatmentHintKo: '항균 + 항진균 복합 국소 제제 사용.',
  },
  {
    diagnosisId: 'otic_mite_infestation',
    nameKo: '귀 진드기 감염 (Otodectes)',
    nameEn: 'Ear Mite Infestation',
    category: 'parasitic',
    applicableSampleTypes: ['otic'],
    requiredSigns: ['otic_mites_present'],
    supportingSigns: ['otic_cocci_few', 'otic_malassezia_few'],
    baseConfidence: 90,
    supportingWeight: 5,
    maxConfidence: 98,
    descriptionKo: 'Otodectes cynotis에 의한 귀 진드기 감염. 고양이에서 더 흔함.',
    treatmentHintKo: 'Selamectin, ivermectin, milbemycin 국소 또는 전신 투여. 동거동물 동시 치료.',
  },
  {
    diagnosisId: 'otic_normal',
    nameKo: '외이도 정상 세포상',
    nameEn: 'Normal Otic Cytology',
    category: 'normal',
    applicableSampleTypes: ['otic'],
    requiredSigns: [],
    supportingSigns: [],
    exclusionSigns: [
      'otic_malassezia_few', 'otic_malassezia_moderate', 'otic_malassezia_many',
      'otic_cocci_few', 'otic_cocci_moderate', 'otic_cocci_many',
      'otic_rods_few', 'otic_rods_moderate', 'otic_rods_many',
      'otic_neutrophils_present', 'otic_neutrophils_many',
      'otic_mites_present', 'otic_candida_present', 'otic_mixed_bacteria',
    ],
    baseConfidence: 80,
    supportingWeight: 0,
    maxConfidence: 80,
    descriptionKo: '외이도 내 정상 세포 구성. 소수의 각화 세포 및 세균이 관찰될 수 있음.',
  },

  // ── SKIN ─────────────────────────────────────────────────
  {
    diagnosisId: 'skin_staph_pyoderma',
    nameKo: '세균성 피부염 (Staphylococcal Pyoderma)',
    nameEn: 'Bacterial Pyoderma',
    category: 'infection',
    malignancyGrade: 'benign',
    applicableSampleTypes: ['skin_impression', 'skin_exudate'],
    requiredSigns: ['skin_cocci_moderate'],
    supportingSigns: ['skin_cocci_many', 'skin_neutrophils_present', 'skin_neutrophils_many', 'skin_degenerate_neutrophils', 'skin_acantholytic_cells'],
    baseConfidence: 70,
    supportingWeight: 8,
    maxConfidence: 95,
    descriptionKo: '포도상구균(Staphylococcus pseudintermedius) 우세 세균성 피부염.',
    treatmentHintKo: 'Cefalexin, amoxicillin-clavulanate 또는 배양·감수성 후 항생제 선택.',
    additionalTestsKo: ['배양·감수성 검사 권장 (재발성/내성 의심 시)'],
  },
  {
    diagnosisId: 'skin_malassezia_dermatitis',
    nameKo: '말라세지아 피부염',
    nameEn: 'Malassezia Dermatitis',
    category: 'infection',
    malignancyGrade: 'benign',
    applicableSampleTypes: ['skin_impression', 'skin_exudate'],
    requiredSigns: ['skin_malassezia_moderate'],
    supportingSigns: ['skin_malassezia_few', 'skin_malassezia_many', 'skin_neutrophils_present'],
    baseConfidence: 70,
    supportingWeight: 10,
    maxConfidence: 95,
    descriptionKo: '말라세지아 효모균에 의한 피부염. 피부 습윤 부위(사타구니, 발가락 사이)에 호발.',
    treatmentHintKo: 'Ketoconazole, itraconazole 전신 투여. 국소 항진균 샴푸 병행.',
  },
  {
    diagnosisId: 'skin_eosinophilic_dermatitis',
    nameKo: '호산구성 피부염',
    nameEn: 'Eosinophilic Dermatitis',
    category: 'inflammation',
    applicableSampleTypes: ['skin_impression', 'skin_exudate'],
    requiredSigns: ['skin_eosinophils_present'],
    supportingSigns: ['skin_eosinophils_many'],
    exclusionSigns: ['skin_neutrophils_many'],
    baseConfidence: 65,
    supportingWeight: 12,
    maxConfidence: 88,
    descriptionKo: '호산구 우세 피부 염증. 알레르기, 기생충, 호산구성 육아종 복합체 고려.',
    treatmentHintKo: '알레르기 원인 탐색. 기생충 구제 후 스테로이드 치료.',
    additionalTestsKo: ['알레르기 검사', '기생충 구제 효과 평가'],
  },
  {
    diagnosisId: 'skin_pemphigus_foliaceus',
    nameKo: '낙엽상 천포창 의심 (Pemphigus Foliaceus)',
    nameEn: 'Pemphigus Foliaceus (suspect)',
    category: 'immune_mediated',
    applicableSampleTypes: ['skin_impression', 'skin_exudate'],
    requiredSigns: ['skin_acantholytic_cells'],
    supportingSigns: ['skin_neutrophils_many', 'skin_cocci_few'],
    baseConfidence: 60,
    supportingWeight: 15,
    maxConfidence: 85,
    descriptionKo: '각화세포 분리(Acantholytic cells) 관찰. 낙엽상 천포창 의심. 조직검사로 확진 필요.',
    treatmentHintKo: 'Immunosuppressive therapy (prednisolone ± azathioprine).',
    additionalTestsKo: ['피부 조직생검 (확진 필수)'],
  },
  {
    diagnosisId: 'skin_granulomatous',
    nameKo: '육아종성 염증',
    nameEn: 'Granulomatous Inflammation',
    category: 'inflammation',
    applicableSampleTypes: ['skin_impression', 'skin_exudate', 'fna_skin'],
    requiredSigns: ['skin_giant_cells'],
    supportingSigns: ['skin_macrophages_present', 'skin_plasma_cells'],
    baseConfidence: 65,
    supportingWeight: 10,
    maxConfidence: 88,
    descriptionKo: '거대세포 및 대식세포 주체의 육아종성 염증. 진균 감염, 이물 반응, Leishmania 고려.',
    additionalTestsKo: ['진균 배양', 'Leishmania PCR'],
  },

  // ── FECAL ────────────────────────────────────────────────
  {
    diagnosisId: 'fecal_bacterial_overgrowth',
    nameKo: '세균 과증식 (Bacterial Overgrowth)',
    nameEn: 'Fecal Bacterial Overgrowth',
    category: 'infection',
    applicableSampleTypes: ['fecal'],
    requiredSigns: ['fecal_bacteria_overgrowth'],
    supportingSigns: ['fecal_rods_excess', 'fecal_cocci_excess', 'fecal_spiral_bacteria', 'fecal_neutrophils_present'],
    baseConfidence: 65,
    supportingWeight: 8,
    maxConfidence: 88,
    descriptionKo: '분변 내 세균의 비정상적 과증식. SIBO(Small Intestinal Bacterial Overgrowth) 또는 장염 연관.',
    treatmentHintKo: 'Metronidazole, tylosin. 원인 질환 파악 및 치료.',
  },
  {
    diagnosisId: 'fecal_clostridium',
    nameKo: '클로스트리디움 과증식',
    nameEn: 'Clostridium Overgrowth',
    category: 'infection',
    applicableSampleTypes: ['fecal'],
    requiredSigns: ['fecal_spores_clostridium'],
    supportingSigns: ['fecal_neutrophils_present', 'fecal_rbc_present'],
    baseConfidence: 65,
    supportingWeight: 10,
    maxConfidence: 88,
    descriptionKo: 'Clostridium perfringens 내생포자 과증식 의심. 혈성 설사 동반 시 심각.',
    treatmentHintKo: 'Metronidazole, amoxicillin. 고섬유질 식이.',
    additionalTestsKo: ['Clostridium 독소 ELISA'],
  },
  {
    diagnosisId: 'fecal_giardia',
    nameKo: '지아르디아 감염',
    nameEn: 'Giardia Infection',
    category: 'parasitic',
    applicableSampleTypes: ['fecal'],
    requiredSigns: ['fecal_giardia'],
    supportingSigns: [],
    baseConfidence: 85,
    supportingWeight: 5,
    maxConfidence: 95,
    descriptionKo: 'Giardia duodenalis 영양형(trophozoite) 또는 포낭(cyst) 확인.',
    treatmentHintKo: 'Metronidazole 또는 fenbendazole 5일 이상. 환경 소독.',
  },
  {
    diagnosisId: 'fecal_coccidiosis',
    nameKo: '콕시디아 감염',
    nameEn: 'Coccidiosis',
    category: 'parasitic',
    applicableSampleTypes: ['fecal'],
    requiredSigns: ['fecal_isospora'],
    supportingSigns: ['fecal_neutrophils_present'],
    baseConfidence: 88,
    supportingWeight: 5,
    maxConfidence: 96,
    descriptionKo: 'Isospora (Cystoisospora) spp. 오오시스트 확인. 어린 동물에서 빈번.',
    treatmentHintKo: 'Trimethoprim-sulfamethoxazole, toltrazuril.',
  },
  {
    diagnosisId: 'fecal_roundworm',
    nameKo: '회충 감염 (Toxocara)',
    nameEn: 'Toxocara Infection',
    category: 'parasitic',
    applicableSampleTypes: ['fecal'],
    requiredSigns: ['fecal_toxocara'],
    supportingSigns: [],
    baseConfidence: 90,
    supportingWeight: 0,
    maxConfidence: 96,
    descriptionKo: 'Toxocara canis/cati 충란 확인.',
    treatmentHintKo: 'Pyrantel pamoate, fenbendazole, milbemycin.',
  },
  {
    diagnosisId: 'fecal_whipworm',
    nameKo: '편충 감염 (Trichuris)',
    nameEn: 'Whipworm Infection',
    category: 'parasitic',
    applicableSampleTypes: ['fecal'],
    requiredSigns: ['fecal_trichuris'],
    supportingSigns: ['fecal_rbc_present'],
    baseConfidence: 90,
    supportingWeight: 5,
    maxConfidence: 96,
    descriptionKo: 'Trichuris vulpis 충란 확인. 대장 호발.',
    treatmentHintKo: 'Fenbendazole 3일 요법. 환경 오염 관리.',
  },

  // ── SPECIALIST — INFLAMMATION ─────────────────────────────
  {
    diagnosisId: 'spec_septic_peritonitis',
    nameKo: '패혈성 복막염 의심',
    nameEn: 'Septic Peritonitis (suspect)',
    category: 'infection',
    applicableSampleTypes: ['effusion'],
    requiredSigns: ['infl_neutrophilic_septic'],
    supportingSigns: ['eff_septic', 'spec_background_bacteria', 'infl_neutrophilic_pure'],
    baseConfidence: 80,
    supportingWeight: 10,
    maxConfidence: 95,
    descriptionKo: '변성 호중구 + 세균 확인. 패혈성 복막염. 응급 처치 필요.',
    treatmentHintKo: '즉시 외과적 처치(복막 세척) + 광범위 항생제 전신 투여.',
    additionalTestsKo: ['삼출액 배양·감수성', '혈액 배양', 'CBC, 화학검사'],
  },
  {
    diagnosisId: 'spec_chylothorax',
    nameKo: '유미흉 (Chylothorax)',
    nameEn: 'Chylothorax',
    category: 'inflammation',
    applicableSampleTypes: ['effusion'],
    requiredSigns: ['eff_chylous'],
    supportingSigns: [],
    baseConfidence: 80,
    supportingWeight: 0,
    maxConfidence: 90,
    descriptionKo: '유미 흉수. 소림프구 + 유지방 소구 확인.',
    treatmentHintKo: 'Low-fat diet, rutin. 외과적 흉관결찰 고려.',
    additionalTestsKo: ['흉수 중성지방/콜레스테롤 비율'],
  },
  {
    diagnosisId: 'spec_mast_cell_tumor',
    nameKo: '비만세포종 (Mast Cell Tumor)',
    nameEn: 'Mast Cell Tumor',
    category: 'neoplasia',
    malignancyGrade: 'intermediate',
    applicableSampleTypes: ['fna_skin', 'fna_lymph', 'fna_organ'],
    requiredSigns: ['rc_mast_cell_granules'],
    supportingSigns: ['rc_mast_cell_degranulated', 'infl_eosinophilic', 'spec_high_cellularity'],
    baseConfidence: 80,
    supportingWeight: 8,
    maxConfidence: 95,
    descriptionKo: '자색 과립 함유 비만세포 다수. 비만세포종. Kiupel grading 조직검사로 확정.',
    treatmentHintKo: '외과적 완전 절제 + 조직검사(Grade 결정). 고등급은 보조화학요법.',
    additionalTestsKo: ['조직생검 (Kiupel grading)', 'c-KIT mutation 검사', 'Regional LN FNA'],
  },
  {
    diagnosisId: 'spec_lymphoma',
    nameKo: '림프종 (Lymphoma)',
    nameEn: 'Lymphoma',
    category: 'neoplasia',
    malignancyGrade: 'high',
    applicableSampleTypes: ['fna_lymph', 'fna_organ', 'effusion'],
    requiredSigns: ['rc_lymphoblasts'],
    supportingSigns: ['ln_lymphoblasts_many', 'ln_monomorphic_population', 'spec_high_cellularity'],
    baseConfidence: 75,
    supportingWeight: 10,
    maxConfidence: 93,
    descriptionKo: '림프모세포 우세 단형성 세포군. 림프종 고의심. 조직검사 + 면역표현형 분류 필요.',
    treatmentHintKo: 'CHOP protocol 화학요법. 세포 타입에 따라 프로토콜 조정.',
    additionalTestsKo: ['조직생검', 'PARR(PCR for Antigen Receptor Rearrangement)', 'Flow cytometry'],
  },
  {
    diagnosisId: 'spec_tvt',
    nameKo: '전염성 성병 종양 (TVT)',
    nameEn: 'Transmissible Venereal Tumor',
    abbreviation: 'TVT',
    category: 'neoplasia',
    malignancyGrade: 'low',
    applicableSampleTypes: ['fna_skin', 'fna_organ'],
    requiredSigns: ['rc_tvt_cells'],
    supportingSigns: [],
    baseConfidence: 88,
    supportingWeight: 5,
    maxConfidence: 96,
    descriptionKo: '둥근 세포, 세포질 내 공포(vacuole) 특징적. TVT. Vincristine 단독 요법에 매우 잘 반응.',
    treatmentHintKo: 'Vincristine 주 1회 × 4-6회. 예후 양호.',
  },
  {
    diagnosisId: 'spec_carcinoma',
    nameKo: '암종 (Carcinoma)',
    nameEn: 'Carcinoma',
    category: 'neoplasia',
    malignancyGrade: 'high',
    applicableSampleTypes: ['fna_skin', 'fna_lymph', 'fna_organ', 'effusion'],
    requiredSigns: ['epi_cohesive_clusters'],
    supportingSigns: ['epi_high_nc_ratio', 'epi_prominent_nucleoli', 'epi_mitoses', 'epi_multinucleation', 'malig_criteria_1', 'malig_criteria_2', 'malig_criteria_3', 'malig_criteria_4', 'malig_criteria_5'],
    baseConfidence: 60,
    supportingWeight: 8,
    maxConfidence: 92,
    descriptionKo: '상피세포 기원 악성 종양. 다핵 이형성 + 높은 N:C 비 + 뚜렷한 핵소체 확인.',
    treatmentHintKo: '외과적 절제 ± 화학요법 ± 방사선요법. 종양 유형에 따라 다름.',
    additionalTestsKo: ['조직생검 (확진)', '면역화학조직 검사', 'Staging (흉부방사선, 복부초음파)'],
  },
  {
    diagnosisId: 'spec_sarcoma',
    nameKo: '육종 (Sarcoma)',
    nameEn: 'Sarcoma',
    category: 'neoplasia',
    malignancyGrade: 'high',
    applicableSampleTypes: ['fna_skin', 'fna_organ'],
    requiredSigns: ['mes_spindle_cells'],
    supportingSigns: ['mes_nuclear_pleomorphism', 'mes_high_nc_ratio', 'mes_mitoses', 'malig_criteria_3'],
    baseConfidence: 55,
    supportingWeight: 10,
    maxConfidence: 88,
    descriptionKo: '방추형 간엽세포 기원 악성 종양. 세포학적 진단 한계 — 조직검사 필수.',
    additionalTestsKo: ['조직생검 (필수)', '면역화학조직 검사'],
  },
  {
    diagnosisId: 'spec_lipoma',
    nameKo: '지방종 (Lipoma)',
    nameEn: 'Lipoma',
    category: 'neoplasia',
    malignancyGrade: 'benign',
    applicableSampleTypes: ['fna_skin'],
    requiredSigns: ['mes_lipid_vacuoles'],
    supportingSigns: [],
    exclusionSigns: ['mes_nuclear_pleomorphism', 'mes_mitoses'],
    baseConfidence: 80,
    supportingWeight: 5,
    maxConfidence: 93,
    descriptionKo: '성숙 지방세포. 핵이형성 없음. 양성 지방종.',
    treatmentHintKo: '크기가 크거나 성장하는 경우 외과적 절제.',
  },
  {
    diagnosisId: 'spec_reactive_lymph_node',
    nameKo: '반응성 림프절 증식',
    nameEn: 'Reactive Lymph Node Hyperplasia',
    category: 'hyperplasia',
    applicableSampleTypes: ['fna_lymph'],
    requiredSigns: ['ln_reactive_pattern'],
    supportingSigns: ['rc_plasma_cells', 'ln_plasma_cells_many'],
    exclusionSigns: ['rc_lymphoblasts', 'ln_monomorphic_population'],
    baseConfidence: 70,
    supportingWeight: 8,
    maxConfidence: 88,
    descriptionKo: '소형 성숙 림프구 + 형질세포 + 다형성 세포군. 반응성 증식.',
    treatmentHintKo: '기저 감염/염증 원인 파악.',
  },
  {
    diagnosisId: 'spec_hepatic_vacuolar',
    nameKo: '간 공포성 변성',
    nameEn: 'Hepatic Vacuolar Hepatopathy',
    category: 'hyperplasia',
    applicableSampleTypes: ['fna_organ'],
    requiredSigns: ['liver_vacuolation'],
    supportingSigns: ['liver_hepatocytes', 'liver_bile_pigment'],
    baseConfidence: 65,
    supportingWeight: 10,
    maxConfidence: 85,
    descriptionKo: '간세포 세포질 내 공포(당원 또는 지방). 스테로이드 간병증, 당뇨, 갑상선 기능 저하 고려.',
    additionalTestsKo: ['혈청 화학검사 (ALP, ALT)', '담즙산 검사', '부신기능검사'],
  },
  {
    diagnosisId: 'spec_csf_normal',
    nameKo: '뇌척수액 정상 세포상',
    nameEn: 'Normal CSF Cytology',
    category: 'normal',
    applicableSampleTypes: ['csf'],
    requiredSigns: [],
    supportingSigns: [],
    exclusionSigns: ['infl_neutrophilic_pure', 'infl_macrophagic', 'spec_high_cellularity'],
    baseConfidence: 75,
    supportingWeight: 0,
    maxConfidence: 85,
    descriptionKo: '정상 CSF 세포상. 단핵구 소수 관찰.',
  },
  {
    diagnosisId: 'spec_csf_meningitis',
    nameKo: '수막염 (Meningitis)',
    nameEn: 'Meningitis',
    category: 'inflammation',
    applicableSampleTypes: ['csf'],
    requiredSigns: ['infl_neutrophilic_pure'],
    supportingSigns: ['infl_neutrophilic_septic', 'spec_background_bacteria', 'spec_high_protein'],
    baseConfidence: 70,
    supportingWeight: 10,
    maxConfidence: 92,
    descriptionKo: 'CSF 내 호중구 우세 세포증. 세균성 수막염 의심.',
    treatmentHintKo: '즉시 광범위 항생제 전신 투여. CSF 배양·감수성.',
    additionalTestsKo: ['CSF 배양·감수성', 'MRI/CT'],
  },
  {
    diagnosisId: 'spec_bal_normal',
    nameKo: '기관지폐포세척액 정상 세포상',
    nameEn: 'Normal BAL Cytology',
    category: 'normal',
    applicableSampleTypes: ['bal'],
    requiredSigns: [],
    supportingSigns: [],
    exclusionSigns: ['infl_eosinophilic', 'infl_neutrophilic_pure', 'spec_background_bacteria'],
    baseConfidence: 70,
    supportingWeight: 0,
    maxConfidence: 80,
    descriptionKo: '정상 BAL 세포상. 대식세포 주체, 소량의 림프구.',
  },
  {
    diagnosisId: 'spec_feline_asthma',
    nameKo: '고양이 천식 / 호산구성 기관지폐렴',
    nameEn: 'Feline Asthma / Eosinophilic Bronchopneumonia',
    category: 'inflammation',
    applicableSampleTypes: ['bal'],
    requiredSigns: ['infl_eosinophilic'],
    supportingSigns: ['ln_eosinophils_many'],
    baseConfidence: 70,
    supportingWeight: 12,
    maxConfidence: 90,
    descriptionKo: 'BAL 내 호산구 >10%. 고양이 천식 또는 호산구성 기관지폐렴. 기생충 감염 배제 후 진단.',
    treatmentHintKo: 'Prednisolone ± bronchodilator. 흡입 스테로이드 고려.',
    additionalTestsKo: ['분변 기생충 검사', '심장사상충 검사', '흉부방사선'],
  },
]

// Maps Step 1 quality field values (hardcoded in specialist form UI) to signs
const STEP1_QUALITY_SIGN_MAP: Record<string, Record<string, CytologySign>> = {
  sq_cellularity: { low: 'spec_low_cellularity', high: 'spec_high_cellularity' },
  sq_hemodilution: { severe: 'spec_hemodilution_severe' },
  sq_necrosis: { present: 'spec_necrosis' },
}

// ── Sign Collector ────────────────────────────────────────────
export function collectCytologySigns(
  findings: Record<string, string | string[]>,
  sampleType: CytologySampleType,
): CytologySign[] {
  const signs = new Set<CytologySign>()
  const sampleDef = cytologyRoutineMap[sampleType]

  // Build identified cell set once — used to filter specialist morphTest lookups.
  // If 'identified_cells' key exists, only signs from those cells are active.
  // If the key is absent (routine forms, old data), no filter is applied.
  const identifiedCellsRaw = findings['identified_cells']
  const identifiedCellIds: Set<string> | null =
    identifiedCellsRaw != null
      ? new Set(Array.isArray(identifiedCellsRaw) ? identifiedCellsRaw : [identifiedCellsRaw])
      : null

  for (const [testId, raw] of Object.entries(findings)) {
    if (!raw) continue
    const values = Array.isArray(raw) ? raw : [raw]

    for (const v of values) {
      if (!v || v === 'none' || v === 'absent' || v === 'normal' || v === 'false') continue

      // Handle boolean 'true' — the testId itself is the sign (specialist checkboxes: malig_criteria_*, infl_degenerate_neutrophils, etc.)
      if (v === 'true') {
        const mapped = VALUE_TO_SIGN_REGISTRY[testId]
        if (mapped) mapped.forEach((s) => signs.add(s))
        else signs.add(testId as CytologySign)
        continue
      }

      // Handle infl_type field: value 'neutrophilic_pure' → sign 'infl_neutrophilic_pure'
      if (testId === 'infl_type') {
        const inflSign = `infl_${v}` as CytologySign
        const mapped = VALUE_TO_SIGN_REGISTRY[inflSign]
        if (mapped) mapped.forEach((s) => signs.add(s))
        else signs.add(inflSign)
        continue
      }

      // Handle Step 1 quality fields (hardcoded in specialist form UI)
      const qualitySign = STEP1_QUALITY_SIGN_MAP[testId]?.[v]
      if (qualitySign) {
        signs.add(qualitySign)
        continue
      }

      // 1. Look up via sample definition option.signs (most accurate for routine forms)
      if (sampleDef) {
        let foundInDef = false
        for (const section of sampleDef.sections) {
          const test = section.tests.find((t) => t.testId === testId)
          if (test) {
            const opt = test.options?.find((o) => o.value === v)
            opt?.signs?.forEach((s) => signs.add(s))
            foundInDef = true
            break
          }
        }
        if (foundInDef) continue
      }

      // 2. Look up via specialist cell type morphTests
      //    When identified_cells is set, skip cells the user has deselected.
      for (const cellType of cytologyCellTypes) {
        if (identifiedCellIds !== null && !identifiedCellIds.has(cellType.cellId)) continue
        const morphTest = cellType.morphTests.find((t) => t.testId === testId)
        if (morphTest) {
          const opt = morphTest.options?.find((o) => o.value === v)
          opt?.signs?.forEach((s) => signs.add(s))
          break
        }
      }

      // 3. Fallback: VALUE_TO_SIGN_REGISTRY for specialist form values
      //    that are already prefixed sign keys (e.g. 'infl_neutrophilic_pure')
      const direct = VALUE_TO_SIGN_REGISTRY[v]
      if (direct) direct.forEach((s) => signs.add(s))
    }
  }

  return Array.from(signs)
}

// ── Value-to-Sign Registry ────────────────────────────────────
// Maps each option value string to one or more CytologySign keys.
// Populated from cytology-routine.ts / cytology-specialist.ts option.signs arrays.
// This allows the engine to work purely with flat findings JSON.
export const VALUE_TO_SIGN_REGISTRY: Record<string, CytologySign[]> = {
  // Otic — semiquant
  otic_malassezia_rare: ['otic_malassezia_rare'],
  otic_malassezia_few: ['otic_malassezia_few'],
  otic_malassezia_moderate: ['otic_malassezia_moderate'],
  otic_malassezia_many: ['otic_malassezia_many'],
  otic_cocci_rare: ['otic_cocci_rare'],
  otic_cocci_few: ['otic_cocci_few'],
  otic_cocci_moderate: ['otic_cocci_moderate'],
  otic_cocci_many: ['otic_cocci_many'],
  otic_rods_rare: ['otic_rods_rare'],
  otic_rods_few: ['otic_rods_few'],
  otic_rods_moderate: ['otic_rods_moderate'],
  otic_rods_many: ['otic_rods_many'],
  // Otic — boolean/semiquant single signs
  otic_neutrophils_present: ['otic_neutrophils_present'],
  otic_neutrophils_many: ['otic_neutrophils_many', 'otic_neutrophils_present'],
  otic_mites_present: ['otic_mites_present'],
  otic_candida_present: ['otic_candida_present'],
  otic_mixed_bacteria: ['otic_mixed_bacteria'],
  otic_degenerate_neutrophils: ['otic_degenerate_neutrophils'],
  // Skin
  skin_cocci_rare: ['skin_cocci_rare'],
  skin_cocci_few: ['skin_cocci_few'],
  skin_cocci_moderate: ['skin_cocci_moderate'],
  skin_cocci_many: ['skin_cocci_many'],
  skin_rods_present: ['skin_rods_present'],
  skin_malassezia_rare: ['skin_malassezia_rare'],
  skin_malassezia_few: ['skin_malassezia_few'],
  skin_malassezia_moderate: ['skin_malassezia_moderate'],
  skin_malassezia_many: ['skin_malassezia_many'],
  skin_neutrophils_present: ['skin_neutrophils_present'],
  skin_neutrophils_many: ['skin_neutrophils_many', 'skin_neutrophils_present'],
  skin_eosinophils_present: ['skin_eosinophils_present'],
  skin_eosinophils_many: ['skin_eosinophils_many', 'skin_eosinophils_present'],
  skin_acantholytic_cells: ['skin_acantholytic_cells'],
  skin_macrophages_present: ['skin_macrophages_present'],
  skin_degenerate_neutrophils: ['skin_degenerate_neutrophils'],
  skin_giant_cells: ['skin_giant_cells'],
  skin_plasma_cells: ['skin_plasma_cells'],
  // Fecal
  fecal_bacteria_normal: ['fecal_bacteria_normal'],
  fecal_bacteria_overgrowth: ['fecal_bacteria_overgrowth'],
  fecal_rods_excess: ['fecal_rods_excess'],
  fecal_cocci_excess: ['fecal_cocci_excess'],
  fecal_spiral_bacteria: ['fecal_spiral_bacteria'],
  fecal_spores_clostridium: ['fecal_spores_clostridium'],
  fecal_yeast_present: ['fecal_yeast_present'],
  fecal_giardia: ['fecal_giardia'],
  fecal_isospora: ['fecal_isospora'],
  fecal_toxocara: ['fecal_toxocara'],
  fecal_trichuris: ['fecal_trichuris'],
  fecal_strongyle: ['fecal_strongyle'],
  fecal_neutrophils_present: ['fecal_neutrophils_present'],
  fecal_rbc_present: ['fecal_rbc_present'],
  // Specialist — Inflammation
  infl_neutrophilic_pure: ['infl_neutrophilic_pure'],
  infl_neutrophilic_septic: ['infl_neutrophilic_septic', 'infl_neutrophilic_pure'],
  infl_neutrophilic_nonseptic: ['infl_neutrophilic_nonseptic', 'infl_neutrophilic_pure'],
  infl_macrophagic: ['infl_macrophagic'],
  infl_eosinophilic: ['infl_eosinophilic'],
  infl_lymphocytic: ['infl_lymphocytic'],
  infl_mixed: ['infl_mixed'],
  infl_giant_cells: ['infl_giant_cells'],
  infl_plasma_cells_many: ['infl_plasma_cells_many'],
  // Specialist — Background
  spec_low_cellularity: ['spec_low_cellularity'],
  spec_high_cellularity: ['spec_high_cellularity'],
  spec_hemodilution_severe: ['spec_hemodilution_severe'],
  spec_necrosis: ['spec_necrosis'],
  spec_background_bacteria: ['spec_background_bacteria'],
  spec_high_protein: ['spec_high_protein'],
  // Specialist — Epithelial
  epi_cohesive_clusters: ['epi_cohesive_clusters'],
  epi_acinar_pattern: ['epi_acinar_pattern'],
  epi_squamous_pearls: ['epi_squamous_pearls'],
  epi_nuclear_pleomorphism: ['epi_nuclear_pleomorphism'],
  epi_high_nc_ratio: ['epi_high_nc_ratio'],
  epi_prominent_nucleoli: ['epi_prominent_nucleoli'],
  epi_mitoses: ['epi_mitoses'],
  epi_multinucleation: ['epi_multinucleation'],
  epi_anisocytosis_moderate: ['epi_anisocytosis_moderate'],
  epi_anisocytosis_severe: ['epi_anisocytosis_severe'],
  epi_cytoplasm_secretory: ['epi_cytoplasm_secretory'],
  epi_signet_ring: ['epi_signet_ring'],
  // Specialist — Mesenchymal
  mes_spindle_cells: ['mes_spindle_cells'],
  mes_stellate_cells: ['mes_stellate_cells'],
  mes_bare_nuclei: ['mes_bare_nuclei'],
  mes_nuclear_pleomorphism: ['mes_nuclear_pleomorphism'],
  mes_high_nc_ratio: ['mes_high_nc_ratio'],
  mes_mitoses: ['mes_mitoses'],
  mes_lipid_vacuoles: ['mes_lipid_vacuoles'],
  // Specialist — Round Cells
  rc_mast_cell_granules: ['rc_mast_cell_granules'],
  rc_mast_cell_degranulated: ['rc_mast_cell_degranulated'],
  rc_lymphoblasts: ['rc_lymphoblasts'],
  rc_small_lymphocytes: ['rc_small_lymphocytes'],
  rc_plasma_cells: ['rc_plasma_cells'],
  rc_russell_bodies: ['rc_russell_bodies'],
  rc_histiocytes: ['rc_histiocytes'],
  rc_tvt_cells: ['rc_tvt_cells'],
  rc_binucleation: ['rc_binucleation'],
  // Specialist — Lymph Node
  ln_reactive_pattern: ['ln_reactive_pattern'],
  ln_lymphoblasts_many: ['ln_lymphoblasts_many', 'rc_lymphoblasts'],
  ln_monomorphic_population: ['ln_monomorphic_population'],
  ln_plasma_cells_many: ['ln_plasma_cells_many', 'rc_plasma_cells'],
  ln_neutrophils_many: ['ln_neutrophils_many', 'infl_neutrophilic_pure'],
  ln_eosinophils_many: ['ln_eosinophils_many', 'infl_eosinophilic'],
  // Specialist — Organ
  liver_hepatocytes: ['liver_hepatocytes'],
  liver_vacuolation: ['liver_vacuolation'],
  liver_bile_pigment: ['liver_bile_pigment'],
  spleen_hematopoiesis: ['spleen_hematopoiesis'],
  spleen_lymphoid: ['spleen_lymphoid'],
  // Effusion
  eff_transudate: ['eff_transudate'],
  eff_modified_transudate: ['eff_modified_transudate'],
  eff_exudate: ['eff_exudate'],
  eff_hemorrhagic: ['eff_hemorrhagic'],
  eff_chylous: ['eff_chylous'],
  eff_septic: ['eff_septic', 'infl_neutrophilic_septic'],
  eff_neoplastic_cells: ['eff_neoplastic_cells'],
  // Malignancy criteria (specialist form)
  malig_criteria_1: ['malig_criteria_1'],
  malig_criteria_2: ['malig_criteria_2'],
  malig_criteria_3: ['malig_criteria_3'],
  malig_criteria_4: ['malig_criteria_4'],
  malig_criteria_5: ['malig_criteria_5'],
}

// ── Diagnosis Engine ─────────────────────────────────────────
export function runCytologyDiagnosisEngine(
  activeSigns: CytologySign[],
  sampleType: CytologySampleType,
): CytologyEngineOutput {
  const signSet = new Set(activeSigns)

  // Filter applicable rules
  const applicableRules = cytologyDiagnosisRules.filter((r) =>
    r.applicableSampleTypes.includes(sampleType),
  )

  const diagnoses: CytologyDiagnosisResult[] = []

  for (const rule of applicableRules) {
    // Check exclusion signs
    if (rule.exclusionSigns?.some((s) => signSet.has(s))) continue

    // Check required signs — all must be present OR at least one synonym tier
    const matchedRequired = rule.requiredSigns.filter((s) => signSet.has(s))
    const missingRequired = rule.requiredSigns.filter((s) => !signSet.has(s))

    // If rule has required signs but none are matched, skip
    if (rule.requiredSigns.length > 0 && matchedRequired.length === 0) continue

    // Calculate confidence
    const matchedSupporting = rule.supportingSigns.filter((s) => signSet.has(s))
    const confidence = Math.min(
      rule.maxConfidence,
      rule.baseConfidence + matchedSupporting.length * rule.supportingWeight,
    )

    diagnoses.push({
      rule,
      confidenceScore: confidence,
      matchedSigns: [...matchedRequired, ...matchedSupporting],
      missingRequiredSigns: missingRequired,
    })
  }

  // Sort by confidence descending
  diagnoses.sort((a, b) => b.confidenceScore - a.confidenceScore)

  // Derive inflammation type
  const inflammationType = deriveInflammationType(signSet)

  // Derive malignancy suspicion
  const malignancySuspicion = deriveMalignancySuspicion(signSet, diagnoses)

  // Critical findings
  const criticalFindings = deriveCriticalFindings(signSet, diagnoses)

  return {
    activeSigns,
    diagnoses,
    criticalFindings,
    inflammationType,
    malignancySuspicion,
  }
}

function deriveInflammationType(
  signs: Set<CytologySign>,
): CytologyEngineOutput['inflammationType'] {
  if (signs.has('infl_neutrophilic_pure') || signs.has('infl_neutrophilic_septic') || signs.has('infl_neutrophilic_nonseptic')) return 'neutrophilic'
  if (signs.has('infl_macrophagic')) return 'macrophagic'
  if (signs.has('infl_eosinophilic')) return 'eosinophilic'
  if (signs.has('infl_lymphocytic')) return 'lymphocytic'
  if (signs.has('infl_mixed')) return 'mixed'
  return null
}

function deriveMalignancySuspicion(
  signs: Set<CytologySign>,
  diagnoses: CytologyDiagnosisResult[],
): CytologyEngineOutput['malignancySuspicion'] {
  const malignancyCount = [
    'malig_criteria_1', 'malig_criteria_2', 'malig_criteria_3',
    'malig_criteria_4', 'malig_criteria_5',
  ].filter((s) => signs.has(s as CytologySign)).length

  const topDiagnosis = diagnoses[0]

  if (
    malignancyCount >= 3 ||
    topDiagnosis?.rule.malignancyGrade === 'high'
  ) return 'high'

  if (
    malignancyCount === 2 ||
    topDiagnosis?.rule.malignancyGrade === 'intermediate'
  ) return 'moderate'

  if (
    malignancyCount === 1 ||
    topDiagnosis?.rule.malignancyGrade === 'low'
  ) return 'low'

  return 'none'
}

function deriveCriticalFindings(
  signs: Set<CytologySign>,
  diagnoses: CytologyDiagnosisResult[],
): string[] {
  const findings: string[] = []

  if (signs.has('infl_neutrophilic_septic') || signs.has('eff_septic'))
    findings.push('⚠️ 패혈성 삼출/감염 의심 — 즉시 조치 필요')

  if (signs.has('spec_necrosis'))
    findings.push('⚠️ 괴사 소견 — 조직 손상 심각')

  if (diagnoses[0]?.rule.malignancyGrade === 'high')
    findings.push('⚠️ 고등급 악성 종양 의심 — 조직검사 및 Staging 권장')

  if (signs.has('rc_lymphoblasts') && signs.has('ln_monomorphic_population'))
    findings.push('⚠️ 림프종 고의심 — 즉시 추가 검사 권장')

  if (signs.has('eff_chylous'))
    findings.push('ℹ️ 유미 삼출 — 원인 규명 필요 (흉관 손상, 종양, 심장질환)')

  return findings
}

// ── Chart Summary Builder ─────────────────────────────────────
export function buildCytologyChartSummary(
  findings: Record<string, string | string[]>,
  sampleType: CytologySampleType,
  engineOutput: CytologyEngineOutput,
): string {
  const lines: string[] = []

  const topDx = engineOutput.diagnoses[0]
  if (topDx) {
    lines.push(`[주요 진단] ${topDx.rule.nameKo} (신뢰도: ${topDx.confidenceScore}%)`)
    if (topDx.rule.descriptionKo) lines.push(topDx.rule.descriptionKo)
  }

  if (engineOutput.inflammationType) {
    const typeLabel: Record<NonNullable<CytologyEngineOutput['inflammationType']>, string> = {
      neutrophilic: '호중구성',
      macrophagic: '대식세포성',
      eosinophilic: '호산구성',
      lymphocytic: '림프구성',
      mixed: '혼합성',
    }
    lines.push(`[염증 유형] ${typeLabel[engineOutput.inflammationType]} 염증`)
  }

  if (engineOutput.malignancySuspicion && engineOutput.malignancySuspicion !== 'none') {
    const suspLabel: Record<string, string> = {
      low: '낮음', moderate: '중등도', high: '높음',
    }
    lines.push(`[악성도 의심] ${suspLabel[engineOutput.malignancySuspicion]}`)
  }

  if (engineOutput.criticalFindings.length > 0) {
    lines.push(`\n[중요 소견]`)
    engineOutput.criticalFindings.forEach((f) => lines.push(f))
  }

  if (engineOutput.diagnoses.length > 1) {
    lines.push(`\n[감별 진단]`)
    engineOutput.diagnoses
      .slice(1, 4)
      .forEach((d) => lines.push(`  - ${d.rule.nameKo} (${d.confidenceScore}%)`))
  }

  return lines.join('\n')
}
