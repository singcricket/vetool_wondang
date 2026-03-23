import { Database } from '@/lib/supabase/database.types'

export type Note = Database['public']['Tables']['notes']['Row']
export type NoteInsert = Database['public']['Tables']['notes']['Insert']
export type NoteUpdate = Database['public']['Tables']['notes']['Update']

export interface NoteCategoryNode {
  id: string
  label: string
  icon?: string
  children?: NoteCategoryNode[]
}

export type NotesCategoryConfig = NoteCategoryNode[]
