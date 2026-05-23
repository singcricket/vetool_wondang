// ============================================================
// echo-ref.ts — 건강검진용 심장초음파 소견 Reference
// xray-ref.ts 와 동일한 패턴 (소견 체크박스 + 계측 수치)
// ============================================================

import type { XrayMeasurementRange } from './xray-ref'

// ── 타입 ──────────────────────────────────────────────────────

export type EchoCategoryId =
  | 'lv_systolic'
  | 'lv_size'
  | 'mitral_valve'
  | 'left_atrium'
  | 'aortic_valve'
  | 'right_heart'
  | 'pulmonary_ht'
  | 'pericardium'
  | 'overall'

export type EchoFinding = {
  id: string
  label: string
  ownerMessage: string
  severity: 'mild' | 'moderate' | 'severe'
}

export type EchoCategory = {
  id: EchoCategoryId
  label: string
  findings: EchoFinding[]
}

export type EchoMeasurement = {
  id: string
  nameKo: string
  nameEn: string
  unit: string
  categoryId: EchoCategoryId
  speciesNote?: string              // 종별 적용 안내
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
}

// ── 소견 정의 ─────────────────────────────────────────────────

// 1. 좌심실 수축 기능
const lvSystolicFindings: EchoFinding[] = [
  {
    id: 'fs_mild_decrease',
    label: 'FS 경미한 감소',
    severity: 'mild',
    ownerMessage: '심장의 수축 능력이 정상보다 약간 낮게 측정되었습니다. 아직 임상 증상이 없더라도 정기적인 추적 검사를 권장드립니다.',
  },
  {
    id: 'fs_moderate_decrease',
    label: 'FS 중등도 감소',
    severity: 'moderate',
    ownerMessage: '심장이 혈액을 충분히 박출하는 능력이 저하되어 있습니다. 심부전으로 진행될 수 있어 심장 전문의 상담과 약물 치료 여부 검토가 필요합니다.',
  },
  {
    id: 'fs_severe_decrease',
    label: 'FS 심한 감소',
    severity: 'severe',
    ownerMessage: '심장 수축 기능이 심하게 저하되어 있습니다. 확장성 심근병증(DCM)과 같은 심각한 심장 질환의 가능성이 높으므로 즉각적인 심장 전문 치료가 필요합니다.',
  },
  {
    id: 'lv_hypokinesis',
    label: '좌심실 벽운동 감소',
    severity: 'moderate',
    ownerMessage: '심장 근육의 움직임이 감소해 있습니다. 심근 기능 이상을 의미하며 추가적인 정밀 검사가 필요합니다.',
  },
]

// 2. 좌심실 크기/형태
const lvSizeFindings: EchoFinding[] = [
  {
    id: 'lv_mild_dilation',
    label: '좌심실 경도 확장',
    severity: 'mild',
    ownerMessage: '심장 좌심실 내부 공간이 정상보다 약간 넓어져 있습니다. 원인 파악을 위해 정기적인 추적 검사를 권장드립니다.',
  },
  {
    id: 'lv_moderate_dilation',
    label: '좌심실 중등도 확장',
    severity: 'moderate',
    ownerMessage: '좌심실이 뚜렷하게 확장되어 있습니다. 심부전의 전조 상태일 수 있어 전문적인 심장 평가와 치료 계획이 필요합니다.',
  },
  {
    id: 'lv_severe_dilation',
    label: '좌심실 심한 확장',
    severity: 'severe',
    ownerMessage: '좌심실이 심하게 확장되어 있습니다. 확장성 심근병증 혹은 심각한 판막 질환과 연관될 수 있으며, 즉각적인 치료가 필요할 수 있습니다.',
  },
  {
    id: 'lv_concentric_hypertrophy',
    label: '좌심실 동심성 비후',
    severity: 'moderate',
    ownerMessage: '심장 근육 벽이 두꺼워져 있습니다. 고양이에서는 비대성 심근병증(HCM), 개에서는 고혈압·대동맥 협착 등이 원인일 수 있습니다.',
  },
]

