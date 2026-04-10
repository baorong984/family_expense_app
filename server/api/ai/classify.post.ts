import { z } from 'zod'
import { successResponse, errorResponse } from '~/server/utils/response'
import { classifyExpense } from '~/server/utils/ai'

const schema = z.object({
  description: z.string().min(1, '请输入消费描述'),
  amount: z.number().positive('金额必须为正数'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const result = schema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }
  
  const { description, amount } = result.data
  
  try {
    const classifyResult = await classifyExpense(description, amount)
    return successResponse(classifyResult, '分类成功')
  } catch (error: any) {
    console.error('AI分类失败:', error)
    return errorResponse('AI分类失败，请稍后重试', 500)
  }
})