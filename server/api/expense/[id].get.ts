import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne } from '~/server/utils/db'
import type { Expense } from '~/types'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const id = getRouterParam(event, 'id')
  if (!id) {
    return errorResponse('记录ID不能为空', 400)
  }
  
  const expense = await queryOne<Expense>(
    `SELECT e.*, c.name as category_name, m.name as member_name
     FROM expenses e
     LEFT JOIN categories c ON e.category_id = c.id
     LEFT JOIN members m ON e.member_id = m.id
     WHERE e.id = ?`,
    [id]
  )
  
  if (!expense) {
    return errorResponse('记录不存在', 404)
  }
  
  return successResponse(expense)
})
