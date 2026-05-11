import type {
  OphthalmicSign,
  OphDiagnosisResult,
  DiagnosisRule,
  SelectOphTest,
  MultiSelectOphTest,
  BooleanOphTest,
  RangeOphTest,
} from './ophthalmic-types'
import { ophthalmicDomainSections } from './ophthalmic-exam-domains'

// ============================================================
// SECTION 15: DIAGNOSIS RULES (with confidence scoring)
// ============================================================

export const ophthalmicDiagnosisRules: DiagnosisRule[] = [
  // ── CORNEA ─────────────────────────────────────────────────
  {
    diagnosisID: 'kcs_od', diagnosisName: 'KCS (OD)', diagnosisNameKo: '건성각막결막염 (우안)',
    abbreviation: 'KCS-OD', category: 'cornea',
    requiredSigns: ['dry_eye_od'],
    supportingSigns: ['corneal_opacity_od', 'corneal_vascularization_od', 'corneal_pigmentation_od', 'epiphora_od'],
    baseConfidence: 70, supportingWeight: 8, maxConfidence: 98,
    descriptionKo: '우안 STT 감소. 건성각막결막염.',
    treatmentHintKo: 'Cyclosporine 0.2% 또는 Tacrolimus 0.02~0.03% 점안, 인공눈물 병용.',
    ddx: ['conjunctivitis_od', 'corneal_ulcer_superficial_od', 'kcs_os'],
  },
  {
    diagnosisID: 'kcs_os', diagnosisName: 'KCS (OS)', diagnosisNameKo: '건성각막결막염 (좌안)',
    abbreviation: 'KCS-OS', category: 'cornea',
    requiredSigns: ['dry_eye_os'],
    supportingSigns: ['corneal_opacity_os', 'corneal_vascularization_os', 'corneal_pigmentation_os', 'epiphora_os'],
    baseConfidence: 70, supportingWeight: 8, maxConfidence: 98,
    descriptionKo: '좌안 STT 감소. 건성각막결막염.',
    treatmentHintKo: 'Cyclosporine 0.2% 또는 Tacrolimus 0.02~0.03% 점안, 인공눈물 병용.',
    ddx: ['conjunctivitis_os', 'corneal_ulcer_superficial_os', 'kcs_od'],
  },
  {
    diagnosisID: 'corneal_ulcer_superficial_od', diagnosisName: 'Superficial Corneal Ulcer (OD)', diagnosisNameKo: '표층 각막 궤양 (우안)',
    category: 'cornea',
    requiredSigns: ['corneal_ulcer_od'],
    supportingSigns: ['corneal_opacity_od', 'epiphora_od', 'corneal_vascularization_od'],
    exclusionSigns: ['deep_ulcer_od', 'descemetocele_od'],
    baseConfidence: 80, supportingWeight: 5, maxConfidence: 95,
    descriptionKo: '우안 FDT 양성 표층 궤양. 원인: 외상, KCS, 이물, 첩모난생.',
    treatmentHintKo: '국소 항생제 (ciprofloxacin/ofloxacin). E-collar 필수. 3-5일 재평가.',
    ddx: ['deep_corneal_ulcer_od', 'descemetocele_od'],
  },
  {
    diagnosisID: 'corneal_ulcer_superficial_os', diagnosisName: 'Superficial Corneal Ulcer (OS)', diagnosisNameKo: '표층 각막 궤양 (좌안)',
    category: 'cornea',
    requiredSigns: ['corneal_ulcer_os'],
    supportingSigns: ['corneal_opacity_os', 'epiphora_os', 'corneal_vascularization_os'],
    exclusionSigns: ['deep_ulcer_os', 'descemetocele_os'],
    baseConfidence: 80, supportingWeight: 5, maxConfidence: 95,
    descriptionKo: '좌안 FDT 양성 표층 궤양. 원인: 외상, KCS, 이물, 첩모난생.',
    treatmentHintKo: '국소 항생제 (ciprofloxacin/ofloxacin). E-collar 필수. 3-5일 재평가.',
    ddx: ['deep_corneal_ulcer_os', 'descemetocele_os'],
  },
  {
    diagnosisID: 'deep_corneal_ulcer_od', diagnosisName: 'Deep / Stromal Corneal Ulcer (OD)', diagnosisNameKo: '심층/기질성 각막 궤양 (우안)',
    category: 'cornea',
    requiredSigns: ['deep_ulcer_od'],
    supportingSigns: ['corneal_opacity_od', 'corneal_vascularization_od', 'uveitis_od', 'low_iop_od'],
    baseConfidence: 80, supportingWeight: 6, maxConfidence: 97,
    descriptionKo: '우안 Stroma 침범 심층 궤양. 천공 위험. 즉시 외과적 처치 고려.',
    treatmentHintKo: 'Conjunctival flap 또는 corneal grafting. 전신 항생제 + 항콜라게나제 (EDTA, serum).',
    ddx: ['descemetocele_od', 'corneal_perforation_od'],
  },
  {
    diagnosisID: 'deep_corneal_ulcer_os', diagnosisName: 'Deep / Stromal Corneal Ulcer (OS)', diagnosisNameKo: '심층/기질성 각막 궤양 (좌안)',
    category: 'cornea',
    requiredSigns: ['deep_ulcer_os'],
    supportingSigns: ['corneal_opacity_os', 'corneal_vascularization_os', 'uveitis_os', 'low_iop_os'],
    baseConfidence: 80, supportingWeight: 6, maxConfidence: 97,
    descriptionKo: '좌안 Stroma 침범 심층 궤양. 천공 위험. 즉시 외과적 처치 고려.',
    treatmentHintKo: 'Conjunctival flap 또는 corneal grafting. 전신 항생제 + 항콜라게나제 (EDTA, serum).',
    ddx: ['descemetocele_os', 'corneal_perforation_os'],
  },
  {
    diagnosisID: 'descemetocele_od', diagnosisName: 'Descemetocele (OD)', diagnosisNameKo: '데스메막 탈출 (우안)',
    category: 'cornea',
    requiredSigns: ['descemetocele_od'],
    supportingSigns: ['corneal_opacity_od', 'low_iop_od'],
    baseConfidence: 90, supportingWeight: 4, maxConfidence: 99,
    descriptionKo: '우안 데스메막 노출 — 즉각적 외과 처치 없으면 천공 불가피.',
    treatmentHintKo: '긴급 수술 필요: conjunctival flap, corneoconjunctival transposition, or keratoplasty.',
    ddx: ['corneal_perforation_od'],
  },
  {
    diagnosisID: 'descemetocele_os', diagnosisName: 'Descemetocele (OS)', diagnosisNameKo: '데스메막 탈출 (좌안)',
    category: 'cornea',
    requiredSigns: ['descemetocele_os'],
    supportingSigns: ['corneal_opacity_os', 'low_iop_os'],
    baseConfidence: 90, supportingWeight: 4, maxConfidence: 99,
    descriptionKo: '좌안 데스메막 노출 — 즉각적 외과 처치 없으면 천공 불가피.',
    treatmentHintKo: '긴급 수술 필요: conjunctival flap, corneoconjunctival transposition, or keratoplasty.',
    ddx: ['corneal_perforation_os'],
  },
  {
    diagnosisID: 'pannus_od', diagnosisName: 'Chronic Superficial Keratitis (OD)', diagnosisNameKo: '만성 표층 각막염 (우안 파누스)',
    category: 'cornea',
    requiredSigns: ['corneal_vascularization_od'],
    supportingSigns: ['corneal_pigmentation_od', 'corneal_opacity_od'],
    baseConfidence: 65, supportingWeight: 10, maxConfidence: 92,
    descriptionKo: '우안 면역 매개성 각막염. German Shepherd 등 소인 품종. UV 악화.',
    treatmentHintKo: 'Cyclosporine 0.2% + prednisolone 점안. UV 차단 권고.',
    ddx: ['kcs_od', 'anterior_uveitis_od'],
  },
  {
    diagnosisID: 'pannus_os', diagnosisName: 'Chronic Superficial Keratitis (OS)', diagnosisNameKo: '만성 표층 각막염 (좌안 파누스)',
    category: 'cornea',
    requiredSigns: ['corneal_vascularization_os'],
    supportingSigns: ['corneal_pigmentation_os', 'corneal_opacity_os'],
    baseConfidence: 65, supportingWeight: 10, maxConfidence: 92,
    descriptionKo: '좌안 면역 매개성 각막염. German Shepherd 등 소인 품종. UV 악화.',
    treatmentHintKo: 'Cyclosporine 0.2% + prednisolone 점안. UV 차단 권고.',
    ddx: ['kcs_os', 'anterior_uveitis_os'],
  },

  // ── GLAUCOMA ──────────────────────────────────────────────
  {
    diagnosisID: 'glaucoma_primary_od', diagnosisName: 'Primary Glaucoma (OD)', diagnosisNameKo: '원발성 녹내장 (우안)',
    abbreviation: 'POAG/PACG', category: 'glaucoma',
    requiredSigns: ['high_iop_od'],
    supportingSigns: ['very_high_iop_od', 'mydriasis_od', 'optic_disc_cupping_od', 'blind_od', 'deep_ac_od'],
    exclusionSigns: ['uveitis_od', 'lens_luxation_od', 'iris_bombe_od'],
    baseConfidence: 65, supportingWeight: 10, maxConfidence: 95,
    descriptionKo: '우안 IOP 상승 (>25 mmHg) + 이차 원인 없음. 개에서 품종 소인 (American Cocker Spaniel, Shiba Inu 등).',
    treatmentHintKo: 'Latanoprost (dog) 또는 dorzolamide/timolol. 반대안 예방 치료 고려.',
    ddx: ['glaucoma_secondary_od', 'anterior_uveitis_od'],
  },
  {
    diagnosisID: 'glaucoma_primary_os', diagnosisName: 'Primary Glaucoma (OS)', diagnosisNameKo: '원발성 녹내장 (좌안)',
    abbreviation: 'Glaucoma-OS', category: 'glaucoma',
    requiredSigns: ['high_iop_os'],
    supportingSigns: ['very_high_iop_os', 'mydriasis_os', 'optic_disc_cupping_os', 'blind_os', 'deep_ac_os'],
    exclusionSigns: ['uveitis_os', 'lens_luxation_os', 'iris_bombe_os'],
    baseConfidence: 65, supportingWeight: 10, maxConfidence: 95,
    descriptionKo: '좌안 IOP 상승 (>25 mmHg) + 이차 원인 없음.',
    treatmentHintKo: 'Latanoprost (dog) 또는 dorzolamide/timolol. 반대안 예방 치료 고려.',
    ddx: ['glaucoma_secondary_os', 'anterior_uveitis_os'],
  },
  {
    diagnosisID: 'glaucoma_secondary_od', diagnosisName: 'Secondary Glaucoma (OD)', diagnosisNameKo: '속발성 녹내장 (우안)',
    abbreviation: 'Secondary Glaucoma', category: 'glaucoma',
    requiredSigns: ['high_iop_od'],
    supportingSigns: ['uveitis_od', 'lens_luxation_od', 'iris_bombe_od', 'synechia_posterior_od', 'hyphema_od', 'intraocular_mass_od'],
    baseConfidence: 60, supportingWeight: 12, maxConfidence: 96,
    descriptionKo: '우안 포도막염, 수정체 탈구, 홍채 팽융 등에 의한 이차적 IOP 상승.',
    treatmentHintKo: '원인 치료 우선. 포도막염 → 소염 치료. 수정체 탈구 → 외과 제거.',
    ddx: ['glaucoma_primary_od'],
  },
  {
    diagnosisID: 'glaucoma_secondary_os', diagnosisName: 'Secondary Glaucoma (OS)', diagnosisNameKo: '속발성 녹내장 (좌안)',
    abbreviation: 'Secondary Glaucoma', category: 'glaucoma',
    requiredSigns: ['high_iop_os'],
    supportingSigns: ['uveitis_os', 'lens_luxation_os', 'iris_bombe_os', 'synechia_posterior_os', 'hyphema_os', 'intraocular_mass_os'],
    baseConfidence: 60, supportingWeight: 12, maxConfidence: 96,
    descriptionKo: '좌안 포도막염, 수정체 탈구, 홍채 팽융 등에 의한 이차적 IOP 상승.',
    treatmentHintKo: '원인 치료 우선. 포도막염 → 소염 치료. 수정체 탈구 → 외과 제거.',
    ddx: ['glaucoma_primary_os'],
  },

  // ── UVEITIS ───────────────────────────────────────────────
  {
    diagnosisID: 'anterior_uveitis_od', diagnosisName: 'Anterior Uveitis (OD)', diagnosisNameKo: '전방 포도막염 (우안)',
    abbreviation: 'AAU-OD', category: 'uveitis',
    requiredSigns: ['uveitis_od'],
    supportingSigns: ['ac_flare_od', 'miosis_od', 'low_iop_od', 'hyphema_od', 'hypopyon_od', 'synechia_posterior_od', 'corneal_opacity_od'],
    baseConfidence: 70, supportingWeight: 8, maxConfidence: 97,
    descriptionKo: '우안 전방 플레어, 세포, 동공 수축, 저안압 조합.',
    treatmentHintKo: '국소 + 전신 NSAID/스테로이드.',
    ddx: ['glaucoma_secondary_od', 'corneal_ulcer_superficial_od'],
  },
  {
    diagnosisID: 'anterior_uveitis_os', diagnosisName: 'Anterior Uveitis (OS)', diagnosisNameKo: '전방 포도막염 (좌안)',
    abbreviation: 'AAU-OS', category: 'uveitis',
    requiredSigns: ['uveitis_os'],
    supportingSigns: ['ac_flare_os', 'miosis_os', 'low_iop_os', 'hyphema_os', 'hypopyon_os', 'synechia_posterior_os', 'corneal_opacity_os'],
    baseConfidence: 70, supportingWeight: 8, maxConfidence: 97,
    descriptionKo: '좌안 전방 플레어, 세포, 동공 수축, 저안압 조합.',
    treatmentHintKo: '국소 + 전신 NSAID/스테로이드.',
    ddx: ['glaucoma_secondary_os', 'corneal_ulcer_superficial_os'],
  },
  {
    diagnosisID: 'infectious_uveitis_od', diagnosisName: 'Infectious Uveitis (OD)', diagnosisNameKo: '감염성 포도막염 (우안)',
    category: 'uveitis',
    requiredSigns: ['uveitis_od'],
    supportingSigns: ['chorioretinitis_od', 'retinal_detachment_od', 'infectious_uveitis_suspect'],
    baseConfidence: 55, supportingWeight: 12, maxConfidence: 90,
    descriptionKo: '우안 맥락망막염 동반 시 감염성 원인 의심.',
    treatmentHintKo: '감염 원인 특정 후 항원충/항바이러스/항진균 치료.',
    ddx: ['anterior_uveitis_od', 'hypertensive_retinopathy'],
  },
  {
    diagnosisID: 'infectious_uveitis_os', diagnosisName: 'Infectious Uveitis (OS)', diagnosisNameKo: '감염성 포도막염 (좌안)',
    category: 'uveitis',
    requiredSigns: ['uveitis_os'],
    supportingSigns: ['chorioretinitis_os', 'retinal_detachment_os', 'infectious_uveitis_suspect'],
    baseConfidence: 55, supportingWeight: 12, maxConfidence: 90,
    descriptionKo: '좌안 맥락망막염 동반 시 감염성 원인 의심.',
    treatmentHintKo: '감염 원인 특정 후 항원충/항바이러스/항진균 치료.',
    ddx: ['anterior_uveitis_os', 'hypertensive_retinopathy'],
  },

  // ── LENS ──────────────────────────────────────────────────
  {
    diagnosisID: 'cataract_diabetic_od', diagnosisName: 'Diabetic Cataract (OD)', diagnosisNameKo: '당뇨성 백내장 (우안)',
    category: 'lens',
    requiredSigns: ['cataract_od', 'diabetic_cataract_suspect_od'],
    supportingSigns: ['mature_cataract_od', 'blind_od'],
    baseConfidence: 80, supportingWeight: 10, maxConfidence: 98,
    descriptionKo: '우안 당뇨 합병증성 백내장. 급격히 진행.',
    treatmentHintKo: '혈당 안정화 후 백내장 수술 고려.',
    ddx: ['hereditary_cataract_od'],
  },
  {
    diagnosisID: 'cataract_diabetic_os', diagnosisName: 'Diabetic Cataract (OS)', diagnosisNameKo: '당뇨성 백내장 (좌안)',
    category: 'lens',
    requiredSigns: ['cataract_os', 'diabetic_cataract_suspect_os'],
    supportingSigns: ['mature_cataract_os', 'blind_os'],
    baseConfidence: 80, supportingWeight: 10, maxConfidence: 98,
    descriptionKo: '좌안 당뇨 합병증성 백내장. 급격히 진행.',
    treatmentHintKo: '혈당 안정화 후 백내장 수술 고려.',
    ddx: ['hereditary_cataract_os'],
  },
  {
    diagnosisID: 'lens_induced_uveitis_od', diagnosisName: 'Lens-Induced Uveitis (OD)', diagnosisNameKo: '수정체 유발성 포도막염 (우안)',
    category: 'lens',
    requiredSigns: ['cataract_od', 'uveitis_od'],
    supportingSigns: ['hypermature_cataract_od', 'ac_flare_od', 'synechia_posterior_od', 'low_iop_od'],
    baseConfidence: 75, supportingWeight: 8, maxConfidence: 95,
    descriptionKo: '우안 백내장에 의한 포도막염.',
    treatmentHintKo: '수술 전 항염증 치료.',
    ddx: ['anterior_uveitis_od'],
  },
  {
    diagnosisID: 'lens_induced_uveitis_os', diagnosisName: 'Lens-Induced Uveitis (OS)', diagnosisNameKo: '수정체 유발성 포도막염 (좌안)',
    category: 'lens',
    requiredSigns: ['cataract_os', 'uveitis_os'],
    supportingSigns: ['hypermature_cataract_os', 'ac_flare_os', 'synechia_posterior_os', 'low_iop_os'],
    baseConfidence: 75, supportingWeight: 8, maxConfidence: 95,
    descriptionKo: '좌안 백내장에 의한 포도막염.',
    treatmentHintKo: '수술 전 항염증 치료.',
    ddx: ['anterior_uveitis_os'],
  },
  {
    diagnosisID: 'lens_luxation_od', diagnosisName: 'Lens Luxation (OD)', diagnosisNameKo: '수정체 탈구 (우안)',
    category: 'lens',
    requiredSigns: ['lens_luxation_od'],
    supportingSigns: ['high_iop_od', 'shallow_ac_od', 'deep_ac_od', 'blind_od', 'uveitis_od'],
    baseConfidence: 90, supportingWeight: 5, maxConfidence: 99,
    descriptionKo: '우안 수정체 탈구. 전방 탈구 시 응급.',
    treatmentHintKo: '전방 탈구: 즉각적 외과적 제거.',
    ddx: ['glaucoma_secondary_od'],
  },
  {
    diagnosisID: 'lens_luxation_os', diagnosisName: 'Lens Luxation (OS)', diagnosisNameKo: '수정체 탈구 (좌안)',
    category: 'lens',
    requiredSigns: ['lens_luxation_os'],
    supportingSigns: ['high_iop_os', 'shallow_ac_os', 'deep_ac_os', 'blind_os', 'uveitis_os'],
    baseConfidence: 90, supportingWeight: 5, maxConfidence: 99,
    descriptionKo: '좌안 수정체 탈구. 전방 탈구 시 응급.',
    treatmentHintKo: '전방 탈구: 즉각적 외과적 제거.',
    ddx: ['glaucoma_secondary_os'],
  },

  // ── RETINA / OPTIC NERVE ──────────────────────────────────
  {
    diagnosisID: 'pra', diagnosisName: 'Progressive Retinal Atrophy (PRA)', diagnosisNameKo: '진행성 망막 위축 (PRA)',
    abbreviation: 'PRA', category: 'retina',
    requiredSigns: ['pra_suspect_od', 'pra_suspect_os'],
    supportingSigns: ['tapetal_hyperreflectivity_od', 'tapetal_hyperreflectivity_os', 'retinal_degeneration_od', 'retinal_degeneration_os', 'menace_deficit_od', 'menace_deficit_os', 'bilateral_blindness'],
    baseConfidence: 75, supportingWeight: 8, maxConfidence: 95,
    descriptionKo: '양안 미만성 망막 과반사, 혈관 감소, 야맹증으로 시작하여 완전 실명 진행. 유전성.',
    treatmentHintKo: '현재 치료 없음. 항산화 보충제 연구 중. 유전자 검사 권고.',
    ddx: ['sard', 'optic_neuritis', 'retinal_detachment'],
  },
  {
    diagnosisID: 'sard', diagnosisName: 'Sudden Acquired Retinal Degeneration (SARD)', diagnosisNameKo: '돌발성 후천성 망막 변성 (SARD)',
    abbreviation: 'SARD', category: 'retina',
    requiredSigns: ['sard_suspect', 'bilateral_blindness'],
    supportingSigns: ['sudden_blindness', 'menace_deficit_od', 'menace_deficit_os', 'plr_direct_deficit_od', 'plr_direct_deficit_os'],
    baseConfidence: 75, supportingWeight: 8, maxConfidence: 95,
    descriptionKo: '갑작스러운 완전 양안 실명. ERG 소실. 안저 초기 정상 → 이후 PRA 유사 변화. 원인 불명.',
    treatmentHintKo: '현재 치료 없음. 면역 억제 치료 연구 중. 내과 이상 검사(cushing, 당뇨).',
    ddx: ['optic_neuritis', 'central_blindness', 'pra'],
  },
  {
    diagnosisID: 'retinal_detachment_od', diagnosisName: 'Retinal Detachment (OD)', diagnosisNameKo: '망막 박리 (우안)',
    category: 'retina',
    requiredSigns: ['retinal_detachment_od'],
    supportingSigns: ['subretinal_fluid_od', 'retinal_hemorrhage_od', 'hypertensive_retinopathy_suspect', 'blind_od'],
    baseConfidence: 80, supportingWeight: 6, maxConfidence: 97,
    descriptionKo: '우안 망막 박리.',
    treatmentHintKo: '삼출성: 원인 치료(혈압 조절, 항염증).',
    ddx: ['hypertensive_retinopathy', 'chorioretinitis_od'],
  },
  {
    diagnosisID: 'retinal_detachment_os', diagnosisName: 'Retinal Detachment (OS)', diagnosisNameKo: '망막 박리 (좌안)',
    category: 'retina',
    requiredSigns: ['retinal_detachment_os'],
    supportingSigns: ['subretinal_fluid_os', 'retinal_hemorrhage_os', 'hypertensive_retinopathy_suspect', 'blind_os'],
    baseConfidence: 80, supportingWeight: 6, maxConfidence: 97,
    descriptionKo: '좌안 망막 박리.',
    treatmentHintKo: '삼출성: 원인 치료(혈압 조절, 항염증).',
    ddx: ['hypertensive_retinopathy', 'chorioretinitis_os'],
  },
  {
    diagnosisID: 'hypertensive_retinopathy', diagnosisName: 'Hypertensive Retinopathy', diagnosisNameKo: '고혈압성 망막병증',
    category: 'retina',
    requiredSigns: ['hypertensive_retinopathy_suspect'],
    supportingSigns: ['retinal_hemorrhage_od', 'retinal_detachment_od', 'retinal_hemorrhage_os', 'retinal_detachment_os', 'bilateral_blindness', 'sudden_blindness'],
    baseConfidence: 65, supportingWeight: 10, maxConfidence: 94,
    descriptionKo: '혈압 >160~180 mmHg. 전신 질환에 의한 양안성 변화 가능성 높음.',
    treatmentHintKo: '혈압 측정 필수. Amlodipine 등 혈압약 처방.',
    ddx: ['retinal_detachment_od', 'retinal_detachment_os'],
  },
  {
    diagnosisID: 'chorioretinitis_od', diagnosisName: 'Chorioretinitis (OD)', diagnosisNameKo: '맥락망막염 (우안)',
    category: 'retina',
    requiredSigns: ['chorioretinitis_od'],
    supportingSigns: ['retinal_detachment_od', 'infectious_uveitis_suspect', 'uveitis_od'],
    baseConfidence: 75, supportingWeight: 8, maxConfidence: 94,
    descriptionKo: '우안 맥락망막염.',
    treatmentHintKo: '감염 패널 검사 시행.',
    ddx: ['pra', 'hypertensive_retinopathy'],
  },
  {
    diagnosisID: 'chorioretinitis_os', diagnosisName: 'Chorioretinitis (OS)', diagnosisNameKo: '맥락망막염 (좌안)',
    category: 'retina',
    requiredSigns: ['chorioretinitis_os'],
    supportingSigns: ['retinal_detachment_os', 'infectious_uveitis_suspect', 'uveitis_os'],
    baseConfidence: 75, supportingWeight: 8, maxConfidence: 94,
    descriptionKo: '좌안 맥락망막염.',
    treatmentHintKo: '감염 패널 검사 시행.',
    ddx: ['pra', 'hypertensive_retinopathy'],
  },
  {
    diagnosisID: 'optic_neuritis_od', diagnosisName: 'Optic Neuritis (OD)', diagnosisNameKo: '시신경염 (우안)',
    category: 'optic_nerve',
    requiredSigns: ['optic_neuritis_od'],
    supportingSigns: ['blind_od', 'rapd_od', 'plr_direct_deficit_od', 'menace_deficit_od'],
    baseConfidence: 80, supportingWeight: 7, maxConfidence: 95,
    descriptionKo: '우안 시신경염.',
    treatmentHintKo: '면역억제 치료.',
    ddx: ['papilledema_od', 'sard'],
  },
  {
    diagnosisID: 'optic_neuritis_os', diagnosisName: 'Optic Neuritis (OS)', diagnosisNameKo: '시신경염 (좌안)',
    category: 'optic_nerve',
    requiredSigns: ['optic_neuritis_os'],
    supportingSigns: ['blind_os', 'rapd_os', 'plr_direct_deficit_os', 'menace_deficit_os'],
    baseConfidence: 80, supportingWeight: 7, maxConfidence: 95,
    descriptionKo: '좌안 시신경염.',
    treatmentHintKo: '면역억제 치료.',
    ddx: ['papilledema_os', 'sard'],
  },

  // ── VISION LOSS ──────────────────────────────────────────
  {
    diagnosisID: 'bilateral_vision_loss', diagnosisName: 'Bilateral Vision Loss', diagnosisNameKo: '양안 시각 소실',
    category: 'vision_loss',
    requiredSigns: ['bilateral_blindness'],
    supportingSigns: ['sudden_blindness', 'menace_deficit_od', 'menace_deficit_os', 'blind_od', 'blind_os'],
    baseConfidence: 85, supportingWeight: 5, maxConfidence: 99,
    descriptionKo: '양안 기능적 실명 확인. 원인 감별: SARD, PRA, 고혈압, 시신경염, 망막 박리, 뇌 병변.',
    treatmentHintKo: '혈압, ERG, 뇌MRI, 감염 패널 등 추가 검사로 원인 진단.',
    ddx: ['sard', 'pra', 'hypertensive_retinopathy', 'optic_neuritis', 'retinal_detachment'],
  },

  // ── NEUROLOGICAL ─────────────────────────────────────────
  {
    diagnosisID: 'horner_syndrome_od', diagnosisName: "Horner's Syndrome (OD)", diagnosisNameKo: '호르너 증후군 (우안)',
    category: 'neurological',
    requiredSigns: ['miosis_od', 'ptosis_od', 'enophthalmos_od', 'third_eyelid_protrusion_od'],
    supportingSigns: ['horner_od'],
    baseConfidence: 85, supportingWeight: 5, maxConfidence: 98,
    descriptionKo: '우안 호르너 증후군.',
    treatmentHintKo: '원인 진단(X-ray 흉부, 신경학적 검사).',
    ddx: ['anterior_uveitis_od'],
  },
  {
    diagnosisID: 'horner_syndrome_os', diagnosisName: "Horner's Syndrome (OS)", diagnosisNameKo: '호르너 증후군 (좌안)',
    category: 'neurological',
    requiredSigns: ['miosis_os', 'ptosis_os', 'enophthalmos_os', 'third_eyelid_protrusion_os'],
    supportingSigns: ['horner_os'],
    baseConfidence: 85, supportingWeight: 5, maxConfidence: 98,
    descriptionKo: '좌안 호르너 증후군.',
    treatmentHintKo: '원인 진단(X-ray 흉부, 신경학적 검사).',
    ddx: ['anterior_uveitis_os'],
  },
]

