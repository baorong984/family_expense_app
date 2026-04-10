import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { insert, update } from '~/server/utils/db'

const schema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  total_budget: z.number().positive('预算金额必须为正数'),
  category_budgets: z.array(z.object({
    category_id: z.number().int().positive(),
    budget_amount: z.number().min(0),
  })).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  
  const result = schema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }
  
  const { year, month, total_budget, category_budgets } = result.data
  
  if (category_budgets && category_budgets.length > 0) {
    const totalCategoryBudget = category_budgets.reduce((sum, item) => sum + item.budget_amount, 0)
    if (totalCategoryBudget > total_budget) {
      return errorResponse('分类预算总和不能超过总预算', 400)
    }
  }
  
  await update(
    'DELETE FROM budgets WHERE year = ? AND month = ? AND created_by = ?',
    [year, month, user.id]
  )
  
  await insert(
    'INSERT INTO budgets (year, month, total_amount, category_id, created_by) VALUES (?, ?, ?, NULL, ?)',
    [year, month, total_budget, user.id]
  )
  
  if (category_budgets && category_budgets.length > 0) {
    for (const item of category_budgets) {
      await insert(
        'INSERT INTO budgets (year, month, total_amount, category_id, created_by) VALUES (?, ?, ?, ?, ?)',
        [year, month, item.budget_amount, item.category_id, user.id]
      )
    }
  }
  
  return successResponse({
    year,
    month,
    total_budget,
  }, '设置成功')
})