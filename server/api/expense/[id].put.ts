import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne, update } from '~/server/utils/db'

const schema = z.object({
  amount: z.number().positive('金额必须为正数').optional(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式错误').optional(),
  expense_time: z.string().optional().nullable(),
  category_id: z.number().int().positive('请选择分类').optional(),
  member_id: z.number().int().positive().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  remarks: z.string().max(200).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const id = getRouterParam(event, 'id')
  if (!id) {
    return errorResponse('记录ID不能为空', 400)
  }
  
  // 检查记录是否存在
  const existing = await queryOne('SELECT id FROM expenses WHERE id = ?', [id])
  if (!existing) {
    return errorResponse('记录不存在', 404)
  }
  
  const body = await readBody(event)
  
  // 验证输入
  const result = schema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }
  
  const data = result.data
  
  // 构建更新语句
  const updates: string[] = []
  const params: any[] = []
  
  if (data.amount !== undefined) {
    updates.push('amount = ?')
    params.push(data.amount)
  }
  if (data.expense_date !== undefined) {
    updates.push('expense_date = ?')
    params.push(data.expense_date)
  }
  if (data.expense_time !== undefined) {
    updates.push('expense_time = ?')
    params.push(data.expense_time || null)
  }
  if (data.category_id !== undefined) {
    updates.push('category_id = ?')
    params.push(data.category_id)
  }
  if (data.member_id !== undefined) {
    updates.push('member_id = ?')
    params.push(data.member_id || null)
  }
  if (data.description !== undefined) {
    updates.push('description = ?')
    params.push(data.description || null)
  }
  if (data.remarks !== undefined) {
    updates.push('remarks = ?')
    params.push(data.remarks || null)
  }
  
  if (updates.length === 0) {
    return errorResponse('没有需要更新的字段', 400)
  }
  
  params.push(id)
  await update(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`, params)
  
  return successResponse({
    id: parseInt(id),
    ...data,
  }, '更新成功')
})
