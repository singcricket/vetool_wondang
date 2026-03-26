'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { ShareTargetType } from '@/types/share/share-type'

export async function resolveShareTargetId(type: ShareTargetType, input: string): Promise<{ id?: string, error?: string }> {
  const sanitizedInput = input.trim()
  
  // If input is already in UUID format, assume it's valid and return it directly
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(sanitizedInput)) {
    return { id: sanitizedInput }
  }

  const supabase = createAdminClient()

  try {
    if (type === 'user') {
      const { data, error } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', sanitizedInput)
        .single()
        
      if (error || !data) {
        return { error: '해당 이메일로 가입된 유저를 찾을 수 없습니다.' }
      }
      return { id: data.user_id }
    } 
    
    if (type === 'hospital') {
      // Allow exact or partial match for hospital name
      const { data, error } = await supabase
        .from('hospitals')
        .select('hos_id, name')
        .ilike('name', `%${sanitizedInput}%`)
        
      if (error || !data || data.length === 0) {
        return { error: '입력하신 이름의 병원을 찾을 수 없습니다.' }
      }

      if (data.length > 1) {
        const exactMatch = data.find(h => h.name.trim() === sanitizedInput)
        if (exactMatch) {
          return { id: exactMatch.hos_id }
        }
        return { error: '이름이 비슷한 병원이 여러 곳 검색되었습니다. 띄어쓰기를 포함한 정확한 병원 이름을 입력해주세요.' }
      }

      return { id: data[0].hos_id }
    }

    return { error: '올바르지 않은 타겟 방식입니다.' }
  } catch (err: any) {
    console.error('Target resolution error:', err)
    return { error: '대상 확인 중 서버 에러가 발생했습니다.' }
  }
}
