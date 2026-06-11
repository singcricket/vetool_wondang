// ============================================================
// checkup-report-modules.ts
// 건강검진 리포트 장기계통별 모듈 설정
//
// 설계 원칙:
//   • 데이터 주도형 렌더링 — 데이터가 있는 섹션만 표시
//   • richness 3단계: full(AI평가+검사값) / partial(검사값만) / absent(미표시)
//   • 동일 lab 항목이 여러 장기 모듈에 중복 표시 가능 (e.g. phos → 신장+근골격)
// ============================================================

import type { LabSection, LabResultItem } from '@/constants/hospital/checkup/lab-types'
import type { DxEvaluation } from '@/lib/actions/checkup/plan-analysis'
import { physicalRefMap } from '@/constants/hospital/checkup/physical-ref'
import { xrayFindingMap, xrayMeasurementMap, interpretXrayMeasurement } from '@/constants/hospital/checkup/xray-ref'
import { labRefMap } from '@/constants/hospital/checkup/lab-ref'

export type OrganRichness = 'full' | 'partial' | 'absent'

export interface PhysicalFinding {
  id: string
  nameKo: string
  value: string
  referenceRange?: string
  isAbnormal: boolean
}

export interface XrayOrganFinding {
  id: string
  label: string
  type: 'finding' | 'measurement'
  /** 계측값일 때 "10.5v · 경도 심장비대" 형태로 표시 */
  valueLabel?: string
  severity: 'mild' | 'moderate' | 'severe'
  isNormal?: boolean
  ownerMessage: string
}

export interface OrganModuleConfig {
  key: string
  label: string
  /** plan section data의 AI 평가 key */
  planKey: string
  /** 이 section 태그를 가진 lab 항목을 포함 */
  labSections: LabSection[]
  /** section 무관하게 포함할 특정 lab ID */
  labIds: string[]
  /** 관련 이미지 태그 (startsWith 매칭) */
  imageTags: string[]
  /** 관련 영상검사 section key */
  imagingSectionKeys: string[]
  /** 관련 신체검사 field ID (physical-ref.ts의 id) */
  physicalIds: string[]
  /** 관련 X-ray 체크박스 소견 ID (xray-ref.ts의 finding id) */
  xrayFindingIds: string[]
  /** 관련 X-ray 계측 항목 ID (vhs, vlas 등) */
  xrayMeasurementIds: string[]
  /** 정상 체크 시 리포트에 표시할 카테고리 normal key (xray_normal_{catId}) */
  xrayCategoryNormalIds: string[]
}

export type { DxEvaluation }

export interface UsOrganNote {
  organKey: string
  label: string
  note: string
}

export interface ResolvedOrganSection extends OrganModuleConfig {
  labItems: LabResultItem[]
  physicalFindings: PhysicalFinding[]
  xrayFindings: XrayOrganFinding[]
  /** 구조화 DxEvaluation 또는 구버전 string */
  aiEval: DxEvaluation | string
  images: { id: string; img_url: string; tags: string[]; img_memo?: string | null; mark?: Record<string, unknown> | null; is_cover?: boolean }[]
  richness: Exclude<OrganRichness, 'absent'>
  usNotes: UsOrganNote[]
  /** 모듈별 추가 raw 데이터 (derma 섹션 등 커스텀 렌더링용) */
  extraData?: Record<string, unknown>
}

