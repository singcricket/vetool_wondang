'use client'

import { createClient } from '@/lib/supabase/client'
import { 
  Note, 
  NoteInsert, 
  NoteUpdate, 
  NotesCategoryConfig, 
  NoteWithAuthor 
} from '@/types/notes/notes_index'

const supabase = createClient()

/**
 * user_tags 배열로부터 시스템 태그(tags)를 자동 생성하는 헬퍼 함수
 * 1. 각 태그에서 "(" 이전 문자열만 추출 (예: "CHF(심부전)" -> "CHF")
 * 2. keywords 테이블에서 매칭되는 keyword를 찾아 해당 행의 tags(#구분자) 컬럼을 가져옴
 * 3. #으로 구분된 태그들을 분리하여 중복 없는 배열로 반환
 */
const getAutomaticTags = async (userTags: string[] | null, title?: string) => {
  const resultSet = new Set<string>()
  
  // 1. 제목이 있으면 태그에 추가
  if (title) resultSet.add(title.trim())

  if (!userTags || userTags.length === 0) return Array.from(resultSet)

  // 2. "(" 앞글자만 추출하여 접두사 배열 생성
  const prefixes = userTags.map(tag => {
    const bracketIndex = tag.indexOf('(')
    return bracketIndex > -1 ? tag.substring(0, bracketIndex).trim() : tag.trim()
  })

  // 3. keywords 테이블에서 매칭되는 데이터 조회
  const { data: keywordRows, error: keywordError } = await supabase
    .from('keywords')
    .select('tags')
    .in('keyword', prefixes)

  if (keywordError) {
    console.error('Keyword fetch failed:', keywordError.message)
    return Array.from(resultSet)
  }

  // 4. # 구분자 분해 및 중복 제거
  keywordRows?.forEach(row => {
    if (row.tags) {
      row.tags
        .split('#')
        .filter(t => t.trim().length > 0)
        .forEach(t => resultSet.add(t))
    }
  })

  return Array.from(resultSet)
}

export const getNotes = async (hosId: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*, author:users(name, position)')
    .eq('hos_id', hosId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as NoteWithAuthor[]
}

export const getNoteById = async (noteId: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*, author:users(name, position)')
    .eq('notes_id', noteId)
    .single()

  if (error) throw error
  return data as NoteWithAuthor
}

export const createNote = async (note: NoteInsert) => {
  // 1. 제목 및 유저 태그 기반 자동 태그(tags) 생성
  const automaticTags = await getAutomaticTags(note.user_tags || [], note.title)

  const { data, error } = await supabase
    .from('notes')
    .insert({
      ...note,
      tags: automaticTags // 2. 생성된 태그 배열을 tags 컬럼에 저장
    })
    .select()
    .single()

  if (error) throw error
  return data as Note
}

export const updateNote = async (noteId: string, note: NoteUpdate) => {
  // 1. 태그 재계산 여부 확인 (제목이나 유저 태그가 변경된 경우)
  let updatePayload = { ...note }
  
  if (note.user_tags !== undefined || note.title !== undefined) {
    // 만약 한가지만 업데이트 될 경우, 기존 값을 가져와야 함 (제목을 태그에 포함시키기 위해)
    let currentTitle = note.title
    let currentUserTags = note.user_tags

    if (currentTitle === undefined || currentUserTags === undefined) {
      const { data: currentNote } = await supabase
        .from('notes')
        .select('title, user_tags')
        .eq('notes_id', noteId)
        .single()
      
      if (currentTitle === undefined) currentTitle = currentNote?.title
      if (currentUserTags === undefined) currentUserTags = currentNote?.user_tags
    }

    const automaticTags = await getAutomaticTags(currentUserTags || [], currentTitle)
    updatePayload.tags = automaticTags
  }

  const { data, error } = await supabase
    .from('notes')
    .update(updatePayload)
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
    .select('*, author:users(name, position)')
    .eq('hos_id', hosId)
    .contains('user_tags', [tag])
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as NoteWithAuthor[]
}

export type SearchType = 'all' | 'title' | 'content' | 'tags'

export const searchNotes = async (hosId: string, searchTerm: string, searchType: SearchType = 'all') => {
  // 1. Split and trim search terms (1st-pass)
  const firstPassTerms = searchTerm
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)

  if (firstPassTerms.length === 0) return []

  let finalTerms = firstPassTerms

  // 2. Specialized logic for tags searchType
  if (searchType === 'tags') {
    // 3. Check for replacements in keywords table (case-insensitive)
    const keywordConditions = firstPassTerms.map(t => `keyword.ilike.${t}`).join(',')
    const { data: keywordMappings } = await supabase
      .from('keywords')
      .select('keyword, search_keyword')
      .or(keywordConditions)

    if (keywordMappings && keywordMappings.length > 0) {
      // Create a mapping dictionary (using lowercase keys for easier matching)
      const mappingDict = Object.fromEntries(
        keywordMappings
          .filter((row) => row.keyword && row.search_keyword)
          .map((row) => [row.keyword!.toLowerCase(), row.search_keyword!])
      )

      // 4. Create 2nd-pass terms by replacing matched ones
      finalTerms = firstPassTerms.map((term) => mappingDict[term.toLowerCase()] || term)
    }
  }

  // 5. Build and execute query with AND logic (chaining filters)
  let query = supabase
    .from('notes')
    .select('*, author:users(name, position)')
    .eq('hos_id', hosId)

  finalTerms.forEach((term) => {
    // Variations for case-insensitive array matching
    const termLower = term.toLowerCase()
    const termUpper = term.toUpperCase()
    const variations = `{${term},${termLower},${termUpper}}`

    if (searchType === 'title') {
      query = query.ilike('title', `%${term}%`)
    } else if (searchType === 'content') {
      query = query.filter('content', 'ilike', `%${term}%`)
    } else if (searchType === 'tags') {
      // 6. Case-insensitive overlap check on notes.tags
      query = query.or(`tags.ov.${variations}`)
    } else {
      // 7. All-around case-insensitive check
      query = query.or(`title.ilike.%${term}%,user_tags.ov.${variations},tags.ov.${variations}`)
    }
  })

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data as NoteWithAuthor[]
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
