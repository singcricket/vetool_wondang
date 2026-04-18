import type { DentalTest } from './dentalTest_types';

// ============================================================
// DENTAL_CHART_TESTS
// 차트 전체(구강 전반) 수준 검사 항목
// dental_charts 테이블에 저장
// ============================================================

export const DENTAL_CHART_TESTS: Record<string, DentalTest> = {

  // ── 두개형 ──────────────────────────────────────────────────
  skull_type: {
    testID:     'skull_type',
    testName:   'Skull Type',
    testNameKo: '두개형',
    testType:   'select',
    testInfo:   '두개골 형태에 따라 치아 배열, 교합, 과밀(crowding) 양상이 달라집니다. 단두종은 치아 과밀 및 교합 이상 위험이 높습니다.',
    affectedSpecies: ['canine', 'feline'],
    options: [
      { value: 'dolichocephalic', detail: 'Dolichocephalic', label: '장두형 (Dolichocephalic)' },
      { value: 'mesocephalic',    detail: 'Mesocephalic',    label: '중두형 (Mesocephalic)' },
      { value: 'brachycephalic',  detail: 'Brachycephalic',  label: '단두형 (Brachycephalic)' },
    ],
    optComment: {
      dolichocephalic: '장두형. 치아 간격이 넓은 경향. 치아 수 확인 필요.',
      mesocephalic:    '중두형. 정상적인 치아 배열 기대.',
      brachycephalic:  '단두형. 치아 과밀, 회전치(rotation), 교합 이상 위험 증가. 각 치아의 배열 및 교합 상태 주의 깊게 평가 필요.',
    },
    generalComment: {
      dolichocephalic: '주둥이가 긴 형태입니다. 치아 간격이 넓을 수 있습니다.',
      mesocephalic:    '일반적인 두개골 형태입니다.',
      brachycephalic:  '납작한 얼굴 형태입니다. 치아가 겹치거나 불규칙하게 배열될 가능성이 높아 주의 깊은 치과 관리가 필요합니다.',
    },
    urgency: {
      dolichocephalic: 'monitor',
      mesocephalic:    'none',
      brachycephalic:  'monitor',
    },
    suggestedTx: {
      dolichocephalic: [],
      mesocephalic:    [],
      brachycephalic:  [],
    },
    noteTags: ['skull type', 'brachycephalic', 'dolichocephalic'],
  },

  // ── 교합 ──────────────────────────────────────────────────
  occlusion: {
    testID:     'occlusion',
    testName:   'Occlusion',
    testNameKo: '교합',
    testType:   'select',
    testInfo:   'AVDC 분류 기준. Class 1(치성 부정교합), Class 2(하악 단악), Class 3(상악 단악), Class 4(비대칭). 정상 교합은 가위교합(scissor bite).',
    affectedSpecies: ['canine', 'feline'],
    options: [
      { value: 'normal',  detail: 'Normal occlusion (Scissor bite)', label: '정상 교합' },
      { value: 'MAL1',    detail: 'Class 1 malocclusion (neutroclusion)',             label: 'Class 1 부정교합 (치성)' },
      { value: 'MAL2',    detail: 'Class 2 malocclusion (mandibular distoclusion)',   label: 'Class 2 부정교합 (하악 단악)' },
      { value: 'MAL3',    detail: 'Class 3 malocclusion (mandibular mesioclusion)',   label: 'Class 3 부정교합 (상악 단악)' },
      { value: 'MAL4',    detail: 'Class 4 malocclusion (asymmetric)',                label: 'Class 4 부정교합 (비대칭)' },
    ],
    optComment: {
      normal: '정상 가위교합. 상악 절치가 하악 절치 앞쪽에 위치, 상악 P4가 하악 M1 협측에 위치.',
      MAL1:   '치성 부정교합(MAL1). 악골 길이는 정상이나 개별 치아 위치 이상. 각 치아별 버전(linguoversion, buccoversion 등) 세부 기록 필요.',
      MAL2:   '하악 단악(MAL2). 상악이 하악보다 상대적으로 길어 하악 견치가 상악 경구개를 외상성 접촉할 수 있음. 외상성 구개 병변 확인 필요.',
      MAL3:   '상악 단악(MAL3). 하악이 상대적으로 길어 전방 반대교합(anterior crossbite) 발생. 단두종에서 정상적일 수 있음.',
      MAL4:   '비대칭 골격성 부정교합(MAL4). 방향(DV/RC/STS) 세부 기록 필요. 외상, 성장 이상, 종양 가능성 평가.',
    },
    generalComment: {
      normal: '정상적인 교합 상태입니다.',
      MAL1:   '일부 치아의 위치가 정상과 다릅니다. 외상이나 불편함을 유발하는지 확인이 필요합니다.',
      MAL2:   '아래턱이 위턱보다 짧아 이빨 위치가 어긋나 있습니다. 잇몸이나 구개에 상처를 줄 수 있어 치료가 필요할 수 있습니다.',
      MAL3:   '위턱이 아래턱보다 짧은 형태입니다. 단두종에서는 정상일 수 있으나 외상 여부 확인이 필요합니다.',
      MAL4:   '턱의 좌우 또는 앞뒤가 비대칭인 상태입니다. 정밀 평가가 필요합니다.',
    },
    urgency: {
      normal: 'none',
      MAL1:   'monitor',
      MAL2:   'recommended',
      MAL3:   'monitor',
      MAL4:   'recommended',
    },
    suggestedTx: {
      normal: [],
      MAL1:   ['OC'],
      MAL2:   ['OC', 'OA', 'IP'],
      MAL3:   ['OC'],
      MAL4:   ['OC', 'CT'],
    },
    noteTags: ['occlusion', 'malocclusion', 'MAL', 'crossbite'],
  },

  // ── 치아 과밀 ───────────────────────────────────────────────
  crowding: {
    testID:     'crowding',
    testName:   'Crowding',
    testNameKo: '치아 과밀',
    testType:   'select',
    testInfo:   '치아 과밀은 단두종에서 흔하며 치주 질환, 음식물 잔류, 부정교합의 위험을 높입니다.',
    affectedSpecies: ['canine', 'feline'],
    options: [
      { value: 'none',     detail: 'No crowding',       label: '없음' },
      { value: 'mild',     detail: 'Mild crowding',     label: '경도' },
      { value: 'moderate', detail: 'Moderate crowding', label: '중등도' },
      { value: 'severe',   detail: 'Severe crowding',   label: '중증' },
    ],
    optComment: {
      none:     '치아 과밀 없음. 정상적인 치아 간격.',
      mild:     '경도 과밀. 일부 치아 접촉 또는 회전. 치주 위생 관리 강화 권장.',
      moderate: '중등도 과밀. 음식물 잔류 및 치주 질환 위험 증가. 발치 또는 교정 고려.',
      severe:   '중증 과밀. 심각한 치주 위험. 과밀 치아 발치 강력 권장.',
    },
    generalComment: {
      none:     '치아 배열이 정상입니다.',
      mild:     '치아가 약간 겹쳐 있습니다. 양치질을 더 꼼꼼히 해주세요.',
      moderate: '치아가 많이 겹쳐 음식물이 끼기 쉽고 잇몸 질환 위험이 높습니다. 치료를 권장합니다.',
      severe:   '치아가 심하게 겹쳐 있어 치아 발치가 필요할 수 있습니다.',
    },
    urgency: {
      none:     'none',
      mild:     'monitor',
      moderate: 'recommended',
      severe:   'recommended',
    },
    suggestedTx: {
      none:     [],
      mild:     ['PRO'],
      moderate: ['PRO', 'X', 'ODY'],
      severe:   ['PRO', 'XSS'],
    },
    noteTags: ['crowding', 'rotation', 'spacing'],
  },

  // ── 전체 치은염 ─────────────────────────────────────────────
  gingivitis_overall: {
    testID:     'gingivitis_overall',
    testName:   'Gingivitis (Overall)',
    testNameKo: '전체 치은염',
    testType:   'select',
    testInfo:   'AVDC PD1에 해당. 치은 염증만 있고 부착 소실 없는 상태. 전체 구강의 치은 상태를 대표하는 값으로 기록.',
    affectedSpecies: ['canine', 'feline'],
    options: [
      { value: 'none',     detail: 'No gingivitis',       label: '없음 (PD0)' },
      { value: 'mild',     detail: 'Mild gingivitis',     label: '경도 (PD1)' },
      { value: 'moderate', detail: 'Moderate gingivitis', label: '중등도 (PD1~2)' },
      { value: 'severe',   detail: 'Severe gingivitis',   label: '중증 (PD2 이상)' },
    ],
    optComment: {
      none:     '치은 정상. 염증 소견 없음 (PD0).',
      mild:     '경도 치은염(PD1). 치은 발적, 부종. 부착 소실 없음. 스케일링 및 가정 관리 강화.',
      moderate: '중등도 치은염(PD1~PD2). 전반적인 발적, 출혈. 치주낭 측정 및 방사선 평가 권장.',
      severe:   '중증 치은염(PD2 이상 의심). 즉각적인 전문 치료 및 개별 치아 치주 평가 필요.',
    },
    generalComment: {
      none:     '잇몸이 건강한 상태입니다.',
      mild:     '잇몸에 약간의 염증이 있습니다. 정기적인 스케일링과 양치질로 관리할 수 있습니다.',
      moderate: '잇몸 염증이 상당합니다. 스케일링 치료와 집에서의 구강 관리가 필요합니다.',
      severe:   '잇몸 염증이 심합니다. 빠른 치과 치료가 필요합니다.',
    },
    urgency: {
      none:     'none',
      mild:     'elective',
      moderate: 'recommended',
      severe:   'urgent',
    },
    suggestedTx: {
      none:     [],
      mild:     ['PRO'],
      moderate: ['PRO', 'GC'],
      severe:   ['PRO', 'GC', 'RAD'],
    },
    noteTags: ['gingivitis', 'PD1', 'gingival inflammation'],
  },

  // ── 전체 치석 ───────────────────────────────────────────────
  calculus_overall: {
    testID:     'calculus_overall',
    testName:   'Calculus (Overall)',
    testNameKo: '전체 치석',
    testType:   'select',
    testInfo:   '전체 구강의 치석(calculus) 정도를 0~3 grade로 기록. 치은연상 및 치은연하 치석 포함.',
    affectedSpecies: ['canine', 'feline'],
    options: [
      { value: 'none',     detail: 'No calculus',       label: '없음 (Grade 0)' },
      { value: 'mild',     detail: 'Mild calculus',     label: '경도 (Grade 1)' },
      { value: 'moderate', detail: 'Moderate calculus', label: '중등도 (Grade 2)' },
      { value: 'severe',   detail: 'Severe calculus',   label: '중증 (Grade 3)' },
    ],
    optComment: {
      none:     '치석 없음. 정상.',
      mild:     '경도 치석(Grade 1). 치은연상 치석이 치관 1/3 이하. 스케일링 권장.',
      moderate: '중등도 치석(Grade 2). 치관 1/3~2/3 또는 치은연하 치석 소량. 즉시 스케일링 및 치주 평가 필요.',
      severe:   '중증 치석(Grade 3). 치관 2/3 이상 또는 치은연하 치석 다량. 즉각적인 치료 필요.',
    },
    generalComment: {
      none:     '치아에 치석이 없는 깨끗한 상태입니다.',
      mild:     '치아에 약간의 치석이 있습니다. 스케일링으로 제거할 수 있습니다.',
      moderate: '치석이 상당히 쌓여 있습니다. 스케일링 치료가 필요합니다.',
      severe:   '치석이 매우 많이 쌓여 잇몸과 치아 건강에 위협이 됩니다. 즉각적인 치료가 필요합니다.',
    },
    urgency: {
      none:     'none',
      mild:     'elective',
      moderate: 'recommended',
      severe:   'urgent',
    },
    suggestedTx: {
      none:     [],
      mild:     ['PRO'],
      moderate: ['PRO'],
      severe:   ['PRO', 'GC', 'RP'],
    },
    noteTags: ['calculus', 'tartar', 'scaling'],
  },

  // ── 전체 치주 병기 ──────────────────────────────────────────
  periodontitis_stage: {
    testID:     'periodontitis_stage',
    testName:   'Periodontal Disease Stage (Overall)',
    testNameKo: '치주 질환 전체 병기',
    testType:   'select',
    testInfo:   'AVDC PD 기준 (PD0~PD4). 전체 구강을 대표하는 병기. 개별 치아의 가장 심한 병기를 기준으로 기록.',
    affectedSpecies: ['canine', 'feline'],
    options: [
      { value: 'PD0', detail: 'Clinically normal',                              label: 'PD0 — 정상' },
      { value: 'PD1', detail: 'Gingivitis only (no attachment loss)',            label: 'PD1 — 치은염 (부착 소실 없음)' },
      { value: 'PD2', detail: 'Early periodontitis (<25% attachment loss)',     label: 'PD2 — 초기 치주염 (<25%)' },
      { value: 'PD3', detail: 'Moderate periodontitis (25–50% attachment loss)', label: 'PD3 — 중등도 치주염 (25~50%)' },
      { value: 'PD4', detail: 'Advanced periodontitis (>50% attachment loss)', label: 'PD4 — 진행성 치주염 (>50%)' },
    ],
    optComment: {
      PD0: '임상적으로 정상. 정기 검진 및 가정 관리 유지.',
      PD1: '치은염 단계(PD1). 부착 소실 없음. 스케일링 및 가정 구강 관리로 가역적 회복 가능.',
      PD2: '초기 치주염(PD2). 부착 소실 25% 미만. 스케일링, 치근 활택, 재평가 필요.',
      PD3: '중등도 치주염(PD3). 부착 소실 25~50%. 치주 수술 또는 발치 고려. 방사선 평가 필수.',
      PD4: '진행성 치주염(PD4). 부착 소실 50% 초과. 대부분 발치 적응증. 전신 합병증(신장, 심장) 위험 평가.',
    },
    generalComment: {
      PD0: '잇몸과 치아 지지 구조가 건강합니다.',
      PD1: '잇몸에 염증이 있지만 아직 치아 뿌리를 감싼 뼈는 건강합니다. 치료로 완전히 회복 가능합니다.',
      PD2: '잇몸 뼈가 약간 손상되기 시작했습니다. 적극적인 치과 치료가 필요합니다.',
      PD3: '잇몸 뼈 손상이 상당합니다. 일부 치아는 발치가 필요할 수 있습니다.',
      PD4: '잇몸 뼈가 심하게 손상되어 치아를 더 이상 지지하기 어렵습니다. 발치 및 적극적인 치료가 필요합니다.',
    },
    urgency: {
      PD0: 'none',
      PD1: 'elective',
      PD2: 'recommended',
      PD3: 'urgent',
      PD4: 'urgent',
    },
    suggestedTx: {
      PD0: [],
      PD1: ['PRO'],
      PD2: ['PRO', 'GC', 'RP/C'],
      PD3: ['PRO', 'RP/O', 'GF/B', 'GTR'],
      PD4: ['PRO', 'XSS', 'ALV'],
    },
    noteTags: ['periodontitis', 'PD', 'periodontal disease', 'attachment loss'],
  },

  // ── 구강 점막 ───────────────────────────────────────────────
  oral_mucosa: {
    testID:     'oral_mucosa',
    testName:   'Oral Mucosa',
    testNameKo: '구강 점막',
    testType:   'select',
    testInfo:   '구강 점막(협점막, 구개점막, 구저점막)의 육안 소견. 색조, 궤양, 증식, 종괴 여부 평가.',
    affectedSpecies: ['canine', 'feline'],
    options: [
      { value: 'normal',      detail: 'Normal oral mucosa',          label: '정상' },
      { value: 'hyperemic',   detail: 'Hyperemic mucosa',            label: '충혈' },
      { value: 'ulceration',  detail: 'Ulcerative mucositis (CU)',   label: '궤양 (CU)' },
      { value: 'mass',        detail: 'Oral mass (OM)',              label: '종괴 (OM)' },
      { value: 'stomatitis',  detail: 'Stomatitis (ST)',             label: '구내염 (ST)' },
      { value: 'caudal_stomatitis', detail: 'Caudal stomatitis (ST/CS)', label: '미부 구내염 — 고양이 (ST/CS)' },
    ],
    optComment: {
      normal:          '구강 점막 정상. 이상 소견 없음.',
      hyperemic:       '점막 충혈. 염증 또는 자극 시사. 원인 평가 필요.',
      ulceration:      '궤양성 구내염(CU). 접촉 궤양 또는 자가면역 가능성. 생검 고려.',
      mass:            '구강 내 종괴(OM). 양성/악성 감별 위해 세침흡인(FNA) 또는 생검 필수.',
      stomatitis:      '전반적 구내염(ST). 원인(면역매개, 감염, 대사성) 파악 필요.',
      caudal_stomatitis: '고양이 미부 구내염(ST/CS). 구치후 점막의 심한 염증. 전악 발치 효과적.',
    },
    generalComment: {
      normal:          '입안 점막이 건강합니다.',
      hyperemic:       '입안 점막이 붉게 충혈되어 있습니다. 염증이 있을 수 있습니다.',
      ulceration:      '입안에 궤양(상처)이 있습니다. 통증을 유발할 수 있으며 원인 파악이 필요합니다.',
      mass:            '입안에 덩어리가 발견되었습니다. 조직 검사가 필요합니다.',
      stomatitis:      '입안 전체에 염증이 있습니다. 식욕 저하와 통증이 있을 수 있습니다.',
      caudal_stomatitis: '고양이에서 흔한 심한 구내염입니다. 치료를 위해 발치가 필요할 수 있습니다.',
    },
    urgency: {
      normal:          'none',
      hyperemic:       'monitor',
      ulceration:      'recommended',
      mass:            'urgent',
      stomatitis:      'recommended',
      caudal_stomatitis: 'urgent',
    },
    suggestedTx: {
      normal:          [],
      hyperemic:       [],
      ulceration:      ['B/I', 'CS'],
      mass:            ['B/E', 'B/I', 'B/NA'],
      stomatitis:      ['PRO', 'CS', 'B/I'],
      caudal_stomatitis: ['XSS', 'PRO'],
    },
    noteTags: ['mucosa', 'stomatitis', 'ulceration', 'oral mass', 'caudal stomatitis'],
  },

  // ── 방사선 촬영 ─────────────────────────────────────────────
  xray_taken: {
    testID:     'xray_taken',
    testName:   'Dental Radiograph',
    testNameKo: '치과 방사선',
    testType:   'select',
    testInfo:   '치과 방사선 촬영 여부 및 소견. 골 소실, 치근 흡수, periapical pathology, 미맹출치 등 평가.',
    affectedSpecies: ['canine', 'feline'],
    options: [
      { value: 'not_taken',  detail: 'Radiograph not taken', label: '미촬영' },
      { value: 'normal',     detail: 'Radiograph taken — normal findings', label: '촬영 — 정상' },
      { value: 'abnormal',   detail: 'Radiograph taken — abnormal findings', label: '촬영 — 이상 소견' },
    ],
    optComment: {
      not_taken: '방사선 미촬영. 임상 소견만으로 평가.',
      normal:    '방사선 정상. 치근, 치조골, 치주인대공간 정상 범위.',
      abnormal:  '방사선 이상 소견. 치아별 소견 기록 필요 (periapical pathology, 골 소실, 치근 흡수 등).',
    },
    generalComment: {
      not_taken: '이번에는 치과 X-ray를 촬영하지 않았습니다.',
      normal:    '치과 X-ray에서 이상 소견이 없습니다.',
      abnormal:  '치과 X-ray에서 이상 소견이 발견되었습니다. 상세 내용은 치아별 기록을 확인하세요.',
    },
    urgency: {
      not_taken: 'none',
      normal:    'none',
      abnormal:  'recommended',
    },
    suggestedTx: {
      not_taken: [],
      normal:    [],
      abnormal:  ['RAD'],
    },
    noteTags: ['radiograph', 'xray', 'dental radiology'],
  },

  // ── 가정 구강 관리 ──────────────────────────────────────────
  homecare: {
    testID:     'homecare',
    testName:   'Home Oral Care',
    testNameKo: '가정 구강 관리',
    testType:   'select',
    testInfo:   '보호자의 현재 구강 위생 관리 수준. 양치질 빈도 및 방법 평가.',
    affectedSpecies: ['canine', 'feline'],
    options: [
      { value: 'daily_brush',   detail: 'Daily toothbrushing',         label: '매일 양치질' },
      { value: 'occasional',    detail: 'Occasional brushing (< daily)', label: '가끔 양치질' },
      { value: 'dental_treat',  detail: 'Dental treats/chews only',    label: '덴탈 껌/간식만' },
      { value: 'none',          detail: 'No home care',                label: '관리 없음' },
    ],
    optComment: {
      daily_brush:  '매일 양치질 시행. 이상적인 구강 관리. 유지 권장.',
      occasional:   '불규칙 양치. 매일 양치 교육 및 동기 부여 필요.',
      dental_treat: '덴탈 껌/간식만 사용. 양치질 병행 교육 필요. 덴탈 껌은 보조제로 단독 사용은 부족.',
      none:         '가정 관리 없음. 구강 위생 교육 필수. 치주 질환 진행 위험 높음.',
    },
    generalComment: {
      daily_brush:  '매일 이를 닦아주고 계십니다. 훌륭합니다! 계속 유지해 주세요.',
      occasional:   '가끔 이를 닦아주고 계십니다. 가능하면 매일 닦아주시면 더 좋습니다.',
      dental_treat: '덴탈 간식을 주고 계십니다. 양치질도 함께 해주시면 훨씬 효과적입니다.',
      none:         '현재 가정에서 구강 관리를 하지 않고 계십니다. 양치질 방법을 알려드리겠습니다.',
    },
    urgency: {
      daily_brush:  'none',
      occasional:   'monitor',
      dental_treat: 'monitor',
      none:         'recommended',
    },
    suggestedTx: {
      daily_brush:  [],
      occasional:   [],
      dental_treat: [],
      none:         [],
    },
    noteTags: ['homecare', 'toothbrushing', 'oral hygiene', 'dental care'],
  },
};