// 3. 이첨판 (승모판)
const mitralValveFindings: EchoFinding[] = [
  {
    id: 'mv_thickening',
    label: '이첨판 비후 / 증식',
    severity: 'mild',
    ownerMessage: '심장 좌측 판막(이첨판/승모판)에 두꺼워지거나 변형된 소견이 관찰됩니다. 판막 질환의 초기 변화로, 정기적인 모니터링이 필요합니다.',
  },
  {
    id: 'mv_prolapse',
    label: '이첨판 탈출 (Prolapse)',
    severity: 'mild',
    ownerMessage: '이첨판이 닫힐 때 좌심방 쪽으로 약간 밀려 들어가는 소견이 관찰됩니다. 판막 기능 악화로 진행될 수 있어 추적 관찰이 필요합니다.',
  },
  {
    id: 'mv_mild_regurg',
    label: '이첨판 경도 역류 (MR mild)',
    severity: 'mild',
    ownerMessage: '심장 좌측 판막(이첨판)에서 소량의 혈액 역류가 관찰됩니다. 현재는 경미한 수준이나 시간이 지남에 따라 진행될 수 있어 정기 검사가 중요합니다.',
  },
  {
    id: 'mv_moderate_regurg',
    label: '이첨판 중등도 역류 (MR moderate)',
    severity: 'moderate',
    ownerMessage: '이첨판에서 중등도의 역류가 관찰됩니다. 심장에 부담을 주는 상태로, 약물 치료 시작 여부에 대한 전문의 판단이 필요합니다.',
  },
  {
    id: 'mv_severe_regurg',
    label: '이첨판 심한 역류 (MR severe)',
    severity: 'severe',
    ownerMessage: '이첨판에서 심한 역류가 관찰됩니다. 심장이 혈액을 효율적으로 전달하지 못하고 있는 상태로, 즉각적인 치료와 관리가 필요합니다.',
  },
]

// 4. 좌심방
const leftAtriumFindings: EchoFinding[] = [
  {
    id: 'la_mild_enlarge',
    label: '좌심방 경도 확장 (LA/Ao 1.6–1.8)',
    severity: 'mild',
    ownerMessage: '심장 좌심방이 약간 확장되어 있습니다. 판막 질환이나 심장 부담 증가의 초기 징후일 수 있어 주의 깊은 추적 관찰이 필요합니다.',
  },
  {
    id: 'la_moderate_enlarge',
    label: '좌심방 중등도 확장 (LA/Ao 1.8–2.0)',
    severity: 'moderate',
    ownerMessage: '좌심방이 뚜렷하게 확장되어 있습니다. 폐부종(폐에 물이 차는 상태)이 발생할 위험이 높아지는 단계로, 전문의와 치료 계획을 논의해야 합니다.',
  },
  {
    id: 'la_severe_enlarge',
    label: '좌심방 심한 확장 (LA/Ao > 2.0)',
    severity: 'severe',
    ownerMessage: '좌심방이 심하게 확장되어 있으며 울혈성 심부전의 위험이 높습니다. 즉각적인 치료가 필요하며, 기침·호흡 곤란 등의 증상 시 응급 내원이 필요합니다.',
  },
  {
    id: 'la_thrombus',
    label: '좌심방 내 혈전 의심',
    severity: 'severe',
    ownerMessage: '좌심방 내에 혈전(혈액 응고물)으로 의심되는 구조물이 관찰됩니다. 특히 고양이에서 대동맥 혈전 색전증의 위험이 있어 즉각적인 처치가 필요합니다.',
  },
]

