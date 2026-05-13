// ============================================================
// cytology-routine.ts — Veterinary Cytology Routine Sample Definitions
// ============================================================
import type { CytologySampleDefinition } from './cytology-types'

// ── Shared semiquant options helper ─────────────────────────
// Usage: semiquantOptions('otic_cocci') → options with signs otic_cocci_rare … otic_cocci_many
// For organisms where 'none' should not carry a sign, pass signPrefix; for cells the same.

const semiquantOptions = (
  signPrefix: string,
): import('./cytology-types').CytologyFindingOption[] => {
  type S = import('./cytology-types').CytologySign
  const rare = `${signPrefix}_rare` as S
  const few  = `${signPrefix}_few`  as S
  const mod  = `${signPrefix}_moderate` as S
  const many = `${signPrefix}_many` as S
  return [
    { value: 'none',     label: '없음',              labelEn: 'None',            isAbnormal: false, signs: [] },
    { value: 'rare',     label: '소수 (1-2/HPF)',    labelEn: 'Rare (1-2/HPF)',  isAbnormal: true,  severity: 'mild',     signs: [rare] },
    { value: 'few',      label: '적음 (3-5/HPF)',    labelEn: 'Few (3-5/HPF)',   isAbnormal: true,  severity: 'mild',     signs: [few, rare] },
    { value: 'moderate', label: '중등도 (6-20/HPF)', labelEn: 'Moderate (6-20/HPF)', isAbnormal: true, severity: 'moderate', signs: [mod, few, rare] },
    { value: 'many',     label: '다수 (>20/HPF)',    labelEn: 'Many (>20/HPF)',  isAbnormal: true,  severity: 'severe',   signs: [many, mod, few, rare] },
  ]
}

// semiquant options that mark moderate/many as 'present' sign (single sign name, not tiered)
const semiquantOptionsSingleSign = (
  presentSign: import('./cytology-types').CytologySign,
  manySign?: import('./cytology-types').CytologySign,
): import('./cytology-types').CytologyFindingOption[] => [
  {
    value: 'none',
    label: '없음',
    labelEn: 'None',
    isAbnormal: false,
    signs: [],
  },
  {
    value: 'rare',
    label: '소수 (1-2/HPF)',
    labelEn: 'Rare (1-2/HPF)',
    isAbnormal: true,
    severity: 'mild',
    signs: [presentSign],
  },
  {
    value: 'few',
    label: '적음 (3-5/HPF)',
    labelEn: 'Few (3-5/HPF)',
    isAbnormal: true,
    severity: 'mild',
    signs: [presentSign],
  },
  {
    value: 'moderate',
    label: '중등도 (6-20/HPF)',
    labelEn: 'Moderate (6-20/HPF)',
    isAbnormal: true,
    severity: 'moderate',
    signs: [presentSign],
  },
  {
    value: 'many',
    label: '다수 (>20/HPF)',
    labelEn: 'Many (>20/HPF)',
    isAbnormal: true,
    severity: 'severe',
    signs: manySign ? [presentSign, manySign] : [presentSign],
  },
]

// boolean yes/no options
const booleanOptions = (
  sign: import('./cytology-types').CytologySign,
  abnormalOnYes = true,
): import('./cytology-types').CytologyFindingOption[] => [
  {
    value: 'absent',
    label: '없음',
    labelEn: 'Absent',
    isAbnormal: false,
    signs: [],
  },
  {
    value: 'present',
    label: '있음',
    labelEn: 'Present',
    isAbnormal: abnormalOnYes,
    severity: 'moderate',
    signs: [sign],
  },
]

