import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState, useEffect } from 'react'
import { getPendingRequests } from '../api/friends'
import { getAvatarUrl } from '../lib/utils'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) return
    getPendingRequests()
      .then((data) => setPendingCount(data.incoming.length))
      .catch(() => {})
  }, [isAuthenticated])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`)
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link to="/" className="text-xl font-bold text-indigo-600 shrink-0">
          hk的论坛
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="搜索帖子…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </form>

        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                  管理
                </Link>
              )}
              <Link
                to="/friends"
                className="relative text-sm font-medium text-gray-600 hover:text-indigo-600"
              >
                好友
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </Link>
              <Link
                to="/posts/new"
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                发帖
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <img
                    src={getAvatarUrl(user!.avatar_url)}
                    alt=""
                    className="w-7 h-7 rounded-full bg-gray-200"
                  />
                  <span className="hidden sm:inline">{user!.username}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-28 z-10">
                    <Link
                      to={`/profile/${user!.id}`}
                      className="block px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      个人主页
                    </Link>
                    <button
                      onClick={() => { logout(); setMenuOpen(false) }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                登录
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
