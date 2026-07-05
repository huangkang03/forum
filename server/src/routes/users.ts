import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { getDb } from '../db/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const name = file.originalname || ''
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(name)) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传图片文件 (jpg/png/gif/webp)'))
    }
  },
})

router.get('/:id', async (req: Request, res: Response) => {
  const db = await getDb()
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) {
    res.status(400).json({ error: '无效的用户 ID' })
    return
  }

  const user = await db.prepare(
    'SELECT id, username, avatar_url, bio, role, created_at FROM users WHERE id = ?'
  ).get(id)

  if (!user) {
    res.status(404).json({ error: '用户不存在' })
    return
  }

  res.json({ user })
})

router.put('/me', authenticate, async (req: Request, res: Response) => {
  const db = await getDb()
  const { bio } = req.body
  if (bio !== undefined && typeof bio !== 'string') {
    res.status(400).json({ error: '简介必须是字符串' })
    return
  }

  if (bio !== undefined) {
    await db.prepare('UPDATE users SET bio = ? WHERE id = ?').run(bio, req.user!.userId)
  }

  const user = await db.prepare(
    'SELECT id, username, avatar_url, bio, role, created_at FROM users WHERE id = ?'
  ).get(req.user!.userId)

  res.json({ user })
})

function uploadMiddleware(req: Request, res: Response, next: NextFunction) {
  upload.single('avatar')(req, res, (err: any) => {
    if (err) {
      res.status(400).json({ error: err.message || '上传失败' })
      return
    }
    next()
  })
}

router.put('/me/avatar', authenticate, uploadMiddleware, async (req: Request, res: Response) => {
  try {
    const db = await getDb()
    const file = req.file

    if (!file) {
      res.status(400).json({ error: '请选择要上传的头像图片' })
      return
    }

    const mimeType = file.mimetype || 'image/png'
    const base64 = file.buffer.toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64}`

    // Save to pending_avatar — waits for admin approval
    await db.prepare('UPDATE users SET pending_avatar = ? WHERE id = ?').run(dataUrl, req.user!.userId)

    const user = await db.prepare(
      'SELECT id, username, avatar_url, pending_avatar, bio, role, created_at FROM users WHERE id = ?'
    ).get(req.user!.userId)

    res.json({ user, pending_avatar: dataUrl })
  } catch (e: any) {
    console.error('Avatar upload error:', e.message)
    res.status(500).json({ error: '服务器错误' })
  }
})

export default router
