import { createClient } from '@/lib/supabase/client'
import { ResourceShare, ShareTargetType, ShareResourceType, SharePermissionLevel } from '@/types/share/share-type'

export async function fetchShares(resourceType: ShareResourceType, resourceId: string): Promise<ResourceShare[]> {
  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from('resource_shares')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as ResourceShare[] || []
}

export async function createShare(payload: Omit<ResourceShare, 'id' | 'created_at'>): Promise<ResourceShare> {
  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from('resource_shares')
    .insert([payload])
    .select()
    .single()

  if (error) throw error
  return data as ResourceShare
}

export async function deleteShare(shareId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await (supabase as any)
    .from('resource_shares')
    .delete()
    .eq('id', shareId)

  if (error) throw error
}
