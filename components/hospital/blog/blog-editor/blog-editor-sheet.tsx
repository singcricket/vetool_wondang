'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Loader2, Save, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createBlogPost, updateBlogPost, updateBlogTags } from '@/lib/actions/blog/blog-actions'
import type { BlogPost, BlogPostFormInput, BlogSection, BlogImage, BlogPatient } from '@/types/hospital/blog-type'
import { parseLabData } from '@/types/hospital/blog-type'
import BlogMetaForm from './blog-meta-form'
import BlogSectionEditor from './blog-section-editor'
import BlogImageUpload from './blog-image-upload'
import BlogPdfTab from './blog-pdf-tab'
import BlogLabEditor from './blog-lab-editor'
import BlogThumbnailCreator from '@/components/hospital/blog/blog-thumbnail-creator'

interface Props {
  hosId: string
  open: boolean
  onOpenChange: (v: boolean) => void
  post?: BlogPost   // 수정 시 전달
}

const EMPTY_FORM: BlogPostFormInput = {
  title: '',
  case_category: '',
  diagnosis: '',
  species: '',
  summary: '',
  user_tags: '',
  content: [],
  cover_image_url: '',
  extra_notes: '',
}

type Tab = 'meta' | 'content' | 'images' | 'lab' | 'ai' | 'thumbnail'

