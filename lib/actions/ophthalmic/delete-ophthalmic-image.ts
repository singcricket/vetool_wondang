'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteOphthalmicImage(imageId: string, imageUrl: string, hosId: string) {
  const supabase = await createClient()

  // 1. Delete from DB
  const { error: dbError } = await supabase
    .from('ophthalmic_images')
    .delete()
    .eq('id', imageId)

  if (dbError) {
    console.error('Failed to delete ophthalmic image from DB', dbError)
    throw new Error('이미지 정보 삭제에 실패했습니다.')
  }

  // 2. Delete from Storage
  // Extract path from public URL
  // Example URL: https://.../storage/v1/object/public/ophthalmic/chart-id/file.png
  try {
    const urlParts = imageUrl.split('/ophthalmic/')
    if (urlParts.length > 1) {
      const filePath = urlParts[1]
      const { error: storageError } = await supabase.storage
        .from('ophthalmic')
        .remove([filePath])
      
      if (storageError) {
        console.warn('Failed to delete ophthalmic image from storage', storageError)
      }
    }
  } catch (e) {
    console.warn('Could not parse image URL for storage deletion', e)
  }

  revalidatePath(`/hospital/${hosId}/ophthalmic`)
}
