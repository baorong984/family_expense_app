import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne, update } from '~/server/utils/db'

const schema = z.object({
  name: z.string()
    .min(1, '成员姓名不能为空')
    .max(50, '成员姓名不能超过50个字符')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, '成员姓名只能包含英文字母、数字、空格、横线和下划线')
    .optional(),
  avatar: z.string().url('头像URL格式错误').optional().nullable(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式错误，请使用十六进制颜色值（如 #4ECDC4）')
    .optional(),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    return errorResponse('成员ID不能为空', 400)
  }

  // 检查成员是否存在
  const existing = await queryOne('SELECT * FROM members WHERE id = ?', [id])
  if (!existing) {
    return errorResponse('成员不存在', 404)
  }

  const body = await readBody(event)

  // 验证输入
  const result = schema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }

  const { name, avatar, color } = result.data

  // 构建更新语句
  const updates: string[] = []
  const params: any[] = []

  if (name !== undefined) {
    updates.push('name = ?')
    params.push(name)
  }
  if (avatar !== undefined) {
    updates.push('avatar = ?')
    params.push(avatar || null)
  }
  if (color !== undefined) {
    updates.push('color = ?')
    params.push(color)
  }

  if (updates.length === 0) {
    return errorResponse('没有需要更新的字段', 400)
  }

  params.push(id)
  await update(`UPDATE members SET ${updates.join(', ')} WHERE id = ?`, params)

  return successResponse({
    id: parseInt(id),
    ...result.data,
  }, '更新成功')
})
