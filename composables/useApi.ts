import { ElMessage } from 'element-plus'

// 全局维护进行中的请求
const pendingRequests = new Map<string, AbortController>()

export const useApi = () => {
  const userStore = useUserStore()

  const request = async <T = any>(
    url: string,
    options: any = {}
  ): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // 添加 token
    if (userStore.token) {
      headers.Authorization = `Bearer ${userStore.token}`
    }

    const reqMethod = options.method || 'GET'
    // 生成请求的唯一标识 (基于方法、URL和参数)
    const reqKey = `${reqMethod}:${url}?${JSON.stringify(options.params || options.body || {})}`
    
    if (pendingRequests.has(reqKey)) {
      if (reqMethod === 'GET') {
        // 对于重复的 GET 请求，取消上一个未完成的请求
        pendingRequests.get(reqKey)?.abort('Duplicate GET request cancelled')
        pendingRequests.delete(reqKey)
      } else {
        // 对于 POST/PUT 等写操作，拒绝新的重复请求以防脏数据
        return Promise.reject(new Error('请求处理中，请勿重复提交'))
      }
    }

    const controller = new AbortController()
    options.signal = controller.signal
    pendingRequests.set(reqKey, controller)

    try {
      const response = await $fetch(url, {
        ...options,
        headers,
        onResponseError(context) {
          if (context.response.status === 401) {
            userStore.token = ''
            userStore.user = null
            userStore.clearStorage()
            
            if (process.client) {
              ElMessage.error('登录已过期，请重新登录')
              navigateTo('/login', { replace: true })
            }
          }
          if (options.onResponseError) {
            options.onResponseError(context)
          }
        }
      })
      
      pendingRequests.delete(reqKey)
      return response as T
    } catch (error: any) {
      pendingRequests.delete(reqKey)
      // 如果是被取消的请求，静默处理
      if (error.name === 'AbortError' || error.message === 'Duplicate GET request cancelled') {
        console.warn('Request cancelled:', reqKey)
        return Promise.reject(error)
      }
      throw error
    }
  }

  return {
    get: <T = any>(url: string, options?: any) => request<T>(url, { ...options, method: 'GET' }),
    post: <T = any>(url: string, body?: any, options?: any) => request<T>(url, { ...options, method: 'POST', body }),
    put: <T = any>(url: string, body?: any, options?: any) => request<T>(url, { ...options, method: 'PUT', body }),
    delete: <T = any>(url: string, options?: any) => request<T>(url, { ...options, method: 'DELETE' }),
  }
}