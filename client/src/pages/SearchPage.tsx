import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPosts } from '../api/posts'
import type { Post } from '../types'
import PostCard from '../components/PostCard'
import Pagination from '../components/Pagination'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const q = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    if (!q) { setPosts([]); setLoading(false); return }
    setLoading(true)
    setError('')
    getPosts({ page, search: q })
      .then((data) => {
        setPosts(data.data)
        setTotalPages(data.totalPages)
      })
      .catch(() => setError('搜索失败'))
      .finally(() => setLoading(false))
  }, [q, page])

  const updatePage = (p: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', p.toString())
    setSearchParams(next)
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">
        {q ? `"${q}" 的搜索结果` : '搜索'}
      </h1>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      )}

      {error && <p className="text-center text-red-500 py-10">{error}</p>}

      {!loading && !error && q && posts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">未找到与 "{q}" 相关的结果</p>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={updatePage} />
    </div>
  )
}
