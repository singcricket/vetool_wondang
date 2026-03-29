'use client'

import { useState, useTransition } from 'react'
import type { EchoSection } from '@/types/echocardio/echocardio-type'
import { ECHO_SECTION_META } from '@/constants/hospital/echocardio/echo-sections'
import { upsertEchoTemplate } from '@/lib/services/echocardio/update-echo'
import { useEchoContext } from '@/providers/echo-context-provider'

interface EchoSettingsPanelProps {
  hosId: string
  onClose: () => void
}

export default function EchoSettingsPanel({ hosId: _hosId, onClose }: EchoSettingsPanelProps) {
  const { echoContextData, updateTemplate } = useEchoContext()
  const { template, testUIMeta } = echoContextData as any

  const [activeSection, setActiveSection] = useState<EchoSection>(template.section_order[0])
  const [isPending, startTransition] = useTransition()
  const [editingName, setEditingName] = useState(template.name)
  const [editingDesc, setEditingDesc] = useState(template.description ?? '')

  const sectionItems = testUIMeta.filter((m: any) => m.section === activeSection)
  const activeIds = template.active_items[activeSection] ?? sectionItems.map((m: any) => m.keywordID)

  function toggleItem(keywordId: string) {
    const current = new Set(activeIds)
    if (current.has(keywordId)) {
      current.delete(keywordId)
    } else {
      current.add(keywordId)
    }
    updateTemplate({
      active_items: { ...template.active_items, [activeSection]: Array.from(current) },
    })
  }

  function handleSave() {
    if (!template.id) return
    startTransition(async () => {
      await upsertEchoTemplate(template.id, {
        name: editingName,
        description: editingDesc || null,
        section_order: template.section_order,
        item_order: template.item_order as Record<string, string[]>,
        active_items: template.active_items as Record<string, string[]>,
      })
      updateTemplate({ name: editingName, description: editingDesc || null })
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex h-[80vh] w-full max-w-lg flex-col gap-3 rounded-lg bg-white p-4 shadow-lg">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">항목 설정</span>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {/* 현재 템플릿 이름/설명 */}
        <div className="flex flex-col gap-1 rounded border bg-muted/30 p-2">
          <input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className="rounded border bg-white px-2 py-1 text-xs font-medium"
            placeholder="템플릿 이름"
          />
          <input
            value={editingDesc}
            onChange={(e) => setEditingDesc(e.target.value)}
            className="rounded border bg-white px-2 py-1 text-[10px] text-muted-foreground"
            placeholder="설명 (선택)"
          />
        </div>

        {/* 섹션별 항목 선택 */}
        <div className="flex min-h-0 flex-1 gap-3">
          <div className="flex w-28 shrink-0 flex-col gap-1 border-r pr-2">
            {template.section_order.map((section: EchoSection) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`rounded px-2 py-1.5 text-left text-xs ${
                  activeSection === section ? 'bg-muted font-bold' : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {ECHO_SECTION_META[section]?.label ?? section}
              </button>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
            <p className="mb-1 text-[10px] text-muted-foreground">체크된 항목이 검사 입력에 표시됩니다</p>
            {sectionItems.map((item: any) => (
              <label key={item.keywordID} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted">
                <input
                  type="checkbox"
                  checked={activeIds.includes(item.keywordID)}
                  onChange={() => toggleItem(item.keywordID)}
                  className="h-3 w-3"
                />
                <span className="text-xs">{item.keywordName}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{item.testType}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-2">
          <button onClick={onClose} className="rounded border px-3 py-1.5 text-xs hover:bg-muted">취소</button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded bg-black px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
