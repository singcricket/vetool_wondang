'use client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ECHO_SECTION_META } from '@/constants/hospital/echocardio/echo-sections'
import { EchoSection } from '@/types/echocardio/echocardio-type'
import { cn } from '@/lib/utils/utils'

interface EchoTemplateItemsTabProps {
  name: string
  setName: (v: string) => void
  description: string
  setDescription: (v: string) => void
  sectionOrder: EchoSection[]
  activeSection: EchoSection
  setActiveSection: (v: EchoSection) => void
  sectionItems: any[]
  activeIds: string[]
  toggleItem: (id: string) => void
  isEdit: boolean
  isPending: boolean
  onCancel: () => void
  onSubmit: () => void
  speciesColor: 'blue' | 'orange'
}

export default function EchoTemplateItemsTab({
  name,
  setName,
  description,
  setDescription,
  sectionOrder,
  activeSection,
  setActiveSection,
  sectionItems,
  activeIds,
  toggleItem,
  isEdit,
  isPending,
  onCancel,
  onSubmit,
  speciesColor,
}: EchoTemplateItemsTabProps) {
  const ringColor = speciesColor === 'blue' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'
  const bgColor = speciesColor === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
  const buttonColor = speciesColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
  const accentCheckbox = speciesColor === 'blue' ? 'accent-blue-600' : 'accent-orange-600'

  return (
    <div className="flex flex-1 flex-col gap-3 min-h-0">
      <div className="flex flex-col gap-2 rounded border bg-muted/30 p-3 shadow-inner">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="템플릿 이름 *"
          className={cn(
            "w-full rounded border bg-white px-2 py-1.5 text-base font-medium outline-none focus:ring-1",
            ringColor
          )}
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="설명 (선택)"
          className={cn(
            "rounded border bg-white px-2 py-1.5 text-sm text-muted-foreground outline-none focus:ring-1",
            ringColor
          )}
        />
      </div>

      {/* 섹션별 항목 선택 */}
      <div className="flex flex-1 gap-3 rounded border p-3 bg-white min-h-0 overflow-hidden">
        <div className="flex w-32 shrink-0 flex-col gap-1 overflow-y-auto border-r pr-2">
          {sectionOrder.map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={cn(
                'rounded px-2 py-1.5 text-left text-sm transition-colors',
                activeSection === section
                  ? cn('font-bold', bgColor)
                  : 'text-muted-foreground hover:bg-muted/50',
              )}
            >
              {ECHO_SECTION_META[section]?.label ?? section}
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          <p className="mb-1 text-xs text-muted-foreground">
            체크된 항목이 검사 입력에 표시됩니다
          </p>
          {sectionItems.map((item: any) => (
            <label
              key={item.keywordID}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted transition-colors"
            >
              <input
                type="checkbox"
                checked={activeIds.includes(item.keywordID)}
                onChange={() => toggleItem(item.keywordID)}
                className={cn("h-3 w-3", accentCheckbox)}
              />
              <span className="text-sm">{item.keywordName}</span>
              <span className="ml-auto text-xs text-muted-foreground">{item.testType}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>취소</Button>
        <Button 
          size="sm" 
          onClick={onSubmit} 
          disabled={isPending || !name.trim()} 
          className={cn("text-white", buttonColor)}
        >
          {isPending ? <Spinner className="text-white" /> : isEdit ? '수정 완료' : '템플릿 생성'}
        </Button>
      </div>
    </div>
  )
}
