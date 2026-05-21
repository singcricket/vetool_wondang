'use server'

import { createClient } from '@/lib/supabase/server'
import type { AiProtocolOption, DrugItem, AdverseEffectItem, RefSource } from './ai-oncology-guide'

export type ProtocolFormData = {
  protocol_name: string
  protocol_type: string
  phase: string
  total_cycles: number | null
  total_weeks: number | null
  description: string | null
  mst_days: number | null
  response_rate: number | null
  precautions: string | null
  contraindications: string | null
  owner_instructions: string | null
  owner_warning_signs: string[]
  drugs: DrugItem[]
  adverse_effects: AdverseEffectItem[]
  ref_sources: RefSource[]
  user_tags: string
}

export async function searchProtocolTemplates(
  hosId: string,
  query: string,
): Promise<AiProtocolOption[]> {
  if (!query.trim()) return []

  const supabase = await createClient()
  const terms = query
    .split(',')
    .map((t) => {
      const match = t.trim().match(/\(([^)]+)\)/)
      return match ? match[1].trim() : t.trim()
    })
    .filter(Boolean)

  const orParts = terms.flatMap((term) => [
    `protocol_name.ilike.%${term}%`,
    `tags.ilike.%${term}%`,
    `user_tags.ilike.%${term}%`,
  ])

  const { data, error } = await supabase
    .from('onco_protocols')
    .select('*')
    .eq('hos_id', hosId)
    .or(orParts.join(','))
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || !data) return []

  return data.map((p) => ({
    id: p.id,
    protocol_name: p.protocol_name,
    protocol_type: p.protocol_type,
    phase: p.phase,
    total_cycles: p.total_cycles,
    total_weeks: p.total_weeks,
    description: p.description,
    mst_days: p.mst_days,
    response_rate: p.response_rate,
    drugs: (p.drugs as DrugItem[]) ?? [],
    precautions: p.precautions,
    adverse_effects: (p.adverse_effects as AdverseEffectItem[]) ?? [],
    contraindications: p.contraindications,
    owner_instructions: p.owner_instructions,
    owner_warning_signs: (p.owner_warning_signs as string[]) ?? [],
    ref_sources: (p.ref_sources as RefSource[]) ?? [],
    is_ai_generated: p.is_ai_generated,
    is_verified: p.is_verified,
    origin_diagnosis: p.origin_diagnosis,
    user_tags: p.user_tags,
  }))
}

export async function searchRelatedProtocols(
  hosId: string,
  diagnosisName: string,
  userTags: string,
): Promise<AiProtocolOption[]> {
  const supabase = await createClient()

  const termSources = [
    diagnosisName.trim(),
    ...userTags.split(',').map((t) => t.trim()),
  ].filter(Boolean)

  if (termSources.length === 0) return []

  const orParts = termSources.flatMap((term) => [
    `protocol_name.ilike.%${term}%`,
    `tags.ilike.%${term}%`,
    `user_tags.ilike.%${term}%`,
  ])

  const { data, error } = await supabase
    .from('onco_protocols')
    .select('*')
    .eq('hos_id', hosId)
    .or(orParts.join(','))
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data) return []

  return data.map((p) => ({
    id: p.id,
    protocol_name: p.protocol_name,
    protocol_type: p.protocol_type,
    phase: p.phase,
    total_cycles: p.total_cycles,
    total_weeks: p.total_weeks,
    description: p.description,
    mst_days: p.mst_days,
    response_rate: p.response_rate,
    drugs: (p.drugs as DrugItem[]) ?? [],
    precautions: p.precautions,
    adverse_effects: (p.adverse_effects as AdverseEffectItem[]) ?? [],
    contraindications: p.contraindications,
    owner_instructions: p.owner_instructions,
    owner_warning_signs: (p.owner_warning_signs as string[]) ?? [],
    ref_sources: (p.ref_sources as RefSource[]) ?? [],
    is_ai_generated: p.is_ai_generated,
    is_verified: p.is_verified,
    origin_diagnosis: p.origin_diagnosis,
    user_tags: p.user_tags,
  }))
}

async function expandTagsWithKeywords(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userTagsRaw: string,
): Promise<string> {
  const tagList = userTagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  if (tagList.length === 0) return ''

  const resultSet = new Set<string>()
  // Add user tags themselves
  tagList.forEach((t) => resultSet.add(t))

  // Extract prefix before "(" — e.g. "림프종(lymphoma)" → "림프종"
  const prefixes = tagList.map((t) => {
    const i = t.indexOf('(')
    return i > -1 ? t.substring(0, i).trim() : t
  })

  const { data: keywordRows } = await supabase
    .from('keywords')
    .select('tags')
    .in('keyword', prefixes)

  keywordRows?.forEach((row) => {
    if (row.tags) {
      row.tags
        .split('#')
        .filter((t) => t.trim().length > 0)
        .forEach((t) => resultSet.add(t))
    }
  })

  return Array.from(resultSet)
    .map((t) => `#${t}`)
    .join('')
}

export async function saveProtocolAsTemplate(
  protocolId: string,
  templateName: string,
  userTags: string,
): Promise<void> {
  const supabase = await createClient()

  const tags = await expandTagsWithKeywords(supabase, userTags)

  const { error } = await supabase
    .from('onco_protocols')
    .update({
      protocol_name: templateName.trim(),
      user_tags: userTags.trim(),
      tags,
    })
    .eq('id', protocolId)

  if (error) throw new Error(`템플릿 저장 실패: ${error.message}`)
}

