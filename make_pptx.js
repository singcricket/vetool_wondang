const PptxGenJS = require('pptxgenjs')

const pptx = new PptxGenJS()

// ── 공통 색상 ──────────────────────────────────────────────
const C = {
  primary:   '1B4F72', // 딥 네이비
  accent:    '2E86C1', // 밝은 파랑
  light:     'D6EAF8', // 연한 파랑 배경
  white:     'FFFFFF',
  dark:      '1C2833',
  gray:      '717D7E',
  highlight: 'F39C12', // 골드 강조
  green:     '1E8449',
  red:       'C0392B',
}

pptx.layout = 'LAYOUT_WIDE' // 16:9

// ────────────────────────────────────────────────────────────
// 슬라이드 1 – 표지
// ────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide()

  // 배경 전체 채우기
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: '100%',
    fill: { color: C.primary },
  })

  // 오른쪽 포인트 장식
  slide.addShape(pptx.ShapeType.rect, {
    x: 8.5, y: 0, w: 0.5, h: '100%',
    fill: { color: C.highlight },
  })

  // 로고/타이틀
  slide.addText('🐾 VETOOL', {
    x: 0.7, y: 1.2, w: 7.5, h: 1.0,
    fontSize: 52, bold: true, color: C.white,
    fontFace: 'Arial',
  })

  slide.addText('수의사를 위한\n올인원 디지털 차트 플랫폼', {
    x: 0.7, y: 2.4, w: 7.5, h: 1.4,
    fontSize: 28, color: C.light,
    fontFace: 'Arial',
  })

  slide.addShape(pptx.ShapeType.line, {
    x: 0.7, y: 3.9, w: 5.5, h: 0,
    line: { color: C.highlight, width: 3 },
  })

  slide.addText('동물병원 원장 · 수의사를 위한 소개 자료', {
    x: 0.7, y: 4.2, w: 7, h: 0.5,
    fontSize: 16, color: C.gray,
    fontFace: 'Arial',
  })

  slide.addText('2026', {
    x: 0.7, y: 5.1, w: 2, h: 0.4,
    fontSize: 14, color: C.gray,
    fontFace: 'Arial',
  })
}

// ────────────────────────────────────────────────────────────
// 슬라이드 2 – 이런 문제, 겪고 계신가요?
// ────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide()

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1.0,
    fill: { color: C.primary },
  })
  slide.addText('이런 문제, 겪고 계신가요?', {
    x: 0.5, y: 0.15, w: 8.5, h: 0.7,
    fontSize: 26, bold: true, color: C.white,
  })

  const problems = [
    { icon: '📝', text: '손으로 입원 차트를 작성하느라\n매일 수십 분을 낭비한다', x: 0.4 },
    { icon: '🔍', text: '환자 과거 기록을 찾는 데\n시간이 너무 오래 걸린다', x: 3.3 },
    { icon: '📊', text: '전문 차트(심초·안과·치과 등)가\n별도 시스템에 없어 불편하다', x: 6.2 },
  ]

  problems.forEach(({ icon, text, x }) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.3, w: 2.7, h: 2.5,
      fill: { color: C.light },
      line: { color: C.accent, width: 1.5 },
      rectRadius: 0.1,
    })
    slide.addText(icon, { x, y: 1.5, w: 2.7, h: 0.7, fontSize: 36, align: 'center' })
    slide.addText(text, {
      x, y: 2.2, w: 2.7, h: 1.5,
      fontSize: 14, align: 'center', color: C.dark, valign: 'top',
    })
  })

  const problems2 = [
    { icon: '📡', text: '퇴근 후 입원 환자 상태를\n실시간으로 확인하기 어렵다', x: 0.4 },
    { icon: '💊', text: 'CRI 약물 계산, 사료량 계산을\n매번 수기로 해야 한다', x: 3.3 },
    { icon: '📁', text: '차트 데이터를 분석하거나\n통계로 활용하기 어렵다', x: 6.2 },
  ]

  problems2.forEach(({ icon, text, x }) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 4.0, w: 2.7, h: 2.3,
      fill: { color: C.light },
      line: { color: C.accent, width: 1.5 },
      rectRadius: 0.1,
    })
    slide.addText(icon, { x, y: 4.15, w: 2.7, h: 0.7, fontSize: 30, align: 'center' })
    slide.addText(text, {
      x, y: 4.85, w: 2.7, h: 1.3,
      fontSize: 13, align: 'center', color: C.dark, valign: 'top',
    })
  })
}

