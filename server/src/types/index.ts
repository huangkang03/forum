export interface User {
  id: number
  username: string
  password_hash: string
  avatar_url: string
  bio: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

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
  like_count?: number
  reply_count?: number
  liked_by_user?: boolean
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

export interface Like {
  id: number
  user_id: number
  post_id: number
  created_at: string
}

export interface JwtPayload {
  userId: number
  username: string
  role: 'user' | 'admin'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
