'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ItemMaster, ItemMasterFormInput, ItemMasterCsvRow } from '@/types/hospital/supply-order-type'

export async function getItemMasters(hosId: string): Promise<ItemMaster[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('item_master')
    .select('*')
    .eq('hos_id', hosId)
    .order('category')
    .order('generic_name')

  if (error) throw new Error(error.message)
  return (data ?? []) as ItemMaster[]
}

// 주문서에서 신규 품목명 직접 입력 시 최소 정보로 즉시 생성 — ID 반환
export async function createItemMasterQuick(
  hosId: string,
  genericName: string,
  baseUnit: string,
): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('item_master')
    .insert({
      hos_id: hosId,
      category: '기타',
      generic_name: genericName.trim(),
      ingredient: [],
      base_unit: baseUnit.trim() || '개',
      aliases: [],
      alert_min_stock: 0,
      reorder_qty: 0,
      is_active: true,
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message ?? '품목 생성 실패')
  revalidatePath(`/hospital/${hosId}/supply-order`)
  return data.id
}

export async function createItemMaster(hosId: string, input: ItemMasterFormInput): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('item_master').insert({
    hos_id: hosId,
    category: input.category,
    generic_name: input.generic_name.trim(),
    ingredient: input.ingredient.filter((v) => v.trim()),
    description: input.description.trim() || null,
    base_unit: input.base_unit.trim(),
    aliases: input.aliases.filter((a) => a.trim()),
    alert_min_stock: input.alert_min_stock,
    reorder_qty: input.reorder_qty,
    is_active: input.is_active,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/settings`)
}

export async function updateItemMaster(
  hosId: string,
  id: string,
  input: ItemMasterFormInput,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('item_master')
    .update({
      category: input.category,
      generic_name: input.generic_name.trim(),
      ingredient: input.ingredient.filter((v) => v.trim()),
      description: input.description.trim() || null,
      base_unit: input.base_unit.trim(),
      aliases: input.aliases.filter((a) => a.trim()),
      alert_min_stock: input.alert_min_stock,
      reorder_qty: input.reorder_qty,
      is_active: input.is_active,
    })
    .eq('id', id)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/settings`)
}

export async function bulkCreateItemMasters(
  hosId: string,
  rows: ItemMasterCsvRow[],
): Promise<{ success: number; errors: { row: number; message: string }[] }> {
  const supabase = await createClient()
  const errors: { row: number; message: string }[] = []
  const validRows: object[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // 헤더 제외, 1-based

    if (!row.category?.trim()) {
      errors.push({ row: rowNum, message: 'category(카테고리) 누락' })
      continue
    }
    if (!row.generic_name?.trim()) {
      errors.push({ row: rowNum, message: 'generic_name(품목명) 누락' })
      continue
    }
    if (!row.base_unit?.trim()) {
      errors.push({ row: rowNum, message: 'base_unit(기준단위) 누락' })
      continue
    }

    const aliases = row.aliases
      ? row.aliases.split(';').map((a) => a.trim()).filter(Boolean)
      : []

    const ingredient = row.ingredient
      ? row.ingredient.split(';').map((v) => v.trim()).filter(Boolean)
      : []

    validRows.push({
      hos_id: hosId,
      category: row.category.trim(),
      generic_name: row.generic_name.trim(),
      ingredient,
      description: row.description?.trim() || null,
      base_unit: row.base_unit.trim(),
      aliases,
      alert_min_stock: Number(row.alert_min_stock ?? 0) || 0,
      reorder_qty: Number(row.reorder_qty ?? 0) || 0,
    })
  }

  if (validRows.length > 0) {
    const { error } = await supabase.from('item_master').insert(validRows as any)
    if (error) throw new Error(error.message)
    revalidatePath(`/hospital/${hosId}/supply-order/settings`)
  }

  return { success: validRows.length, errors }
}

export async function toggleItemMasterActive(
  hosId: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('item_master')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/supply-order/settings`)
}
