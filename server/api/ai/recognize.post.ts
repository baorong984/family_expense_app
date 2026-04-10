import { z } from 'zod'
import { successResponse, errorResponse } from '~/server/utils/response'
import { recognizeExpense } from '~/server/utils/ai'

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
    const recognizeResult = await recognizeExpense(text)
    return successResponse(recognizeResult, '识别成功')
  } catch (error: any) {
    console.error('AI识别失败:', error)
    return errorResponse('AI识别失败，请稍后重试', 500)
  }
})