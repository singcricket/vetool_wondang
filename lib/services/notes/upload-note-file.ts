import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

export const uploadNoteFile = async (
  file: File,
  hosId: string,
): Promise<{ url: string | null; error: string | null; fileName: string }> => {
  const supabase = createClient()
  const originalName = file.name

  try {
    let uploadFile: File | Blob = file

    // 1. 이미지고 용량이 큰 경우 압축 (PDF 등은 압축 생략)
    if (file.type.startsWith('image/')) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      }
      try {
        uploadFile = await imageCompression(file, options)
      } catch (e) {
        console.warn('Image compression failed, uploading original', e)
        uploadFile = file
      }
    }

    // 2. 유니크 식별 및 확장자 추출
    const fileExt = originalName.split('.').pop()
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}.${fileExt}`
    const filePath = `${hosId}/notes/${fileName}`

    // 3. Supabase Storage 업로드
    const { error: uploadError } = await supabase.storage
      .from('monitoring_memos') 
      .upload(filePath, uploadFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError.message)
      return { url: null, error: uploadError.message, fileName: originalName }
    }

    // 4. Public URL 가져오기
    const { data: publicUrlData } = supabase.storage
      .from('monitoring_memos')
      .getPublicUrl(filePath)

    return { url: publicUrlData.publicUrl, error: null, fileName: originalName }
  } catch (error: any) {
    console.error('File upload failed:', error)
    return { url: null, error: error.message || '업로드 중 오류 발생', fileName: originalName }
  }
}
