import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { query } from '~/server/utils/db'

/**
 * 获取单条AI分析记录详情
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  const recordId = getRouterParam(event, 'id')
  
  if (!recordId) {
    return errorResponse('缺少记录ID', 400)
  }
  
  try {
    const records = await query<any>(
      `SELECT 
        id,
        start_date,
        end_date,
        analysis_data,
        created_by,
        created_at
       FROM ai_analysis_records
       WHERE id = ?`,
      [recordId]
    )
    
    if (records.length === 0) {
      return errorResponse('记录不存在', 404)
    }
    
    const record = records[0]
    
    return successResponse({
      ...record,
      analysis_data: typeof record.analysis_data === 'string' 
        ? JSON.parse(record.analysis_data) 
        : record.analysis_data,
    })
  } catch (error: any) {
    console.error('获取AI分析记录详情失败:', error)
    return errorResponse(error.message || '获取失败', 500)
  }
})
