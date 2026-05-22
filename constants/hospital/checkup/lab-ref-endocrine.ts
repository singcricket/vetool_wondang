import type { LabRefItem } from './lab-types'

export const labRefEndocrine: LabRefItem[] = [
  // ── 갑상선 ──────────────────────────────────────────────────
  {
    id: 't4_total',
    nameKo: '총 티록신',
    nameEn: 'T4 (Total)',
    unit: 'μg/dL',
    section: ['endocrine', 'thyroid'],
    testType: 'range',
    foldProfile: 'electrolyte',
    defaultRefRange: { dog: '1.0–4.0', cat: '0.8–4.0' },
    ranges: {
      dog: [
        { min: null, max: 0.5,  resultText: 'Severe hypothyroidism',    resultTextKo: '심한 갑상선기능저하',   isAbnormal: true,  severity: 'high'     },
        { min: 0.5,  max: 1.0,  resultText: 'Borderline low / hypothyroidism', resultTextKo: '경계 저하',   isAbnormal: true,  severity: 'mild'     },
        { min: 1.0,  max: 4.0,  resultText: 'Normal',                   resultTextKo: '정상',                  isAbnormal: false                       },
        { min: 4.0,  max: 6.0,  resultText: 'Borderline high',          resultTextKo: '경계 상승',             isAbnormal: true,  severity: 'mild'     },
        { min: 6.0,  max: null, resultText: 'Hyperthyroidism suspected', resultTextKo: '갑상선기능항진증 의심', isAbnormal: true,  severity: 'moderate' },
      ],
      cat: [
        { min: null, max: 0.5,  resultText: 'Severe hypothyroidism',    resultTextKo: '심한 갑상선기능저하',   isAbnormal: true,  severity: 'high'     },
        { min: 0.5,  max: 0.8,  resultText: 'Borderline low',           resultTextKo: '경계 저하',             isAbnormal: true,  severity: 'mild'     },
        { min: 0.8,  max: 4.0,  resultText: 'Normal',                   resultTextKo: '정상',                  isAbnormal: false                       },
        { min: 4.0,  max: 6.0,  resultText: 'Borderline high',          resultTextKo: '경계 상승',             isAbnormal: true,  severity: 'mild'     },
        { min: 6.0,  max: null, resultText: 'Hyperthyroidism',          resultTextKo: '갑상선기능항진증',      isAbnormal: true,  severity: 'high'     },
      ],
    },
    comment: {
      increase: '갑상선기능항진증(고양이 노령에서 흔함)',
      decrease: '갑상선기능저하증(개에서 흔함), 비갑상선성 질환(euthyroid sick syndrome)',
      normal: '스크리닝 검사. 경계치 시 fT4 추가 검사 권장',
    },
    aiExtractKeywords: ['T4', 'Total T4', 'TT4', 'Thyroxine'],
  },
  {
    id: 'ft4',
    nameKo: '유리 티록신',
    nameEn: 'fT4',
    unit: 'ng/dL',
    section: ['endocrine', 'thyroid'],
    testType: 'range',
    foldProfile: 'electrolyte',
    defaultRefRange: { dog: '0.7–4.0', cat: '0.8–4.2' },
    ranges: {
      dog: [
        { min: null, max: 0.7,  resultText: 'Low fT4 — hypothyroidism',  resultTextKo: '낮은 유리 T4 — 갑상선저하', isAbnormal: true,  severity: 'moderate' },
        { min: 0.7,  max: 4.0,  resultText: 'Normal',                    resultTextKo: '정상',                       isAbnormal: false                        },
        { min: 4.0,  max: null, resultText: 'Elevated fT4',              resultTextKo: '유리 T4 상승',               isAbnormal: true,  severity: 'moderate'  },
      ],
      cat: [
        { min: null, max: 0.8,  resultText: 'Low fT4 — hypothyroidism',  resultTextKo: '낮은 유리 T4 — 갑상선저하', isAbnormal: true,  severity: 'moderate' },
        { min: 0.8,  max: 4.2,  resultText: 'Normal',                    resultTextKo: '정상',                       isAbnormal: false                        },
        { min: 4.2,  max: null, resultText: 'Hyperthyroidism confirmed',  resultTextKo: '갑상선기능항진증 확진',      isAbnormal: true,  severity: 'high'      },
      ],
    },
    comment: {
      increase: '갑상선기능항진증 확진',
      decrease: '갑상선기능저하증. Total T4보다 특이도 높음',
      normal: 'Equilibrium dialysis(ED) 방법이 gold standard',
    },
    aiExtractKeywords: ['fT4', 'Free T4', 'Free Thyroxine'],
  },
  {
    id: 'tsh',
    nameKo: '갑상선자극호르몬',
    nameEn: 'TSH',
    unit: 'ng/mL',
    section: ['endocrine', 'thyroid'],
    testType: 'range',
    foldProfile: 'electrolyte',
    defaultRefRange: { dog: '0.03–0.50', cat: '미확립' },
    ranges: {
      dog: [
        { min: null, max: 0.03, resultText: 'Suppressed TSH',       resultTextKo: 'TSH 억제 — 갑상선항진 의심', isAbnormal: true,  severity: 'mild'     },
        { min: 0.03, max: 0.50, resultText: 'Normal',               resultTextKo: '정상',                       isAbnormal: false                        },
        { min: 0.50, max: 1.0,  resultText: 'Mildly elevated TSH',  resultTextKo: 'TSH 경도 상승',              isAbnormal: true,  severity: 'mild'     },
        { min: 1.0,  max: null, resultText: 'Elevated TSH — hypothyroidism', resultTextKo: 'TSH 상승 — 갑상선저하', isAbnormal: true, severity: 'high' },
      ],
    },
    comment: {
      increase: '갑상선기능저하증(뇌하수체 보상 반응). T4↓ + TSH↑ 조합으로 진단',
      decrease: '갑상선기능항진증, 뇌하수체 기능저하',
      normal: '개 전용 cTSH 검사. 고양이용 fTSH는 제한적 적용',
    },
    aiExtractKeywords: ['TSH', 'cTSH', 'Thyroid Stimulating Hormone'],
  },

  // ── 부신 ──────────────────────────────────────────────────
  {
    id: 'cortisol_basal',
    nameKo: '코르티솔 (기저)',
    nameEn: 'Cortisol (Basal)',
    unit: 'μg/dL',
    section: ['endocrine'],
    testType: 'range',
    foldProfile: 'renal',
    defaultRefRange: { common: '1–5' },
    ranges: {
      common: [
        { min: null, max: 1.0,  resultText: 'Low cortisol — Addison suspected', resultTextKo: '낮은 코르티솔 — 애디슨 의심', isAbnormal: true,  severity: 'moderate' },
        { min: 1.0,  max: 5.0,  resultText: 'Normal',                           resultTextKo: '정상',                          isAbnormal: false                        },
        { min: 5.0,  max: 10.0, resultText: 'Borderline high',                  resultTextKo: '경계 상승 — 쿠싱 가능성',       isAbnormal: true,  severity: 'mild'     },
        { min: 10.0, max: null, resultText: 'High — Cushing suspected',         resultTextKo: '상승 — 쿠싱증후군 의심',        isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: '쿠싱증후군 의심 — 확진을 위해 LDDST 또는 ACTH 자극검사 필요',
      decrease: '부신기능저하증(Addison) 의심 — ACTH 자극검사로 확진',
      normal: '단독 기저치로 진단하지 않음. 스트레스 영향 큼',
    },
    aiExtractKeywords: ['Cortisol', '코르티솔', 'Corticosterone'],
  },
  {
    id: 'cortisol_post_acth',
    nameKo: '코르티솔 (ACTH 자극후)',
    nameEn: 'Cortisol (Post-ACTH)',
    unit: 'μg/dL',
    section: ['endocrine'],
    testType: 'range',
    foldProfile: 'renal',
    defaultRefRange: { dog: '8–17', cat: '8–18' },
    ranges: {
      dog: [
        { min: null, max: 2.0,  resultText: 'Addison confirmed',         resultTextKo: '부신기능저하(Addison) 확진', isAbnormal: true,  severity: 'critical' },
        { min: 2.0,  max: 8.0,  resultText: 'Suboptimal — Addison suspected', resultTextKo: '불충분 반응 — Addison 의심', isAbnormal: true, severity: 'moderate' },
        { min: 8.0,  max: 17.0, resultText: 'Normal response',           resultTextKo: '정상 반응',                  isAbnormal: false                        },
        { min: 17.0, max: 22.0, resultText: 'Borderline — Cushing possible', resultTextKo: '경계 상승 — 쿠싱 가능', isAbnormal: true,  severity: 'mild'     },
        { min: 22.0, max: null, resultText: 'Cushing confirmed',         resultTextKo: '쿠싱증후군 확진',            isAbnormal: true,  severity: 'high'     },
      ],
      cat: [
        { min: null, max: 2.0,  resultText: 'Addison confirmed',         resultTextKo: '부신기능저하 확진',          isAbnormal: true,  severity: 'critical' },
        { min: 2.0,  max: 8.0,  resultText: 'Suboptimal response',       resultTextKo: '불충분 반응',                isAbnormal: true,  severity: 'moderate' },
        { min: 8.0,  max: 18.0, resultText: 'Normal response',           resultTextKo: '정상 반응',                  isAbnormal: false                        },
        { min: 18.0, max: null, resultText: 'Cushing suspected',         resultTextKo: '쿠싱증후군 의심',            isAbnormal: true,  severity: 'high'     },
      ],
    },
    comment: {
      increase: '쿠싱증후군 (PDH 또는 AT)',
      decrease: '부신기능저하증(Addison) 확진',
      normal: 'ACTH 자극검사 — 합성 ACTH 주사 1시간 후 측정',
    },
    aiExtractKeywords: ['Post ACTH', 'ACTH Stimulation', '자극후 코르티솔'],
  },

  // ── 혈당 관련 ──────────────────────────────────────────────
  {
    id: 'insulin',
    nameKo: '인슐린',
    nameEn: 'Insulin',
    unit: 'μIU/mL',
    section: ['endocrine'],
    testType: 'range',
    foldProfile: 'renal',
    defaultRefRange: { dog: '5–30', cat: '5–25' },
    ranges: {
      dog: [
        { min: null, max: 5.0,  resultText: 'Low insulin — DM suspected',    resultTextKo: '낮은 인슐린 — 당뇨 의심',   isAbnormal: true,  severity: 'moderate' },
        { min: 5.0,  max: 30.0, resultText: 'Normal',                        resultTextKo: '정상',                       isAbnormal: false                        },
        { min: 30.0, max: 60.0, resultText: 'Elevated — insulin resistance', resultTextKo: '상승 — 인슐린저항성 의심',   isAbnormal: true,  severity: 'mild'     },
        { min: 60.0, max: null, resultText: 'High — insulinoma suspected',   resultTextKo: '고인슐린혈증 — 인슐린종 의심', isAbnormal: true, severity: 'high'    },
      ],
      cat: [
        { min: null, max: 5.0,  resultText: 'Low insulin — DM suspected',    resultTextKo: '낮은 인슐린 — 당뇨 의심',   isAbnormal: true,  severity: 'moderate' },
        { min: 5.0,  max: 25.0, resultText: 'Normal',                        resultTextKo: '정상',                       isAbnormal: false                        },
        { min: 25.0, max: null, resultText: 'Elevated insulin',              resultTextKo: '인슐린 상승',               isAbnormal: true,  severity: 'mild'     },
      ],
    },
    comment: {
      increase: '인슐린종, 인슐린저항성. 혈당과 함께 인슐린:혈당 비율로 해석',
      decrease: '당뇨병(인슐린결핍형)',
    },
    aiExtractKeywords: ['Insulin', '인슐린'],
  },

  // ── 기타 ──────────────────────────────────────────────────
  {
    id: 'pth',
    nameKo: '부갑상선호르몬',
    nameEn: 'PTH',
    unit: 'pmol/L',
    section: ['endocrine'],
    testType: 'range',
    foldProfile: 'renal',
    defaultRefRange: { common: '2–13' },
    ranges: {
      common: [
        { min: null, max: 2.0,  resultText: 'Low PTH — hypoparathyroidism', resultTextKo: '낮은 PTH — 부갑상선저하', isAbnormal: true,  severity: 'moderate' },
        { min: 2.0,  max: 13.0, resultText: 'Normal',                       resultTextKo: '정상',                     isAbnormal: false                        },
        { min: 13.0, max: 25.0, resultText: 'Mildly elevated PTH',          resultTextKo: 'PTH 경도 상승',            isAbnormal: true,  severity: 'mild'     },
        { min: 25.0, max: null, resultText: 'High PTH — hyperparathyroidism', resultTextKo: '부갑상선기능항진',       isAbnormal: true,  severity: 'high'     },
      ],
    },
    comment: {
      increase: '원발성 부갑상선기능항진증, 이차성(신부전, 저칼슘혈증)',
      decrease: '부갑상선기능저하증, PTH관련단백(PTHrP) 상승 종양',
    },
    aiExtractKeywords: ['PTH', 'Parathyroid Hormone', '부갑상선호르몬'],
  },
  {
    id: 'pthRP',
    nameKo: '부갑상선호르몬 관련 단백',
    nameEn: 'PTHrP',
    unit: 'pmol/L',
    section: ['endocrine'],
    testType: 'range',
    foldProfile: 'renal',
    defaultRefRange: { common: '<2' },
    ranges: {
      common: [
        { min: null, max: 2.0,  resultText: 'Normal',                     resultTextKo: '정상',                          isAbnormal: false                       },
        { min: 2.0,  max: 5.0,  resultText: 'Mildly elevated PTHrP',      resultTextKo: 'PTHrP 경도 상승',               isAbnormal: true,  severity: 'mild'    },
        { min: 5.0,  max: null, resultText: 'High PTHrP — malignancy',    resultTextKo: 'PTHrP 상승 — 악성종양 연관 고칼슘혈증', isAbnormal: true, severity: 'high' },
      ],
    },
    comment: {
      increase: '악성종양 관련 고칼슘혈증(림프종, 항문낭선암 등)',
      decrease: '임상적 의의 낮음',
    },
    aiExtractKeywords: ['PTHrP', 'PTH-related protein'],
  },
  // ── 부신 기능 검사 ───────────────────────────────────────────
  {
    id: 'urine_cortisol_creat',
    nameKo: '요 코르티솔:크레아티닌 비율',
    nameEn: 'UCCR',
    unit: '×10⁻⁶',
    section: ['endocrine'],
    testType: 'range',
    foldProfile: 'renal',
    defaultRefRange: { dog: '<10', cat: '<36' },
    ranges: {
      dog: [
        { min: null, max: 10.0, resultText: 'Normal — Cushing excluded',             resultTextKo: '정상 — 쿠싱 제외 가능',        isAbnormal: false                       },
        { min: 10.0, max: 20.0, resultText: 'Borderline',                            resultTextKo: '경계',                          isAbnormal: true,  severity: 'mild'    },
        { min: 20.0, max: null, resultText: 'Elevated — Cushing screening positive', resultTextKo: '상승 — 쿠싱 스크리닝 양성',     isAbnormal: true,  severity: 'high'    },
      ],
      cat: [
        { min: null, max: 36.0, resultText: 'Normal',                                resultTextKo: '정상',                          isAbnormal: false                       },
        { min: 36.0, max: null, resultText: 'Elevated — further workup',             resultTextKo: '상승 — 추가 검사 필요',         isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: '쿠싱증후군 스크리닝. 정상 시 쿠싱 제외 가능(높은 음성예측도)',
      decrease: '임상적 의의 낮음',
      normal: '집에서 첫 아침 소변 채취(스트레스 없는 환경)',
    },
    aiExtractKeywords: ['UCCR', 'Urine Cortisol Creatinine Ratio', '요코르티솔크레아티닌비'],
  },
  {
    id: 'lddst',
    nameKo: '저용량 덱사메타손 억제 검사',
    nameEn: 'LDDST',
    unit: 'μg/dL',
    section: ['endocrine'],
    testType: 'range',
    foldProfile: 'electrolyte',
    defaultRefRange: { common: '<1 μg/dL (억제 정상)' },
    ranges: {
      common: [
        { min: null, max: 1.0,  resultText: 'Suppressed — Cushing excluded', resultTextKo: '억제됨 — 쿠싱 제외',     isAbnormal: false                    },
        { min: 1.0,  max: 1.5,  resultText: 'Borderline suppression',        resultTextKo: '불완전 억제',            isAbnormal: true,  severity: 'mild' },
        { min: 1.5,  max: null, resultText: 'Not suppressed — Cushing',      resultTextKo: '억제 실패 — 쿠싱증후군', isAbnormal: true,  severity: 'high' },
      ],
    },
    comment: {
      increase: '쿠싱증후군(억제 실패) — PDH vs AT 감별을 위해 추가 검사',
      decrease: '쿠싱증후군 제외',
      normal: '덱사메타손 0.01 mg/kg IV 후 4시간, 8시간 코르티솔 측정',
    },
    aiExtractKeywords: ['LDDST', 'Low dose dexamethasone', '저용량덱사메타손'],
  },

  // ── 번식 호르몬 ───────────────────────────────────────────────
  {
    id: 'progesterone',
    nameKo: '프로게스테론',
    nameEn: 'Progesterone',
    unit: 'ng/mL',
    section: ['endocrine'],
    testType: 'range',
    defaultRefRange: { common: '기저 <1 / 배란 >5' },
    ranges: {
      common: [
        { min: null, max: 1.0,  resultText: 'Basal / anestrus',       resultTextKo: '기저기 / 무발정',     isAbnormal: false                       },
        { min: 1.0,  max: 2.0,  resultText: 'Pre-LH surge',           resultTextKo: 'LH 급증 전 단계',     isAbnormal: false                       },
        { min: 2.0,  max: 5.0,  resultText: 'Periovulatory',          resultTextKo: '배란 전후기',          isAbnormal: false                       },
        { min: 5.0,  max: null, resultText: 'Post-ovulation / luteal', resultTextKo: '배란 후 / 황체기',    isAbnormal: false                       },
      ],
    },
    comment: {
      increase: '황체기, 임신, 자궁축농증(개). 배란 시점 모니터링',
      decrease: '무배란, 황체 부전',
      normal: '개 번식: 배란 예측에 활용 (5 ng/mL 이상 = 배란)',
    },
    aiExtractKeywords: ['Progesterone', '프로게스테론', 'P4'],
  },
]
