'use client'

import React, { useState } from 'react'
import { ophthalmicTreatmentOptions, OphTreatmentCategory, OphTreatmentData, OphTopicalGroup } from '@/constants/hospital/ophthalmic/ophthalmic_ref'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Pill, Droplets, Scissors, Stethoscope, ClipboardList, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils/utils'

interface Props {
  treatmentData: Record<string, OphTreatmentData>
  onUpdate: (data: Record<string, OphTreatmentData>) => void
}

const CATEGORY_METADATA: Record<OphTreatmentCategory, { label: string, icon: any, color: string }> = {
  topical: { label: '점안 (Topical)', icon: Droplets, color: 'text-blue-600' },
  oral: { label: '내복약 (Oral)', icon: Pill, color: 'text-emerald-600' },
  procedure: { label: '시술 (Procedures)', icon: Stethoscope, color: 'text-amber-600' },
  surgery: { label: '수술 (Surgery)', icon: Scissors, color: 'text-rose-600' },
  general: { label: '기타/관리 (General)', icon: ClipboardList, color: 'text-slate-600' },
}

const TOPICAL_GROUP_LABELS: Record<OphTopicalGroup, string> = {
  antibiotic: '항생제 (Antibiotics)',
  steroid: '스테로이드 (Steroids)',
  nsaid: 'NSAIDs',
  glaucoma: '녹내장 (Glaucoma)',
  kcs: '건성안 / KCS',
  mydriatic: '산동제 (Mydriatics)',
  lubricant: '인공눈물 / 윤활제 (Lubricants)',
  antiviral: '항바이러스제 (Antivirals)',
  antifungal: '항진균제 (Antifungals)',
  anesthetic: '국소마취제 (Anesthetics)',
  compounding: '조제 제제 (Compounding)',
}

const TOPICAL_GROUP_ORDER: OphTopicalGroup[] = [
  'antibiotic', 'steroid', 'nsaid', 'glaucoma', 'kcs',
  'mydriatic', 'lubricant', 'antiviral', 'antifungal', 'anesthetic', 'compounding',
]

