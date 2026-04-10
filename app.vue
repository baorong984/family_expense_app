<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// 全局初始化
const userStore = useUserStore()

// 应用启动时验证 token 是否有效
onMounted(async () => {
  // 从 localStorage 恢复用户状态
  userStore.restoreFromStorage()

  // 如果有 token，验证是否有效
  if (userStore.token) {
    await userStore.fetchUser()
  }
})
</script>