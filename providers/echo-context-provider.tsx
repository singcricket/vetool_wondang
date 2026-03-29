'use client'

import { createContext, useContext, useState, useCallback, useTransition } from 'react'
import type {
  EchoTemplate,
  EchoTestUIMeta,
  EchoResultMap,
} from '@/types/echocardio/echocardio-type'
import { setDefaultTemplate, upsertEchoTemplate } from '@/lib/services/echocardio/update-echo'
import type { Vet } from '@/types'

type EchoContextData = {
  hosId: string
  targetDate: string
  vetsList: Vet[]
  template: EchoTemplate
  templates: EchoTemplate[]
  testUIMeta: EchoTestUIMeta[]
}

type EchoContextType = {
  echoContextData: EchoContextData
  // 현재 차트 결과값 상태 (keyword_id → value)
  resultMap: EchoResultMap
  setResultMap: (map: EchoResultMap) => void
  updateResult: (keywordId: string, value: string) => void
  // 템플릿 업데이트 (로컬 상태 + DB)
  updateTemplate: (updates: Partial<EchoTemplate>) => void
  // 활성 템플릿 전환
  setActiveTemplate: (templateId: string) => void
  isSettingTemplate: boolean
}

const EchoContext = createContext<EchoContextType | undefined>(undefined)

export function useEchoContext() {
  const context = useContext(EchoContext)
  if (!context) {
    throw new Error('useEchoContext must be used within EchoContextProvider')
  }
  return context
}

export function EchoContextProvider({
  echoContextData: initialData,
  children,
}: {
  echoContextData: EchoContextData
  children: React.ReactNode
}) {
  const [resultMap, setResultMap] = useState<EchoResultMap>({})
  const [template, setTemplate] = useState<EchoTemplate>(initialData.template)
  const [templates, setTemplates] = useState<EchoTemplate[]>(initialData.templates)
  const [isSettingTemplate, startTemplateTransition] = useTransition()

  const updateResult = useCallback((keywordId: string, value: string) => {
    setResultMap((prev) => ({ ...prev, [keywordId]: value }))
  }, [])

  const updateTemplate = useCallback((partial: Partial<EchoTemplate>) => {
    setTemplate((prev) => ({ ...prev, ...partial }))
    if (template.id) {
      upsertEchoTemplate(template.id, partial as any)
    }
  }, [template.id])

  const setActiveTemplate = useCallback((templateId: string) => {
    startTemplateTransition(async () => {
      await setDefaultTemplate(initialData.hosId, templateId)
      const next = templates.find((t) => t.id === templateId)
      if (next) {
        setTemplate(next)
        setTemplates((prev) =>
          prev.map((t) => ({ ...t, is_default: t.id === templateId })),
        )
      }
    })
  }, [initialData.hosId, templates])

  return (
    <EchoContext.Provider
      value={{
        echoContextData: {
          ...initialData,
          template,
          templates,
          // settings alias for backward compat
          settings: template,
        } as any,
        resultMap,
        setResultMap,
        updateResult,
        updateTemplate,
        setActiveTemplate,
        isSettingTemplate,
      }}
    >
      {children}
    </EchoContext.Provider>
  )
}
