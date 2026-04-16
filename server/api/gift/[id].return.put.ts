import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne } from '~/server/utils/db'
import type { Gift } from '~/types'

// 验证schema
const returnSchema = z.object({
  is_returned: z.boolean(),
  return_gift_id: z.number().nullable().optional(),
})

// 标记回礼状态
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const id = parseInt(getRouterParam(event, 'id') || '')
  
  if (!id || isNaN(id)) {
    return errorResponse('无效的ID', 400)
  }
  
  try {
    const body = await readBody(event)
    
    // 验证数据
    const validatedData = returnSchema.parse(body)
    
    // 检查是否存在
    const gift = await queryOne<Gift>(
      'SELECT * FROM gifts WHERE id = ?',
      [id]
    )
    
    if (!gift) {
      return errorResponse('人情记录不存在', 404)
    }
    
    if (gift.gift_type !== 'outgoing') {
      return errorResponse('只有出礼记录可以标记回礼状态', 400)
    }
    
    // 更新回礼状态
    await queryOne(
      `UPDATE gifts SET is_returned = ?, return_gift_id = ? WHERE id = ?`,
      [validatedData.is_returned ? 1 : 0, validatedData.return_gift_id || null, id]
    )
    
    // 如果标记为已回礼，且提供了回礼记录ID，更新关联关系
    if (validatedData.is_returned && validatedData.return_gift_id) {
      await queryOne(
        `UPDATE gifts SET return_gift_id = ? WHERE id = ?`,
        [id, validatedData.return_gift_id]
      )
    }
    
    return successResponse({ is_returned: validatedData.is_returned, return_gift_id: validatedData.return_gift_id }, '更新成功')
  } catch (error: any) {
    console.error('标记回礼状态失败:', error)
    if (error.name === 'ZodError') {
      return errorResponse(error.errors[0]?.message || '参数验证失败', 400)
    }
    return errorResponse(error.message || '更新失败', 500)
  }
})