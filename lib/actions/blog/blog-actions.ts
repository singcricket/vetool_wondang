'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BlogPost, BlogPostFormInput, BlogSection } from '@/types/hospital/blog-type'

// ── 목록 ──────────────────────────────────────────────────────

export async function getBlogPosts(hosId: string): Promise<BlogPost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('hos_id', hosId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as BlogPost[]
}

// ── 단건 (이미지 포함) ────────────────────────────────────────

export async function getBlogPost(hosId: string, postId: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, images:blog_post_images(*), patient:patients(patient_id, name, species, breed, gender, birth, hos_patient_id, is_alive, owner_name)')
    .eq('hos_id', hosId)
    .eq('id', postId)
    .single()

  if (error) return null
  const post = data as any
  const images = (post.images ?? []).sort((a: any, b: any) => a.order_index - b.order_index)
  return { ...post, images } as BlogPost
}

// ── 생성 ──────────────────────────────────────────────────────

export async function createBlogPost(
  hosId: string,
  input: BlogPostFormInput,
): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      hos_id: hosId,
      created_by: user?.id ?? null,
      title: input.title,
      case_category: input.case_category,
      diagnosis: input.diagnosis || null,
      species: input.species || null,
      summary: input.summary || null,
      user_tags: input.user_tags || null,
      content: input.content as any,
      cover_image_url: input.cover_image_url || null,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/blog`)
  return data.id
}

// ── 수정 ──────────────────────────────────────────────────────

export async function updateBlogPost(
  hosId: string,
  postId: string,
  input: Partial<BlogPostFormInput> & { status?: string; pdf_url?: string },
): Promise<void> {
  const supabase = await createClient()
  const patch: Record<string, any> = {}

  if (input.title !== undefined) patch.title = input.title
  if (input.case_category !== undefined) patch.case_category = input.case_category
  if (input.diagnosis !== undefined) patch.diagnosis = input.diagnosis || null
  if (input.species !== undefined) patch.species = input.species || null
  if (input.summary !== undefined) patch.summary = input.summary || null
  if (input.content !== undefined) patch.content = input.content
  if (input.cover_image_url !== undefined) patch.cover_image_url = input.cover_image_url || null
  if (input.user_tags !== undefined) patch.user_tags = input.user_tags || null
  if (input.status !== undefined) {
    patch.status = input.status
    if (input.status === 'published') patch.published_at = new Date().toISOString()
  }
  if (input.pdf_url !== undefined) patch.pdf_url = input.pdf_url || null

  const { error } = await supabase
    .from('blog_posts')
    .update(patch)
    .eq('id', postId)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/blog`)
  revalidatePath(`/hospital/${hosId}/blog/${postId}`)
}

// ── 섹션 content만 업데이트 ───────────────────────────────────

export async function updateBlogContent(
  hosId: string,
  postId: string,
  content: BlogSection[],
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('blog_posts')
    .update({ content: content as any })
    .eq('id', postId)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/blog/${postId}`)
}

// ── 환자 연결/해제 ────────────────────────────────────────────

export async function updateBlogPatient(
  hosId: string,
  postId: string,
  patientId: string | null,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('blog_posts')
    .update({ patient_id: patientId })
    .eq('id', postId)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/blog`)
  revalidatePath(`/hospital/${hosId}/blog/${postId}`)
}

// ── 태그 업데이트 (keywords 테이블 연동) ──────────────────────

export async function updateBlogTags(
  hosId: string,
  postId: string,
  userTagsRaw: string,
): Promise<void> {
  const supabase = await createClient()

  const userTagsArray = userTagsRaw
    .split(',')
    .map((t) => {
      const trimmed = t.trim()
      // '심장병(HF)' → 'HF' 형태 처리 (Autocomplete 삽입 포맷)
      const match = trimmed.match(/\(([^)]+)\)/)
      return match ? match[1].trim() : trimmed
    })
    .filter((t) => t.length > 0)

  // keywords 테이블에서 매칭 태그 조회
  const { data: keywordRows } = userTagsArray.length
    ? await supabase.from('keywords').select('tags').in('keyword', userTagsArray)
    : { data: [] }

  // keywords.tags (#tag1#tag2 형태) 파싱 — user_tags는 포함하지 않음
  const relatedSet = new Set<string>()
  keywordRows?.forEach((row) => {
    if (row.tags) {
      row.tags.split('#').filter((t: string) => t.trim().length > 0).forEach((t: string) => relatedSet.add(t))
    }
  })

  const finalTags = Array.from(relatedSet).map((t) => `#${t}`).join('')

  const { error } = await supabase
    .from('blog_posts')
    .update({ user_tags: userTagsRaw || null, tags: finalTags || null })
    .eq('id', postId)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/blog`)
  revalidatePath(`/hospital/${hosId}/blog/${postId}`)
}

// ── 삭제 ──────────────────────────────────────────────────────

export async function deleteBlogPost(hosId: string, postId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', postId)
    .eq('hos_id', hosId)

  if (error) throw new Error(error.message)
  revalidatePath(`/hospital/${hosId}/blog`)
}
