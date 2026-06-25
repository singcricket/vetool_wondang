import Image from 'next/image'
import { RefObject } from 'react'
import { cn } from '@/lib/utils/utils'
import {
  SPECIES_LABEL, STATUS_LABEL, STATUS_COLOR, AUDIENCE_COLOR, AUDIENCE_LABEL,
  parseLabData,
  type BlogPost, type BlogSection, type SectionAudience, type BlogImage,
} from '@/types/hospital/blog-type'
import BlogLabSessions from './blog-lab-sessions'
import BlogImageCard from './blog-image-card'
import { getSectionTag, getRegularTags } from '@/components/hospital/blog/blog-editor/blog-image-upload'

export type ViewAudience = 'all' | 'vet' | 'owner'

interface Props {
  post: BlogPost
  contentRef?: RefObject<HTMLElement | null>
  viewAudience?: ViewAudience
}

function shouldShow(section: BlogSection, viewAudience: ViewAudience): boolean {
  if (section.type === 'image_row') return true
  const a: SectionAudience = section.audience ?? 'both'
  if (viewAudience === 'vet') return a === 'vet' || a === 'both'
  if (viewAudience === 'owner') return a === 'owner' || a === 'both'
  return true
}

function SectionImages({ images }: { images: BlogImage[] }) {
  if (!images.length) return null
  return (
    <div className={cn('mt-3 grid gap-2', images.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
      {images.map((img) => <BlogImageCard key={img.id} img={img} />)}
    </div>
  )
}

export default function BlogViewer({ post, contentRef, viewAudience = 'all' }: Props) {
  const imageMap = new Map((post.images ?? []).map((img) => [img.id, img]))
  const { sessions: labSessions, comment: labComment } = parseLabData(post.blood_test_data)
  const allImages = post.images ?? []

  // 섹션 태그 없는 이미지를 일반 태그별로 그룹핑
  const untaggedImages = allImages.filter((img) => !getSectionTag(img.tags))
  const tagGroupMap = new Map<string, BlogImage[]>()
  const noTagImages: BlogImage[] = []
  for (const img of untaggedImages) {
    const tags = getRegularTags(img.tags)
    if (tags.length === 0) {
      noTagImages.push(img)
    } else {
      for (const tag of tags) {
        if (!tagGroupMap.has(tag)) tagGroupMap.set(tag, [])
        tagGroupMap.get(tag)!.push(img)
      }
    }
  }

  return (
    <article ref={contentRef as RefObject<HTMLElement>} className="mx-auto max-w-2xl space-y-0 bg-white">
      {/* 표지 이미지 */}
      {post.cover_image_url && (
        <div className="relative aspect-video w-full overflow-hidden">
          <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" unoptimized />
        </div>
      )}

      {/* 헤더 */}
      <div className="px-6 py-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-teal-50 px-3 py-0.5 text-xs font-semibold text-teal-700">
            {post.case_category}
          </span>
          {post.species && (
            <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs text-slate-600">
              {SPECIES_LABEL[post.species]}
            </span>
          )}
          <span className={cn('ml-auto rounded px-2 py-0.5 text-[10px] font-medium', STATUS_COLOR[post.status])}>
            {STATUS_LABEL[post.status]}
          </span>
        </div>

        <h1 className="text-xl font-bold text-slate-900 leading-snug">{post.title}</h1>
        {post.diagnosis && (
          <p className="mt-1 text-sm font-medium text-slate-500">진단: {post.diagnosis}</p>
        )}
        {post.summary && (
          <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 leading-relaxed">
            {post.summary}
          </p>
        )}
        <p className="mt-3 text-[11px] text-slate-400">
          {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {labSessions.length > 0 && (
        <BlogLabSessions
          sessions={labSessions}
          comment={labComment}
          patientName={post.patient?.name}
        />
      )}

      <div className="divide-y divide-slate-100">
        {(post.content as BlogSection[]).map((section, idx) => {
          if (!shouldShow(section, viewAudience)) return null

          if (section.type === 'image_row') {
            const rowImages = section.image_ids
              .map((id) => imageMap.get(id))
              .filter(Boolean) as NonNullable<ReturnType<typeof imageMap.get>>[]
            if (!rowImages.length) return null
            return (
              <div key={idx} className="px-6 py-4">
                <div className={cn('grid gap-2', rowImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                  {rowImages.map((img) => (
                    <div key={img.id}>
                      <BlogImageCard img={img} />
                      {getRegularTags(img.tags).length > 0 && (
                        <div className="mt-1 flex flex-wrap justify-center gap-1">
                          {getRegularTags(img.tags).map((t) => (
                            <span key={t} className="rounded bg-teal-50 px-1.5 py-0.5 text-[9px] text-teal-600">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          if (section.type === 'disease_info') {
            const a: SectionAudience = section.audience ?? 'both'
            const sectionImgs = allImages.filter((img) => getSectionTag(img.tags) === section.title)
            return (
              <div key={idx} className="bg-blue-50/40 px-6 py-5">
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-sm font-bold text-blue-800">{section.title || '질병 안내'}</h2>
                  {viewAudience === 'all' && a !== 'both' && (
                    <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-medium', AUDIENCE_COLOR[a])}>
                      {AUDIENCE_LABEL[a]}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-blue-700">{section.body}</p>
                <SectionImages images={sectionImgs} />
              </div>
            )
          }

          // type === 'section'
          const a: SectionAudience = section.audience ?? 'both'
          const sectionImgs = allImages.filter((img) => getSectionTag(img.tags) === section.title)
          return (
            <div key={idx} className="px-6 py-5">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">{section.title}</h2>
                {viewAudience === 'all' && a !== 'both' && (
                  <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-medium', AUDIENCE_COLOR[a])}>
                    {AUDIENCE_LABEL[a]}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{section.body}</p>
              <SectionImages images={sectionImgs} />
            </div>
          )
        })}
      </div>

      {/* 섹션 미연결 이미지 — 태그별 그룹 */}
      {(tagGroupMap.size > 0 || noTagImages.length > 0) && (
        <div className="divide-y divide-slate-100 border-t">
          {Array.from(tagGroupMap.entries()).map(([tag, imgs]) => (
            <div key={tag} className="px-6 py-5">
              <p className="mb-2 text-xs font-semibold text-teal-700">#{tag}</p>
              <SectionImages images={imgs} />
            </div>
          ))}
          {noTagImages.length > 0 && (
            <div className="px-6 py-5">
              <p className="mb-2 text-xs font-semibold text-slate-400">기타 이미지</p>
              <SectionImages images={noTagImages} />
            </div>
          )}
        </div>
      )}
    </article>
  )
}
