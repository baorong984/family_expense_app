import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne, remove } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const id = getRouterParam(event, 'id')
  if (!id) {
    return errorResponse('记录ID不能为空', 400)
  }
  
  // 检查记录是否存在
  const existing = await queryOne('SELECT id FROM expenses WHERE id = ?', [id])
  if (!existing) {
    return errorResponse('记录不存在', 404)
  }
  
  await remove('DELETE FROM expenses WHERE id = ?', [id])
  
  return successResponse(null, '删除成功')
})
