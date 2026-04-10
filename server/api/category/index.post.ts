import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { insert } from '~/server/utils/db'

const schema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称不能超过50个字符'),
  parent_id: z.number().int().positive().optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const body = await readBody(event)
  
  // 验证输入
  const result = schema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }
  
  const { name, parent_id, sort_order = 0 } = result.data
  
  // 检查同名分类是否已存在
  const existing = await query(
    'SELECT id FROM categories WHERE name = ? AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))',
    [name, parent_id, parent_id]
  )
  
  if (existing.length > 0) {
    return errorResponse('分类名称已存在', 409)
  }
  
  // 插入分类
  const id = await insert(
    'INSERT INTO categories (name, parent_id, is_system, sort_order) VALUES (?, ?, 0, ?)',
    [name, parent_id || null, sort_order]
  )
  
  return successResponse({
    id,
    name,
    parent_id: parent_id || null,
    is_system: 0,
    sort_order,
  }, '创建成功')
})
