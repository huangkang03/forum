export interface UserPublic {
  id: number
  username: string
  avatar_url: string
  bio: string
  role: 'user' | 'admin'
  created_at: string
}

export interface Post {
  id: number
  user_id: number
  title: string
  content: string
  category: string
  created_at: string
  updated_at: string
  username?: string
  avatar_url?: string
  like_count: number
  reply_count: number
  liked_by_user: boolean
}

export interface Reply {
  id: number
  post_id: number
  user_id: number
  parent_reply_id: number | null
  content: string
  created_at: string
  username?: string
  avatar_url?: string
  children?: Reply[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AuthResponse {
  user: UserPublic
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface CreatePostRequest {
  title: string
  content: string
  category: string
}

export interface CreateReplyRequest {
  content: string
  parent_reply_id?: number
}

export interface UpdateProfileRequest {
  bio: string
}

export const CATEGORIES = ['综合', '科技', '生活', '学习', '其他'] as const

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    综合: 'bg-blue-100 text-blue-800',
    科技: 'bg-purple-100 text-purple-800',
    生活: 'bg-green-100 text-green-800',
    学习: 'bg-yellow-100 text-yellow-800',
    其他: 'bg-gray-100 text-gray-800',
  }
  return colors[category] || colors.其他
}
