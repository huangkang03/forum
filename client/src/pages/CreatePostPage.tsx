import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPost } from '../api/posts'
import { CATEGORIES } from '../types'

export default function CreatePostPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('综合')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setError('')
    setSubmitting(true)
    try {
      const post = await createPost({ title: title.trim(), content: content.trim(), category })
      navigate(`/posts/${post.id}`, { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error || '发帖失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">发布帖子</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-warm rounded-xl p-6 space-y-4">
        {error && (
          <div className="bg-cinnabar/5 text-cinnabar text-sm px-3 py-2 rounded">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-ink/80 mb-1">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full border border-warm rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cinnabar"
            placeholder="输入帖子标题…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80 mb-1">分类</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-warm rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cinnabar"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80 mb-1">内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            maxLength={10000}
            className="w-full border border-warm rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cinnabar resize-y"
            placeholder="写下你想分享的内容…"
          />
          <div className="text-xs text-ink/30 mt-1">{content.length}/10000</div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="bg-cinnabar text-white px-6 py-2 rounded-xl font-medium hover:bg-cinnabar-dark disabled:opacity-40"
          >
            {submitting ? '发布中…' : '发布'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-warm rounded-xl font-medium text-ink/60 hover:bg-paper"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