// ============================================================
// 1. OTIC — 귀도말
// ============================================================
const oticSample: CytologySampleDefinition = {
  sampleType: 'otic',
  nameKo: '귀도말',
  nameEn: 'Otic Cytology',
  category: 'routine',
  stainMethods: ['Diff-Quik', '그람염색'],
  sections: [
    {
      sectionId: 'otic_background',
      label: '배경 소견',
      labelEn: 'Background',
      tests: [
        {
          testId: 'otic_cerumen',
          label: '귀지 색상',
          labelEn: 'Cerumen Color',
          testType: 'select',
          options: [
            { value: 'normal', label: '정상 (황갈색)', labelEn: 'Normal (tan/yellow)', isAbnormal: false, signs: [] },
            { value: 'dark_brown', label: '암갈색', labelEn: 'Dark brown', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'black', label: '검정색', labelEn: 'Black', isAbnormal: true, severity: 'moderate', signs: [] },
            { value: 'purulent', label: '화농성 (황색/녹색)', labelEn: 'Purulent (yellow/green)', isAbnormal: true, severity: 'severe', signs: [] },
            { value: 'bloody', label: '혈성', labelEn: 'Bloody/hemorrhagic', isAbnormal: true, severity: 'moderate', signs: [] },
          ],
        },
        {
          testId: 'otic_odor',
          label: '냄새',
          labelEn: 'Odor',
          testType: 'select',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'mild', label: '약간 있음', labelEn: 'Mild', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'moderate', label: '중등도', labelEn: 'Moderate', isAbnormal: true, severity: 'moderate', signs: [] },
            { value: 'strong', label: '심함 (악취)', labelEn: 'Strong/fetid', isAbnormal: true, severity: 'severe', signs: [] },
          ],
        },
        {
          testId: 'otic_discharge',
          label: '분비물 성상',
          labelEn: 'Discharge Character',
          testType: 'select',
          options: [
            { value: 'normal', label: '정상', labelEn: 'Normal', isAbnormal: false, signs: [] },
            { value: 'waxy', label: '납양 (wax)', labelEn: 'Waxy', isAbnormal: false, signs: [] },
            { value: 'moist', label: '습성', labelEn: 'Moist', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'purulent', label: '화농성', labelEn: 'Purulent', isAbnormal: true, severity: 'severe', signs: [] },
            { value: 'mucoid', label: '점액성', labelEn: 'Mucoid', isAbnormal: true, severity: 'moderate', signs: [] },
          ],
        },
        {
          testId: 'otic_background_protein',
          label: '단백질 배경',
          labelEn: 'Proteinaceous Background',
          testType: 'select',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'mild', label: '경미', labelEn: 'Mild', isAbnormal: false, signs: [] },
            { value: 'moderate', label: '중등도', labelEn: 'Moderate', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'heavy', label: '심함', labelEn: 'Heavy', isAbnormal: true, severity: 'moderate', signs: [] },
          ],
        },
      ],
    },
    {
      sectionId: 'otic_organisms',
      label: '미생물 소견',
      labelEn: 'Microbial Findings',
      tests: [
        {
          testId: 'otic_malassezia',
          label: 'Malassezia (효모)',
          labelEn: 'Malassezia (yeast)',
          testType: 'semiquant',
          note: '땅콩/볼링핀 모양 효모균; Diff-Quik에서 자주색-청색으로 염색',
          options: semiquantOptions('otic_malassezia'),
        },
        {
          testId: 'otic_cocci',
          label: '구균 (Cocci)',
          labelEn: 'Cocci (gram-positive)',
          testType: 'semiquant',
          note: 'Staphylococcus, Streptococcus 등 구형 세균',
          options: semiquantOptions('otic_cocci'),
        },
        {
          testId: 'otic_rods',
          label: '간균 (Rods)',
          labelEn: 'Rod bacteria',
          testType: 'semiquant',
          note: 'Pseudomonas, Proteus 등 간형 세균; 만성/재발성 외이염에서 흔함',
          options: semiquantOptions('otic_rods'),
        },
        {
          testId: 'otic_candida',
          label: 'Candida (진균)',
          labelEn: 'Candida spp.',
          testType: 'boolean',
          note: '가성균사(pseudohyphae)를 형성하는 효모; 면역저하 또는 과도한 항생제 치료 후',
          options: booleanOptions('otic_candida_present'),
        },
        {
          testId: 'otic_mixed_bacteria',
          label: '혼합 세균',
          labelEn: 'Mixed bacteria',
          testType: 'boolean',
          note: '구균과 간균이 혼재; 중증 또는 만성 감염을 시사',
          options: booleanOptions('otic_mixed_bacteria'),
        },
      ],
    },
    {
      sectionId: 'otic_cells',
      label: '세포 소견',
      labelEn: 'Cellular Findings',
      tests: [
        {
          testId: 'otic_neutrophils',
          label: '호중구',
          labelEn: 'Neutrophils',
          testType: 'semiquant',
          note: '화농성 염증의 지표; 다수 시 세균 배양 권장',
          options: semiquantOptionsSingleSign('otic_neutrophils_present', 'otic_neutrophils_many'),
        },
        {
          testId: 'otic_degenerate_neutrophils',
          label: '변성 호중구',
          labelEn: 'Degenerate neutrophils',
          testType: 'boolean',
          note: '핵 팽윤/분해 소견; 세균 독소 존재를 시사하는 패혈성 염증 지표',
          options: booleanOptions('otic_degenerate_neutrophils'),
        },
        {
          testId: 'otic_macrophages',
          label: '대식세포',
          labelEn: 'Macrophages',
          testType: 'semiquant',
          note: '만성 염증 또는 이물 반응 시 증가',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수', labelEn: 'Rare', isAbnormal: false, signs: [] },
            { value: 'few', label: '적음', labelEn: 'Few', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'moderate', label: '중등도', labelEn: 'Moderate', isAbnormal: true, severity: 'moderate', signs: [] },
            { value: 'many', label: '다수', labelEn: 'Many', isAbnormal: true, severity: 'severe', signs: [] },
          ],
        },
        {
          testId: 'otic_epithelial',
          label: '상피세포',
          labelEn: 'Epithelial cells',
          testType: 'semiquant',
          note: '정상 소량 존재; 과증식 시 만성 자극 또는 증식성 외이염 시사',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수 (정상)', labelEn: 'Rare (normal)', isAbnormal: false, signs: [] },
            { value: 'few', label: '적음', labelEn: 'Few', isAbnormal: false, signs: [] },
            { value: 'moderate', label: '중등도 (증가)', labelEn: 'Moderate (increased)', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'many', label: '다수 (현저 증가)', labelEn: 'Many (markedly increased)', isAbnormal: true, severity: 'moderate', signs: [] },
          ],
        },
        {
          testId: 'otic_rbc',
          label: '적혈구',
          labelEn: 'Red blood cells',
          testType: 'semiquant',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수', labelEn: 'Rare', isAbnormal: false, signs: [] },
            { value: 'moderate', label: '중등도', labelEn: 'Moderate', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'many', label: '다수 (출혈성)', labelEn: 'Many (hemorrhagic)', isAbnormal: true, severity: 'moderate', signs: [] },
          ],
        },
      ],
    },
    {
      sectionId: 'otic_parasites',
      label: '기생충 소견',
      labelEn: 'Parasitic Findings',
      tests: [
        {
          testId: 'otic_mites',
          label: 'Otodectes 진드기',
          labelEn: 'Otodectes cynotis (ear mites)',
          testType: 'boolean',
          note: '귀개선충; 강한 소양감과 암갈색~검정 귀지; 개/고양이 공통',
          options: booleanOptions('otic_mites_present'),
        },
        {
          testId: 'otic_mite_eggs',
          label: '진드기 알',
          labelEn: 'Mite eggs',
          testType: 'boolean',
          note: '충체가 없어도 알이 관찰되면 감염으로 판정',
          options: [
            { value: 'absent', label: '없음', labelEn: 'Absent', isAbnormal: false, signs: [] },
            { value: 'present', label: '있음', labelEn: 'Present', isAbnormal: true, severity: 'moderate', signs: ['otic_mites_present'] },
          ],
        },
      ],
    },
  ],
}

