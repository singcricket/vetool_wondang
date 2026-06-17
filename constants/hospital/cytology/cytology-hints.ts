// Shared hint computation utilities for blood smear and effusion cytology

export interface FluidHint {
  label: string
  detail: string
  severity: 'info' | 'warning' | 'critical'
}
export interface WbcHint { label: string; detail: string; severity: 'info' | 'warning' | 'critical' }
export interface RbcHint { label: string; detail: string; severity: 'info' | 'warning' | 'critical' }
export interface PltHint { label: string; detail: string; severity: 'info' | 'warning' | 'critical' }

export type ReticResult =
  | {
      species: 'dog'
      reticPct: string
      corrected: string
      matTime: number
      rpi: string
      regenLabel: string
      regenSev: 'info' | 'warning' | 'critical'
    }
  | {
      species: 'cat'
      aggPct: string
      punctPct: string | null
      correctedAgg: string
      regen: boolean
    }

// ── Field reader helpers ──────────────────────────────────────

function nv(findings: Record<string, string | string[]>, id: string): number | null {
  const v = findings[id]
  const num = parseFloat(Array.isArray(v) ? v[0] : (v ?? ''))
  return isNaN(num) ? null : num
}
function sv(findings: Record<string, string | string[]>, id: string): string {
  const v = findings[id]
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}
function av(findings: Record<string, string | string[]>, id: string): string[] {
  const v = findings[id]
  return Array.isArray(v) ? v : v ? [v] : []
}
function ratio(findings: Record<string, string | string[]>, a: string, b: string): number | null {
  const va = nv(findings, a); const vb = nv(findings, b)
  return va !== null && vb !== null && vb > 0 ? va / vb : null
}

// ── Fluid (Effusion) hints ────────────────────────────────────

export function computeFluidHints(findings: Record<string, string | string[]>): FluidHint[] {
  const hints: FluidHint[] = []
  const protein = nv(findings, 'fluid_protein')
  const tncc = nv(findings, 'fluid_tncc')

  if (protein !== null && tncc !== null) {
    if (protein < 2.5 && tncc < 1500)
      hints.push({ label: 'Transudate 의심', detail: '단백 <2.5 g/dL, TNCC <1,500/μL — 저알부민혈증·우심부전·간부전 감별 권장', severity: 'info' })
    else if (protein <= 5.0 && tncc <= 5000)
      hints.push({ label: 'Modified Transudate 의심', detail: '단백 2.5~5.0 g/dL, TNCC 1,500~5,000/μL — 심질환·종양·초기 염증 감별 권장', severity: 'warning' })
    else if (protein > 3.0 && tncc > 5000)
      hints.push({ label: 'Exudate 의심', detail: '단백 >3.0 g/dL, TNCC >5,000/μL — 세균성 복막염·FIP·종양 감별 권장', severity: 'critical' })
  }

  const bunR = ratio(findings, 'fluid_bun', 'serum_bun')
  const creatR = ratio(findings, 'fluid_creatinine', 'serum_creatinine')
  if ((bunR !== null && bunR > 1) || (creatR !== null && creatR > 2))
    hints.push({ label: 'Uroabdomen 의심', detail: `BUN 비율 ${bunR?.toFixed(2) ?? '-'} / Creatinine 비율 ${creatR?.toFixed(2) ?? '-'} — 방광 또는 요관 파열 가능성`, severity: 'critical' })

  const bilR = ratio(findings, 'fluid_tbil', 'serum_tbil')
  if (bilR !== null && bilR > 2)
    hints.push({ label: '담즙성 복막염 의심', detail: `TBIL 체강액/혈청 비율 ${bilR.toFixed(2)} — 담낭 또는 담관 파열 가능성`, severity: 'critical' })

  const tgR = ratio(findings, 'fluid_triglyceride', 'serum_triglyceride')
  const tg = nv(findings, 'fluid_triglyceride')
  if ((tgR !== null && tgR > 1) || (tg !== null && tg > 100))
    hints.push({ label: 'Chylous Effusion 의심', detail: `TG ${tg ?? '-'} mg/dL / 혈청 비율 ${tgR?.toFixed(2) ?? '-'} — 흉관 손상·림프종 감별 권장`, severity: 'warning' })

  const fluidPcv = nv(findings, 'fluid_pcv')
  const bloodPcv = nv(findings, 'blood_pcv')
  if (fluidPcv !== null && bloodPcv !== null && bloodPcv > 0 && fluidPcv / bloodPcv > 0.1)
    hints.push({ label: '혈복강 (Hemoabdomen) 의심', detail: `체강액 PCV ${fluidPcv}% / 혈액 PCV ${bloodPcv}% (비율 ${(fluidPcv / bloodPcv).toFixed(2)}) — 외상·비장 종양·응고장애 감별 권장`, severity: 'critical' })

  const serum_alb = nv(findings, 'serum_albumin')
  const fluid_alb = nv(findings, 'fluid_albumin')
  const saag = serum_alb !== null && fluid_alb !== null ? serum_alb - fluid_alb : null
  if (saag !== null) {
    if (saag >= 1.1)
      hints.push({ label: '문맥압 항진 의심 (SAAG ≥1.1)', detail: `SAAG ${saag.toFixed(2)} g/dL — 간경변·우심부전·문맥혈전 감별 권장`, severity: 'warning' })
    else
      hints.push({ label: '비문맥성 원인 (SAAG <1.1)', detail: `SAAG ${saag.toFixed(2)} g/dL — 복막염·종양·FIP 가능성 상대적 높음`, severity: 'info' })
  }

  const alb = nv(findings, 'fluid_albumin')
  const prot = nv(findings, 'fluid_protein')
  if (alb !== null && prot !== null && prot > 0) {
    const glob = prot - alb
    const ag = glob > 0 ? alb / glob : null
    if (ag !== null && ag < 0.4 && protein !== null && protein > 3.5)
      hints.push({ label: 'FIP 의심 (고양이)', detail: `단백 ${protein} g/dL, A:G 비율 ${ag.toFixed(2)} — FIP 고위험군 (혈청 단백전기영동 권장)`, severity: 'critical' })
  }

  const glucR = ratio(findings, 'fluid_glucose', 'serum_glucose')
  if (glucR !== null && glucR < 0.5)
    hints.push({ label: '패혈성 복막염 의심', detail: `Glucose 체강액/혈청 비율 ${glucR.toFixed(2)} — 세균에 의한 당 소모, 즉각적 치료 필요`, severity: 'critical' })

  return hints
}

