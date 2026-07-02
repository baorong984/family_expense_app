/**
 * CORS 跨域中间件
 * 允许 Capacitor WebView 等客户端跨域访问 API
 */
export default defineEventHandler((event) => {
  const origin = getHeader(event, 'origin') || ''
  const allowed_origins = [
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:5173',
    'capacitor://localhost',
    'ionic://localhost',
    'http://your_server_ip:3000',
  ]

  // 匹配到白名单则返回具体 origin，否则返回 *（允许所有）
  let allow_origin = '*'
  if (allowed_origins.includes(origin)) {
    allow_origin = origin
  }

  setResponseHeader(event, 'Access-Control-Allow-Origin', allow_origin)
  setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
  setResponseHeader(event, 'Access-Control-Max-Age', '86400')

  // 处理预检请求
  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})