// 5. 대동맥판
const aorticValveFindings: EchoFinding[] = [
  {
    id: 'av_thickening',
    label: '대동맥판 비후',
    severity: 'mild',
    ownerMessage: '심장에서 몸 전체로 혈액을 내보내는 대동맥판이 두꺼워진 소견입니다. 판막 기능에 영향을 줄 수 있어 추적 관찰이 필요합니다.',
  },
  {
    id: 'av_mild_stenosis',
    label: '대동맥 경도 협착',
    severity: 'mild',
    ownerMessage: '대동맥판이 약간 좁아진 소견이 관찰됩니다. 심장이 혈액을 내보내는 데 약간 더 힘이 필요한 상태로, 정기적인 추적 검사가 권장됩니다.',
  },
  {
    id: 'av_moderate_severe_stenosis',
    label: '대동맥 중등-심한 협착',
    severity: 'severe',
    ownerMessage: '대동맥판이 심하게 좁아져 있어 심장에 큰 부담을 주고 있습니다. 운동 제한과 전문적인 치료가 필요합니다.',
  },
  {
    id: 'av_regurg',
    label: '대동맥판 역류',
    severity: 'moderate',
    ownerMessage: '대동맥판에서 혈액이 역류하는 소견이 관찰됩니다. 원인 파악과 진행 정도 평가를 위한 추가 검사가 필요합니다.',
  },
  {
    id: 'sas_suspected',
    label: '대동맥 하부 협착 의심 (SAS)',
    severity: 'moderate',
    ownerMessage: '대동맥 바로 아래 부위에 혈류를 방해하는 구조물이 의심됩니다. 선천성 심장 질환으로, 정밀 심장 초음파 검사가 권장됩니다.',
  },
]

// 6. 우심 / 삼첨판
const rightHeartFindings: EchoFinding[] = [
  {
    id: 'rv_mild_dilation',
    label: '우심실 경도 확장',
    severity: 'mild',
    ownerMessage: '심장 우측 펌프(우심실)가 약간 확장되어 있습니다. 폐고혈압이나 삼첨판 질환과 연관될 수 있어 원인 평가가 필요합니다.',
  },
  {
    id: 'rv_moderate_severe_dilation',
    label: '우심실 중등-심한 확장',
    severity: 'severe',
    ownerMessage: '우심실이 뚜렷하게 확장되어 있습니다. 폐고혈압 또는 심각한 삼첨판 질환의 가능성이 높으므로 즉각적인 평가와 치료가 필요합니다.',
  },
  {
    id: 'ra_dilation',
    label: '우심방 확장',
    severity: 'mild',
    ownerMessage: '우심방이 확장되어 있습니다. 삼첨판 역류 또는 우심 기능 이상과 관련이 있을 수 있습니다.',
  },
  {
    id: 'tv_mild_regurg',
    label: '삼첨판 경도 역류 (TR mild)',
    severity: 'mild',
    ownerMessage: '우측 심장 판막(삼첨판)에서 소량의 역류가 관찰됩니다. 경미한 수준이나 폐고혈압 여부를 확인하기 위해 속도를 측정하는 것이 좋습니다.',
  },
  {
    id: 'tv_moderate_severe_regurg',
    label: '삼첨판 중등-심한 역류 (TR mod–sev)',
    severity: 'severe',
    ownerMessage: '삼첨판에서 상당한 혈액 역류가 관찰됩니다. 우심 기능에 부담을 주는 상태로 전문적인 치료가 필요합니다.',
  },
]

// 7. 폐고혈압
const pulmonaryHtFindings: EchoFinding[] = [
  {
    id: 'ph_borderline',
    label: '경계성 폐고혈압 의심 (Vmax TR 2.5–2.8 m/s)',
    severity: 'mild',
    ownerMessage: '폐동맥 압력이 정상보다 약간 높을 가능성이 있습니다. 폐 질환, 심장 질환 등 원인 확인을 위한 추가 검사를 권장드립니다.',
  },
  {
    id: 'ph_mild_moderate',
    label: '경도-중등도 폐고혈압 의심 (Vmax TR 2.8–3.4 m/s)',
    severity: 'moderate',
    ownerMessage: '폐동맥 압력이 상승되어 있습니다. 심장과 폐에 부담을 주는 상태로, 원인 질환 치료 및 폐고혈압 관리가 필요합니다.',
  },
  {
    id: 'ph_severe',
    label: '심한 폐고혈압 의심 (Vmax TR > 3.4 m/s)',
    severity: 'severe',
    ownerMessage: '폐동맥 압력이 심하게 상승되어 있습니다. 호흡 곤란 및 운동 불내성이 동반될 수 있으며 즉각적인 전문 치료가 필요합니다.',
  },
]

