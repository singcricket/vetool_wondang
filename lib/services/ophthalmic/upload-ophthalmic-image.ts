import { createClient } from '@/lib/supabase/client'

export async function uploadOphthalmicImage(file: File, chartId: string) {
  const supabase = createClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${chartId}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`
  const filePath = `${fileName}`

  const { data, error } = await supabase.storage
    .from('ophthalmic')
    .upload(filePath, file)

  if (error) {
    console.error('Error uploading ophthalmic image:', error)
    return { url: null, error: error.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('ophthalmic')
    .getPublicUrl(filePath)

  return { url: publicUrl, error: null }
}
