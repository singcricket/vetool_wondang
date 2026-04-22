import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/utils'

// Vertical layout logic:
// q1 (Top-Left screen, patient's Upper Right): 106 to 110 (col1), 101 to 105 (col2)
const q1 = [106, 107, 108, 109, 110, 101, 102, 103, 104, 105]
// q2 (Top-Right screen, patient's Upper Left): 201 to 205 (col1), 206 to 210 (col2)
const q2 = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210]
// q4 (Bottom-Left screen, patient's Lower Right): 406 to 411 (col1), 401 to 405 (col2)
const q4 = [406, 407, 408, 409, 410, 411, 401, 402, 403, 404, 405]
// q3 (Bottom-Right screen, patient's Lower Left): 301 to 306 (col1), 307 to 311 (col2) 
const q3 = [301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311]

const FELINE_MISSING = new Set([
  110, 105, 205, 210, 
  411, 410, 406, 405, 305, 306, 310, 311
])

type Props = {
  species: string
  selectedIds: string[]
  onChange: (ids: string[]) => void
  otherTags?: string[]
  onOtherTagsChange?: (tags: string[]) => void
}

export default function DentalToothSelector({ species, selectedIds, onChange, otherTags, onOtherTagsChange }: Props) {
  const isFeline = species?.toLowerCase().startsWith('fel')

  const selectedRef = useRef<Set<string>>(new Set(selectedIds))
  const [dragAction, setDragAction] = useState<'add' | 'remove' | null>(null)

  useEffect(() => {
    selectedRef.current = new Set(selectedIds)
  }, [selectedIds])

  useEffect(() => {
    const handleMouseUp = () => setDragAction(null)
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [])

  const applyAction = (numStr: string, action: 'add' | 'remove') => {
    const isMissing = isFeline && FELINE_MISSING.has(Number(numStr))
    if (isMissing) return

    const currentSet = selectedRef.current
    let changed = false
    if (action === 'add' && !currentSet.has(numStr)) {
      currentSet.add(numStr)
      changed = true
    } else if (action === 'remove' && currentSet.has(numStr)) {
      currentSet.delete(numStr)
      changed = true
    }

    if (changed) {
      onChange(Array.from(currentSet))
    }
  }

  const handleMouseDown = (numStr: string) => {
    const action = selectedRef.current.has(numStr) ? 'remove' : 'add'
    setDragAction(action)
    applyAction(numStr, action)
  }

  const handleMouseEnter = (numStr: string) => {
    if (dragAction) {
      applyAction(numStr, dragAction)
    }
  }

  const renderGroup = (order: number[], rows: number) => {
    return (
      <div 
        className="grid grid-flow-col gap-1 mx-2"
        style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
      >
        {order.map((num) => {
          const isMissing = isFeline && FELINE_MISSING.has(num)
          const numStr = String(num)
          const isSelected = selectedIds.includes(numStr)

          return (
            <Button
              key={num}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                "h-8 w-11 px-0 text-xs transition-colors",
                isMissing && "invisible pointer-events-none"
              )}
              onMouseDown={() => handleMouseDown(numStr)}
              onMouseEnter={() => handleMouseEnter(numStr)}
              disabled={isMissing}
            >
              {!isMissing && num}
            </Button>
          )
        })}
      </div>
    )
  }

  const isGeneralSelected = selectedIds.includes('general')

  const toggleGeneral = () => {
    if (isGeneralSelected) {
      onChange(selectedIds.filter(id => id !== 'general'))
    } else {
      onChange([...selectedIds, 'general'])
    }
  }

  return (
    <div className="w-full space-y-4 select-none pb-2 flex flex-col items-center">
      
      {/* 전반(General) 옵션 */}
      <div className="w-full px-2 max-w-[320px] flex justify-center pb-1">
        <Button 
          type="button" 
          variant={isGeneralSelected ? "default" : "outline"} 
          className={cn("w-full h-8 text-[11px] font-semibold transition-colors", isGeneralSelected && "bg-slate-700 hover:bg-slate-800")}
          onClick={toggleGeneral}
        >
          General (구강 전반)
        </Button>
      </div>

      {/* 상악 (Top) */}
      <div className="flex justify-center divide-x-2 divide-slate-300 border-b-4 border-slate-300 pb-4">
        <div className="flex flex-1 justify-end">
          {renderGroup(q1, 5)}
        </div>
        <div className="flex flex-1 justify-start">
          {renderGroup(q2, 5)}
        </div>
      </div>
      {/* 하악 (Bottom) */}
      <div className="flex justify-center divide-x-2 divide-slate-300">
        <div className="flex flex-1 justify-end">
          {renderGroup(q4, 6)}
        </div>
        <div className="flex flex-1 justify-start">
          {renderGroup(q3, 6)}
        </div>
      </div>
      
      {/* 사용자 정의 태그 (Other Tags) 영역 */}
      {onOtherTagsChange && (
        <div className="w-full max-w-[320px] px-2 pt-2 border-t mt-4 border-slate-200">
          <Input 
            placeholder="추가 태그 입력 후 엔터 (예: 내원용)" 
            className="h-8 text-xs bg-white mb-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const value = e.currentTarget.value.trim()
                if (value && !otherTags?.includes(value)) {
                  onOtherTagsChange([...(otherTags || []), value])
                  e.currentTarget.value = ''
                }
              }
            }}
          />
          {otherTags && otherTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {otherTags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 font-medium px-2 py-0.5 bg-slate-200 text-slate-800 rounded shadow-sm text-[10px]">
                  {tag}
                  <button onClick={() => onOtherTagsChange(otherTags.filter(t => t !== tag))} className="hover:text-red-900 outline-none pl-1 ml-1 text-slate-500 font-bold border-l border-slate-300">
                     &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
