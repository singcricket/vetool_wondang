import { notFound } from 'next/navigation'
import { getBlogPost } from '@/lib/actions/blog/blog-actions'
import BlogDetailClient from '@/components/hospital/blog/blog-viewer/blog-detail-client'

export default async function BlogDetailPage(props: {
  params: Promise<{ hos_id: string; blog_id: string }>
}) {
  const { hos_id, blog_id } = await props.params
  const post = await getBlogPost(hos_id, blog_id)
  if (!post) notFound()

  return (
    <div className="h-full">
      <BlogDetailClient hosId={hos_id} post={post} />
    </div>
  )
}