// 8. 심낭
const pericardiumFindings: EchoFinding[] = [
  {
    id: 'pericardial_effusion_small',
    label: '심낭 삼출 (소량)',
    severity: 'mild',
    ownerMessage: '심장을 감싸는 막(심낭) 안에 소량의 액체가 고여 있습니다. 원인 파악을 위한 추가 검사가 필요하며, 양이 늘어나는지 모니터링이 중요합니다.',
  },
  {
    id: 'pericardial_effusion_moderate',
    label: '심낭 삼출 (중등량)',
    severity: 'moderate',
    ownerMessage: '심낭 내 중등량의 액체가 확인됩니다. 심장을 압박할 수 있는 단계로, 원인 진단과 배액 여부 결정을 위한 즉각적인 평가가 필요합니다.',
  },
  {
    id: 'pericardial_effusion_large',
    label: '심낭 삼출 (대량) / 심낭 압전 의심',
    severity: 'severe',
    ownerMessage: '심낭 내 대량의 액체가 확인되어 심장 기능을 심하게 압박하는 상태(심낭 압전)가 의심됩니다. 즉각적인 처치(심낭천자)가 필요할 수 있습니다.',
  },
  {
    id: 'pericardial_mass',
    label: '심낭 / 심장 기저부 종괴 의심',
    severity: 'severe',
    ownerMessage: '심장 주변에 비정상적인 종괴가 관찰됩니다. 혈관육종 등 종양성 병변의 가능성이 있어 즉각적인 정밀 검사가 필요합니다.',
  },
]

// 9. 종합 평가
const overallFindings: EchoFinding[] = [
  {
    id: 'normal',
    label: '심장 구조 및 기능 정상 범위',
    severity: 'mild',
    ownerMessage: '심장초음파 검사에서 구조적, 기능적 이상이 관찰되지 않았습니다. 정기적인 건강검진을 통한 지속적인 관리를 권장드립니다.',
  },
  {
    id: 'borderline',
    label: '경계 소견 (6–12개월 내 재검 권장)',
    severity: 'mild',
    ownerMessage: '명확한 질환으로 진단하기는 어렵지만 주의가 필요한 소견이 관찰됩니다. 6–12개월 후 재검사를 통해 변화를 확인하는 것을 권장드립니다.',
  },
  {
    id: 'mmvd_b1',
    label: 'MMVD Stage B1 (판막질환, 심비대 없음)',
    severity: 'mild',
    ownerMessage: '승모판 질환이 확인되었으나 아직 심장이 커지지 않은 초기 단계(B1)입니다. 현재는 약물 치료가 필요하지 않으나, 6–12개월 주기로 심장 초음파 검사를 받으시기 바랍니다.',
  },
  {
    id: 'mmvd_b2',
    label: 'MMVD Stage B2 (판막질환 + 심비대)',
    severity: 'moderate',
    ownerMessage: '승모판 질환으로 인해 심장이 커진 단계(B2)입니다. 이 단계에서는 심장 보호 약물(피모벤단 등) 치료를 시작하는 것이 권고될 수 있습니다. 전문 수의사와 상담하세요.',
  },
  {
    id: 'significant_disease',
    label: '임상적으로 유의미한 심장질환 확인',
    severity: 'severe',
    ownerMessage: '심장 기능에 유의미한 영향을 주는 심장 질환이 확인되었습니다. 적극적인 치료와 함께 정기적인 심장 모니터링이 필요합니다.',
  },
]

// ── 카테고리 배열 ──────────────────────────────────────────────

export const echoCategories: EchoCategory[] = [
  { id: 'lv_systolic',   label: '좌심실 수축기능',      findings: lvSystolicFindings },
  { id: 'lv_size',       label: '좌심실 크기/형태',     findings: lvSizeFindings },
  { id: 'mitral_valve',  label: '이첨판 (승모판)',       findings: mitralValveFindings },
  { id: 'left_atrium',   label: '좌심방',               findings: leftAtriumFindings },
  { id: 'aortic_valve',  label: '대동맥판',             findings: aorticValveFindings },
  { id: 'right_heart',   label: '우심 / 삼첨판',        findings: rightHeartFindings },
  { id: 'pulmonary_ht',  label: '폐고혈압',             findings: pulmonaryHtFindings },
  { id: 'pericardium',   label: '심낭',                 findings: pericardiumFindings },
  { id: 'overall',       label: '종합 평가',            findings: overallFindings },
]

export const echoFindingMap: Record<string, EchoFinding> = Object.fromEntries(
  echoCategories.flatMap((c) => c.findings.map((f) => [f.id, f])),
)

