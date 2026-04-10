import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { User } from '~/types'

const SALT_ROUNDS = 10

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(user: User): string {
  const config = useRuntimeConfig()
  const payload = {
    id: user.id,
    username: user.username,
    is_admin: user.is_admin,
  }
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
}

export function verifyToken(token: string): { id: number; username: string; is_admin: number } | null {
  try {
    const config = useRuntimeConfig()
    return jwt.verify(token, config.jwtSecret) as any
  } catch {
    return null
  }
}

export function getTokenFromHeader(event: any): string | null {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

export async function getCurrentUser(event: any): Promise<User | null> {
  const token = getTokenFromHeader(event)
  if (!token) {
    return null
  }

  const payload = verifyToken(token)
  if (!payload) {
    return null
  }

  // 先查询 users 表
  let user = await queryOne<User>(
    'SELECT id, username, email, is_admin, status, created_at, updated_at FROM users WHERE id = ? AND status = 1',
    [payload.id]
  )

  // 如果 users 表中没有，查询 members 表
  if (!user) {
    const member = await queryOne<any>(
      'SELECT id, name as username, NULL as email, 0 as is_admin, 1 as status, created_at, updated_at FROM members WHERE id = ?',
      [payload.id]
    )
    user = member
  }

  return user
}

export async function requireAuth(event: any): Promise<User> {
  const user = await getCurrentUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: '未授权，请先登录',
    })
  }
  return user
}
