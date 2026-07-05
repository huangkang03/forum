import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types/index.js'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

const SECRET = process.env.JWT_SECRET || 'dev-jwt-secret'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret'

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '15m' })
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, SECRET) as JwtPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  authenticate(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: '需要管理员权限' })
      return
    }
    next()
  })
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7)
    try {
      const payload = jwt.verify(token, SECRET) as JwtPayload
      req.user = payload
    } catch {
      // token invalid, continue without auth
    }
  }
  next()
}
