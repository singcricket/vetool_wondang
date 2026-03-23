import { createClient } from '@/lib/supabase/client'
import { Note, NoteInsert, NoteUpdate, NotesCategoryConfig } from '@/types/notes/notes_index'

const supabase = createClient()

export const getNotes = async (hosId: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('hos_id', hosId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Note[]
}

export const getNoteById = async (noteId: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('notes_id', noteId)
    .single()

  if (error) throw error
  return data as Note
}

export const createNote = async (note: NoteInsert) => {
  const { data, error } = await supabase
    .from('notes')
    .insert(note)
    .select()
    .single()

  if (error) throw error
  return data as Note
}

export const updateNote = async (noteId: string, note: NoteUpdate) => {
  const { data, error } = await supabase
    .from('notes')
    .update(note)
    .eq('notes_id', noteId)
    .select()
    .single()

  if (error) throw error
  return data as Note
}

export const deleteNote = async (noteId: string) => {
  const { error } = await supabase.from('notes').delete().eq('notes_id', noteId)

  if (error) throw error
}

export const getNotesByTag = async (hosId: string, tag: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('hos_id', hosId)
    .contains('user_tags', [tag])
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Note[]
}

export const searchNotes = async (hosId: string, searchTerm: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('hos_id', hosId)
    .or(`title.ilike.%${searchTerm}%,user_tags.cs.{${searchTerm}}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Note[]
}

export const getNoteCategories = async (hosId: string) => {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('hos_id', hosId)
    .single()

  if (error) throw error

  const defaultCategories: NotesCategoryConfig = [
    { id: `${hosId}-all`, label: '전체 보기' },
    { id: `${hosId}-clinical`, label: '임상 지식' },
    { id: `${hosId}-staff-edu`, label: '직원 교육' },
    { id: `${hosId}-internal-share`, label: '원내 공유' },
  ]

  const categories = (data as any)?.notes_category as NotesCategoryConfig
  return categories || defaultCategories
}

export const updateNoteCategories = async (
  hosId: string,
  categories: NotesCategoryConfig,
) => {
  const { error } = await supabase
    .from('hospitals')
    .update({ notes_category: categories } as any)
    .eq('hos_id', hosId)

  if (error) throw error
}
