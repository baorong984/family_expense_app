import { requireAuth } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'
import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const queryParams = getQuery(event)
  const startDate = queryParams.start_date as string
  const endDate = queryParams.end_date as string
  
  if (!startDate || !endDate) {
    return successResponse({ categories: [] })
  }
  
  // 获取大类统计
  const categories = await query<{
    category_id: number
    category_name: string
    total_amount: number
    count: number
  }>(
    `SELECT 
      c.id as category_id,
      c.name as category_name,
      COALESCE(SUM(e.amount), 0) as total_amount,
      COUNT(e.id) as count
     FROM categories c
     LEFT JOIN expenses e ON c.id = e.category_id AND e.expense_date BETWEEN ? AND ?
     WHERE c.parent_id IS NULL
     GROUP BY c.id, c.name
     HAVING total_amount > 0
     ORDER BY total_amount DESC`,
    [startDate, endDate]
  )
  
  const totalAmount = categories.reduce((sum, item) => sum + item.total_amount, 0)
  
  // 获取每个大类的子分类统计
  const categoriesWithSub = await Promise.all(
    categories.map(async (cat) => {
      const subcategories = await query<{
        subcategory_id: number
        subcategory_name: string
        amount: number
        count: number
      }>(
        `SELECT 
          c.id as subcategory_id,
          c.name as subcategory_name,
          COALESCE(SUM(e.amount), 0) as amount,
          COUNT(e.id) as count
         FROM categories c
         LEFT JOIN expenses e ON c.id = e.category_id AND e.expense_date BETWEEN ? AND ?
         WHERE c.parent_id = ?
         GROUP BY c.id, c.name
         HAVING amount > 0
         ORDER BY amount DESC`,
        [startDate, endDate, cat.category_id]
      )
      
      return {
        ...cat,
        percentage: totalAmount > 0 ? (cat.total_amount / totalAmount * 100) : 0,
        subcategories,
      }
    })
  )
  
  return successResponse({ categories: categoriesWithSub })
})
