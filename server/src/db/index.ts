import mysql from 'mysql2/promise'
import { SCHEMA_SQL } from './schema.js'

let pool: mysql.Pool | null = null

async function getPool(): Promise<mysql.Pool> {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'forum',
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4',
    })
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
