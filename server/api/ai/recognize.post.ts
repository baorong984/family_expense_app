import { z } from 'zod'
import { successResponse, errorResponse } from '~/server/utils/response'
import { recognizeExpense } from '~/server/utils/ai'
import { query } from '~/server/utils/db'

const schema = z.object({
  text: z.string().min(1, '请输入消费信息'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const result = schema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }
  
  const { text } = result.data
  
  try {
    const members = await query<{ id: number; name: string }>(
      'SELECT id, name FROM members WHERE created_by = 1'
    )
    
    const categories = await query<{ id: number; name: string; parent_id: number | null }>(
      'SELECT id, name, parent_id FROM categories'
    )
    
    const recognizeResult = await recognizeExpense(text, {
      members: members.map(m => ({ id: m.id, name: m.name })),
      categories: categories.map(c => ({ id: c.id, name: c.name, parent_id: c.parent_id })),
    })
    
    return successResponse(recognizeResult, '识别成功')
  } catch (error: any) {
    console.error('AI识别失败:', error)
    return errorResponse('AI识别失败，请稍后重试', 500)
  }
})
