import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne } from '~/server/utils/db'
import type { Gift } from '~/types'

// 获取单条人情记录
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const id = parseInt(getRouterParam(event, 'id') || '')
  
  if (!id || isNaN(id)) {
    return errorResponse('无效的ID', 400)
  }
  
  try {
    const gift = await queryOne<Gift>(
      `SELECT g.*, 
              e.amount as expense_amount,
              c.name as category_name,
              m.name as member_name,
              rg.id as return_gift_id,
              rg.gift_type as return_gift_type,
              rg.related_person as return_related_person
       FROM gifts g
       LEFT JOIN expenses e ON g.expense_id = e.id
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN members m ON e.member_id = m.id
       LEFT JOIN gifts rg ON g.return_gift_id = rg.id
       WHERE g.id = ?`,
      [id]
    )
    
    if (!gift) {
      return errorResponse('人情记录不存在', 404)
    }
    
    return successResponse(gift)
  } catch (error: any) {
    console.error('获取人情记录失败:', error)
    return errorResponse(error.message || '获取失败', 500)
  }
})