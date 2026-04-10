import { z } from 'zod'
import { requireAuth, hashPassword } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { insert } from '~/server/utils/db'

const schema = z.object({
  name: z.string().min(1, '成员姓名不能为空').max(50, '成员姓名不能超过50个字符'),
  avatar: z.string().url('头像URL格式错误').optional().nullable(),
  password: z.string().min(6, '密码不能少于6位').optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  const body = await readBody(event)
  
  const result = schema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }
  
  const { name, avatar, password } = result.data

  // 对密码进行加密
  const hashedPassword = password ? await hashPassword(password) : null

  const id = await insert(
    'INSERT INTO members (name, avatar, password, created_by) VALUES (?, ?, ?, ?)',
    [name, avatar || null, hashedPassword, user.id]
  )
  
  return successResponse({
    id,
    name,
    avatar: avatar || null,
  }, '添加成功')
})