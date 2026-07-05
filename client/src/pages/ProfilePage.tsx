import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUser, updateProfile, uploadAvatar } from '../api/users'
import { getPosts } from '../api/posts'
import { useAuth } from '../hooks/useAuth'
import type { UserPublic, Post } from '../types'
import { formatRelativeTime } from '../lib/utils'
import { getAvatarUrl } from '../lib/utils'
import PostCard from '../components/PostCard'
import Pagination from '../components/Pagination'
import { getFriendshipStatus, getFriendCount, sendRequest, acceptRequest, removeFriend, type FriendshipStatus } from '../api/friends'

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user: authUser } = useAuth()
  const navigate = useNavigate()
  const userId = parseInt(id!)

  const [profile, setProfile] = useState<UserPublic | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  // Friend state
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus>({ status: 'none' })
  const [friendCount, setFriendCount] = useState(0)
  const [friendLoading, setFriendLoading] = useState(false)

  const isOwn = authUser?.id === userId

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      getUser(userId),
      getPosts({ page, limit: 20 }),
      getFriendCount(userId),
    ])
      .then(([u, pData, count]) => {
        setProfile(u)
        setPosts(pData.data.filter((p) => p.user_id === userId))
        setTotalPages(Math.ceil(pData.data.filter((p) => p.user_id === userId).length / 20) || 1)
        setFriendCount(count)
      })
      .catch(() => setError('用户不存在'))
      .finally(() => setLoading(false))

    if (authUser && authUser.id !== userId) {
      getFriendshipStatus(userId).then(setFriendStatus)
    }
  }, [userId, page, authUser])

  const handleSaveBio = async () => {
    setSaving(true)
    try {
      const updated = await updateProfile({ bio })
      setProfile(updated)
      setEditing(false)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const handleAddFriend = async () => {
    setFriendLoading(true)
    try {
      const res = await sendRequest(userId)
      if (res.status === 'accepted') {
        setFriendStatus({ status: 'accepted' })
      } else {
        setFriendStatus({ status: 'pending', isSender: true })
      }
    } catch {
      // ignore
    } finally {
      setFriendLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!friendStatus.friendshipId) return
    setFriendLoading(true)
    try {
      await acceptRequest(friendStatus.friendshipId)
      setFriendStatus({ status: 'accepted' })
      setFriendCount((c) => c + 1)
    } catch {
      // ignore
    } finally {
      setFriendLoading(false)
    }
  }

  const handleRemoveFriend = async () => {
    if (!friendStatus.friendshipId) return
    setFriendLoading(true)
    try {
      await removeFriend(friendStatus.friendshipId)
      setFriendStatus({ status: 'none' })
      setFriendCount((c) => Math.max(0, c - 1))
    } catch {
      // ignore
    } finally {
      setFriendLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-cinnabar border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-cinnabar">{error || '用户不存在'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-warm rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <img src={getAvatarUrl(profile.avatar_url)} alt="" className="w-16 h-16 rounded-full bg-warm object-cover" />
            {isOwn && (
              <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const result = await uploadAvatar(file)
                      setProfile(result.user)
                    } catch {
                      // ignore
                    }
                  }}
                />
              </label>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{profile.username}</h1>
              {!isOwn && authUser && (
                <div>
                  {friendStatus.status === 'none' && (
                    <button
                      onClick={handleAddFriend}
                      disabled={friendLoading}
                      className="px-3 py-1 bg-cinnabar text-white text-sm rounded-xl hover:bg-cinnabar-dark disabled:opacity-40"
                    >
                      {friendLoading ? '处理中…' : '加好友'}
                    </button>
                  )}
                  {friendStatus.status === 'pending' && friendStatus.isSender && (
                    <button disabled className="px-3 py-1 bg-warm text-ink/40 text-sm rounded-xl cursor-not-allowed">
                      已发送申请
                    </button>
                  )}
                  {friendStatus.status === 'pending' && !friendStatus.isSender && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleAccept}
                        disabled={friendLoading}
                        className="px-3 py-1 bg-cinnabar text-white text-sm rounded-xl hover:bg-cinnabar-dark disabled:opacity-40"
                      >
                        接受申请
                      </button>
                      <button
                        onClick={handleRemoveFriend}
                        disabled={friendLoading}
                        className="px-3 py-1 border border-warm text-sm rounded-xl text-ink/60 hover:bg-paper"
                      >
                        拒绝
                      </button>
                    </div>
                  )}
                  {friendStatus.status === 'accepted' && (
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-paper text-ink/40 text-sm rounded-xl">已是好友</span>
                      <button
                        onClick={handleRemoveFriend}
                        disabled={friendLoading}
                        className="px-3 py-1 text-cinnabar text-sm hover:text-cinnabar-dark"
                      >
                        删除好友
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-ink/30">
              {formatRelativeTime(profile.created_at)} 加入
              <span className="mx-2">·</span>
              <button onClick={() => navigate('/friends')} className="hover:text-cinnabar">
                {friendCount} 位好友
              </button>
            </p>
          </div>
        </div>

        <div className="mt-4">
          {editing ? (
            <div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full border border-warm rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cinnabar resize-none"
                placeholder="写一段自我介绍…"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveBio}
                  disabled={saving}
                  className="px-3 py-1 bg-cinnabar text-white text-sm rounded-xl hover:bg-cinnabar-dark disabled:opacity-40"
                >
                  {saving ? '保存中…' : '保存'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1 border border-warm text-sm rounded-xl text-ink/60 hover:bg-paper"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <p className="text-sm text-ink/60">
                {profile.bio || '这个人很懒，什么都没写…'}
              </p>
              {isOwn && (
                <button
                  onClick={() => { setBio(profile.bio); setEditing(true) }}
                  className="text-sm text-cinnabar hover:underline shrink-0 ml-4"
                >
                  编辑
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">发布的帖子</h2>
      {posts.length === 0 ? (
        <p className="text-center text-ink/30 py-8">还没有发过帖子</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
