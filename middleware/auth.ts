export default defineNuxtRouteMiddleware((to) => {
  // 只在客户端执行认证逻辑
  if (process.server) return

  const userStore = useUserStore()

  // 从 localStorage 恢复用户状态
  userStore.restoreFromStorage()

  // 如果已登录且访问登录页，重定向到记账页
  if (userStore.isLoggedIn && to.path === '/login') {
    return navigateTo('/expense/create')
  }

  // 如果未登录且访问非登录页，重定向到登录页
  if (!userStore.isLoggedIn && to.path !== '/login') {
    return navigateTo('/login?redirect=' + to.fullPath)
  }
})
