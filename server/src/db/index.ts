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
