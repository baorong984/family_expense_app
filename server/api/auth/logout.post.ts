import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  // JWT是无状态的，服务端不需要维护会话
  // 客户端删除token即可
  return successResponse(null, '退出成功')
})