// ============================================================
// SECTION 16: DIAGNOSIS ENGINE
// ============================================================

export function collectOphSigns(results: Record<string, string | string[]>): OphthalmicSign[] {
  const active = new Set<OphthalmicSign>()

  ophthalmicDomainSections.forEach(section => {
    section.tests.forEach(test => {
      const val = results[test.testID]
      if (val === undefined || val === null || val === '') return

      if (test.testType === 'select') {
        const opt = (test as SelectOphTest).options.find(o => o.value === val)
        opt?.signs?.forEach(s => active.add(s))
      } else if (test.testType === 'multiselect' && Array.isArray(val)) {
        const opts = (test as MultiSelectOphTest).options.filter(o => (val as string[]).includes(o.value))
        opts.forEach(o => o.signs?.forEach(s => active.add(s)))
      } else if (test.testType === 'boolean') {
        const t = test as BooleanOphTest
        if (val === 'true' && t.positiveSigns) t.positiveSigns.forEach(s => active.add(s))
        if (val === 'false' && t.negativeSigns) t.negativeSigns.forEach(s => active.add(s))
      } else if (test.testType === 'range' && typeof val === 'string') {
        const num = parseFloat(val)
        if (!isNaN(num)) {
          const t = test as RangeOphTest
          const seg = t.ranges.find(r => (r.min === null || num >= r.min) && (r.max === null || num < r.max))
          seg?.signs?.forEach(s => active.add(s))
        }
      }
    })
  })

  // bilateral blindness inference
  if (active.has('blind_od') && active.has('blind_os')) active.add('bilateral_blindness')

  return Array.from(active)
}

