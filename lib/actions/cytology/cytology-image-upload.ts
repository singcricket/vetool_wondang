'use server'

import { createClient } from '@/lib/supabase/server'
import type { CytologySampleType } from '@/constants/hospital/cytology/cytology-types'

const BUCKET = 'cytology-images'

export async function uploadCytologyImages(
  hosId: string,
  chartId: string,
  images: Array<{ base64: string; mediaType: string }>,
  sampleType: CytologySampleType,
): Promise<string[]> {
  const supabase = await createClient()
  const urls: string[] = []

  for (let i = 0; i < images.length; i++) {
    const { base64, mediaType } = images[i]
    const ext = mediaType.split('/')[1] ?? 'png'
    const path = `${hosId}/${chartId}/${Date.now()}_${i}.${ext}`
    const buffer = Buffer.from(base64, 'base64')

    // 1. Storage 업로드
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: mediaType, upsert: false })

    if (uploadError) {
      console.error('cytology image upload error:', uploadError.message)
      continue
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
    const publicUrl = urlData.publicUrl

    // 2. cytology_images 테이블에 레코드 삽입
    const { error: insertError } = await supabase.from('cytology_images').insert({
      chart_id: chartId,
      hos_id: hosId,
      image_url: publicUrl,
      tags: sampleType,
      marks: null,
    })

    if (insertError) {
      console.error('cytology_images insert error:', insertError.message)
      // Storage에 올라간 파일은 유지하고 URL은 반환 (DB 레코드 없어도 이미지는 존재)
    }

    urls.push(publicUrl)
  }

  return urls
}
