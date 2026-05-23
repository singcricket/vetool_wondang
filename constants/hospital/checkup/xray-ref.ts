// ============================================================
// xray-ref.ts — 방사선 검사 소견 Reference
// 건강검진 수준의 체크박스 소견 항목 + 보호자 메시지
// ============================================================

export type XrayFinding = {
  id: string
  label: string         // 수의사용 소견 라벨
  ownerMessage: string  // 보호자에게 전달될 메시지
  severity: 'mild' | 'moderate' | 'severe'
}

export type XrayCategory = {
  id: XrayCategoryId
  label: string
  findings: XrayFinding[]
}

export type XrayCategoryId =
  | 'thorax'
  | 'abdomen'
  | 'extremity'
  | 'skull'
  | 'spine'

// ────────────────────────────────────────────────────────────
// 흉부 방사선
// ────────────────────────────────────────────────────────────
const thoraxFindings: XrayFinding[] = [
  {
    id: 'bronchial_pattern',
    label: '기관지 패턴 증가',
    ownerMessage:
      '흉부 방사선에서 기관지 벽이 두꺼워진 소견이 관찰됩니다. 기관지염이나 기도 자극에 의한 변화일 수 있으며, 주의 깊은 관찰이 필요합니다.',
    severity: 'mild',
  },
  {
    id: 'interstitial_pattern',
    label: '간질성 패턴',
    ownerMessage:
      '폐 간질(폐 조직 사이 공간)에 음영이 증가한 소견입니다. 초기 폐렴, 폐부종, 또는 폐 섬유화의 가능성이 있어 추가적인 평가가 필요합니다.',
    severity: 'moderate',
  },
  {
    id: 'alveolar_pattern',
    label: '폐포 패턴',
    ownerMessage:
      '폐포에 액체나 삼출물이 차 있는 소견입니다. 폐렴, 폐부종 등의 원인을 감별하기 위해 추가 검사가 필요합니다.',
    severity: 'severe',
  },
  {
    id: 'left_heart_enlargement',
    label: '좌심 비대 의심',
    ownerMessage:
      '심장의 좌측이 정상보다 커 보입니다. 심장병(승모판 폐쇄 부전 등)의 초기 변화일 수 있으며, 심장 초음파 검사를 통한 정밀 평가를 권장합니다.',
    severity: 'moderate',
  },
  {
    id: 'right_heart_enlargement',
    label: '우심 비대 의심',
    ownerMessage:
      '심장의 우측이 정상보다 커 보입니다. 폐동맥 고혈압이나 우심부전의 가능성이 있어 심장 초음파 검사를 권장합니다.',
    severity: 'moderate',
  },
  {
    id: 'generalized_cardiomegaly',
    label: '전심 비대 의심',
    ownerMessage:
      '심장 전체가 정상 범위보다 크게 관찰됩니다. 심근병증 등 심장 질환의 가능성이 있어 심장 초음파 검사를 포함한 정밀 평가가 필요합니다.',
    severity: 'moderate',
  },
  {
    id: 'tracheal_elevation',
    label: '기관 거상',
    ownerMessage:
      '기관이 정상 위치보다 위로 밀려 있는 소견입니다. 심장 비대나 주변 구조물에 의한 압박이 원인일 수 있습니다.',
    severity: 'mild',
  },
  {
    id: 'tracheal_narrowing',
    label: '기관 협착 의심',
    ownerMessage:
      '기관(숨길)이 일부 좁아진 소견이 관찰됩니다. 호흡 곤란의 원인이 될 수 있으며 추가 평가가 필요합니다.',
    severity: 'moderate',
  },
  {
    id: 'pleural_effusion',
    label: '흉수 의심',
    ownerMessage:
      '흉강(폐를 감싸는 공간)에 액체가 고여 있는 소견입니다. 원인 파악을 위한 추가 검사와 치료가 필요합니다.',
    severity: 'severe',
  },
  {
    id: 'pneumothorax',
    label: '기흉 의심',
    ownerMessage:
      '흉강 내에 공기가 차 있는 소견으로, 폐가 정상적으로 팽창하지 못할 수 있습니다. 즉각적인 처치가 필요할 수 있습니다.',
    severity: 'severe',
  },
  {
    id: 'pulmonary_nodule',
    label: '폐 결절/종괴 의심',
    ownerMessage:
      '폐에 비정상적인 음영(결절 또는 종괴)이 관찰됩니다. 원인 감별을 위해 추가 영상 검사(CT 등)가 권장됩니다.',
    severity: 'severe',
  },
  {
    id: 'pulmonary_calcification',
    label: '폐 석회화',
    ownerMessage:
      '폐 조직 내에 석회화 음영이 관찰됩니다. 대부분 과거 염증의 흔적이지만, 정기적인 모니터링이 권장됩니다.',
    severity: 'mild',
  },
  {
    id: 'diaphragm_abnormality',
    label: '횡격막 이상',
    ownerMessage:
      '횡격막(가슴과 배를 나누는 근육)에 이상 소견이 관찰됩니다. 추가적인 평가가 필요합니다.',
    severity: 'moderate',
  },
  {
    id: 'mediastinal_abnormality',
    label: '종격동 이상',
    ownerMessage:
      '폐와 폐 사이 공간(종격동)에 비정상적인 소견이 관찰됩니다. 림프절 비대나 종괴의 가능성이 있어 추가 검사가 필요합니다.',
    severity: 'moderate',
  },
]

