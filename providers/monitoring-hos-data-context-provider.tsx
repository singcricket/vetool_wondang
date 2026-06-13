'use client'

import type { Plan } from '@/constants/company/plans'
import type { Vet } from '@/types'
import { VitalRefRange } from '@/types/adimin'
import type { DeviceProfile } from '@/types/monitoring/device-profile-type'
import { createContext, useContext } from 'react'

export type OrderColorDisplay = 'dot' | 'full'

type MsContextDataType = {
  msContextData: MsContextData
}

type MsContextData = {
  vetsListData: Vet[]
  groupListData: string[]
  plan: Plan
  vitalRefRange: VitalRefRange[]
  deviceProfiles: DeviceProfile[]
}

const MonitoringHosDataContext = createContext<MsContextDataType | undefined>(
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
  msContextData: MsContextData
  children: React.ReactNode
}> = ({ msContextData, children }) => {
  return (
    <MonitoringHosDataContext.Provider value={{ msContextData }}>
      {children}
    </MonitoringHosDataContext.Provider>
  )
}
