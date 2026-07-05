import { Router, Request, Response } from 'express'
import { getDb } from '../db/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Get my friends (accepted)
router.get('/', authenticate, async (req: Request, res: Response) => {
  const db = await getDb()
  const friends = await db.prepare(`
    SELECT u.id, u.username, u.avatar_url, u.bio, u.created_at, f.id AS friendship_id
    FROM friendships f
    JOIN users u ON (f.from_user_id = u.id OR f.to_user_id = u.id)
    WHERE f.status = 'accepted'
      AND (f.from_user_id = ? OR f.to_user_id = ?)
      AND u.id != ?
    ORDER BY f.updated_at DESC
  `).all(req.user!.userId, req.user!.userId, req.user!.userId)

  res.json({ friends })
})

// Get pending requests (incoming + outgoing)
router.get('/pending', authenticate, async (req: Request, res: Response) => {
  const db = await getDb()

  const incoming = await db.prepare(`
    SELECT f.id, f.from_user_id, f.to_user_id, f.status, f.created_at,
      u.username, u.avatar_url
    FROM friendships f
    JOIN users u ON f.from_user_id = u.id
    WHERE f.to_user_id = ? AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `).all(req.user!.userId)

  const outgoing = await db.prepare(`
    SELECT f.id, f.from_user_id, f.to_user_id, f.status, f.created_at,
      u.username, u.avatar_url
    FROM friendships f
    JOIN users u ON f.to_user_id = u.id
    WHERE f.from_user_id = ? AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `).all(req.user!.userId)

  res.json({ incoming, outgoing })
})

// Send friend request
router.post('/request', authenticate, async (req: Request, res: Response) => {
  const db = await getDb()
  const { toUserId } = req.body

  if (!toUserId || typeof toUserId !== 'number') {
    res.status(400).json({ error: '请指定目标用户' })
    return
  }

  if (toUserId === req.user!.userId) {
    res.status(400).json({ error: '不能添加自己为好友' })
    return
  }

  const targetUser = await db.prepare('SELECT id FROM users WHERE id = ?').get(toUserId)
  if (!targetUser) {
    res.status(404).json({ error: '用户不存在' })
    return
  }

  // Check existing friendship
  const existing = await db.prepare(
    'SELECT id, status, from_user_id FROM friendships WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)'
  ).get(req.user!.userId, toUserId, toUserId, req.user!.userId)

  if (existing) {
    if (existing.status === 'accepted') {
      res.status(409).json({ error: '已经是好友了' })
      return
    }
    if (existing.status === 'pending' && existing.from_user_id === req.user!.userId) {
      res.status(409).json({ error: '已经发送过申请了' })
      return
    }
    // If the other party already sent a request, auto-accept
    if (existing.status === 'pending' && existing.from_user_id === toUserId) {
      await db.prepare('UPDATE friendships SET status = ? WHERE id = ?').run('accepted', existing.id)
      res.json({ status: 'accepted', message: '已接受对方的好友申请' })
      return
    }
  }

  const result = await db.prepare(
    'INSERT INTO friendships (from_user_id, to_user_id) VALUES (?, ?)'
  ).run(req.user!.userId, toUserId)

  res.status(201).json({ id: result.lastInsertRowid, status: 'pending' })
})

// Accept friend request
router.post('/accept', authenticate, async (req: Request, res: Response) => {
  const db = await getDb()
  const { requestId } = req.body

  if (!requestId) {
    res.status(400).json({ error: '请指定申请 ID' })
    return
  }

  const friendship = await db.prepare(
    'SELECT id, to_user_id, status FROM friendships WHERE id = ?'
  ).get(requestId)

  if (!friendship) {
    res.status(404).json({ error: '申请不存在' })
    return
  }
  if (friendship.to_user_id !== req.user!.userId) {
    res.status(403).json({ error: '无权操作此申请' })
    return
  }
  if (friendship.status !== 'pending') {
    res.status(400).json({ error: '申请已处理' })
    return
  }

  await db.prepare('UPDATE friendships SET status = ? WHERE id = ?').run('accepted', requestId)

  res.json({ status: 'accepted', message: '已接受好友申请' })
})

// Reject friend request or remove friend
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const db = await getDb()
  const id = parseInt(req.params.id as string)

  if (isNaN(id)) {
    res.status(400).json({ error: '无效的 ID' })
    return
  }

  const friendship = await db.prepare(
    'SELECT id, from_user_id, to_user_id FROM friendships WHERE id = ?'
  ).get(id)

  if (!friendship) {
    res.status(404).json({ error: '记录不存在' })
    return
  }
  if (friendship.from_user_id !== req.user!.userId && friendship.to_user_id !== req.user!.userId) {
    res.status(403).json({ error: '无权操作' })
    return
  }

  await db.prepare('DELETE FROM friendships WHERE id = ?').run(id)

  res.json({ message: '已删除' })
})

// Get friendship status with another user
router.get('/status/:userId', authenticate, async (req: Request, res: Response) => {
  const db = await getDb()
  const otherId = parseInt(req.params.userId as string)

  if (isNaN(otherId)) {
    res.status(400).json({ error: '无效的用户 ID' })
    return
  }

  const row = await db.prepare(
    `SELECT id, from_user_id, to_user_id, status
     FROM friendships
     WHERE (from_user_id = ? AND to_user_id = ?)
        OR (from_user_id = ? AND to_user_id = ?)`
  ).get(req.user!.userId, otherId, otherId, req.user!.userId)

  if (!row) {
    res.json({ status: 'none' })
    return
  }

  res.json({
    friendshipId: row.id,
    status: row.status,
    isSender: row.from_user_id === req.user!.userId,
  })
})

// Get friends count for a user
router.get('/count/:userId', async (req: Request, res: Response) => {
  const db = await getDb()
  const userId = parseInt(req.params.userId as string)

  if (isNaN(userId)) {
    res.status(400).json({ error: '无效的用户 ID' })
    return
  }

  const countRow = await db.prepare(
    `SELECT COUNT(*) AS count FROM friendships
     WHERE status = 'accepted'
       AND (from_user_id = ? OR to_user_id = ?)`
  ).get(userId, userId)

  res.json({ count: (countRow as any)?.count || 0 })
})

export default router
