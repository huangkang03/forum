import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../api/client'
import { formatRelativeTime } from '../lib/utils'
import { getAvatarUrl } from '../lib/utils'

interface AdminUser {
  id: number
  username: string
  avatar_url: string
  pending_avatar?: string
  role: 'user' | 'admin'
  created_at: string
}

interface PendingAvatar {
  id: number
  username: string
  pending_avatar: string
  avatar_url: string
}

type Tab = 'users' | 'avatars'

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pendingAvatars, setPendingAvatars] = useState<PendingAvatar[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get<{ users: AdminUser[] }>('/admin/users'),
      api.get<{ users: PendingAvatar[] }>('/admin/avatars'),
    ]).then(([uRes, aRes]) => {
      setUsers(uRes.data.users)
      setPendingAvatars(aRes.data.users)
      setLoading(false)
    })
  }

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return }
    fetchData()
  }, [user, navigate])

  const handleRoleChange = async (userId: number, role: 'user' | 'admin') => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
      setMessage('角色已更新')
      setTimeout(() => setMessage(''), 3000)
    } catch { setMessage('操作失败'); setTimeout(() => setMessage(''), 3000) }
  }

  const handleApprove = async (userId: number) => {
    try {
      await api.post(`/admin/avatars/${userId}/approve`)
      setPendingAvatars((prev) => prev.filter((u) => u.id !== userId))
      setMessage('头像已通过审核')
      setTimeout(() => setMessage(''), 3000)
    } catch { setMessage('操作失败'); setTimeout(() => setMessage(''), 3000) }
  }

  const handleReject = async (userId: number) => {
    try {
      await api.post(`/admin/avatars/${userId}/reject`)
      setPendingAvatars((prev) => prev.filter((u) => u.id !== userId))
      setMessage('头像已拒绝')
      setTimeout(() => setMessage(''), 3000)
    } catch { setMessage('操作失败'); setTimeout(() => setMessage(''), 3000) }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-cinnabar border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">管理后台</h1>
      <p className="text-sm text-ink/40 mb-6">管理论坛用户和内容</p>

      {message && (
        <div className="bg-sage/10 text-sage-dark text-sm px-4 py-2 rounded-xl mb-4">{message}</div>
      )}

      <div className="flex gap-1 mb-6">
        {([
          { key: 'users' as Tab, label: '用户管理', count: users.length },
          { key: 'avatars' as Tab, label: '头像审核', count: pendingAvatars.length },
        ]).map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={'px-4 py-2 text-sm rounded-xl transition-colors ' +
              (tab === key ? 'bg-cinnabar text-white' : 'bg-white border border-warm text-ink/60 hover:bg-paper')}>
            {label}
            {count > 0 && (
              <span className={'ml-1 px-1.5 py-0.5 text-xs rounded-full ' +
                (tab === key ? 'bg-white/20' : 'bg-cinnabar text-white')}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="bg-white border border-warm rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-warm font-medium text-sm text-ink/40">用户管理 ({users.length})</div>
          <div className="divide-y divide-warm">
            {users.map((u) => (
              <div key={u.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={getAvatarUrl(u.avatar_url)} alt="" className="w-8 h-8 rounded-full bg-warm" />
                  <div>
                    <span className="text-sm font-medium">{u.username}</span>
                    <span className="text-xs text-ink/30 ml-2">{formatRelativeTime(u.created_at)} 加入</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {u.id === user?.id ? (
                    <span className="text-xs text-ink/30">当前用户</span>
                  ) : (
                    <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value as 'user' | 'admin')}
                      className="border border-warm rounded-lg px-2 py-1 text-sm">
                      <option value="user">普通用户</option>
                      <option value="admin">管理员</option>
                    </select>
                  )}
                  {u.role === 'admin' && (
                    <span className="text-xs px-2 py-0.5 bg-sage/20 text-sage-dark rounded-full">管理员</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'avatars' && (
        pendingAvatars.length === 0 ? (
          <p className="text-center text-ink/30 py-10">没有待审核的头像</p>
        ) : (
          <div className="space-y-3">
            {pendingAvatars.map((u) => (
              <div key={u.id} className="bg-white border border-warm rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{u.username}</span>
                    <span className="text-xs text-ink/30">当前</span>
                    <img src={getAvatarUrl(u.avatar_url)} alt="" className="w-10 h-10 rounded-full bg-warm border" />
                    <span className="text-ink/30">→</span>
                    <span className="text-xs text-ink/30">新头像</span>
                    <img src={u.pending_avatar} alt="" className="w-10 h-10 rounded-full bg-warm border-2 border-amber-400" />
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <button onClick={() => handleApprove(u.id)}
                      className="px-3 py-1 bg-sage text-white text-sm rounded-lg hover:bg-sage-dark transition-colors">通过</button>
                    <button onClick={() => handleReject(u.id)}
                      className="px-3 py-1 border border-warm text-sm rounded-lg text-ink/60 hover:bg-paper">拒绝</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