// ============================================================
// 2. SKIN IMPRESSION — 피부 인상도말
// ============================================================
const skinImpressionSample: CytologySampleDefinition = {
  sampleType: 'skin_impression',
  nameKo: '피부 인상도말',
  nameEn: 'Skin Impression Smear',
  category: 'routine',
  stainMethods: ['Diff-Quik', '그람염색'],
  sections: [
    {
      sectionId: 'skin_imp_background',
      label: '배경 소견',
      labelEn: 'Background',
      tests: [
        {
          testId: 'skin_imp_blood_contamination',
          label: '혈액 오염',
          labelEn: 'Blood contamination',
          testType: 'select',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'mild', label: '경미', labelEn: 'Mild', isAbnormal: false, signs: [] },
            { value: 'moderate', label: '중등도', labelEn: 'Moderate', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'heavy', label: '심함 (판독 제한)', labelEn: 'Heavy (limits interpretation)', isAbnormal: true, severity: 'moderate', signs: [] },
          ],
        },
        {
          testId: 'skin_imp_protein_background',
          label: '단백질성 배경',
          labelEn: 'Proteinaceous background',
          testType: 'select',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'mild', label: '경미', labelEn: 'Mild', isAbnormal: false, signs: [] },
            { value: 'moderate', label: '중등도', labelEn: 'Moderate', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'heavy', label: '심함', labelEn: 'Heavy', isAbnormal: true, severity: 'moderate', signs: [] },
          ],
        },
        {
          testId: 'skin_imp_keratin',
          label: '각화물 (케라틴)',
          labelEn: 'Keratinous debris',
          testType: 'select',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'mild', label: '경미', labelEn: 'Mild', isAbnormal: false, signs: [] },
            { value: 'moderate', label: '중등도', labelEn: 'Moderate', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'heavy', label: '심함', labelEn: 'Heavy', isAbnormal: true, severity: 'moderate', signs: [] },
          ],
        },
      ],
    },
    {
      sectionId: 'skin_imp_organisms',
      label: '미생물 소견',
      labelEn: 'Microbial Findings',
      tests: [
        {
          testId: 'skin_imp_cocci',
          label: '구균 (Cocci)',
          labelEn: 'Cocci',
          testType: 'semiquant',
          note: 'Staphylococcus pseudintermedius가 가장 흔함; 표피세포 표면 부착 양상 확인',
          options: semiquantOptions('skin_cocci'),
        },
        {
          testId: 'skin_imp_rods',
          label: '간균 (Rods)',
          labelEn: 'Rod bacteria',
          testType: 'boolean',
          note: '표재성 피부염에서는 드묾; 존재 시 이차 감염 또는 그람음성균 감염 의심',
          options: booleanOptions('skin_rods_present'),
        },
        {
          testId: 'skin_imp_malassezia',
          label: 'Malassezia (효모)',
          labelEn: 'Malassezia pachydermatis',
          testType: 'semiquant',
          note: '땅콩/볼링핀 모양; 2/HPF 이상 시 임상적 의의; 사지 사이·겨드랑이·외음부 흔함',
          options: semiquantOptions('skin_malassezia'),
        },
      ],
    },
    {
      sectionId: 'skin_imp_cells',
      label: '세포 소견',
      labelEn: 'Cellular Findings',
      tests: [
        {
          testId: 'skin_imp_neutrophils',
          label: '호중구',
          labelEn: 'Neutrophils',
          testType: 'semiquant',
          note: '급성 화농성 염증 지표; 다수 시 세균 배양/감수성 검사 권장',
          options: semiquantOptionsSingleSign('skin_neutrophils_present', 'skin_neutrophils_many'),
        },
        {
          testId: 'skin_imp_degenerate_neutrophils',
          label: '변성 호중구',
          labelEn: 'Degenerate neutrophils',
          testType: 'boolean',
          note: '핵 팽윤 및 분해; 세균 독소에 의한 패혈성 염증 강력 시사',
          options: booleanOptions('skin_degenerate_neutrophils'),
        },
        {
          testId: 'skin_imp_eosinophils',
          label: '호산구',
          labelEn: 'Eosinophils',
          testType: 'semiquant',
          note: '알레르기성/과민성 피부염, 호산구성 육아종 복합체, 기생충 감염 시 증가',
          options: semiquantOptionsSingleSign('skin_eosinophils_present', 'skin_eosinophils_many'),
        },
        {
          testId: 'skin_imp_macrophages',
          label: '대식세포',
          labelEn: 'Macrophages/Histiocytes',
          testType: 'semiquant',
          note: '만성 염증 또는 육아종성 반응 시 증가',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수', labelEn: 'Rare', isAbnormal: false, signs: [] },
            { value: 'few', label: '적음', labelEn: 'Few', isAbnormal: true, severity: 'mild', signs: ['skin_macrophages_present'] },
            { value: 'moderate', label: '중등도', labelEn: 'Moderate', isAbnormal: true, severity: 'moderate', signs: ['skin_macrophages_present'] },
            { value: 'many', label: '다수', labelEn: 'Many', isAbnormal: true, severity: 'severe', signs: ['skin_macrophages_present'] },
          ],
        },
        {
          testId: 'skin_imp_mast_cells',
          label: '비만세포',
          labelEn: 'Mast cells',
          testType: 'semiquant',
          note: '소수는 정상; 다수 또는 비정형 시 비만세포종 배제 위해 추가 FNA 권장',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수 (정상)', labelEn: 'Rare (normal)', isAbnormal: false, signs: [] },
            { value: 'few', label: '적음', labelEn: 'Few', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'moderate', label: '중등도 (비만세포종 의심)', labelEn: 'Moderate (MCT suspect)', isAbnormal: true, severity: 'moderate', signs: ['rc_mast_cell_granules'] },
            { value: 'many', label: '다수 (비만세포종 고의심)', labelEn: 'Many (MCT high suspect)', isAbnormal: true, severity: 'severe', signs: ['rc_mast_cell_granules'] },
          ],
        },
        {
          testId: 'skin_imp_plasma_cells',
          label: '형질세포',
          labelEn: 'Plasma cells',
          testType: 'boolean',
          note: '만성 면역 매개성 피부 질환 또는 형질세포성 족저피부염 시 증가',
          options: booleanOptions('skin_plasma_cells'),
        },
      ],
    },
    {
      sectionId: 'skin_imp_special',
      label: '특수 소견',
      labelEn: 'Special Findings',
      tests: [
        {
          testId: 'skin_imp_acantholytic_cells',
          label: '가시세포 (Acantholytic cells)',
          labelEn: 'Acantholytic cells',
          testType: 'boolean',
          note: '둥글고 세포질이 풍부한 각화세포; 호중구 사이 존재 시 천포창(pemphigus) 강력 시사',
          options: booleanOptions('skin_acantholytic_cells'),
        },
        {
          testId: 'skin_imp_atypical_cells',
          label: '비정형 세포',
          labelEn: 'Atypical/neoplastic cells',
          testType: 'boolean',
          note: '핵 비정형, 핵소체 두드러짐 등; 관찰 시 FNA 또는 생검 권장',
          options: [
            { value: 'absent', label: '없음', labelEn: 'Absent', isAbnormal: false, signs: [] },
            { value: 'present', label: '있음 (추가 검사 요함)', labelEn: 'Present (further workup needed)', isAbnormal: true, severity: 'critical', signs: [] },
          ],
        },
      ],
    },
  ],
}

