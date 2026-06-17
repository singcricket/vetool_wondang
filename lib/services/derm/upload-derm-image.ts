import { createClient } from '@/lib/supabase/client'

export async function uploadDermImage(file: File, chartId: string, type: 'overview' | 'detail') {
  const supabase = createClient()

  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${chartId}/${type}_${Math.random().toString(36).substring(2, 12)}.${ext}`

  const { error } = await supabase.storage
    .from('derm-images')
    .upload(fileName, file)

  if (error) {
    console.error('uploadDermImage error:', error)
    return { url: null, error: error.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('derm-images')
    .getPublicUrl(fileName)

  return { url: publicUrl, error: null }
}
