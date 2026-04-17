import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { insert, queryOne, update } from '~/server/utils/db'

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

  // 处理日期格式 - 将ISO格式转换为YYYY-MM-DD格式
  const dateObj = new Date(data.expense_date)
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const expenseDate = `${year}-${month}-${day}`

  // 插入记录 - 确保所有 undefined 转为 null
  const id = await insert(
    `INSERT INTO expenses (amount, expense_date, expense_time, category_id, member_id, description, remarks, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.amount,
      expenseDate,
      toNull(data.expense_time),
      data.category_id,
      toNull(data.member_id),
      toNull(data.description),
      toNull(data.remarks),
      user.id
    ]
  )
  
  // 检查分类是否属于人情分类
  let category = null
  try {
    category = await queryOne<{ name: string; parent_id: number | null }>(
      `SELECT c.name, c.parent_id 
       FROM categories c 
       WHERE c.id = ?`,
      [data.category_id]
    )
  } catch (dbError: any) {
    console.error('查询分类失败:', dbError)
    // 分类查询失败不影响主要功能，继续创建消费记录
  }
  
  let gift = null
  
  // 如果分类属于人情分类，自动创建人情记录（仅限出礼）
  if (category) {
    try {
      // 查找父级分类
      let parentCategory = null
      if (category.parent_id) {
        parentCategory = await queryOne<{ name: string }>(
          `SELECT name FROM categories WHERE id = ?`,
          [category.parent_id]
        )
      }

      // 检查是否为出礼分类
      const isOutgoingCategory = parentCategory?.name === '出礼' || category.name === '出礼'

      // 只有选择了出礼分类时才自动创建人情记录
      if (isOutgoingCategory) {
        const occasion = category.name || '其他'

        // 获取关联人名称（如果选择了成员）
        let relatedPerson = ''
        if (data.member_id) {
          try {
            const member = await queryOne<{ name: string }>(
              `SELECT name FROM members WHERE id = ?`,
              [data.member_id]
            )
            if (member) {
              relatedPerson = member.name
            }
          } catch (memberError: any) {
            console.error('查询成员失败:', memberError)
          }
        }

        // 创建人情记录
        const giftId = await insert(
          `INSERT INTO gifts (
            expense_id, gift_type, payment_type, amount,
            related_person, occasion, expense_date, expense_time,
            remarks, is_returned, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            'outgoing',
            'cash',
            data.amount,
            relatedPerson,  // 关联人：如果选择了成员，自动填入成员名称
            occasion,
            expenseDate,  // 使用转换后的日期格式
            toNull(data.expense_time),
            toNull(data.description),
            0,
            user.id
          ]
        )

        // 更新expense表的is_gift和gift_id字段
        await update(
          `UPDATE expenses SET is_gift = 1, gift_id = ? WHERE id = ?`,
          [giftId, id]
        )

        // 查询创建的人情记录
        gift = await queryOne(
          `SELECT * FROM gifts WHERE id = ?`,
          [giftId]
        )
      }
    } catch (giftError: any) {
      console.error('创建人情记录失败:', giftError)
      // 人情记录创建失败不影响主要功能，消费记录已经创建成功
    }
  }
  
  const response: any = {
    id,
    ...data,
  }
  
  // 如果创建了人情记录，添加到响应中
  if (gift) {
    response.gift = gift
  }
  
  return successResponse(response, '创建成功')
})
