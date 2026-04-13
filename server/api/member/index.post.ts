import { z } from 'zod'
import { requireAuth, hashPassword } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { insert } from '~/server/utils/db'

const schema = z.object({
  name: z.string()
    .min(1, '成员姓名不能为空')
    .max(50, '成员姓名不能超过50个字符')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, '成员姓名只能包含英文字母、数字、空格、横线和下划线'),
  avatar: z.string().url('头像URL格式错误').optional().nullable(),
  password: z.string().min(6, '密码不能少于6位').optional().nullable(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式错误，请使用十六进制颜色值（如 #4ECDC4）')
    .default('#4ECDC4'),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const body = await readBody(event)

  const result = schema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }

  const { name, avatar, password, color } = result.data

  // 对密码进行加密
  const hashedPassword = password ? await hashPassword(password) : null

  const id = await insert(
    'INSERT INTO members (name, avatar, password, color, created_by) VALUES (?, ?, ?, ?, ?)',
    [name, avatar || null, hashedPassword, color, user.id]
  )

  return successResponse({
    id,
    name,
    avatar: avatar || null,
    color,
  }, '添加成功')
})