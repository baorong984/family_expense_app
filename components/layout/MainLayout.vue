<template>
  <div class="main-layout" :class="{ 'is-mobile': isMobile }">
    <Header 
      :is-collapsed="isCollapsed" 
      :is-mobile="isMobile"
      @toggle="toggleCollapse" 
    />
    <div class="main-container">
      <!-- 桌面端侧边栏 -->
      <Sidebar 
        v-show="!isMobile"
        :is-collapsed="isCollapsed" 
      />
      <!-- 移动端底部导航 -->
      <MobileNav v-show="isMobile" />
      <main class="main-content">
        <div class="content-wrapper">
          <slot />
        </div>
      </main>
    </div>
    
    <!-- 移动端侧边栏抽屉 -->
    <el-drawer
      v-if="isMobile"
      v-model="drawerVisible"
      direction="ltr"
      :with-header="false"
      size="280px"
      class="mobile-drawer"
    >
      <div class="drawer-sidebar-wrapper">
        <Sidebar :is-collapsed="false" :is-mobile="true" @select="closeDrawer" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import Header from './Header.vue'
import Sidebar from './Sidebar.vue'
import MobileNav from './MobileNav.vue'

const isCollapsed = ref(false)
const isMobile = ref(false)
const drawerVisible = ref(false)

const toggleCollapse = () => {
  if (isMobile.value) {
    drawerVisible.value = !drawerVisible.value
  } else {
    isCollapsed.value = !isCollapsed.value
  }
}

const closeDrawer = () => {
  drawerVisible.value = false
}

// 监听窗口大小变化
const checkMobile = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 768
    if (isMobile.value) {
      isCollapsed.value = true
    }
  }
}

// 提供移动端状态给子组件
provide('isMobile', isMobile)

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

// 移动端样式
.main-layout.is-mobile {
  .main-container {
    flex-direction: column;
  }
  
  .main-content {
    padding: $spacing-mobile-sm;
    padding-bottom: calc(#{$bottom-nav-height} + #{$safe-area-inset-bottom} + #{$spacing-mobile-sm});
    
    .content-wrapper {
      max-width: 100%;
    }
  }
}

// 平板端样式
@media (min-width: 768px) and (max-width: 1023px) {
  .main-content {
    padding: $spacing-lg;
  }
}

// 桌面端保持原样
@media (min-width: 1024px) {
  .main-content {
    padding: $spacing-xl;
  }
}
</style>

<style lang="scss">
// 移动端抽屉样式（全局）
.mobile-drawer {
  .el-drawer__body {
    padding: 0;
    background: $bg-white;
  }
  
  .drawer-sidebar-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}
</style>