// ────────────────────────────────────────────────────────────
// 슬라이드 3 – VETOOL 소개
// ────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide()

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1.0,
    fill: { color: C.primary },
  })
  slide.addText('VETOOL이란?', {
    x: 0.5, y: 0.15, w: 8.5, h: 0.7,
    fontSize: 26, bold: true, color: C.white,
  })

  // 좌측 소개
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.3, y: 1.2, w: 4.0, h: 5.5,
    fill: { color: C.light },
    line: { color: C.accent, width: 1 },
  })
  slide.addText('수의사가 만든\n수의사를 위한 차트 프로그램', {
    x: 0.5, y: 1.4, w: 3.6, h: 1.2,
    fontSize: 18, bold: true, color: C.primary, align: 'center',
  })
  slide.addShape(pptx.ShapeType.line, {
    x: 0.7, y: 2.65, w: 3.2, h: 0,
    line: { color: C.accent, width: 1.5 },
  })
  const desc = [
    '• 종이 차트를 100% 디지털로 전환',
    '• 입원차트부터 전문과 차트까지 통합',
    '• 언제 어디서나 접근 가능한 클라우드 기반',
    '• AI 기술이 접목된 스마트 차트',
    '• 수의사·간호사 역할별 권한 관리',
    '• AES-256 암호화로 데이터 완벽 보호',
    '• PDF/이미지 차트 내보내기',
    '• 기존 차트 환자 데이터 마이그레이션 지원',
  ]
  slide.addText(desc.join('\n'), {
    x: 0.5, y: 2.75, w: 3.7, h: 3.7,
    fontSize: 13, color: C.dark, lineSpacingMultiple: 1.3,
  })

  // 우측 숫자 강조
  const stats = [
    { num: '10+', label: '전문 차트 모듈' },
    { num: '3', label: '실제 도입 병원' },
    { num: '24/7', label: '클라우드 실시간 접근' },
    { num: 'AI', label: 'Claude AI 탑재' },
  ]
  stats.forEach((s, i) => {
    const x = i % 2 === 0 ? 4.8 : 7.0
    const y = 1.3 + Math.floor(i / 2) * 2.5
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 2.0, h: 2.0,
      fill: { color: C.primary },
      rectRadius: 0.1,
    })
    slide.addText(s.num, {
      x, y: y + 0.3, w: 2.0, h: 0.9,
      fontSize: 34, bold: true, color: C.highlight, align: 'center',
    })
    slide.addText(s.label, {
      x, y: y + 1.2, w: 2.0, h: 0.6,
      fontSize: 13, color: C.white, align: 'center',
    })
  })
}