// ── 장기계통 모듈 정의 ────────────────────────────────────────
//
// labSections: lab-types.ts의 LabSection 값과 일치해야 함
// labIds: 특정 항목을 section과 무관하게 포함 (cross-section 항목)
// imageTags: checkup_images.tags 배열의 값과 일치해야 함
//
export const ORGAN_MODULE_CONFIGS: OrganModuleConfig[] = [
  // ── 혈액학 ─────────────────────────────────────────────────
  {
    key: 'blood',
    label: '혈액학',
    planKey: 'dx_cbc',
    labSections: ['cbc', 'coagulation'],
    labIds: ['crp'],
    imageTags: [],
    imagingSectionKeys: [],
    physicalIds: ['mmc', 'crt', 'mucous_moisture'],
    xrayFindingIds: ['splenomegaly'],
    xrayMeasurementIds: [],
    xrayCategoryNormalIds: [],
  },

  // ── 간·담도계 ───────────────────────────────────────────────
  {
    key: 'liver',
    label: '간·담도계',
    planKey: 'dx_hepatobiliary',
    labSections: ['liver'],
    labIds: ['tp', 'alb', 'glob', 'bile_acid', 'nh3', 'bun', 'chol'],
    imageTags: ['organ_liver', 'organ_spleen', 'organ_gallbladder'],
    imagingSectionKeys: ['ultrasound_basic'],
    physicalIds: ['liver_size', 'abdominal_palpation', 'abdominal_pain'],
    xrayFindingIds: ['hepatomegaly', 'microhepatica', 'ascites'],
    xrayMeasurementIds: [],
    xrayCategoryNormalIds: ['xray_normal_abdomen'],
  },

  // ── 신장·비뇨기계 ───────────────────────────────────────────
  {
    key: 'kidney',
    label: '신장·비뇨기계',
    planKey: 'dx_urogenital',
    labSections: ['kidney', 'urinalysis'],
    labIds: ['sdma', 'phos', 'ca'],
    imageTags: ['organ_left_kidney', 'organ_right_kidney', 'organ_urinary_bladder'],
    imagingSectionKeys: ['ultrasound_basic'],
    physicalIds: ['bladder', 'systolic_bp'],
    xrayFindingIds: ['renomegaly', 'small_kidney', 'vesical_calculi', 'nephrolithiasis'],
    xrayMeasurementIds: [],
    xrayCategoryNormalIds: ['xray_normal_abdomen'],
  },

  // ── 췌장·소화기계 ───────────────────────────────────────────
  {
    key: 'pancreas',
    label: '췌장·소화기계',
    planKey: 'dx_gi',
    labSections: ['pancreas'],
    labIds: ['pli_dog', 'pli_cat', 'tli', 'b12_cobalamin', 'folate', 'na', 'k', 'cl'],
    imageTags: ['organ_pancreas', 'organ_stomach', 'organ_duodenum', 'organ_small_intestine', 'organ_colon', 'organ_gi_tract', 'organ_lymph_node', 'organ_free_fluid'],
    imagingSectionKeys: ['ultrasound_basic'],
    physicalIds: ['abdominal_palpation', 'abdominal_pain', 'intestinal_loops'],
    xrayFindingIds: ['abdominal_mass', 'foreign_body', 'ileus', 'abdominal_calcification'],
    xrayMeasurementIds: [],
    xrayCategoryNormalIds: ['xray_normal_abdomen'],
  },

  // ── 심혈관·호흡기계 ─────────────────────────────────────────
  {
    key: 'cardio',
    label: '심혈관·호흡기계',
    planKey: 'dx_cardio_resp',
    labSections: ['blood_gas'],
    labIds: ['nt_probnp'],
    imageTags: ['echo', 'xray_thorax', 'organ_heart', 'organ_lung'],
    imagingSectionKeys: ['echo_basic', 'xray'],
    physicalIds: [
      'heart_rhythm', 'heart_murmur', 'murmur_location', 'pulse_quality', 'jugular_distension',
      'respiratory_effort', 'lung_sounds_left', 'lung_sounds_right', 'respiratory_pattern',
    ],
    xrayFindingIds: [
      'bronchial_pattern', 'interstitial_pattern', 'alveolar_pattern',
      'left_heart_enlargement', 'right_heart_enlargement', 'generalized_cardiomegaly',
      'tracheal_elevation', 'tracheal_narrowing',
      'pleural_effusion', 'pneumothorax', 'pulmonary_nodule', 'pulmonary_calcification',
      'diaphragm_abnormality', 'mediastinal_abnormality',
    ],
    xrayMeasurementIds: ['vhs', 'vlas'],
    xrayCategoryNormalIds: ['xray_normal_thorax'],
  },

  // ── 내분비계 ────────────────────────────────────────────────
  {
    key: 'endocrine',
    label: '내분비계',
    planKey: 'dx_endocrine',
    labSections: ['endocrine', 'thyroid'],
    labIds: ['glu', 'fructosamine', 'chol', 'trig'],
    imageTags: ['organ_left_adrenal', 'organ_right_adrenal'],
    imagingSectionKeys: ['ultrasound_basic'],
    physicalIds: ['bcs', 'mcs', 'weight_change'],
    xrayFindingIds: ['prostatomegaly'],
    xrayMeasurementIds: [],
    xrayCategoryNormalIds: ['xray_normal_abdomen'],
  },

  // ── 지질·대사 ───────────────────────────────────────────────
  {
    key: 'metabolism',
    label: '지질·대사',
    planKey: 'dx_metabolism',
    labSections: ['lipid'],
    labIds: ['chol', 'trig'],
    imageTags: [],
    imagingSectionKeys: [],
    physicalIds: ['bcs', 'weight_change'],
    xrayFindingIds: [],
    xrayMeasurementIds: [],
    xrayCategoryNormalIds: [],
  },

  // ── 전해질·미네랄 ──────────────────────────────────────────
  {
    key: 'electrolyte',
    label: '전해질·미네랄',
    planKey: 'dx_electrolyte',
    labSections: ['electrolyte', 'blood_gas'],
    labIds: ['na', 'k', 'cl'],
    imageTags: [],
    imagingSectionKeys: [],
    physicalIds: ['skin_turgor', 'dehydration_estimate'],
    xrayFindingIds: [],
    xrayMeasurementIds: [],
    xrayCategoryNormalIds: [],
  },

  // ── 근골격계 ────────────────────────────────────────────────
  {
    key: 'musculoskeletal',
    label: '근골격계',
    planKey: 'dx_musculoskeletal',
    labSections: [],
    labIds: ['ca', 'phos', 'mg'],
    imageTags: ['xray_extremity', 'xray_spine', 'physical_musculoskeletal'],
    imagingSectionKeys: ['xray', 'ct_mri'],
    physicalIds: ['gait', 'posture', 'muscle_atrophy', 'joint_swelling', 'joint_detail', 'spinal_pain', 'mcs'],
    xrayFindingIds: [
      'degenerative_joint', 'osteoproliferation', 'osteolysis', 'fracture', 'luxation',
      'soft_tissue_swelling', 'bone_density_decreased',
      'ivdd_calcification', 'spondylosis', 'disc_space_narrowing',
      'vertebral_body_change', 'transitional_vertebra',
    ],
    xrayMeasurementIds: [],
    xrayCategoryNormalIds: ['xray_normal_extremity', 'xray_normal_spine'],
  },

  // ── 피부·귀 (Dermatology) ──────────────────────────────────
  {
    key: 'derma',
    label: '피부·귀',
    planKey: 'dx_derma',
    labSections: [],
    labIds: [],
    imageTags: ['organ_skin', 'organ_ear', 'skin_lesion_'],
    imagingSectionKeys: [],
    physicalIds: [],
    xrayFindingIds: ['tympanic_bulla_opacity'],
    xrayMeasurementIds: [],
    xrayCategoryNormalIds: ['xray_normal_skull'],
  },

  // ── 구강 ────────────────────────────────────────────────────
  {
    key: 'oral',
    label: '구강',
    planKey: 'dx_oral',
    labSections: [],
    labIds: [],
    imageTags: ['dental', 'dental_radio'],
    imagingSectionKeys: [],
    physicalIds: [],
    xrayFindingIds: ['nasal_opacity', 'dental_lesion'],
    xrayMeasurementIds: [],
    xrayCategoryNormalIds: ['xray_normal_skull'],
  },

  // ── 안과 ────────────────────────────────────────────────────
  {
    key: 'ophthalmic',
    label: '안과',
    planKey: 'dx_ophthalmic',
    labSections: [],
    labIds: [],
    imageTags: ['ophthalmic_od', 'ophthalmic_os'],
    imagingSectionKeys: [],
    physicalIds: [],
    xrayFindingIds: [],
    xrayMeasurementIds: [],
    xrayCategoryNormalIds: [],
  },

  // ── 신경계 ──────────────────────────────────────────────────
  {
    key: 'neuro',
    label: '신경계',
    planKey: 'dx_neuro',
    labSections: [],
    labIds: [],
    imageTags: ['neuro', 'ct', 'mri'],
    imagingSectionKeys: ['ct_mri'],
    physicalIds: ['mentation_status', 'pain_assessment', 'posture', 'gait'],
    xrayFindingIds: ['vertebral_fracture', 'spinal_canal_narrowing', 'skull_lesion'],
    xrayMeasurementIds: [],
    xrayCategoryNormalIds: ['xray_normal_spine', 'xray_normal_skull'],
  },
]