// ============================================================
// 3. SKIN EXUDATE — 피부 삼출물 도말
// ============================================================
const skinExudateSample: CytologySampleDefinition = {
  sampleType: 'skin_exudate',
  nameKo: '피부 삼출물 도말',
  nameEn: 'Skin Exudate Cytology',
  category: 'routine',
  stainMethods: ['Diff-Quik', '그람염색'],
  sections: [
    {
      sectionId: 'skin_exu_background',
      label: '배경 소견',
      labelEn: 'Background',
      tests: [
        {
          testId: 'skin_exu_necrotic_debris',
          label: '괴사성 찌꺼기',
          labelEn: 'Necrotic debris',
          testType: 'boolean',
          note: '심부 감염, 괴사성 피부염, 화상 등에서 관찰',
          options: [
            { value: 'absent', label: '없음', labelEn: 'Absent', isAbnormal: false, signs: [] },
            { value: 'present', label: '있음', labelEn: 'Present', isAbnormal: true, severity: 'moderate', signs: ['spec_necrosis'] },
          ],
        },
        {
          testId: 'skin_exu_extracellular_bacteria',
          label: '세포외 세균',
          labelEn: 'Extracellular bacteria',
          testType: 'boolean',
          note: '세균이 세포 내가 아닌 세포 밖에 유리; 세균 과다 증식 또는 세포 파괴 시사',
          options: [
            { value: 'absent', label: '없음', labelEn: 'Absent', isAbnormal: false, signs: [] },
            { value: 'present', label: '있음', labelEn: 'Present', isAbnormal: true, severity: 'moderate', signs: ['spec_background_bacteria'] },
          ],
        },
        {
          testId: 'skin_exu_protein',
          label: '단백질성 배경',
          labelEn: 'Protein background',
          testType: 'select',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'mild', label: '경미', labelEn: 'Mild', isAbnormal: false, signs: [] },
            { value: 'moderate', label: '중등도', labelEn: 'Moderate', isAbnormal: true, severity: 'mild', signs: ['spec_high_protein'] },
            { value: 'heavy', label: '심함', labelEn: 'Heavy', isAbnormal: true, severity: 'moderate', signs: ['spec_high_protein'] },
          ],
        },
      ],
    },
    {
      sectionId: 'skin_exu_organisms',
      label: '미생물 소견',
      labelEn: 'Microbial Findings',
      tests: [
        {
          testId: 'skin_exu_cocci',
          label: '구균',
          labelEn: 'Cocci',
          testType: 'semiquant',
          note: 'Staphylococcus 속이 가장 흔함; 세포 내 탐식 여부 확인',
          options: semiquantOptions('skin_cocci'),
        },
        {
          testId: 'skin_exu_rods',
          label: '간균',
          labelEn: 'Rod bacteria',
          testType: 'semiquant',
          note: 'Pseudomonas, E. coli 등; 만성 상처 또는 항생제 치료 실패 시 흔함',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수', labelEn: 'Rare', isAbnormal: true, severity: 'mild', signs: ['skin_rods_present'] },
            { value: 'few', label: '적음', labelEn: 'Few', isAbnormal: true, severity: 'mild', signs: ['skin_rods_present'] },
            { value: 'moderate', label: '중등도', labelEn: 'Moderate', isAbnormal: true, severity: 'moderate', signs: ['skin_rods_present'] },
            { value: 'many', label: '다수', labelEn: 'Many', isAbnormal: true, severity: 'severe', signs: ['skin_rods_present'] },
          ],
        },
        {
          testId: 'skin_exu_mixed_bacteria',
          label: '혼합 세균',
          labelEn: 'Mixed bacteria',
          testType: 'boolean',
          note: '구균+간균 혼합; 복잡성 감염 또는 다균성 감염을 시사',
          options: [
            { value: 'absent', label: '없음', labelEn: 'Absent', isAbnormal: false, signs: [] },
            { value: 'present', label: '있음', labelEn: 'Present', isAbnormal: true, severity: 'moderate', signs: ['otic_mixed_bacteria'] },
          ],
        },
        {
          testId: 'skin_exu_fungal_hyphae',
          label: '진균 균사',
          labelEn: 'Fungal hyphae',
          testType: 'boolean',
          note: 'Dermatophytes, Aspergillus 등; 진균배양 병행 권장',
          options: [
            { value: 'absent', label: '없음', labelEn: 'Absent', isAbnormal: false, signs: [] },
            { value: 'present', label: '있음', labelEn: 'Present', isAbnormal: true, severity: 'severe', signs: [] },
          ],
        },
      ],
    },
    {
      sectionId: 'skin_exu_cells',
      label: '세포 소견',
      labelEn: 'Cellular Findings',
      tests: [
        {
          testId: 'skin_exu_neutrophils',
          label: '호중구',
          labelEn: 'Neutrophils',
          testType: 'semiquant',
          note: '삼출물의 주된 세포; 화농성 염증 반응의 핵심 지표',
          options: semiquantOptionsSingleSign('skin_neutrophils_present', 'skin_neutrophils_many'),
        },
        {
          testId: 'skin_exu_degenerate_neutrophils',
          label: '변성 호중구',
          labelEn: 'Degenerate neutrophils',
          testType: 'semiquant',
          note: '핵 팽윤(karyolysis); 정도가 높을수록 세균 독소 부하 심각',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수', labelEn: 'Rare', isAbnormal: false, signs: [] },
            { value: 'few', label: '적음 (<25%)', labelEn: 'Few (<25%)', isAbnormal: true, severity: 'mild', signs: ['skin_degenerate_neutrophils'] },
            { value: 'moderate', label: '중등도 (25-50%)', labelEn: 'Moderate (25-50%)', isAbnormal: true, severity: 'moderate', signs: ['skin_degenerate_neutrophils'] },
            { value: 'many', label: '다수 (>50%)', labelEn: 'Many (>50%)', isAbnormal: true, severity: 'severe', signs: ['skin_degenerate_neutrophils'] },
          ],
        },
        {
          testId: 'skin_exu_macrophages',
          label: '대식세포',
          labelEn: 'Macrophages',
          testType: 'semiquant',
          note: '만성 염증 또는 이물 반응; 세포 내 탐식(erythrophagocytosis, leukophagocytosis) 여부 확인',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수', labelEn: 'Rare', isAbnormal: false, signs: [] },
            { value: 'few', label: '적음', labelEn: 'Few', isAbnormal: true, severity: 'mild', signs: ['skin_macrophages_present'] },
            { value: 'moderate', label: '중등도', labelEn: 'Moderate', isAbnormal: true, severity: 'moderate', signs: ['skin_macrophages_present'] },
            { value: 'many', label: '다수', labelEn: 'Many', isAbnormal: true, severity: 'severe', signs: ['skin_macrophages_present'] },
          ],
        },
        {
          testId: 'skin_exu_giant_cells',
          label: '거대세포 (Giant cells)',
          labelEn: 'Multinucleated giant cells',
          testType: 'boolean',
          note: '육아종성 염증의 지표; 이물, 진균, 마이코박테리아 감염 시 관찰',
          options: booleanOptions('skin_giant_cells'),
        },
        {
          testId: 'skin_exu_eosinophils',
          label: '호산구',
          labelEn: 'Eosinophils',
          testType: 'semiquant',
          note: '알레르기성 피부 질환, 기생충, 호산구성 육아종 복합체 시 증가',
          options: semiquantOptionsSingleSign('skin_eosinophils_present', 'skin_eosinophils_many'),
        },
      ],
    },
  ],
}

