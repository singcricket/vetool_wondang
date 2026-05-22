'use client'

import { createContext, useContext } from 'react'

type CheckupContextType = {
  hosId: string
  targetDate: string
  vetsList: { user_id: string; name: string }[]
}

const CheckupContext = createContext<CheckupContextType | null>(null)

export function CheckupContextProvider({
  children,
  checkupContextData,
}: {
  children: React.ReactNode
  checkupContextData: CheckupContextType
}) {
  return (
    <CheckupContext.Provider value={checkupContextData}>
      {children}
    </CheckupContext.Provider>
  )
}

export function useCheckupContext() {
  const context = useContext(CheckupContext)
  if (!context) {
    throw new Error('useCheckupContext must be used within a CheckupContextProvider')
  }
  return context
}
