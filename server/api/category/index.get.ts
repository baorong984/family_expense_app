import { requireAuth } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'
import { query } from '~/server/utils/db'
import { buildTree } from '~/server/utils/response'
import type { Category } from '~/types'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const queryParams = getQuery(event)
  const parentId = queryParams.parent_id ? parseInt(queryParams.parent_id as string) : undefined
  const isSystem = queryParams.is_system !== undefined ? parseInt(queryParams.is_system as string) : undefined
  
  // 构建查询条件
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
  
  if (isSystem !== undefined) {
    whereClause += ' AND is_system = ?'
    params.push(isSystem)
  }
  
  const categories = await query<Category>(
    `SELECT * FROM categories ${whereClause} ORDER BY sort_order, id`,
    params
  )
  
  // 如果没有指定parent_id，返回树形结构
  if (parentId === undefined && isSystem === undefined) {
    const tree = buildTree(categories)
    return successResponse({ categories: tree })
  }
  
  return successResponse({ categories })
})