// ============================================================
// 4. FECAL — 분변염색
// ============================================================
const fecalSample: CytologySampleDefinition = {
  sampleType: 'fecal',
  nameKo: '분변염색',
  nameEn: 'Fecal Cytology',
  category: 'routine',
  stainMethods: ['Diff-Quik', '그람염색', 'Lugol 요오드'],
  sections: [
    {
      sectionId: 'fecal_method',
      label: '염색 방법',
      labelEn: 'Stain Method',
      tests: [
        {
          testId: 'fecal_stain_method',
          label: '사용 염색법',
          labelEn: 'Stain used',
          testType: 'select',
          options: [
            { value: 'diff_quik', label: 'Diff-Quik', labelEn: 'Diff-Quik', isAbnormal: false, signs: [] },
            { value: 'gram', label: '그람염색', labelEn: 'Gram stain', isAbnormal: false, signs: [] },
            { value: 'lugol', label: 'Lugol 요오드', labelEn: 'Lugol iodine', isAbnormal: false, signs: [] },
          ],
        },
        {
          testId: 'fecal_sample_quality',
          label: '검체 상태',
          labelEn: 'Sample quality',
          testType: 'select',
          options: [
            { value: 'good', label: '양호', labelEn: 'Good', isAbnormal: false, signs: [] },
            { value: 'fair', label: '보통', labelEn: 'Fair', isAbnormal: false, signs: [] },
            { value: 'poor', label: '불량 (판독 제한)', labelEn: 'Poor (limited interpretation)', isAbnormal: false, signs: [] },
            { value: 'diarrhea', label: '수양성 (설사)', labelEn: 'Watery (diarrhea)', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'bloody', label: '혈성', labelEn: 'Bloody', isAbnormal: true, severity: 'moderate', signs: [] },
          ],
        },
      ],
    },
    {
      sectionId: 'fecal_bacteria',
      label: '세균총 소견',
      labelEn: 'Bacterial Flora',
      tests: [
        {
          testId: 'fecal_bacteria_overall',
          label: '전체 세균총',
          labelEn: 'Overall bacterial flora',
          testType: 'select',
          options: [
            { value: 'normal', label: '정상 (다양한 세균)', labelEn: 'Normal (diverse flora)', isAbnormal: false, signs: ['fecal_bacteria_normal'] },
            { value: 'overgrowth', label: '세균 과증식 (dysbiosis)', labelEn: 'Bacterial overgrowth (dysbiosis)', isAbnormal: true, severity: 'moderate', signs: ['fecal_bacteria_overgrowth'] },
            { value: 'sparse', label: '세균 감소', labelEn: 'Sparse flora', isAbnormal: true, severity: 'mild', signs: [] },
          ],
        },
        {
          testId: 'fecal_rods_proportion',
          label: '간균 비율',
          labelEn: 'Rod bacteria proportion',
          testType: 'select',
          note: '정상 분변에서 간균 우세가 일반적',
          options: [
            { value: 'normal', label: '정상 비율', labelEn: 'Normal proportion', isAbnormal: false, signs: [] },
            { value: 'excess', label: '과증식 (>80%)', labelEn: 'Excess (>80%)', isAbnormal: true, severity: 'mild', signs: ['fecal_rods_excess'] },
            { value: 'absent', label: '거의 없음', labelEn: 'Absent/rare', isAbnormal: true, severity: 'mild', signs: [] },
          ],
        },
        {
          testId: 'fecal_cocci_proportion',
          label: '구균 비율',
          labelEn: 'Coccal bacteria proportion',
          testType: 'select',
          note: '구균 우세 시 비정상 세균총을 시사',
          options: [
            { value: 'normal', label: '정상 비율 (<30%)', labelEn: 'Normal (<30%)', isAbnormal: false, signs: [] },
            { value: 'increased', label: '증가 (30-50%)', labelEn: 'Increased (30-50%)', isAbnormal: true, severity: 'mild', signs: ['fecal_cocci_excess'] },
            { value: 'dominant', label: '우세 (>50%, 구균 우세 세균증)', labelEn: 'Dominant (>50%)', isAbnormal: true, severity: 'moderate', signs: ['fecal_cocci_excess'] },
          ],
        },
        {
          testId: 'fecal_spiral_bacteria',
          label: '나선형균 (Helicobacter/Campylobacter)',
          labelEn: 'Spiral bacteria',
          testType: 'boolean',
          note: 'S자 또는 갈매기 날개 모양; Campylobacter 또는 Helicobacter를 시사; PCR 추가 권장',
          options: booleanOptions('fecal_spiral_bacteria'),
        },
        {
          testId: 'fecal_clostridium_spores',
          label: 'Clostridium 아포 (Spores)',
          labelEn: 'Clostridial spores',
          testType: 'semiquant',
          note: '말단 아포를 가진 굵은 간균; 아포 >5/HPF 시 Clostridium 과증식 의심; 독소 검사 권장',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수 (1-2/HPF)', labelEn: 'Rare (1-2/HPF)', isAbnormal: false, signs: [] },
            { value: 'few', label: '적음 (3-5/HPF)', labelEn: 'Few (3-5/HPF)', isAbnormal: true, severity: 'mild', signs: ['fecal_spores_clostridium'] },
            { value: 'moderate', label: '중등도 (6-20/HPF)', labelEn: 'Moderate (6-20/HPF)', isAbnormal: true, severity: 'moderate', signs: ['fecal_spores_clostridium'] },
            { value: 'many', label: '다수 (>20/HPF, 임상적 의의)', labelEn: 'Many (>20/HPF, significant)', isAbnormal: true, severity: 'severe', signs: ['fecal_spores_clostridium'] },
          ],
        },
        {
          testId: 'fecal_yeast',
          label: '효모',
          labelEn: 'Yeast',
          testType: 'boolean',
          note: '소수는 정상; 다수 또는 출아형 활발 시 과증식 의심; 항생제 치료 후 종종 관찰',
          options: booleanOptions('fecal_yeast_present'),
        },
      ],
    },
    {
      sectionId: 'fecal_parasites',
      label: '기생충 소견',
      labelEn: 'Parasitic Findings',
      tests: [
        {
          testId: 'fecal_giardia',
          label: 'Giardia cyst',
          labelEn: 'Giardia cyst',
          testType: 'boolean',
          note: '타원형 낭포; 내부 핵/편모 구조 확인; Lugol 요오드로 관찰 용이; 항원 검사 병행 권장',
          options: booleanOptions('fecal_giardia'),
        },
        {
          testId: 'fecal_isospora',
          label: 'Isospora (Cystoisospora) 오오시스트',
          labelEn: 'Isospora oocysts',
          testType: 'boolean',
          note: '구형~타원형 오오시스트; 어린 동물에서 흔한 장염 원인',
          options: booleanOptions('fecal_isospora'),
        },
        {
          testId: 'fecal_toxocara',
          label: 'Toxocara 충란',
          labelEn: 'Toxocara eggs',
          testType: 'boolean',
          note: '구형, 두꺼운 단백성 껍질; 인수공통 기생충으로 공중보건 중요',
          options: booleanOptions('fecal_toxocara'),
        },
        {
          testId: 'fecal_trichuris',
          label: 'Trichuris (편충) 충란',
          labelEn: 'Trichuris eggs',
          testType: 'boolean',
          note: '럭비공/레몬 모양, 양극 플러그 특징; 개 대장염 원인',
          options: booleanOptions('fecal_trichuris'),
        },
        {
          testId: 'fecal_strongyle',
          label: 'Strongyle형 충란',
          labelEn: 'Strongyle-type eggs',
          testType: 'boolean',
          note: '얇은 껍질의 타원형 충란; 분변배양으로 속 수준 동정 권장',
          options: booleanOptions('fecal_strongyle'),
        },
        {
          testId: 'fecal_cryptosporidium',
          label: 'Cryptosporidium 오오시스트',
          labelEn: 'Cryptosporidium oocysts',
          testType: 'boolean',
          note: '매우 소형(4-6µm); 변형 항산성 염색 또는 항원 검사 필요',
          options: [
            { value: 'absent', label: '없음', labelEn: 'Absent', isAbnormal: false, signs: [] },
            { value: 'suspected', label: '의심 (확진검사 요함)', labelEn: 'Suspected (confirm required)', isAbnormal: true, severity: 'moderate', signs: [] },
          ],
        },
        {
          testId: 'fecal_ancylostoma',
          label: 'Ancylostoma (구충) 충란',
          labelEn: 'Ancylostoma (hookworm) eggs',
          testType: 'boolean',
          note: '얇은 껍질 타원형, 내부 배세포 발달; 대량 감염 시 빈혈 유발',
          options: [
            { value: 'absent', label: '없음', labelEn: 'Absent', isAbnormal: false, signs: [] },
            { value: 'present', label: '있음', labelEn: 'Present', isAbnormal: true, severity: 'moderate', signs: [] },
          ],
        },
      ],
    },
    {
      sectionId: 'fecal_cells',
      label: '염증세포 소견',
      labelEn: 'Inflammatory Cell Findings',
      tests: [
        {
          testId: 'fecal_neutrophils',
          label: '호중구',
          labelEn: 'Neutrophils',
          testType: 'boolean',
          note: '분변 내 호중구 존재는 삼출성 장염(exudative enteritis) 또는 대장염 시사',
          options: booleanOptions('fecal_neutrophils_present'),
        },
        {
          testId: 'fecal_rbc',
          label: '적혈구',
          labelEn: 'Red blood cells',
          testType: 'boolean',
          note: '혈변(hematochezia) 또는 출혈성 장염 시사; 출혈 부위 감별 필요',
          options: booleanOptions('fecal_rbc_present'),
        },
        {
          testId: 'fecal_epithelial_cells',
          label: '장상피세포',
          labelEn: 'Intestinal epithelial cells',
          testType: 'select',
          options: [
            { value: 'normal', label: '정상 탈락', labelEn: 'Normal shedding', isAbnormal: false, signs: [] },
            { value: 'increased', label: '증가', labelEn: 'Increased', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'many', label: '다수 (점막 손상 시사)', labelEn: 'Many (mucosal damage)', isAbnormal: true, severity: 'moderate', signs: [] },
          ],
        },
      ],
    },
  ],
}

