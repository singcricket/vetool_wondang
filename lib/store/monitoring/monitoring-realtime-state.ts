import { create } from 'zustand'

type MonitoringRealtimeState = {
  isRealtimeReadyZustand: boolean
  setIsRealtimeReadyZustand: (isReady: boolean) => void
}

export const useZustandMonitoringRealtimeStore = create<MonitoringRealtimeState>((set) => ({
  isRealtimeReadyZustand: false,
  setIsRealtimeReadyZustand: (isReady) =>
    set({ isRealtimeReadyZustand: isReady }),
}))
