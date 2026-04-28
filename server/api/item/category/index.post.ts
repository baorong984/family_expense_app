import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne, insert, update } from '~/server/utils/db'

const schema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称不能超过50个字符'),
  icon: z.string().max(50).optional(),
  parent_id: z.number().int().positive().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
})

/**
 * 创建物品分类
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readBody(event)
  const result = schema.safeParse(body)

  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }

  const { name, icon, parent_id, sort_order } = result.data

  if (parent_id !== undefined && parent_id !== null) {
    const parentExists = await queryOne<any>(
      'SELECT id FROM item_categories WHERE id = ?',
      [parent_id]
    )
    if (!parentExists) {
      return errorResponse('父分类不存在', 400)
    }
  }

  const insertId = await insert(
    'INSERT INTO item_categories (name, icon, parent_id, sort_order) VALUES (?, ?, ?, ?)',
    [name, icon || null, parent_id || null, sort_order || 0]
  )

  return successResponse({ id: insertId, name, icon, parent_id, sort_order: sort_order || 0 }, '分类创建成功')
})
