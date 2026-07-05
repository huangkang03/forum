import mysql from 'mysql2/promise'
import { SCHEMA_SQL } from './schema.js'

let pool: mysql.Pool | null = null

async function getPool(): Promise<mysql.Pool> {
  if (!pool) {
    // Railway injects MYSQL_URL, local dev uses individual vars
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL
    if (dbUrl) {
      pool = mysql.createPool({
        uri: dbUrl,
        waitForConnections: true,
        connectionLimit: 10,
        charset: 'utf8mb4',
      })
    } else {
      pool = mysql.createPool({
        host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
        user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '123456',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'forum',
        waitForConnections: true,
        connectionLimit: 10,
        charset: 'utf8mb4',
      })
    }
  }
  return pool
}

async function initSchema() {
  const p = await getPool()
  const statements = SCHEMA_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const stmt of statements) {
    await p.execute(stmt)
  }

  // Migration: ensure avatar_url is TEXT for base64 storage
  try {
    await p.execute("ALTER TABLE users MODIFY avatar_url MEDIUMTEXT NOT NULL")
  } catch { /* ignore */ }
  try {
    await p.execute("ALTER TABLE users ADD COLUMN pending_avatar MEDIUMTEXT DEFAULT NULL")
  } catch { /* ignore */ }
  try {
    await p.execute("ALTER TABLE users ADD COLUMN muted_until DATETIME DEFAULT NULL")
  } catch { /* ignore */ }

  // Fix old DiceBear URLs — replace with local SVG avatars
  try {
    const [rows] = await p.query("SELECT id, username FROM users WHERE avatar_url LIKE '%dicebear%'") as any[]
    for (const row of rows) {
      const colors = ['#E85D75','#F4A261','#2A9D8F','#E76F51','#264653','#6D597A','#B5838D','#52796F','#BC6C25','#457B9D']
      let hash = 0
      for (let i = 0; i < row.username.length; i++) hash = row.username.charCodeAt(i) + ((hash << 5) - hash)
      const color = colors[Math.abs(hash) % colors.length]
      const initial = encodeURIComponent(row.username.charAt(0).toUpperCase())
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="${color}" width="100" height="100"/><text x="50" y="68" font-size="48" font-family="Arial, sans-serif" fill="white" text-anchor="middle">${initial}</text></svg>`
      const dataUrl = 'data:image/svg+xml,' + svg
      await p.query("UPDATE users SET avatar_url = ? WHERE id = ?", [dataUrl, row.id])
    }
    if (rows.length > 0) console.log(`Migrated ${rows.length} DiceBear avatars to local SVG`)
  } catch (e: any) { console.log('Avatar migration skipped:', e.message) }
}

let initialized = false

export async function getDb() {
  if (!initialized) {
    await initSchema()
    initialized = true
  }

  const p = await getPool()

  return {
    prepare(sql: string) {
      return {
        async run(...params: any[]) {
          const [result] = await p.query(sql, params) as any[]
          return { lastInsertRowid: result.insertId }
        },
        async get(...params: any[]) {
          const [rows] = await p.query(sql, params) as any[]
          return (rows as any[])[0]
        },
        async all(...params: any[]) {
          const [rows] = await p.query(sql, params) as any[]
          return rows as any[]
        },
      }
    },
  }
}
