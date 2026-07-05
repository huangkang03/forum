import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState, useEffect } from 'react'
import { getPendingRequests } from '../api/friends'

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
    <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-warm">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link to="/" className="text-lg font-bold text-cinnabar font-display tracking-tight shrink-0">
          hk的论坛
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="搜索…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full px-3 py-1.5 bg-paper border border-warm rounded-lg text-sm text-ink placeholder:text-warm-dark focus:outline-none focus:border-cinnabar transition-colors"
          />
        </form>

        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-sm font-medium text-sage hover:text-sage-dark transition-colors">
                  管理
                </Link>
              )}
              <Link to="/friends" className="relative text-sm text-ink/70 hover:text-cinnabar transition-colors">
                好友
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-3 bg-cinnabar text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-medium">
                    {pendingCount}
                  </span>
                )}
              </Link>
              <Link to="/posts/new" className="bg-cinnabar text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-cinnabar-dark transition-colors">
                发帖
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-sm text-ink/70 hover:text-ink"
                >
                  <img src={user!.avatar_url} alt="" className="w-7 h-7 rounded-full border border-warm" />
                  <span className="hidden sm:inline">{user!.username}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-warm rounded-lg shadow-lg py-1 w-28 z-10">
                    <Link to={`/profile/${user!.id}`} className="block px-4 py-2 text-sm text-ink/70 hover:bg-paper" onClick={() => setMenuOpen(false)}>
                      个人主页
                    </Link>
                    <button onClick={() => { logout(); setMenuOpen(false) }} className="block w-full text-left px-4 py-2 text-sm text-cinnabar hover:bg-paper">
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-ink/60 hover:text-cinnabar transition-colors">登录</Link>
              <Link to="/register" className="bg-cinnabar text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-cinnabar-dark transition-colors">注册</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
