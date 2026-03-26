'use server'

import { createClient } from '@/lib/supabase/server'
import { Collection, CollectionItem } from '@/types/collections/collection-type'

export async function fetchCollections(hosId: string, userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await (supabase as any)
    .from('resource_collections')
    .select(`
      *,
      items:resource_collection_items(*)
    `)
    .eq('hos_id', hosId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as unknown as Collection[]
}

export async function createCollection(payload: Partial<Collection>) {
  const supabase = await createClient()
  
  const { data, error } = await (supabase as any)
    .from('resource_collections')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCollectionItems(collectionId: string, items: Partial<CollectionItem>[]) {
  const supabase = await createClient()
  // Upsert all to update order_index
  const payload = items.map(i => ({
    collection_id: collectionId,
    ...i
  }))
  
  const { error } = await (supabase as any)
    .from('resource_collection_items')
    .upsert(payload, { onConflict: 'collection_id,resource_type,resource_id' })

  if (error) throw error
}

export async function updateCollection(collectionId: string, payload: Partial<Collection>) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('resource_collections')
    .update(payload)
    .eq('collection_id', collectionId)

  if (error) throw error
}

export async function deleteCollection(collectionId: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('resource_collections')
    .delete()
    .eq('collection_id', collectionId)

  if (error) throw error
}

