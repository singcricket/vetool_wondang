'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type {
  EchoSettings,
  EchoTestUIMeta,
  EchoResultMap,
  EchoSection,
} from '@/types/echocardio/echocardio-type'
import type { Vet } from '@/types'

type EchoContextData = {
  hosId: string
  targetDate: string
  vetsList: Vet[]
  settings: EchoSettings
  testUIMeta: EchoTestUIMeta[]
}

type EchoContextType = {
  echoContextData: EchoContextData
  // 현재 차트 결과값 상태 (keyword_id → value)
  resultMap: EchoResultMap
  setResultMap: (map: EchoResultMap) => void
  updateResult: (keywordId: string, value: string) => void
  // 설정 업데이트 (로컬 상태)
  updateSettings: (settings: Partial<EchoSettings>) => void
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
  echoContextData,
  children,
}: {
  echoContextData: EchoContextData
  children: React.ReactNode
}) {
  const [resultMap, setResultMap] = useState<EchoResultMap>({})
  const [settings, setSettings] = useState<EchoSettings>(
    echoContextData.settings,
  )

  const updateResult = useCallback((keywordId: string, value: string) => {
    setResultMap((prev) => ({ ...prev, [keywordId]: value }))
  }, [])

  const updateSettings = useCallback((partial: Partial<EchoSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }))
  }, [])

  return (
    <EchoContext.Provider
      value={{
        echoContextData: { ...echoContextData, settings },
        resultMap,
        setResultMap,
        updateResult,
        updateSettings,
      }}
    >
      {children}
    </EchoContext.Provider>
  )
}
