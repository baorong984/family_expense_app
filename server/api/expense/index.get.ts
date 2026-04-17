import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { query, queryOne } from '~/server/utils/db'
import type { Expense } from '~/types'

// 获取消费记录列表
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const queryParams = getQuery(event)
  
  const page = parseInt(queryParams.page as string) || 1
  const pageSize = parseInt(queryParams.pageSize as string) || 20
  const startDateInput = queryParams.start_date as string
  const endDateInput = queryParams.end_date as string
  const categoryId = queryParams.category_id ? parseInt(queryParams.category_id as string) : null
  const memberId = queryParams.member_id ? parseInt(queryParams.member_id as string) : null
  const keyword = queryParams.keyword as string

  // 将ISO格式日期转换为YYYY-MM-DD格式
  const formatSQLDate = (isoDate: string) => {
    const dateObj = new Date(isoDate)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const startDate = startDateInput ? formatSQLDate(startDateInput) : ''
  const endDate = endDateInput ? formatSQLDate(endDateInput) : ''

  // 构建查询条件
  let whereClause = 'WHERE 1=1'
  const params: any[] = []
  
  if (startDate) {
    whereClause += ' AND e.expense_date >= ?'
    params.push(startDate)
  }
  if (endDate) {
    whereClause += ' AND e.expense_date <= ?'
    params.push(endDate)
  }
  if (categoryId) {
    whereClause += ' AND e.category_id = ?'
    params.push(categoryId)
  }
  if (memberId) {
    whereClause += ' AND e.member_id = ?'
    params.push(memberId)
  }
  if (keyword) {
    whereClause += ' AND (e.description LIKE ? OR e.remarks LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`)
  }
  
  // 查询总数
  const countResult = await queryOne<{ total: number }>(
    `SELECT COUNT(*) as total FROM expenses e ${whereClause}`,
    params
  )
  const total = countResult?.total || 0
  
  // 查询列表
  const offset = Math.max(0, (page - 1) * pageSize)
  const limit = Math.max(1, pageSize)
  
  const list = await query<Expense>(
    `SELECT e.*, c.name as category_name, m.name as member_name, m.color as member_color
     FROM expenses e
     LEFT JOIN categories c ON e.category_id = c.id
     LEFT JOIN members m ON e.member_id = m.id
     ${whereClause}
     ORDER BY e.expense_date DESC, e.expense_time DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  )
  
  return successResponse({
    list,
    total,
    page,
    pageSize,
  })
})