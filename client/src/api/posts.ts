import api from './client'
import type { Post, PaginatedResponse, CreatePostRequest } from '../types'

export async function getPosts(params: {
  page?: number
  limit?: number
  sort?: string
  category?: string
  search?: string
}): Promise<PaginatedResponse<Post>> {
  const res = await api.get<PaginatedResponse<Post>>('/posts', { params })
  return res.data
}

export async function getPost(id: number): Promise<Post> {
  const res = await api.get<{ post: Post }>(`/posts/${id}`)
  return res.data.post
}

export async function createPost(data: CreatePostRequest): Promise<Post> {
  const res = await api.post<{ post: Post }>('/posts', data)
  return res.data.post
}

export async function deletePost(id: number): Promise<void> {
  await api.delete(`/posts/${id}`)
}
