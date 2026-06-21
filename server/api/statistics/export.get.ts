import { requireAuth } from '~/server/utils/auth'
import { query } from '~/server/utils/db'

/**
 * 导出消费记录Excel（CSV格式）
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const queryParams = getQuery(event)
  const startDateInput = queryParams.start_date as string
  const endDateInput = queryParams.end_date as string

  if (!startDateInput || !endDateInput) {
    setResponseStatus(event, 400)
    return '开始日期和结束日期不能为空'
  }

  const formatSQLDate = (isoDate: string) => {
    const dateObj = new Date(isoDate)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const startDate = formatSQLDate(startDateInput)
  const endDate = formatSQLDate(endDateInput)

  const expenses = await query<any>(
    `SELECT
      e.expense_date,
      e.expense_time,
      COALESCE(pc.name, c.name) as category,
      CASE WHEN c.parent_id IS NOT NULL THEN c.name ELSE '' END as subcategory,
      m.name as member,
      e.amount,
      e.description,
      e.remarks,
      e.created_at
     FROM expenses e
     LEFT JOIN categories c ON e.category_id = c.id
     LEFT JOIN categories pc ON c.parent_id = pc.id
     LEFT JOIN members m ON e.member_id = m.id
     WHERE e.expense_date BETWEEN ? AND ?
     ORDER BY e.expense_date DESC, e.expense_time DESC`,
    [startDate, endDate]
  )

  // 生成CSV内容
  const headers = ['日期', '时间', '分类', '子分类', '成员', '金额', '描述', '备注', '创建时间']
  const csvRows = expenses.map((expense: any) => [
    expense.expense_date,
    expense.expense_time || '',
    expense.category || '',
    expense.subcategory || '',
    expense.member || '',
    Number(expense.amount).toFixed(2),
    expense.description || '',
    expense.remarks || '',
    expense.created_at || '',
  ])

  const csvContent = [
    headers.join(','),
    ...csvRows.map((row: string[]) => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  // 添加BOM以支持Excel中文显示
  const bom = '\uFEFF'
  const csvWithBom = bom + csvContent

  // 设置响应头
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="消费记录_${startDate}_${endDate}.csv"`)

  return csvWithBom
})
