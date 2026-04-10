import { requireAuth } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'
import { query } from '~/server/utils/db'
import type { Member } from '~/types'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const members = await query<Member>(
    `SELECT m.*, COUNT(e.id) as expense_count
     FROM members m
     LEFT JOIN expenses e ON m.id = e.member_id
     GROUP BY m.id
     ORDER BY m.id`,
    []
  )
  
  return successResponse({ members })
})