export async function createFullProtocol(
  hosId: string,
  diagnosisKey: string,
  data: ProtocolFormData,
): Promise<string> {
  const supabase = await createClient()

  const tags = data.user_tags.trim()
    ? await expandTagsWithKeywords(supabase, data.user_tags)
    : ''

  const { data: row, error } = await supabase
    .from('onco_protocols')
    .insert({
      hos_id: hosId,
      origin_diagnosis: diagnosisKey || null,
      protocol_name: data.protocol_name,
      protocol_type: data.protocol_type,
      phase: data.phase,
      total_cycles: data.total_cycles,
      total_weeks: data.total_weeks,
      description: data.description,
      mst_days: data.mst_days,
      response_rate: data.response_rate,
      precautions: data.precautions,
      contraindications: data.contraindications,
      owner_instructions: data.owner_instructions,
      owner_warning_signs: data.owner_warning_signs as unknown as import('@/lib/supabase/database.types').Json,
      drugs: data.drugs as unknown as import('@/lib/supabase/database.types').Json,
      adverse_effects: data.adverse_effects as unknown as import('@/lib/supabase/database.types').Json,
      ref_sources: data.ref_sources as unknown as import('@/lib/supabase/database.types').Json,
      drug_interactions: [] as unknown as import('@/lib/supabase/database.types').Json,
      user_tags: data.user_tags.trim(),
      tags,
      is_ai_generated: false,
      is_verified: false,
    })
    .select('id')
    .single()

  if (error) throw new Error(`프로토콜 생성 실패: ${error.message}`)
  return row.id
}

export async function updateFullProtocol(
  protocolId: string,
  data: ProtocolFormData,
): Promise<void> {
  const supabase = await createClient()

  const tags = data.user_tags.trim()
    ? await expandTagsWithKeywords(supabase, data.user_tags)
    : ''

  const { error } = await supabase
    .from('onco_protocols')
    .update({
      protocol_name: data.protocol_name,
      protocol_type: data.protocol_type,
      phase: data.phase,
      total_cycles: data.total_cycles,
      total_weeks: data.total_weeks,
      description: data.description,
      mst_days: data.mst_days,
      response_rate: data.response_rate,
      precautions: data.precautions,
      contraindications: data.contraindications,
      owner_instructions: data.owner_instructions,
      owner_warning_signs: data.owner_warning_signs as unknown as import('@/lib/supabase/database.types').Json,
      drugs: data.drugs as unknown as import('@/lib/supabase/database.types').Json,
      adverse_effects: data.adverse_effects as unknown as import('@/lib/supabase/database.types').Json,
      ref_sources: data.ref_sources as unknown as import('@/lib/supabase/database.types').Json,
      user_tags: data.user_tags.trim(),
      tags,
    })
    .eq('id', protocolId)

  if (error) throw new Error(`프로토콜 수정 실패: ${error.message}`)
}

export async function fetchHosProtocols(hosId: string): Promise<AiProtocolOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('onco_protocols')
    .select('*')
    .eq('hos_id', hosId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((p) => ({
    id: p.id,
    protocol_name: p.protocol_name,
    protocol_type: p.protocol_type,
    phase: p.phase,
    total_cycles: p.total_cycles,
    total_weeks: p.total_weeks,
    description: p.description,
    mst_days: p.mst_days,
    response_rate: p.response_rate,
    drugs: (p.drugs as DrugItem[]) ?? [],
    precautions: p.precautions,
    adverse_effects: (p.adverse_effects as AdverseEffectItem[]) ?? [],
    contraindications: p.contraindications,
    owner_instructions: p.owner_instructions,
    owner_warning_signs: (p.owner_warning_signs as string[]) ?? [],
    ref_sources: (p.ref_sources as RefSource[]) ?? [],
    is_ai_generated: p.is_ai_generated,
    is_verified: p.is_verified,
    origin_diagnosis: p.origin_diagnosis,
    user_tags: p.user_tags,
  }))
}

export async function deleteProtocol(protocolId: string): Promise<void> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('onco_case_protocols')
    .select('id', { count: 'exact', head: true })
    .eq('protocol_id', protocolId)

  if (count && count > 0) {
    throw new Error(`이 프로토콜은 ${count}개의 케이스에서 사용 중입니다. 케이스에서 먼저 제거한 후 삭제해주세요.`)
  }

  const { error } = await supabase
    .from('onco_protocols')
    .delete()
    .eq('id', protocolId)

  if (error) throw new Error(`프로토콜 삭제 실패: ${error.message}`)
}

export async function createManualProtocol(
  hosId: string,
  diagnosisKey: string,
  input: {
    protocol_name: string
    protocol_type: string
    phase: string
    description: string | null
  },
): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('onco_protocols')
    .insert({
      hos_id: hosId,
      origin_diagnosis: diagnosisKey || null,
      protocol_name: input.protocol_name,
      protocol_type: input.protocol_type,
      phase: input.phase,
      description: input.description ?? null,
      is_ai_generated: false,
      is_verified: false,
      drugs: [] as unknown as import('@/lib/supabase/database.types').Json,
      adverse_effects: [] as unknown as import('@/lib/supabase/database.types').Json,
      owner_warning_signs: [] as unknown as import('@/lib/supabase/database.types').Json,
      ref_sources: [] as unknown as import('@/lib/supabase/database.types').Json,
      drug_interactions: [] as unknown as import('@/lib/supabase/database.types').Json,
    })
    .select('id')
    .single()

  if (error) throw new Error(`프로토콜 생성 실패: ${error.message}`)
  return data.id
}
