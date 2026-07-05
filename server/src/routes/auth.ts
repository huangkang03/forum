import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { getDb } from '../db/index.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, authenticate } from '../middleware/auth.js'
import type { UserPublic } from '../types/index.js'

// 同一 IP 每小时最多注册 3 次，防恶意注册
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: '注册次数过多，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: '登录尝试次数过多，请 15 分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
})

const router = Router()

// Generate a simple SVG avatar from username — no external API needed
function generateAvatar(username: string): string {
  const colors = ['#E85D75','#F4A261','#2A9D8F','#E76F51','#264653','#6D597A','#B5838D','#52796F','#BC6C25','#457B9D']
  let hash = 0
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash)
  const color = colors[Math.abs(hash) % colors.length]
  const initial = encodeURIComponent(username.charAt(0).toUpperCase())
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="${color}" width="100" height="100"/><text x="50" y="68" font-size="48" font-family="Arial, sans-serif" fill="white" text-anchor="middle">${initial}</text></svg>`
  return 'data:image/svg+xml,' + svg
}

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

router.post('/register', registerLimiter, async (req: Request, res: Response) => {
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

  // Generate local avatar SVG (no external dependency)
  const avatar_url = generateAvatar(username)

  // Auto-promote first user to admin
  const adminCount = await db.prepare('SELECT COUNT(*) AS count FROM users WHERE role = ?').get('admin')
  const role = (adminCount as any)?.count === 0 ? 'admin' : 'user'

  const result = await db.prepare(
    'INSERT INTO users (username, password_hash, avatar_url, role) VALUES (?, ?, ?, ?)'
  ).run(username, password_hash, avatar_url, role)

  const user = await db.prepare('SELECT id, username, avatar_url, bio, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid)

  const payload = { userId: user.id, username: user.username, role: user.role }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  res.status(201).json({ user: toPublic(user), accessToken, refreshToken })
})

router.post('/login', loginLimiter, async (req: Request, res: Response) => {
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
