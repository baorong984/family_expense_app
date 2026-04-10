import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { query } from '~/server/utils/db'
import { analyzeExpense } from '~/server/utils/ai'

const schema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  budget: z.object({
    total: z.number(),
    categories: z.record(z.number()).optional(),
  }).optional(),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const body = await readBody(event)
  
  // 验证输入
  const result = schema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }
  
  const { start_date, end_date, budget } = result.data
  
  // 获取消费数据
  const expenses = await query<{
    date: string
    amount: number
    category: string
    subcategory: string
    member: string
  }>(
    `SELECT 
      e.expense_date as date,
      e.amount,
      pc.name as category,
      c.name as subcategory,
      m.name as member
     FROM expenses e
     LEFT JOIN categories c ON e.category_id = c.id
     LEFT JOIN categories pc ON c.parent_id = pc.id
     LEFT JOIN members m ON e.member_id = m.id
     WHERE e.expense_date BETWEEN ? AND ?
     ORDER BY e.expense_date`,
    [start_date, end_date]
  )
  
  // 调用AI分析
  const analysis = await analyzeExpense(
    expenses,
    { start: start_date, end: end_date },
    budget || { total: 0, categories: {} }
  )
  
  return successResponse(analysis)
})
