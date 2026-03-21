import { create } from 'zustand'

type IcuRealtimeState = {
  isRealtimeReadyZustand: boolean
  setIsRealtimeReadyZustand: (isReady: boolean) => void
  isSortingZustand: boolean
  setIsSortingZustand: (isSorting: boolean) => void
}

export const useZustandIcuRealtimeStore = create<IcuRealtimeState>((set) => ({
  isRealtimeReadyZustand: false,
  setIsRealtimeReadyZustand: (isReady) =>
    set({ isRealtimeReadyZustand: isReady }),
  isSortingZustand: false,
  setIsSortingZustand: (isSorting) => set({ isSortingZustand: isSorting }),
}))

