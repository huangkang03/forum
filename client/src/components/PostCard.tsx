import { Link } from 'react-router-dom'
import type { Post } from '../types'
import { formatRelativeTime, truncate } from '../lib/utils'
import { getAvatarUrl } from '../lib/utils'
import { getCategoryColor } from '../types'
import LikeButton from './LikeButton'

export default function PostCard({ post }: { post: Post }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getCategoryColor(post.category)}`}>
          {post.category}
        </span>
        <span className="text-xs text-gray-400">
          {formatRelativeTime(post.created_at)}
        </span>
      </div>

      <Link to={`/posts/${post.id}`} className="block">
        <h2 className="text-lg font-semibold text-gray-900 hover:text-indigo-600 mb-1">
          {post.title}
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          {truncate(post.content, 150)}
        </p>
      </Link>

      <div className="flex items-center justify-between">
        <Link to={`/profile/${post.user_id}`} className="flex items-center gap-2">
          <img src={getAvatarUrl(post.avatar_url)} alt="" className="w-6 h-6 rounded-full bg-gray-200" />
          <span className="text-sm text-gray-600 hover:text-indigo-600">{post.username}</span>
        </Link>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <LikeButton postId={post.id} initialLiked={post.liked_by_user} initialCount={post.like_count} />
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post.reply_count}
          </span>
        </div>
      </div>
    </div>
  )
}
