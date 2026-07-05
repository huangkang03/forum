import { Router, Request, Response } from 'express'
import { getDb } from '../db/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router({ mergeParams: true })

router.get('/', async (req: Request, res: Response) => {
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

  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50))
  const offset = (page - 1) * limit

  const rows = await db.prepare(`
    SELECT r.*, u.username, u.avatar_url
    FROM replies r
    JOIN users u ON r.user_id = u.id
    WHERE r.post_id = ?
    ORDER BY r.created_at ASC
    LIMIT ? OFFSET ?
  `).all(postId, limit, offset)

  const countRow = await db.prepare('SELECT COUNT(*) AS total FROM replies WHERE post_id = ?').get(postId)
  const total = countRow?.total || 0
  const totalPages = Math.ceil(total / limit)

  const replyMap = new Map<number, any>()
  const topLevel: any[] = []

  for (const r of rows) {
    replyMap.set(r.id, { ...r, children: [] })
  }

  for (const r of rows) {
    const reply = replyMap.get(r.id)
    if (r.parent_reply_id && replyMap.has(r.parent_reply_id)) {
      replyMap.get(r.parent_reply_id).children.push(reply)
    } else {
      topLevel.push(reply)
    }
  }

  res.json({ data: topLevel, total, page, limit, totalPages })
})

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

  const { content, parent_reply_id } = req.body

  if (!content || typeof content !== 'string' || content.trim().length === 0 || content.length > 5000) {
    res.status(400).json({ error: '回复内容不能为空，且不超过 5000 字' })
    return
  }

  let parentId: number | null = null
  if (parent_reply_id != null) {
    parentId = parseInt(parent_reply_id)
    if (isNaN(parentId)) {
      res.status(400).json({ error: '无效的父回复 ID' })
      return
    }
    const parent = await db.prepare('SELECT id, parent_reply_id FROM replies WHERE id = ? AND post_id = ?').get(parentId, postId)
    if (!parent) {
      res.status(400).json({ error: '父回复不存在或不属于此帖子' })
      return
    }
    if (parent.parent_reply_id != null) {
      res.status(400).json({ error: '最多只能嵌套两层回复' })
      return
    }
  }

  const result = await db.prepare(
    'INSERT INTO replies (post_id, user_id, parent_reply_id, content) VALUES (?, ?, ?, ?)'
  ).run(postId, req.user!.userId, parentId, content.trim())

  const reply = await db.prepare(`
    SELECT r.*, u.username, u.avatar_url
    FROM replies r JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `).get(result.lastInsertRowid)

  res.status(201).json({ reply })
})

export default router
