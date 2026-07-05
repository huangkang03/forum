import api from './client'
import type { UserPublic, UpdateProfileRequest } from '../types'

export async function getUser(id: number): Promise<UserPublic> {
  const res = await api.get<{ user: UserPublic }>(`/users/${id}`)
  return res.data.user
}

export async function updateProfile(data: UpdateProfileRequest): Promise<UserPublic> {
  const res = await api.put<{ user: UserPublic }>('/users/me', data)
  return res.data.user
}

export async function uploadAvatar(file: File): Promise<{ user: UserPublic; avatar_url: string }> {
  const formData = new FormData()
  formData.append('avatar', file)
  const res = await api.put<{ user: UserPublic; avatar_url: string }>('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
