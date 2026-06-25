import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/utils'
import { SPECIES_LABEL, STATUS_LABEL, STATUS_COLOR, type BlogPost } from '@/types/hospital/blog-type'

interface Props {
  post: BlogPost
  hosId: string
}

export default function BlogPostCard({ post, hosId }: Props) {
  return (
    <Link
      href={`/hospital/${hosId}/blog/${post.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md"
    >
      {post.cover_image_url ? (
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
          <Image src={post.cover_image_url} alt={post.title} fill className="object-cover transition group-hover:scale-105" unoptimized />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-teal-50 to-slate-100" />
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
            {post.case_category}
          </span>
          {post.species && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-500">
              {SPECIES_LABEL[post.species]}
            </span>
          )}
          <span className={cn('ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium', STATUS_COLOR[post.status])}>
            {STATUS_LABEL[post.status]}
          </span>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 leading-snug">{post.title}</h3>
        {post.diagnosis && (
          <p className="text-[11px] text-slate-400">진단: {post.diagnosis}</p>
        )}
        {post.summary && (
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 leading-relaxed">{post.summary}</p>
        )}

        <p className="mt-auto pt-2 text-[10px] text-slate-300">
          {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </Link>
  )
}
