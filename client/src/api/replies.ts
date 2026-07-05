import api from './client'
import type { Reply, PaginatedResponse, CreateReplyRequest } from '../types'

export async function getReplies(
  postId: number,
  params?: { page?: number; limit?: number },
): Promise<PaginatedResponse<Reply>> {
  const res = await api.get<PaginatedResponse<Reply>>(`/posts/${postId}/replies`, { params })
  return res.data
}

export async function createReply(postId: number, data: CreateReplyRequest): Promise<Reply> {
  const res = await api.post<{ reply: Reply }>(`/posts/${postId}/replies`, data)
  return res.data.reply
}
