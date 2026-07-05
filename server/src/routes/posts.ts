import { Router, Request, Response } from 'express'
import { getDb } from '../db/index.js'
import { authenticate, optionalAuth } from '../middleware/auth.js'

const router = Router()

const VALID_CATEGORIES = ['综合', '科技', '生活', '学习', '其他']

router.get('/', optionalAuth, async (req: Request, res: Response) => {
  const db = await getDb()
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20))
  const sort = req.query.sort === 'popular' ? 'popular' : 'latest'
  const category = (req.query.category as string) || ''
  const search = (req.query.search as string) || ''
  const offset = (page - 1) * limit

  let where = ''
  const params: any[] = []

  if (category && VALID_CATEGORIES.includes(category)) {
    where += ' AND p.category = ?'
    params.push(category)
  }
  if (search) {
    where += ' AND (p.title LIKE ? OR p.content LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  const orderBy = sort === 'popular'
    ? 'like_count DESC, p.created_at DESC'
    : 'p.created_at DESC'

  const userId = req.user?.userId

  const rows = await db.prepare(`
    SELECT
      p.*,
      u.username,
      u.avatar_url,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
      (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS reply_count
      ${userId ? `, EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS liked_by_user` : ''}
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE 1=1 ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...(userId ? [userId] : []), ...params, limit, offset)

  const countRow = await db.prepare(`
    SELECT COUNT(*) AS total FROM posts p WHERE 1=1 ${where}
  `).get(...params)

  const total = countRow?.total || 0
  const totalPages = Math.ceil(total / limit)

  const posts = rows.map((r: any) => ({
    ...r,
    liked_by_user: userId ? Boolean(r.liked_by_user) : false,
  }))

  res.json({ data: posts, total, page, limit, totalPages })
})

router.post('/', authenticate, async (req: Request, res: Response) => {
  const db = await getDb()
  const { title, content, category } = req.body

  if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
    res.status(400).json({ error: '标题不能为空，且不超过 200 字' })
    return
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0 || content.length > 10000) {
    res.status(400).json({ error: '内容不能为空，且不超过 10000 字' })
    return
  }
  if (!VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: `分类必须是：${VALID_CATEGORIES.join('、')}` })
    return
  }

  const result = await db.prepare(
    'INSERT INTO posts (user_id, title, content, category) VALUES (?, ?, ?, ?)'
  ).run(req.user!.userId, title.trim(), content.trim(), category)

  const post = await db.prepare(`
    SELECT p.*, u.username, u.avatar_url,
      0 AS like_count, 0 AS reply_count
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(result.lastInsertRowid)

  res.status(201).json({ post })
})

router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  const db = await getDb()
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) {
    res.status(400).json({ error: '无效的帖子 ID' })
    return
  }

  const userId = req.user?.userId

  const post = await db.prepare(`
    SELECT
      p.*,
      u.username,
      u.avatar_url,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
      (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS reply_count
      ${userId ? `, EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS liked_by_user` : ''}
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(...(userId ? [userId] : []), id)

  if (!post) {
    res.status(404).json({ error: '帖子不存在' })
    return
  }

  post.liked_by_user = userId ? Boolean(post.liked_by_user) : false

  res.json({ post })
})

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const db = await getDb()
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) {
    res.status(400).json({ error: '无效的帖子 ID' })
    return
  }

  const post = await db.prepare('SELECT user_id FROM posts WHERE id = ?').get(id)
  if (!post) {
    res.status(404).json({ error: '帖子不存在' })
    return
  }
  if (post.user_id !== req.user!.userId && req.user!.role !== 'admin') {
    res.status(403).json({ error: '只能删除自己的帖子' })
    return
  }

  await db.prepare('DELETE FROM likes WHERE post_id = ?').run(id)
  await db.prepare('DELETE FROM replies WHERE post_id = ?').run(id)
  await db.prepare('DELETE FROM posts WHERE id = ?').run(id)

  res.json({ message: '帖子已删除' })
})

export default router
