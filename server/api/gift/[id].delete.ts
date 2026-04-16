import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne } from '~/server/utils/db'

// 删除人情记录
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const id = parseInt(getRouterParam(event, 'id') || '')
  
  if (!id || isNaN(id)) {
    return errorResponse('无效的ID', 400)
  }
  
  try {
    // 删除记录
    await queryOne('DELETE FROM gifts WHERE id = ?', [id])
    
    return successResponse(null, '删除成功')
  } catch (error: any) {
    console.error('删除人情记录失败:', error)
    return errorResponse(error.message || '删除失败', 500)
  }
})