// ────────────────────────────────────────────────────────────
// 슬라이드 4 – 핵심 기능 개요
// ────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide()

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1.0,
    fill: { color: C.primary },
  })
  slide.addText('핵심 기능 한눈에 보기', {
    x: 0.5, y: 0.15, w: 8.5, h: 0.7,
    fontSize: 26, bold: true, color: C.white,
  })

  const features = [
    { icon: '🏥', title: '입원차트 (ICU)', desc: '디지털 입원 차트\n차트 복사·템플릿 재사용\n실시간 처치 확인' },
    { icon: '📡', title: '실시간 모니터링', desc: '언제 어디서나\n입원 환자 상태 모니터링\n비정상 바이탈 알림' },
    { icon: '❤️', title: '심장초음파 차트', desc: '측정값 입력 시\n결과값 자동 계산\n수치 기반 정확한 판독' },
    { icon: '🔊', title: '복부초음파 차트', desc: '초음파 소견 체계적 기록\n이미지 첨부 지원\n장기별 구조화 입력' },
    { icon: '🦷', title: '치과 차트', desc: 'Triadan 시스템 기반\n치아별 상세 평가\nAVDC 기준 병기 분류' },
    { icon: '👁️', title: '안과 차트', desc: '안과 검사 항목 표준화\n진단·처치 체계 기록\n전문 소견 구조화' },
    { icon: '🧠', title: '신경계 차트', desc: '신경계 검사 항목\n체계적 평가 및 기록\n전문과 협진 지원' },
    { icon: '🔬', title: '세포학 차트', desc: 'AI 보조 판독\n세포학 소견 기록\n진단 근거 정리' },
    { icon: '🏃', title: '수술차트', desc: '음성인식(STT) 기록\n마취 상태 및 바이탈\n수술 중 기록 자동화' },
    { icon: '📋', title: '건강검진 차트', desc: '검진 결과 자동 분석\n보호자 친화적 결과지\n자동 문장 생성' },
    { icon: '🧮', title: '수의학 계산기', desc: 'CRI 약물 계산\n사료량 계산\n지속적 업데이트' },
    { icon: '📊', title: '데이터 분석', desc: 'DX·CC·약물 통계\n병원 경영 인사이트\n환자 데이터 시각화' },
  ]

  features.forEach((f, i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    const x = 0.2 + col * 2.3
    const y = 1.1 + row * 2.1

    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 2.1, h: 1.9,
      fill: { color: row === 0 ? C.primary : row === 1 ? C.accent : '16A085' },
      rectRadius: 0.08,
    })
    slide.addText(f.icon, { x, y: y + 0.05, w: 2.1, h: 0.5, fontSize: 22, align: 'center' })
    slide.addText(f.title, {
      x, y: y + 0.55, w: 2.1, h: 0.35,
      fontSize: 12, bold: true, color: C.white, align: 'center',
    })
    slide.addText(f.desc, {
      x, y: y + 0.9, w: 2.1, h: 0.9,
      fontSize: 9.5, color: 'D5E8D4', align: 'center', lineSpacingMultiple: 1.2,
    })
  })
}

// ────────────────────────────────────────────────────────────
// 슬라이드 5 – 입원차트 상세
// ────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide()

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1.0,
    fill: { color: C.accent },
  })
  slide.addText('🏥 입원차트 — 핵심 기능 상세', {
    x: 0.5, y: 0.15, w: 8.5, h: 0.7,
    fontSize: 24, bold: true, color: C.white,
  })

  const points = [
    {
      title: '📋 종이 차트 → 디지털 전환',
      body: '수십 년간 손으로 작성하던 입원 차트를 완전히 디지털화합니다.\n처치 누락 없이 체계적으로 관리할 수 있습니다.',
    },
    {
      title: '⚡ 차트 복사 & 템플릿',
      body: '전날 차트를 한 번에 복사하거나, 자주 사용하는 오더를 템플릿으로 저장해\n반복 작업 시간을 획기적으로 줄입니다.',
    },
    {
      title: '🔍 키워드 검색',
      body: 'DX, CC, 상위 키워드, 동의어·유의어 검색을 지원합니다.\n원하는 환자 기록을 수초 만에 찾을 수 있습니다.',
    },
    {
      title: '📤 PDF · 이미지 내보내기',
      body: '입원 단위별 차트를 PDF 또는 이미지 파일로 저장합니다.\n보험 청구, 의뢰서 등에 즉시 활용할 수 있습니다.',
    },
  ]

  points.forEach((p, i) => {
    const x = i % 2 === 0 ? 0.3 : 4.9
    const y = 1.2 + Math.floor(i / 2) * 2.8
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 4.4, h: 2.5,
      fill: { color: C.light },
      line: { color: C.accent, width: 1.5 },
      rectRadius: 0.08,
    })
    slide.addText(p.title, {
      x: x + 0.15, y: y + 0.15, w: 4.1, h: 0.5,
      fontSize: 14, bold: true, color: C.primary,
    })
    slide.addShape(pptx.ShapeType.line, {
      x: x + 0.15, y: y + 0.75, w: 3.8, h: 0,
      line: { color: C.accent, width: 1 },
    })
    slide.addText(p.body, {
      x: x + 0.15, y: y + 0.9, w: 4.1, h: 1.4,
      fontSize: 12.5, color: C.dark, lineSpacingMultiple: 1.4,
    })
  })
}