// ── WBC hints ─────────────────────────────────────────────────

export function computeWbcHints(findings: Record<string, string | string[]>): WbcHint[] {
  const hints: WbcHint[] = []
  const seg = nv(findings, 'dc_seg_neut'); const band = nv(findings, 'dc_band'); const meta = nv(findings, 'dc_meta')
  const lymph = nv(findings, 'dc_lymph'); const eos = nv(findings, 'dc_eos')
  const blast = nv(findings, 'dc_blast'); const atypLymph = nv(findings, 'dc_atyp_lymph')

  const totalNeut = (seg ?? 0) + (band ?? 0) + (meta ?? 0)
  if (totalNeut > 80) hints.push({ label: '호중구증가증 의심', detail: `총 호중구 ${totalNeut.toFixed(0)}% — 염증, 스트레스, 코르티코스테로이드 반응 감별 권장`, severity: 'warning' })
  if (seg !== null && totalNeut < 40 && seg < 40) hints.push({ label: '호중구감소증 의심', detail: `총 호중구 ${totalNeut.toFixed(0)}% — 심한 세균 감염, 골수 억제, 패혈증 고려`, severity: 'critical' })
  if (band !== null && band > 5) hints.push({ label: '핵좌방이동 (Left shift)', detail: `Band 호중구 ${band}% — 활성 염증 반응. Toxic change 동반 시 패혈증 주의`, severity: 'warning' })
  if (band !== null && band > 5) {
    const tgran = sv(findings, 'wbc_toxic_gran'); const dohle = sv(findings, 'wbc_dohle')
    if (tgran === 'moderate' || tgran === 'many' || dohle === 'moderate' || dohle === 'many')
      hints.push({ label: '패혈증 위험 — Left shift + 독성변화', detail: 'Band 증가 + 독성변화 동반 — 즉각적 항생제 치료 및 혈액배양 검사 권장', severity: 'critical' })
  }
  if (lymph !== null && lymph > 50) hints.push({ label: '림프구증가증', detail: `림프구 ${lymph}% — 생리적 또는 지속적 항원 자극. 비정형 형태 동반 시 림포마/백혈병 의심`, severity: 'warning' })
  if (blast !== null && blast > 5) hints.push({ label: '백혈병 의심 — Blast 증가', detail: `Blast ${blast}% — 백혈병 강력 의심. 골수 검사 및 flow cytometry 즉시 권장`, severity: 'critical' })
  if (atypLymph !== null && atypLymph > 5) hints.push({ label: '비정형 림프구 증가', detail: `비정형 림프구 ${atypLymph}% — 림포마/CLL/반응성 림프구증 감별. PARR 또는 flow cytometry 권장`, severity: 'warning' })
  if (eos !== null && eos > 10) hints.push({ label: '호산구증가증', detail: `호산구 ${eos}% — 기생충, 알레르기, 호산구성 질환 (EGC, EPE 등) 감별 권장`, severity: 'info' })
  return hints
}