export default function OphthalmicTreatmentForm({ treatmentData, onUpdate }: Props) {
  const handleToggleOption = (category: OphTreatmentCategory, id: string, defaultFrequency?: string) => {
    const current = treatmentData[category] || { category, selectedIds: [], comment: '', frequencies: {} }
    const isSelected = current.selectedIds.includes(id)
    const newIds = isSelected
      ? current.selectedIds.filter(x => x !== id)
      : [...current.selectedIds, id]

    // 처음 선택할 때 기본 frequency 세팅
    const currentFreqs = current.frequencies || {}
    const newFreqs = isSelected
      ? (({ [id]: _, ...rest }) => rest)(currentFreqs)
      : { ...currentFreqs, [id]: defaultFrequency ?? '' }

    onUpdate({
      ...treatmentData,
      [category]: { ...current, selectedIds: newIds, frequencies: newFreqs }
    })
  }

  const handleUpdateFrequency = (category: OphTreatmentCategory, id: string, freq: string) => {
    const current = treatmentData[category] || { category, selectedIds: [], comment: '', frequencies: {} }
    onUpdate({
      ...treatmentData,
      [category]: {
        ...current,
        frequencies: { ...(current.frequencies || {}), [id]: freq }
      }
    })
  }

  const handleUpdateComment = (category: OphTreatmentCategory, comment: string) => {
    const current = treatmentData[category] || { category, selectedIds: [], comment: '' }
    onUpdate({
      ...treatmentData,
      [category]: { ...current, comment }
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col gap-1 mb-2 px-1">
        <h2 className="text-2xl font-black text-slate-800">치료 계획 및 처방</h2>
        <p className="text-sm text-slate-500 font-medium">Treatment Plan & Prescription</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {(Object.keys(ophthalmicTreatmentOptions) as OphTreatmentCategory[]).map(category => {
          const meta = CATEGORY_METADATA[category]
          const options = ophthalmicTreatmentOptions[category]
          const data = treatmentData[category] || { category, selectedIds: [], comment: '', frequencies: {} }
          const Icon = meta.icon
          const showFrequencyInput = category === 'topical' || category === 'oral'

          return (
            <Card key={category} className="border-2 border-slate-100 shadow-sm overflow-hidden hover:border-blue-100 transition-colors bg-white/50 backdrop-blur-sm">
              <CardHeader className="bg-slate-50/50 pb-4 border-b">
                <CardTitle className="flex items-center gap-2 text-base font-black">
                  <div className={cn("p-1.5 rounded-lg bg-white shadow-sm", meta.color)}>
                    <Icon size={18} />
                  </div>
                  {meta.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                {/* Options: topical은 그룹별, 나머지는 flat */}
                {category === 'topical' ? (
                  <div className="space-y-5">
                    {TOPICAL_GROUP_ORDER.map(group => {
                      const groupOptions = options.filter(o => o.group === group)
                      if (groupOptions.length === 0) return null
                      return (
                        <div key={group}>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                            {TOPICAL_GROUP_LABELS[group]}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {groupOptions.map(opt => (
                              <OptionItem
                                key={opt.id}
                                opt={opt}
                                selected={data.selectedIds.includes(opt.id)}
                                userFrequency={data.frequencies?.[opt.id]}
                                showFrequencyInput={showFrequencyInput}
                                onToggle={() => handleToggleOption(category, opt.id, opt.frequency)}
                                onFrequencyChange={(val) => handleUpdateFrequency(category, opt.id, val)}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {options.map(opt => (
                      <OptionItem
                        key={opt.id}
                        opt={opt}
                        selected={data.selectedIds.includes(opt.id)}
                        userFrequency={data.frequencies?.[opt.id]}
                        showFrequencyInput={showFrequencyInput}
                        onToggle={() => handleToggleOption(category, opt.id, opt.frequency)}
                        onFrequencyChange={(val) => handleUpdateFrequency(category, opt.id, val)}
                      />
                    ))}
                  </div>
                )}

                {/* Comment Field */}
                <div className="space-y-2 pt-2">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">상세 코멘트 (Comments)</Label>
                  <Textarea
                    placeholder={`${meta.label} 관련 상세 내역이나 주의사항을 적어주세요...`}
                    className="resize-none min-h-[100px] border-slate-200 focus:ring-blue-500 rounded-xl text-sm bg-white"
                    value={data.comment}
                    onChange={(e) => handleUpdateComment(category, e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function OptionItem({
  opt,
  selected,
  userFrequency,
  showFrequencyInput,
  onToggle,
  onFrequencyChange,
}: {
  opt: { id: string; nameKo: string; nameEn: string; clientTerm: string; frequency?: string; info?: string }
  selected: boolean
  userFrequency?: string
  showFrequencyInput: boolean
  onToggle: () => void
  onFrequencyChange: (val: string) => void
}) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-3 rounded-xl border transition-all cursor-pointer group",
        selected
          ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100"
          : "bg-white border-slate-100 hover:border-slate-200 shadow-sm"
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id={opt.id}
          checked={selected}
          onCheckedChange={onToggle}
          className="mt-0.5 shrink-0"
        />
        <div className="flex flex-col min-w-0 flex-1">
          <Label htmlFor={opt.id} className="font-bold text-sm leading-tight cursor-pointer group-hover:text-blue-700 transition-colors">
            {opt.nameKo}
          </Label>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium leading-tight">
            {opt.nameEn}
          </span>
          {opt.frequency && (
            <span className="text-[10px] text-indigo-400 mt-1 font-medium leading-tight">
              권장: {opt.frequency}
            </span>
          )}
          <span className="text-[10px] text-blue-600/70 mt-1 font-black leading-tight italic">
            {opt.clientTerm}
          </span>
        </div>
        {opt.info && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowInfo(v => !v) }}
            className={cn(
              "shrink-0 flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors",
              showInfo
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
            )}
          >
            <Info size={10} />
            {showInfo ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        )}
      </div>

      {/* 준비법 / 임상 참고 정보 */}
      {opt.info && showInfo && (
        <div
          className="mt-0.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 leading-relaxed font-medium whitespace-pre-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="block text-[9px] font-black text-amber-500 uppercase tracking-wider mb-1">준비법 / 참고사항</span>
          {opt.info}
        </div>
      )}

      {/* 처방 횟수 입력 — 선택된 경우 + topical/oral만 */}
      {selected && showFrequencyInput && (
        <div
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            value={userFrequency ?? ''}
            onChange={(e) => onFrequencyChange(e.target.value)}
            placeholder={opt.frequency ?? '처방 횟수 입력 (예: 1일 4회)'}
            className="h-7 text-xs font-bold border-indigo-200 bg-white focus:ring-indigo-400 rounded-lg placeholder:text-slate-300"
          />
        </div>
      )}
    </div>
  )
}
