import { requireAuth } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'
import { query } from '~/server/utils/db'
import { buildTree } from '~/server/utils/response'

interface ItemCategory {
  id: number
  name: string
  icon: string | null
  parent_id: number | null
  sort_order: number
  created_at: string
}

/**
 * 获取物品分类列表
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const queryParams = getQuery(event)
  const parentId = queryParams.parent_id ? parseInt(queryParams.parent_id as string) : undefined

  let whereClause = 'WHERE 1=1'
  const params: any[] = []

  if (parentId !== undefined) {
    if (parentId === 0) {
      whereClause += ' AND parent_id IS NULL'
    } else {
      whereClause += ' AND parent_id = ?'
      params.push(parentId)
    }
  }

  const categories = await query<ItemCategory>(
    `SELECT * FROM item_categories ${whereClause} ORDER BY sort_order, id`,
    params
  )

  if (parentId === undefined) {
    const tree = buildTree(categories)
    return successResponse({ categories: tree })
  }

  return successResponse({ categories })
})
