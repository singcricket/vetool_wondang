import type { LabRefItem } from './lab-types'

export const labRefCoagulation: LabRefItem[] = [
  // ── PT ─────────────────────────────────────────────────────
  {
    id: 'pt',
    nameKo: '프로트롬빈 시간 (PT)',
    nameEn: 'PT',
    unit: 'sec',
    section: ['coagulation'],
    testType: 'range',
    descriptionKo: '외인성 응고 경로(VII·X·V·II·I 인자)를 평가하는 검사입니다. 간에서 만들어지는 응고 인자들의 기능을 반영하며, 비타민 K 의존성 인자(II·VII·IX·X)가 포함되므로 로덴티사이드 중독·간부전 진단에 중요합니다.',
    foldProfile: 'renal',
    defaultRefRange: { dog: '6–10 sec', cat: '8–13 sec' },
    ranges: {
      dog: [
        { min: null,  max: 6.0,   resultText: 'Shortened PT',                  resultTextKo: '단축 — 과응고 가능성',           isAbnormal: true,  severity: 'mild'     },
        { min: 6.0,   max: 10.0,  resultText: 'Normal',                        resultTextKo: '정상',                           isAbnormal: false                        },
        { min: 10.0,  max: 15.0,  resultText: 'Mildly prolonged PT',           resultTextKo: '경도 연장 — 외인성 경로 이상',   isAbnormal: true,  severity: 'mild'     },
        { min: 15.0,  max: 25.0,  resultText: 'Moderately prolonged PT',       resultTextKo: '중등도 연장',                    isAbnormal: true,  severity: 'moderate' },
        { min: 25.0,  max: null,  resultText: 'Markedly prolonged — bleeding risk', resultTextKo: '현저한 연장 — 출혈 위험',   isAbnormal: true,  severity: 'critical' },
      ],
      cat: [
        { min: null,  max: 8.0,   resultText: 'Shortened PT',                  resultTextKo: '단축',                           isAbnormal: true,  severity: 'mild'     },
        { min: 8.0,   max: 13.0,  resultText: 'Normal',                        resultTextKo: '정상',                           isAbnormal: false                        },
        { min: 13.0,  max: 20.0,  resultText: 'Mildly prolonged PT',           resultTextKo: '경도 연장',                      isAbnormal: true,  severity: 'mild'     },
        { min: 20.0,  max: 30.0,  resultText: 'Moderately prolonged PT',       resultTextKo: '중등도 연장',                    isAbnormal: true,  severity: 'moderate' },
        { min: 30.0,  max: null,  resultText: 'Markedly prolonged — bleeding risk', resultTextKo: '현저한 연장 — 출혈 위험',   isAbnormal: true,  severity: 'critical' },
      ],
    },
    comment: {
      increase: '외인성·공통 경로 이상: 간부전, 비타민 K 결핍/길항(로덴티사이드 중독), DIC, 비타민 K 의존성 인자(II·VII·X) 부족',
      decrease: '과응고 상태: 임상 의의 제한적. 용량 부족, 단축된 샘플 채취 오류 고려',
      normal: '기기·시약에 따라 참고 범위 상이. 동일 기관 내 일관성 중요. PIVKA 병용 시 로덴티사이드 감도 향상',
    },
    aiExtractKeywords: ['PT', 'Prothrombin Time', '프로트롬빈 시간', 'Prothrombin'],
  },

  // ── APTT ───────────────────────────────────────────────────
  {
    id: 'aptt',
    nameKo: '활성화 부분 트롬보플라스틴 시간 (aPTT)',
    nameEn: 'aPTT',
    unit: 'sec',
    section: ['coagulation'],
    testType: 'range',
    descriptionKo: '내인성 응고 경로(XII·XI·IX·VIII·X·V·II·I 인자)를 평가하는 검사입니다. 혈우병 A(VIII 인자 결핍)·B(IX 인자 결핍)와 DIC, 헤파린 치료 모니터링에 활용됩니다.',
    foldProfile: 'renal',
    defaultRefRange: { dog: '10–17 sec', cat: '12–22 sec' },
    ranges: {
      dog: [
        { min: null,  max: 10.0,  resultText: 'Shortened aPTT',               resultTextKo: '단축',                           isAbnormal: true,  severity: 'mild'     },
        { min: 10.0,  max: 17.0,  resultText: 'Normal',                       resultTextKo: '정상',                           isAbnormal: false                        },
        { min: 17.0,  max: 25.0,  resultText: 'Mildly prolonged aPTT',        resultTextKo: '경도 연장 — 내인성 경로 이상',   isAbnormal: true,  severity: 'mild'     },
        { min: 25.0,  max: 40.0,  resultText: 'Moderately prolonged aPTT',    resultTextKo: '중등도 연장',                    isAbnormal: true,  severity: 'moderate' },
        { min: 40.0,  max: null,  resultText: 'Markedly prolonged — bleeding risk', resultTextKo: '현저한 연장 — 출혈 위험', isAbnormal: true,  severity: 'critical' },
      ],
      cat: [
        { min: null,  max: 12.0,  resultText: 'Shortened aPTT',               resultTextKo: '단축',                           isAbnormal: true,  severity: 'mild'     },
        { min: 12.0,  max: 22.0,  resultText: 'Normal',                       resultTextKo: '정상',                           isAbnormal: false                        },
        { min: 22.0,  max: 32.0,  resultText: 'Mildly prolonged aPTT',        resultTextKo: '경도 연장',                      isAbnormal: true,  severity: 'mild'     },
        { min: 32.0,  max: 50.0,  resultText: 'Moderately prolonged aPTT',    resultTextKo: '중등도 연장',                    isAbnormal: true,  severity: 'moderate' },
        { min: 50.0,  max: null,  resultText: 'Markedly prolonged — bleeding risk', resultTextKo: '현저한 연장 — 출혈 위험', isAbnormal: true,  severity: 'critical' },
      ],
    },
    comment: {
      increase: '혈우병 A(VIII)·B(IX), DIC(소모성 응고장애), 헤파린 치료, 폰빌레브란트병(심한 경우), 간부전',
      decrease: '과응고 상태 가능성. 단축된 샘플(채혈 시 조직액 혼입) 배제 필요',
      normal: 'PTT로도 표기. 헤파린 치료 모니터링 시 기준치 1.5–2.5배 목표. APTT 단독 연장: 내인성 경로 특이적 결핍',
    },
    aiExtractKeywords: ['aPTT', 'APTT', 'PTT', 'Activated Partial Thromboplastin Time', '부분 트롬보플라스틴'],
  },

  // ── Fibrinogen ─────────────────────────────────────────────
  {
    id: 'fibrinogen',
    nameKo: '피브리노겐',
    nameEn: 'Fibrinogen',
    unit: 'mg/dL',
    section: ['coagulation'],
    testType: 'range',
    foldProfile: 'enzyme',
    descriptionKo: '응고의 최종 단계에서 피브린으로 변환되는 혈장 단백질입니다. 염증 시 급성기 반응 단백질로 상승하며, DIC나 간부전에서는 소모/합성 저하로 감소합니다.',
    defaultRefRange: { dog: '200–400 mg/dL', cat: '100–300 mg/dL' },
    ranges: {
      dog: [
        { min: null,   max: 100.0,  resultText: 'Critically low — DIC / liver failure', resultTextKo: '심한 감소 — DIC / 간부전',       isAbnormal: true,  severity: 'critical' },
        { min: 100.0,  max: 200.0,  resultText: 'Low fibrinogen',                        resultTextKo: '감소 — 소모성 응고장애',          isAbnormal: true,  severity: 'moderate' },
        { min: 200.0,  max: 400.0,  resultText: 'Normal',                                resultTextKo: '정상',                            isAbnormal: false                        },
        { min: 400.0,  max: 700.0,  resultText: 'Elevated — inflammation / acute phase', resultTextKo: '상승 — 염증·급성기 반응',         isAbnormal: true,  severity: 'mild'     },
        { min: 700.0,  max: null,   resultText: 'Markedly elevated',                     resultTextKo: '현저한 상승 — 심한 염증/응고 항진', isAbnormal: true, severity: 'moderate' },
      ],
      cat: [
        { min: null,   max: 50.0,   resultText: 'Critically low — DIC / liver failure', resultTextKo: '심한 감소 — DIC / 간부전',       isAbnormal: true,  severity: 'critical' },
        { min: 50.0,   max: 100.0,  resultText: 'Low fibrinogen',                        resultTextKo: '감소',                            isAbnormal: true,  severity: 'moderate' },
        { min: 100.0,  max: 300.0,  resultText: 'Normal',                                resultTextKo: '정상',                            isAbnormal: false                        },
        { min: 300.0,  max: 600.0,  resultText: 'Elevated — inflammation / acute phase', resultTextKo: '상승 — 염증·급성기 반응',         isAbnormal: true,  severity: 'mild'     },
        { min: 600.0,  max: null,   resultText: 'Markedly elevated',                     resultTextKo: '현저한 상승',                     isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: '급성기 반응(염증·감염·종양·외상), 고응고 상태. 개: 신생물·면역매개 질환에서도 상승',
      decrease: 'DIC(소모), 간부전(합성 저하), 심한 출혈 후 희석, 선천성 피브리노겐 결핍(드묾)',
    },
    aiExtractKeywords: ['Fibrinogen', '피브리노겐', 'Fibrinogen level'],
  },

  // ── D-dimer ────────────────────────────────────────────────
  {
    id: 'd_dimer',
    nameKo: 'D-이합체 (D-dimer)',
    nameEn: 'D-dimer',
    unit: 'μg/mL FEU',
    section: ['coagulation'],
    testType: 'range',
    foldProfile: 'enzyme',
    descriptionKo: '피브린이 분해될 때 생성되는 산물로 혈전 형성과 분해(섬유소 용해)가 동시에 일어나고 있음을 시사합니다. DIC·혈전색전증·내출혈 스크리닝에 활용되며 민감도는 높으나 특이도는 낮습니다.',
    defaultRefRange: { common: '<0.5 μg/mL FEU' },
    ranges: {
      common: [
        { min: null,  max: 0.5,   resultText: 'Normal',                          resultTextKo: '정상',                              isAbnormal: false                        },
        { min: 0.5,   max: 1.0,   resultText: 'Mildly elevated',                 resultTextKo: '경도 상승 — 혈전·염증 가능성',      isAbnormal: true,  severity: 'mild'     },
        { min: 1.0,   max: 2.0,   resultText: 'Moderately elevated',             resultTextKo: '중등도 상승 — DIC·혈전색전 의심',  isAbnormal: true,  severity: 'moderate' },
        { min: 2.0,   max: null,  resultText: 'Markedly elevated — DIC / thromboembolism likely', resultTextKo: '현저한 상승 — DIC·혈전색전 가능성 높음', isAbnormal: true, severity: 'critical' },
      ],
    },
    comment: {
      increase: 'DIC, 폐혈전색전증(PTE), 심부정맥혈전증, 종양, 면역매개 용혈성 빈혈(IMHA), 외상·수술 후, 간질환',
      decrease: '임상적 의의 없음',
      normal: '민감도 높고 특이도 낮음(음성 예측도 활용). 단독으로 혈전 확진 불가 — 초음파·CT·임상증상 병합 판단',
    },
    aiExtractKeywords: ['D-dimer', 'D dimer', 'D-이합체', 'FDP D-dimer', 'fibrin degradation'],
  },

  // ── FDP ────────────────────────────────────────────────────
  {
    id: 'fdp',
    nameKo: '피브린/피브리노겐 분해산물 (FDP)',
    nameEn: 'FDP',
    unit: 'μg/mL',
    section: ['coagulation'],
    testType: 'range',
    foldProfile: 'enzyme',
    descriptionKo: '피브린과 피브리노겐이 분해될 때 생성되는 산물입니다. D-dimer보다 감도는 낮지만 DIC·혈전증·섬유소 용해 활성화의 간편 지표로 사용됩니다.',
    defaultRefRange: { common: '<10 μg/mL' },
    ranges: {
      common: [
        { min: null,  max: 10.0,  resultText: 'Normal',                       resultTextKo: '정상',                           isAbnormal: false                        },
        { min: 10.0,  max: 20.0,  resultText: 'Mildly elevated',              resultTextKo: '경도 상승',                      isAbnormal: true,  severity: 'mild'     },
        { min: 20.0,  max: 40.0,  resultText: 'Elevated — DIC / fibrinolysis', resultTextKo: '상승 — DIC·섬유소 용해 활성',  isAbnormal: true,  severity: 'moderate' },
        { min: 40.0,  max: null,  resultText: 'Markedly elevated',            resultTextKo: '현저한 상승 — 중증 DIC',         isAbnormal: true,  severity: 'critical' },
      ],
    },
    comment: {
      increase: 'DIC, 혈전증, 간질환(대사 저하), 대규모 혈종, 섬유소 용해 항진',
      decrease: '임상적 의의 없음',
      normal: 'D-dimer와 병용 시 DIC 평가 정확도 향상. 혈청(응고 후) 검체 사용 — 혈장과 구별 필요',
    },
    aiExtractKeywords: ['FDP', 'Fibrin Degradation Products', 'FSP', 'fibrin split products', '피브린 분해산물'],
  },

  // ── Thrombin Time ──────────────────────────────────────────
  {
    id: 'thrombin_time',
    nameKo: '트롬빈 시간 (TT)',
    nameEn: 'Thrombin Time',
    unit: 'sec',
    section: ['coagulation'],
    testType: 'range',
    descriptionKo: '트롬빈이 피브리노겐을 피브린으로 전환하는 속도를 측정합니다. 피브리노겐 이상(양적·질적)이나 헤파린의 영향, FDP 증가 시 연장됩니다.',
    foldProfile: 'renal',
    defaultRefRange: { common: '7–12 sec' },
    ranges: {
      common: [
        { min: null,  max: 7.0,   resultText: 'Shortened TT',               resultTextKo: '단축',                           isAbnormal: true,  severity: 'mild'     },
        { min: 7.0,   max: 12.0,  resultText: 'Normal',                     resultTextKo: '정상',                           isAbnormal: false                        },
        { min: 12.0,  max: 20.0,  resultText: 'Mildly prolonged TT',        resultTextKo: '경도 연장',                      isAbnormal: true,  severity: 'mild'     },
        { min: 20.0,  max: null,  resultText: 'Prolonged — fibrinogen defect / heparin', resultTextKo: '연장 — 피브리노겐 이상·헤파린', isAbnormal: true, severity: 'moderate' },
      ],
    },
    comment: {
      increase: '피브리노겐 감소/기능 이상(이상피브리노겐혈증), 헤파린 오염, FDP 증가(DIC), 아미로이드증',
      decrease: '임상적 의의 낮음',
    },
    aiExtractKeywords: ['TT', 'Thrombin Time', '트롬빈 시간'],
  },

  // ── AT-III ─────────────────────────────────────────────────
  {
    id: 'at3',
    nameKo: '안티트롬빈 III (AT-III)',
    nameEn: 'Antithrombin III',
    unit: '%',
    section: ['coagulation'],
    testType: 'range',
    descriptionKo: '트롬빈을 비롯한 여러 응고 인자를 억제하는 천연 항응고 단백질입니다. 감소하면 혈전 위험이 높아지며, DIC·단백 손실성 장병증·신증후군에서 낮게 측정됩니다.',
    foldProfile: 'cell',
    defaultRefRange: { dog: '80–120%', cat: '75–115%' },
    ranges: {
      dog: [
        { min: null,  max: 50.0,  resultText: 'Critically low AT-III — high thrombosis risk', resultTextKo: '심한 감소 — 혈전 위험 매우 높음', isAbnormal: true, severity: 'critical' },
        { min: 50.0,  max: 80.0,  resultText: 'Low AT-III',                                    resultTextKo: '감소 — 혈전 경향 주의',            isAbnormal: true, severity: 'moderate' },
        { min: 80.0,  max: 120.0, resultText: 'Normal',                                        resultTextKo: '정상',                             isAbnormal: false                       },
        { min: 120.0, max: null,  resultText: 'Elevated AT-III',                               resultTextKo: '상승 — 임상 의의 제한적',           isAbnormal: false                       },
      ],
      cat: [
        { min: null,  max: 50.0,  resultText: 'Critically low AT-III',                         resultTextKo: '심한 감소 — 혈전 위험',             isAbnormal: true, severity: 'critical' },
        { min: 50.0,  max: 75.0,  resultText: 'Low AT-III',                                    resultTextKo: '감소',                              isAbnormal: true, severity: 'moderate' },
        { min: 75.0,  max: 115.0, resultText: 'Normal',                                        resultTextKo: '정상',                              isAbnormal: false                       },
        { min: 115.0, max: null,  resultText: 'Elevated AT-III',                               resultTextKo: '상승',                              isAbnormal: false                       },
      ],
    },
    comment: {
      increase: '임상적 의의 낮음 (항응고제 투여 반응 가능성)',
      decrease: 'DIC(소모), 단백 손실성 장병증·신증후군(소실), 간부전(합성 저하), 헤파린 치료 중(사용 촉진). <70%: 헤파린 치료 효과 감소 — 신선동결혈장(FFP) 보충 고려',
    },
    aiExtractKeywords: ['AT-III', 'ATIII', 'AT3', 'Antithrombin', 'Antithrombin III', '안티트롬빈'],
  },

  // ── vWF ────────────────────────────────────────────────────
  {
    id: 'vwf',
    nameKo: '폰빌레브란트 인자 (vWF)',
    nameEn: 'vWF Antigen',
    unit: '%',
    section: ['coagulation'],
    testType: 'range',
    descriptionKo: '혈소판이 손상된 혈관 벽에 붙을 수 있도록 돕는 단백질로 1차 지혈에 필수적입니다. 도베르만 핀셔, 저먼 셰퍼드 등에서 유전성 결핍이 흔하며, 점상출혈·점막 출혈이 반복될 때 확인합니다.',
    foldProfile: 'cell',
    defaultRefRange: { dog: '70–180%', cat: '참고 범위 미확립' },
    ranges: {
      dog: [
        { min: null,  max: 35.0,  resultText: 'Severe vWD — high bleeding risk', resultTextKo: '심한 결핍 — 폰빌레브란트병 (출혈 위험 높음)', isAbnormal: true, severity: 'critical' },
        { min: 35.0,  max: 50.0,  resultText: 'Moderate vWD',                    resultTextKo: '중등도 결핍',                                  isAbnormal: true, severity: 'high'    },
        { min: 50.0,  max: 70.0,  resultText: 'Borderline low — mild vWD possible', resultTextKo: '경계 저하 — 경미한 vWD 가능성',             isAbnormal: true, severity: 'mild'    },
        { min: 70.0,  max: 180.0, resultText: 'Normal',                           resultTextKo: '정상',                                         isAbnormal: false                     },
        { min: 180.0, max: null,  resultText: 'Elevated — acute phase response',  resultTextKo: '상승 — 급성기 반응·스트레스',                  isAbnormal: false                     },
      ],
    },
    comment: {
      increase: '급성기 반응(스트레스·염증·갑상선 기능 저하증). 저하 시 위음성 가능',
      decrease: '폰빌레브란트병(vWD) — 개에서 가장 흔한 유전성 출혈 질환. 도베르만·스코티시 테리어·쉐틀랜드 쉽독 주의. 저알부민혈증·간질환에서도 감소 가능',
      normal: '갑상선 기능 저하증 동반 시 갑상선 호르몬 보충 후 재검 권장',
    },
    aiExtractKeywords: ['vWF', 'vWD', 'von Willebrand Factor', 'VWF antigen', '폰빌레브란트 인자'],
  },
]