export function runOphDiagnosisEngine(activeSigns: OphthalmicSign[]): OphDiagnosisResult[] {
  const signSet = new Set(activeSigns)
  const results: OphDiagnosisResult[] = []

  for (const rule of ophthalmicDiagnosisRules) {
    // Check exclusions
    if (rule.exclusionSigns?.some(s => signSet.has(s))) continue

    const matched = rule.requiredSigns.filter(s => signSet.has(s))
    const missing = rule.requiredSigns.filter(s => !signSet.has(s))

    if (matched.length === 0) continue

    const matchRatio = matched.length / rule.requiredSigns.length
    if (matchRatio < 0.5) continue

    const supportMatches = rule.supportingSigns.filter(s => signSet.has(s))
    const score = Math.min(
      rule.maxConfidence,
      Math.round(rule.baseConfidence * matchRatio + supportMatches.length * rule.supportingWeight)
    )

    if (score >= 40) {
      results.push({ rule, confidenceScore: score, matchedSigns: [...matched, ...supportMatches], missingRequiredSigns: missing })
    }
  }

  return results.sort((a, b) => b.confidenceScore - a.confidenceScore)
}

export function assessVisionStatus(activeSigns: OphthalmicSign[]) {
  const s = new Set(activeSigns)
  return {
    od: s.has('blind_od') ? 'blind' : s.has('menace_deficit_od') || s.has('plr_direct_deficit_od') ? 'impaired' : 'visual' as any,
    os: s.has('blind_os') ? 'blind' : s.has('menace_deficit_os') || s.has('plr_direct_deficit_os') ? 'impaired' : 'visual' as any,
  }
}



