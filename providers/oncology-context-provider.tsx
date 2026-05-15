'use client'

import { createContext, useContext } from 'react'

type OncologyContextType = {
  hosId: string
  targetDate: string
  vetsList: { user_id: string; name: string }[]
}

const OncologyContext = createContext<OncologyContextType | null>(null)

export function OncologyContextProvider({
  children,
  oncologyContextData,
}: {
  children: React.ReactNode
  oncologyContextData: OncologyContextType
}) {
  return (
    <OncologyContext.Provider value={oncologyContextData}>
      {children}
    </OncologyContext.Provider>
  )
}

export function useOncologyContext() {
  const context = useContext(OncologyContext)
  if (!context) {
    throw new Error('useOncologyContext must be used within a OncologyContextProvider')
  }
  return context
}
