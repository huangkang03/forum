import api, { setAccessToken, setRefreshToken, getRefreshToken } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, UserPublic } from '../types'

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/register', data)
  setAccessToken(res.data.accessToken)
  setRefreshToken(res.data.refreshToken)
  return res.data
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/login', data)
  setAccessToken(res.data.accessToken)
  setRefreshToken(res.data.refreshToken)
  return res.data
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const res = await api.post<{ accessToken: string }>('/auth/refresh', { refreshToken })
    setAccessToken(res.data.accessToken)
    return res.data.accessToken
  } catch {
    setAccessToken(null)
    setRefreshToken(null)
    return null
  }
}

export async function getMe(): Promise<UserPublic> {
  const res = await api.get<{ user: UserPublic }>('/auth/me')
  return res.data.user
}

export function logout() {
  setAccessToken(null)
  setRefreshToken(null)
}