// ============================================================
// 5. VAGINAL — 질 세포진
// ============================================================
const vaginalSample: CytologySampleDefinition = {
  sampleType: 'vaginal',
  nameKo: '질 세포진',
  nameEn: 'Vaginal Cytology',
  category: 'routine',
  stainMethods: ['Diff-Quik', '라이트-김자'],
  sections: [
    {
      sectionId: 'vag_epithelial',
      label: '상피세포 소견',
      labelEn: 'Epithelial Cell Findings',
      tests: [
        {
          testId: 'vag_superficial_cells',
          label: '표재성 세포 (Superficial cells)',
          labelEn: 'Superficial cells',
          testType: 'semiquant',
          note: '에스트로겐 영향을 받은 각화 세포; 핵 소형·농축(pyknotic) 또는 무핵(anuclear); 발정기 지표',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수', labelEn: 'Rare', isAbnormal: false, signs: [] },
            { value: 'few', label: '적음 (20-49%)', labelEn: 'Few (20-49%)', isAbnormal: false, signs: [] },
            {
              value: 'moderate',
              label: '중등도 (50-74%, 전발정기)',
              labelEn: 'Moderate (50-74%, proestrus)',
              isAbnormal: false,
              signs: ['vag_superficial_dominant'],
            },
            {
              value: 'many',
              label: '다수 (≥75%, 발정기)',
              labelEn: 'Many (≥75%, estrus)',
              isAbnormal: false,
              severity: 'mild',
              signs: ['vag_superficial_dominant', 'vag_cornified_cells'],
            },
          ],
        },
        {
          testId: 'vag_intermediate_cells',
          label: '중간세포 (Intermediate cells)',
          labelEn: 'Intermediate cells',
          testType: 'semiquant',
          note: '중간 크기 세포; 발정간기 및 발정후기 초기에 우세',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수', labelEn: 'Rare', isAbnormal: false, signs: [] },
            { value: 'few', label: '적음', labelEn: 'Few', isAbnormal: false, signs: ['vag_intermediate_dominant'] },
            { value: 'moderate', label: '중등도 (발정후기/발정간기)', labelEn: 'Moderate (metestrus/diestrus)', isAbnormal: false, signs: ['vag_intermediate_dominant'] },
            { value: 'many', label: '다수 (발정후기 초기)', labelEn: 'Many (early metestrus)', isAbnormal: false, signs: ['vag_intermediate_dominant'] },
          ],
        },
        {
          testId: 'vag_parabasal_cells',
          label: '방기저세포 (Parabasal cells)',
          labelEn: 'Parabasal cells',
          testType: 'semiquant',
          note: '핵이 크고 세포질이 적음; 무발정기 및 난소적출 동물에서 우세; 우세 시 무발정기 지표',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수', labelEn: 'Rare', isAbnormal: false, signs: [] },
            { value: 'few', label: '적음', labelEn: 'Few', isAbnormal: false, signs: [] },
            {
              value: 'moderate',
              label: '중등도 (무발정기)',
              labelEn: 'Moderate (anestrus)',
              isAbnormal: false,
              signs: ['vag_parabasal_dominant'],
            },
            {
              value: 'many',
              label: '다수 (무발정기/난소적출)',
              labelEn: 'Many (anestrus/spayed)',
              isAbnormal: false,
              signs: ['vag_parabasal_dominant'],
            },
          ],
        },
        {
          testId: 'vag_cornified_cells',
          label: '각화세포 (Cornified/anuclear)',
          labelEn: 'Cornified (anuclear) cells',
          testType: 'boolean',
          note: '완전 각화된 무핵 편평상피세포; 발정기 peak 지표',
          options: [
            { value: 'absent', label: '없음', labelEn: 'Absent', isAbnormal: false, signs: [] },
            { value: 'present', label: '있음 (발정기)', labelEn: 'Present (estrus)', isAbnormal: false, signs: ['vag_cornified_cells'] },
          ],
        },
        {
          testId: 'vag_foam_cells',
          label: '폼세포 (Foam/metestrum cells)',
          labelEn: 'Foam cells (metestrum cells)',
          testType: 'boolean',
          note: '호중구를 탐식한 중간세포; 발정후기 초기 특징적 소견',
          options: [
            { value: 'absent', label: '없음', labelEn: 'Absent', isAbnormal: false, signs: [] },
            { value: 'present', label: '있음 (발정후기)', labelEn: 'Present (metestrus)', isAbnormal: false, signs: [] },
          ],
        },
      ],
    },
    {
      sectionId: 'vag_inflammation',
      label: '염증 소견',
      labelEn: 'Inflammatory Findings',
      tests: [
        {
          testId: 'vag_neutrophils',
          label: '호중구',
          labelEn: 'Neutrophils',
          testType: 'semiquant',
          note: '발정기에는 정상적으로 감소; 증가 시 질염 또는 자궁 감염(자궁축농증) 시사',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수 (정상 발정기)', labelEn: 'Rare (normal in estrus)', isAbnormal: false, signs: [] },
            { value: 'few', label: '적음', labelEn: 'Few', isAbnormal: false, signs: ['vag_neutrophils_few'] },
            { value: 'moderate', label: '중등도 (질염 의심)', labelEn: 'Moderate (vaginitis suspect)', isAbnormal: true, severity: 'moderate', signs: ['vag_neutrophils_few', 'vag_neutrophils_many'] },
            { value: 'many', label: '다수 (질염/자궁축농증)', labelEn: 'Many (vaginitis/pyometra)', isAbnormal: true, severity: 'severe', signs: ['vag_neutrophils_many'] },
          ],
        },
        {
          testId: 'vag_rbc',
          label: '적혈구',
          labelEn: 'Red blood cells',
          testType: 'semiquant',
          note: '전발정기에 정상적으로 존재; 발정기 외 다수 시 병적 출혈 감별',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수', labelEn: 'Rare', isAbnormal: false, signs: [] },
            { value: 'few', label: '적음 (전발정기 정상)', labelEn: 'Few (normal proestrus)', isAbnormal: false, signs: ['vag_rbc_present'] },
            { value: 'moderate', label: '중등도', labelEn: 'Moderate', isAbnormal: true, severity: 'mild', signs: ['vag_rbc_present'] },
            { value: 'many', label: '다수 (출혈 의심)', labelEn: 'Many (hemorrhage suspect)', isAbnormal: true, severity: 'moderate', signs: ['vag_rbc_present'] },
          ],
        },
      ],
    },
    {
      sectionId: 'vag_bacteria',
      label: '세균 소견',
      labelEn: 'Bacterial Findings',
      tests: [
        {
          testId: 'vag_bacteria',
          label: '세균',
          labelEn: 'Bacteria',
          testType: 'semiquant',
          note: '소량은 정상 질 세균총; 다수 또는 다형성 시 질염 또는 자궁내막염 시사',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'rare', label: '소수 (정상 세균총)', labelEn: 'Rare (normal flora)', isAbnormal: false, signs: [] },
            { value: 'few', label: '적음', labelEn: 'Few', isAbnormal: false, signs: ['vag_bacteria_few'] },
            { value: 'moderate', label: '중등도 (세균 증가)', labelEn: 'Moderate (increased bacteria)', isAbnormal: true, severity: 'mild', signs: ['vag_bacteria_few'] },
            { value: 'many', label: '다수 (과증식, 질염 의심)', labelEn: 'Many (overgrowth, vaginitis)', isAbnormal: true, severity: 'moderate', signs: ['vag_bacteria_many'] },
          ],
        },
      ],
    },
    {
      sectionId: 'vag_cycle_assessment',
      label: '발정주기 판정',
      labelEn: 'Estrous Cycle Assessment',
      tests: [
        {
          testId: 'vag_cycle_stage',
          label: '발정주기 단계',
          labelEn: 'Cycle stage',
          testType: 'select',
          note: '세포 구성비를 종합하여 판정',
          options: [
            { value: 'anestrus', label: '무발정기 (Anestrus)', labelEn: 'Anestrus', isAbnormal: false, signs: ['vag_parabasal_dominant'] },
            { value: 'proestrus_early', label: '전발정기 초기 (Early proestrus)', labelEn: 'Early proestrus', isAbnormal: false, signs: [] },
            { value: 'proestrus_late', label: '전발정기 후기 (Late proestrus)', labelEn: 'Late proestrus', isAbnormal: false, signs: ['vag_superficial_dominant'] },
            { value: 'estrus', label: '발정기 (Estrus)', labelEn: 'Estrus', isAbnormal: false, signs: ['vag_superficial_dominant', 'vag_cornified_cells'] },
            { value: 'metestrus', label: '발정후기 (Metestrus)', labelEn: 'Metestrus', isAbnormal: false, signs: ['vag_intermediate_dominant'] },
            { value: 'diestrus', label: '발정간기 (Diestrus)', labelEn: 'Diestrus', isAbnormal: false, signs: ['vag_parabasal_dominant'] },
          ],
        },
      ],
    },
  ],
}

