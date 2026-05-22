import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

export async function uploadCheckupImage(
  file: File,
  checkupId: string,
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient()

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    })

    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`
    const filePath = `${checkupId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('checkup')
      .upload(filePath, compressed, { cacheControl: '3600', upsert: false })

    if (uploadError) return { url: null, error: uploadError.message }

    const { data } = supabase.storage.from('checkup').getPublicUrl(filePath)
    return { url: data.publicUrl, error: null }
  } catch (e: any) {
    return { url: null, error: e.message ?? '업로드 실패' }
  }
}

/** 이미지 파일을 AI 분석용 소형 base64로 변환 (max 512px) */
export function fileToSmallBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 512
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('canvas error')); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load error')) }
    img.src = url
  })
}
