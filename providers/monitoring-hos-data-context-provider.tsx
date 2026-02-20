'use client'

import type { Plan } from '@/constants/company/plans'
import type { Vet } from '@/types'
import { createContext, useContext } from 'react'

export type OrderColorDisplay = 'dot' | 'full'

type ClContextDataType = {
  clContextData: ClContextData
}

type ClContextData = {
  vetsListData: Vet[]
  groupListData: string[]
  plan: Plan
  // sidebarData: IcuSidebarIoData[]
}

const MonitoringHosDataContext = createContext<ClContextDataType | undefined>(
  undefined,
)

export const useMonitoringContextData = () => {
  const context = useContext(MonitoringHosDataContext)

  if (context === undefined) {
    throw new Error('useIcuContext must be used within an IcuProvider')
  }
  return context
}

export const MonitoringHosDataProvider: React.FC<{
  clContextData: ClContextData
  children: React.ReactNode
}> = ({ clContextData, children }) => {
  return (
    <MonitoringHosDataContext.Provider value={{ clContextData }}>
      {children}
    </MonitoringHosDataContext.Provider>
  )
}
