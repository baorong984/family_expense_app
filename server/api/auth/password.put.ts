import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { hashPassword, comparePassword } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'
import { update } from '~/server/utils/db'

const schema = z.object({
  old_password: z.string().min(1, '旧密码不能为空'),
  new_password: z.string().min(8, '新密码至少8个字符').regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, '密码必须包含字母和数字'),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  
  const result = schema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }
  
  const { old_password, new_password } = result.data
  
  const isValid = await comparePassword(old_password, user.password)
  if (!isValid) {
    return errorResponse('旧密码错误', 400)
  }
  
  const hashedPassword = await hashPassword(new_password)
  
  await update(
    'UPDATE users SET password = ? WHERE id = ?',
    [hashedPassword, user.id]
  )
  
  return successResponse(null, '密码修改成功')
})