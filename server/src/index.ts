import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { getDb } from './db/index.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import postRoutes from './routes/posts.js'
import replyRoutes from './routes/replies.js'
import likeRoutes from './routes/likes.js'
import friendRoutes from './routes/friends.js'
import adminRoutes from './routes/admin.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Serve built frontend static files
const clientDist = path.resolve(__dirname, '..', 'public')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/posts/:id/replies', replyRoutes)
app.use('/api/posts/:id/like', likeRoutes)
app.use('/api/friends', friendRoutes)
app.use('/api/admin', adminRoutes)

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message)
  res.status(500).json({ error: '服务器内部错误' })
})

// SPA fallback: any non-API route serves index.html
app.get('*', (_req, res) => {
  const indexHtml = path.resolve(clientDist, 'index.html')
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml)
  } else {
    res.status(200).send('Forum API is running. Frontend not built yet.')
  }
})

async function start() {
  console.log('MYSQL_URL:', process.env.MYSQL_URL ? 'SET' : 'NOT SET')
  await getDb()
  console.log('Database initialized')
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
