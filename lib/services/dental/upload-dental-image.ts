import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

export async function uploadDentalImage(
  file: File,
  chartId: string,
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
    const filePath = `${chartId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('dental')
      .upload(filePath, compressed, { cacheControl: '3600', upsert: false })

    if (uploadError) return { url: null, error: uploadError.message }

    const { data } = supabase.storage.from('dental').getPublicUrl(filePath)
    return { url: data.publicUrl, error: null }
  } catch (e: any) {
    return { url: null, error: e.message ?? '업로드 실패' }
  }
}
