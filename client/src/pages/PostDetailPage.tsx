import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPost, deletePost } from '../api/posts'
import { getReplies, createReply } from '../api/replies'
import { useAuth } from '../hooks/useAuth'
import type { Post, Reply } from '../types'
import { getCategoryColor } from '../types'
import { formatRelativeTime } from '../lib/utils'
import { getAvatarUrl } from '../lib/utils'
import LikeButton from '../components/LikeButton'
import ReplyItem from '../components/ReplyItem'

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const postId = parseInt(id!)

  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [replying, setReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [replyError, setReplyError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const fetchData = () => {
    setLoading(true)
    setError('')
    Promise.all([getPost(postId), getReplies(postId)])
      .then(([p, r]) => {
        setPost(p)
        setReplies(r.data)
      })
      .catch(() => setError('加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [postId])

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || replySubmitting) return
    setReplyError('')
    setReplySubmitting(true)
    try {
      await createReply(postId, { content: replyContent.trim() })
      setReplyContent('')
      setReplying(false)
      fetchData()
    } catch (err: any) {
      setReplyError(err.response?.data?.error || '回复失败')
    } finally {
      setReplySubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个帖子吗？')) return
    setDeleting(true)
    try {
      await deletePost(postId)
      navigate('/', { replace: true })
    } catch {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-cinnabar border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="text-center py-20">
        <p className="text-cinnabar">{error || '帖子不存在'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-warm rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${getCategoryColor(post.category)}`}>
            {post.category}
          </span>
          <span className="text-xs text-ink/30">{formatRelativeTime(post.created_at)}</span>
        </div>

        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center gap-3 mb-6">
          <Link to={`/profile/${post.user_id}`} className="flex items-center gap-2">
            <img src={getAvatarUrl(post.avatar_url)} alt="" className="w-8 h-8 rounded-full bg-warm" />
            <span className="text-sm font-medium text-ink/80 hover:text-cinnabar">{post.username}</span>
          </Link>
        </div>

        <div className="prose max-w-none text-ink whitespace-pre-wrap mb-6">
          {post.content}
        </div>

        <div className="flex items-center justify-between border-t border-warm pt-4">
          <div className="flex items-center gap-4">
            <LikeButton postId={post.id} initialLiked={post.liked_by_user} initialCount={post.like_count} />
            <span className="text-sm text-ink/30">{post.reply_count} 条回复</span>
          </div>
          {isAuthenticated && (user?.id === post.user_id || user?.role === 'admin') && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-cinnabar hover:text-cinnabar-dark"
            >
              {deleting ? '删除中…' : '删除'}
            </button>
          )}
        </div>
      </div>

      {/* 回复区 */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">回复 ({post.reply_count})</h2>

        {isAuthenticated && (
          <div className="bg-white border border-warm rounded-xl p-4 mb-4">
            {!replying ? (
              <button
                onClick={() => setReplying(true)}
                className="text-sm text-cinnabar hover:underline"
              >
                写回复…
              </button>
            ) : (
              <form onSubmit={handleReply}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  className="w-full border border-warm rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cinnabar resize-none"
                  placeholder="写下你的回复…"
                />
                {replyError && <p className="text-cinnabar text-xs mt-1">{replyError}</p>}
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || replySubmitting}
                    className="px-4 py-1.5 bg-cinnabar text-white text-sm rounded-xl hover:bg-cinnabar-dark disabled:opacity-40"
                  >
                    {replySubmitting ? '发送中…' : '回复'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReplying(false); setReplyContent('') }}
                    className="px-4 py-1.5 border border-warm text-sm rounded-xl text-ink/60 hover:bg-paper"
                  >
                    取消
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {!isAuthenticated && (
          <div className="bg-paper border border-warm rounded-xl p-4 mb-4 text-center">
            <Link to="/login" className="text-cinnabar hover:underline text-sm">
              登录后参与回复
            </Link>
          </div>
        )}

        {replies.length === 0 && (
          <p className="text-center text-ink/30 py-8">暂无回复，来抢沙发吧！</p>
        )}

        {replies.map((reply) => (
          <div key={reply.id} className="bg-white border border-warm rounded-xl p-4 mb-2">
            <ReplyItem
              reply={reply}
              onReplyCreated={fetchData}
              onReplyDeleted={fetchData}
              postId={postId}
              createReplyFn={createReply}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
