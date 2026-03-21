import { create } from 'zustand'

type OptimisticTxState = {
  // key: `${orderId}_${time}`, value: txResult
  optimisticTxMap: Map<string, string>

  setOptimisticTx: (orderId: string, time: number, txResult: string) => void
  clearOptimisticTx: (orderId: string, time: number) => void
  clearAll: () => void
}

export const useOptimisticTxStore = create<OptimisticTxState>((set) => ({
  optimisticTxMap: new Map(),

  setOptimisticTx: (orderId, time, txResult) =>
    set((state) => {
      const newMap = new Map(state.optimisticTxMap)
      newMap.set(`${orderId}_${time}`, txResult)
      return { optimisticTxMap: newMap }
    }),

  clearOptimisticTx: (orderId, time) =>
    set((state) => {
      const newMap = new Map(state.optimisticTxMap)
      newMap.delete(`${orderId}_${time}`)
      return { optimisticTxMap: newMap }
    }),

  clearAll: () => set({ optimisticTxMap: new Map() }),
}))
