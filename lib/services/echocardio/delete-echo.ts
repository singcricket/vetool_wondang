'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// =============================================
// 차트 삭제 (결과값은 CASCADE로 자동 삭제)
// echo_scan_images Storage 파일도 함께 삭제
// =============================================
export async function deleteEchoChart(echoId: string): Promise<void> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. 스캔 이미지 Storage 파일 삭제 (DB 레코드는 CASCADE로 자동 삭제됨)
  const { data: scanImages } = await supabase
    .from('echo_scan_images')
    .select('file_path')
    .eq('echo_id', echoId)

  if (scanImages && scanImages.length > 0) {
    const filePaths = scanImages.map((img) => img.file_path)
    const { error: storageError } = await adminClient.storage
      .from('echo-scan-images')
      .remove(filePaths)
    if (storageError) {
      console.error('[deleteEchoChart] Storage 삭제 실패:', storageError.message)
    }
  }

  // 2. 차트 삭제 (echo_results, echo_scan_images DB 레코드는 CASCADE)
  const { error } = await supabase
    .from('echo_charts')
    .delete()
    .eq('id', echoId)
  if (error) throw new Error(`deleteEchoChart: ${error.message}`)
}

// =============================================
// 가이드 이미지 삭제 (레코드 + 스토리지 파일)
// =============================================
export async function deleteEchoGuideImage(imageId: string): Promise<void> {
  const supabase = await createClient()

  // 1. 이미지 URL 가져오기 (파일 삭제용)
  const { data: imageData } = await supabase
    .from('echo_template_guide_images')
    .select('image_url')
    .eq('id', imageId)
    .single()

  // 2. 스토리지 파일 삭제
  if (imageData?.image_url) {
    await deleteEchoGuideImageFile(imageData.image_url)
  }

  // 3. 레코드 삭제
  const { error } = await supabase
    .from('echo_template_guide_images')
    .delete()
    .eq('id', imageId)
  if (error) throw new Error(`deleteEchoGuideImage: ${error.message}`)
}

// =============================================
// 스토리지 파일만 삭제
// =============================================
export async function deleteEchoGuideImageFile(imageUrl: string): Promise<void> {
  const supabase = await createClient()
  
  try {
    // URL에서 스토리지 경로 추출 (예: .../echo_guide/template_id/filename.jpg)
    // echo_guide/ 이후의 문자열을 추출
    const pathParts = imageUrl.split('echo_guide/')
    if (pathParts.length < 2) return

    const filePath = pathParts[1]
    
    const { error } = await supabase.storage
      .from('echo_guide')
      .remove([filePath])

    if (error) {
      console.error(`Storage delete error: ${error.message}`)
    }
  } catch (e) {
    console.error(`Storage delete exception:`, e)
  }
}
