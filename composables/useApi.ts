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

    const response = await $fetch(url, {
      ...options,
      headers,
    })

    return response as T
  }

  return {
    get: <T = any>(url: string, options?: any) => request<T>(url, { ...options, method: 'GET' }),
    post: <T = any>(url: string, body?: any, options?: any) => request<T>(url, { ...options, method: 'POST', body }),
    put: <T = any>(url: string, body?: any, options?: any) => request<T>(url, { ...options, method: 'PUT', body }),
    delete: <T = any>(url: string, options?: any) => request<T>(url, { ...options, method: 'DELETE' }),
  }
}