// ── 초음파 장기명 한글 매핑 ──────────────────────────────────
const US_ORGAN_NAME_KO: Record<string, string> = {
  liver:           '간',
  gallbladder:     '담낭 및 담도계',
  spleen:          '비장',
  pancreas:        '췌장',
  left_kidney:     '좌측 신장',
  right_kidney:    '우측 신장',
  urinary_bladder: '방광',
  left_adrenal:    '좌측 부신',
  right_adrenal:   '우측 부신',
  stomach:         '위',
  duodenum:        '십이지장',
  small_intestine: '소장',
  colon:           '결장',
  gi_tract:        '위장관 전반',
  lymph_node:      '복강 림프절',
  free_fluid:      '복강 내 유리액',
}

// ── 풍부도 결정 헬퍼 ─────────────────────────────────────────

// 신체검사에서 "정상"으로 간주하는 기본값 패턴 (이 값들은 findings로 표시 안 함)
const PHYSICAL_NORMAL_PATTERNS = [
  '정상', 'BAR', 'QAR', '없음', '정상 범위', '정상/촉진 불가',
  '검사 미실시', '미실시', '해당 없음', '<5% (임상 징후 없음)',
  '정규', // 심장 리듬 "정규 (Regular)"
]
function isPhysicalNormal(value: string): boolean {
  return PHYSICAL_NORMAL_PATTERNS.some((p) => value.includes(p))
}

