import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { getDb } from '../db/index.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, authenticate } from '../middleware/auth.js'
import type { UserPublic } from '../types/index.js'

const router = Router()

function toPublic(user: { id: number; username: string; avatar_url: string; bio: string; role: string; created_at: string }): UserPublic {
  return {
    id: user.id,
    username: user.username,
    avatar_url: user.avatar_url,
    bio: user.bio,
    role: user.role as 'user' | 'admin',
    created_at: user.created_at,
  }
}

router.post('/register', async (req: Request, res: Response) => {
  const db = await getDb()
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' })
    return
  }
  if (typeof username !== 'string' || username.length < 3 || username.length > 30) {
    res.status(400).json({ error: '用户名需要 3-30 个字符' })
    return
  }
  if (typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: '密码至少需要 6 个字符' })
    return
  }
  if (/\s/.test(username)) {
    res.status(400).json({ error: '用户名不能包含空格' })
    return
  }

  const existing = await db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    res.status(409).json({ error: '用户名已被占用' })
    return
  }

  const password_hash = bcrypt.hashSync(password, 10)
  const avatar_url = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(username)}`

  const result = await db.prepare(
    'INSERT INTO users (username, password_hash, avatar_url) VALUES (?, ?, ?)'
  ).run(username, password_hash, avatar_url)

  const user = await db.prepare('SELECT id, username, avatar_url, bio, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid)

  const payload = { userId: user.id, username: user.username, role: user.role }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  res.status(201).json({ user: toPublic(user), accessToken, refreshToken })
})

router.post('/login', async (req: Request, res: Response) => {
  const db = await getDb()
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' })
    return
  }

  const user = await db.prepare(
    'SELECT id, username, password_hash, avatar_url, bio, role, created_at FROM users WHERE username = ?'
  ).get(username)

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: '用户名或密码错误' })
    return
  }

  const payload = { userId: user.id, username: user.username, role: user.role }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  res.json({ user: toPublic(user), accessToken, refreshToken })
})

router.post('/refresh', async (req: Request, res: Response) => {
  const db = await getDb()
  const { refreshToken } = req.body
  if (!refreshToken) {
    res.status(400).json({ error: '刷新令牌不能为空' })
    return
  }

  try {
    const payload = verifyRefreshToken(refreshToken)
    const user = await db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(payload.userId)
    if (!user) {
      res.status(401).json({ error: '用户不存在' })
      return
    }
    const accessToken = generateAccessToken({ userId: payload.userId, username: payload.username, role: user.role })
    res.json({ accessToken })
  } catch {
    res.status(401).json({ error: '刷新令牌无效或已过期' })
  }
})

router.get('/me', authenticate, async (req: Request, res: Response) => {
  const db = await getDb()
  const user = await db.prepare(
    'SELECT id, username, avatar_url, bio, role, created_at FROM users WHERE id = ?'
  ).get(req.user!.userId)

  if (!user) {
    res.status(404).json({ error: '用户不存在' })
    return
  }

  res.json({ user: toPublic(user) })
})

export default router
