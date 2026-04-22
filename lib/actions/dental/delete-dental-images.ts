'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteDentalImages(imageIds: string[], hosId: string) {
  const supabase = await createClient()

  // Get image URLs first to delete them from storage bucket
  const { data: images, error: fetchError } = await supabase
    .from('dental_images')
    .select('img_url')
    .in('dental_image_id', imageIds)

  if (fetchError) {
     throw new Error('삭제할 대상을 찾지 못했습니다.')
  }

  // 1. Delete DB records
  const { error: dbError } = await supabase
    .from('dental_images')
    .delete()
    .in('dental_image_id', imageIds)

  if (dbError) {
    console.error('Failed to delete DB records', dbError)
    throw new Error('이미지 기록 삭제에 실패했습니다.')
  }

  // 2. Delete Storage Files (Best effort)
  // URL -> bucket filepath (e.g. "uuid/filename.jpg")
  if (images && images.length > 0) {
    const filePaths = images.map(img => {
      // Assuming url looks like: "https://.../storage/v1/object/public/dental/uuid/123.jpg"
      // We extract "uuid/123.jpg"
      try {
        const urlObj = new URL(img.img_url)
        const parts = urlObj.pathname.split('/dental/')
        return parts.length > 1 ? parts[1] : null
      } catch (e) {
        return null
      }
    }).filter(Boolean) as string[]

    if (filePaths.length > 0) {
      await supabase.storage.from('dental').remove(filePaths)
    }
  }

  revalidatePath(`/hospital/${hosId}/dental`)
}
