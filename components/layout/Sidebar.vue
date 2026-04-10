<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <!-- Logo 区域 -->
    <div class="sidebar-logo">
      <transition name="logo-fade" mode="out-in">
        <div v-if="!isCollapsed" class="logo-text">
          <span class="logo-icon">⚡</span>
          <span class="logo-name">EXPENSE</span>
        </div>
        <div v-else class="logo-icon-only">⚡</div>
      </transition>
    </div>

    <!-- 菜单 -->
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapsed"
      router
      class="sidebar-menu"
    >
      <el-menu-item index="/expense/create">
        <el-icon class="menu-icon"><Edit /></el-icon>
        <template #title>
          <span class="menu-text">记账</span>
        </template>
      </el-menu-item>
      
      <el-menu-item index="/expense/history">
        <el-icon class="menu-icon"><List /></el-icon>
        <template #title>
          <span class="menu-text">消费记录</span>
        </template>
      </el-menu-item>
      
      <el-menu-item index="/statistics">
        <el-icon class="menu-icon"><DataAnalysis /></el-icon>
        <template #title>
          <span class="menu-text">统计分析</span>
        </template>
      </el-menu-item>
      
      <!-- 管理员菜单 -->
      <template v-if="userStore.isAdmin">
        <div class="menu-divider"></div>
        
        <el-menu-item index="/budget">
          <el-icon class="menu-icon"><Wallet /></el-icon>
          <template #title>
            <span class="menu-text">预算管理</span>
          </template>
        </el-menu-item>
        
        <el-menu-item index="/category">
          <el-icon class="menu-icon"><Grid /></el-icon>
          <template #title>
            <span class="menu-text">分类管理</span>
          </template>
        </el-menu-item>
        
        <el-menu-item index="/member">
          <el-icon class="menu-icon"><User /></el-icon>
          <template #title>
            <span class="menu-text">成员管理</span>
          </template>
        </el-menu-item>
      </template>
    </el-menu>

    <!-- 底部状态 -->
    <div class="sidebar-footer">
      <div class="system-status">
        <div class="status-indicator"></div>
        <span v-if="!isCollapsed" class="status-text">SYSTEM ONLINE</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit, List, DataAnalysis, Wallet, Grid, User } from '@element-plus/icons-vue'

defineProps<{
  isCollapsed: boolean
}>()

const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => {
  return route.path
})
</script>

<style lang="scss" scoped>
.sidebar {
  width: $sidebar-width;
  height: 100%;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  -webkit-backdrop-filter: $glass-blur;
  border-right: 1px solid $border-color;
  transition: width $transition-base;
  display: flex;
  flex-direction: column;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(180deg, 
      transparent 0%, 
      $neon-blue 50%, 
      transparent 100%);
    opacity: 0.5;
  }
  
  &.collapsed {
    width: $sidebar-collapsed-width;
  }
}

// Logo
.sidebar-logo {
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent, 
      $neon-blue, 
      transparent);
  }
}

.logo-text {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  
  .logo-icon {
    font-size: 28px;
    animation: glowPulse 2s infinite;
  }
  
  .logo-name {
    font-family: $font-display;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 3px;
    background: $gradient-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-transform: uppercase;
  }
}

.logo-icon-only {
  display: flex;
  justify-content: center;
  font-size: 28px;
  animation: glowPulse 2s infinite;
}

// 菜单
.sidebar-menu {
  flex: 1;
  border-right: none;
  background: transparent;
  padding: $spacing-md 0;
  overflow-y: auto;
  
  :deep(.el-menu-item) {
    color: $text-secondary;
    border-radius: $border-radius;
    margin: 4px 8px;
    transition: all $transition-base;
    
    .menu-icon {
      font-size: 20px;
    }
    
    .menu-text {
      font-family: $font-display;
      letter-spacing: 1px;
    }
    
    &:hover {
      color: $text-neon;
      background: rgba(0, 240, 255, 0.1);
      box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
      
      .menu-icon {
        animation: iconPulse 0.5s ease-in-out;
      }
    }
    
    &.is-active {
      color: $bg-deep;
      background: $gradient-primary;
      box-shadow: $shadow-neon;
      
      .menu-icon {
        animation: iconPulse 0.5s ease-in-out;
      }
    }
  }
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.menu-divider {
  height: 1px;
  background: linear-gradient(90deg, 
    transparent, 
    $border-color, 
    transparent);
  margin: $spacing-md $spacing-lg;
}

// 底部状态
.sidebar-footer {
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent, 
      $neon-blue, 
      transparent);
  }
}

.system-status {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  
  .status-indicator {
    width: 8px;
    height: 8px;
    background: $neon-green;
    border-radius: 50%;
    box-shadow: 0 0 10px $neon-green;
    animation: statusPulse 2s infinite;
  }
  
  .status-text {
    font-family: $font-mono;
    font-size: 10px;
    color: $text-secondary;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
}

@keyframes statusPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

// Logo 过渡动画
.logo-fade-enter-active,
.logo-fade-leave-active {
  transition: all $transition-base;
}

.logo-fade-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.logo-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
