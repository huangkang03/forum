import { Link } from 'react-router-dom'
import type { Post } from '../types'
import { formatRelativeTime, truncate } from '../lib/utils'
import { getCategoryColor } from '../types'
import LikeButton from './LikeButton'

export default function PostCard({ post }: { post: Post }) {
  return (
    <div className="bg-white rounded-xl border border-warm p-5 card-hover">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryColor(post.category)}`}>
          {post.category}
        </span>
        <span className="text-xs text-ink/40">{formatRelativeTime(post.created_at)}</span>
      </div>

      <Link to={`/posts/${post.id}`}>
        <h2 className="text-lg font-semibold text-ink hover:text-cinnabar transition-colors mb-1.5 leading-snug">
          {post.title}
        </h2>
        <p className="text-sm text-ink/50 mb-4 leading-relaxed">
          {truncate(post.content, 150)}
        </p>
      </Link>

      <div className="flex items-center justify-between">
        <Link to={`/profile/${post.user_id}`} className="flex items-center gap-2">
          <img src={post.avatar_url} alt="" className="w-6 h-6 rounded-full border border-warm" />
          <span className="text-sm text-ink/50 hover:text-cinnabar transition-colors">{post.username}</span>
        </Link>

        <div className="flex items-center gap-4 text-sm text-ink/30">
          <LikeButton postId={post.id} initialLiked={post.liked_by_user} initialCount={post.like_count} />
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
            </svg>
            {post.reply_count}
          </span>
        </div>
      </div>
    </div>
  )
}