// ============================================================
// 6. CONJUNCTIVAL — 결막/각막 도말
// ============================================================
const conjunctivalSample: CytologySampleDefinition = {
  sampleType: 'conjunctival',
  nameKo: '결막/각막 도말',
  nameEn: 'Conjunctival/Corneal Cytology',
  category: 'routine',
  stainMethods: ['Diff-Quik', '그람염색', 'Giemsa'],
  sections: [
    {
      sectionId: 'conj_background',
      label: '배경 소견',
      labelEn: 'Background',
      tests: [
        {
          testId: 'conj_discharge_type',
          label: '분비물 성상',
          labelEn: 'Discharge type',
          testType: 'select',
          options: [
            { value: 'none', label: '없음', labelEn: 'None', isAbnormal: false, signs: [] },
            { value: 'serous', label: '장액성', labelEn: 'Serous', isAbnormal: false, signs: [] },
            { value: 'mucoid', label: '점액성', labelEn: 'Mucoid', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'mucopurulent', label: '점액화농성', labelEn: 'Mucopurulent', isAbnormal: true, severity: 'moderate', signs: [] },
            { value: 'purulent', label: '화농성', labelEn: 'Purulent', isAbnormal: true, severity: 'severe', signs: [] },
          ],
        },
        {
          testId: 'conj_sample_site',
          label: '채취 부위',
          labelEn: 'Sample site',
          testType: 'select',
          options: [
            { value: 'conjunctiva', label: '결막', labelEn: 'Conjunctiva', isAbnormal: false, signs: [] },
            { value: 'cornea', label: '각막', labelEn: 'Cornea', isAbnormal: false, signs: [] },
            { value: 'both', label: '결막+각막', labelEn: 'Conjunctiva + Cornea', isAbnormal: false, signs: [] },
            { value: 'nictitating', label: '순막 (제3안검)', labelEn: 'Nictitating membrane', isAbnormal: false, signs: [] },
          ],
        },
      ],
    },
    {
      sectionId: 'conj_organisms',
      label: '미생물 소견',
      labelEn: 'Microbial Findings',
      tests: [
        {
          testId: 'conj_cocci',
          label: '구균',
          labelEn: 'Cocci',
          testType: 'semiquant',
          note: 'Staphylococcus, Streptococcus 흔함; 세포 내 탐식 여부 확인',
          options: semiquantOptionsSingleSign('conj_cocci_present'),
        },
        {
          testId: 'conj_rods',
          label: '간균',
          labelEn: 'Rod bacteria',
          testType: 'semiquant',
          note: 'Pseudomonas, Moraxella 등; 각막궤양 시 그람음성균 배양 권장',
          options: semiquantOptionsSingleSign('conj_rods_present'),
        },
        {
          testId: 'conj_fungal',
          label: '진균 (균사/효모)',
          labelEn: 'Fungal elements',
          testType: 'boolean',
          note: '각막진균증(keratomycosis); 외상 또는 장기 항생제/스테로이드 치료 후; 진균 배양 필수',
          options: [
            { value: 'absent', label: '없음', labelEn: 'Absent', isAbnormal: false, signs: [] },
            { value: 'present', label: '있음 (진균배양 필요)', labelEn: 'Present (culture needed)', isAbnormal: true, severity: 'severe', signs: [] },
          ],
        },
      ],
    },
    {
      sectionId: 'conj_cells',
      label: '세포 소견',
      labelEn: 'Cellular Findings',
      tests: [
        {
          testId: 'conj_neutrophils',
          label: '호중구',
          labelEn: 'Neutrophils',
          testType: 'semiquant',
          note: '화농성 결막염의 주된 세포; 변성 시 세균 감염 강력 시사',
          options: semiquantOptionsSingleSign('conj_neutrophils_present'),
        },
        {
          testId: 'conj_eosinophils',
          label: '호산구',
          labelEn: 'Eosinophils',
          testType: 'boolean',
          note: '알레르기성/호산구성 결막염 특징; 고양이 호산구성 각결막염의 핵심 세포',
          options: booleanOptions('conj_eosinophils_present'),
        },
        {
          testId: 'conj_mast_cells',
          label: '비만세포',
          labelEn: 'Mast cells',
          testType: 'boolean',
          note: '과민반응 및 알레르기성 결막염 시 증가; 과립이 뚜렷한 대형 세포',
          options: booleanOptions('conj_mast_cells_present'),
        },
        {
          testId: 'conj_lymphocytes',
          label: '림프구',
          labelEn: 'Lymphocytes',
          testType: 'boolean',
          note: '만성 결막염, 바이러스 감염, 면역 매개성 안질환에서 증가',
          options: booleanOptions('conj_lymphocytes_present'),
        },
        {
          testId: 'conj_plasma_cells',
          label: '형질세포',
          labelEn: 'Plasma cells',
          testType: 'boolean',
          note: '만성 면역매개성 결막염; 개 pannus(표재성 각막혈관신생염) 등에서 관찰',
          options: [
            { value: 'absent', label: '없음', labelEn: 'Absent', isAbnormal: false, signs: [] },
            { value: 'present', label: '있음', labelEn: 'Present', isAbnormal: true, severity: 'mild', signs: ['rc_plasma_cells'] },
          ],
        },
        {
          testId: 'conj_macrophages',
          label: '대식세포',
          labelEn: 'Macrophages',
          testType: 'boolean',
          note: '만성 육아종성 결막염 또는 이물 반응 시 증가',
          options: [
            { value: 'absent', label: '없음', labelEn: 'Absent', isAbnormal: false, signs: [] },
            { value: 'present', label: '있음', labelEn: 'Present', isAbnormal: true, severity: 'mild', signs: [] },
          ],
        },
      ],
    },
    {
      sectionId: 'conj_special',
      label: '특수 소견',
      labelEn: 'Special Findings',
      tests: [
        {
          testId: 'conj_inclusion_bodies',
          label: '봉입체 (Inclusion bodies)',
          labelEn: 'Intracellular inclusion bodies',
          testType: 'boolean',
          note: '상피세포 내 청색/자색 봉입체; Chlamydophila felis (고양이), Distemper 등 바이러스 감염 시사; Giemsa 염색에서 잘 관찰',
          options: booleanOptions('conj_inclusion_bodies'),
        },
        {
          testId: 'conj_goblet_cells',
          label: '배상세포 증가',
          labelEn: 'Goblet cell hyperplasia',
          testType: 'boolean',
          note: '점액 분비 배상세포 증가; 만성 자극, 알레르기, Chlamydophila 감염 시 관찰',
          options: booleanOptions('conj_goblet_cells_increased'),
        },
        {
          testId: 'conj_epithelial_changes',
          label: '상피세포 변성/증식',
          labelEn: 'Epithelial degeneration/hyperplasia',
          testType: 'select',
          options: [
            { value: 'normal', label: '정상', labelEn: 'Normal', isAbnormal: false, signs: [] },
            { value: 'vacuolation', label: '공포 변성', labelEn: 'Vacuolation', isAbnormal: true, severity: 'mild', signs: [] },
            { value: 'squamous_metaplasia', label: '편평상피화생', labelEn: 'Squamous metaplasia', isAbnormal: true, severity: 'moderate', signs: [] },
            { value: 'atypical', label: '비정형 증식 (종양 배제 필요)', labelEn: 'Atypical (neoplasia excluded)', isAbnormal: true, severity: 'severe', signs: [] },
          ],
        },
        {
          testId: 'conj_melanin_pigment',
          label: '멜라닌 색소',
          labelEn: 'Melanin pigment',
          testType: 'select',
          options: [
            { value: 'absent', label: '없음', labelEn: 'Absent', isAbnormal: false, signs: [] },
            { value: 'mild', label: '경미 (정상 색소)', labelEn: 'Mild (normal)', isAbnormal: false, signs: [] },
            { value: 'increased', label: '증가 (색소과침착)', labelEn: 'Increased (hyperpigmentation)', isAbnormal: true, severity: 'mild', signs: [] },
          ],
        },
      ],
    },
  ],
}

// ============================================================
// Export
// ============================================================
export const cytologyRoutineSamples: CytologySampleDefinition[] = [
  oticSample,
  skinImpressionSample,
  skinExudateSample,
  fecalSample,
  vaginalSample,
  conjunctivalSample,
]

export const cytologyRoutineMap: Record<string, CytologySampleDefinition> =
  Object.fromEntries(cytologyRoutineSamples.map(s => [s.sampleType, s]))
