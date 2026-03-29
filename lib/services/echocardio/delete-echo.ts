'use server'

import { createClient } from '@/lib/supabase/server'

// =============================================
// 차트 삭제 (결과값은 CASCADE로 자동 삭제)
// =============================================
export async function deleteEchoChart(echoId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('echo_charts')
    .delete()
    .eq('id', echoId)
  if (error) throw new Error(`deleteEchoChart: ${error.message}`)
}

// =============================================
// 가이드 이미지 삭제
// =============================================
export async function deleteEchoGuideImage(imageId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('echo_template_guide_images')
    .delete()
    .eq('id', imageId)
  if (error) throw new Error(`deleteEchoGuideImage: ${error.message}`)
}
