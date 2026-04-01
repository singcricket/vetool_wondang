import type { LayoutConfig } from '@/types/echocardio/echocardio-type'

export const LAYOUT_CANINE: LayoutConfig = {
  species: 'canine',

  // ============================================================
  // Section 탭 — 검사 방법 순서
  // ============================================================
  sections: [
    {
      sectionID: 'PE',
      label: 'Physical Exam',
      groups: [{ groupID: 'PE', label: 'Physical Exam' }],
    },
    {
      sectionID: 'Radio',
      label: 'Radiology',
      groups: [
        { groupID: 'Thorax', label: 'Thorax' },
        { groupID: 'Comment', label: 'Comment' },
      ],
    },
    {
      sectionID: 'Bmode',
      label: 'B-mode',
      groups: [
        { groupID: 'MV', label: 'Mitral Valve' },
        { groupID: 'IVS', label: 'IVS' },
        { groupID: 'TV', label: 'Tricuspid Valve' },
        { groupID: 'AV', label: 'Aortic Valve' },
        { groupID: 'LVOT', label: 'LVOT' },
        { groupID: 'PV', label: 'Pulmonic Valve' },
        { groupID: 'RV', label: 'RV' },
        { groupID: 'RA', label: 'RA' },
        { groupID: 'CVC', label: 'CVC' },
        { groupID: 'Effusion', label: 'Effusion' },
        { groupID: 'LV', label: 'LV (VTI/LVEIO)' },
        { groupID: 'Comment', label: 'Comment' },
      ],
    },
    {
      sectionID: 'Objective_Evaluation',
      label: 'M-mode / Objective',
      groups: [
        { groupID: 'Mmode', label: 'M-mode' },
        { groupID: 'LA FS', label: 'LA FS' },
        { groupID: 'LA', label: 'LA' },
        { groupID: 'AO', label: 'AO' },
      ],
    },
    {
      sectionID: 'ColorDoppler',
      label: 'Color Doppler',
      groups: [
        { groupID: 'MV', label: 'MV' },
        { groupID: 'TV', label: 'TV' },
        { groupID: 'AV', label: 'AV' },
        { groupID: 'PV', label: 'PV' },
        { groupID: 'Comment', label: 'Comment' },
      ],
    },
    {
      sectionID: 'SpectralDoppler',
      label: 'Spectral Doppler',
      groups: [
        { groupID: 'MV', label: 'MV' },
        { groupID: 'TV', label: 'TV' },
        { groupID: 'PA', label: 'PA' },
        { groupID: 'AV', label: 'AV' },
        { groupID: 'Comment', label: 'Comment' },
      ],
    },
    {
      sectionID: 'TDI',
      label: 'TDI',
      groups: [
        { groupID: 'MV', label: 'MV Annulus' },
        { groupID: 'Comment', label: 'Comment' },
      ],
    },
    {
      sectionID: 'Pulmonary_Hypertension',
      label: 'Pulmonary Hypertension',
      groups: [
        { groupID: 'Pulmonary_Hypertension', label: 'PH Parameters' },
        { groupID: 'RPADi', label: 'RPADi' },
        { groupID: 'PA', label: 'PA' },
        { groupID: 'Comment', label: 'Comment' },
      ],
    },
    {
      sectionID: 'PosibilityOfPH',
      label: 'Posibility of PH',
      groups: [
        { groupID: 'Anatomic site', label: 'Anatomic Sites' },
        { groupID: 'Result', label: 'Result' },
      ],
    },
    {
      sectionID: 'ACVIM',
      label: 'ACVIM Staging',
      groups: [
        { groupID: 'ACVIM', label: 'ACVIM Stage' },
        { groupID: 'MINE_SCORE', label: 'MINE Score' },
      ],
    },
  ],

  // ============================================================
  // Anatomic 탭 — 해부학적 구조물 순서
  // ============================================================
  anatomicGroups: [
    { groupID: 'General', label: 'General / PE' },
    { groupID: 'LV', label: 'LV' },
    { groupID: 'LA', label: 'LA' },
    { groupID: 'MV', label: 'MV' },
    { groupID: 'AO', label: 'AO / AV' },
    { groupID: 'PA', label: 'PA / PV' },
    { groupID: 'RV', label: 'RV / IVS' },
    { groupID: 'RA', label: 'RA / CVC' },
    { groupID: 'TV', label: 'TV' },
    { groupID: 'TDI', label: 'TDI' },
    { groupID: 'Pericardium', label: 'Pericardium' },
    { groupID: 'Pleura', label: 'Pleura' },
  ],

  // ============================================================
  // Functional 탭 — 임상 문제 순서 (개 기준)
  // ============================================================
  functionalGroups: [
    { groupID: 'MMVD_staging', label: 'MMVD Staging' },
    { groupID: 'LA_size', label: 'LA Size' },
    { groupID: 'LA_pressure', label: 'LA Pressure' },
    { groupID: 'LV_size', label: 'LV Size' },
    { groupID: 'LV_systolic', label: 'LV Systolic Function' },
    { groupID: 'LV_diastolic', label: 'LV Diastolic Function' },
    { groupID: 'MV_morphology', label: 'MV Morphology' },
    { groupID: 'MV_regurgitation', label: 'MV Regurgitation' },
    { groupID: 'AV_disease', label: 'AV Disease' },
    { groupID: 'TV_disease', label: 'TV Disease' },
    { groupID: 'Pulmonary_Hypertension', label: 'Pulmonary Hypertension' },
    { groupID: 'PA_pressure', label: 'PA Pressure' },
    { groupID: 'PA_flow', label: 'PA Flow Pattern' },
    { groupID: 'RV_function', label: 'RV Function' },
    { groupID: 'Effusion', label: 'Effusion' },
    { groupID: 'Hemodynamics', label: 'Hemodynamics' },
    { groupID: 'Cardiomegaly', label: 'Cardiomegaly' },
  ],
}