// ────────────────────────────────────────────────────────────
// 슬라이드 6 – AI & 스마트 기능
// ────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide()

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1.0,
    fill: { color: C.primary },
  })
  slide.addText('🤖 AI & 스마트 기능', {
    x: 0.5, y: 0.15, w: 8.5, h: 0.7,
    fontSize: 26, bold: true, color: C.white,
  })

  // 왼쪽: AI 기능
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.3, y: 1.1, w: 5.0, h: 5.7,
    fill: { color: '1A252F' },
    line: { color: C.highlight, width: 2 },
  })
  slide.addText('Claude AI 탑재', {
    x: 0.5, y: 1.25, w: 4.6, h: 0.5,
    fontSize: 18, bold: true, color: C.highlight, align: 'center',
  })
  const aiFeats = [
    '🔬 세포학 소견 AI 보조 판독',
    '📋 건강검진 결과지 자동 문장 생성',
    '  → 검사 수치 입력만으로 보호자 친화적\n     문장 자동 완성',
    '🎤 수술차트 음성인식(STT) 기록',
    '  → 수술 중 양손이 바쁠 때 음성으로\n     특이사항 기록 가능',
    '📊 데이터 분석 & 인사이트',
    '  → 진단·약물·종·품종 통계 자동 집계',
  ]
  slide.addText(aiFeats.join('\n'), {
    x: 0.5, y: 1.85, w: 4.7, h: 4.5,
    fontSize: 13, color: C.white, lineSpacingMultiple: 1.35,
  })

  // 오른쪽: 보안
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.6, y: 1.1, w: 3.8, h: 2.6,
    fill: { color: C.light },
    line: { color: C.primary, width: 1.5 },
    rectRadius: 0.1,
  })
  slide.addText('🔒 엔터프라이즈급 보안', {
    x: 5.75, y: 1.2, w: 3.5, h: 0.5,
    fontSize: 15, bold: true, color: C.primary,
  })
  slide.addText(
    'AES-256 암호화 표준 적용\n자동 백업 시스템\n세밀한 역할별 접근 제어\n관리자 전용 권한 분리',
    {
      x: 5.75, y: 1.75, w: 3.5, h: 1.8,
      fontSize: 12.5, color: C.dark, lineSpacingMultiple: 1.4,
    }
  )

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.6, y: 3.9, w: 3.8, h: 2.9,
    fill: { color: C.light },
    line: { color: C.primary, width: 1.5 },
    rectRadius: 0.1,
  })
  slide.addText('📱 어디서나 접근 가능', {
    x: 5.75, y: 4.0, w: 3.5, h: 0.5,
    fontSize: 15, bold: true, color: C.primary,
  })
  slide.addText(
    'PC·태블릿·스마트폰 모두 지원\n퇴근 후에도 입원 환자 실시간 확인\n별도 앱 설치 불필요 (웹 기반)\n인터넷만 있으면 어디서나 접속',
    {
      x: 5.75, y: 4.55, w: 3.5, h: 2.1,
      fontSize: 12.5, color: C.dark, lineSpacingMultiple: 1.4,
    }
  )
}

