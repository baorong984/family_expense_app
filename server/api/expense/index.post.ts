import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { insert } from '~/server/utils/db'

const schema = z.object({
  amount: z.coerce.number().positive('金额必须为正数'),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式错误'),
  expense_time: z.string().optional().nullable(),
  category_id: z.number().int().positive('请选择分类'),
  member_id: z.number().int().positive().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  remarks: z.string().max(200).optional().nullable(),
})

// 将 undefined 转换为 null
const toNull = (value: any) => value === undefined ? null : value

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  
  // 验证输入
  const result = schema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }
  
  const data = result.data
  
  // 插入记录 - 确保所有 undefined 转为 null
  const id = await insert(
    `INSERT INTO expenses (amount, expense_date, expense_time, category_id, member_id, description, remarks, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.amount,
      data.expense_date,
      toNull(data.expense_time),
      data.category_id,
      toNull(data.member_id),
      toNull(data.description),
      toNull(data.remarks),
      user.id
    ]
  )
  
  return successResponse({
    id,
    ...data,
  }, '创建成功')
})
