import { Router, Request, Response } from 'express'
import multer from 'multer'
import { getDb } from '../db/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const name = file.originalname || ''
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i
    if (allowed.test(name)) {
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

router.put('/me/avatar', authenticate, (req: Request, res: Response) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      if (err.message?.includes('只允许上传')) {
        res.status(400).json({ error: err.message })
      } else {
        res.status(400).json({ error: '上传失败，请检查文件格式和大小' })
      }
      return
    }

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

      await db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(dataUrl, req.user!.userId)

      const user = await db.prepare(
        'SELECT id, username, avatar_url, bio, role, created_at FROM users WHERE id = ?'
      ).get(req.user!.userId)

      res.json({ user, avatar_url: dataUrl })
    } catch (e: any) {
      console.error('Avatar upload error:', e)
      res.status(500).json({ error: '服务器错误，请重试' })
    }
  })
})

export default router