// ────────────────────────────────────────────────────────────
// 슬라이드 7 – 전문 차트 모듈
// ────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide()

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1.0,
    fill: { color: '16A085' },
  })
  slide.addText('🔬 전문과 차트 모듈', {
    x: 0.5, y: 0.15, w: 8.5, h: 0.7,
    fontSize: 26, bold: true, color: C.white,
  })

  const modules = [
    {
      icon: '❤️', title: '심장초음파 (Echo)',
      points: [
        '측정값 입력 → 결과값 자동 계산',
        '표준화된 심초 측정 프로토콜',
        '이전 검사 비교 기능',
      ],
    },
    {
      icon: '🔊', title: '복부초음파',
      points: [
        '장기별 구조화된 소견 입력',
        '초음파 이미지 첨부 지원',
        '소견 템플릿 재사용',
      ],
    },
    {
      icon: '🦷', title: '치과 차트',
      points: [
        'Triadan 시스템 기반 치아 번호',
        'AVDC 기준 치주 병기 분류',
        '6포인트 치주낭 깊이 기록',
        '치아별 처치 계획 수립',
      ],
    },
    {
      icon: '👁️', title: '안과 차트',
      points: [
        '표준화된 안과 검사 항목',
        '안압·슬릿램프 등 소견 구조화',
        '진단·처치 체계적 기록',
      ],
    },
    {
      icon: '🧠', title: '신경계 차트',
      points: [
        '신경계 검사 항목 체계화',
        '등급화된 평가 기준 적용',
        '경과 관찰 비교 기능',
      ],
    },
    {
      icon: '🔬', title: '세포학 차트',
      points: [
        'AI 보조 세포학 판독',
        '전문의 의뢰 기록 지원',
        '소견 데이터베이스 축적',
      ],
    },
  ]

  modules.forEach((m, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = 0.2 + col * 3.1
    const y = 1.15 + row * 3.1

    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 2.85, h: 2.85,
      fill: { color: C.white },
      line: { color: '16A085', width: 2 },
      rectRadius: 0.08,
    })
    slide.addText(m.icon + ' ' + m.title, {
      x: x + 0.1, y: y + 0.1, w: 2.65, h: 0.5,
      fontSize: 14, bold: true, color: '16A085',
    })
    slide.addShape(pptx.ShapeType.line, {
      x: x + 0.1, y: y + 0.65, w: 2.5, h: 0,
      line: { color: '16A085', width: 1 },
    })
    const pts = m.points.map(p => '✓ ' + p).join('\n')
    slide.addText(pts, {
      x: x + 0.1, y: y + 0.75, w: 2.65, h: 1.95,
      fontSize: 11.5, color: C.dark, lineSpacingMultiple: 1.35,
    })
  })
}

// ────────────────────────────────────────────────────────────
// 슬라이드 8 – 데이터 마이그레이션 & 통합
// ────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide()

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1.0,
    fill: { color: C.primary },
  })
  slide.addText('🔄 기존 차트 → VETOOL 손쉬운 전환', {
    x: 0.5, y: 0.15, w: 8.5, h: 0.7,
    fontSize: 24, bold: true, color: C.white,
  })

  // 흐름도
  const flowItems = [
    { label: '인투벳\n(IntoVet)', color: 'E8DAEF' },
    { label: '이프렌즈\n(e-friends)', color: 'E8DAEF' },
  ]

  // 기존 프로그램 박스들
  flowItems.forEach((item, i) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.3 + i * 2.2, y: 1.5, w: 2.0, h: 1.2,
      fill: { color: item.color },
      line: { color: C.gray, width: 1 },
      rectRadius: 0.08,
    })
    slide.addText(item.label, {
      x: 0.3 + i * 2.2, y: 1.6, w: 2.0, h: 1.0,
      fontSize: 13, bold: true, color: C.dark, align: 'center',
    })
  })

  // 화살표 & CSV
  slide.addText('CSV\n파일 내보내기', {
    x: 1.0, y: 3.0, w: 2.8, h: 0.8,
    fontSize: 13, color: C.accent, align: 'center', bold: true,
  })
  slide.addText('↓', { x: 2.0, y: 3.7, w: 0.8, h: 0.5, fontSize: 28, color: C.accent, align: 'center' })

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.1, y: 4.2, w: 2.6, h: 1.2,
    fill: { color: C.highlight },
    rectRadius: 0.08,
  })
  slide.addText('VETOOL\n업로드', {
    x: 1.1, y: 4.3, w: 2.6, h: 1.0,
    fontSize: 16, bold: true, color: C.white, align: 'center',
  })

  // 우측 안내
  slide.addShape(pptx.ShapeType.rect, {
    x: 5.0, y: 1.2, w: 4.3, h: 5.5,
    fill: { color: C.light },
    line: { color: C.accent, width: 1 },
  })
  slide.addText('전환이 쉬운 이유', {
    x: 5.15, y: 1.35, w: 4.0, h: 0.5,
    fontSize: 16, bold: true, color: C.primary,
  })
  const reasons = [
    '✅ 인투벳·이프렌즈 환자 데이터\n    CSV 파일 직접 업로드 지원',
    '✅ 환자 전체 기록 일괄 이전 가능',
    '✅ 전환 과정 전담 지원',
    '✅ 기존 진료 흐름을 최대한 유지하는\n    UI/UX 설계',
    '✅ 별도 서버 설치 불필요\n    (클라우드 즉시 시작)',
  ]
  slide.addText(reasons.join('\n\n'), {
    x: 5.15, y: 1.95, w: 4.0, h: 4.5,
    fontSize: 13, color: C.dark, lineSpacingMultiple: 1.3,
  })
}

