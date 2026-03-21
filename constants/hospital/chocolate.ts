// Theobromine content per gram of chocolate
// Sources: Merck Veterinary Manual, ASPCA Animal Poison Control Center
export const CHOCOLATE_TYPES = [
  {
    value: 'white',
    label: '화이트 초콜릿',
    theobrominePerGram: 0.25,
  },
  {
    value: 'milk',
    label: '밀크 초콜릿',
    theobrominePerGram: 2.4,
  },
  {
    value: 'dark-light',
    label: '다크 초콜릿 (50~60%)',
    theobrominePerGram: 5.4,
  },
  {
    value: 'dark',
    label: '다크 초콜릿 (60~70%)',
    theobrominePerGram: 7.5,
  },
  {
    value: 'bittersweet',
    label: '비터스윗 / 세미스윗',
    theobrominePerGram: 15,
  },
  {
    value: 'bakers',
    label: '베이킹 초콜릿 (무가당)',
    theobrominePerGram: 16,
  },
  {
    value: 'cocoa-powder',
    label: '코코아 파우더',
    theobrominePerGram: 28,
  },
] as const

// Toxicity thresholds based on theobromine dose (mg/kg)
// Mild GI signs: ≥ 20 mg/kg
// Cardiovascular signs: ≥ 40 mg/kg
// Neurological signs (seizures): ≥ 60 mg/kg
// Potentially fatal: ≥ 100 mg/kg
export type ToxicityLevel =
  | 'minimal'
  | 'mild'
  | 'moderate'
  | 'severe'
  | 'critical'

export function getToxicityLevel(theobrominePerKg: number): ToxicityLevel {
  if (theobrominePerKg < 20) return 'minimal'
  if (theobrominePerKg < 40) return 'mild'
  if (theobrominePerKg < 60) return 'moderate'
  if (theobrominePerKg < 100) return 'severe'
  return 'critical'
}

export const TOXICITY_INFO: Record<
  ToxicityLevel,
  {
    label: string
    symptoms: string
    action: string
    color: string
  }
> = {
  minimal: {
    label: '최소 위험 (< 20 mg/kg)',
    symptoms:
      '임상 증상 발현 가능성 낮음. 일시적 소화기 증상(구토, 설사)이 산발적으로 발현될 수 있으나 자연 회복 예상.',
    action: '12~24시간 임상 경과 관찰. 수분 공급 유지. 증상 발현 시 재평가.',
    color: '#38b67e',
  },
  mild: {
    label: '경도 독성 (20~40 mg/kg)',
    symptoms:
      '소화기 증상(구토, 설사, 다뇨, 다음증) 발현 예상. 전해질 불균형 가능성 있음.',
    action:
      '섭취 후 2시간 이내 시 유도 구토 고려. 활성탄(1~2 g/kg PO) 투여. 수액 치료 및 전해질 모니터링.',
    color: '#7bb551',
  },
  moderate: {
    label: '중등도 독성 (40~60 mg/kg)',
    symptoms:
      '심혈관계 이상(빈맥, 부정맥, 고혈압) 발현 가능. ECG 모니터링 요함.',
    action:
      '즉각 입원 치료 필요. 활성탄(1~2 g/kg PO) 투여, ECG 및 혈압 지속 모니터링. 항부정맥제 투여 고려.',
    color: '#c7b320',
  },
  severe: {
    label: '중증 독성 (60~100 mg/kg)',
    symptoms:
      '신경계 증상(진전, 경련, 과호흡) 및 중증 심혈관계 이상 가능. 즉각적 처치 요함.',
    action:
      '즉각 입원 및 집중 치료. 항경련제 대기. 집중 ECG 모니터링, 지지 치료 시행.',
    color: '#ee8f22',
  },
  critical: {
    label: '치명적 독성 (> 100 mg/kg)',
    symptoms:
      'LD50 근접 용량. 심폐 부전, 혼수, 사망 가능. 즉각적 응급 처치 요함.',
    action: '즉각적 응급 처치 요함. CPCR 대기, ICU 입원, 예후 주의.',
    color: '#f2524f',
  },
}
