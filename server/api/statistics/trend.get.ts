import { requireAuth } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'
import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const queryParams = getQuery(event)
  const startDateInput = queryParams.start_date as string
  const endDateInput = queryParams.end_date as string
  const granularity = (queryParams.granularity as string) || 'day'

  if (!startDateInput || !endDateInput) {
    return successResponse({
      trend_data: [],
      total_amount: 0,
      total_count: 0,
    })
  }

  // 将ISO格式日期转换为YYYY-MM-DD格式
  const formatSQLDate = (isoDate: string) => {
    const dateObj = new Date(isoDate)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const startDate = formatSQLDate(startDateInput)
  const endDate = formatSQLDate(endDateInput)
  
  // 根据粒度决定分组方式
  let dateFormat = '%Y-%m-%d'
  if (granularity === 'week') {
    dateFormat = '%Y-%u'
  } else if (granularity === 'month') {
    dateFormat = '%Y-%m'
  }
  
  const trendData = await query<{
    date: string
    amount: number
    count: number
  }>(
    `SELECT 
      date,
      COALESCE(SUM(amount), 0) as amount,
      COUNT(*) as count
     FROM (
       SELECT 
         DATE_FORMAT(expense_date, ?) as date,
         amount
       FROM expenses
       WHERE expense_date BETWEEN ? AND ?
     ) as formatted_expenses
     GROUP BY date
     ORDER BY date`,
    [dateFormat, startDate, endDate]
  )
  
  const totalAmount = trendData.reduce((sum, item) => sum + item.amount, 0)
  const totalCount = trendData.reduce((sum, item) => sum + item.count, 0)
  
  return successResponse({
    trend_data: trendData,
    total_amount: totalAmount,
    total_count: totalCount,
  })
})
