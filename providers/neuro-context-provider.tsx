'use client'

import { createContext, useContext } from 'react'

type NeuroContextType = {
  hosId: string
  targetDate: string
  vetsList: { user_id: string; name: string }[]
}

const NeuroContext = createContext<NeuroContextType | null>(null)

export function NeuroContextProvider({
  children,
  neuroContextData,
}: {
  children: React.ReactNode
  neuroContextData: NeuroContextType
}) {
  return (
    <NeuroContext.Provider value={neuroContextData}>
      {children}
    </NeuroContext.Provider>
  )
}

export function useNeuroContext() {
  const context = useContext(NeuroContext)
  if (!context) {
    throw new Error('useNeuroContext must be used within a NeuroContextProvider')
  }
  return context
}
