import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne, update } from '~/server/utils/db'

const schema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称不能超过50个字符').optional(),
  icon: z.string().max(50).nullable().optional(),
  parent_id: z.number().int().positive().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
})

/**
 * 更新物品分类
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const categoryId = parseInt(event.context.params?.id || '0')
  if (!categoryId) {
    return errorResponse('分类ID无效', 400)
  }

  const existing = await queryOne<any>(
    'SELECT * FROM item_categories WHERE id = ?',
    [categoryId]
  )
  if (!existing) {
    return errorResponse('分类不存在', 404)
  }

  const body = await readBody(event)
  const result = schema.safeParse(body)

  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }

  const data = result.data

  // 检查父分类是否存在
  if (data.parent_id !== undefined && data.parent_id !== null) {
    if (data.parent_id === categoryId) {
      return errorResponse('不能将自己设为父分类', 400)
    }

    const parentExists = await queryOne<any>(
      'SELECT id FROM item_categories WHERE id = ?',
      [data.parent_id]
    )
    if (!parentExists) {
      return errorResponse('父分类不存在', 400)
    }
  }

  const updates: string[] = []
  const params: any[] = []

  if (data.name !== undefined) {
    updates.push('name = ?')
    params.push(data.name)
  }

  if (data.icon !== undefined) {
    updates.push('icon = ?')
    params.push(data.icon)
  }

  if (data.parent_id !== undefined) {
    updates.push('parent_id = ?')
    params.push(data.parent_id)
  }

  if (data.sort_order !== undefined) {
    updates.push('sort_order = ?')
    params.push(data.sort_order)
  }

  if (updates.length === 0) {
    return successResponse(null, '没有需要更新的内容')
  }

  params.push(categoryId)
  await update(
    `UPDATE item_categories SET ${updates.join(', ')} WHERE id = ?`,
    params
  )

  return successResponse(null, '分类更新成功')
})
