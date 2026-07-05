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
  role: 'user' | 'admin'
  created_at: string
}

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
      return
    }

    api.get<{ users: AdminUser[] }>('/admin/users')
      .then((res) => setUsers(res.data.users))
      .finally(() => setLoading(false))
  }, [user, navigate])

  const handleRoleChange = async (userId: number, role: 'user' | 'admin') => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
      setMessage(`用户角色已更新为 ${role === 'admin' ? '管理员' : '普通用户'}`)
      setTimeout(() => setMessage(''), 3000)
    } catch {
      setMessage('操作失败')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">管理后台</h1>
      <p className="text-sm text-gray-500 mb-6">管理论坛用户和内容</p>

      {message && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg mb-4">
          {message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm text-gray-500">
          用户管理 ({users.length})
        </div>
        <div className="divide-y divide-gray-100">
          {users.map((u) => (
            <div key={u.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={getAvatarUrl(u.avatar_url)} alt="" className="w-8 h-8 rounded-full bg-gray-200" />
                <div>
                  <span className="text-sm font-medium">{u.username}</span>
                  <span className="text-xs text-gray-400 ml-2">{formatRelativeTime(u.created_at)} 加入</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {u.id === user?.id ? (
                  <span className="text-xs text-gray-400">当前用户</span>
                ) : (
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as 'user' | 'admin')}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                )}
                {u.role === 'admin' && (
                  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">管理员</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
