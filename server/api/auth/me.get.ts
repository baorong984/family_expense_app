import { successResponse, errorResponse } from '~/server/utils/response'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  
  if (!user) {
    return errorResponse('未授权', 401)
  }
  
  return successResponse(user, '获取成功')
})