// ────────────────────────────────────────────────────────────
// 복부 방사선
// ────────────────────────────────────────────────────────────
const abdomenFindings: XrayFinding[] = [
  {
    id: 'hepatomegaly',
    label: '간 비대 의심',
    ownerMessage:
      '복부 방사선에서 간이 정상보다 커 보입니다. 간 질환이나 다른 전신 질환의 가능성이 있어 혈액 검사 및 초음파 검사를 권장합니다.',
    severity: 'moderate',
  },
  {
    id: 'microhepatica',
    label: '간 위축 의심',
    ownerMessage:
      '간이 정상보다 작게 관찰됩니다. 만성 간 질환의 가능성이 있어 추가 검사가 필요합니다.',
    severity: 'moderate',
  },
  {
    id: 'splenomegaly',
    label: '비장 비대 의심',
    ownerMessage:
      '비장이 정상보다 크게 관찰됩니다. 다양한 원인(면역 반응, 종양 등)이 있을 수 있어 초음파 검사로 정밀 평가가 필요합니다.',
    severity: 'moderate',
  },
  {
    id: 'renomegaly',
    label: '신장 비대 의심',
    ownerMessage:
      '신장이 정상보다 크게 관찰됩니다. 신장 질환이나 종양의 가능성이 있어 초음파 검사가 권장됩니다.',
    severity: 'moderate',
  },
  {
    id: 'small_kidney',
    label: '신장 위축 의심',
    ownerMessage:
      '신장이 정상보다 작게 관찰됩니다. 만성 신장 질환의 가능성이 있으며, 혈액/소변 검사 및 초음파 검사가 권장됩니다.',
    severity: 'moderate',
  },
  {
    id: 'abdominal_mass',
    label: '복강 내 종괴 의심',
    ownerMessage:
      '복강 내에 비정상적인 종괴 음영이 관찰됩니다. 원인 파악을 위해 초음파 검사 및 추가 정밀 검사가 필요합니다.',
    severity: 'severe',
  },
  {
    id: 'ascites',
    label: '복수 의심',
    ownerMessage:
      '복강 내에 액체가 고여 있는 소견입니다. 간 질환, 심장 질환, 종양 등 다양한 원인이 있을 수 있어 추가 검사가 필요합니다.',
    severity: 'severe',
  },
  {
    id: 'vesical_calculi',
    label: '방광 결석 의심',
    ownerMessage:
      '방광 내에 결석으로 보이는 음영이 관찰됩니다. 결석은 혈뇨, 배뇨 곤란 등을 유발할 수 있어 초음파 검사 및 소변 검사가 권장됩니다.',
    severity: 'moderate',
  },
  {
    id: 'nephrolithiasis',
    label: '신장 결석 의심',
    ownerMessage:
      '신장 내에 결석으로 보이는 석회화 음영이 관찰됩니다. 추가적인 검사와 모니터링이 필요합니다.',
    severity: 'moderate',
  },
  {
    id: 'foreign_body',
    label: '이물 의심',
    ownerMessage:
      '위장관 내에 이물질로 의심되는 음영이 관찰됩니다. 장폐색 등의 위험이 있을 수 있어 즉각적인 평가가 필요합니다.',
    severity: 'severe',
  },
  {
    id: 'ileus',
    label: '장폐색 패턴 의심',
    ownerMessage:
      '장이 정상보다 확장되어 있는 소견이 관찰됩니다. 장폐색이나 장 운동 저하의 가능성이 있어 추가 평가가 필요합니다.',
    severity: 'severe',
  },
  {
    id: 'abdominal_calcification',
    label: '복강 내 석회화',
    ownerMessage:
      '복강 내에 석회화 음영이 관찰됩니다. 위치와 특성에 따라 추가 평가가 필요할 수 있습니다.',
    severity: 'mild',
  },
  {
    id: 'prostatomegaly',
    label: '전립선 비대 의심',
    ownerMessage:
      '전립선이 정상보다 크게 관찰됩니다. 전립선 비대증, 낭종, 종양 등의 원인이 있을 수 있어 초음파 검사가 권장됩니다.',
    severity: 'moderate',
  },
]

