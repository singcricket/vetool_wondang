import type { LabRefItem } from './lab-types'

export const labRefCbc: LabRefItem[] = [
  // ── WBC ──────────────────────────────────────────────────────
  {
    id: 'wbc',
    nameKo: '백혈구',
    nameEn: 'WBC',
    unit: '×10³/μL',
    section: ['cbc'],
    testType: 'range',
    foldProfile: 'cell',
    defaultRefRange: { dog: '6.0–17.0', cat: '5.5–19.5' },
    ranges: {
      dog: [
        { min: null, max: 3.0,  resultText: 'Severe leukopenia',   resultTextKo: '심한 백혈구감소증', isAbnormal: true,  severity: 'critical' },
        { min: 3.0,  max: 6.0,  resultText: 'Mild leukopenia',     resultTextKo: '경도 백혈구감소증', isAbnormal: true,  severity: 'mild'     },
        { min: 6.0,  max: 17.0, resultText: 'Normal',              resultTextKo: '정상',              isAbnormal: false                       },
        { min: 17.0, max: 25.0, resultText: 'Mild leukocytosis',   resultTextKo: '경도 백혈구증가증', isAbnormal: true,  severity: 'mild'     },
        { min: 25.0, max: 40.0, resultText: 'Moderate leukocytosis', resultTextKo: '중등도 백혈구증가증', isAbnormal: true, severity: 'moderate' },
        { min: 40.0, max: null, resultText: 'Severe leukocytosis', resultTextKo: '심한 백혈구증가증', isAbnormal: true,  severity: 'high'     },
      ],
      cat: [
        { min: null, max: 2.5,  resultText: 'Severe leukopenia',   resultTextKo: '심한 백혈구감소증', isAbnormal: true,  severity: 'critical' },
        { min: 2.5,  max: 5.5,  resultText: 'Mild leukopenia',     resultTextKo: '경도 백혈구감소증', isAbnormal: true,  severity: 'mild'     },
        { min: 5.5,  max: 19.5, resultText: 'Normal',              resultTextKo: '정상',              isAbnormal: false                       },
        { min: 19.5, max: 30.0, resultText: 'Mild leukocytosis',   resultTextKo: '경도 백혈구증가증', isAbnormal: true,  severity: 'mild'     },
        { min: 30.0, max: 50.0, resultText: 'Moderate leukocytosis', resultTextKo: '중등도 백혈구증가증', isAbnormal: true, severity: 'moderate' },
        { min: 50.0, max: null, resultText: 'Severe leukocytosis', resultTextKo: '심한 백혈구증가증', isAbnormal: true,  severity: 'high'     },
      ],
    },
    comment: {
      increase: '감염(세균성), 염증, 스트레스(코르티솔), 종양(백혈병)',
      decrease: '바이러스 감염, 골수억제, 패혈증 초기, 면역매개성 질환',
    },
    aiExtractKeywords: ['WBC', 'White Blood Cell', '백혈구'],
  },

  // ── RBC ──────────────────────────────────────────────────────
  {
    id: 'rbc',
    nameKo: '적혈구',
    nameEn: 'RBC',
    unit: '×10⁶/μL',
    section: ['cbc'],
    testType: 'range',
    foldProfile: 'cell',
    defaultRefRange: { dog: '5.5–8.5', cat: '5.0–10.0' },
    ranges: {
      dog: [
        { min: null, max: 3.5,  resultText: 'Severe erythropenia',   resultTextKo: '심한 적혈구감소증', isAbnormal: true,  severity: 'critical' },
        { min: 3.5,  max: 5.5,  resultText: 'Mild erythropenia',     resultTextKo: '경도 적혈구감소증', isAbnormal: true,  severity: 'mild'     },
        { min: 5.5,  max: 8.5,  resultText: 'Normal',                resultTextKo: '정상',              isAbnormal: false                       },
        { min: 8.5,  max: 10.0, resultText: 'Mild erythrocytosis',   resultTextKo: '경도 적혈구증가증', isAbnormal: true,  severity: 'mild'     },
        { min: 10.0, max: null, resultText: 'Erythrocytosis',        resultTextKo: '적혈구증가증',      isAbnormal: true,  severity: 'moderate' },
      ],
      cat: [
        { min: null, max: 3.0,  resultText: 'Severe erythropenia',   resultTextKo: '심한 적혈구감소증', isAbnormal: true,  severity: 'critical' },
        { min: 3.0,  max: 5.0,  resultText: 'Mild erythropenia',     resultTextKo: '경도 적혈구감소증', isAbnormal: true,  severity: 'mild'     },
        { min: 5.0,  max: 10.0, resultText: 'Normal',                resultTextKo: '정상',              isAbnormal: false                       },
        { min: 10.0, max: 12.0, resultText: 'Mild erythrocytosis',   resultTextKo: '경도 적혈구증가증', isAbnormal: true,  severity: 'mild'     },
        { min: 12.0, max: null, resultText: 'Erythrocytosis',        resultTextKo: '적혈구증가증',      isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: '탈수, 흥분(비장 수축), 적혈구증가증',
      decrease: '빈혈(출혈성/용혈성/재생불량성), 만성질환',
    },
    aiExtractKeywords: ['RBC', 'Red Blood Cell', '적혈구'],
  },

  // ── HGB ──────────────────────────────────────────────────────
  {
    id: 'hgb',
    nameKo: '혈색소',
    nameEn: 'HGB',
    unit: 'g/dL',
    section: ['cbc'],
    testType: 'range',
    foldProfile: 'cell',
    defaultRefRange: { dog: '12.0–18.0', cat: '8.0–15.0' },
    ranges: {
      dog: [
        { min: null, max: 7.0,  resultText: 'Severe anemia (hemoglobin)',  resultTextKo: '심한 빈혈(헤모글로빈)', isAbnormal: true,  severity: 'critical' },
        { min: 7.0,  max: 10.0, resultText: 'Moderate anemia',            resultTextKo: '중등도 빈혈',           isAbnormal: true,  severity: 'moderate' },
        { min: 10.0, max: 12.0, resultText: 'Mild anemia',                resultTextKo: '경도 빈혈',             isAbnormal: true,  severity: 'mild'     },
        { min: 12.0, max: 18.0, resultText: 'Normal',                     resultTextKo: '정상',                  isAbnormal: false                       },
        { min: 18.0, max: 22.0, resultText: 'Mild polycythemia',          resultTextKo: '경도 적혈구증가증',     isAbnormal: true,  severity: 'mild'     },
        { min: 22.0, max: null, resultText: 'Polycythemia',               resultTextKo: '적혈구증가증',          isAbnormal: true,  severity: 'moderate' },
      ],
      cat: [
        { min: null, max: 5.0,  resultText: 'Severe anemia (hemoglobin)',  resultTextKo: '심한 빈혈(헤모글로빈)', isAbnormal: true,  severity: 'critical' },
        { min: 5.0,  max: 6.5,  resultText: 'Moderate anemia',            resultTextKo: '중등도 빈혈',           isAbnormal: true,  severity: 'moderate' },
        { min: 6.5,  max: 8.0,  resultText: 'Mild anemia',                resultTextKo: '경도 빈혈',             isAbnormal: true,  severity: 'mild'     },
        { min: 8.0,  max: 15.0, resultText: 'Normal',                     resultTextKo: '정상',                  isAbnormal: false                       },
        { min: 15.0, max: 19.0, resultText: 'Mild polycythemia',          resultTextKo: '경도 적혈구증가증',     isAbnormal: true,  severity: 'mild'     },
        { min: 19.0, max: null, resultText: 'Polycythemia',               resultTextKo: '적혈구증가증',          isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: '탈수, 적혈구증가증',
      decrease: '빈혈 — RBC 감소와 동반 평가',
    },
    aiExtractKeywords: ['HGB', 'HB', 'Hemoglobin', '혈색소', '헤모글로빈'],
  },

  // ── HCT ──────────────────────────────────────────────────────
  {
    id: 'hct',
    nameKo: '적혈구 용적률',
    nameEn: 'HCT',
    unit: '%',
    section: ['cbc'],
    testType: 'range',
    foldProfile: 'cell',
    defaultRefRange: { dog: '37–55', cat: '24–45' },
    ranges: {
      dog: [
        { min: null, max: 20.0, resultText: 'Severe anemia',   resultTextKo: '심한 빈혈',     isAbnormal: true,  severity: 'critical' },
        { min: 20.0, max: 30.0, resultText: 'Moderate anemia', resultTextKo: '중등도 빈혈',   isAbnormal: true,  severity: 'moderate' },
        { min: 30.0, max: 37.0, resultText: 'Mild anemia',     resultTextKo: '경도 빈혈',     isAbnormal: true,  severity: 'mild'     },
        { min: 37.0, max: 55.0, resultText: 'Normal',          resultTextKo: '정상',          isAbnormal: false                       },
        { min: 55.0, max: 65.0, resultText: 'Mild polycythemia', resultTextKo: '경도 적혈구증가증', isAbnormal: true, severity: 'mild' },
        { min: 65.0, max: null, resultText: 'Polycythemia',    resultTextKo: '적혈구증가증',  isAbnormal: true,  severity: 'moderate' },
      ],
      cat: [
        { min: null, max: 14.0, resultText: 'Severe anemia',   resultTextKo: '심한 빈혈',     isAbnormal: true,  severity: 'critical' },
        { min: 14.0, max: 20.0, resultText: 'Moderate anemia', resultTextKo: '중등도 빈혈',   isAbnormal: true,  severity: 'moderate' },
        { min: 20.0, max: 24.0, resultText: 'Mild anemia',     resultTextKo: '경도 빈혈',     isAbnormal: true,  severity: 'mild'     },
        { min: 24.0, max: 45.0, resultText: 'Normal',          resultTextKo: '정상',          isAbnormal: false                       },
        { min: 45.0, max: 55.0, resultText: 'Mild polycythemia', resultTextKo: '경도 적혈구증가증', isAbnormal: true, severity: 'mild' },
        { min: 55.0, max: null, resultText: 'Polycythemia',    resultTextKo: '적혈구증가증',  isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: '탈수, 적혈구증가증',
      decrease: '빈혈 판단의 주요 지표. 37% 미만(개)/24% 미만(고양이) 시 빈혈',
    },
    aiExtractKeywords: ['HCT', 'PCV', 'Hematocrit', '적혈구용적률'],
  },

  // ── MCV ──────────────────────────────────────────────────────
  {
    id: 'mcv',
    nameKo: '평균 적혈구 용적',
    nameEn: 'MCV',
    unit: 'fL',
    section: ['cbc'],
    testType: 'range',
    foldProfile: 'cell',
    defaultRefRange: { dog: '60–77', cat: '39–55' },
    ranges: {
      dog: [
        { min: null, max: 55.0, resultText: 'Microcytosis',      resultTextKo: '소적혈구증',   isAbnormal: true,  severity: 'moderate' },
        { min: 55.0, max: 60.0, resultText: 'Mild microcytosis', resultTextKo: '경도 소적혈구증', isAbnormal: true, severity: 'mild'   },
        { min: 60.0, max: 77.0, resultText: 'Normal',            resultTextKo: '정상',         isAbnormal: false                       },
        { min: 77.0, max: 85.0, resultText: 'Mild macrocytosis', resultTextKo: '경도 대적혈구증', isAbnormal: true, severity: 'mild'   },
        { min: 85.0, max: null, resultText: 'Macrocytosis',      resultTextKo: '대적혈구증',   isAbnormal: true,  severity: 'moderate' },
      ],
      cat: [
        { min: null, max: 34.0, resultText: 'Microcytosis',      resultTextKo: '소적혈구증',   isAbnormal: true,  severity: 'moderate' },
        { min: 34.0, max: 39.0, resultText: 'Mild microcytosis', resultTextKo: '경도 소적혈구증', isAbnormal: true, severity: 'mild'   },
        { min: 39.0, max: 55.0, resultText: 'Normal',            resultTextKo: '정상',         isAbnormal: false                       },
        { min: 55.0, max: 62.0, resultText: 'Mild macrocytosis', resultTextKo: '경도 대적혈구증', isAbnormal: true, severity: 'mild'   },
        { min: 62.0, max: null, resultText: 'Macrocytosis',      resultTextKo: '대적혈구증',   isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: '대적혈구증(재생성 빈혈, 엽산/B12 결핍, 간질환)',
      decrease: '소적혈구증(철결핍성 빈혈, 만성염증)',
    },
    aiExtractKeywords: ['MCV', 'Mean Corpuscular Volume'],
  },

  // ── MCH ──────────────────────────────────────────────────────
  {
    id: 'mch',
    nameKo: '평균 적혈구 혈색소',
    nameEn: 'MCH',
    unit: 'pg',
    section: ['cbc'],
    testType: 'range',
    foldProfile: 'cell',
    defaultRefRange: { dog: '19.5–24.5', cat: '12.5–17.5' },
    ranges: {
      dog: [
        { min: null, max: 16.0, resultText: 'Severe hypochromia',   resultTextKo: '심한 저색소증', isAbnormal: true,  severity: 'moderate' },
        { min: 16.0, max: 19.5, resultText: 'Mild hypochromia',     resultTextKo: '경도 저색소증', isAbnormal: true,  severity: 'mild'     },
        { min: 19.5, max: 24.5, resultText: 'Normal',               resultTextKo: '정상',          isAbnormal: false                       },
        { min: 24.5, max: 28.0, resultText: 'Mild hyperchromia',    resultTextKo: '경도 고색소증', isAbnormal: true,  severity: 'mild'     },
        { min: 28.0, max: null, resultText: 'Hyperchromia',         resultTextKo: '고색소증',      isAbnormal: true,  severity: 'moderate' },
      ],
      cat: [
        { min: null, max: 10.0, resultText: 'Severe hypochromia',   resultTextKo: '심한 저색소증', isAbnormal: true,  severity: 'moderate' },
        { min: 10.0, max: 12.5, resultText: 'Mild hypochromia',     resultTextKo: '경도 저색소증', isAbnormal: true,  severity: 'mild'     },
        { min: 12.5, max: 17.5, resultText: 'Normal',               resultTextKo: '정상',          isAbnormal: false                       },
        { min: 17.5, max: 21.0, resultText: 'Mild hyperchromia',    resultTextKo: '경도 고색소증', isAbnormal: true,  severity: 'mild'     },
        { min: 21.0, max: null, resultText: 'Hyperchromia',         resultTextKo: '고색소증',      isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: '대구성 빈혈, 용혈',
      decrease: '철결핍성 빈혈, 만성출혈',
    },
    aiExtractKeywords: ['MCH', 'Mean Corpuscular Hemoglobin'],
  },

  // ── MCHC ──────────────────────────────────────────────────────
  {
    id: 'mchc',
    nameKo: '평균 적혈구 혈색소 농도',
    nameEn: 'MCHC',
    unit: 'g/dL',
    section: ['cbc'],
    testType: 'range',
    foldProfile: 'cell',
    defaultRefRange: { dog: '32–36', cat: '30–36' },
    ranges: {
      dog: [
        { min: null, max: 28.0, resultText: 'Severe hypochromia (MCHC)', resultTextKo: '심한 저색소증(MCHC)', isAbnormal: true,  severity: 'moderate' },
        { min: 28.0, max: 32.0, resultText: 'Mild hypochromia (MCHC)',   resultTextKo: '경도 저색소증(MCHC)', isAbnormal: true,  severity: 'mild'     },
        { min: 32.0, max: 36.0, resultText: 'Normal',                    resultTextKo: '정상',                isAbnormal: false                       },
        { min: 36.0, max: 38.0, resultText: 'Mild hyperchromia (MCHC)', resultTextKo: '경도 고색소증(MCHC)', isAbnormal: true,  severity: 'mild'     },
        { min: 38.0, max: null, resultText: 'Hyperchromia / Hemolysis',  resultTextKo: '고색소증/용혈 의심', isAbnormal: true,  severity: 'high'     },
      ],
      cat: [
        { min: null, max: 26.0, resultText: 'Severe hypochromia (MCHC)', resultTextKo: '심한 저색소증(MCHC)', isAbnormal: true,  severity: 'moderate' },
        { min: 26.0, max: 30.0, resultText: 'Mild hypochromia (MCHC)',   resultTextKo: '경도 저색소증(MCHC)', isAbnormal: true,  severity: 'mild'     },
        { min: 30.0, max: 36.0, resultText: 'Normal',                    resultTextKo: '정상',                isAbnormal: false                       },
        { min: 36.0, max: 38.0, resultText: 'Mild hyperchromia (MCHC)', resultTextKo: '경도 고색소증(MCHC)', isAbnormal: true,  severity: 'mild'     },
        { min: 38.0, max: null, resultText: 'Hyperchromia / Hemolysis',  resultTextKo: '고색소증/용혈 의심', isAbnormal: true,  severity: 'high'     },
      ],
    },
    comment: {
      increase: '용혈(인공산물 포함), 하인즈소체 빈혈',
      decrease: '철결핍, 만성염증성 빈혈',
    },
    aiExtractKeywords: ['MCHC', 'Mean Corpuscular Hemoglobin Concentration'],
  },

  // ── PLT ──────────────────────────────────────────────────────
  {
    id: 'plt',
    nameKo: '혈소판',
    nameEn: 'PLT',
    unit: '×10³/μL',
    section: ['cbc'],
    testType: 'range',
    foldProfile: 'cell',
    defaultRefRange: { dog: '200–500', cat: '300–800' },
    ranges: {
      dog: [
        { min: null, max: 50.0,  resultText: 'Severe thrombocytopenia',    resultTextKo: '심한 혈소판감소증',   isAbnormal: true,  severity: 'critical' },
        { min: 50.0,  max: 100.0, resultText: 'Moderate thrombocytopenia', resultTextKo: '중등도 혈소판감소증', isAbnormal: true,  severity: 'high'     },
        { min: 100.0, max: 200.0, resultText: 'Mild thrombocytopenia',     resultTextKo: '경도 혈소판감소증',   isAbnormal: true,  severity: 'mild'     },
        { min: 200.0, max: 500.0, resultText: 'Normal',                    resultTextKo: '정상',                isAbnormal: false                       },
        { min: 500.0, max: 800.0, resultText: 'Mild thrombocytosis',       resultTextKo: '경도 혈소판증가증',   isAbnormal: true,  severity: 'mild'     },
        { min: 800.0, max: null,  resultText: 'Thrombocytosis',            resultTextKo: '혈소판증가증',        isAbnormal: true,  severity: 'moderate' },
      ],
      cat: [
        { min: null,  max: 75.0,  resultText: 'Severe thrombocytopenia',    resultTextKo: '심한 혈소판감소증',   isAbnormal: true,  severity: 'critical' },
        { min: 75.0,  max: 150.0, resultText: 'Moderate thrombocytopenia',  resultTextKo: '중등도 혈소판감소증', isAbnormal: true,  severity: 'high'     },
        { min: 150.0, max: 300.0, resultText: 'Mild thrombocytopenia',      resultTextKo: '경도 혈소판감소증',   isAbnormal: true,  severity: 'mild'     },
        { min: 300.0, max: 800.0, resultText: 'Normal',                     resultTextKo: '정상',                isAbnormal: false                       },
        { min: 800.0, max: 1200.0, resultText: 'Mild thrombocytosis',       resultTextKo: '경도 혈소판증가증',   isAbnormal: true,  severity: 'mild'     },
        { min: 1200.0, max: null, resultText: 'Thrombocytosis',             resultTextKo: '혈소판증가증',        isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: '염증, 철결핍, 비장절제 후, 반응성 혈소판증가증',
      decrease: '면역매개성혈소판감소증(ITP), DIC, 감염, 골수억제 → 출혈 위험',
    },
    aiExtractKeywords: ['PLT', 'Platelet', '혈소판', 'Thrombocyte'],
  },

  // ── Neutrophil ───────────────────────────────────────────────
  {
    id: 'neutrophil',
    nameKo: '호중구',
    nameEn: 'Neutrophil',
    unit: '×10³/μL',
    section: ['cbc'],
    testType: 'range',
    foldProfile: 'cell',
    defaultRefRange: { dog: '3.0–11.5', cat: '2.5–12.5' },
    ranges: {
      dog: [
        { min: null, max: 1.0,  resultText: 'Severe neutropenia',    resultTextKo: '심한 호중구감소증',   isAbnormal: true,  severity: 'critical' },
        { min: 1.0,  max: 3.0,  resultText: 'Mild neutropenia',      resultTextKo: '경도 호중구감소증',   isAbnormal: true,  severity: 'moderate' },
        { min: 3.0,  max: 11.5, resultText: 'Normal',                resultTextKo: '정상',                isAbnormal: false                       },
        { min: 11.5, max: 20.0, resultText: 'Mild neutrophilia',     resultTextKo: '경도 호중구증가증',   isAbnormal: true,  severity: 'mild'     },
        { min: 20.0, max: 35.0, resultText: 'Moderate neutrophilia', resultTextKo: '중등도 호중구증가증', isAbnormal: true,  severity: 'moderate' },
        { min: 35.0, max: null, resultText: 'Severe neutrophilia',   resultTextKo: '심한 호중구증가증',   isAbnormal: true,  severity: 'high'     },
      ],
      cat: [
        { min: null, max: 1.0,  resultText: 'Severe neutropenia',    resultTextKo: '심한 호중구감소증',   isAbnormal: true,  severity: 'critical' },
        { min: 1.0,  max: 2.5,  resultText: 'Mild neutropenia',      resultTextKo: '경도 호중구감소증',   isAbnormal: true,  severity: 'moderate' },
        { min: 2.5,  max: 12.5, resultText: 'Normal',                resultTextKo: '정상',                isAbnormal: false                       },
        { min: 12.5, max: 22.0, resultText: 'Mild neutrophilia',     resultTextKo: '경도 호중구증가증',   isAbnormal: true,  severity: 'mild'     },
        { min: 22.0, max: 40.0, resultText: 'Moderate neutrophilia', resultTextKo: '중등도 호중구증가증', isAbnormal: true,  severity: 'moderate' },
        { min: 40.0, max: null, resultText: 'Severe neutrophilia',   resultTextKo: '심한 호중구증가증',   isAbnormal: true,  severity: 'high'     },
      ],
    },
    comment: {
      increase: '세균감염, 염증, 스트레스, 코르티코스테로이드 반응',
      decrease: '바이러스 감염, 골수억제, 중증 세균감염(소모)',
    },
    aiExtractKeywords: ['Neutrophil', 'NEUT', '호중구', 'Seg', 'Band'],
  },

  // ── Lymphocyte ───────────────────────────────────────────────
  {
    id: 'lymphocyte',
    nameKo: '림프구',
    nameEn: 'Lymphocyte',
    unit: '×10³/μL',
    section: ['cbc'],
    testType: 'range',
    foldProfile: 'cell',
    defaultRefRange: { dog: '1.0–4.8', cat: '1.5–7.0' },
    ranges: {
      dog: [
        { min: null, max: 0.5,  resultText: 'Severe lymphopenia',    resultTextKo: '심한 림프구감소증',   isAbnormal: true,  severity: 'high'     },
        { min: 0.5,  max: 1.0,  resultText: 'Mild lymphopenia',      resultTextKo: '경도 림프구감소증',   isAbnormal: true,  severity: 'mild'     },
        { min: 1.0,  max: 4.8,  resultText: 'Normal',                resultTextKo: '정상',                isAbnormal: false                       },
        { min: 4.8,  max: 7.5,  resultText: 'Mild lymphocytosis',    resultTextKo: '경도 림프구증가증',   isAbnormal: true,  severity: 'mild'     },
        { min: 7.5,  max: 12.0, resultText: 'Moderate lymphocytosis',resultTextKo: '중등도 림프구증가증', isAbnormal: true,  severity: 'moderate' },
        { min: 12.0, max: null, resultText: 'Severe lymphocytosis',  resultTextKo: '심한 림프구증가증',   isAbnormal: true,  severity: 'high'     },
      ],
      cat: [
        { min: null, max: 0.5,  resultText: 'Severe lymphopenia',    resultTextKo: '심한 림프구감소증',   isAbnormal: true,  severity: 'high'     },
        { min: 0.5,  max: 1.5,  resultText: 'Mild lymphopenia',      resultTextKo: '경도 림프구감소증',   isAbnormal: true,  severity: 'mild'     },
        { min: 1.5,  max: 7.0,  resultText: 'Normal',                resultTextKo: '정상',                isAbnormal: false                       },
        { min: 7.0,  max: 12.0, resultText: 'Mild lymphocytosis',    resultTextKo: '경도 림프구증가증',   isAbnormal: true,  severity: 'mild'     },
        { min: 12.0, max: 20.0, resultText: 'Moderate lymphocytosis',resultTextKo: '중등도 림프구증가증', isAbnormal: true,  severity: 'moderate' },
        { min: 20.0, max: null, resultText: 'Severe lymphocytosis',  resultTextKo: '심한 림프구증가증',   isAbnormal: true,  severity: 'high'     },
      ],
    },
    comment: {
      increase: '만성염증, 림프종, 바이러스 감염 회복기, 부신기능저하증',
      decrease: '스트레스(코르티솔), 바이러스 감염 급성기, 면역억제',
    },
    aiExtractKeywords: ['Lymphocyte', 'LYMP', '림프구'],
  },

  // ── Monocyte ─────────────────────────────────────────────────
  {
    id: 'monocyte',
    nameKo: '단핵구',
    nameEn: 'Monocyte',
    unit: '×10³/μL',
    section: ['cbc'],
    testType: 'range',
    foldProfile: 'cell',
    defaultRefRange: { dog: '0.15–1.35', cat: '0–0.85' },
    ranges: {
      dog: [
        { min: null, max: 0.15, resultText: 'Low monocyte',      resultTextKo: '단핵구 감소',       isAbnormal: true,  severity: 'mild'     },
        { min: 0.15, max: 1.35, resultText: 'Normal',            resultTextKo: '정상',              isAbnormal: false                       },
        { min: 1.35, max: 2.5,  resultText: 'Mild monocytosis',  resultTextKo: '경도 단핵구증가증', isAbnormal: true,  severity: 'mild'     },
        { min: 2.5,  max: null, resultText: 'Monocytosis',       resultTextKo: '단핵구증가증',      isAbnormal: true,  severity: 'moderate' },
      ],
      cat: [
        { min: null, max: 0.0,  resultText: 'Low monocyte',      resultTextKo: '단핵구 감소',       isAbnormal: true,  severity: 'mild'     },
        { min: 0.0,  max: 0.85, resultText: 'Normal',            resultTextKo: '정상',              isAbnormal: false                       },
        { min: 0.85, max: 1.5,  resultText: 'Mild monocytosis',  resultTextKo: '경도 단핵구증가증', isAbnormal: true,  severity: 'mild'     },
        { min: 1.5,  max: null, resultText: 'Monocytosis',       resultTextKo: '단핵구증가증',      isAbnormal: true,  severity: 'moderate' },
      ],
    },
    comment: {
      increase: '만성염증, 육아종성 질환, 코르티코스테로이드',
      decrease: '임상적 의의 낮음',
    },
    aiExtractKeywords: ['Monocyte', 'MONO', '단핵구'],
  },

  // ── Eosinophil ───────────────────────────────────────────────
  {
    id: 'eosinophil',
    nameKo: '호산구',
    nameEn: 'Eosinophil',
    unit: '×10³/μL',
    section: ['cbc'],
    testType: 'range',
    foldProfile: 'cell',
    defaultRefRange: { dog: '0.1–1.25', cat: '0–0.75' },
    ranges: {
      dog: [
        { min: null, max: 0.1,  resultText: 'Low eosinophil',        resultTextKo: '호산구 감소',       isAbnormal: true,  severity: 'mild'     },
        { min: 0.1,  max: 1.25, resultText: 'Normal',                resultTextKo: '정상',              isAbnormal: false                       },
        { min: 1.25, max: 2.5,  resultText: 'Mild eosinophilia',     resultTextKo: '경도 호산구증가증', isAbnormal: true,  severity: 'mild'     },
        { min: 2.5,  max: 5.0,  resultText: 'Moderate eosinophilia', resultTextKo: '중등도 호산구증가증', isAbnormal: true, severity: 'moderate' },
        { min: 5.0,  max: null, resultText: 'Severe eosinophilia',   resultTextKo: '심한 호산구증가증', isAbnormal: true,  severity: 'high'     },
      ],
      cat: [
        { min: null, max: 0.0,  resultText: 'Low eosinophil',        resultTextKo: '호산구 감소',       isAbnormal: true,  severity: 'mild'     },
        { min: 0.0,  max: 0.75, resultText: 'Normal',                resultTextKo: '정상',              isAbnormal: false                       },
        { min: 0.75, max: 2.0,  resultText: 'Mild eosinophilia',     resultTextKo: '경도 호산구증가증', isAbnormal: true,  severity: 'mild'     },
        { min: 2.0,  max: 4.0,  resultText: 'Moderate eosinophilia', resultTextKo: '중등도 호산구증가증', isAbnormal: true, severity: 'moderate' },
        { min: 4.0,  max: null, resultText: 'Severe eosinophilia',   resultTextKo: '심한 호산구증가증', isAbnormal: true,  severity: 'high'     },
      ],
    },
    comment: {
      increase: '기생충 감염, 알레르기, 호산구성 질환(고양이), 비만세포종',
      decrease: '급성 스트레스, 코르티코스테로이드',
    },
    aiExtractKeywords: ['Eosinophil', 'EOS', '호산구'],
  },

  // ── Reticulocyte ─────────────────────────────────────────────
  {
    id: 'reticulocyte',
    nameKo: '망상적혈구',
    nameEn: 'Reticulocyte',
    unit: '%',
    section: ['cbc'],
    testType: 'range',
    foldProfile: 'cell',
    defaultRefRange: { dog: '0–1.5', cat: '0–0.4 (집계형)' },
    ranges: {
      dog: [
        { min: null, max: 0.0,  resultText: 'Absent reticulocytes',        resultTextKo: '망상적혈구 결핍', isAbnormal: true,  severity: 'moderate' },
        { min: 0.0,  max: 1.5,  resultText: 'Normal',                      resultTextKo: '정상',            isAbnormal: false                       },
        { min: 1.5,  max: 4.0,  resultText: 'Mild reticulocytosis',        resultTextKo: '경도 망상적혈구증가증', isAbnormal: true, severity: 'mild' },
        { min: 4.0,  max: null, resultText: 'Marked reticulocytosis',      resultTextKo: '현저한 망상적혈구증가증', isAbnormal: true, severity: 'moderate' },
      ],
      cat: [
        { min: null, max: 0.0,  resultText: 'Absent reticulocytes',        resultTextKo: '망상적혈구 결핍', isAbnormal: true,  severity: 'moderate' },
        { min: 0.0,  max: 0.4,  resultText: 'Normal',                      resultTextKo: '정상',            isAbnormal: false                       },
        { min: 0.4,  max: 1.0,  resultText: 'Mild reticulocytosis',        resultTextKo: '경도 망상적혈구증가증', isAbnormal: true, severity: 'mild' },
        { min: 1.0,  max: null, resultText: 'Marked reticulocytosis',      resultTextKo: '현저한 망상적혈구증가증', isAbnormal: true, severity: 'moderate' },
      ],
    },
    comment: {
      increase: '재생성 빈혈(출혈/용혈 후 골수 반응) — 빈혈 원인 감별에 중요',
      decrease: '비재생성 빈혈(만성질환, 골수기능저하, 철결핍 초기)',
    },
    aiExtractKeywords: ['Reticulocyte', 'RETIC', '망상적혈구'],
  },
]
