import { Router, Request, Response } from 'express'
import { getDb } from '../db/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router({ mergeParams: true })

router.post('/', authenticate, async (req: Request, res: Response) => {
  const db = await getDb()
  const postId = parseInt(req.params.id as string)
  if (isNaN(postId)) {
    res.status(400).json({ error: '无效的帖子 ID' })
    return
  }

  const post = await db.prepare('SELECT id FROM posts WHERE id = ?').get(postId)
  if (!post) {
    res.status(404).json({ error: '帖子不存在' })
    return
  }

  const existing = await db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').get(req.user!.userId, postId)
  if (existing) {
    res.status(409).json({ error: '已经点过赞了' })
    return
  }

  await db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(req.user!.userId, postId)

  const countRow = await db.prepare('SELECT COUNT(*) AS count FROM likes WHERE post_id = ?').get(postId)
  const likeCount = (countRow as any)?.count || 0

  res.json({ liked: true, like_count: likeCount })
})

router.delete('/', authenticate, async (req: Request, res: Response) => {
  const db = await getDb()
  const postId = parseInt(req.params.id as string)
  if (isNaN(postId)) {
    res.status(400).json({ error: '无效的帖子 ID' })
    return
  }

  const post = await db.prepare('SELECT id FROM posts WHERE id = ?').get(postId)
  if (!post) {
    res.status(404).json({ error: '帖子不存在' })
    return
  }

  await db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(req.user!.userId, postId)

  const countRow = await db.prepare('SELECT COUNT(*) AS count FROM likes WHERE post_id = ?').get(postId)
  const likeCount = (countRow as any)?.count || 0

  res.json({ liked: false, like_count: likeCount })
})

export default router
