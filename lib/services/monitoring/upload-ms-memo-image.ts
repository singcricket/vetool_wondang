import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

export const uploadMsMemoImage = async (
  file: File,
  sessionId: string,
): Promise<{ url: string | null; error: string | null }> => {
  const supabase = createClient()

  try {
    // 1. 이미지 압축 (최대 1920px, 최대 1MB 한도 - 필요 시 조절)
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
    const filePath = `${sessionId}/${fileName}`

    // 3. Supabase Storage 업로드 (버킷명: monitoring_memos)
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
    console.error('Image compression or upload failed:', error)
    return { url: null, error: error.message || '업로드 중 알 수 없는 에러가 발생했습니다.' }
  }
}
