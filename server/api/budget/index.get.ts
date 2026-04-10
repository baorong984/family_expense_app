import { requireAuth } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'
import { query, queryOne } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const queryParams = getQuery(event)
  const year = parseInt(queryParams.year as string)
  const month = parseInt(queryParams.month as string)
  
  if (!year || !month) {
    return successResponse({
      total_budget: 0,
      category_budgets: [],
    })
  }
  
  const totalBudget = await queryOne<{ total_amount: number }>(
    'SELECT total_amount FROM budgets WHERE year = ? AND month = ? AND category_id IS NULL',
    [year, month]
  )
  
  const categoryBudgets = await query<{
    category_id: number
    category_name: string
    budget_amount: number
  }>(
    `SELECT 
      b.category_id,
      c.name as category_name,
      b.total_amount as budget_amount
     FROM budgets b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.year = ? AND b.month = ? AND b.category_id IS NOT NULL
     ORDER BY c.sort_order`,
    [year, month]
  )
  
  return successResponse({
    total_budget: totalBudget?.total_amount || 0,
    category_budgets: categoryBudgets,
  })
})
