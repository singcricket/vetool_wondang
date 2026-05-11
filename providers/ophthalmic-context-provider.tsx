'use client'

import { createContext, useContext } from 'react'

type OphthalmicContextType = {
  hosId: string
  targetDate: string
  vetsList: { user_id: string; name: string }[]
}

const OphthalmicContext = createContext<OphthalmicContextType | null>(null)

export function OphthalmicContextProvider({
  children,
  ophthalmicContextData,
}: {
  children: React.ReactNode
  ophthalmicContextData: OphthalmicContextType
}) {
  return (
    <OphthalmicContext.Provider value={ophthalmicContextData}>
      {children}
    </OphthalmicContext.Provider>
  )
}

export function useOphthalmicContext() {
  const context = useContext(OphthalmicContext)
  if (!context) {
    throw new Error('useOphthalmicContext must be used within a OphthalmicContextProvider')
  }
  return context
}
