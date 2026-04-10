<template>
  <div></div>
</template>

<script setup lang="ts">
// 首页重定向到记账页
definePageMeta({
  middleware: ['auth'],
})

const router = useRouter()
onMounted(() => {
  router.replace('/expense/create')
})
</script>
