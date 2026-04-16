import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { query, queryOne, insert } from '~/server/utils/db'
import type { Gift } from '~/types'

// 验证schema
const giftSchema = z.object({
  gift_type: z.enum(['outgoing', 'incoming']),
  payment_type: z.enum(['cash', 'item']),
  amount: z.number().nullable().optional(),
  item_name: z.string().nullable().optional(),
  item_value: z.number().nullable().optional(),
  related_person: z.string().min(1, '关联人不能为空'),
  occasion: z.string().min(1, '事由不能为空'),
  expense_date: z.string().min(1, '日期不能为空'),
  expense_time: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  is_returned: z.number().default(0),
}).refine((data) => {
  // 如果是现金支付，金额必填
  if (data.payment_type === 'cash') {
    return data.amount !== null && data.amount !== undefined && data.amount > 0
  }
  // 如果是实物支付，实物名称必填
  if (data.payment_type === 'item') {
    return data.item_name !== null && data.item_name !== undefined && data.item_name.trim() !== ''
  }
  return true
}, {
  message: '现金支付需要填写金额，实物支付需要填写实物名称',
})

// 创建人情记录
export default defineEventHandler(async (event) => {
  console.log('=== 开始创建人情记录 ===')
  
  const user = await requireAuth(event)
  console.log('用户认证成功，用户ID:', user.id)
  
  try {
    const body = await readBody(event)
    console.log('接收到的数据:', JSON.stringify(body))
    const userId = user.id
    
    // 验证数据
    const validatedData = giftSchema.parse(body)
    console.log('数据验证成功:', JSON.stringify(validatedData))
    
    // 处理日期时间
    const expenseDate = validatedData.expense_date
    const expenseTime = validatedData.expense_time || null
    
    console.log('准备插入人情记录...')
    console.log('SQL参数:', [
        validatedData.gift_type,
        validatedData.payment_type,
        validatedData.amount,
        validatedData.item_name,
        validatedData.item_value,
        validatedData.related_person,
        validatedData.occasion,
        expenseDate,
        expenseTime,
        validatedData.remarks,
        validatedData.is_returned,
        userId,
      ])
    
    // 插入人情记录
    const giftId = await insert(
      `INSERT INTO gifts (
        gift_type, payment_type, amount, item_name, item_value,
        related_person, occasion, expense_date, expense_time,
        remarks, is_returned, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        validatedData.gift_type,
        validatedData.payment_type,
        validatedData.amount,
        validatedData.item_name,
        validatedData.item_value,
        validatedData.related_person,
        validatedData.occasion,
        expenseDate,
        expenseTime,
        validatedData.remarks,
        validatedData.is_returned,
        userId,
      ]
    )
    
    console.log('人情记录插入成功，ID:', giftId)
    
    if (!giftId) {
      console.error('插入ID为空')
      return errorResponse('创建人情记录失败', 500)
    }
    
    console.log('准备查询刚创建的记录...')
    
    // 查询刚创建的记录
    const gift = await queryOne<Gift>(
      `SELECT g.* FROM gifts g WHERE g.id = ?`,
      [giftId]
    )
    
    console.log('查询到的记录:', JSON.stringify(gift))
    
    if (!gift) {
      console.error('查询记录失败，ID:', giftId)
      return errorResponse('创建成功但查询失败', 500)
    }
    
    console.log('=== 人情记录创建完成 ===')
    return successResponse(gift, '创建成功')
  } catch (error: any) {
    console.error('=== 创建人情记录失败 ===')
    console.error('错误类型:', error.name)
    console.error('错误信息:', error.message)
    console.error('错误堆栈:', error.stack)
    
    if (error.name === 'ZodError') {
      console.error('验证错误详情:', JSON.stringify(error.errors))
      return errorResponse(error.errors[0]?.message || '参数验证失败', 400)
    }
    return errorResponse(error.message || '创建失败', 500)
  }
})