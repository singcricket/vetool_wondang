'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ItemProduct, ItemProductFormInput, ItemProductCsvRow } from '@/types/hospital/supply-order-type'

export async function getItemProducts(hosId: string): Promise<ItemProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('item_products')
    .select('*, item_master(id, generic_name, category, base_unit)')
    .eq('hos_id', hosId)
    .order('brand_name')

  if (error) throw new Error(error.message)
  return (data ?? []) as ItemProduct[]
}

export async function createItemProduct(
  hosId: string,
  input: ItemProductFormInput,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('item_products').insert({
    hos_id: hosId,
    item_master_id: input.item_master_id,
    brand_name: input.brand_name.trim(),
    manufacturer: input.manufacturer.trim() || null,
    ingredient: input.ingredient.trim() || null,
    specification: input.specification.trim() || null,
    package_type: input.package_type.trim(),
    units_per_package: input.units_per_package,
    reference_price: input.reference_price ? Number(input.reference_price) : null,
    category: input.category ?? [],
    tag: input.tag ?? [],
    memo: input.memo.trim() || null,
    is_active: input.is_active,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/settings`)
}

export async function updateItemProduct(
  hosId: string,
  id: string,
  input: ItemProductFormInput,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('item_products')
    .update({
      item_master_id: input.item_master_id,
      brand_name: input.brand_name.trim(),
      manufacturer: input.manufacturer.trim() || null,
      ingredient: input.ingredient.trim() || null,
      specification: input.specification.trim() || null,
      package_type: input.package_type.trim(),
      units_per_package: input.units_per_package,
      reference_price: input.reference_price ? Number(input.reference_price) : null,
      category: input.category ?? [],
      tag: input.tag ?? [],
      memo: input.memo.trim() || null,
      is_active: input.is_active,
    })
    .eq('id', id)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/settings`)
}

export async function bulkCreateItemProducts(
  hosId: string,
  rows: ItemProductCsvRow[],
  vendorId?: string,
): Promise<{ success: number; errors: { row: number; message: string }[] }> {
  const supabase = await createClient()
  const errors: { row: number; message: string }[] = []
  const validRows: object[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    if (!row.brand_name?.trim()) {
      errors.push({ row: rowNum, message: 'brand_name(제품명) 누락' })
      continue
    }

    const parseSemicolon = (val?: string) =>
      val ? val.split(';').map((s) => s.trim()).filter(Boolean) : []

    validRows.push({
      hos_id: hosId,
      item_master_id: null,   // 업로드 후 별도 연결
      brand_name: row.brand_name.trim(),
      manufacturer: row.manufacturer?.trim() || null,
      ingredient: row.ingredient?.trim() || null,
      specification: row.specification?.trim() || null,
      package_type: row.package_type?.trim() || '낱개',
      units_per_package: Number(row.units_per_package ?? 1) || 1,
      reference_price: row.reference_price ? Number(row.reference_price) || null : null,
      category: parseSemicolon(row.category),
      tag: parseSemicolon(row.tag),
      memo: row.memo?.trim() || null,
      vendor_ids: vendorId ? [vendorId] : [],
    })
  }

  if (validRows.length > 0) {
    const { error } = await supabase.from('item_products').insert(validRows as any)
    if (error) throw new Error(error.message)
    revalidatePath(`/hospital/${hosId}/supply-order/settings`)
  }

  return { success: validRows.length, errors }
}

export async function createItemProductForDelivery(
  hosId: string,
  input: {
    brand_name: string
    manufacturer: string
    ingredient: string
    specification: string
    package_type: string
    units_per_package: number
    reference_price: string
    item_master_id: string | null
  },
): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('item_products')
    .insert({
      hos_id: hosId,
      item_master_id: input.item_master_id || null,
      brand_name: input.brand_name.trim(),
      manufacturer: input.manufacturer.trim() || null,
      ingredient: input.ingredient.trim() || null,
      specification: input.specification.trim() || null,
      package_type: input.package_type.trim() || '낱개',
      units_per_package: input.units_per_package,
      reference_price: input.reference_price ? Number(input.reference_price) : null,
      is_active: true,
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message ?? '제품 등록 실패')
  revalidatePath(`/hospital/${hosId}/supply-order`)
  return data.id
}

export async function linkItemProductToMaster(
  hosId: string,
  productId: string,
  masterItemId: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('item_products')
    .update({ item_master_id: masterItemId })
    .eq('id', productId)
    .eq('hos_id', hosId)
  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order`)
}

export async function unlinkItemProductFromMaster(
  hosId: string,
  productId: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('item_products')
    .update({ item_master_id: null })
    .eq('id', productId)
    .eq('hos_id', hosId)
  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order`)
}

export type BulkUpdateItemProductInput = {
  categoryMode: 'add' | 'replace'
  categories: string[]
  tagMode: 'add' | 'replace'
  tags: string[]
  is_active: 'keep' | 'true' | 'false'
}

export async function bulkUpdateItemProducts(
  hosId: string,
  ids: string[],
  input: BulkUpdateItemProductInput,
): Promise<void> {
  const supabase = await createClient()

  for (const id of ids) {
    const updates: Record<string, unknown> = {}

    if (input.categories.length > 0 || input.categoryMode === 'replace') {
      if (input.categoryMode === 'replace') {
        updates.category = input.categories
      } else {
        const { data } = await supabase.from('item_products').select('category').eq('id', id).single()
        const existing: string[] = (data as any)?.category ?? []
        updates.category = Array.from(new Set([...existing, ...input.categories]))
      }
    }

    if (input.tags.length > 0 || input.tagMode === 'replace') {
      if (input.tagMode === 'replace') {
        updates.tag = input.tags
      } else {
        const { data } = await supabase.from('item_products').select('tag').eq('id', id).single()
        const existing: string[] = (data as any)?.tag ?? []
        updates.tag = Array.from(new Set([...existing, ...input.tags]))
      }
    }

    if (input.is_active !== 'keep') {
      updates.is_active = input.is_active === 'true'
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('item_products').update(updates).eq('id', id).eq('hos_id', hosId)
      if (error) throw new Error(error.message)
    }
  }

  revalidatePath(`/hospital/${hosId}/supply-order/settings`)
}

export async function bulkDeleteItemProducts(hosId: string, ids: string[]): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('item_products')
    .delete()
    .in('id', ids)
    .eq('hos_id', hosId)
  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/settings`)
}

export async function toggleItemProductActive(
  hosId: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('item_products')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/settings`)
}
