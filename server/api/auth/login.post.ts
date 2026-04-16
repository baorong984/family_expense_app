import { z } from 'zod'
import type { User, Member } from '~/types'
import { hashPassword, comparePassword, generateToken } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 验证输入
  const result = loginSchema.safeParse(body)
  if (!result.success) {
    return errorResponse(result.error.errors[0].message, 400)
  }

  const { username, password } = result.data

  // 先查询用户表
  const user = await queryOne<User>(
    'SELECT * FROM users WHERE username = ? AND status = 1',
    [username]
  )

  if (user) {
    // 验证用户密码
    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return errorResponse('用户名或密码错误', 401)
    }

    // 生成Token
    const token = generateToken(user)

    return successResponse({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
      },
    }, '登录成功')
  }

  // 如果用户表没有找到，查询成员表
  const member = await queryOne<Member>(
    'SELECT * FROM members WHERE name = ? AND password IS NOT NULL',
    [username]
  )

  if (!member) {
    return errorResponse('用户名或密码错误', 401)
  }

  // 验证成员密码
  const isValid = await comparePassword(password, member.password || '')
  if (!isValid) {
    return errorResponse('用户名或密码错误', 401)
  }

  // 生成Token（使用创建该成员的用户ID，但包含成员ID）
  const token = generateToken({
    id: member.created_by,
    username: member.name,
    is_admin: 0,
    member_id: member.id,  // 添加成员ID到token
  })

  return successResponse({
    token,
    user: {
      id: member.created_by,  // 使用创建者的ID，确保外键约束正确
      username: member.name,
      email: null,
      is_admin: 0,
      member_id: member.id,  // 返回成员ID供前端使用
    },
  }, '登录成功')
})
