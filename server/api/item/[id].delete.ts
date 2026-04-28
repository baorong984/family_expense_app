import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne, update } from '~/server/utils/db'

/**
 * 删除物品
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const itemId = parseInt(event.context.params?.id || '0')
  if (!itemId) {
    return errorResponse('物品ID无效', 400)
  }

  const existing = await queryOne<any>(
    'SELECT id FROM items WHERE id = ? AND user_id = ?',
    [itemId, user.id]
  )
  if (!existing) {
    return errorResponse('物品不存在', 404)
  }

  await update('DELETE FROM items WHERE id = ? AND user_id = ?', [itemId, user.id])

  return successResponse(null, '物品删除成功')
})
