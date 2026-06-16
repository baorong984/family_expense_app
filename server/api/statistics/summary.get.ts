import { requireAuth } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'
import { query, queryOne } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const queryParams = getQuery(event)
  const startDateInput = queryParams.start_date as string
  const endDateInput = queryParams.end_date as string

  // 将ISO格式日期转换为YYYY-MM-DD格式
  const formatSQLDate = (isoDate: string) => {
    const dateObj = new Date(isoDate)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const startDate = startDateInput ? formatSQLDate(startDateInput) : null
  const endDate = endDateInput ? formatSQLDate(endDateInput) : null
  
  let whereClause = ''
  let joinWhereClause = ''
  const params: any[] = []
  
  if (startDate && endDate) {
    whereClause = 'WHERE expense_date BETWEEN ? AND ?'
    joinWhereClause = 'AND e.expense_date BETWEEN ? AND ?'
    params.push(startDate, endDate)
  }
  
  // 基本统计
  const basicStats = await queryOne<{
    total_amount: number
    total_count: number
    avg_amount: number
    max_amount: number
    min_amount: number
  }>(
    `SELECT 
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(*) as total_count,
      COALESCE(AVG(amount), 0) as avg_amount,
      COALESCE(MAX(amount), 0) as max_amount,
      COALESCE(MIN(amount), 0) as min_amount
     FROM expenses
     ${whereClause}`,
    params
  )
  
  // 分类汇总
  const categorySummary = await query<{
    category_id: number
    category_name: string
    amount: number
    count: number
  }>(
    `SELECT 
      c.id as category_id,
      c.name as category_name,
      COALESCE(SUM(e.amount), 0) as amount,
      COUNT(e.id) as count
     FROM categories c
     LEFT JOIN expenses e ON c.id = e.category_id ${joinWhereClause}
     WHERE c.parent_id IS NULL
     GROUP BY c.id, c.name
     HAVING amount > 0
     ORDER BY amount DESC`,
    params
  )
  
  // 计算百分比
  const totalAmount = basicStats?.total_amount || 0
  const categoryWithPercentage = categorySummary.map(item => ({
    ...item,
    percentage: totalAmount > 0 ? (item.amount / totalAmount * 100) : 0,
  }))
  
  // 成员汇总
  const memberSummary = await query<{
    member_id: number
    member_name: string
    member_color: string
    amount: number
    count: number
  }>(
    `SELECT
      m.id as member_id,
      m.name as member_name,
      m.color as member_color,
      COALESCE(SUM(e.amount), 0) as amount,
      COUNT(e.id) as count
     FROM members m
     LEFT JOIN expenses e ON m.id = e.member_id ${joinWhereClause}
     GROUP BY m.id, m.name, m.color
     HAVING amount > 0
     ORDER BY amount DESC`,
    params
  )
  
  const memberWithPercentage = memberSummary.map(item => ({
    ...item,
    percentage: totalAmount > 0 ? (item.amount / totalAmount * 100) : 0,
  }))
  
  return successResponse({
    ...basicStats,
    category_summary: categoryWithPercentage,
    member_summary: memberWithPercentage,
  })
})
