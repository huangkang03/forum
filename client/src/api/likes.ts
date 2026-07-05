import api from './client'

export async function likePost(postId: number): Promise<{ liked: boolean; like_count: number }> {
  const res = await api.post<{ liked: boolean; like_count: number }>(`/posts/${postId}/like`)
  return res.data
}

export async function unlikePost(postId: number): Promise<{ liked: boolean; like_count: number }> {
  const res = await api.delete<{ liked: boolean; like_count: number }>(`/posts/${postId}/like`)
  return res.data
}
