<template>
  <div class="mobile-nav">
    <div 
      v-for="item in navItems" 
      :key="item.path"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
      @click="navigateTo(item.path)"
    >
      <el-icon :size="22">
        <component :is="item.icon" />
      </el-icon>
      <span class="label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit, List, DataAnalysis, Wallet, User } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const navItems = computed(() => {
  const items = [
    { path: '/expense/create', icon: Edit, label: '记账' },
    { path: '/expense/history', icon: List, label: '记录' },
    { path: '/statistics', icon: DataAnalysis, label: '统计' },
  ]
  
  if (userStore.isAdmin) {
    items.push({ path: '/budget', icon: Wallet, label: '预算' })
    items.push({ path: '/member', icon: User, label: '成员' })
  }
  
  return items
})

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style lang="scss" scoped>
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: $bottom-nav-height;
  background: $bg-white;
  border-top: 1px solid $border-color;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: $safe-area-inset-bottom;
  z-index: $z-fixed;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: all $transition-fast;
  border-radius: $border-radius;
  min-width: 64px;
  
  .el-icon {
    color: $text-muted;
    transition: color $transition-fast;
  }
  
  .label {
    font-size: 11px;
    margin-top: 2px;
    color: $text-muted;
    transition: color $transition-fast;
  }
  
  &.active {
    .el-icon {
      color: $primary;
    }
    
    .label {
      color: $primary;
      font-weight: 600;
    }
  }
  
  &:active {
    background: $bg-light;
  }
}
</style>