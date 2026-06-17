// ============================================================
// cytology-specialist.ts — Veterinary Cytology Specialist DB
// 수의 임상 세포학 전문가 판독용 세포 형태학 DB
// ============================================================

import type { CytologyCellType, CytologyMorphTest, CytologySign } from './cytology-types'

// ── 공통 형태학 검사 헬퍼 ────────────────────────────────────
// 모든 세포 타입에 공통으로 포함되는 5가지 형태학 검사를 반환합니다.

function commonMorphTests(prefix: string): CytologyMorphTest[] {
  return [
    {
      testId: `${prefix}_uniformity`,
      label: '세포 크기 균일성',
      labelEn: 'Cell Size Uniformity',
      testType: 'select' as const,
      options: [
        {
          value: 'uniform',
          label: '균일함',
          labelEn: 'Uniform',
          isAbnormal: false,
        },
        {
          value: 'mild_variation',
          label: '경도 변이',
          labelEn: 'Mild Variation',
          isAbnormal: true,
          severity: 'mild' as const,
          signs: ['malig_criteria_1'] as CytologySign[],
        },
        {
          value: 'marked_variation',
          label: '현저한 변이 (다형성)',
          labelEn: 'Marked Variation',
          isAbnormal: true,
          severity: 'moderate' as const,
          signs: ['malig_criteria_2'] as CytologySign[],
        },
      ],
    },
    {
      testId: `${prefix}_nc_ratio`,
      label: '핵:세포질 비 (N:C ratio)',
      labelEn: 'N:C Ratio',
      testType: 'select' as const,
      options: [
        {
          value: 'low',
          label: '낮음 (<0.5)',
          labelEn: 'Low (<0.5)',
          isAbnormal: false,
        },
        {
          value: 'medium',
          label: '중간 (0.5–0.7)',
          labelEn: 'Medium (0.5–0.7)',
          isAbnormal: false,
        },
        {
          value: 'high',
          label: '높음 (>0.7)',
          labelEn: 'High (>0.7)',
          isAbnormal: true,
          severity: 'moderate' as const,
          signs: ['malig_criteria_2'] as CytologySign[],
        },
      ],
    },
    {
      testId: `${prefix}_nucleoli`,
      label: '핵소체',
      labelEn: 'Nucleoli',
      testType: 'select' as const,
      options: [
        {
          value: 'absent',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
        {
          value: 'small',
          label: '소형 (정상)',
          labelEn: 'Small',
          isAbnormal: false,
        },
        {
          value: 'prominent',
          label: '뚜렷함',
          labelEn: 'Prominent',
          isAbnormal: true,
          severity: 'mild' as const,
          signs: ['malig_criteria_2'] as CytologySign[],
        },
        {
          value: 'multiple_prominent',
          label: '다수 + 뚜렷함',
          labelEn: 'Multiple Prominent',
          isAbnormal: true,
          severity: 'severe' as const,
          signs: ['malig_criteria_3'] as CytologySign[],
        },
      ],
    },
    {
      testId: `${prefix}_nuclear_pleomorphism`,
      label: '핵 이형성',
      labelEn: 'Nuclear Pleomorphism',
      testType: 'select' as const,
      options: [
        { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false },
        {
          value: 'mild',
          label: '경도',
          labelEn: 'Mild',
          isAbnormal: true,
          severity: 'mild' as const,
          signs: ['malig_criteria_1'] as CytologySign[],
        },
        {
          value: 'moderate',
          label: '중등도',
          labelEn: 'Moderate',
          isAbnormal: true,
          severity: 'moderate' as const,
          signs: ['malig_criteria_2'] as CytologySign[],
        },
        {
          value: 'severe',
          label: '심함',
          labelEn: 'Severe',
          isAbnormal: true,
          severity: 'severe' as const,
          signs: ['malig_criteria_3'] as CytologySign[],
        },
      ],
    },
    {
      testId: `${prefix}_mitoses`,
      label: '분열상',
      labelEn: 'Mitotic Figures',
      testType: 'select' as const,
      options: [
        { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false },
        {
          value: 'rare',
          label: '드뭄 (1–2/10HPF)',
          labelEn: 'Rare',
          isAbnormal: true,
          severity: 'mild' as const,
          signs: ['malig_criteria_1'] as CytologySign[],
        },
        {
          value: 'occasional',
          label: '간혹 (3–5/10HPF)',
          labelEn: 'Occasional',
          isAbnormal: true,
          severity: 'moderate' as const,
          signs: ['malig_criteria_2'] as CytologySign[],
        },
        {
          value: 'frequent',
          label: '빈번 (>5/10HPF)',
          labelEn: 'Frequent',
          isAbnormal: true,
          severity: 'severe' as const,
          signs: ['malig_criteria_3'] as CytologySign[],
        },
      ],
    },
  ]
}

// ============================================================
// EPITHELIAL — 상피세포류
// ============================================================

const epiSquamous: CytologyCellType = {
  cellId: 'epi_squamous',
  nameKo: '편평상피세포 (Squamous Epithelial Cell)',
  nameEn: 'Squamous Epithelial Cell',
  category: 'epithelial',
  morphTests: [
    {
      testId: 'sq_differentiation',
      label: '분화도',
      labelEn: 'Differentiation',
      testType: 'select',
      options: [
        {
          value: 'well',
          label: '고분화 (각화)',
          labelEn: 'Well-differentiated (Keratinizing)',
          isAbnormal: false,
          signs: ['epi_squamous_pearls'],
        },
        {
          value: 'moderate',
          label: '중등도 분화',
          labelEn: 'Moderately Differentiated',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['malig_criteria_1'],
        },
        {
          value: 'poor',
          label: '저분화 (비각화)',
          labelEn: 'Poorly Differentiated (Non-keratinizing)',
          isAbnormal: true,
          severity: 'severe',
          signs: ['malig_criteria_2'],
        },
      ],
    },
    {
      testId: 'sq_cell_arrangement',
      label: '세포 배열',
      labelEn: 'Cell Arrangement',
      testType: 'select',
      options: [
        {
          value: 'cohesive',
          label: '군집성 (cohesive sheets)',
          labelEn: 'Cohesive Clusters',
          isAbnormal: false,
          signs: ['epi_cohesive_clusters'],
        },
        {
          value: 'loosely_cohesive',
          label: '느슨한 군집',
          labelEn: 'Loosely Cohesive',
          isAbnormal: true,
          severity: 'mild',
          signs: ['malig_criteria_1'],
        },
        {
          value: 'discohesive',
          label: '단독세포 (discohesive)',
          labelEn: 'Discohesive (Single Cells)',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['malig_criteria_2'],
        },
      ],
    },
    {
      testId: 'sq_keratinization',
      label: '각화 정도',
      labelEn: 'Keratinization',
      testType: 'select',
      options: [
        {
          value: 'present',
          label: '있음 (정상 각화)',
          labelEn: 'Present',
          isAbnormal: false,
        },
        {
          value: 'abnormal',
          label: '비정상 각화',
          labelEn: 'Abnormal Keratinization',
          isAbnormal: true,
          severity: 'mild',
          signs: ['malig_criteria_1'],
        },
        {
          value: 'absent',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: true,
          severity: 'moderate',
        },
      ],
    },
    {
      testId: 'sq_intercellular_bridges',
      label: '세포간 교량',
      labelEn: 'Intercellular Bridges',
      testType: 'boolean',
      options: [
        {
          value: 'true',
          label: '있음',
          labelEn: 'Present',
          isAbnormal: false,
        },
        {
          value: 'false',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: true,
          severity: 'mild',
        },
      ],
    },
    ...commonMorphTests('sq'),
  ],
}

const epiGlandular: CytologyCellType = {
  cellId: 'epi_glandular',
  nameKo: '선상피세포 (Glandular Epithelial Cell)',
  nameEn: 'Glandular Epithelial Cell',
  category: 'epithelial',
  morphTests: [
    {
      testId: 'gl_arrangement',
      label: '세포 배열',
      labelEn: 'Cell Arrangement',
      testType: 'select',
      options: [
        {
          value: 'acinar',
          label: '선포 배열',
          labelEn: 'Acinar Pattern',
          isAbnormal: false,
          signs: ['epi_acinar_pattern'],
        },
        {
          value: 'tubular',
          label: '관형 배열',
          labelEn: 'Tubular Pattern',
          isAbnormal: false,
        },
        {
          value: 'papillary',
          label: '유두상 배열',
          labelEn: 'Papillary Pattern',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['malig_criteria_2'],
        },
        {
          value: 'solid',
          label: '고형성 (무질서)',
          labelEn: 'Solid (Disorganized)',
          isAbnormal: true,
          severity: 'severe',
          signs: ['malig_criteria_3'],
        },
      ],
    },
    {
      testId: 'gl_secretion',
      label: '분비 활성',
      labelEn: 'Secretory Activity',
      testType: 'select',
      options: [
        {
          value: 'present',
          label: '있음',
          labelEn: 'Present',
          isAbnormal: false,
          signs: ['epi_cytoplasm_secretory'],
        },
        {
          value: 'absent',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
        {
          value: 'signet_ring',
          label: '인환세포',
          labelEn: 'Signet Ring',
          isAbnormal: true,
          severity: 'severe',
          signs: ['epi_signet_ring', 'malig_criteria_3'],
        },
      ],
    },
    {
      testId: 'gl_lumen',
      label: '관강 형성',
      labelEn: 'Lumen Formation',
      testType: 'boolean',
      options: [
        {
          value: 'true',
          label: '있음',
          labelEn: 'Present',
          isAbnormal: false,
        },
        {
          value: 'false',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
      ],
    },
    {
      testId: 'gl_anisocytosis',
      label: '세포 크기 불균일 (이형세포증)',
      labelEn: 'Anisocytosis',
      testType: 'select',
      options: [
        {
          value: 'none',
          label: '없음',
          labelEn: 'None',
          isAbnormal: false,
        },
        {
          value: 'moderate',
          label: '중등도',
          labelEn: 'Moderate',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['epi_anisocytosis_moderate', 'malig_criteria_2'],
        },
        {
          value: 'severe',
          label: '심함',
          labelEn: 'Severe',
          isAbnormal: true,
          severity: 'severe',
          signs: ['epi_anisocytosis_severe', 'malig_criteria_3'],
        },
      ],
    },
    ...commonMorphTests('gl'),
  ],
}

const epiTransitional: CytologyCellType = {
  cellId: 'epi_transitional',
  nameKo: '이행상피세포 (Transitional Cell)',
  nameEn: 'Transitional Cell',
  category: 'epithelial',
  morphTests: [
    {
      testId: 'tc_cell_shape',
      label: '세포 형태',
      labelEn: 'Cell Shape',
      testType: 'select',
      options: [
        {
          value: 'umbrella',
          label: '우산세포 (정상)',
          labelEn: 'Umbrella Cell (Normal)',
          isAbnormal: false,
        },
        {
          value: 'caudate',
          label: '꼬리형 세포',
          labelEn: 'Caudate Cell',
          isAbnormal: true,
          severity: 'mild',
          signs: ['malig_criteria_1'],
        },
        {
          value: 'irregular',
          label: '불규칙형',
          labelEn: 'Irregular',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['malig_criteria_2'],
        },
      ],
    },
    {
      testId: 'tc_arrangement',
      label: '세포 배열',
      labelEn: 'Cell Arrangement',
      testType: 'select',
      options: [
        {
          value: 'cohesive',
          label: '군집성',
          labelEn: 'Cohesive',
          isAbnormal: false,
          signs: ['epi_cohesive_clusters'],
        },
        {
          value: 'papillary',
          label: '유두상',
          labelEn: 'Papillary',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['malig_criteria_2'],
        },
        {
          value: 'single_cells',
          label: '단독세포',
          labelEn: 'Single Cells',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['malig_criteria_2'],
        },
      ],
    },
    {
      testId: 'tc_multinucleation',
      label: '다핵화',
      labelEn: 'Multinucleation',
      testType: 'boolean',
      options: [
        {
          value: 'true',
          label: '있음',
          labelEn: 'Present',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['epi_multinucleation', 'malig_criteria_2'],
        },
        {
          value: 'false',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
      ],
    },
    ...commonMorphTests('tc'),
  ],
}

const epiHepatocyte: CytologyCellType = {
  cellId: 'epi_hepatocyte',
  nameKo: '간세포 (Hepatocyte)',
  nameEn: 'Hepatocyte',
  category: 'epithelial',
  morphTests: [
    {
      testId: 'hep_vacuolation',
      label: '세포질 공포화',
      labelEn: 'Cytoplasmic Vacuolation',
      testType: 'select',
      options: [
        {
          value: 'none',
          label: '없음',
          labelEn: 'None',
          isAbnormal: false,
        },
        {
          value: 'mild',
          label: '경도 공포화',
          labelEn: 'Mild Vacuolation',
          isAbnormal: true,
          severity: 'mild',
          signs: ['liver_vacuolation'],
        },
        {
          value: 'moderate',
          label: '중등도 공포화',
          labelEn: 'Moderate Vacuolation',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['liver_vacuolation'],
        },
        {
          value: 'severe',
          label: '심한 공포화 (지방증)',
          labelEn: 'Severe Vacuolation (Hepatic Lipidosis)',
          isAbnormal: true,
          severity: 'severe',
          signs: ['liver_vacuolation'],
        },
      ],
    },
    {
      testId: 'hep_bile_pigment',
      label: '담즙 색소',
      labelEn: 'Bile Pigment',
      testType: 'select',
      options: [
        {
          value: 'absent',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
        {
          value: 'intracellular',
          label: '세포내 담즙 색소',
          labelEn: 'Intracellular Bile Pigment',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['liver_bile_pigment'],
        },
        {
          value: 'bile_casts',
          label: '담즙 색소 원주',
          labelEn: 'Bile Casts',
          isAbnormal: true,
          severity: 'severe',
          signs: ['liver_bile_pigment'],
        },
      ],
    },
    {
      testId: 'hep_lipid_accumulation',
      label: '지방 축적',
      labelEn: 'Lipid Accumulation',
      testType: 'select',
      options: [
        {
          value: 'none',
          label: '없음',
          labelEn: 'None',
          isAbnormal: false,
        },
        {
          value: 'microvesicular',
          label: '미세 공포성 지방',
          labelEn: 'Microvesicular Lipid',
          isAbnormal: true,
          severity: 'mild',
          signs: ['liver_vacuolation'],
        },
        {
          value: 'macrovesicular',
          label: '대형 공포성 지방',
          labelEn: 'Macrovesicular Lipid',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['liver_vacuolation'],
        },
      ],
    },
    {
      testId: 'hep_hepatocyte_arrangement',
      label: '간세포 배열',
      labelEn: 'Hepatocyte Arrangement',
      testType: 'select',
      options: [
        {
          value: 'normal_plates',
          label: '정상 판상 배열',
          labelEn: 'Normal Plate Arrangement',
          isAbnormal: false,
          signs: ['liver_hepatocytes'],
        },
        {
          value: 'disorganized',
          label: '무질서한 배열',
          labelEn: 'Disorganized',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['malig_criteria_2'],
        },
        {
          value: 'trabeculae',
          label: '주상 배열 (≥3 세포 두께)',
          labelEn: 'Trabecular (≥3 cells thick)',
          isAbnormal: true,
          severity: 'severe',
          signs: ['malig_criteria_3'],
        },
      ],
    },
    ...commonMorphTests('hep'),
  ],
}

const epiSebaceous: CytologyCellType = {
  cellId: 'epi_sebaceous',
  nameKo: '피지선세포 (Sebaceous Cell)',
  nameEn: 'Sebaceous Cell',
  category: 'epithelial',
  morphTests: [
    {
      testId: 'seb_cytoplasm',
      label: '세포질 지방 공포',
      labelEn: 'Cytoplasmic Lipid Vacuoles',
      testType: 'select',
      options: [
        {
          value: 'abundant_foamy',
          label: '풍부한 거품형 (정상)',
          labelEn: 'Abundant Foamy (Normal)',
          isAbnormal: false,
        },
        {
          value: 'reduced',
          label: '감소됨',
          labelEn: 'Reduced',
          isAbnormal: true,
          severity: 'mild',
          signs: ['malig_criteria_1'],
        },
        {
          value: 'absent',
          label: '소실',
          labelEn: 'Absent',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['malig_criteria_2'],
        },
      ],
    },
    {
      testId: 'seb_basaloid_cells',
      label: '기저양 예비세포 비율',
      labelEn: 'Basaloid Reserve Cell Proportion',
      testType: 'select',
      options: [
        {
          value: 'few',
          label: '적음 (정상)',
          labelEn: 'Few (Normal)',
          isAbnormal: false,
        },
        {
          value: 'moderate',
          label: '중등도',
          labelEn: 'Moderate',
          isAbnormal: true,
          severity: 'mild',
          signs: ['malig_criteria_1'],
        },
        {
          value: 'dominant',
          label: '우세 (악성 의심)',
          labelEn: 'Dominant (Malignancy Suspect)',
          isAbnormal: true,
          severity: 'severe',
          signs: ['malig_criteria_3'],
        },
      ],
    },
    {
      testId: 'seb_lobular_structure',
      label: '소엽 구조 보존',
      labelEn: 'Lobular Architecture',
      testType: 'boolean',
      options: [
        {
          value: 'true',
          label: '보존됨',
          labelEn: 'Preserved',
          isAbnormal: false,
        },
        {
          value: 'false',
          label: '소실됨',
          labelEn: 'Lost',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['malig_criteria_2'],
        },
      ],
    },
    ...commonMorphTests('seb'),
  ],
}

// ============================================================
// MESENCHYMAL — 간엽세포류
// ============================================================

const mesSpindle: CytologyCellType = {
  cellId: 'mes_spindle',
  nameKo: '방추형세포 (Spindle Cell)',
  nameEn: 'Spindle Cell',
  category: 'mesenchymal',
  morphTests: [
    {
      testId: 'sp_cell_shape',
      label: '세포 형태',
      labelEn: 'Cell Shape',
      testType: 'select',
      options: [
        {
          value: 'spindle',
          label: '방추형 (spindle)',
          labelEn: 'Spindle',
          isAbnormal: false,
          signs: ['mes_spindle_cells'],
        },
        {
          value: 'stellate',
          label: '성상형 (stellate)',
          labelEn: 'Stellate',
          isAbnormal: false,
          signs: ['mes_stellate_cells'],
        },
        {
          value: 'pleomorphic',
          label: '다형성 (pleomorphic)',
          labelEn: 'Pleomorphic',
          isAbnormal: true,
          severity: 'severe',
          signs: ['mes_nuclear_pleomorphism', 'malig_criteria_3'],
        },
      ],
    },
    {
      testId: 'sp_bare_nuclei',
      label: '나핵 (bare nuclei)',
      labelEn: 'Bare Nuclei',
      testType: 'boolean',
      options: [
        {
          value: 'true',
          label: '있음',
          labelEn: 'Present',
          isAbnormal: false,
          signs: ['mes_bare_nuclei'],
        },
        {
          value: 'false',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
      ],
    },
    {
      testId: 'sp_extracellular_matrix',
      label: '세포외기질 생성',
      labelEn: 'Extracellular Matrix Production',
      testType: 'select',
      options: [
        {
          value: 'none',
          label: '없음',
          labelEn: 'None',
          isAbnormal: false,
        },
        {
          value: 'collagen',
          label: '콜라겐',
          labelEn: 'Collagen',
          isAbnormal: false,
        },
        {
          value: 'chondroid',
          label: '연골양 기질',
          labelEn: 'Chondroid Matrix',
          isAbnormal: false,
        },
        {
          value: 'osteoid',
          label: '골양 기질',
          labelEn: 'Osteoid Matrix',
          isAbnormal: false,
        },
      ],
    },
    ...commonMorphTests('sp').map((t) =>
      t.testId === 'sp_nc_ratio'
        ? {
            ...t,
            options: t.options?.map((o) =>
              o.value === 'high'
                ? { ...o, signs: ['mes_high_nc_ratio', 'malig_criteria_2'] as CytologySign[] }
                : o,
            ),
          }
        : t,
    ),
  ],
}

const mesAdipocyte: CytologyCellType = {
  cellId: 'mes_adipocyte',
  nameKo: '지방세포 (Adipocyte)',
  nameEn: 'Adipocyte',
  category: 'mesenchymal',
  morphTests: [
    {
      testId: 'adi_lipid_vacuoles',
      label: '지방 공포',
      labelEn: 'Lipid Vacuoles',
      testType: 'select',
      options: [
        {
          value: 'large_single',
          label: '단일 대형 공포 (성숙 지방세포)',
          labelEn: 'Large Single Vacuole (Mature Adipocyte)',
          isAbnormal: false,
          signs: ['mes_lipid_vacuoles'],
        },
        {
          value: 'multiple_small',
          label: '다수 소형 공포 (지방모세포)',
          labelEn: 'Multiple Small Vacuoles (Lipoblast)',
          isAbnormal: false,
          signs: ['mes_lipid_vacuoles'],
        },
        {
          value: 'absent',
          label: '공포 소실',
          labelEn: 'Absent',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['malig_criteria_2'],
        },
      ],
    },
    {
      testId: 'adi_cell_maturity',
      label: '세포 성숙도',
      labelEn: 'Cell Maturity',
      testType: 'select',
      options: [
        {
          value: 'mature',
          label: '성숙 (지방종 시사)',
          labelEn: 'Mature (Lipoma)',
          isAbnormal: false,
          signs: ['mes_lipid_vacuoles'],
        },
        {
          value: 'immature',
          label: '미성숙 지방모세포 다수',
          labelEn: 'Immature Lipoblasts',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['malig_criteria_2'],
        },
        {
          value: 'pleomorphic',
          label: '다형성 (지방육종 의심)',
          labelEn: 'Pleomorphic (Liposarcoma Suspect)',
          isAbnormal: true,
          severity: 'severe',
          signs: ['malig_criteria_3'],
        },
      ],
    },
    {
      testId: 'adi_nuclear_position',
      label: '핵 위치',
      labelEn: 'Nuclear Position',
      testType: 'select',
      options: [
        {
          value: 'peripheral',
          label: '주변부 편재 (정상)',
          labelEn: 'Peripheral (Normal)',
          isAbnormal: false,
        },
        {
          value: 'central',
          label: '중앙 위치',
          labelEn: 'Central',
          isAbnormal: true,
          severity: 'mild',
          signs: ['malig_criteria_1'],
        },
      ],
    },
    ...commonMorphTests('adi'),
  ],
}

const mesChondrocyte: CytologyCellType = {
  cellId: 'mes_chondrocyte',
  nameKo: '연골세포 (Chondrocyte)',
  nameEn: 'Chondrocyte',
  category: 'mesenchymal',
  morphTests: [
    {
      testId: 'chon_matrix',
      label: '연골 기질',
      labelEn: 'Chondroid Matrix',
      testType: 'select',
      options: [
        {
          value: 'abundant',
          label: '풍부한 자홍색 기질',
          labelEn: 'Abundant Magenta Matrix',
          isAbnormal: false,
        },
        {
          value: 'moderate',
          label: '중등도 기질',
          labelEn: 'Moderate Matrix',
          isAbnormal: false,
        },
        {
          value: 'scant',
          label: '희박한 기질',
          labelEn: 'Scant Matrix',
          isAbnormal: true,
          severity: 'mild',
          signs: ['malig_criteria_1'],
        },
      ],
    },
    {
      testId: 'chon_lacunae',
      label: '소강 (lacunae) 형성',
      labelEn: 'Lacunae Formation',
      testType: 'boolean',
      options: [
        {
          value: 'true',
          label: '있음 (정상)',
          labelEn: 'Present (Normal)',
          isAbnormal: false,
        },
        {
          value: 'false',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: true,
          severity: 'mild',
        },
      ],
    },
    {
      testId: 'chon_binucleation',
      label: '이핵화 세포',
      labelEn: 'Binucleation',
      testType: 'select',
      options: [
        {
          value: 'absent',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
        {
          value: 'occasional',
          label: '간혹',
          labelEn: 'Occasional',
          isAbnormal: false,
        },
        {
          value: 'frequent',
          label: '빈번 (악성 의심)',
          labelEn: 'Frequent (Malignancy Suspect)',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['malig_criteria_2'],
        },
      ],
    },
    ...commonMorphTests('chon'),
  ],
}

// ============================================================
// ROUND CELLS — 원형세포류
// ============================================================

const rcMastCell: CytologyCellType = {
  cellId: 'rc_mast_cell',
  nameKo: '비만세포 (Mast Cell)',
  nameEn: 'Mast Cell',
  category: 'round_cell',
  morphTests: [
    {
      testId: 'mast_granules',
      label: '세포질 과립',
      labelEn: 'Cytoplasmic Granules',
      testType: 'select',
      options: [
        {
          value: 'abundant',
          label: '풍부 (정상)',
          labelEn: 'Abundant',
          isAbnormal: false,
          signs: ['rc_mast_cell_granules'],
        },
        {
          value: 'reduced',
          label: '감소됨',
          labelEn: 'Reduced',
          isAbnormal: true,
          severity: 'mild',
          signs: ['rc_mast_cell_degranulated'],
        },
        {
          value: 'absent',
          label: '소실됨 (탈과립)',
          labelEn: 'Absent (Degranulated)',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['rc_mast_cell_degranulated', 'malig_criteria_1'],
        },
      ],
    },
    {
      testId: 'mast_nuclear_atypia',
      label: '핵 이형성',
      labelEn: 'Nuclear Atypia',
      testType: 'select',
      options: [
        {
          value: 'none',
          label: '없음',
          labelEn: 'None',
          isAbnormal: false,
        },
        {
          value: 'mild',
          label: '경도',
          labelEn: 'Mild',
          isAbnormal: true,
          severity: 'mild',
          signs: ['malig_criteria_1'],
        },
        {
          value: 'moderate',
          label: '중등도',
          labelEn: 'Moderate',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['malig_criteria_2'],
        },
        {
          value: 'severe',
          label: '심함',
          labelEn: 'Severe',
          isAbnormal: true,
          severity: 'severe',
          signs: ['malig_criteria_3'],
        },
      ],
    },
    ...commonMorphTests('mast'),
  ],
}

const rcLymphocyte: CytologyCellType = {
  cellId: 'rc_lymphocyte',
  nameKo: '림프구/림프종 (Lymphocyte/Lymphoma)',
  nameEn: 'Lymphocyte / Lymphoma',
  category: 'round_cell',
  morphTests: [
    {
      testId: 'lym_cell_size',
      label: '세포 크기',
      labelEn: 'Cell Size',
      testType: 'select',
      options: [
        {
          value: 'small',
          label: '소형 (≤1× RBC)',
          labelEn: 'Small (≤1× RBC)',
          isAbnormal: false,
          signs: ['rc_small_lymphocytes'],
        },
        {
          value: 'medium',
          label: '중형 (1–2× RBC)',
          labelEn: 'Medium (1–2× RBC)',
          isAbnormal: true,
          severity: 'mild',
          signs: ['malig_criteria_1'],
        },
        {
          value: 'large',
          label: '대형 (>2× RBC)',
          labelEn: 'Large (>2× RBC)',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['rc_lymphoblasts', 'malig_criteria_2'],
        },
      ],
    },
    {
      testId: 'lym_blast_proportion',
      label: '모세포 비율',
      labelEn: 'Blast Cell Proportion',
      testType: 'select',
      options: [
        {
          value: 'none',
          label: '없음 (정상)',
          labelEn: 'None (Normal)',
          isAbnormal: false,
        },
        {
          value: 'occasional',
          label: '간혹 (<10%)',
          labelEn: 'Occasional (<10%)',
          isAbnormal: false,
        },
        {
          value: 'increased',
          label: '증가 (10–50%)',
          labelEn: 'Increased (10–50%)',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['rc_lymphoblasts', 'malig_criteria_2'],
        },
        {
          value: 'dominant',
          label: '우세 (>50%, 림프종 의심)',
          labelEn: 'Dominant (>50%, Lymphoma Suspect)',
          isAbnormal: true,
          severity: 'severe',
          signs: ['rc_lymphoblasts', 'malig_criteria_3'],
        },
      ],
    },
    {
      testId: 'lym_population_uniformity',
      label: '세포 집단 균일성',
      labelEn: 'Population Uniformity',
      testType: 'select',
      options: [
        {
          value: 'polymorphic',
          label: '다형성 (반응성/정상)',
          labelEn: 'Polymorphic (Reactive/Normal)',
          isAbnormal: false,
          signs: ['ln_reactive_pattern'],
        },
        {
          value: 'monomorphic',
          label: '단형성 (신생물 의심)',
          labelEn: 'Monomorphic (Neoplasia Suspect)',
          isAbnormal: true,
          severity: 'severe',
          signs: ['ln_monomorphic_population', 'malig_criteria_3'],
        },
      ],
    },
    {
      testId: 'lym_chromatin',
      label: '염색질 패턴',
      labelEn: 'Chromatin Pattern',
      testType: 'select',
      options: [
        {
          value: 'condensed',
          label: '응축형 (성숙 림프구)',
          labelEn: 'Condensed (Mature)',
          isAbnormal: false,
        },
        {
          value: 'open',
          label: '개방형 (모세포)',
          labelEn: 'Open (Blastic)',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['rc_lymphoblasts', 'malig_criteria_2'],
        },
        {
          value: 'vesicular',
          label: '소포성 (고등급)',
          labelEn: 'Vesicular (High Grade)',
          isAbnormal: true,
          severity: 'severe',
          signs: ['rc_lymphoblasts', 'malig_criteria_3'],
        },
      ],
    },
    ...commonMorphTests('lym'),
  ],
}

const rcPlasmaCell: CytologyCellType = {
  cellId: 'rc_plasma_cell',
  nameKo: '형질세포/형질세포종 (Plasma Cell / Plasmacytoma)',
  nameEn: 'Plasma Cell / Plasmacytoma',
  category: 'round_cell',
  morphTests: [
    {
      testId: 'pc_clock_face_chromatin',
      label: '시계방향 핵염색질',
      labelEn: 'Clock-face Chromatin',
      testType: 'boolean',
      options: [
        {
          value: 'true',
          label: '있음 (성숙 형질세포)',
          labelEn: 'Present (Mature Plasma Cell)',
          isAbnormal: false,
        },
        {
          value: 'false',
          label: '없음 (미성숙/악성 의심)',
          labelEn: 'Absent (Immature / Malignant Suspect)',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['malig_criteria_2'],
        },
      ],
    },
    {
      testId: 'pc_russell_bodies',
      label: 'Russell body',
      labelEn: 'Russell Bodies',
      testType: 'select',
      options: [
        {
          value: 'absent',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
        {
          value: 'occasional',
          label: '간혹',
          labelEn: 'Occasional',
          isAbnormal: false,
          signs: ['rc_russell_bodies'],
        },
        {
          value: 'many',
          label: '다수',
          labelEn: 'Many',
          isAbnormal: false,
          signs: ['rc_russell_bodies'],
        },
      ],
    },
    {
      testId: 'pc_hof',
      label: '핵주위 밝은 구역 (hof)',
      labelEn: 'Perinuclear Hof (Golgi Zone)',
      testType: 'boolean',
      options: [
        {
          value: 'true',
          label: '있음 (정상)',
          labelEn: 'Present (Normal)',
          isAbnormal: false,
        },
        {
          value: 'false',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
      ],
    },
    {
      testId: 'pc_binucleation',
      label: '이핵화/다핵화',
      labelEn: 'Binucleation / Multinucleation',
      testType: 'select',
      options: [
        {
          value: 'absent',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
        {
          value: 'occasional',
          label: '간혹',
          labelEn: 'Occasional',
          isAbnormal: true,
          severity: 'mild',
          signs: ['rc_binucleation', 'malig_criteria_1'],
        },
        {
          value: 'frequent',
          label: '빈번',
          labelEn: 'Frequent',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['rc_binucleation', 'malig_criteria_2'],
        },
      ],
    },
    ...commonMorphTests('pc'),
  ],
}

const rcHistiocyte: CytologyCellType = {
  cellId: 'rc_histiocyte',
  nameKo: '조직구/조직구종 (Histiocyte / Histiocytoma)',
  nameEn: 'Histiocyte / Histiocytoma',
  category: 'round_cell',
  morphTests: [
    {
      testId: 'his_cell_size',
      label: '세포 크기',
      labelEn: 'Cell Size',
      testType: 'select',
      options: [
        {
          value: 'small_medium',
          label: '소~중형 (양성 조직구종)',
          labelEn: 'Small–Medium (Benign Histiocytoma)',
          isAbnormal: false,
          signs: ['rc_histiocytes'],
        },
        {
          value: 'large',
          label: '대형',
          labelEn: 'Large',
          isAbnormal: true,
          severity: 'mild',
          signs: ['malig_criteria_1'],
        },
        {
          value: 'giant',
          label: '거대 다핵 세포',
          labelEn: 'Giant Multinucleated Cell',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['infl_giant_cells', 'malig_criteria_2'],
        },
      ],
    },
    {
      testId: 'his_cytoplasm',
      label: '세포질 특성',
      labelEn: 'Cytoplasmic Characteristics',
      testType: 'select',
      options: [
        {
          value: 'abundant_pale',
          label: '풍부하고 옅은 세포질',
          labelEn: 'Abundant Pale Cytoplasm',
          isAbnormal: false,
        },
        {
          value: 'vacuolated',
          label: '공포성',
          labelEn: 'Vacuolated',
          isAbnormal: false,
        },
        {
          value: 'erythrophagocytosis',
          label: '적혈구 포식',
          labelEn: 'Erythrophagocytosis',
          isAbnormal: false,
        },
      ],
    },
    {
      testId: 'his_emperipolesis',
      label: '세포내 이입 (emperipolesis)',
      labelEn: 'Emperipolesis',
      testType: 'boolean',
      options: [
        {
          value: 'true',
          label: '있음',
          labelEn: 'Present',
          isAbnormal: false,
        },
        {
          value: 'false',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
      ],
    },
    ...commonMorphTests('his'),
  ],
}

const rcTvt: CytologyCellType = {
  cellId: 'rc_tvt',
  nameKo: 'TVT 세포 (Transmissible Venereal Tumor)',
  nameEn: 'Transmissible Venereal Tumor (TVT) Cell',
  category: 'round_cell',
  morphTests: [
    {
      testId: 'tvt_cell_arrangement',
      label: '세포 배열',
      labelEn: 'Cell Arrangement',
      testType: 'select',
      options: [
        {
          value: 'single_round',
          label: '단독 원형세포',
          labelEn: 'Single Round Cells',
          isAbnormal: false,
          signs: ['rc_tvt_cells'],
        },
        {
          value: 'loose_clusters',
          label: '느슨한 군집',
          labelEn: 'Loose Clusters',
          isAbnormal: false,
          signs: ['rc_tvt_cells'],
        },
      ],
    },
    {
      testId: 'tvt_cytoplasm_vacuoles',
      label: '세포질 공포',
      labelEn: 'Cytoplasmic Vacuoles',
      testType: 'select',
      options: [
        {
          value: 'characteristic_punched_out',
          label: '"구멍 뚫린" 공포 (TVT 특징)',
          labelEn: '"Punched-out" Vacuoles (TVT Characteristic)',
          isAbnormal: false,
          signs: ['rc_tvt_cells'],
        },
        {
          value: 'absent',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
      ],
    },
    {
      testId: 'tvt_nucleoli',
      label: '핵소체',
      labelEn: 'Nucleoli',
      testType: 'select',
      options: [
        {
          value: 'one_prominent',
          label: '단일 뚜렷한 핵소체 (TVT 특징)',
          labelEn: 'Single Prominent Nucleolus (TVT Characteristic)',
          isAbnormal: false,
          signs: ['rc_tvt_cells'],
        },
        {
          value: 'multiple',
          label: '다수 핵소체',
          labelEn: 'Multiple Nucleoli',
          isAbnormal: true,
          severity: 'mild',
          signs: ['malig_criteria_1'],
        },
      ],
    },
    ...commonMorphTests('tvt'),
  ],
}

// ============================================================
// INFLAMMATORY — 염증세포
// ============================================================

const inflNeutrophil: CytologyCellType = {
  cellId: 'infl_neutrophil',
  nameKo: '호중구 (Neutrophil)',
  nameEn: 'Neutrophil',
  category: 'inflammatory',
  morphTests: [
    {
      testId: 'neu_degeneration',
      label: '변성도',
      labelEn: 'Degeneration',
      testType: 'select',
      options: [
        {
          value: 'none',
          label: '정상 (비변성)',
          labelEn: 'Non-degenerate',
          isAbnormal: false,
          signs: ['infl_neutrophilic_nonseptic'],
        },
        {
          value: 'mild',
          label: '경도 변성 (핵 부종)',
          labelEn: 'Mild Degeneration (Nuclear Swelling)',
          isAbnormal: true,
          severity: 'mild',
          signs: ['infl_neutrophilic_septic'],
        },
        {
          value: 'severe',
          label: '심한 변성 (karyolysis/pyknosis)',
          labelEn: 'Severe Degeneration (Karyolysis/Pyknosis)',
          isAbnormal: true,
          severity: 'severe',
          signs: ['infl_neutrophilic_septic'],
        },
      ],
    },
    {
      testId: 'neu_intracellular_bacteria',
      label: '세포내 세균',
      labelEn: 'Intracellular Bacteria',
      testType: 'boolean',
      options: [
        {
          value: 'true',
          label: '있음 (패혈성)',
          labelEn: 'Present (Septic)',
          isAbnormal: true,
          severity: 'severe',
          signs: ['infl_neutrophilic_septic', 'spec_background_bacteria'],
        },
        {
          value: 'false',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
      ],
    },
    {
      testId: 'neu_nuclear_lobulation',
      label: '핵 분엽 정도',
      labelEn: 'Nuclear Lobulation',
      testType: 'select',
      options: [
        {
          value: 'normal',
          label: '정상 (3–5 분엽)',
          labelEn: 'Normal (3–5 Lobes)',
          isAbnormal: false,
        },
        {
          value: 'hypo',
          label: '저분엽 (band form)',
          labelEn: 'Hyposegmented (Band Form)',
          isAbnormal: false,
        },
        {
          value: 'hyper',
          label: '과분엽 (>5 분엽)',
          labelEn: 'Hypersegmented (>5 Lobes)',
          isAbnormal: true,
          severity: 'mild',
        },
      ],
    },
    {
      testId: 'neu_proportion',
      label: '염증세포 내 비율',
      labelEn: 'Proportion among Inflammatory Cells',
      testType: 'select',
      options: [
        {
          value: 'dominant',
          label: '우세 (>70%)',
          labelEn: 'Dominant (>70%)',
          isAbnormal: false,
          signs: ['infl_neutrophilic_pure'],
        },
        {
          value: 'mixed',
          label: '혼합 (30–70%)',
          labelEn: 'Mixed (30–70%)',
          isAbnormal: false,
          signs: ['infl_mixed'],
        },
        {
          value: 'minor',
          label: '소수 (<30%)',
          labelEn: 'Minor (<30%)',
          isAbnormal: false,
        },
      ],
    },
    ...commonMorphTests('neu'),
  ],
}

const inflMacrophage: CytologyCellType = {
  cellId: 'infl_macrophage',
  nameKo: '대식세포 (Macrophage)',
  nameEn: 'Macrophage',
  category: 'inflammatory',
  morphTests: [
    {
      testId: 'mac_vacuolation',
      label: '세포질 공포화',
      labelEn: 'Cytoplasmic Vacuolation',
      testType: 'select',
      options: [
        {
          value: 'none',
          label: '없음',
          labelEn: 'None',
          isAbnormal: false,
        },
        {
          value: 'mild',
          label: '경도',
          labelEn: 'Mild',
          isAbnormal: false,
          signs: ['infl_macrophagic'],
        },
        {
          value: 'prominent',
          label: '뚜렷함 (활성화)',
          labelEn: 'Prominent (Activated)',
          isAbnormal: false,
          signs: ['infl_macrophagic'],
        },
      ],
    },
    {
      testId: 'mac_phagocytosis',
      label: '세균 포식 여부',
      labelEn: 'Bacteria Phagocytosis',
      testType: 'boolean',
      options: [
        {
          value: 'true',
          label: '있음 (세균 포식)',
          labelEn: 'Present (Bacteria Phagocytosed)',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['infl_neutrophilic_septic'],
        },
        {
          value: 'false',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
      ],
    },
    {
      testId: 'mac_giant_cells',
      label: '거대세포 (multi-nucleated giant cell)',
      labelEn: 'Multinucleated Giant Cells',
      testType: 'select',
      options: [
        {
          value: 'absent',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
        {
          value: 'occasional',
          label: '간혹',
          labelEn: 'Occasional',
          isAbnormal: true,
          severity: 'mild',
          signs: ['infl_giant_cells'],
        },
        {
          value: 'many',
          label: '다수 (육아종성)',
          labelEn: 'Many (Granulomatous)',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['infl_giant_cells'],
        },
      ],
    },
    {
      testId: 'mac_content',
      label: '포식 내용물',
      labelEn: 'Phagocytic Contents',
      testType: 'multiselect',
      options: [
        {
          value: 'debris',
          label: '세포 파편',
          labelEn: 'Cell Debris',
          isAbnormal: false,
        },
        {
          value: 'rbc',
          label: '적혈구',
          labelEn: 'Erythrocytes',
          isAbnormal: false,
        },
        {
          value: 'lipid',
          label: '지질',
          labelEn: 'Lipid',
          isAbnormal: false,
        },
        {
          value: 'fungi',
          label: '진균',
          labelEn: 'Fungi',
          isAbnormal: true,
          severity: 'severe',
        },
        {
          value: 'parasites',
          label: '기생충',
          labelEn: 'Parasites',
          isAbnormal: true,
          severity: 'severe',
        },
      ],
    },
    ...commonMorphTests('mac'),
  ],
}

const inflEosinophil: CytologyCellType = {
  cellId: 'infl_eosinophil',
  nameKo: '호산구 (Eosinophil)',
  nameEn: 'Eosinophil',
  category: 'inflammatory',
  morphTests: [
    {
      testId: 'eos_granules',
      label: '과립 형태',
      labelEn: 'Granule Morphology',
      testType: 'select',
      options: [
        {
          value: 'rod_shaped',
          label: '막대형 (고양이 특징)',
          labelEn: 'Rod-shaped (Feline Characteristic)',
          isAbnormal: false,
        },
        {
          value: 'round',
          label: '구형 (개 특징)',
          labelEn: 'Round (Canine Characteristic)',
          isAbnormal: false,
        },
        {
          value: 'degranulated',
          label: '탈과립',
          labelEn: 'Degranulated',
          isAbnormal: true,
          severity: 'mild',
        },
      ],
    },
    {
      testId: 'eos_proportion',
      label: '염증세포 내 비율',
      labelEn: 'Proportion among Inflammatory Cells',
      testType: 'select',
      options: [
        {
          value: 'few',
          label: '소수 (<10%)',
          labelEn: 'Few (<10%)',
          isAbnormal: false,
        },
        {
          value: 'increased',
          label: '증가 (10–50%)',
          labelEn: 'Increased (10–50%)',
          isAbnormal: true,
          severity: 'mild',
          signs: ['infl_eosinophilic'],
        },
        {
          value: 'dominant',
          label: '우세 (>50%)',
          labelEn: 'Dominant (>50%)',
          isAbnormal: true,
          severity: 'moderate',
          signs: ['infl_eosinophilic'],
        },
      ],
    },
    {
      testId: 'eos_tissue_eosinophilia',
      label: '조직 호산구증가증',
      labelEn: 'Tissue Eosinophilia',
      testType: 'boolean',
      options: [
        {
          value: 'true',
          label: '있음',
          labelEn: 'Present',
          isAbnormal: true,
          severity: 'mild',
          signs: ['infl_eosinophilic'],
        },
        {
          value: 'false',
          label: '없음',
          labelEn: 'Absent',
          isAbnormal: false,
        },
      ],
    },
    ...commonMorphTests('eos'),
  ],
}

const inflLymphocyte: CytologyCellType = {
  cellId: 'infl_lymphocyte',
  nameKo: '소림프구 (Small Lymphocyte)',
  nameEn: 'Small Lymphocyte',
  category: 'inflammatory',
  morphTests: [
    {
      testId: 'sl_cell_size',
      label: '세포 크기',
      labelEn: 'Cell Size',
      testType: 'select',
      options: [
        {
          value: 'small',
          label: '소형 (정상 소림프구)',
          labelEn: 'Small (Normal Small Lymphocyte)',
          isAbnormal: false,
          signs: ['rc_small_lymphocytes'],
        },
        {
          value: 'medium',
          label: '중형 (활성화)',
          labelEn: 'Medium (Activated)',
          isAbnormal: false,
        },
        {
          value: 'large',
          label: '대형 (림프구 반응)',
          labelEn: 'Large (Lymphocytic Reaction)',
          isAbnormal: true,
          severity: 'mild',
        },
      ],
    },
    {
      testId: 'sl_chromatin',
      label: '염색질 패턴',
      labelEn: 'Chromatin Pattern',
      testType: 'select',
      options: [
        {
          value: 'dense_condensed',
          label: '농밀 응축형 (정상)',
          labelEn: 'Dense Condensed (Normal)',
          isAbnormal: false,
        },
        {
          value: 'clumped',
          label: '덩어리형',
          labelEn: 'Clumped',
          isAbnormal: false,
        },
        {
          value: 'open_vesicular',
          label: '개방 소포성 (활성화/반응성)',
          labelEn: 'Open Vesicular (Activated/Reactive)',
          isAbnormal: true,
          severity: 'mild',
        },
      ],
    },
    {
      testId: 'sl_proportion',
      label: '염증세포 내 비율',
      labelEn: 'Proportion among Inflammatory Cells',
      testType: 'select',
      options: [
        {
          value: 'few',
          label: '소수 (<20%)',
          labelEn: 'Few (<20%)',
          isAbnormal: false,
        },
        {
          value: 'moderate',
          label: '중등도 (20–50%)',
          labelEn: 'Moderate (20–50%)',
          isAbnormal: false,
          signs: ['infl_lymphocytic'],
        },
        {
          value: 'dominant',
          label: '우세 (>50%)',
          labelEn: 'Dominant (>50%)',
          isAbnormal: true,
          severity: 'mild',
          signs: ['infl_lymphocytic'],
        },
      ],
    },
    ...commonMorphTests('sl'),
  ],
}

// ============================================================
// DB EXPORT
// ============================================================

export const cytologyCellTypes: CytologyCellType[] = [
  // Epithelial
  epiSquamous,
  epiGlandular,
  epiTransitional,
  epiHepatocyte,
  epiSebaceous,
  // Mesenchymal
  mesSpindle,
  mesAdipocyte,
  mesChondrocyte,
  // Round Cells
  rcMastCell,
  rcLymphocyte,
  rcPlasmaCell,
  rcHistiocyte,
  rcTvt,
  // Inflammatory
  inflNeutrophil,
  inflMacrophage,
  inflEosinophil,
  inflLymphocyte,
]

// ============================================================
// SPECIALIST STEPS
// ============================================================

export const cytologySpecialistSteps = [
  {
    stepId: 'sample_quality',
    label: '슬라이드 품질 평가',
    labelEn: 'Sample Quality',
    icon: 'CheckCircle',
    tests: [
      {
        testId: 'sq_cellularity',
        label: '세포충실성',
        labelEn: 'Cellularity',
        testType: 'select',
        options: [
          {
            value: 'low',
            label: '낮음 (판독 제한)',
            labelEn: 'Low (Limited Interpretation)',
            isAbnormal: true,
            severity: 'mild',
            signs: ['spec_low_cellularity'],
          },
          {
            value: 'moderate',
            label: '중등도 (적절)',
            labelEn: 'Moderate (Adequate)',
            isAbnormal: false,
          },
          {
            value: 'high',
            label: '높음 (우수)',
            labelEn: 'High (Excellent)',
            isAbnormal: false,
            signs: ['spec_high_cellularity'],
          },
        ],
      },
      {
        testId: 'sq_hemodilution',
        label: '혈액 희석',
        labelEn: 'Hemodilution',
        testType: 'select',
        options: [
          {
            value: 'none',
            label: '없음',
            labelEn: 'None',
            isAbnormal: false,
          },
          {
            value: 'mild',
            label: '경도',
            labelEn: 'Mild',
            isAbnormal: false,
          },
          {
            value: 'moderate',
            label: '중등도',
            labelEn: 'Moderate',
            isAbnormal: true,
            severity: 'mild',
          },
          {
            value: 'severe',
            label: '심함 (판독 불가)',
            labelEn: 'Severe (Uninterpretable)',
            isAbnormal: true,
            severity: 'severe',
            signs: ['spec_hemodilution_severe'],
          },
        ],
      },
      {
        testId: 'sq_preparation_quality',
        label: '도말 제작 품질',
        labelEn: 'Preparation Quality',
        testType: 'select',
        options: [
          {
            value: 'poor',
            label: '불량 (두껍거나 찢어짐)',
            labelEn: 'Poor (Thick or Torn)',
            isAbnormal: true,
            severity: 'moderate',
          },
          {
            value: 'fair',
            label: '보통',
            labelEn: 'Fair',
            isAbnormal: false,
          },
          {
            value: 'good',
            label: '양호',
            labelEn: 'Good',
            isAbnormal: false,
          },
          {
            value: 'excellent',
            label: '우수',
            labelEn: 'Excellent',
            isAbnormal: false,
          },
        ],
      },
      {
        testId: 'sq_stain_quality',
        label: '염색 품질',
        labelEn: 'Stain Quality',
        testType: 'select',
        options: [
          {
            value: 'poor',
            label: '불량 (과도/부족 염색)',
            labelEn: 'Poor (Over/Under-stained)',
            isAbnormal: true,
            severity: 'moderate',
          },
          {
            value: 'adequate',
            label: '적절',
            labelEn: 'Adequate',
            isAbnormal: false,
          },
          {
            value: 'good',
            label: '양호',
            labelEn: 'Good',
            isAbnormal: false,
          },
        ],
      },
    ],
  },
  {
    stepId: 'background',
    label: '배경 소견',
    labelEn: 'Background Assessment',
    icon: 'Layers',
    tests: [
      {
        testId: 'bg_protein_background',
        label: '단백 배경',
        labelEn: 'Protein Background',
        testType: 'select',
        options: [
          {
            value: 'none',
            label: '없음 (투명)',
            labelEn: 'None (Clear)',
            isAbnormal: false,
          },
          {
            value: 'low',
            label: '약함',
            labelEn: 'Low',
            isAbnormal: false,
          },
          {
            value: 'moderate',
            label: '중등도',
            labelEn: 'Moderate',
            isAbnormal: false,
          },
          {
            value: 'high',
            label: '심함 (삼출액 시사)',
            labelEn: 'High (Exudate Suspect)',
            isAbnormal: true,
            severity: 'moderate',
            signs: ['spec_high_protein'],
          },
        ],
      },
      {
        testId: 'bg_necrosis',
        label: '괴사',
        labelEn: 'Necrosis',
        testType: 'select',
        options: [
          {
            value: 'none',
            label: '없음',
            labelEn: 'None',
            isAbnormal: false,
          },
          {
            value: 'focal',
            label: '국소적',
            labelEn: 'Focal',
            isAbnormal: true,
            severity: 'mild',
            signs: ['spec_necrosis'],
          },
          {
            value: 'extensive',
            label: '광범위',
            labelEn: 'Extensive',
            isAbnormal: true,
            severity: 'severe',
            signs: ['spec_necrosis'],
          },
        ],
      },
      {
        testId: 'bg_background_bacteria',
        label: '배경 세균',
        labelEn: 'Background Bacteria',
        testType: 'select',
        options: [
          {
            value: 'none',
            label: '없음',
            labelEn: 'None',
            isAbnormal: false,
          },
          {
            value: 'few',
            label: '소수 (오염 가능)',
            labelEn: 'Few (Possible Contamination)',
            isAbnormal: false,
          },
          {
            value: 'many',
            label: '다수 (감염 시사)',
            labelEn: 'Many (Infection Suspect)',
            isAbnormal: true,
            severity: 'severe',
            signs: ['spec_background_bacteria'],
          },
        ],
      },
      {
        testId: 'bg_rbc_contamination',
        label: '적혈구 오염',
        labelEn: 'RBC Contamination',
        testType: 'select',
        options: [
          {
            value: 'none',
            label: '없음',
            labelEn: 'None',
            isAbnormal: false,
          },
          {
            value: 'mild',
            label: '경도',
            labelEn: 'Mild',
            isAbnormal: false,
          },
          {
            value: 'moderate',
            label: '중등도',
            labelEn: 'Moderate',
            isAbnormal: true,
            severity: 'mild',
          },
          {
            value: 'severe',
            label: '심함 (혈액 오염)',
            labelEn: 'Severe (Blood Contamination)',
            isAbnormal: true,
            severity: 'severe',
            signs: ['spec_hemodilution_severe'],
          },
        ],
      },
    ],
  },
  {
    stepId: 'cell_population',
    label: '세포 집단 구성',
    labelEn: 'Cell Population',
    icon: 'PieChart',
    tests: [
      {
        testId: 'cp_dominant_cell_type',
        label: '주요 세포 타입',
        labelEn: 'Dominant Cell Type',
        testType: 'multiselect',
        options: [
          {
            value: 'epithelial',
            label: '상피세포',
            labelEn: 'Epithelial',
            isAbnormal: false,
          },
          {
            value: 'mesenchymal',
            label: '간엽세포',
            labelEn: 'Mesenchymal',
            isAbnormal: false,
          },
          {
            value: 'round_cell',
            label: '원형세포',
            labelEn: 'Round Cell',
            isAbnormal: false,
          },
          {
            value: 'inflammatory',
            label: '염증세포',
            labelEn: 'Inflammatory',
            isAbnormal: false,
          },
          {
            value: 'mixed',
            label: '혼합',
            labelEn: 'Mixed',
            isAbnormal: false,
          },
        ],
      },
      {
        testId: 'cp_cell_proportion',
        label: '세포 타입별 비율',
        labelEn: 'Cell Type Proportions',
        testType: 'text',
        placeholder: '각 세포 타입 비율 (예: 상피 70%, 염증 30%)',
      },
    ],
  },
  {
    stepId: 'cell_morphology',
    label: '세포 형태학 소견',
    labelEn: 'Cell Morphology',
    icon: 'Microscope',
    // 이 단계에서는 cytologyCellTypes DB를 참조하여 동적으로 morphTests를 렌더링합니다.
    tests: [],
  },
  {
    stepId: 'interpretation',
    label: '최종 해석',
    labelEn: 'Interpretation',
    icon: 'ClipboardList',
    tests: [
      {
        testId: 'interp_diagnosis_category',
        label: '진단 분류',
        labelEn: 'Diagnosis Category',
        testType: 'select',
        options: [
          {
            value: 'normal',
            label: '정상 소견',
            labelEn: 'Normal',
            isAbnormal: false,
          },
          {
            value: 'inflammation',
            label: '염증',
            labelEn: 'Inflammation',
            isAbnormal: true,
            severity: 'mild',
          },
          {
            value: 'hyperplasia',
            label: '과형성',
            labelEn: 'Hyperplasia',
            isAbnormal: true,
            severity: 'mild',
          },
          {
            value: 'benign_neoplasia',
            label: '양성 신생물',
            labelEn: 'Benign Neoplasia',
            isAbnormal: true,
            severity: 'moderate',
          },
          {
            value: 'malignant_neoplasia',
            label: '악성 신생물',
            labelEn: 'Malignant Neoplasia',
            isAbnormal: true,
            severity: 'severe',
            signs: ['malig_criteria_3'],
          },
          {
            value: 'undetermined',
            label: '판정 불능 (추가 검사 필요)',
            labelEn: 'Undetermined (Further Testing Required)',
            isAbnormal: false,
          },
        ],
      },
      {
        testId: 'interp_malignancy_suspicion',
        label: '악성도 의심 수준',
        labelEn: 'Malignancy Suspicion Level',
        testType: 'select',
        options: [
          {
            value: 'none',
            label: '없음',
            labelEn: 'None',
            isAbnormal: false,
          },
          {
            value: 'low',
            label: '낮음',
            labelEn: 'Low',
            isAbnormal: true,
            severity: 'mild',
            signs: ['malig_criteria_1'],
          },
          {
            value: 'moderate',
            label: '중등도',
            labelEn: 'Moderate',
            isAbnormal: true,
            severity: 'moderate',
            signs: ['malig_criteria_2'],
          },
          {
            value: 'high',
            label: '높음',
            labelEn: 'High',
            isAbnormal: true,
            severity: 'severe',
            signs: ['malig_criteria_3'],
          },
        ],
      },
      {
        testId: 'interp_additional_tests',
        label: '추가 검사 권고',
        labelEn: 'Additional Tests Recommended',
        testType: 'text',
        placeholder: '추가 권고 검사 입력 (예: 조직생검, 배양검사, 면역조직화학)',
      },
      {
        testId: 'interp_comment',
        label: '판독 소견 메모',
        labelEn: 'Interpretation Comment',
        testType: 'text',
        placeholder: '세포학적 소견 및 임상적 고려사항 입력',
      },
    ],
  },
]
