import { requireAuth } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'
import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const queryParams = getQuery(event)
  const startDate = queryParams.start_date as string
  const endDate = queryParams.end_date as string
  
  if (!startDate || !endDate) {
    return successResponse({ members: [] })
  }
  
  // 获取成员统计
  const members = await query<{
    member_id: number
    member_name: string
    total_amount: number
    count: number
  }>(
    `SELECT 
      m.id as member_id,
      m.name as member_name,
      COALESCE(SUM(e.amount), 0) as total_amount,
      COUNT(e.id) as count
     FROM members m
     LEFT JOIN expenses e ON m.id = e.member_id AND e.expense_date BETWEEN ? AND ?
     GROUP BY m.id, m.name
     HAVING total_amount > 0
     ORDER BY total_amount DESC`,
    [startDate, endDate]
  )
  
  const totalAmount = members.reduce((sum, item) => sum + item.total_amount, 0)
  
  // 获取每个成员的分类分解
  const membersWithBreakdown = await Promise.all(
    members.map(async (member) => {
      const categoryBreakdown = await query<{
        category_name: string
        amount: number
      }>(
        `SELECT 
          c.name as category_name,
          COALESCE(SUM(e.amount), 0) as amount
         FROM categories c
         INNER JOIN expenses e ON c.id = e.category_id
         WHERE e.member_id = ? AND e.expense_date BETWEEN ? AND ?
         GROUP BY c.id, c.name
         ORDER BY amount DESC`,
        [member.member_id, startDate, endDate]
      )
      
      const memberTotal = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0)
      
      return {
        ...member,
        percentage: totalAmount > 0 ? (member.total_amount / totalAmount * 100) : 0,
        category_breakdown: categoryBreakdown.map(item => ({
          ...item,
          percentage: memberTotal > 0 ? (item.amount / memberTotal * 100) : 0,
        })),
      }
    })
  )
  
  return successResponse({ members: membersWithBreakdown })
})
