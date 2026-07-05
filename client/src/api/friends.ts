import api from './client'

export interface FriendUser {
  id: number
  username: string
  avatar_url: string
  bio: string
  created_at: string
  friendship_id: number
}

export interface FriendRequest {
  id: number
  from_user_id: number
  to_user_id: number
  status: string
  created_at: string
  username: string
  avatar_url: string
}

export async function getFriends(): Promise<FriendUser[]> {
  const res = await api.get<{ friends: FriendUser[] }>('/friends')
  return res.data.friends
}

export async function getPendingRequests(): Promise<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }> {
  const res = await api.get<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>('/friends/pending')
  return res.data
}

export async function sendRequest(toUserId: number): Promise<{ id: number; status: string; message?: string }> {
  const res = await api.post<{ id: number; status: string; message?: string }>('/friends/request', { toUserId })
  return res.data
}

export async function acceptRequest(requestId: number): Promise<void> {
  await api.post('/friends/accept', { requestId })
}

export async function removeFriend(friendshipId: number): Promise<void> {
  await api.delete(`/friends/${friendshipId}`)
}

export interface FriendshipStatus {
  status: 'none' | 'pending' | 'accepted'
  friendshipId?: number
  isSender?: boolean
}

export async function getFriendshipStatus(userId: number): Promise<FriendshipStatus> {
  const res = await api.get<FriendshipStatus>(`/friends/status/${userId}`)
  return res.data
}

export async function getFriendCount(userId: number): Promise<number> {
  const res = await api.get<{ count: number }>(`/friends/count/${userId}`)
  return res.data.count
}
