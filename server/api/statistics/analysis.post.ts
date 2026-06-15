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
      COALESCE(pc.name, c.name) as category,
      CASE WHEN c.parent_id IS NOT NULL THEN c.name ELSE NULL END as subcategory,
      m.name as member
     FROM expenses e
     LEFT JOIN categories c ON e.category_id = c.id
     LEFT JOIN categories pc ON c.parent_id = pc.id
     LEFT JOIN members m ON e.member_id = m.id
     WHERE e.expense_date BETWEEN ? AND ?
     ORDER BY e.expense_date`,
    [startDate, endDate]
  )

  // 计算准确的统计数据
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const transactionCount = expenses.length
  
  // 按分类汇总
  const categoryMap = new Map<string, { amount: number; count: number }>()
  for (const e of expenses) {
    const cat = e.category || '其他'
    const existing = categoryMap.get(cat) || { amount: 0, count: 0 }
    categoryMap.set(cat, {
      amount: existing.amount + Number(e.amount),
      count: existing.count + 1
    })
  }
  
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalSpent > 0 ? Number((data.amount / totalSpent * 100).toFixed(2)) : 0,
      transaction_count: data.count
    }))
    .sort((a, b) => b.amount - a.amount)

  // 调用AI分析
  const analysis = await analyzeExpense(
    expenses,
    { start: startDate, end: endDate },
    budget || { total: 0, categories: {} }
  )
  
  // 使用后端计算的准确数据覆盖AI返回的数据
  analysis.total_spent = totalSpent
  analysis.category_breakdown = categoryBreakdown
  analysis.budget_total = budgetTotal
  analysis.budget_remaining = budgetTotal - totalSpent
  analysis.budget_usage_rate = budgetTotal > 0 
    ? Number((totalSpent / budgetTotal * 100).toFixed(2))
    : 0
  
  return successResponse(analysis)
})
