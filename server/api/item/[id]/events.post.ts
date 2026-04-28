import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { queryOne, insert } from '~/server/utils/db'

const schema = z.object({
  event_type: z.enum(['purchase', 'start_use', 'repair', 'accessory', 'idle', 'retire', 'note']),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().max(100).optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  images: z.array(z.string()).optional(),
})

/**
 * 添加物品事件
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const itemId = parseInt(event.context.params?.id || '0')
  if (!itemId) {
    return errorResponse('物品ID无效', 400)
  }

  const existing = await queryOne<any>(
    'SELECT id, name FROM items WHERE id = ? AND user_id = ?',
    [itemId, user.id]
  )
  if (!existing) {
    return errorResponse('物品不存在', 404)
  }

  const body = await readBody(event)
  const result = schema.safeParse(body)

  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }

  const data = result.data

  const insertId = await insert(
    `INSERT INTO item_events (item_id, event_type, event_date, title, description, amount, images)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      itemId,
      data.event_type,
      data.event_date,
      data.title || `${existing.name} - ${getEventTypeName(data.event_type)}`,
      data.description || null,
      data.amount || null,
      data.images ? JSON.stringify(data.images) : null,
    ]
  )

  return successResponse({ id: insertId }, '事件添加成功')
})

/**
 * 获取事件类型名称
 */
function getEventTypeName(type: string): string {
  const names: Record<string, string> = {
    purchase: '购入',
    start_use: '开始使用',
    repair: '维修',
    accessory: '配件',
    idle: '闲置',
    retire: '退役',
    note: '备注',
  }
  return names[type] || type
}