export const LAYOUT_FELINE: LayoutConfig = {
  species: 'feline',

  // ============================================================
  // Section 탭 — 검사 방법 순서 (고양이 기준)
  // ============================================================
  sections: [
    {
      sectionID: 'PE',
      label: 'Physical Exam',
      groups: [{ groupID: 'PE', label: 'Physical Exam' }],
    },
    {
      sectionID: 'Radio',
      label: 'Radiology',
      groups: [
        { groupID: 'Thorax', label: 'Thorax' },
        { groupID: 'Comment', label: 'Comment' },
      ],
    },
    {
      sectionID: 'Bmode',
      label: 'B-mode',
      groups: [
        { groupID: 'MV', label: 'Mitral Valve' },
        { groupID: 'IVS', label: 'IVS' },
        { groupID: 'TV', label: 'Tricuspid Valve' },
        { groupID: 'AV', label: 'Aortic Valve' },
        { groupID: 'LVOT', label: 'LVOT' },
        { groupID: 'PV', label: 'Pulmonic Valve' },
        { groupID: 'RV', label: 'RV' },
        { groupID: 'RA', label: 'RA' },
        { groupID: 'CVC', label: 'CVC' },
        { groupID: 'Effusion', label: 'Effusion' },
        { groupID: 'Comment', label: 'Comment' },
      ],
    },
    {
      sectionID: 'Objective_Evaluation',
      label: 'M-mode / Objective',
      groups: [
        { groupID: 'Mmode', label: 'M-mode' },
        { groupID: 'LA FS', label: 'LA FS' },
        { groupID: 'LA', label: 'LA' },
        { groupID: 'AO', label: 'AO' },
      ],
    },
    {
      sectionID: 'HCM_Evaluation', // 고양이 전용 섹션
      label: 'HCM Evaluation',
      groups: [
        { groupID: 'HCM', label: 'HCM Parameters' },
        { groupID: 'Comment', label: 'Comment' },
      ],
    },
    {
      sectionID: 'ColorDoppler',
      label: 'Color Doppler',
      groups: [
        { groupID: 'MV', label: 'MV' },
        { groupID: 'TV', label: 'TV' },
        { groupID: 'AV', label: 'AV' },
        { groupID: 'PV', label: 'PV' },
        { groupID: 'Comment', label: 'Comment' },
      ],
    },
    {
      sectionID: 'SpectralDoppler',
      label: 'Spectral Doppler',
      groups: [
        { groupID: 'MV', label: 'MV' },
        { groupID: 'TV', label: 'TV' },
        { groupID: 'PA', label: 'PA' },
        { groupID: 'AV', label: 'AV' },
        { groupID: 'Comment', label: 'Comment' },
      ],
    },
    {
      sectionID: 'TDI',
      label: 'TDI',
      groups: [
        { groupID: 'MV', label: 'MV Annulus' },
        { groupID: 'Comment', label: 'Comment' },
      ],
    },
    {
      sectionID: 'Pulmonary_Hypertension',
      label: 'Pulmonary Hypertension',
      groups: [
        { groupID: 'Pulmonary_Hypertension', label: 'PH Parameters' },
        { groupID: 'RPADi', label: 'RPADi' },
        { groupID: 'PA', label: 'PA' },
        { groupID: 'Comment', label: 'Comment' },
      ],
    },
    {
      sectionID: 'PosibilityOfPH',
      label: 'Posibility of PH',
      groups: [
        { groupID: 'Anatomic site', label: 'Anatomic Sites' },
        { groupID: 'Result', label: 'Result' },
      ],
    },
    // ACVIM / MINE 없음
  ],

  // ============================================================
  // Anatomic 탭 — 해부학적 구조물 순서 (개와 동일)
  // ============================================================
  anatomicGroups: [
    { groupID: 'General', label: 'General / PE' },
    { groupID: 'LV', label: 'LV' },
    { groupID: 'LA', label: 'LA' },
    { groupID: 'MV', label: 'MV' },
    { groupID: 'AO', label: 'AO / AV' },
    { groupID: 'PA', label: 'PA / PV' },
    { groupID: 'RV', label: 'RV / IVS' },
    { groupID: 'RA', label: 'RA / CVC' },
    { groupID: 'TV', label: 'TV' },
    { groupID: 'TDI', label: 'TDI' },
    { groupID: 'Pericardium', label: 'Pericardium' },
    { groupID: 'Pleura', label: 'Pleura' },
  ],

  // ============================================================
  // Functional 탭 — 임상 문제 순서 (고양이 기준)
  // ============================================================
  functionalGroups: [
    { groupID: 'HCM_evaluation', label: 'HCM Evaluation' }, // 고양이 최우선
    { groupID: 'LA_size', label: 'LA Size' },
    { groupID: 'LA_pressure', label: 'LA Pressure' },
    { groupID: 'LV_size', label: 'LV Size' },
    { groupID: 'LV_systolic', label: 'LV Systolic Function' },
    { groupID: 'LV_diastolic', label: 'LV Diastolic Function' },
    { groupID: 'MV_morphology', label: 'MV Morphology' },
    { groupID: 'MV_regurgitation', label: 'MV Regurgitation' },
    { groupID: 'AV_disease', label: 'AV Disease' },
    { groupID: 'TV_disease', label: 'TV Disease' },
    { groupID: 'Pulmonary_Hypertension', label: 'Pulmonary Hypertension' },
    { groupID: 'PA_pressure', label: 'PA Pressure' },
    { groupID: 'PA_flow', label: 'PA Flow Pattern' },
    { groupID: 'RV_function', label: 'RV Function' },
    { groupID: 'Effusion', label: 'Effusion' },
    { groupID: 'Hemodynamics', label: 'Hemodynamics' },
    { groupID: 'Cardiomegaly', label: 'Cardiomegaly' },
    // MMVD_staging 없음
  ],
}