/**
 * 전체 lab/plan/images/physical/xray 데이터를 받아 각 장기 모듈의 풍부도를 결정하고,
 * absent(데이터 없음)인 모듈은 제거한 배열을 반환한다.
 */
export function resolveOrganSections(
  allLabItems: LabResultItem[],
  planData: Record<string, unknown>,
  allImages: { id: string; img_url: string; tags: string[]; img_memo?: string | null; mark?: Record<string, unknown> | null; is_cover?: boolean }[],
  configs: OrganModuleConfig[] = ORGAN_MODULE_CONFIGS,
  physicalData: Record<string, unknown> = {},
  xrayData: Record<string, unknown> = {},
  species: 'dog' | 'cat' = 'dog',
  imagingSections: Record<string, Record<string, unknown>> = {},
  /** 모듈 key → 추가 raw 섹션 데이터 (커스텀 렌더링용) */
  extraSectionData: Record<string, Record<string, unknown>> = {},
): ResolvedOrganSection[] {
  // xray checked 소견 맵 (checked: { [id]: true })
  const xrayChecked = (xrayData.checked ?? {}) as Record<string, boolean>

  return configs.reduce<ResolvedOrganSection[]>((acc, config) => {
    const labItems = allLabItems
      .filter(
        (item) =>
          !!item.value &&
          (
            config.labSections.some((s) => item.section?.includes(s)) ||
            config.labIds.includes(item.id)
          ),
      )
      .map((item) => {
        const ref = labRefMap[item.id]
        if (!ref?.descriptionKo || item.descriptionKo) return item
        return { ...item, descriptionKo: ref.descriptionKo }
      })

    // 신체검사 소견 — 값이 있고 정상 패턴이 아닌 항목만 포함
    const physicalFindings: PhysicalFinding[] = config.physicalIds.reduce<PhysicalFinding[]>(
      (findings, pid) => {
        const rawVal = physicalData[pid]
        if (!rawVal || typeof rawVal !== 'string' || !rawVal.trim()) return findings
        const ref = physicalRefMap[pid]
        if (!ref) return findings
        const isAbnormal = !isPhysicalNormal(rawVal)
        findings.push({
          id: pid,
          nameKo: ref.nameKo,
          value: rawVal,
          referenceRange: ref.referenceRange?.common ?? ref.referenceRange?.dog,
          isAbnormal,
        })
        return findings
      },
      [],
    )

    // 방사선 체크박스 소견
    const xrayFindings: XrayOrganFinding[] = []

    // 카테고리 정상 소견 — normal 체크 시 이상 소견 대신 정상 표시
    const NORMAL_LABEL: Record<string, string> = {
      xray_normal_thorax:    '흉부 방사선 특이 소견 없음',
      xray_normal_abdomen:   '복부 방사선 특이 소견 없음',
      xray_normal_extremity: '사지 방사선 특이 소견 없음',
      xray_normal_skull:     '두개골 방사선 특이 소견 없음',
      xray_normal_spine:     '척추 방사선 특이 소견 없음',
    }
    for (const normalId of config.xrayCategoryNormalIds) {
      if (!xrayChecked[normalId]) continue
      xrayFindings.push({
        id: normalId,
        label: NORMAL_LABEL[normalId] ?? '방사선 특이 소견 없음',
        type: 'finding',
        severity: 'mild',
        isNormal: true,
        ownerMessage: '방사선 검사에서 특이 소견이 관찰되지 않았습니다.',
      })
    }

    for (const fid of config.xrayFindingIds) {
      if (!xrayChecked[fid]) continue
      const ref = xrayFindingMap[fid]
      if (!ref) continue
      xrayFindings.push({
        id: fid,
        label: ref.label,
        type: 'finding',
        severity: ref.severity,
        ownerMessage: ref.ownerMessage,
      })
    }

    // 방사선 계측 소견 (VHS, VLAS 등) — 값이 있으면 정상/이상 모두 포함
    for (const mid of config.xrayMeasurementIds) {
      const rawVal = xrayData[mid]
      if (rawVal === undefined || rawVal === null || rawVal === '') continue
      const numVal = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal))
      if (isNaN(numVal)) continue
      const mRef = xrayMeasurementMap[mid]
      if (!mRef) continue
      const interp = interpretXrayMeasurement(mRef, numVal, species)
      if (!interp) continue
      xrayFindings.push({
        id: mid,
        label: mRef.nameKo,
        type: 'measurement',
        valueLabel: `${numVal}${mRef.unit} · ${interp.resultTextKo}`,
        severity: interp.severity ?? 'mild',
        isNormal: !interp.isAbnormal,
        ownerMessage: numVal > (typeof mRef.ranges[species][0].max === 'number' ? (mRef.ranges[species][0].max ?? 0) : 0)
          ? mRef.ownerMessage.increase
          : mRef.ownerMessage.decrease,
      })
    }

    // 초음파 장기별 소견 추출
    const usNotes: UsOrganNote[] = []
    for (const sectionKey of config.imagingSectionKeys) {
      if (sectionKey !== 'ultrasound_basic') continue
      const usData = imagingSections[sectionKey]
      if (!usData) continue
      const organNotesData =
        (usData.organ_notes_owner as Record<string, string> | undefined) ??
        (usData.organ_notes as Record<string, string> | undefined)
      if (!organNotesData) continue
      for (const tag of config.imageTags) {
        if (!tag.startsWith('organ_')) continue
        const organKey = tag.slice(6) // 'organ_liver' → 'liver'
        const note = organNotesData[organKey]
        if (note?.trim()) {
          usNotes.push({ organKey, label: US_ORGAN_NAME_KO[organKey] ?? organKey, note: note.trim() })
        }
      }
    }

    const rawEval = planData[config.planKey]
    const aiEval: DxEvaluation | string =
      rawEval && typeof rawEval === 'object' && 'status' in rawEval
        ? (rawEval as DxEvaluation)
        : typeof rawEval === 'string'
          ? rawEval
          : ''

    const images = allImages.filter(
      (img) => config.imageTags.some((tag) => img.tags?.some((t) => t.startsWith(tag))),
    )

    const hasAi = typeof aiEval === 'object' ? !!aiEval.summary : !!aiEval
    // DxEvaluation 객체가 존재하면 summary가 비어도 "데이터 있음"으로 처리 (정상 소견 카드 표시)
    const hasAiOrDx = typeof aiEval === 'object' || !!aiEval
    // derma: extraData(physical 병합 데이터)에 기록이 있으면 이미지·AI 없어도 표시
    const hasExtraData = !!extraSectionData[config.key] && Object.values(extraSectionData[config.key]).some((v) => v)
    if (labItems.length === 0 && physicalFindings.length === 0 && xrayFindings.length === 0 && !hasAiOrDx && images.length === 0 && usNotes.length === 0 && !hasExtraData) return acc

    const richness: Exclude<OrganRichness, 'absent'> = hasAi ? 'full' : 'partial'
    const extraData = extraSectionData[config.key]

    acc.push({ ...config, labItems, physicalFindings, xrayFindings, aiEval, images, richness, usNotes, ...(extraData ? { extraData } : {}) })
    return acc
  }, [])
}

