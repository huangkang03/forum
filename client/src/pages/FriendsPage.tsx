import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFriends, getPendingRequests, acceptRequest, removeFriend, type FriendUser, type FriendRequest } from '../api/friends'
import { getAvatarUrl } from '../lib/utils'

type Tab = 'friends' | 'incoming' | 'outgoing'

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>('friends')
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [incoming, setIncoming] = useState<FriendRequest[]>([])
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    setLoading(true)
    Promise.all([getFriends(), getPendingRequests()])
      .then(([f, p]) => {
        setFriends(f)
        setIncoming(p.incoming)
        setOutgoing(p.outgoing)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleAccept = async (id: number) => {
    await acceptRequest(id)
    fetchData()
  }

  const handleRemove = async (id: number) => {
    await removeFriend(id)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">好友</h1>

      <div className="flex gap-1 mb-6">
        {([
          ['friends', '我的好友', friends.length],
          ['incoming', '收到的申请', incoming.length],
          ['outgoing', '发出的申请', outgoing.length],
        ] as [Tab, string, number][]).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm rounded-lg ${
              tab === key
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                tab === key ? 'bg-indigo-400' : 'bg-red-500 text-white'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'friends' && (
        friends.length === 0 ? (
          <p className="text-center text-gray-400 py-10">还没有好友，去看看大家的帖子吧</p>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <div key={f.friendship_id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <Link to={`/profile/${f.id}`} className="flex items-center gap-3">
                  <img src={getAvatarUrl(f.avatar_url)} alt="" className="w-10 h-10 rounded-full bg-gray-200" />
                  <span className="font-medium text-gray-700 hover:text-indigo-600">{f.username}</span>
                </Link>
                <button
                  onClick={() => handleRemove(f.friendship_id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  删除好友
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'incoming' && (
        incoming.length === 0 ? (
          <p className="text-center text-gray-400 py-10">没有待处理的好友申请</p>
        ) : (
          <div className="space-y-2">
            {incoming.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <Link to={`/profile/${r.from_user_id}`} className="flex items-center gap-3">
                  <img src={getAvatarUrl(r.avatar_url)} alt="" className="w-10 h-10 rounded-full bg-gray-200" />
                  <span className="font-medium text-gray-700 hover:text-indigo-600">{r.username}</span>
                </Link>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(r.id)}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                  >
                    接受
                  </button>
                  <button
                    onClick={() => handleRemove(r.id)}
                    className="px-3 py-1 border border-gray-300 text-sm rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'outgoing' && (
        outgoing.length === 0 ? (
          <p className="text-center text-gray-400 py-10">没有发出的申请</p>
        ) : (
          <div className="space-y-2">
            {outgoing.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <Link to={`/profile/${r.to_user_id}`} className="flex items-center gap-3">
                  <img src={getAvatarUrl(r.avatar_url)} alt="" className="w-10 h-10 rounded-full bg-gray-200" />
                  <span className="font-medium text-gray-700 hover:text-indigo-600">{r.username}</span>
                </Link>
                <span className="text-sm text-gray-400">等待回应</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