// ────────────────────────────────────────────────────────────
// 사지
// ────────────────────────────────────────────────────────────
const extremityFindings: XrayFinding[] = [
  {
    id: 'degenerative_joint',
    label: '퇴행성 관절 변화',
    ownerMessage:
      '관절에 퇴행성 변화(골증식, 관절 간격 감소 등)가 관찰됩니다. 관절염의 일종으로, 통증 관리와 체중 조절이 중요합니다.',
    severity: 'mild',
  },
  {
    id: 'osteoproliferation',
    label: '골증식 소견',
    ownerMessage:
      '뼈에 비정상적인 증식 소견이 관찰됩니다. 염증이나 퇴행성 변화에 의한 경우가 많으며, 추가 평가가 권장됩니다.',
    severity: 'mild',
  },
  {
    id: 'osteolysis',
    label: '골용해 의심',
    ownerMessage:
      '뼈 조직이 파괴되는 소견이 관찰됩니다. 종양이나 감염 등의 원인이 있을 수 있어 정밀 검사가 필요합니다.',
    severity: 'severe',
  },
  {
    id: 'fracture',
    label: '골절 의심',
    ownerMessage:
      '뼈에 골절이 의심되는 소견이 관찰됩니다. 추가적인 영상 평가와 적절한 처치가 필요합니다.',
    severity: 'severe',
  },
  {
    id: 'luxation',
    label: '탈구 의심',
    ownerMessage:
      '관절이 정상 위치에서 벗어난 소견이 관찰됩니다. 적절한 처치가 필요합니다.',
    severity: 'severe',
  },
  {
    id: 'soft_tissue_swelling',
    label: '연부조직 종창',
    ownerMessage:
      '뼈 주변 연부조직(근육, 피하지방 등)이 부어 있는 소견입니다. 염증, 외상, 종양 등의 원인이 있을 수 있습니다.',
    severity: 'mild',
  },
  {
    id: 'bone_density_decreased',
    label: '골밀도 감소 의심',
    ownerMessage:
      '뼈의 밀도가 정상보다 낮아 보입니다. 영양 불균형이나 대사 질환의 가능성이 있어 추가 평가가 필요합니다.',
    severity: 'moderate',
  },
]