// ────────────────────────────────────────────────────────────
// 슬라이드 9 – 요금제
// ────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide()

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1.0,
    fill: { color: C.primary },
  })
  slide.addText('💳 요금제 안내', {
    x: 0.5, y: 0.15, w: 8.5, h: 0.7,
    fontSize: 26, bold: true, color: C.white,
  })

  const plans = [
    {
      name: 'Mild',
      price: '50,000원',
      sub: '/월',
      tag: '소규모 병원',
      color: '2980B9',
      features: [
        '수의사 최대 3명',
        '입원환자차트',
        '모니터링',
        '진료노트',
        '컬렉션',
        '2GB/월 저장공간',
        '기본 지원',
      ],
      highlight: false,
    },
    {
      name: 'Moderate',
      price: '100,000원',
      sub: '/월',
      tag: '★ 추천 — 대형 병원',
      color: C.primary,
      features: [
        '수의사 최대 10명',
        '모든 차트 기능',
        '수의학 계산기',
        '수술차트 (STT)',
        '건강검진 차트',
        '심장초음파 차트',
        '10GB/월 저장공간',
        '우선 지원',
      ],
      highlight: true,
    },
    {
      name: 'Severe',
      price: '150,000원',
      sub: '/월',
      tag: '대형·전문 병원',
      color: '6C3483',
      features: [
        '수의사 수 무제한',
        '모든 차트 기능',
        '데이터 분석',
        '경영 컨설팅 지원',
        '20GB/월 저장공간',
        '최우선 지원',
      ],
      highlight: false,
    },
  ]

  plans.forEach((plan, i) => {
    const x = 0.3 + i * 3.05
    const y = 1.1

    if (plan.highlight) {
      slide.addShape(pptx.ShapeType.rect, {
        x: x - 0.05, y: y - 0.1, w: 2.95, h: 6.0,
        fill: { color: C.highlight },
        line: { color: C.highlight, width: 0 },
      })
    }
    slide.addShape(pptx.ShapeType.rect, {
      x, y: plan.highlight ? y : y, w: 2.85, h: plan.highlight ? 5.8 : 5.7,
      fill: { color: plan.color },
    })

    slide.addText(plan.name, {
      x, y: y + 0.1, w: 2.85, h: 0.5,
      fontSize: 22, bold: true, color: C.white, align: 'center',
    })
    if (plan.highlight) {
      slide.addText('★ 추천', {
        x, y: y + 0.6, w: 2.85, h: 0.35,
        fontSize: 12, color: C.highlight, align: 'center', bold: true,
      })
    } else {
      slide.addText(plan.tag, {
        x, y: y + 0.6, w: 2.85, h: 0.35,
        fontSize: 12, color: 'AAAAAA', align: 'center',
      })
    }

    slide.addText(plan.price, {
      x, y: y + 1.05, w: 2.85, h: 0.65,
      fontSize: 28, bold: true, color: C.white, align: 'center',
    })
    slide.addText(plan.sub, {
      x, y: y + 1.65, w: 2.85, h: 0.3,
      fontSize: 13, color: 'CCCCCC', align: 'center',
    })

    slide.addShape(pptx.ShapeType.line, {
      x: x + 0.2, y: y + 2.05, w: 2.4, h: 0,
      line: { color: C.white, width: 0.5 },
    })

    const featText = plan.features.map(f => '✓  ' + f).join('\n')
    slide.addText(featText, {
      x: x + 0.15, y: y + 2.2, w: 2.6, h: 3.1,
      fontSize: 11.5, color: C.white, lineSpacingMultiple: 1.4,
    })
  })
}

