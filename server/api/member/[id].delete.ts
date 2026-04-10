import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne, query, remove } from '~/server/utils/db'

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
  
  // 检查是否有关联的消费记录
  const expenses = await query('SELECT id FROM expenses WHERE member_id = ? LIMIT 1', [id])
  if (expenses.length > 0) {
    return errorResponse('该成员下有消费记录，不能删除', 400)
  }
  
  await remove('DELETE FROM members WHERE id = ?', [id])
  
  return successResponse(null, '删除成功')
})
