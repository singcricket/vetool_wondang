export type CheckupImageTag = {
  id: string
  label: string
}

export type CheckupImageTagGroup = {
  group: string
  label: string
  color: string
  tags: CheckupImageTag[]
}

export const CHECKUP_IMAGE_TAG_GROUPS: CheckupImageTagGroup[] = [
  {
    group: 'cover',
    label: '대표사진',
    color: 'amber',
    tags: [{ id: 'cover', label: '표지 / 대표사진' }],
  },
  {
    group: 'physical',
    label: '신체검사',
    color: 'slate',
    tags: [
      { id: 'physical_general', label: '전신' },
      { id: 'physical_skin', label: '피부' },
      { id: 'physical_ear', label: '귀' },
      { id: 'physical_lymph', label: '림프절' },
      { id: 'physical_respiratory', label: '호흡기' },
      { id: 'physical_musculoskeletal', label: '근골격' },
    ],
  },
  {
    group: 'dental',
    label: '치과',
    color: 'blue',
    tags: [
      { id: 'dental', label: '치과' },
      { id: 'dental_radio', label: '치과 방사선' },
    ],
  },
  {
    group: 'ophthalmic',
    label: '안과',
    color: 'purple',
    tags: [
      { id: 'ophthalmic_od', label: '안과 우안(OD)' },
      { id: 'ophthalmic_os', label: '안과 좌안(OS)' },
    ],
  },
  {
    group: 'neuro',
    label: '신경계',
    color: 'indigo',
    tags: [{ id: 'neuro', label: '신경계 검사' }],
  },
  {
    group: 'xray',
    label: '방사선 (X-ray)',
    color: 'yellow',
    tags: [
      { id: 'xray_thorax', label: '방사선 흉부' },
      { id: 'xray_abdomen', label: '방사선 복부' },
      { id: 'xray_extremity', label: '방사선 사지' },
      { id: 'xray_skull', label: '방사선 두개골' },
      { id: 'xray_spine', label: '방사선 척추' },
    ],
  },
  {
    group: 'ultrasound',
    label: '복부 초음파',
    color: 'teal',
    tags: [
      { id: 'ultrasound', label: '초음파' },
    ],
  },
  {
    group: 'organ',
    label: '장기 (초음파·방사선 조합)',
    color: 'green',
    tags: [
      { id: 'organ_liver',           label: '간' },
      { id: 'organ_gallbladder',     label: '담낭' },
      { id: 'organ_spleen',          label: '비장' },
      { id: 'organ_pancreas',        label: '췌장' },
      { id: 'organ_left_kidney',     label: '좌측 신장' },
      { id: 'organ_right_kidney',    label: '우측 신장' },
      { id: 'organ_urinary_bladder', label: '방광' },
      { id: 'organ_left_adrenal',    label: '좌측 부신' },
      { id: 'organ_right_adrenal',   label: '우측 부신' },
      { id: 'organ_stomach',         label: '위' },
      { id: 'organ_duodenum',        label: '십이지장' },
      { id: 'organ_small_intestine', label: '소장' },
      { id: 'organ_colon',           label: '결장' },
      { id: 'organ_gi_tract',        label: '위장관 전반' },
      { id: 'organ_lymph_node',      label: '복강 림프절' },
      { id: 'organ_free_fluid',      label: '복강 유리액' },
    ],
  },
  {
    group: 'echo',
    label: '심장초음파 (Echo)',
    color: 'rose',
    tags: [
      { id: 'echo_overview', label: 'Echo 전체' },
      { id: 'echo_lv', label: 'Echo 좌심실' },
      { id: 'echo_la', label: 'Echo 좌심방' },
      { id: 'echo_mv', label: 'Echo 이첨판(승모판)' },
      { id: 'echo_av', label: 'Echo 대동맥판' },
      { id: 'echo_rv_ra', label: 'Echo 우심/삼첨판' },
      { id: 'echo_pericardium', label: 'Echo 심낭' },
      { id: 'echo_doppler', label: 'Echo 도플러' },
      { id: 'echo_mmode', label: 'Echo M-mode' },
    ],
  },
  {
    group: 'ct_mri',
    label: 'CT / MRI / 내시경',
    color: 'red',
    tags: [
      { id: 'ct', label: 'CT' },
      { id: 'mri', label: 'MRI' },
      { id: 'endoscopy', label: '내시경' },
    ],
  },
]

export const ALL_CHECKUP_TAGS: CheckupImageTag[] = CHECKUP_IMAGE_TAG_GROUPS.flatMap(
  (g) => g.tags,
)
export const ALL_CHECKUP_TAG_IDS = ALL_CHECKUP_TAGS.map((t) => t.id)
export const CHECKUP_TAG_LABEL: Record<string, string> = Object.fromEntries(
  ALL_CHECKUP_TAGS.map((t) => [t.id, t.label]),
)

const GROUP_COLOR_MAP: Record<string, string> = Object.fromEntries(
  CHECKUP_IMAGE_TAG_GROUPS.map((g) => [g.group, g.color]),
)
const TAG_GROUP_MAP: Record<string, string> = Object.fromEntries(
  CHECKUP_IMAGE_TAG_GROUPS.flatMap((g) => g.tags.map((t) => [t.id, g.group])),
)
export function getTagColor(tagId: string): string {
  return GROUP_COLOR_MAP[TAG_GROUP_MAP[tagId]] ?? 'slate'
}

// Tailwind safe-list classes per color
export const TAG_COLOR_CLASS: Record<string, string> = {
  amber:  'bg-amber-100 text-amber-800',
  slate:  'bg-slate-100 text-slate-700',
  blue:   'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  teal:   'bg-teal-100 text-teal-800',
  rose:   'bg-rose-100 text-rose-800',
  red:    'bg-red-100 text-red-800',
  green:  'bg-green-100 text-green-800',
}