// ── RBC hints ─────────────────────────────────────────────────

export function computeRbcHints(findings: Record<string, string | string[]>): RbcHint[] {
  const hints: RbcHint[] = []
  const poiki = av(findings, 'rbc_poikilocytes')
  const s = (id: string) => sv(findings, id)

  if (poiki.includes('schistocytes')) hints.push({ label: 'MAHA 의심 — Schistocyte', detail: 'Fragmented RBC 확인 — 미세혈관병증성 용혈빈혈(DIC, 혈관육종, 판막 질환) 가능성', severity: 'critical' })
  if (poiki.includes('spherocytes')) hints.push({ label: 'IMHA 의심 — Spherocyte', detail: '구형 적혈구 확인 — 면역매개성 용혈빈혈(IMHA) 의심. Coombs test 권장', severity: 'critical' })
  if (s('rbc_autoagglutination') === 'present') hints.push({ label: 'IMHA 강력 의심 — 자가응집', detail: '자가응집 확인 — IMHA 강력 의심. Saline dilution test로 rouleaux와 감별 후 즉각 치료 고려', severity: 'critical' })
  if (s('rbc_hypochromia') !== 'none' && s('rbc_hypochromia') !== '' && s('rbc_microcytosis') === 'present')
    hints.push({ label: '철결핍성 빈혈 의심', detail: '저색소성 + 소구성 빈혈 — 만성 출혈, 철분 결핍 의심. 혈청 철/TIBC/페리틴 검사 권장', severity: 'warning' })
  if (s('rbc_polychromasia') === 'moderate' || s('rbc_polychromasia') === 'marked')
    hints.push({ label: '재생성 빈혈 반응', detail: `다색성 적혈구(polychromasia) ${s('rbc_polychromasia') === 'marked' ? '현저' : '중등도'} — 활발한 골수 재생 반응. Reticulocyte 수치 확인 권장`, severity: 'info' })
  const parasites = s('rbc_parasites')
  if (parasites === 'mycoplasma') hints.push({ label: 'Mycoplasma 의심', detail: 'RBC 표면 에피기생충 확인 — Mycoplasma haemofelis/haemocanis. PCR 확진 권장. 독시사이클린 치료', severity: 'critical' })
  if (parasites === 'babesia_large' || parasites === 'babesia_small') hints.push({ label: 'Babesia 의심', detail: `RBC 내 원형질충 확인 (${parasites === 'babesia_large' ? 'B. canis 형태' : 'B. gibsoni 형태'}) — PCR 확진 후 imidocarb 치료`, severity: 'critical' })
  if (parasites === 'cytauxzoon') hints.push({ label: 'Cytauxzoon (고양이)', detail: '고양이 Cytauxzoon felis 의심 — 예후 불량. 즉각적 항원충 치료 시작', severity: 'critical' })
  if (poiki.includes('echinocytes')) hints.push({ label: 'Echinocyte 확인', detail: '신부전, 저인산혈증, 체외순환 또는 도말 artifact 감별 필요', severity: 'info' })
  if (poiki.includes('acanthocytes')) hints.push({ label: 'Acanthocyte 확인', detail: '간질환, 혈관육종, 지질 이상 연관 가능. 임상 소견과 통합 해석 필요', severity: 'warning' })
  return hints
}

// ── PLT hints ─────────────────────────────────────────────────

