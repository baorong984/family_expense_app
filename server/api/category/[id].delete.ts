import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne, query, remove } from '~/server/utils/db'

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
  
  // 系统预设分类不能删除
  if (existing.is_system === 1) {
    return errorResponse('系统预设分类不能删除', 403)
  }
  
  // 检查是否有子分类
  const children = await query('SELECT id FROM categories WHERE parent_id = ?', [id])
  if (children.length > 0) {
    return errorResponse('该分类下有子分类，不能删除', 400)
  }
  
  // 检查是否有关联的消费记录
  const expenses = await query('SELECT id FROM expenses WHERE category_id = ? LIMIT 1', [id])
  if (expenses.length > 0) {
    return errorResponse('该分类下有消费记录，不能删除', 400)
  }
  
  await remove('DELETE FROM categories WHERE id = ?', [id])
  
  return successResponse(null, '删除成功')
})
