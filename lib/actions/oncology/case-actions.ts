'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteOncologyCase(caseId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('onco_cases').delete().eq('id', caseId)
  if (error) throw new Error(`케이스 삭제 실패: ${error.message}`)
  revalidatePath('/', 'layout')
}

export async function updateOncologyCaseStatus(
  caseId: string,
  status: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('onco_cases')
    .update({ status })
    .eq('id', caseId)
  if (error) throw new Error(`상태 변경 실패: ${error.message}`)
  revalidatePath('/', 'layout')
}
