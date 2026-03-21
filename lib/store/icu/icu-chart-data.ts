import type { OrderType } from '@/constants/hospital/icu/chart/order'
import type {
  SelectedIcuChart,
  SelectedIcuOrder,
  SelectedTreatment,
  TxLog,
} from '@/types/icu/chart'
import { create } from 'zustand'

type IcuChartDataState = {
  chartData: SelectedIcuChart | null
  setChartData: (data: SelectedIcuChart | null) => void

  // icu_txs realtime payload → treatment 반영
  applyRealtimeTx: (txRow: RealtimeTxPayload) => void
  removeRealtimeTx: (txId: string) => void

  // icu_orders realtime payload → order 반영
  applyRealtimeOrder: (orderRow: RealtimeOrderPayload) => void
  insertRealtimeOrder: (orderRow: RealtimeOrderPayload) => void
  removeRealtimeOrder: (orderId: string) => void
}

// Supabase realtime payload의 new/old 필드 타입 (DB 컬럼 그대로)
export type RealtimeTxPayload = {
  icu_chart_tx_id: string
  icu_chart_order_id: string | null
  icu_chart_tx_result: string | null
  icu_chart_tx_comment: string | null
  icu_chart_tx_log: TxLog[] | null
  time: number
  is_crucial: boolean
  has_images: boolean | null
}

export type RealtimeOrderPayload = {
  icu_chart_id: string
  icu_chart_order_id: string
  icu_chart_order_name: string
  icu_chart_order_time: string[]
  icu_chart_order_comment: string | null
  icu_chart_order_type: string
  icu_chart_order_priority: number
  is_bordered: boolean
}

export const useIcuChartDataStore = create<IcuChartDataState>((set) => ({
  chartData: null,

  setChartData: (data) => set({ chartData: data }),

  applyRealtimeTx: (txRow) =>
    set((state) => {
      if (!state.chartData) return state

      const orderId = txRow.icu_chart_order_id
      if (!orderId) return state

      const treatment: SelectedTreatment = {
        icu_chart_tx_id: txRow.icu_chart_tx_id,
        icu_chart_tx_result: txRow.icu_chart_tx_result,
        icu_chart_tx_comment: txRow.icu_chart_tx_comment,
        icu_chart_tx_log: txRow.icu_chart_tx_log,
        time: txRow.time,
        is_crucial: txRow.is_crucial,
        has_images: txRow.has_images,
      }

      const updatedOrders = state.chartData.orders.map((order) => {
        if (order.icu_chart_order_id !== orderId) return order

        const existingIdx = order.treatments.findIndex(
          (t) => t.icu_chart_tx_id === txRow.icu_chart_tx_id,
        )

        const updatedTreatments =
          existingIdx !== -1
            ? order.treatments.map((t, i) =>
                i === existingIdx ? treatment : t,
              )
            : [...order.treatments, treatment]

        return { ...order, treatments: updatedTreatments }
      })

      return {
        chartData: { ...state.chartData, orders: updatedOrders },
      }
    }),

  removeRealtimeTx: (txId) =>
    set((state) => {
      if (!state.chartData) return state

      const updatedOrders = state.chartData.orders.map((order) => {
        const hasTx = order.treatments.some((t) => t.icu_chart_tx_id === txId)
        if (!hasTx) return order
        return {
          ...order,
          treatments: order.treatments.filter(
            (t) => t.icu_chart_tx_id !== txId,
          ),
        }
      })

      return {
        chartData: { ...state.chartData, orders: updatedOrders },
      }
    }),

  applyRealtimeOrder: (orderRow) =>
    set((state) => {
      if (!state.chartData) return state

      // 현재 차트의 order가 아니면 무시
      if (orderRow.icu_chart_id !== state.chartData.icu_chart_id) return state

      const updatedOrders = state.chartData.orders
        .map((order) => {
          if (order.icu_chart_order_id !== orderRow.icu_chart_order_id)
            return order

          return {
            ...order,
            icu_chart_order_name: orderRow.icu_chart_order_name,
            icu_chart_order_time: orderRow.icu_chart_order_time,
            icu_chart_order_comment: orderRow.icu_chart_order_comment,
            icu_chart_order_type: orderRow.icu_chart_order_type as OrderType,
            is_bordered: orderRow.is_bordered,
            id: orderRow.icu_chart_order_priority,
          }
        })
        .sort((a, b) => a.id - b.id)

      return {
        chartData: { ...state.chartData, orders: updatedOrders },
      }
    }),

  insertRealtimeOrder: (orderRow) =>
    set((state) => {
      if (!state.chartData) return state

      // 현재 차트의 order가 아니면 무시
      if (orderRow.icu_chart_id !== state.chartData.icu_chart_id) return state

      // 이미 존재하면 무시 (중복 방지)
      if (
        state.chartData.orders.some(
          (o) => o.icu_chart_order_id === orderRow.icu_chart_order_id,
        )
      )
        return state

      const newOrder: SelectedIcuOrder = {
        icu_chart_order_id: orderRow.icu_chart_order_id,
        icu_chart_order_name: orderRow.icu_chart_order_name,
        icu_chart_order_time: orderRow.icu_chart_order_time,
        icu_chart_order_comment: orderRow.icu_chart_order_comment,
        icu_chart_order_type: orderRow.icu_chart_order_type as OrderType,
        is_bordered: orderRow.is_bordered,
        id: orderRow.icu_chart_order_priority,
        treatments: [],
      }

      return {
        chartData: {
          ...state.chartData,
          orders: [...state.chartData.orders, newOrder].sort(
            (a, b) => a.id - b.id,
          ),
        },
      }
    }),

  removeRealtimeOrder: (orderId) =>
    set((state) => {
      if (!state.chartData) return state

      return {
        chartData: {
          ...state.chartData,
          orders: state.chartData.orders.filter(
            (o) => o.icu_chart_order_id !== orderId,
          ),
        },
      }
    }),
}))