// ────────────────────────────────────────────────────────────
// 두개골
// ────────────────────────────────────────────────────────────
const skullFindings: XrayFinding[] = [
  {
    id: 'nasal_opacity',
    label: '비강 불투명도 증가',
    ownerMessage:
      '비강(콧속 공간)에 비정상적인 음영이 관찰됩니다. 비염, 종양, 이물 등의 원인이 있을 수 있어 추가 평가가 필요합니다.',
    severity: 'moderate',
  },
  {
    id: 'skull_lesion',
    label: '두개골 병변 의심',
    ownerMessage:
      '두개골에 비정상적인 소견이 관찰됩니다. 원인 파악을 위한 추가 영상 검사가 필요합니다.',
    severity: 'moderate',
  },
  {
    id: 'dental_lesion',
    label: '치아 주변 병변',
    ownerMessage:
      '치아 주변 뼈에 비정상적인 소견이 관찰됩니다. 치주 질환이나 치아 흡수의 가능성이 있어 치과적 평가가 권장됩니다.',
    severity: 'moderate',
  },
  {
    id: 'tympanic_bulla_opacity',
    label: '고실포 음영 증가',
    ownerMessage:
      '귀 내부 공간(고실포)에 액체나 삼출물이 차 있는 소견입니다. 중이염의 가능성이 있어 추가 평가가 필요합니다.',
    severity: 'moderate',
  },
]

// ────────────────────────────────────────────────────────────
// 척추
// ────────────────────────────────────────────────────────────
const spineFindings: XrayFinding[] = [
  {
    id: 'ivdd_calcification',
    label: '추간판 석회화',
    ownerMessage:
      '척추 뼈와 뼈 사이의 추간판(디스크)에 석회가 침착된 소견입니다. 디스크 탈출의 위험 인자가 될 수 있어 주의 깊은 관찰이 필요합니다.',
    severity: 'mild',
  },
  {
    id: 'spondylosis',
    label: '척추 골증식증 (Spondylosis)',
    ownerMessage:
      '척추 뼈 가장자리에 골극(뼈 돌기)이 형성된 소견입니다. 노화와 관련된 퇴행성 변화로, 심한 경우 통증이나 신경 증상을 유발할 수 있습니다.',
    severity: 'mild',
  },
  {
    id: 'disc_space_narrowing',
    label: '추간판 간격 감소',
    ownerMessage:
      '척추 뼈 사이 공간이 좁아진 소견으로, 디스크 손상이나 퇴행성 변화를 시사합니다. 추가적인 평가가 권장됩니다.',
    severity: 'moderate',
  },
  {
    id: 'vertebral_body_change',
    label: '척추체 변화',
    ownerMessage:
      '척추 뼈에 비정상적인 변화(골용해, 골증식 등)가 관찰됩니다. 원인 파악을 위한 추가 검사가 필요합니다.',
    severity: 'moderate',
  },
  {
    id: 'vertebral_fracture',
    label: '척추 골절/탈구 의심',
    ownerMessage:
      '척추에 골절이나 탈구가 의심되는 소견입니다. 신경 손상의 위험이 있어 즉각적인 평가와 처치가 필요합니다.',
    severity: 'severe',
  },
  {
    id: 'spinal_canal_narrowing',
    label: '척추관 협착 의심',
    ownerMessage:
      '척추 신경이 지나는 공간이 좁아진 소견입니다. 통증이나 신경 증상의 원인이 될 수 있어 추가 평가가 권장됩니다.',
    severity: 'moderate',
  },
  {
    id: 'transitional_vertebra',
    label: '이행 척추',
    ownerMessage:
      '척추의 일부 뼈가 인접 부위의 형태적 특성을 함께 가지고 있는 해부학적 변이입니다. 대부분 임상적 의미가 없으나 기록해 둡니다.',
    severity: 'mild',
  },
]

