'use client'

import React, { createContext, useContext } from 'react'

export type UltrasoundContextData = {
  hosId: string
  targetDate: string
  vetsList: { user_id: string; name: string }[]
}

const UltrasoundContext = createContext<UltrasoundContextData | null>(null)

export function UltrasoundContextProvider({
  children,
  ultrasoundContextData,
}: {
  children: React.ReactNode
  ultrasoundContextData: UltrasoundContextData
}) {
  return (
    <UltrasoundContext.Provider value={ultrasoundContextData}>
      {children}
    </UltrasoundContext.Provider>
  )
}

export function useUltrasoundContext() {
  const context = useContext(UltrasoundContext)
  if (!context) {
    throw new Error(
      'useUltrasoundContext must be used within an UltrasoundContextProvider',
    )
  }
  return context
}
