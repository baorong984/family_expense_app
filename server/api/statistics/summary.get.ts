import { requireAuth } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'
import { query, queryOne } from '~/server/utils/db'

/**
 * 获取消费统计摘要数据
 * 支持按日期范围、分类、成员、关键词进行筛选
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const queryParams = getQuery(event)
  const startDateInput = queryParams.start_date as string
  const endDateInput = queryParams.end_date as string
  const categoryId = queryParams.category_id ? parseInt(queryParams.category_id as string) : null
  const memberId = queryParams.member_id ? parseInt(queryParams.member_id as string) : null
  const keyword = queryParams.keyword as string

  /**
   * 将ISO格式日期转换为YYYY-MM-DD格式
   * @param iso_date - ISO格式的日期字符串
   * @returns 格式化后的日期字符串 YYYY-MM-DD
   */
  const format_sql_date = (iso_date: string) => {
    const date_obj = new Date(iso_date)
    const year = date_obj.getFullYear()
    const month = String(date_obj.getMonth() + 1).padStart(2, '0')
    const day = String(date_obj.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /** 开始日期 */
  const start_date = startDateInput ? format_sql_date(startDateInput) : null
  /** 结束日期 */
  const end_date = endDateInput ? format_sql_date(endDateInput) : null

  /**
   * 构建WHERE条件数组（用于单表查询expenses）
   */
  const where_conditions: string[] = []
  /** WHERE条件的参数值 */
  const params: any[] = []

  if (start_date) {
    where_conditions.push('e.expense_date >= ?')
    params.push(start_date)
  }
  if (end_date) {
    where_conditions.push('e.expense_date <= ?')
    params.push(end_date)
  }
  if (categoryId) {
    where_conditions.push('e.category_id = ?')
    params.push(categoryId)
  }
  if (memberId) {
    where_conditions.push('e.member_id = ?')
    params.push(memberId)
  }
  if (keyword) {
    where_conditions.push('(e.description LIKE ? OR e.remarks LIKE ?)')
    params.push(`%${keyword}%`, `%${keyword}%`)
  }

  /** 单表查询的WHERE子句 */
  const where_clause = where_conditions.length > 0
    ? 'WHERE ' + where_conditions.join(' AND ')
    : ''

  /**
   * 构建JOIN查询的AND条件（用于多表关联查询，别名使用e.前缀）
   */
  const join_conditions: string[] = []
  /** JOIN查询的参数值 */
  const join_params: any[] = []

  if (start_date) {
    join_conditions.push('e.expense_date >= ?')
    join_params.push(start_date)
  }
  if (end_date) {
    join_conditions.push('e.expense_date <= ?')
    join_params.push(end_date)
  }
  if (categoryId) {
    join_conditions.push('e.category_id = ?')
    join_params.push(categoryId)
  }
  if (memberId) {
    join_conditions.push('e.member_id = ?')
    join_params.push(memberId)
  }
  if (keyword) {
    join_conditions.push('(e.description LIKE ? OR e.remarks LIKE ?)')
    join_params.push(`%${keyword}%`, `%${keyword}%`)
  }

  /** JOIN查询的AND条件子句 */
  const join_where_clause = join_conditions.length > 0
    ? 'AND ' + join_conditions.join(' AND ')
    : ''

  // 基本统计查询（总支出、记录数、平均、最高、最低）
  const basic_stats = await queryOne<{
    total_amount: number
    total_count: number
    avg_amount: number
    max_amount: number
    min_amount: number
  }>(
    `SELECT
      COALESCE(SUM(e.amount), 0) as total_amount,
      COUNT(*) as total_count,
      COALESCE(AVG(e.amount), 0) as avg_amount,
      COALESCE(MAX(e.amount), 0) as max_amount,
      COALESCE(MIN(e.amount), 0) as min_amount
     FROM expenses e
     ${where_clause}`,
    params
  )

  // 分类汇总查询（包含子分类消费）
  const category_summary = await query<{
    category_id: number
    category_name: string
    amount: number
    count: number
  }>(
    `SELECT
      c.id as category_id,
      c.name as category_name,
      COALESCE(SUM(e.amount), 0) as amount,
      COUNT(DISTINCT e.id) as count
     FROM categories c
     LEFT JOIN expenses e ON (
       e.category_id = c.id
       OR e.category_id IN (SELECT id FROM categories WHERE parent_id = c.id)
     ) ${join_where_clause}
     WHERE c.parent_id IS NULL
     GROUP BY c.id, c.name
     HAVING amount > 0
     ORDER BY amount DESC`,
    join_params
  )

  // 计算分类占比百分比
  const total_amount = basic_stats?.total_amount || 0
  const category_with_percentage = category_summary.map(item => ({
    ...item,
    percentage: total_amount > 0 ? (item.amount / total_amount * 100) : 0,
  }))

  // 成员汇总查询
  const member_summary = await query<{
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
     LEFT JOIN expenses e ON m.id = e.member_id ${join_where_clause}
     GROUP BY m.id, m.name, m.color
     HAVING amount > 0
     ORDER BY amount DESC`,
    join_params
  )

  // 计算成员占比百分比
  const member_with_percentage = member_summary.map(item => ({
    ...item,
    percentage: total_amount > 0 ? (item.amount / total_amount * 100) : 0,
  }))

  // 每日趋势汇总查询
  const trend_summary = await query<{
    date: string
    amount: number
  }>(
    `SELECT
      DATE_FORMAT(e.expense_date, '%Y-%m-%d') as date,
      COALESCE(SUM(e.amount), 0) as amount
     FROM expenses e
     ${where_clause}
     GROUP BY DATE_FORMAT(e.expense_date, '%Y-%m-%d')
     ORDER BY date ASC`,
    params
  )

  return successResponse({
    ...basic_stats,
    category_summary: category_with_percentage,
    member_summary: member_with_percentage,
    trend_data: trend_summary,
  })
})