// ────────────────────────────────────────────────────────────
// 전체 카테고리 Export
// ────────────────────────────────────────────────────────────
export const xrayCategories: XrayCategory[] = [
  { id: 'thorax',    label: '흉부 방사선',   findings: thoraxFindings },
  { id: 'abdomen',   label: '복부 방사선',   findings: abdomenFindings },
  { id: 'extremity', label: '사지',          findings: extremityFindings },
  { id: 'skull',     label: '두개골',        findings: skullFindings },
  { id: 'spine',     label: '척추',          findings: spineFindings },
]

export const xrayFindingMap: Record<string, XrayFinding> = Object.fromEntries(
  xrayCategories.flatMap((c) => c.findings.map((f) => [f.id, f])),
)

// ============================================================
// 방사선 계측 항목 (VHS, VLAS)
// lab-ref-chemistry 와 동일 패턴
// ============================================================

export type XrayMeasurementRange = {
  min: number | null
  max: number | null
  resultText: string
  resultTextKo: string
  isAbnormal: boolean
  severity?: 'mild' | 'moderate' | 'severe'
}

export type XrayMeasurement = {
  id: string
  nameKo: string
  nameEn: string
  unit: string
  defaultRefRange: { dog: string; cat: string }
  ranges: {
    dog: XrayMeasurementRange[]
    cat: XrayMeasurementRange[]
  }
  comment: {
    increase: string
    decrease?: string
    normal?: string
  }
  ownerMessage: {
    increase: string
    decrease: string
    normal: string
  }
  categoryId: XrayCategoryId   // 어느 방사선 카테고리에 속하는지
}

// ── VHS (Vertebral Heart Score) ───────────────────────────────
const vhsRef: XrayMeasurement = {
  id: 'vhs',
  nameKo: '척추심장지수',
  nameEn: 'VHS',
  unit: 'v',
  categoryId: 'thorax',
  defaultRefRange: { dog: '8.5–10.5', cat: '7.5–9.0' },
  ranges: {
    dog: [
      { min: null,  max: 8.5,  resultText: 'Microcardia',               resultTextKo: '심장 위축 의심',       isAbnormal: true,  severity: 'mild'     },
      { min: 8.5,   max: 10.5, resultText: 'Normal',                    resultTextKo: '정상',                  isAbnormal: false                        },
      { min: 10.5,  max: 11.5, resultText: 'Borderline cardiomegaly',   resultTextKo: '경계성 심장비대',       isAbnormal: true,  severity: 'mild'     },
      { min: 11.5,  max: 12.5, resultText: 'Mild cardiomegaly',         resultTextKo: '경도 심장비대',         isAbnormal: true,  severity: 'mild'     },
      { min: 12.5,  max: null, resultText: 'Moderate–severe cardiomegaly', resultTextKo: '중등-심한 심장비대', isAbnormal: true,  severity: 'severe'   },
    ],
    cat: [
      { min: null,  max: 7.5,  resultText: 'Microcardia',               resultTextKo: '심장 위축 의심',       isAbnormal: true,  severity: 'mild'     },
      { min: 7.5,   max: 9.0,  resultText: 'Normal',                    resultTextKo: '정상',                  isAbnormal: false                        },
      { min: 9.0,   max: 10.0, resultText: 'Borderline cardiomegaly',   resultTextKo: '경계성 심장비대',       isAbnormal: true,  severity: 'mild'     },
      { min: 10.0,  max: null, resultText: 'Cardiomegaly',              resultTextKo: '심장비대',              isAbnormal: true,  severity: 'moderate' },
    ],
  },
  comment: {
    increase: '심장비대(심근병증, 판막질환, 심낭삼출 등) 가능성. 심장 초음파 검사를 통한 정밀 평가 권장',
    decrease: '심낭 허탈, 탈수, 쇼크, 부신기능저하증(개) 등에서 나타날 수 있음',
    normal: '방사선상 심장 크기 정상. 단, VHS만으로 심장 기능 이상을 배제할 수 없음',
  },
  ownerMessage: {
    increase: '방사선 사진에서 심장이 정상보다 크게 측정되었습니다. 심장 질환의 가능성이 있어 심장 초음파 검사를 통한 정밀 평가를 권장드립니다.',
    decrease: '방사선 사진에서 심장이 다소 작게 측정되었습니다. 탈수나 순환 이상의 가능성이 있어 추가 평가가 필요할 수 있습니다.',
    normal: '방사선 사진상 심장 크기는 정상 범위입니다.',
  },
}