// ── 임상병리 표 그룹 정의 ────────────────────────────────────
//
// 리포트 상단 "임상병리 검사 결과" 섹션의 테이블 그룹 순서
//
export interface LabTableGroup {
  title: string
  section: LabSection
}

export const LAB_TABLE_GROUPS: LabTableGroup[] = [
  { title: '혈액검사 (CBC)',  section: 'cbc'        },
  { title: '혈청화학',        section: 'chemistry'  },
  { title: '내분비',          section: 'endocrine'  },
  { title: '요검사',          section: 'urinalysis' },
  { title: '특수검사',        section: 'special'    },
]

// ── 영상검사 섹션 정의 ───────────────────────────────────────

export interface ImagingSectionConfig {
  key: string
  label: string
  /** 이미지 태그 prefix 목록 — t.startsWith(prefix) 로 매칭 */
  imageTagPrefixes: string[]
  purpose: string  // 보호자용 검사 목적 설명
}

export const IMAGING_SECTION_CONFIGS: ImagingSectionConfig[] = [
  {
    key: 'xray',
    label: '방사선 (X-ray)',
    imageTagPrefixes: ['xray'],
    purpose: '뼈와 흉부(심장·폐), 복부 장기의 크기와 형태를 평가합니다. 특히 심장 비대, 폐 병변, 뼈 이상, 방광 결석 등을 확인하는 데 유용합니다.',
  },
  {
    key: 'ultrasound_basic',
    label: '복부 초음파',
    imageTagPrefixes: ['us'],
    purpose: '간·신장·비장·방광·췌장·위장관 등 복부 장기의 내부 구조를 실시간으로 확인합니다. 종양, 결석, 낭종, 염증, 복수 등을 방사선보다 정밀하게 평가할 수 있습니다.',
  },
  {
    key: 'echo_basic',
    label: '심장 초음파',
    imageTagPrefixes: ['echo'],
    purpose: '심장의 크기, 두께, 판막 기능, 혈류 속도를 실시간으로 평가합니다. 심장병(판막 질환, 심근병증, 심낭삼출) 진단과 중증도 평가에 필수적인 검사입니다.',
  },
  {
    key: 'ct_mri',
    label: 'CT / MRI / 내시경',
    imageTagPrefixes: ['ct', 'mri', 'endoscopy'],
    purpose: 'CT는 뼈·혈관·종양의 3차원 정밀 평가에, MRI는 뇌·척수 등 신경계 이상 평가에 활용합니다. 내시경은 위장·기관지 내부를 직접 확인하고 조직 채취가 가능합니다.',
  },
]
