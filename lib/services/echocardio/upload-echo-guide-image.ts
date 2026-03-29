import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

export async function uploadEchoGuideImage(
  file: File,
  templateId: string,
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient()

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    })

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`
    const filePath = `${templateId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('echo_guide')
      .upload(filePath, compressed, { cacheControl: '3600', upsert: false })

    if (uploadError) return { url: null, error: uploadError.message }

    const { data } = supabase.storage.from('echo_guide').getPublicUrl(filePath)
    return { url: data.publicUrl, error: null }
  } catch (e: any) {
    return { url: null, error: e.message ?? '업로드 실패' }
  }
}
