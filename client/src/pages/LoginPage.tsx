import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return
    setError('')
    setSubmitting(true)
    try {
      await login(username, password)
      navigate(searchParams.get('redirect') || '/', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold text-center mb-2 font-display text-ink">欢迎回来</h1>
      <p className="text-center text-ink/40 text-sm mb-8">登录你的账号继续参与讨论</p>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-warm p-6 space-y-4">
        {error && <div className="bg-cinnabar/5 text-cinnabar text-sm px-3 py-2 rounded-lg">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-ink/60 mb-1">用户名</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-paper border border-warm rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-cinnabar transition-colors" autoComplete="username" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/60 mb-1">密码</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-paper border border-warm rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-cinnabar transition-colors" autoComplete="current-password" />
        </div>
        <button type="submit" disabled={submitting || !username || !password}
          className="w-full bg-cinnabar text-white py-2.5 rounded-lg font-medium hover:bg-cinnabar-dark disabled:opacity-50 transition-colors">
          {submitting ? '登录中…' : '登录'}
        </button>
      </form>
      <p className="text-sm text-center text-ink/40 mt-4">
        还没有账号？<Link to="/register" className="text-cinnabar hover:underline">立即注册</Link>
      </p>
    </div>
  )
}
