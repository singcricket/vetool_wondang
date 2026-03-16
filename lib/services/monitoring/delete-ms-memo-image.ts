import { createClient } from '@/lib/supabase/client'

export const deleteMsMemoImage = async (publicUrls: string[]) => {
  if (!publicUrls || publicUrls.length === 0) return { error: null }

  const supabase = createClient()
  
  try {
    const pathsToDelete = publicUrls.map((url) => {
      const urlParts = url.split('/monitoring_memos/')
      if (urlParts.length !== 2) {
        throw new Error('올바르지 않은 이미지 URL입니다.')
      }
      return urlParts[1]
    })

    const { error } = await supabase.storage.from('monitoring_memos').remove(pathsToDelete)
    
    if (error) throw error
    
    return { error: null }
  } catch (error: any) {
    console.error('Failed to delete image:', error)
    return { error: error.message }
  }
}
