'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { BlogImage } from '@/types/hospital/blog-type'

const IMAGE_BUCKET = 'blog-posts'
const PDF_BUCKET = 'blog-pdfs'

// ── 이미지 목록 ───────────────────────────────────────────────

export async function getBlogImages(postId: string): Promise<BlogImage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_post_images')
    .select('*')
    .eq('blog_post_id', postId)
    .order('order_index', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as BlogImage[]
}

// ── 이미지 업로드 + DB 등록 ───────────────────────────────────

export async function uploadBlogImage(
  hosId: string,
  postId: string,
  base64: string,
  mimeType: string,
  tags: string[],
  caption: string,
  orderIndex: number,
): Promise<BlogImage> {
  const adminClient = createAdminClient()
  const supabase = await createClient()

  const ext = mimeType.split('/')[1] ?? 'jpg'
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `${hosId}/${postId}/${fileName}`

  const buffer = Buffer.from(base64, 'base64')
  const { error: uploadError } = await adminClient.storage
    .from(IMAGE_BUCKET)
    .upload(filePath, buffer, { contentType: mimeType, cacheControl: '3600', upsert: false })

  if (uploadError) throw new Error(uploadError.message)

  const { data: urlData } = adminClient.storage.from(IMAGE_BUCKET).getPublicUrl(filePath)

  const { data, error } = await supabase
    .from('blog_post_images')
    .insert({
      blog_post_id: postId,
      hos_id: hosId,
      image_url: urlData.publicUrl,
      tags,
      caption: caption || null,
      order_index: orderIndex,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as BlogImage
}

// ── 이미지 태그/캡션 수정 ─────────────────────────────────────

export async function updateBlogImage(
  imageId: string,
  patch: { tags?: string[]; caption?: string | null },
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('blog_post_images')
    .update(patch)
    .eq('id', imageId)

  if (error) throw new Error(error.message)
}

// ── 자르기 후 이미지 파일 교체 ───────────────────────────────

export async function replaceBlogImageFile(
  imageId: string,
  hosId: string,
  postId: string,
  oldImageUrl: string,
  base64: string,
  mimeType: string,
): Promise<string> {
  const adminClient = createAdminClient()
  const supabase = await createClient()

  const ext = mimeType.split('/')[1] ?? 'jpg'
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `${hosId}/${postId}/${fileName}`
  const buffer = Buffer.from(base64, 'base64')

  const { error: uploadError } = await adminClient.storage
    .from(IMAGE_BUCKET)
    .upload(filePath, buffer, { contentType: mimeType, cacheControl: '3600', upsert: false })

  if (uploadError) throw new Error(uploadError.message)

  const { data: urlData } = adminClient.storage.from(IMAGE_BUCKET).getPublicUrl(filePath)
  const newUrl = urlData.publicUrl

  const { error } = await supabase
    .from('blog_post_images')
    .update({ image_url: newUrl, caption: null })
    .eq('id', imageId)

  if (error) throw new Error(error.message)

  // 기존 파일 삭제 (오류는 무시)
  try {
    const url = new URL(oldImageUrl)
    const pathParts = url.pathname.split(`/${IMAGE_BUCKET}/`)
    if (pathParts[1]) await adminClient.storage.from(IMAGE_BUCKET).remove([pathParts[1]])
  } catch { /* ignore */ }

  return newUrl
}

// ── 이미지 순서 일괄 업데이트 ─────────────────────────────────

export async function updateBlogImageOrder(
  imageIds: string[],
): Promise<void> {
  const supabase = await createClient()
  await Promise.all(
    imageIds.map((id, idx) =>
      supabase.from('blog_post_images').update({ order_index: idx }).eq('id', id),
    ),
  )
}

// ── 이미지 삭제 ───────────────────────────────────────────────

export async function deleteBlogImage(
  hosId: string,
  postId: string,
  imageId: string,
  imageUrl: string,
): Promise<void> {
  const adminClient = createAdminClient()
  const supabase = await createClient()

  // storage 경로 추출 후 삭제
  const url = new URL(imageUrl)
  const pathParts = url.pathname.split(`/${IMAGE_BUCKET}/`)
  if (pathParts[1]) {
    await adminClient.storage.from(IMAGE_BUCKET).remove([pathParts[1]])
  }

  const { error } = await supabase
    .from('blog_post_images')
    .delete()
    .eq('id', imageId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/blog/${postId}`)
}

// ── 썸네일 → cover_image_url 저장 ────────────────────────────

export async function saveThumbnailAsCover(
  hosId: string,
  postId: string,
  base64: string,
  oldCoverUrl?: string | null,
): Promise<string> {
  const adminClient = createAdminClient()
  const supabase = await createClient()

  const fileName = `thumbnail_${Date.now()}.png`
  const filePath = `${hosId}/${postId}/${fileName}`
  const buffer = Buffer.from(base64, 'base64')

  const { error: uploadError } = await adminClient.storage
    .from(IMAGE_BUCKET)
    .upload(filePath, buffer, { contentType: 'image/png', cacheControl: '3600', upsert: false })

  if (uploadError) throw new Error(uploadError.message)

  const { data: urlData } = adminClient.storage.from(IMAGE_BUCKET).getPublicUrl(filePath)
  const newUrl = urlData.publicUrl

  const { error } = await supabase
    .from('blog_posts')
    .update({ cover_image_url: newUrl })
    .eq('id', postId)

  if (error) throw new Error(error.message)

  // 기존 커버 이미지가 썸네일 파일이면 삭제
  if (oldCoverUrl) {
    try {
      const url = new URL(oldCoverUrl)
      const pathParts = url.pathname.split(`/${IMAGE_BUCKET}/`)
      if (pathParts[1]) await adminClient.storage.from(IMAGE_BUCKET).remove([pathParts[1]])
    } catch { /* ignore */ }
  }

  return newUrl
}

// ── PDF 업로드 ────────────────────────────────────────────────

export async function uploadBlogPdf(
  hosId: string,
  postId: string,
  base64: string,
): Promise<string> {
  const supabase = await createClient()

  const fileName = `${Date.now()}.pdf`
  const filePath = `${hosId}/${postId}/${fileName}`
  const buffer = Buffer.from(base64, 'base64')

  const { error } = await supabase.storage
    .from(PDF_BUCKET)
    .upload(filePath, buffer, { contentType: 'application/pdf', upsert: true })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(PDF_BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}