export function computePltHints(findings: Record<string, string | string[]>): PltHint[] {
  const hints: PltHint[] = []
  const s = (id: string) => sv(findings, id)
  const n = (id: string) => nv(findings, id)

  if (s('plt_clumps') === 'present') hints.push({ label: '혈소판 응집 — 위양성 저하', detail: '혈소판 응집 확인 — 자동 분석기 저수치는 위양성일 수 있음. 수동 카운트 또는 재채혈(구연산 EDTA 교체) 권장', severity: 'warning' })
  if (s('plt_estimate') === 'decreased') {
    hints.push({ label: '혈소판 감소증', detail: '혈소판 감소증 확인 — 원인 감별: ① 소비성(DIC, 혈관육종) ② 파괴성(IMTP) ③ 생산 저하(골수 억제) ④ 격리(비장 울혈)', severity: 'critical' })
    if (s('plt_large') === 'present' || s('plt_large') === 'many')
      hints.push({ label: '재생성 혈소판 반응', detail: '거대혈소판 동반 혈소판 감소 — 골수의 보상적 생산 반응. 소비성 또는 파괴성 혈소판 감소 가능성', severity: 'warning' })
  }
  const perHpf = n('plt_per_hpf')
  if (perHpf !== null) {
    const estimated = Math.round(perHpf * 15000)
    hints.push({ label: `추정 혈소판 수: ~${estimated.toLocaleString()}/μL`, detail: `HPF당 ${perHpf}개 × 15,000 = 추정 ${estimated.toLocaleString()}/μL (정상: 200,000~500,000/μL)`, severity: estimated < 50000 ? 'critical' : estimated < 150000 ? 'warning' : 'info' })
  }
  return hints
}

// ── Reticulocyte calculator ───────────────────────────────────

export function computeReticulocyte(findings: Record<string, string | string[]>): ReticResult | null {
  const species = sv(findings, 'retic_species') || 'dog'
  const pcv = nv(findings, 'retic_pcv')

  if (species === 'cat') {
    const aggCount = nv(findings, 'retic_agg_count')
    const punctCount = nv(findings, 'retic_punct_count')
    if (aggCount === null || pcv === null) return null
    const aggPct = aggCount / 10
    const correctedAgg = aggPct * (pcv / 37)
    const regen = aggPct > 0.4
    return {
      species: 'cat',
      aggPct: aggPct.toFixed(2),
      punctPct: punctCount !== null ? (punctCount / 10).toFixed(2) : null,
      correctedAgg: correctedAgg.toFixed(2),
      regen,
    }
  }

  const reticCount = nv(findings, 'retic_count')
  if (reticCount === null || pcv === null) return null
  const reticPct = reticCount / 10
  const corrected = reticPct * (pcv / 45)
  const matTime = pcv > 35 ? 1.0 : pcv > 25 ? 1.5 : pcv > 15 ? 2.0 : 2.5
  const rpi = corrected / matTime
  const regenLabel = rpi > 2 ? '재생성 빈혈 (충분)' : rpi >= 1 ? '경계성 재생성' : '비재생성 빈혈'
  const regenSev: 'info' | 'warning' | 'critical' = rpi > 2 ? 'info' : rpi >= 1 ? 'warning' : 'critical'
  return { species: 'dog', reticPct: reticPct.toFixed(2), corrected: corrected.toFixed(2), matTime, rpi: rpi.toFixed(2), regenLabel, regenSev }
}

// ── DC_FIELDS (shared label reference) ───────────────────────

export const DC_FIELDS = [
  { id: 'dc_seg_neut',   label: '분엽호중구',     labelEn: 'Seg. Neutrophils' },
  { id: 'dc_band',       label: 'Band 호중구',    labelEn: 'Band Neutrophils' },
  { id: 'dc_meta',       label: '후골수구',        labelEn: 'Metamyelocytes' },
  { id: 'dc_lymph',      label: '림프구',          labelEn: 'Lymphocytes' },
  { id: 'dc_mono',       label: '단핵구',          labelEn: 'Monocytes' },
  { id: 'dc_eos',        label: '호산구',          labelEn: 'Eosinophils' },
  { id: 'dc_baso',       label: '호염기구',        labelEn: 'Basophils' },
  { id: 'dc_blast',      label: 'Blast 세포',      labelEn: 'Blasts' },
  { id: 'dc_atyp_lymph', label: '비정형 림프구',   labelEn: 'Atypical Lymphocytes' },
]
