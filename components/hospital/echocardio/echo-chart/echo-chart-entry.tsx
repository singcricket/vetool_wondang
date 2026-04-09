'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardListIcon, UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EchoTemplate, EchoSidebarItem } from '@/types/echocardio/echocardio-type'
import EchoTemplateSelectDialog from '@/components/hospital/echocardio/echo-chart/echo-template-select-dialog'
import { useSafeRefresh } from '@/hooks/use-safe-refresh'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  hosId: string
  echoId: string
  species: 'canine' | 'feline'
  defaultTemplate: EchoTemplate
  allTemplates: EchoTemplate[]
}

export default function EchoChartEntry({
  hosId,
  echoId,
  species,
  defaultTemplate,
  allTemplates,
}: Props) {
  const [isInitializing, setIsInitializing] = useState(false)
  const [weight, setWeight] = useState('')
  const safeRefresh = useSafeRefresh()

  const myTemplates = allTemplates.filter((t) => t.template_species === species)

  const isValidWeight = weight !== '' && !isNaN(Number(weight)) && Number(weight) > 0

  const handleInitialize = async (template: EchoTemplate) => {
    if (!isValidWeight) {
      toast.error('올바른 체중을 입력해주세요.')
      return
    }

    setIsInitializing(true)
    const supabase = createClient()

    try {
      // 1. 차트 정보 업데이트 (template_id 저장 및 기존 tags에서 TEMPLATE_ID 정보 제거)
      const { data: currentChart } = await supabase
        .from('echo_charts')
        .select('tags')
        .eq('id', echoId)
        .single()

      const currentTags = currentChart?.tags ?? ''
      const cleanedTags = currentTags
        .split('#')
        .filter((tag) => !tag.startsWith('TEMPLATE_ID:'))
        .join('#')

      const { error: chartError } = await supabase
        .from('echo_charts')
        .update({
          template_id: template.id,
          tags: cleanedTags || null,
        })
        .eq('id', echoId)

      if (chartError) throw chartError

      // 2. 차트 초기화를 위해 체중(BW_kg) 항목을 입력된 값으로 생성하여 '결과 있음' 상태로 만듭니다.
      const { error: resultError } = await supabase
        .from('echo_results')
        .upsert({
          echo_chart_id: echoId,
          keyword_id: 'BW_kg',
          value: weight,
          result: '',
          comment: '',
        }, { onConflict: 'echo_chart_id,keyword_id' })

      if (resultError) throw resultError

      toast.success(`${template.name}으로 차트를 시작합니다.`)
      safeRefresh()
    } catch (err) {
      console.error(err)
      toast.error('차트 초기화에 실패했습니다.')
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-6 bg-slate-50/50">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">심장초음파 차트 생성</h2>
        <p className="text-slate-500">차트 생성을 위해 환자의 체중과 사용할 템플릿 구성을 선택해주세요.</p>
      </div>

      <div className="w-full max-w-sm space-y-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <Label htmlFor="weight" className="text-sm font-semibold text-slate-700">체중 입력 (kg)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="weight"
            type="number"
            step="0.1"
            placeholder="0.0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="text-lg font-bold h-12"
            autoFocus
          />
          <span className="text-lg font-bold text-slate-500">kg</span>
        </div>
        {!isValidWeight && weight !== '' && (
          <p className="text-xs text-rose-500">올바른 체중을 입력해 주세요.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* 기본 템플릿 옵션 */}
        <button
          onClick={() => handleInitialize(defaultTemplate)}
          disabled={isInitializing || !isValidWeight}
          className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-white p-8 transition-all hover:border-blue-500 hover:bg-blue-50/30 group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="rounded-full bg-blue-100 p-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors group-disabled:bg-slate-100 group-disabled:text-slate-400">
            <ClipboardListIcon size={32} />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800 group-disabled:text-slate-400">병원 기본 템플릿</h3>
            <p className="text-sm text-slate-500 mt-1 group-disabled:text-slate-400">{defaultTemplate.name}</p>
          </div>
        </button>

        {/* 내 템플릿 선택 옵션 */}
        <EchoTemplateSelectDialog
          templates={myTemplates}
          onSelect={handleInitialize}
          disabled={isInitializing || !isValidWeight}
        >
          <div className={`flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-white p-8 transition-all group ${isValidWeight ? 'hover:border-orange-500 hover:bg-orange-50/30 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
            <div className={`rounded-full p-4 transition-colors ${isValidWeight ? 'bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' : 'bg-slate-100 text-slate-400'}`}>
              <UserIcon size={32} />
            </div>
            <div className="text-center">
              <h3 className={`text-lg font-bold ${isValidWeight ? 'text-slate-800' : 'text-slate-400'}`}>나의 템플릿 선택</h3>
              <p className={`text-sm mt-1 ${isValidWeight ? 'text-slate-500' : 'text-slate-400'}`}>사용자 정의 템플릿 목록</p>
            </div>
          </div>
        </EchoTemplateSelectDialog>
      </div>
    </div>
  )
}
