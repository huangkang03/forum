import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPosts } from '../api/posts'
import type { Post } from '../types'
import { CATEGORIES } from '../types'
import PostCard from '../components/PostCard'
import Pagination from '../components/Pagination'

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const page = parseInt(searchParams.get('page') || '1')
  const sort = searchParams.get('sort') || 'latest'
  const category = searchParams.get('category') || ''

  useEffect(() => {
    setLoading(true)
    setError('')
    getPosts({ page, sort, category })
      .then((data) => {
        setPosts(data.data)
        setTotalPages(data.totalPages)
      })
      .catch(() => setError('加载失败'))
      .finally(() => setLoading(false))
  }, [page, sort, category])

  const updateParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(updates)) {
      if (v) { next.set(k, v) } else { next.delete(k) }
    }
    if (updates.category !== undefined || updates.sort !== undefined) { next.delete('page') }
    setSearchParams(next)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex gap-1 flex-wrap">
          {['', ...CATEGORIES].map((cat) => (
            <button key={cat} onClick={() => updateParams({ category: cat })}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                category === cat
                  ? 'bg-ink text-white'
                  : 'text-ink/50 hover:bg-warm'
              }`}>
              {cat || '全部'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {(['latest', 'popular'] as const).map((s) => (
            <button key={s} onClick={() => updateParams({ sort: s })}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                sort === s ? 'bg-ink text-white' : 'text-ink/50 hover:bg-warm'
              }`}>
              {s === 'latest' ? '最新' : '热门'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-cinnabar border-t-transparent rounded-full" />
        </div>
      )}
      {error && (
        <div className="text-center py-10">
          <p className="text-cinnabar mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="text-ink/50 hover:text-cinnabar text-sm transition-colors">重试</button>
        </div>
      )}
      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-ink/30 text-lg mb-2">还没有帖子</p>
          <p className="text-ink/20 text-sm">来发第一个帖子吧！</p>
        </div>
      )}
      {!loading && !error && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => updateParams({ page: p.toString() })} />
    </div>
  )
}
