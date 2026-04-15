'use client'

import React, { createContext, useContext } from 'react'

export type DentalContextData = {
  hosId: string
  targetDate: string
  vetsList: { user_id: string; name: string }[]
}

const DentalContext = createContext<DentalContextData | null>(null)

export function DentalContextProvider({
  children,
  dentalContextData,
}: {
  children: React.ReactNode
  dentalContextData: DentalContextData
}) {
  return (
    <DentalContext.Provider value={dentalContextData}>
      {children}
    </DentalContext.Provider>
  )
}

export function useDentalContext() {
  const context = useContext(DentalContext)
  if (!context) {
    throw new Error(
      'useDentalContext must be used within a DentalContextProvider',
    )
  }
  return context
}
