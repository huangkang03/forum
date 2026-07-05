import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { formatRelativeTime } from '../lib/utils'
import { getAvatarUrl } from '../lib/utils'
import { deleteReply } from '../api/replies'
import type { Reply } from '../types'

interface ReplyItemProps {
  reply: Reply
  onReplyCreated: () => void
  onReplyDeleted: () => void
  postId: number
  createReplyFn: (postId: number, data: { content: string; parent_reply_id?: number }) => Promise<any>
}

export default function ReplyItem({ reply, onReplyCreated, onReplyDeleted, postId, createReplyFn }: ReplyItemProps) {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const canDelete = user && (user.role === 'admin' || user.id === reply.user_id)

  const handleDelete = async () => {
    if (!confirm('确定要删除这条回复吗？')) return
    setDeleting(true)
    try {
      await deleteReply(reply.id)
      onReplyDeleted()
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || submitting) return
    setSubmitting(true)
    try {
      await createReplyFn(postId, { content: content.trim(), parent_reply_id: reply.id })
      setContent('')
      setShowForm(false)
      onReplyCreated()
    } catch {
      // error handled by API layer
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`${reply.parent_reply_id ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1">
          <Link to={`/profile/${reply.user_id}`} className="flex items-center gap-2">
            <img src={getAvatarUrl(reply.avatar_url)} alt="" className="w-5 h-5 rounded-full bg-gray-200" />
            <span className="text-sm font-medium text-gray-700 hover:text-indigo-600">{reply.username}</span>
          </Link>
          <span className="text-xs text-gray-400">{formatRelativeTime(reply.created_at)}</span>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={() => {
              if (!isAuthenticated) { navigate('/login'); return }
              setShowForm(!showForm)
            }}
            className="text-xs text-gray-400 hover:text-indigo-600"
          >
            {showForm ? '取消' : '回复'}
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-400 hover:text-red-600"
            >
              {deleting ? '删除中…' : '删除'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="写下你的回复…"
            />
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="mt-1 px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? '发送中…' : '回复'}
            </button>
          </form>
        )}
      </div>

      {reply.children && reply.children.length > 0 && (
        <div>
          {reply.children.map((child) => (
            <ReplyItem
              key={child.id}
              reply={child}
              onReplyCreated={onReplyCreated}
              onReplyDeleted={onReplyDeleted}
              postId={postId}
              createReplyFn={createReplyFn}
            />
          ))}
        </div>
      )}
    </div>
  )
}
