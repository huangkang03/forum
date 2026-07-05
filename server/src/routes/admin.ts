import { Router, Request, Response } from 'express'
import { getDb } from '../db/index.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// All admin routes require admin role
router.use(requireAdmin)

// Delete any post
router.delete('/posts/:id', async (req: Request, res: Response) => {
  const db = await getDb()
  const id = parseInt(req.params.id as string)

  if (isNaN(id)) {
    res.status(400).json({ error: '无效的帖子 ID' })
    return
  }

  const post = await db.prepare('SELECT id FROM posts WHERE id = ?').get(id)
  if (!post) {
    res.status(404).json({ error: '帖子不存在' })
    return
  }

  await db.prepare('DELETE FROM likes WHERE post_id = ?').run(id)
  await db.prepare('DELETE FROM replies WHERE post_id = ?').run(id)
  await db.prepare('DELETE FROM posts WHERE id = ?').run(id)

  res.json({ message: '帖子已删除' })
})

// Delete any reply
router.delete('/replies/:id', async (req: Request, res: Response) => {
  const db = await getDb()
  const id = parseInt(req.params.id as string)

  if (isNaN(id)) {
    res.status(400).json({ error: '无效的回复 ID' })
    return
  }

  const reply = await db.prepare('SELECT id FROM replies WHERE id = ?').get(id)
  if (!reply) {
    res.status(404).json({ error: '回复不存在' })
    return
  }

  await db.prepare('DELETE FROM replies WHERE id = ? OR parent_reply_id = ?').run(id, id)

  res.json({ message: '回复已删除' })
})

// Get all users
router.get('/users', async (req: Request, res: Response) => {
  const db = await getDb()
  const users = await db.prepare(
    'SELECT id, username, avatar_url, role, created_at FROM users ORDER BY created_at DESC'
  ).all()

  res.json({ users })
})

// Set user role
router.put('/users/:id/role', async (req: Request, res: Response) => {
  const db = await getDb()
  const id = parseInt(req.params.id as string)
  const { role } = req.body

  if (isNaN(id)) {
    res.status(400).json({ error: '无效的用户 ID' })
    return
  }

  if (role !== 'user' && role !== 'admin') {
    res.status(400).json({ error: '角色必须是 user 或 admin' })
    return
  }

  const user = await db.prepare('SELECT id, role FROM users WHERE id = ?').get(id)
  if (!user) {
    res.status(404).json({ error: '用户不存在' })
    return
  }

  await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)

  res.json({ message: '角色已更新', userId: id, role })
})

export default router
