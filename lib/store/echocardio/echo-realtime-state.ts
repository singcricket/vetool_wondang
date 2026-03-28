import { create } from 'zustand'

type EchoRealtimeState = {
  isRealtimeReadyZustand: boolean
  setIsRealtimeReadyZustand: (isReady: boolean) => void
}

export const useZustandEchoRealtimeStore = create<EchoRealtimeState>((set) => ({
  isRealtimeReadyZustand: false,
  setIsRealtimeReadyZustand: (isReady) =>
    set({ isRealtimeReadyZustand: isReady }),
}))
