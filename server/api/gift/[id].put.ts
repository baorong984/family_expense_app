import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne } from '~/server/utils/db'
import type { Gift } from '~/types'

// 验证schema
const giftUpdateSchema = z.object({
  payment_type: z.enum(['cash', 'item']).optional(),
  amount: z.number().nullable().optional(),
  item_name: z.string().nullable().optional(),
  item_value: z.number().nullable().optional(),
  related_person: z.string().min(1, '关联人不能为空').optional(),
  occasion: z.string().min(1, '事由不能为空').optional(),
  expense_date: z.string().min(1, '日期不能为空').optional(),
  expense_time: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  is_returned: z.number().optional(),
  return_gift_id: z.number().nullable().optional(),
}).refine((data) => {
  // 如果指定了payment_type
  if (data.payment_type === 'cash') {
    return data.amount !== null && data.amount !== undefined && data.amount > 0
  }
  if (data.payment_type === 'item') {
    return data.item_name !== null && data.item_name !== undefined && data.item_name.trim() !== ''
  }
  return true
}, {
  message: '现金支付需要填写金额，实物支付需要填写实物名称',
})

// 更新人情记录
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const id = parseInt(getRouterParam(event, 'id') || '')
  
  if (!id || isNaN(id)) {
    return errorResponse('无效的ID', 400)
  }
  
  try {
    const body = await readBody(event)
    
    // 验证数据
    const validatedData = giftUpdateSchema.parse(body)
    
    // 构建更新字段
    const updateFields: string[] = []
    const updateValues: any[] = []
    
    if (validatedData.payment_type !== undefined) {
      updateFields.push('payment_type = ?')
      updateValues.push(validatedData.payment_type)
    }
    if (validatedData.amount !== undefined) {
      updateFields.push('amount = ?')
      updateValues.push(validatedData.amount)
    }
    if (validatedData.item_name !== undefined) {
      updateFields.push('item_name = ?')
      updateValues.push(validatedData.item_name)
    }
    if (validatedData.item_value !== undefined) {
      updateFields.push('item_value = ?')
      updateValues.push(validatedData.item_value)
    }
    if (validatedData.related_person !== undefined) {
      updateFields.push('related_person = ?')
      updateValues.push(validatedData.related_person)
    }
    if (validatedData.occasion !== undefined) {
      updateFields.push('occasion = ?')
      updateValues.push(validatedData.occasion)
    }
    if (validatedData.expense_date !== undefined) {
      updateFields.push('expense_date = ?')
      // 将ISO格式日期转换为YYYY-MM-DD格式
      const dateObj = new Date(validatedData.expense_date)
      const year = dateObj.getFullYear()
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getDate()).padStart(2, '0')
      updateValues.push(`${year}-${month}-${day}`)
    }
    if (validatedData.expense_time !== undefined) {
      updateFields.push('expense_time = ?')
      updateValues.push(validatedData.expense_time)
    }
    if (validatedData.remarks !== undefined) {
      updateFields.push('remarks = ?')
      updateValues.push(validatedData.remarks)
    }
    if (validatedData.is_returned !== undefined) {
      updateFields.push('is_returned = ?')
      updateValues.push(validatedData.is_returned)
    }
    if (validatedData.return_gift_id !== undefined) {
      updateFields.push('return_gift_id = ?')
      updateValues.push(validatedData.return_gift_id)
    }
    
    if (updateFields.length === 0) {
      return errorResponse('没有需要更新的字段', 400)
    }
    
    updateValues.push(id)
    
    // 更新记录
    await queryOne(
      `UPDATE gifts SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )
    
    // 查询更新后的记录
    const gift = await queryOne<Gift>(
      `SELECT g.*, 
              c.name as category_name,
              m.name as member_name
       FROM gifts g
       LEFT JOIN expenses e ON g.expense_id = e.id
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN members m ON e.member_id = m.id
       WHERE g.id = ?`,
      [id]
    )
    
    if (!gift) {
      return errorResponse('人情记录不存在', 404)
    }
    
    return successResponse(gift, '更新成功')
  } catch (error: any) {
    console.error('更新人情记录失败:', error)
    if (error.name === 'ZodError') {
      return errorResponse(error.errors[0]?.message || '参数验证失败', 400)
    }
    return errorResponse(error.message || '更新失败', 500)
  }
})