export function buildOphChartSummary(results: Record<string, string | string[]>, treatment?: Record<string, any>): string {
  const signs = collectOphSigns(results)
  const diagnoses = runOphDiagnosisEngine(signs)
  const vision = assessVisionStatus(signs)

  const lines: string[] = ['【 안과 검사 요약 보고 】']
  
  lines.push('\n[ 1. 시각 기능 평가 ]')
  lines.push(`  • 우안(OD): ${vision.od === 'visual' ? '시력 있음 (Normal)' : vision.od === 'impaired' ? '시력 저하 (Impaired)' : '시력 소실 (Blind)'}`)
  lines.push(`  • 좌안(OS): ${vision.os === 'visual' ? '시력 있음 (Normal)' : vision.os === 'impaired' ? '시력 저하 (Impaired)' : '시력 소실 (Blind)'}`)

  if (diagnoses.length > 0) {
    lines.push('\n[ 2. 진단 및 감별 진단 (DDx) ]')
    diagnoses.slice(0, 5).forEach((d, idx) => {
      lines.push(`${idx + 1}. ${d.rule.diagnosisNameKo} (${d.confidenceScore}% 신뢰도)`)
      if (d.rule.descriptionKo) lines.push(`   ▶ 소견: ${d.rule.descriptionKo}`)
      if (d.rule.treatmentHintKo) lines.push(`   ▶ 관리: ${d.rule.treatmentHintKo}`)
      lines.push('') // 간격 추가
    })
  }

  return lines.join('\n').trim()
}