// ────────────────────────────────────────────────────────────
// 슬라이드 10 – 실사용 후기
// ────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide()

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1.0,
    fill: { color: C.primary },
  })
  slide.addText('💬 실사용 병원의 목소리', {
    x: 0.5, y: 0.15, w: 8.5, h: 0.7,
    fontSize: 26, bold: true, color: C.white,
  })

  const reviews = [
    {
      quote: '"벳툴은 환자 상태 및 처치 유무 등 언제 어디서든 확인하고 조치할 수 있습니다. 스탭이 많은 곳일수록 업무 효율이 증가합니다. 프로그램에 대한 피드백도 빨라 병원에 맞게 운영할 수 있습니다."',
      name: '고준호 부원장',
      hospital: 'SNC동물메디컬센터',
    },
    {
      quote: '"벳툴은 수의사가 무엇을 불편해하는지를 정확히 알고 있습니다. 피드백이 빨라서 좋고 이어서 출시될 제품들도 기대가 됩니다."',
      name: '소형재 원장',
      hospital: '광진동물의료센터',
    },
    {
      quote: '"수의사들 뿐만 아니라 간호사들도 벳툴 입원환자 차트를 좋아합니다. 누락되는 처치가 없어서 좋습니다."',
      name: '권린희 원장',
      hospital: '강동로얄동물메디컬센터',
    },
  ]

  reviews.forEach((r, i) => {
    const y = 1.2 + i * 2.15
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.3, y, w: 8.9, h: 2.0,
      fill: { color: C.light },
      line: { color: C.accent, width: 1.5 },
      rectRadius: 0.08,
    })
    slide.addText('" "', {
      x: 0.35, y: y + 0.05, w: 0.5, h: 0.5,
      fontSize: 28, color: C.accent, bold: true,
    })
    slide.addText(r.quote, {
      x: 0.75, y: y + 0.12, w: 7.8, h: 1.2,
      fontSize: 12.5, color: C.dark, italics: true, lineSpacingMultiple: 1.3,
    })
    slide.addText('— ' + r.name + '  |  ' + r.hospital, {
      x: 0.75, y: y + 1.45, w: 7.8, h: 0.4,
      fontSize: 12, color: C.primary, bold: true,
    })
  })
}

