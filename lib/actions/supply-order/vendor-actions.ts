'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Vendor, VendorFormInput } from '@/types/hospital/supply-order-type'

export async function getVendors(hosId: string): Promise<Vendor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('hos_id', hosId)
    .order('is_active', { ascending: false })
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as Vendor[]
}

export async function createVendor(hosId: string, input: VendorFormInput): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('vendors').insert({
    hos_id: hosId,
    name: input.name.trim(),
    categories: input.categories,
    representative: input.representative.trim() || null,
    representative_phone: input.representative_phone.trim() || null,
    contacts: input.contacts,
    address: input.address.trim() || null,
    memo: input.memo.trim() || null,
    is_active: input.is_active,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/settings`)
}

export async function updateVendor(
  hosId: string,
  id: string,
  input: VendorFormInput,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('vendors')
    .update({
      name: input.name.trim(),
      categories: input.categories,
      representative: input.representative.trim() || null,
      representative_phone: input.representative_phone.trim() || null,
      contacts: input.contacts,
      address: input.address.trim() || null,
      memo: input.memo.trim() || null,
      is_active: input.is_active,
    })
    .eq('id', id)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/settings`)
}

export async function toggleVendorActive(
  hosId: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('vendors')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/settings`)
}
