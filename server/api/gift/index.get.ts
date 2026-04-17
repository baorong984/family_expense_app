import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { query, queryOne } from '~/server/utils/db'
import type { Gift } from '~/types'

// 获取人情记录列表
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const queryParams = getQuery(event)
  
  const page = parseInt(queryParams.page as string) || 1
  const pageSize = parseInt(queryParams.page_size as string) || parseInt(queryParams.pageSize as string) || 20
  const giftType = queryParams.gift_type as string
  const startDateInput = queryParams.start_date as string
  const endDateInput = queryParams.end_date as string
  const relatedPerson = queryParams.related_person as string
  const occasion = queryParams.occasion as string

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
  
  if (giftType && ['outgoing', 'incoming'].includes(giftType)) {
    whereClause += ' AND g.gift_type = ?'
    params.push(giftType)
  }
  if (startDate) {
    whereClause += ' AND g.expense_date >= ?'
    params.push(startDate)
  }
  if (endDate) {
    whereClause += ' AND g.expense_date <= ?'
    params.push(endDate)
  }
  if (relatedPerson) {
    whereClause += ' AND g.related_person LIKE ?'
    params.push(`%${relatedPerson}%`)
  }
  if (occasion) {
    whereClause += ' AND g.occasion = ?'
    params.push(occasion)
  }
  
  // 查询总数
  const countResult = await queryOne<{ total: number }>(
    `SELECT COUNT(*) as total FROM gifts g ${whereClause}`,
    params
  )
  const total = countResult?.total || 0
  
  // 查询列表
  const offset = Math.max(0, (page - 1) * pageSize)
  const limit = Math.max(1, pageSize)
  
  const list = await query<Gift>(
    `SELECT g.*, 
            c.name as category_name,
            m.name as member_name
     FROM gifts g
     LEFT JOIN expenses e ON g.expense_id = e.id
     LEFT JOIN categories c ON e.category_id = c.id
     LEFT JOIN members m ON e.member_id = m.id
     ${whereClause}
     ORDER BY g.expense_date DESC, g.expense_time DESC
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