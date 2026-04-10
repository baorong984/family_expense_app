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
      total_spent: 0,
      total_remaining: 0,
      progress_percentage: 0,
      category_progress: [],
    })
  }
  
  // 计算日期范围
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]
  
  // 获取总预算
  const totalBudget = await queryOne<{ total_amount: number }>(
    'SELECT total_amount FROM budgets WHERE year = ? AND month = ? AND category_id IS NULL',
    [year, month]
  )
  
  // 获取总支出
  const totalSpent = await queryOne<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date BETWEEN ? AND ?',
    [startDate, endDate]
  )
  
  // 获取分类预算
  const categoryBudgets = await query<{
    category_id: number
    category_name: string
    budget: number
  }>(
    `SELECT 
      b.category_id,
      c.name as category_name,
      b.total_amount as budget
     FROM budgets b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.year = ? AND b.month = ? AND b.category_id IS NOT NULL`,
    [year, month]
  )
  
  // 获取各分类支出
  const categoryProgress = await Promise.all(
    categoryBudgets.map(async (cat) => {
      const spent = await queryOne<{ total: number }>(
        `SELECT COALESCE(SUM(e.amount), 0) as total
         FROM expenses e
         LEFT JOIN categories c ON e.category_id = c.id
         WHERE (c.id = ? OR c.parent_id = ?) AND e.expense_date BETWEEN ? AND ?`,
        [cat.category_id, cat.category_id, startDate, endDate]
      )
      
      const spentAmount = spent?.total || 0
      const remaining = cat.budget - spentAmount
      const percentage = cat.budget > 0 ? (spentAmount / cat.budget * 100) : 0
      
      return {
        category_id: cat.category_id,
        category_name: cat.category_name,
        budget: cat.budget,
        spent: spentAmount,
        remaining,
        percentage: Math.round(percentage * 100) / 100,
        is_over_budget: spentAmount > cat.budget,
      }
    })
  )
  
  const totalBudgetAmount = totalBudget?.total_amount || 0
  const totalSpentAmount = totalSpent?.total || 0
  const totalRemaining = totalBudgetAmount - totalSpentAmount
  const progressPercentage = totalBudgetAmount > 0 ? (totalSpentAmount / totalBudgetAmount * 100) : 0
  
  return successResponse({
    total_budget: totalBudgetAmount,
    total_spent: totalSpentAmount,
    total_remaining: totalRemaining,
    progress_percentage: Math.round(progressPercentage * 100) / 100,
    category_progress: categoryProgress,
  })
})