export default function BlogEditorSheet({ hosId, open, onOpenChange, post }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<BlogPostFormInput>(() =>
    post
      ? {
          title: post.title,
          case_category: post.case_category,
          diagnosis: post.diagnosis ?? '',
          species: post.species ?? '',
          summary: post.summary ?? '',
          user_tags: post.user_tags ?? '',
          content: post.content,
          cover_image_url: post.cover_image_url ?? '',
          extra_notes: '',
        }
      : EMPTY_FORM,
  )
  const [images, setImages] = useState<BlogImage[]>(post?.images ?? [])
  const [patient, setPatient] = useState<BlogPatient | null>(post?.patient ?? null)
  const [tab, setTab] = useState<Tab>('meta')
  const [saving, setSaving] = useState(false)
  const [postId, setPostId] = useState<string | null>(post?.id ?? null)

  useEffect(() => {
    if (!open) return
    if (post) {
      setForm({
        title: post.title,
        case_category: post.case_category,
        diagnosis: post.diagnosis ?? '',
        species: post.species ?? '',
        summary: post.summary ?? '',
        user_tags: post.user_tags ?? '',
        content: post.content,
        cover_image_url: post.cover_image_url ?? '',
        extra_notes: '',
      })
      setImages(post.images ?? [])
      setPatient(post.patient ?? null)
      setPostId(post.id)
      setTab('meta')
    } else {
      setForm(EMPTY_FORM)
      setImages([])
      setPatient(null)
      setPostId(null)
      setTab('meta')
    }
  }, [open, post?.id])

  const patch = (p: Partial<BlogPostFormInput>) => setForm((f) => ({ ...f, ...p }))

  const handleSaveDraft = async () => {
    if (!form.title.trim()) { toast.error('제목을 입력해주세요.'); return }
    if (!form.case_category) { toast.error('진료 분야를 선택해주세요.'); return }
    setSaving(true)
    try {
      if (postId) {
        await Promise.all([
          updateBlogPost(hosId, postId, { ...form, status: 'draft' }),
          updateBlogTags(hosId, postId, form.user_tags),
        ])
        toast.success('임시저장 완료')
      } else {
        const id = await createBlogPost(hosId, form)
        await updateBlogTags(hosId, id, form.user_tags)
        setPostId(id)
        toast.success('케이스가 생성됐습니다.')
        router.refresh()
      }
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!form.title.trim()) { toast.error('제목을 입력해주세요.'); return }
    if (!form.case_category) { toast.error('진료 분야를 선택해주세요.'); return }
    setSaving(true)
    try {
      if (postId) {
        await Promise.all([
          updateBlogPost(hosId, postId, { ...form, status: 'published' }),
          updateBlogTags(hosId, postId, form.user_tags),
        ])
      } else {
        const id = await createBlogPost(hosId, form)
        await Promise.all([
          updateBlogPost(hosId, id, { status: 'published' }),
          updateBlogTags(hosId, id, form.user_tags),
        ])
        setPostId(id)
      }
      toast.success('발행됐습니다.')
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error('발행에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'meta', label: '기본 정보' },
    { key: 'content', label: '본문' },
    { key: 'images', label: `사진 (${images.length})` },
    { key: 'lab', label: '혈액검사' },
    { key: 'ai', label: 'AI 분석' },
    { key: 'thumbnail', label: '썸네일' },
  ]

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v && !post) { setForm(EMPTY_FORM); setPostId(null); setTab('meta') } }}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b pb-3">
          <SheetTitle>{post ? '케이스 수정' : '새 케이스 작성'}</SheetTitle>
        </SheetHeader>

        {/* 탭 */}
        <div className="shrink-0 border-b">
          <div className="flex">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  tab === key
                    ? 'border-b-2 border-teal-600 text-teal-700'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'meta' && (
            <BlogMetaForm
              value={form}
              onChange={patch}
              hosId={hosId}
              postId={postId}
              patient={patient}
              onPatientChange={setPatient}
            />
          )}
          {tab === 'content' && (
            <BlogSectionEditor
              sections={form.content}
              onChange={(content) => patch({ content })}
            />
          )}
          {tab === 'images' && postId ? (
            <BlogImageUpload
              hosId={hosId}
              postId={postId}
              images={images}
              onImagesChange={setImages}
              sections={form.content}
            />
          ) : tab === 'images' && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
              <p className="text-sm">먼저 임시저장을 완료해야 이미지를 업로드할 수 있습니다.</p>
              <Button size="sm" variant="outline" onClick={handleSaveDraft}>
                임시저장하기
              </Button>
            </div>
          )}
          {tab === 'lab' && postId ? (
            <BlogLabEditor
              hosId={hosId}
              postId={postId}
              initialSessions={parseLabData(post?.blood_test_data).sessions}
              initialComment={parseLabData(post?.blood_test_data).comment}
              species={form.species || undefined}
            />
          ) : tab === 'lab' && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
              <p className="text-sm">먼저 임시저장을 완료해야 혈액검사 데이터를 관리할 수 있습니다.</p>
              <Button size="sm" variant="outline" onClick={handleSaveDraft}>
                임시저장하기
              </Button>
            </div>
          )}
          {tab === 'thumbnail' && postId ? (
            <BlogThumbnailCreator post={post
              ? { ...post, title: form.title, case_category: form.case_category, diagnosis: form.diagnosis || null, species: (form.species as BlogPost['species']) || null, summary: form.summary || null, images }
              : { id: postId, hos_id: hosId, created_by: null, title: form.title, status: 'draft', case_category: form.case_category, diagnosis: form.diagnosis || null, species: (form.species as BlogPost['species']) || null, summary: form.summary || null, user_tags: null, tags: null, patient_id: null, content: form.content, cover_image_url: null, pdf_url: null, blood_test_data: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), published_at: null, images }
            } />
          ) : tab === 'thumbnail' && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
              <p className="text-sm">먼저 임시저장을 완료해야 썸네일을 생성할 수 있습니다.</p>
              <Button size="sm" variant="outline" onClick={handleSaveDraft}>
                임시저장하기
              </Button>
            </div>
          )}
          {tab === 'ai' && postId ? (
            <BlogPdfTab
              hosId={hosId}
              postId={postId}
              currentSpecies={form.species}
              extraNotes={form.extra_notes}
              onApply={(patch) => {
                setForm((f) => ({
                  ...f,
                  content: patch.content,
                  ...(patch.diagnosis !== undefined && { diagnosis: patch.diagnosis }),
                  ...(patch.summary !== undefined && { summary: patch.summary }),
                  ...(patch.species !== undefined && { species: patch.species }),
                }))
                if (patch.patient !== undefined) setPatient(patch.patient)
                setTab('content')
              }}
            />
          ) : tab === 'ai' && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
              <p className="text-sm">먼저 임시저장을 완료해야 AI 분석을 사용할 수 있습니다.</p>
              <Button size="sm" variant="outline" onClick={handleSaveDraft}>
                임시저장하기
              </Button>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="shrink-0 flex gap-2 border-t px-4 py-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex-1 text-xs"
          >
            {saving ? <Loader2 size={13} className="mr-1 animate-spin" /> : <Save size={13} className="mr-1" />}
            임시저장
          </Button>
          <Button
            onClick={handlePublish}
            disabled={saving}
            className="flex-1 bg-teal-600 text-xs hover:bg-teal-700"
          >
            {saving ? <Loader2 size={13} className="mr-1 animate-spin" /> : <Send size={13} className="mr-1" />}
            발행
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
