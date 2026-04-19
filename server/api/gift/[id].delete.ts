import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne, remove } from '~/server/utils/db'

/** 删除人情记录 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = parseInt(getRouterParam(event, 'id') || '')

  if (!id || isNaN(id)) {
    return errorResponse('无效的ID', 400)
  }

  try {
    /** 查询现有人情记录 */
    const existingGift = await queryOne<{ id: number; expense_id: number | null }>(
      `SELECT id, expense_id FROM gifts WHERE id = ?`,
      [id],
    )

    if (!existingGift) {
      return errorResponse('人情记录不存在', 404)
    }

    /** 删除关联的消费记录 */
    if (existingGift.expense_id) {
      await remove(`DELETE FROM expenses WHERE id = ?`, [existingGift.expense_id])
    }

    /** 删除人情记录 */
    await remove('DELETE FROM gifts WHERE id = ?', [id])

    return successResponse(null, '删除成功')
  } catch (error: any) {
    console.error('删除人情记录失败:', error)
    return errorResponse(error.message || '删除失败', 500)
  }
})
