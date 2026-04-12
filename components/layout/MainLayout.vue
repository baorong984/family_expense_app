<template>
  <div class="main-layout">
    <Header :is-collapsed="isCollapsed" @toggle="toggleCollapse" />
    <div class="main-container">
      <Sidebar :is-collapsed="isCollapsed" />
      <main class="main-content">
        <div class="content-wrapper">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from './Header.vue'
import Sidebar from './Sidebar.vue'

const isCollapsed = ref(false)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 监听窗口大小变化，自动折叠侧边栏
const checkMobile = () => {
  if (typeof window !== 'undefined') {
    isCollapsed.value = window.innerWidth < 768
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg-page;
  position: relative;
  overflow: hidden;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.main-content {
  flex: 1;
  padding: $spacing-xl;
  overflow-y: auto;
  overflow-x: hidden;
  
  .content-wrapper {
    max-width: 1400px;
    margin: 0 auto;
    animation: fadeInUp 0.4s ease-out;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: $breakpoint-sm) {
  .main-content {
    padding: $spacing-md;
  }
}
</style>