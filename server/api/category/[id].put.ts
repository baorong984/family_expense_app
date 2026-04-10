import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne, update } from '~/server/utils/db'

const schema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称不能超过50个字符').optional(),
  sort_order: z.number().int().min(0).optional(),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const id = getRouterParam(event, 'id')
  if (!id) {
    return errorResponse('分类ID不能为空', 400)
  }
  
  // 检查分类是否存在
  const existing = await queryOne('SELECT * FROM categories WHERE id = ?', [id])
  if (!existing) {
    return errorResponse('分类不存在', 404)
  }
  
  // 系统预设分类不能修改
  if (existing.is_system === 1) {
    return errorResponse('系统预设分类不能修改', 403)
  }
  
  const body = await readBody(event)
  
  // 验证输入
  const result = schema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }
  
  const { name, sort_order } = result.data
  
  // 构建更新语句
  const updates: string[] = []
  const params: any[] = []
  
  if (name !== undefined) {
    updates.push('name = ?')
    params.push(name)
  }
  if (sort_order !== undefined) {
    updates.push('sort_order = ?')
    params.push(sort_order)
  }
  
  if (updates.length === 0) {
    return errorResponse('没有需要更新的字段', 400)
  }
  
  params.push(id)
  await update(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params)
  
  return successResponse({
    id: parseInt(id),
    ...result.data,
  }, '更新成功')
})
