import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(cors({ origin: CLIENT_URL, credentials: true }))
app.use(express.json())

const __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')))

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

async function start() {
  console.log('MYSQL_URL:', process.env.MYSQL_URL ? 'SET' : 'NOT SET')
  console.log('MYSQLHOST:', process.env.MYSQLHOST || 'NOT SET')
  await getDb()
  console.log('Database initialized')
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