// ── VLAS (Vertebral Left Atrial Size) ────────────────────────
const vlasRef: XrayMeasurement = {
  id: 'vlas',
  nameKo: '척추좌심방지수',
  nameEn: 'VLAS',
  unit: 'v',
  categoryId: 'thorax',
  defaultRefRange: { dog: '< 2.3', cat: '< 2.0' },
  ranges: {
    dog: [
      { min: null, max: 2.3,  resultText: 'Normal',                         resultTextKo: '정상',                  isAbnormal: false                        },
      { min: 2.3,  max: 2.5,  resultText: 'Borderline LA enlargement',      resultTextKo: '경계성 좌심방 비대',    isAbnormal: true,  severity: 'mild'     },
      { min: 2.5,  max: 3.0,  resultText: 'Mild LA enlargement',            resultTextKo: '경도 좌심방 비대',      isAbnormal: true,  severity: 'mild'     },
      { min: 3.0,  max: null, resultText: 'Moderate–severe LA enlargement', resultTextKo: '중등-심한 좌심방 비대', isAbnormal: true,  severity: 'severe'   },
    ],
    cat: [
      { min: null, max: 2.0,  resultText: 'Normal',                         resultTextKo: '정상',                  isAbnormal: false                        },
      { min: 2.0,  max: 2.3,  resultText: 'Borderline LA enlargement',      resultTextKo: '경계성 좌심방 비대',    isAbnormal: true,  severity: 'mild'     },
      { min: 2.3,  max: null, resultText: 'LA enlargement',                 resultTextKo: '좌심방 비대',           isAbnormal: true,  severity: 'moderate' },
    ],
  },
  comment: {
    increase: '좌심방 비대 — 좌심부전, 승모판 폐쇄 부전, 비대성 심근병증(고양이) 등. 폐부종 위험 평가에 필수. VHS와 함께 판단',
    normal: '방사선상 좌심방 크기 정상. MMVD 스테이징(개)에 중요한 기준 항목',
  },
  ownerMessage: {
    increase: '방사선 사진에서 좌심방(심장 내 공간)이 정상보다 크게 측정되었습니다. 승모판 질환이나 심근병증과 관련될 수 있어 심장 초음파 검사를 권장드립니다.',
    decrease: '좌심방이 작게 측정된 경우 임상적으로 큰 의미가 없습니다.',
    normal: '방사선 사진상 좌심방 크기는 정상 범위입니다.',
  },
}

/** 흉부 방사선 계측 항목 목록 */
export const thoraxMeasurements: XrayMeasurement[] = [vhsRef, vlasRef]

/** 계측 항목 ID → 객체 맵 */
export const xrayMeasurementMap: Record<string, XrayMeasurement> = {
  vhs: vhsRef,
  vlas: vlasRef,
}

/** 수치 입력 시 해당 range entry 반환 */
export function interpretXrayMeasurement(
  measurement: XrayMeasurement,
  value: number,
  species: 'dog' | 'cat',
): XrayMeasurementRange | null {
  const ranges = measurement.ranges[species] ?? []
  return (
    ranges.find(
      (r) =>
        (r.min === null || value >= r.min) &&
        (r.max === null || value < r.max),
    ) ?? null
  )
}
