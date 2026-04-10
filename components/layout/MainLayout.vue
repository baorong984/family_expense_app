<template>
  <div class="main-layout">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="orbit orbit-1"></div>
      <div class="orbit orbit-2"></div>
      <div class="orbit orbit-3"></div>
    </div>
    
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
  background: $bg-deep;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: $gradient-mesh;
    pointer-events: none;
    z-index: 0;
  }
}

// 背景装饰
.background-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  
  .orbit {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(0, 240, 255, 0.1);
    animation: orbitRotate 30s linear infinite;
  }
  
  .orbit-1 {
    width: 600px;
    height: 600px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  
  .orbit-2 {
    width: 800px;
    height: 800px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation-duration: 40s;
    animation-direction: reverse;
  }
  
  .orbit-3 {
    width: 1000px;
    height: 1000px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation-duration: 50s;
  }
}

@keyframes orbitRotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
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
    animation: fadeInUp 0.5s ease-out;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
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
  
  .background-decoration {
    .orbit {
      opacity: 0.5;
    }
  }
}
</style>
