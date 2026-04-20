import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { query } from '~/server/utils/db'
import { analyzeExpense } from '~/server/utils/ai'

const schema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  budget: z.object({
    total: z.coerce.number(),
    categories: z.record(z.coerce.number()).optional(),
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
  const budgetTotal = budget?.total || 0

  // 将ISO格式日期转换为YYYY-MM-DD格式
  const formatSQLDate = (isoDate: string) => {
    const dateObj = new Date(isoDate)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const startDate = formatSQLDate(start_date)
  const endDate = formatSQLDate(end_date)

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
    [startDate, endDate]
  )

  // 调用AI分析
  const analysis = await analyzeExpense(
    expenses,
    { start: startDate, end: endDate },
    budget || { total: 0, categories: {} }
  )
  
  // 确保预算值使用传入的值
  analysis.budget_total = budgetTotal
  analysis.budget_remaining = budgetTotal - analysis.total_spent
  analysis.budget_usage_rate = budgetTotal > 0 
    ? Number((analysis.total_spent / budgetTotal * 100).toFixed(2))
    : 0
  
  return successResponse(analysis)
})