// ── 계측 항목 ─────────────────────────────────────────────────

export const echoMeasurements: EchoMeasurement[] = [
  // 1. LA/Ao 비율
  {
    id: 'la_ao',
    nameKo: '좌심방/대동맥 비율',
    nameEn: 'LA/Ao',
    unit: '',
    categoryId: 'left_atrium',
    defaultRefRange: { dog: '< 1.6', cat: '< 1.5' },
    ranges: {
      dog: [
        { min: null, max: 1.6,  resultText: 'Normal',                     resultTextKo: '정상',               isAbnormal: false                        },
        { min: 1.6,  max: 1.8,  resultText: 'Mild LA enlargement',        resultTextKo: '경도 좌심방 확장',   isAbnormal: true,  severity: 'mild'     },
        { min: 1.8,  max: 2.0,  resultText: 'Moderate LA enlargement',    resultTextKo: '중등도 좌심방 확장', isAbnormal: true,  severity: 'moderate' },
        { min: 2.0,  max: null, resultText: 'Severe LA enlargement',      resultTextKo: '심한 좌심방 확장',   isAbnormal: true,  severity: 'severe'   },
      ],
      cat: [
        { min: null, max: 1.5,  resultText: 'Normal',                     resultTextKo: '정상',               isAbnormal: false                        },
        { min: 1.5,  max: 1.7,  resultText: 'Borderline LA enlargement',  resultTextKo: '경계성 좌심방 확장', isAbnormal: true,  severity: 'mild'     },
        { min: 1.7,  max: null, resultText: 'LA enlargement',             resultTextKo: '좌심방 확장',        isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: 'MMVD 스테이징(개), HCM 진행 평가(고양이)의 핵심 지표. 개 B1→B2 전환 기준점(≥1.6). 폐부종 위험도와 직접 연관',
      normal: '좌심방 크기 정상. MMVD B1(개) 또는 조기 HCM(고양이)에서도 정상일 수 있어 판막 소견과 함께 해석 필요',
    },
    ownerMessage: {
      increase: '심장 내 좌심방(혈액을 받는 공간)이 정상보다 확장되어 있습니다. 확장 정도가 클수록 폐에 물이 차는 폐부종이 발생할 위험이 높아지므로, 전문 수의사와 치료 계획을 상담하시기 바랍니다.',
      decrease: '좌심방이 작게 측정된 경우 임상적으로 큰 의미가 없습니다.',
      normal: '좌심방 크기가 정상 범위 내에 있습니다.',
    },
  },

  // 2. LVIDDN (개 중심 — LV 확장기 내경 정규화)
  {
    id: 'lviddn',
    nameKo: '정규화 LV 확장기 내경',
    nameEn: 'LVIDDN',
    unit: '',
    categoryId: 'lv_size',
    speciesNote: '개 전용 (Boswood 기준)',
    defaultRefRange: { dog: '< 1.7', cat: '—' },
    ranges: {
      dog: [
        { min: null, max: 1.7,  resultText: 'Normal',                     resultTextKo: '정상',               isAbnormal: false                        },
        { min: 1.7,  max: 1.9,  resultText: 'Mild LV dilation',           resultTextKo: '경도 LV 확장',       isAbnormal: true,  severity: 'mild'     },
        { min: 1.9,  max: 2.2,  resultText: 'Moderate LV dilation',       resultTextKo: '중등도 LV 확장',     isAbnormal: true,  severity: 'moderate' },
        { min: 2.2,  max: null, resultText: 'Severe LV dilation',         resultTextKo: '심한 LV 확장',       isAbnormal: true,  severity: 'severe'   },
      ],
      cat: [
        { min: null, max: 999, resultText: 'Not applicable',               resultTextKo: '고양이 미적용',      isAbnormal: false                        },
      ],
    },
    comment: {
      increase: '좌심실 확장 — MMVD B2 기준(≥1.7, Boswood 2016), DCM 등. 체중 정규화값이므로 종간 비교 가능',
      normal: '개에서 LV 크기 정상. 고양이는 LVIDDN 대신 IVSd/LVFWd로 평가',
    },
    ownerMessage: {
      increase: '심장 좌심실(혈액을 온몸으로 내보내는 펌프)이 체격 대비 정상보다 크게 확장되어 있습니다. 심장 질환 진행 여부를 평가하고 치료 방향을 결정하기 위해 전문의 상담이 필요합니다.',
      decrease: '좌심실 크기가 감소된 경우 탈수, 저혈압 등의 상태와 연관될 수 있습니다.',
      normal: '심장 좌심실 크기가 정상 범위 내에 있습니다.',
    },
  },

  // 3. FS% (단축분율 — 좌심실 수축 기능)
  {
    id: 'fs_percent',
    nameKo: '단축분율',
    nameEn: 'FS%',
    unit: '%',
    categoryId: 'lv_systolic',
    defaultRefRange: { dog: '25–45', cat: '35–65' },
    ranges: {
      dog: [
        { min: null, max: 15,  resultText: 'Severe systolic dysfunction',  resultTextKo: '심한 수축기능 저하', isAbnormal: true,  severity: 'severe'   },
        { min: 15,   max: 20,  resultText: 'Moderate systolic dysfunction',resultTextKo: '중등도 수축기능 저하',isAbnormal: true, severity: 'moderate' },
        { min: 20,   max: 25,  resultText: 'Mild systolic dysfunction',    resultTextKo: '경도 수축기능 저하', isAbnormal: true,  severity: 'mild'     },
        { min: 25,   max: 45,  resultText: 'Normal',                       resultTextKo: '정상',               isAbnormal: false                        },
        { min: 45,   max: null,resultText: 'Hyperdynamic',                 resultTextKo: '과수축',             isAbnormal: true,  severity: 'mild'     },
      ],
      cat: [
        { min: null, max: 25,  resultText: 'Severe systolic dysfunction',  resultTextKo: '심한 수축기능 저하', isAbnormal: true,  severity: 'severe'   },
        { min: 25,   max: 35,  resultText: 'Mild systolic dysfunction',    resultTextKo: '경도 수축기능 저하', isAbnormal: true,  severity: 'mild'     },
        { min: 35,   max: 65,  resultText: 'Normal',                       resultTextKo: '정상',               isAbnormal: false                        },
        { min: 65,   max: null,resultText: 'Hyperdynamic',                 resultTextKo: '과수축',             isAbnormal: true,  severity: 'mild'     },
      ],
    },
    comment: {
      decrease: 'DCM(개), 심근병증, 심근염 등 수축기능 저하 시 감소. 개 < 25% → 적극적 치료 대상',
      increase: '과수축 — 흥분 상태, 빈혈, 갑상선 기능항진(고양이), 교감신경 활성화 시 나타남',
      normal: '수축 기능 정상. 단, HCM(고양이)에서는 FS 정상이어도 이완기능 이상이 있을 수 있음',
    },
    ownerMessage: {
      decrease: '심장이 수축하면서 혈액을 내보내는 능력(단축분율)이 저하되어 있습니다. 저하 정도에 따라 약물 치료가 필요할 수 있으며, 전문 수의사와 상담하시기 바랍니다.',
      increase: '심장이 정상보다 더 힘차게 수축하는 소견으로, 흥분·빈혈·호르몬 이상 등이 원인일 수 있습니다.',
      normal: '심장의 수축 능력이 정상 범위 내에 있습니다.',
    },
  },

  // 4. IVSd (확장기 실간격두께 — 고양이 HCM 핵심 지표)
  {
    id: 'ivsd',
    nameKo: '확장기 실간격두께',
    nameEn: 'IVSd',
    unit: 'mm',
    categoryId: 'lv_size',
    speciesNote: '고양이 HCM 진단 핵심. 개는 체중 의존적',
    defaultRefRange: { dog: '체중의존', cat: '< 5.5' },
    ranges: {
      dog: [
        { min: null, max: 999, resultText: 'Weight-dependent — see M-mode ref', resultTextKo: '체중 기준 참조 필요', isAbnormal: false },
      ],
      cat: [
        { min: null, max: 5.5,  resultText: 'Normal',                   resultTextKo: '정상',                       isAbnormal: false                        },
        { min: 5.5,  max: 6.0,  resultText: 'Equivocal (borderline HCM)', resultTextKo: '경계성 (HCM 의심)',       isAbnormal: true,  severity: 'mild'     },
        { min: 6.0,  max: null, resultText: 'HCM diagnostic threshold', resultTextKo: 'HCM 진단 기준 초과',         isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: '고양이: ≥6mm → HCM 진단 기준 충족. 5.5–6.0mm → equivocal, 6개월 재검 권장. 개: 체중별 정규화값 필요 — M-mode lookup table 참조',
      normal: '고양이 IVSd 정상. HCM 가능성 낮으나 동적 LVOTO 유무 추가 평가 권장',
    },
    ownerMessage: {
      increase: '심장 근육 벽 두께가 기준값 이상으로 두꺼워져 있습니다. 특히 고양이에서 비대성 심근병증(HCM)의 진단 기준이 될 수 있으며, 정기적인 심장 초음파 추적 검사가 중요합니다.',
      decrease: '심장 벽이 얇은 경우 확장성 심근병증 패턴일 수 있습니다.',
      normal: '심장 근육 벽 두께가 정상 범위 내에 있습니다.',
    },
  },

  // 5. LVFWd (확장기 좌심실 자유벽두께 — 고양이 HCM)
  {
    id: 'lvfwd',
    nameKo: '확장기 LV 자유벽두께',
    nameEn: 'LVFWd',
    unit: 'mm',
    categoryId: 'lv_size',
    speciesNote: '고양이 HCM 진단 핵심. 개는 체중 의존적',
    defaultRefRange: { dog: '체중의존', cat: '< 5.5' },
    ranges: {
      dog: [
        { min: null, max: 999, resultText: 'Weight-dependent — see M-mode ref', resultTextKo: '체중 기준 참조 필요', isAbnormal: false },
      ],
      cat: [
        { min: null, max: 5.5,  resultText: 'Normal',                   resultTextKo: '정상',                       isAbnormal: false                        },
        { min: 5.5,  max: 6.0,  resultText: 'Equivocal (borderline HCM)', resultTextKo: '경계성 (HCM 의심)',       isAbnormal: true,  severity: 'mild'     },
        { min: 6.0,  max: null, resultText: 'HCM diagnostic threshold', resultTextKo: 'HCM 진단 기준 초과',         isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: 'IVSd와 함께 고양이 HCM 진단의 핵심. 어느 한 쪽이라도 ≥6mm이면 HCM 기준 충족',
      normal: 'LV 자유벽 두께 정상',
    },
    ownerMessage: {
      increase: '심장 좌심실 외벽의 두께가 기준 이상으로 두꺼워져 있습니다. 비대성 심근병증(HCM) 진단 기준에 해당하므로 전문 심장 수의사의 평가가 필요합니다.',
      decrease: '심장 벽이 얇은 경우 확장성 심근병증 패턴일 수 있습니다.',
      normal: '좌심실 자유벽 두께가 정상 범위 내에 있습니다.',
    },
  },

  // 6. Vmax TR (삼첨판 최대 역류 속도 — 폐고혈압 스크리닝)
  {
    id: 'vmax_tr',
    nameKo: '삼첨판 최대 역류 속도',
    nameEn: 'Vmax TR',
    unit: 'm/s',
    categoryId: 'pulmonary_ht',
    defaultRefRange: { dog: '< 2.5', cat: '< 2.5' },
    ranges: {
      dog: [
        { min: null, max: 2.5,  resultText: 'Normal — PH unlikely',        resultTextKo: '정상 (PH 가능성 낮음)',      isAbnormal: false                        },
        { min: 2.5,  max: 2.8,  resultText: 'Borderline — PH possible',    resultTextKo: '경계 (PH 의심)',             isAbnormal: true,  severity: 'mild'     },
        { min: 2.8,  max: 3.4,  resultText: 'PH likely (moderate)',        resultTextKo: 'PH 가능성 높음 (중등도)',    isAbnormal: true,  severity: 'moderate' },
        { min: 3.4,  max: null, resultText: 'PH highly likely (severe)',   resultTextKo: 'PH 강력 의심 (중등-심한)',   isAbnormal: true,  severity: 'severe'   },
      ],
      cat: [
        { min: null, max: 2.5,  resultText: 'Normal — PH unlikely',        resultTextKo: '정상 (PH 가능성 낮음)',      isAbnormal: false                        },
        { min: 2.5,  max: 3.0,  resultText: 'Borderline',                  resultTextKo: '경계',                       isAbnormal: true,  severity: 'mild'     },
        { min: 3.0,  max: null, resultText: 'PH likely',                   resultTextKo: 'PH 의심',                    isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: '삼첨판 역류 속도 → 우심방-우심실 압력차 추정 (4v²). ≥2.8 m/s 이상이면 폐고혈압 가능성 높음. 우심 질환, 폐 질환, 좌심부전에 의한 이차성 PH 감별 필요',
      normal: '삼첨판 역류 속도 정상. 폐고혈압 가능성 낮음',
    },
    ownerMessage: {
      increase: '심장에서 폐로 혈액을 보내는 폐동맥의 압력이 높아져 있을 가능성이 있습니다. 폐고혈압은 호흡 곤란, 운동 불내성 등을 유발할 수 있어 원인 파악과 치료가 필요합니다.',
      decrease: '삼첨판 역류 속도가 낮은 경우 임상적 의미가 없습니다.',
      normal: '폐동맥 압력이 정상 범위로 측정되었습니다.',
    },
  },

  // 7. AoV Vmax (대동맥판 최고 혈류 속도 — 대동맥 협착 스크리닝)
  {
    id: 'aov_vmax',
    nameKo: '대동맥판 최고 혈류 속도',
    nameEn: 'AoV Vmax',
    unit: 'm/s',
    categoryId: 'aortic_valve',
    defaultRefRange: { dog: '< 2.0', cat: '< 2.0' },
    ranges: {
      dog: [
        { min: null, max: 2.0,  resultText: 'Normal',                    resultTextKo: '정상',                 isAbnormal: false                        },
        { min: 2.0,  max: 2.5,  resultText: 'Mild AS or dynamic LVOTO', resultTextKo: '경도 협착 또는 동적 폐쇄', isAbnormal: true, severity: 'mild'    },
        { min: 2.5,  max: 4.0,  resultText: 'Moderate AS',              resultTextKo: '중등도 대동맥 협착',    isAbnormal: true,  severity: 'moderate' },
        { min: 4.0,  max: null, resultText: 'Severe AS',                resultTextKo: '심한 대동맥 협착',      isAbnormal: true,  severity: 'severe'   },
      ],
      cat: [
        { min: null, max: 2.0,  resultText: 'Normal',                    resultTextKo: '정상',                 isAbnormal: false                        },
        { min: 2.0,  max: 3.0,  resultText: 'Dynamic LVOTO / mild AS',  resultTextKo: '동적 폐쇄 / 경도 협착', isAbnormal: true, severity: 'mild'     },
        { min: 3.0,  max: null, resultText: 'Significant obstruction',  resultTextKo: '유의미한 폐쇄',         isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: '대동맥판 협착(SAS 포함) 또는 동적 LVOTO(HCM 고양이). 2.0–2.5 m/s: 경미하거나 정상 변이. >4.0 m/s: 중증 협착',
      normal: '대동맥 혈류 속도 정상',
    },
    ownerMessage: {
      increase: '심장에서 몸으로 혈액이 나가는 대동맥 부위의 혈류 속도가 빠릅니다. 대동맥판 협착이나 심장 내 혈류 방해 구조물이 있을 수 있어 추가 평가가 필요합니다.',
      decrease: '속도 감소는 낮은 심박출량과 연관될 수 있습니다.',
      normal: '대동맥 혈류 속도가 정상 범위 내에 있습니다.',
    },
  },
]

/** 수치 입력 시 해당 range entry 반환 */
export function interpretEchoMeasurement(
  measurement: EchoMeasurement,
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

export const echoMeasurementMap: Record<string, EchoMeasurement> = Object.fromEntries(
  echoMeasurements.map((m) => [m.id, m]),
)

const SEVERITY_BG_ECHO: Record<string, string> = {
  mild:     'bg-slate-100 text-slate-600',
  moderate: 'bg-amber-50  text-amber-700',
  severe:   'bg-red-50    text-red-700',
}
export { SEVERITY_BG_ECHO }
