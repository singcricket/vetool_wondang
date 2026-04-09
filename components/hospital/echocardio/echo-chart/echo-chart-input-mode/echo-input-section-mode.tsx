import { ECHO_SECTION_META } from '@/constants/hospital/echocardio/echo-sections'
import { LAYOUT_CANINE, LAYOUT_FELINE } from '@/constants/hospital/echocardio/echo-layouts'
import { EchoSection, EchoTemplate, Species } from '@/types/echocardio/echocardio-type'
import EchoSectionWrapper from '../../echo-sections/echo-section-wrapper'

interface Props {
  species: Species
  settings: EchoTemplate
  getSectionItems: (section: EchoSection) => any[]
  SECTION_MAPPING: Record<string, string>
  sharedInputProps: {
    resultMap: Record<string, string>
    computedResults: Record<string, { result: string; comment: string }>
    mmodeRefs: Record<string, [number, number] | null>
    onItemChange: (keywordId: string, value: string) => void
  }
}

export default function EchoInputSectionMode({
  species,
  settings,
  getSectionItems,
  SECTION_MAPPING,
  sharedInputProps,
}: Props) {
  const sectionOrderFromSettings = (settings.section_order as EchoSection[]) || []

  // 종별 허용된 섹션 목록 (레이아웃 기준)
  const speciesLayout = species === 'feline' ? LAYOUT_FELINE : LAYOUT_CANINE
  const speciesAllowedSections = new Set(speciesLayout.sections.map((s) => s.sectionID))

  // 종별 기본 섹션 순서 적용
  const speciesDefaultOrder = speciesLayout.sections.map((s) => s.sectionID) as EchoSection[]

  const combinedSectionOrder = Array.from(
    new Set([...sectionOrderFromSettings, ...speciesDefaultOrder]),
  )

  const targetSections = combinedSectionOrder
    .map((s) => (SECTION_MAPPING[s] || s) as EchoSection)
    .filter((s) => speciesAllowedSections.has(s)) // 현재 종 레이아웃에 포함된 섹션만 노출
    .filter((s, index, self) => self.indexOf(s) === index)

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-32">
      <div className="flex flex-col gap-3">
        {targetSections.map((section) => {
          const items = getSectionItems(section)
          if (items.length === 0) return null
          return (
            <EchoSectionWrapper
              key={section}
              sectionLabel={ECHO_SECTION_META[section]?.label ?? section}
              items={items}
              {...sharedInputProps}
            />
          )
        })}
      </div>
    </div>
  )
}