// ────────────────────────────────────────────────────────────
// 슬라이드 11 – 도입 프로세스
// ────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide()

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1.0,
    fill: { color: C.primary },
  })
  slide.addText('🚀 도입 프로세스', {
    x: 0.5, y: 0.15, w: 8.5, h: 0.7,
    fontSize: 26, bold: true, color: C.white,
  })

  const steps = [
    { num: '01', title: '상담 신청', desc: '카카오 오픈채팅으로\n무료 상담 신청', icon: '💬' },
    { num: '02', title: '데모 체험', desc: '실제 차트를\n직접 체험해보세요', icon: '🖥️' },
    { num: '03', title: '환자 데이터 이전', desc: '기존 프로그램에서\nCSV 파일로 데이터 이전', icon: '📂' },
    { num: '04', title: '계정 생성 & 설정', desc: '병원 맞춤 설정\n스탭 계정 생성', icon: '⚙️' },
    { num: '05', title: '사용 시작', desc: '즉시 사용 가능\n지속적인 업데이트 제공', icon: '🎉' },
  ]

  steps.forEach((s, i) => {
    const x = 0.2 + i * 1.9
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.3, w: 1.75, h: 4.5,
      fill: { color: i % 2 === 0 ? C.primary : C.accent },
      rectRadius: 0.08,
    })
    slide.addText(s.num, {
      x, y: 1.4, w: 1.75, h: 0.55,
      fontSize: 20, bold: true, color: C.highlight, align: 'center',
    })
    slide.addText(s.icon, {
      x, y: 2.0, w: 1.75, h: 0.7,
      fontSize: 32, align: 'center',
    })
    slide.addText(s.title, {
      x, y: 2.75, w: 1.75, h: 0.5,
      fontSize: 13, bold: true, color: C.white, align: 'center',
    })
    slide.addShape(pptx.ShapeType.line, {
      x: x + 0.15, y: 3.3, w: 1.45, h: 0,
      line: { color: C.white, width: 0.7 },
    })
    slide.addText(s.desc, {
      x, y: 3.4, w: 1.75, h: 1.5,
      fontSize: 11.5, color: 'D5E8D4', align: 'center', lineSpacingMultiple: 1.3,
    })
    if (i < steps.length - 1) {
      slide.addText('→', {
        x: x + 1.78, y: 3.0, w: 0.2, h: 0.5,
        fontSize: 22, color: C.gray,
      })
    }
  })

  slide.addText('도입 문의: 카카오 오픈채팅 "벳툴"', {
    x: 0.5, y: 6.0, w: 8.5, h: 0.5,
    fontSize: 14, color: C.primary, align: 'center', bold: true,
  })
}

// ────────────────────────────────────────────────────────────
// 슬라이드 12 – 마무리 / CTA
// ────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide()

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: '100%',
    fill: { color: C.primary },
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.5, h: '100%',
    fill: { color: C.highlight },
  })

  slide.addText('🐾 VETOOL', {
    x: 1.0, y: 1.0, w: 7.5, h: 0.8,
    fontSize: 40, bold: true, color: C.white,
  })
  slide.addText('수의사의 시간을 아껴드립니다.', {
    x: 1.0, y: 1.9, w: 7.5, h: 0.6,
    fontSize: 22, color: C.light,
  })
  slide.addShape(pptx.ShapeType.line, {
    x: 1.0, y: 2.65, w: 6.5, h: 0,
    line: { color: C.highlight, width: 2 },
  })

  const ctaPoints = [
    '✅  종이 차트 → 완전한 디지털 전환',
    '✅  입원부터 전문과까지 모든 차트 통합',
    '✅  AI로 더 빠르고 정확한 기록',
    '✅  언제 어디서나 실시간 환자 모니터링',
    '✅  수의사가 만든 수의사를 위한 프로그램',
  ]
  slide.addText(ctaPoints.join('\n'), {
    x: 1.0, y: 2.9, w: 7.0, h: 2.5,
    fontSize: 15, color: C.white, lineSpacingMultiple: 1.6,
  })

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.0, y: 5.5, w: 7.5, h: 1.1,
    fill: { color: C.highlight },
    rectRadius: 0.1,
  })
  slide.addText('지금 바로 무료 상담 신청하세요  →  카카오 오픈채팅 "벳툴"', {
    x: 1.0, y: 5.6, w: 7.5, h: 0.9,
    fontSize: 16, bold: true, color: C.dark, align: 'center',
  })
}

// ── 저장
pptx.writeFile({ fileName: '/Users/bangchangkim/vetool_wondang/VETOOL_홍보자료.pptx' })
  .then(() => console.log('✅ PPTX 생성 완료: VETOOL_홍보자료.pptx'))
  .catch(e => console.error('❌ 에러:', e))
