export type DdxStatus = 'active' | 'ruled_out'

export type DdxItem = {
  name: string
  status: DdxStatus
  reason?: string
}

export type DdxActionType = 'add' | 'rule_out' | 'rule_in'

export type DdxAction = {
  action: DdxActionType
  name: string
  reason?: string
}

export type DdxMessage = {
  ddx_message_id: string
  ddx_session_id: string
  role: 'user' | 'assistant'
  content: string
  ddx_actions: DdxAction[]
  created_at: string
}

export type DdxSession = {
  ddx_session_id: string
  hos_id: string
  title: string
  ddx_list: DdxItem[]
  is_pinned: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}
