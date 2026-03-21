import type { DdxAction, DdxItem, DdxMessage, DdxSession } from '@/types/ddx'
import { create } from 'zustand'

type DdxStore = {
  // Sessions
  sessions: DdxSession[]
  setSessions: (sessions: DdxSession[]) => void
  addSession: (session: DdxSession) => void
  removeSession: (sessionId: string) => void
  updateSessionTitle: (sessionId: string, title: string) => void
  updateSessionPin: (sessionId: string, isPinned: boolean) => void

  // Current session
  currentSessionId: string | null
  setCurrentSessionId: (id: string | null) => void

  // Messages
  messages: DdxMessage[]
  setMessages: (messages: DdxMessage[]) => void
  addMessage: (message: DdxMessage) => void
  updateLastAssistantMessage: (content: string) => void

  // DDx List
  ddxList: DdxItem[]
  setDdxList: (list: DdxItem[]) => void
  applyDdxActions: (actions: DdxAction[]) => void
  toggleDdxItem: (name: string) => void
  addDdxItem: (name: string) => void
  removeDdxItem: (name: string) => void

  // Streaming
  isStreaming: boolean
  setIsStreaming: (value: boolean) => void

  // Pending initial message
  pendingInitialMessage: string | null
  setPendingInitialMessage: (msg: string | null) => void
}

export const useDdxStore = create<DdxStore>((set, get) => ({
  // Sessions
  sessions: [],
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),
  removeSession: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.ddx_session_id !== sessionId),
    })),
  updateSessionTitle: (sessionId, title) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.ddx_session_id === sessionId ? { ...s, title } : s,
      ),
    })),
  updateSessionPin: (sessionId, isPinned) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.ddx_session_id === sessionId ? { ...s, is_pinned: isPinned } : s,
      ),
    })),

  // Current session
  currentSessionId: null,
  setCurrentSessionId: (id) => set({ currentSessionId: id }),

  // Messages
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateLastAssistantMessage: (content) =>
    set((state) => {
      const messages = [...state.messages]
      const lastIndex = messages.length - 1
      if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
        messages[lastIndex] = { ...messages[lastIndex], content }
      }
      return { messages }
    }),

  // DDx List
  ddxList: [],
  setDdxList: (list) => set({ ddxList: list }),
  applyDdxActions: (actions) =>
    set((state) => {
      const list = [...state.ddxList]
      for (const action of actions) {
        if (action.action === 'add') {
          const exists = list.find(
            (item) => item.name.toLowerCase() === action.name.toLowerCase(),
          )
          if (!exists) {
            list.push({
              name: action.name,
              status: 'active',
              reason: action.reason,
            })
          }
        } else if (action.action === 'rule_out') {
          const item = list.find(
            (item) => item.name.toLowerCase() === action.name.toLowerCase(),
          )
          if (item) {
            item.status = 'ruled_out'
            item.reason = action.reason
          }
        } else if (action.action === 'rule_in') {
          const item = list.find(
            (item) => item.name.toLowerCase() === action.name.toLowerCase(),
          )
          if (item) {
            item.status = 'active'
            item.reason = action.reason
          }
        }
      }
      return { ddxList: list }
    }),
  toggleDdxItem: (name) =>
    set((state) => ({
      ddxList: state.ddxList.map((item) =>
        item.name === name
          ? {
              ...item,
              status: item.status === 'active' ? 'ruled_out' : 'active',
            }
          : item,
      ),
    })),
  addDdxItem: (name) =>
    set((state) => {
      const exists = state.ddxList.find(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      )
      if (exists) return state
      return {
        ddxList: [...state.ddxList, { name, status: 'active' }],
      }
    }),
  removeDdxItem: (name) =>
    set((state) => ({
      ddxList: state.ddxList.filter((item) => item.name !== name),
    })),

  // Streaming
  isStreaming: false,
  setIsStreaming: (value) => set({ isStreaming: value }),

  // Pending initial message
  pendingInitialMessage: null,
  setPendingInitialMessage: (msg: string | null) =>
    set({ pendingInitialMessage: msg }),
}))
