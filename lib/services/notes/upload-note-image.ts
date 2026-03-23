import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

export const uploadNoteImage = async (
  file: File,
  hosId: string,
): Promise<{ url: string | null; error: string | null }> => {
  const supabase = createClient()

  try {
    // 1. 이미지 압축
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    }
    const compressedFile = await imageCompression(file, options)

    // 2. 유니크 식별 및 확장자 추출
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}.${fileExt}`
    const filePath = `${hosId}/notes/${fileName}`

    // 3. Supabase Storage 업로드 (버킷명: monitoring_memos 추천 - 없으면 404 날 수 있음)
    // 사용자 요청에 따라 기존 로직과 동일하게 buckets 사용
    const { error: uploadError } = await supabase.storage
      .from('monitoring_memos') 
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError.message)
      return { url: null, error: uploadError.message }
    }

    // 4. Public URL 가져오기
    const { data: publicUrlData } = supabase.storage
      .from('monitoring_memos')
      .getPublicUrl(filePath)

    return { url: publicUrlData.publicUrl, error: null }
  } catch (error: any) {
    console.error('Image upload failed:', error)
    return { url: null, error: error.message || '업로드 중 오류 발생' }
  }
}
