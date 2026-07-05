import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (username.length < 3) { setError('用户名至少 3 个字符'); return }
    if (password.length < 6) { setError('密码至少 6 个字符'); return }
    if (password !== confirm) { setError('两次输入的密码不一致'); return }
    setSubmitting(true)
    try {
      await register(username, password)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error || '注册失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold text-center mb-2 font-display text-ink">创建账号</h1>
      <p className="text-center text-ink/40 text-sm mb-8">加入讨论，分享你的想法</p>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-warm p-6 space-y-4">
        {error && <div className="bg-cinnabar/5 text-cinnabar text-sm px-3 py-2 rounded-lg">{error}</div>}
        <div><label className="block text-sm font-medium text-ink/60 mb-1">用户名</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-paper border border-warm rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-cinnabar transition-colors" autoComplete="username" />
        </div>
        <div><label className="block text-sm font-medium text-ink/60 mb-1">密码</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-paper border border-warm rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-cinnabar transition-colors" autoComplete="new-password" />
        </div>
        <div><label className="block text-sm font-medium text-ink/60 mb-1">确认密码</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-paper border border-warm rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-cinnabar transition-colors" autoComplete="new-password" />
        </div>
        <button type="submit" disabled={submitting}
          className="w-full bg-cinnabar text-white py-2.5 rounded-lg font-medium hover:bg-cinnabar-dark disabled:opacity-50 transition-colors">
          {submitting ? '注册中…' : '注册'}
        </button>
      </form>
      <p className="text-sm text-center text-ink/40 mt-4">
        已有账号？<Link to="/login" className="text-cinnabar hover:underline">去登录</Link>
      </p>
    </div>
  )
}
