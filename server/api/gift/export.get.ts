import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { query } from '~/server/utils/db'

// 导出人情记录Excel
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const queryParams = getQuery(event)
  
  // 验证参数
  const schema = z.object({
    start_date: z.string().min(1, '开始日期不能为空'),
    end_date: z.string().min(1, '结束日期不能为空'),
    gift_type: z.enum(['outgoing', 'incoming']).optional(),
  })
  
  try {
    const validatedData = schema.parse(queryParams)
    const { start_date, end_date, gift_type } = validatedData
    
    // 构建查询条件
    let whereClause = 'WHERE g.expense_date BETWEEN ? AND ?'
    const params: any[] = [start_date, end_date]
    
    if (gift_type) {
      whereClause += ' AND g.gift_type = ?'
      params.push(gift_type)
    }
    
    // 查询数据
    const gifts = await query<any>(
      `SELECT 
        g.expense_date,
        g.expense_time,
        CASE WHEN g.gift_type = 'outgoing' THEN '出礼' ELSE '收礼' END as type,
        g.related_person,
        g.occasion,
        CASE WHEN g.payment_type = 'cash' THEN CONCAT('¥', g.amount) ELSE CONCAT(g.item_name, '(¥', COALESCE(g.item_value, 0), ')') END as amount_item,
        CASE WHEN g.gift_type = 'outgoing' THEN CASE WHEN g.is_returned = 1 THEN '已回礼' ELSE '未回礼' END ELSE '-' END as status,
        g.remarks,
        g.created_at
       FROM gifts g
       ${whereClause}
       ORDER BY g.expense_date DESC, g.expense_time DESC`,
      params
    )
    
    // 生成CSV内容
    const headers = ['日期', '时间', '类型', '关联人', '事由', '金额/实物', '状态', '备注', '创建时间']
    const csvRows = gifts.map((gift: any) => [
      gift.expense_date,
      gift.expense_time || '',
      gift.type,
      gift.related_person,
      gift.occasion,
      gift.amount_item,
      gift.status,
      gift.remarks || '',
      gift.created_at,
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
    setHeader(event, 'Content-Disposition', `attachment; filename="人情记录_${start_date}_${end_date}.csv"`)
    
    return csvWithBom
  } catch (error: any) {
    console.error('导出人情记录失败:', error)
    if (error.name === 'ZodError') {
      setResponseStatus(event, 400)
      return error.errors[0]?.message || '参数验证失败'
    }
    setResponseStatus(event, 500)
    return error.message || '导出失败'
  }
})