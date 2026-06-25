import { getBlogPosts } from '@/lib/actions/blog/blog-actions'
import BlogListClient from '@/components/hospital/blog/blog-list-client'

export default async function BlogPage(props: { params: Promise<{ hos_id: string }> }) {
  const { hos_id } = await props.params
  const posts = await getBlogPosts(hos_id)

  return (
    <div className="h-full overflow-y-auto">
      <BlogListClient hosId={hos_id} posts={posts} />
    </div>
  )
}
