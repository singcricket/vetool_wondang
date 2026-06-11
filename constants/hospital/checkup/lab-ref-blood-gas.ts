import type { LabRefItem } from './lab-types'

export const labRefBloodGas: LabRefItem[] = [
  // ── pH ─────────────────────────────────────────────────────
  {
    id: 'ph',
    nameKo: '혈액 pH',
    nameEn: 'pH',
    unit: '',
    section: ['blood_gas'],
    testType: 'range',
    descriptionKo: '혈액의 산염기 균형을 나타내는 지표입니다. 정상보다 낮으면 산증(acidosis), 높으면 알칼리증(alkalosis)을 의미하며, 대사성 또는 호흡성 원인을 구분해 평가합니다.',
    foldProfile: 'electrolyte',
    defaultRefRange: { dog: '7.35–7.45', cat: '7.24–7.40' },
    ranges: {
      dog: [
        { min: null,  max: 7.20,  resultText: 'Severe acidosis',       resultTextKo: '심한 산증',         isAbnormal: true,  severity: 'critical'  },
        { min: 7.20,  max: 7.35,  resultText: 'Acidosis',              resultTextKo: '산증',               isAbnormal: true,  severity: 'moderate'  },
        { min: 7.35,  max: 7.45,  resultText: 'Normal',                resultTextKo: '정상',               isAbnormal: false                        },
        { min: 7.45,  max: 7.55,  resultText: 'Alkalosis',             resultTextKo: '알칼리증',           isAbnormal: true,  severity: 'moderate'  },
        { min: 7.55,  max: null,  resultText: 'Severe alkalosis',      resultTextKo: '심한 알칼리증',      isAbnormal: true,  severity: 'critical'  },
      ],
      cat: [
        { min: null,  max: 7.10,  resultText: 'Severe acidosis',       resultTextKo: '심한 산증',         isAbnormal: true,  severity: 'critical'  },
        { min: 7.10,  max: 7.24,  resultText: 'Acidosis',              resultTextKo: '산증',               isAbnormal: true,  severity: 'moderate'  },
        { min: 7.24,  max: 7.40,  resultText: 'Normal',                resultTextKo: '정상',               isAbnormal: false                        },
        { min: 7.40,  max: 7.50,  resultText: 'Alkalosis',             resultTextKo: '알칼리증',           isAbnormal: true,  severity: 'moderate'  },
        { min: 7.50,  max: null,  resultText: 'Severe alkalosis',      resultTextKo: '심한 알칼리증',      isAbnormal: true,  severity: 'critical'  },
      ],
    },
    comment: {
      increase: '알칼리증: 구토(HCl 소실), 과호흡, 이뇨제 사용, 저산소증 초기 반응',
      decrease: '산증: 당뇨성 케토산증(DKA), 신부전, 심한 설사, 저환기(pCO2 상승), 쇼크/조직 저산소',
    },
    aiExtractKeywords: ['pH', 'blood pH', 'arterial pH'],
  },

  // ── pCO2 ───────────────────────────────────────────────────
  {
    id: 'pco2',
    nameKo: '이산화탄소 분압 (pCO₂)',
    nameEn: 'pCO2',
    unit: 'mmHg',
    section: ['blood_gas'],
    testType: 'range',
    descriptionKo: '혈액 내 이산화탄소 분압으로 호흡의 효율성을 반영합니다. 높으면 환기가 부족해 CO₂가 쌓인 것이고, 낮으면 과호흡으로 CO₂가 과도하게 빠져나간 것입니다.',
    foldProfile: 'electrolyte',
    defaultRefRange: { dog: '36–44 mmHg', cat: '29–42 mmHg' },
    ranges: {
      dog: [
        { min: null,  max: 25.0,  resultText: 'Severe hypocapnia — hyperventilation',   resultTextKo: '심한 저탄산혈증 — 과호흡',       isAbnormal: true,  severity: 'high'     },
        { min: 25.0,  max: 36.0,  resultText: 'Hypocapnia — hyperventilation',          resultTextKo: '저탄산혈증 — 과호흡',            isAbnormal: true,  severity: 'mild'     },
        { min: 36.0,  max: 44.0,  resultText: 'Normal',                                 resultTextKo: '정상',                           isAbnormal: false                        },
        { min: 44.0,  max: 60.0,  resultText: 'Hypercapnia — hypoventilation',          resultTextKo: '고탄산혈증 — 환기 저하',         isAbnormal: true,  severity: 'moderate' },
        { min: 60.0,  max: null,  resultText: 'Severe hypercapnia — respiratory failure', resultTextKo: '심한 고탄산혈증 — 호흡부전',  isAbnormal: true,  severity: 'critical' },
      ],
      cat: [
        { min: null,  max: 20.0,  resultText: 'Severe hypocapnia — hyperventilation',   resultTextKo: '심한 저탄산혈증 — 과호흡',       isAbnormal: true,  severity: 'high'     },
        { min: 20.0,  max: 29.0,  resultText: 'Hypocapnia — hyperventilation',          resultTextKo: '저탄산혈증 — 과호흡',            isAbnormal: true,  severity: 'mild'     },
        { min: 29.0,  max: 42.0,  resultText: 'Normal',                                 resultTextKo: '정상',                           isAbnormal: false                        },
        { min: 42.0,  max: 55.0,  resultText: 'Hypercapnia — hypoventilation',          resultTextKo: '고탄산혈증 — 환기 저하',         isAbnormal: true,  severity: 'moderate' },
        { min: 55.0,  max: null,  resultText: 'Severe hypercapnia — respiratory failure', resultTextKo: '심한 고탄산혈증 — 호흡부전',  isAbnormal: true,  severity: 'critical' },
      ],
    },
    comment: {
      increase: '호흡성 산증: 환기 저하(마취, 흉곽 질환, 신경근 질환), 기도 폐쇄, 호흡부전',
      decrease: '호흡성 알칼리증: 통증·불안에 의한 과호흡, 폐색전, 저산소증 보상 반응',
    },
    aiExtractKeywords: ['pCO2', 'PCO2', 'pCO₂', 'partial pressure CO2', 'carbon dioxide pressure'],
  },

  // ── pO2 ────────────────────────────────────────────────────
  {
    id: 'po2',
    nameKo: '산소 분압 (pO₂)',
    nameEn: 'pO2',
    unit: 'mmHg',
    section: ['blood_gas'],
    testType: 'range',
    descriptionKo: '동맥혈 내 산소 분압으로 폐의 산소화 기능을 직접 반영합니다. 수치가 낮을수록 저산소혈증이 심각하며 즉각적인 처치가 필요합니다.',
    foldProfile: 'renal',
    defaultRefRange: { dog: '80–108 mmHg', cat: '95–115 mmHg' },
    ranges: {
      dog: [
        { min: null,  max: 60.0,  resultText: 'Severe hypoxemia',      resultTextKo: '심한 저산소혈증',    isAbnormal: true,  severity: 'critical'  },
        { min: 60.0,  max: 80.0,  resultText: 'Moderate hypoxemia',    resultTextKo: '중등도 저산소혈증',  isAbnormal: true,  severity: 'moderate'  },
        { min: 80.0,  max: 108.0, resultText: 'Normal',                resultTextKo: '정상',               isAbnormal: false                        },
        { min: 108.0, max: null,  resultText: 'Elevated (O₂ supplementation)', resultTextKo: '상승 (산소 공급 중)', isAbnormal: false              },
      ],
      cat: [
        { min: null,  max: 70.0,  resultText: 'Severe hypoxemia',      resultTextKo: '심한 저산소혈증',    isAbnormal: true,  severity: 'critical'  },
        { min: 70.0,  max: 95.0,  resultText: 'Moderate hypoxemia',    resultTextKo: '중등도 저산소혈증',  isAbnormal: true,  severity: 'moderate'  },
        { min: 95.0,  max: 115.0, resultText: 'Normal',                resultTextKo: '정상',               isAbnormal: false                        },
        { min: 115.0, max: null,  resultText: 'Elevated (O₂ supplementation)', resultTextKo: '상승 (산소 공급 중)', isAbnormal: false              },
      ],
    },
    comment: {
      increase: '산소 공급 중이거나 과호흡 시 상승. 단독으로 이상 의미 없음',
      decrease: '저산소혈증: 폐렴, 폐부종, 흉막삼출, 폐색전, 폐포저환기. <60 mmHg: 즉각 산소 치료 필요',
    },
    aiExtractKeywords: ['pO2', 'PO2', 'pO₂', 'partial pressure O2', 'oxygen pressure', 'paO2', 'PaO2'],
  },

  // ── HCO3- ──────────────────────────────────────────────────
  {
    id: 'hco3',
    nameKo: '중탄산염 (HCO₃⁻)',
    nameEn: 'HCO3-',
    unit: 'mEq/L',
    section: ['blood_gas', 'electrolyte'],
    testType: 'range',
    descriptionKo: '혈액의 대사성 산염기 균형을 조절하는 완충물질입니다. 낮으면 대사성 산증(당뇨, 신부전, 설사 등), 높으면 대사성 알칼리증(구토, 이뇨제)의 가능성을 시사합니다.',
    foldProfile: 'electrolyte',
    defaultRefRange: { dog: '18–24 mEq/L', cat: '17–22 mEq/L' },
    ranges: {
      dog: [
        { min: null,  max: 12.0,  resultText: 'Severe metabolic acidosis',    resultTextKo: '심한 대사성 산증',     isAbnormal: true,  severity: 'critical'  },
        { min: 12.0,  max: 18.0,  resultText: 'Metabolic acidosis',           resultTextKo: '대사성 산증',          isAbnormal: true,  severity: 'moderate'  },
        { min: 18.0,  max: 24.0,  resultText: 'Normal',                       resultTextKo: '정상',                 isAbnormal: false                        },
        { min: 24.0,  max: 30.0,  resultText: 'Metabolic alkalosis',          resultTextKo: '대사성 알칼리증',      isAbnormal: true,  severity: 'mild'      },
        { min: 30.0,  max: null,  resultText: 'Severe metabolic alkalosis',   resultTextKo: '심한 대사성 알칼리증', isAbnormal: true,  severity: 'moderate'  },
      ],
      cat: [
        { min: null,  max: 12.0,  resultText: 'Severe metabolic acidosis',    resultTextKo: '심한 대사성 산증',     isAbnormal: true,  severity: 'critical'  },
        { min: 12.0,  max: 17.0,  resultText: 'Metabolic acidosis',           resultTextKo: '대사성 산증',          isAbnormal: true,  severity: 'moderate'  },
        { min: 17.0,  max: 22.0,  resultText: 'Normal',                       resultTextKo: '정상',                 isAbnormal: false                        },
        { min: 22.0,  max: 28.0,  resultText: 'Metabolic alkalosis',          resultTextKo: '대사성 알칼리증',      isAbnormal: true,  severity: 'mild'      },
        { min: 28.0,  max: null,  resultText: 'Severe metabolic alkalosis',   resultTextKo: '심한 대사성 알칼리증', isAbnormal: true,  severity: 'moderate'  },
      ],
    },
    comment: {
      increase: '대사성 알칼리증: 지속적 구토(위산 소실), 이뇨제(루프·티아지드), 고알도스테론증',
      decrease: '대사성 산증: DKA, 신부전, 심한 설사, 젖산산증(쇼크), 요독증. 보상성 감소(호흡성 알칼리증 시)',
    },
    aiExtractKeywords: ['HCO3', 'HCO3-', 'HCO₃', 'bicarbonate', 'bicarb', '중탄산염'],
  },

  // ── Base Excess ────────────────────────────────────────────
  {
    id: 'base_excess',
    nameKo: '염기 과잉/결핍 (BE)',
    nameEn: 'Base Excess',
    unit: 'mEq/L',
    section: ['blood_gas'],
    testType: 'range',
    descriptionKo: '혈액의 대사성 산염기 상태를 수치화한 지표입니다. 음수이면 산이 많거나(산증) 염기가 부족한 것이고, 양수이면 염기가 과잉인 것입니다.',
    foldProfile: 'electrolyte',
    defaultRefRange: { common: '-4 ~ +4 mEq/L' },
    ranges: {
      common: [
        { min: null,   max: -10.0, resultText: 'Severe base deficit',    resultTextKo: '심한 염기 결핍 (대사성 산증)', isAbnormal: true,  severity: 'critical' },
        { min: -10.0,  max: -4.0,  resultText: 'Base deficit',           resultTextKo: '염기 결핍 (대사성 산증)',      isAbnormal: true,  severity: 'moderate' },
        { min: -4.0,   max:  4.0,  resultText: 'Normal',                 resultTextKo: '정상',                         isAbnormal: false                       },
        { min:  4.0,   max: 10.0,  resultText: 'Base excess',            resultTextKo: '염기 과잉 (대사성 알칼리증)', isAbnormal: true,  severity: 'mild'     },
        { min: 10.0,   max: null,  resultText: 'Severe base excess',     resultTextKo: '심한 염기 과잉',               isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: '대사성 알칼리증: 구토, 이뇨제, 코르티코스테로이드',
      decrease: '대사성 산증: DKA, 신부전, 설사, 조직 저관류. BE < -10은 중증 쇼크·산증 시사',
    },
    aiExtractKeywords: ['BE', 'Base Excess', 'base deficit', 'BD', '염기 과잉', '염기 결핍'],
  },

  // ── TCO2 ───────────────────────────────────────────────────
  {
    id: 'tco2',
    nameKo: '총 이산화탄소 (tCO₂)',
    nameEn: 'tCO2',
    unit: 'mmol/L',
    section: ['blood_gas', 'electrolyte'],
    testType: 'range',
    descriptionKo: '혈청 내 이산화탄소 총량으로 HCO₃⁻ 농도와 거의 비슷합니다. 혈청화학 패널로 쉽게 측정 가능해 산염기 이상의 간편 선별에 이용됩니다.',
    foldProfile: 'electrolyte',
    defaultRefRange: { dog: '19–26 mmol/L', cat: '18–23 mmol/L' },
    ranges: {
      dog: [
        { min: null,  max: 13.0,  resultText: 'Severe metabolic acidosis',   resultTextKo: '심한 대사성 산증',  isAbnormal: true,  severity: 'critical'  },
        { min: 13.0,  max: 19.0,  resultText: 'Metabolic acidosis',          resultTextKo: '대사성 산증',       isAbnormal: true,  severity: 'moderate'  },
        { min: 19.0,  max: 26.0,  resultText: 'Normal',                      resultTextKo: '정상',              isAbnormal: false                        },
        { min: 26.0,  max: 32.0,  resultText: 'Metabolic alkalosis',         resultTextKo: '대사성 알칼리증',   isAbnormal: true,  severity: 'mild'      },
        { min: 32.0,  max: null,  resultText: 'Severe metabolic alkalosis',  resultTextKo: '심한 대사성 알칼리증', isAbnormal: true, severity: 'moderate' },
      ],
      cat: [
        { min: null,  max: 12.0,  resultText: 'Severe metabolic acidosis',   resultTextKo: '심한 대사성 산증',  isAbnormal: true,  severity: 'critical'  },
        { min: 12.0,  max: 18.0,  resultText: 'Metabolic acidosis',          resultTextKo: '대사성 산증',       isAbnormal: true,  severity: 'moderate'  },
        { min: 18.0,  max: 23.0,  resultText: 'Normal',                      resultTextKo: '정상',              isAbnormal: false                        },
        { min: 23.0,  max: 30.0,  resultText: 'Metabolic alkalosis',         resultTextKo: '대사성 알칼리증',   isAbnormal: true,  severity: 'mild'      },
        { min: 30.0,  max: null,  resultText: 'Severe metabolic alkalosis',  resultTextKo: '심한 대사성 알칼리증', isAbnormal: true, severity: 'moderate' },
      ],
    },
    comment: {
      increase: '대사성 알칼리증: 구토, 이뇨제, 호흡성 산증 보상',
      decrease: '대사성 산증: DKA, 신부전, 설사, 쇼크. HCO₃⁻ ≈ tCO₂ - 1 관계',
      normal: '혈청화학 패널에서 간접 측정. 정확한 산염기 평가에는 전혈가스 측정 병용 권장',
    },
    aiExtractKeywords: ['tCO2', 'TCO2', 'total CO2', 'total carbon dioxide', '총 이산화탄소'],
  },

  // ── SpO2 ───────────────────────────────────────────────────
  {
    id: 'spo2',
    nameKo: '산소포화도 (SpO₂)',
    nameEn: 'SpO2',
    unit: '%',
    section: ['blood_gas'],
    testType: 'range',
    descriptionKo: '맥박 산소측정기로 비침습적으로 측정한 혈중 산소포화도입니다. 헤모글로빈이 산소를 얼마나 싣고 있는지를 나타내며, 95% 이상이 정상입니다.',
    foldProfile: 'electrolyte',
    defaultRefRange: { common: '>95%' },
    ranges: {
      common: [
        { min: null,  max: 85.0,  resultText: 'Severe hypoxemia — immediate O₂ therapy', resultTextKo: '심한 저산소혈증 — 즉각 처치 필요', isAbnormal: true, severity: 'critical' },
        { min: 85.0,  max: 90.0,  resultText: 'Significant hypoxemia',                   resultTextKo: '중등도 저산소혈증',                 isAbnormal: true, severity: 'high'    },
        { min: 90.0,  max: 95.0,  resultText: 'Mild hypoxemia',                           resultTextKo: '경도 저산소혈증',                   isAbnormal: true, severity: 'mild'    },
        { min: 95.0,  max: 100.0, resultText: 'Normal',                                   resultTextKo: '정상',                              isAbnormal: false                     },
      ],
    },
    comment: {
      increase: '임상적 의의 없음 (100% 상한)',
      decrease: '저산소혈증: 호흡기 질환, 빈혈, 저관류, 마취 합병증. SpO₂ <90% → 즉각 산소 공급 필요',
      normal: '말초 관류 저하·색소침착·움직임·빈혈 시 위양성/위음성 주의. pO₂ 측정으로 확인 권장',
    },
    aiExtractKeywords: ['SpO2', 'SpO₂', 'oxygen saturation', 'pulse oximetry', '산소포화도'],
  },

  // ── Lactate ────────────────────────────────────────────────
  {
    id: 'lactate',
    nameKo: '젖산 (Lactate)',
    nameEn: 'Lactate',
    unit: 'mmol/L',
    section: ['blood_gas', 'special'],
    testType: 'range',
    foldProfile: 'enzyme',
    descriptionKo: '조직에 산소가 부족할 때 세포가 무산소 대사를 통해 만들어내는 물질입니다. 수치가 높을수록 쇼크·저관류·조직 저산소가 심각하다는 신호이며, 치료 반응을 추적하는 데 중요합니다.',
    defaultRefRange: { common: '<2.0 mmol/L' },
    ranges: {
      common: [
        { min: null,  max: 2.0,   resultText: 'Normal',                       resultTextKo: '정상',                         isAbnormal: false                        },
        { min: 2.0,   max: 5.0,   resultText: 'Mildly elevated — monitor closely', resultTextKo: '경도 상승 — 주의 관찰',   isAbnormal: true,  severity: 'moderate'  },
        { min: 5.0,   max: 10.0,  resultText: 'Elevated — tissue hypoperfusion',   resultTextKo: '상승 — 조직 저관류',      isAbnormal: true,  severity: 'high'      },
        { min: 10.0,  max: null,  resultText: 'Severely elevated — critical shock', resultTextKo: '심한 상승 — 중증 쇼크', isAbnormal: true,  severity: 'critical'  },
      ],
    },
    comment: {
      increase: '쇼크(저혈량·패혈성·심인성), 조직 저산소, 심한 운동 직후, 간부전(젖산 대사 장애). >5 mmol/L: 예후 불량 지표',
      decrease: '임상적 의의 낮음',
      normal: '채혈 즉시 분석 또는 냉장 보관 필요. 지혈대 사용·발버둥 시 일시적 상승 주의',
    },
    aiExtractKeywords: ['Lactate', '젖산', 'Lactic acid', 'Blood Lactate'],
  },

  // ── Anion Gap ──────────────────────────────────────────────
  {
    id: 'anion_gap',
    nameKo: '음이온 차이 (Anion Gap)',
    nameEn: 'Anion Gap',
    unit: 'mEq/L',
    section: ['blood_gas', 'electrolyte'],
    testType: 'range',
    descriptionKo: '측정되지 않은 음이온의 양을 추정해 대사성 산증의 원인을 분류하는 지표입니다. AG = Na⁺ − (Cl⁻ + HCO₃⁻). 상승하면 젖산·케톤산·독소 등 유기산 축적을 시사합니다.',
    foldProfile: 'electrolyte',
    defaultRefRange: { dog: '12–25 mEq/L', cat: '15–25 mEq/L' },
    ranges: {
      dog: [
        { min: null,  max: 12.0,  resultText: 'Low anion gap',         resultTextKo: '음이온 차이 감소 — 저알부민혈증/과감마글로불린혈증', isAbnormal: true,  severity: 'mild'     },
        { min: 12.0,  max: 25.0,  resultText: 'Normal',                resultTextKo: '정상',                                               isAbnormal: false                       },
        { min: 25.0,  max: 35.0,  resultText: 'Increased anion gap',   resultTextKo: '음이온 차이 증가 — 유기산 축적 의심',                isAbnormal: true,  severity: 'moderate' },
        { min: 35.0,  max: null,  resultText: 'Markedly increased',    resultTextKo: '현저한 증가 — DKA / 젖산산증 / 독소',               isAbnormal: true,  severity: 'high'     },
      ],
      cat: [
        { min: null,  max: 15.0,  resultText: 'Low anion gap',         resultTextKo: '음이온 차이 감소',                                   isAbnormal: true,  severity: 'mild'     },
        { min: 15.0,  max: 25.0,  resultText: 'Normal',                resultTextKo: '정상',                                               isAbnormal: false                       },
        { min: 25.0,  max: 35.0,  resultText: 'Increased anion gap',   resultTextKo: '음이온 차이 증가',                                   isAbnormal: true,  severity: 'moderate' },
        { min: 35.0,  max: null,  resultText: 'Markedly increased',    resultTextKo: '현저한 증가 — DKA / 젖산산증',                       isAbnormal: true,  severity: 'high'     },
      ],
    },
    comment: {
      increase: 'High-AG 대사성 산증: DKA(케톤산), 젖산산증(쇼크), 요독증(유기산), 에틸렌글리콜 중독',
      decrease: '저알부민혈증(주 원인), 과감마글로불린혈증, 과잉 혈장 공급. 알부민 보정 권장: cAG = AG + 3.7×(3.5−alb)',
      normal: 'Na, Cl, HCO₃⁻ 값으로 계산: AG = Na − (Cl + HCO₃). 알부민·인 보정 시 정확도 향상',
    },
    aiExtractKeywords: ['Anion Gap', 'AG', '음이온 차이', 'anion gap'],
  },
]
