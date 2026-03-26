export type CollectionResourceType = 'note' | 'monitoring' | 'icu'

export interface CollectionItem {
  collection_id: string
  resource_type: CollectionResourceType
  resource_id: string
  order_index: number
  added_at?: string
  
  // UI Display helpers (joined or constructed on client)
  resource_title?: string
  resource_date?: string
}

export interface Collection {
  collection_id: string
  hos_id: string
  user_id: string
  title: string
  description?: string | null
  created_at?: string
  updated_at?: string
  
  items?: CollectionItem[]
}
