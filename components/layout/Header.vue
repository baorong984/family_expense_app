<template>
  <div class="header">
    <div class="left">
      <el-icon class="collapse-btn" @click="toggleCollapse">
        <Fold v-if="!isCollapsed" />
        <Expand v-else />
      </el-icon>
      <div class="title-container">
        <span class="title">家庭消费记账</span>
      </div>
    </div>
    
    <div class="right">
      <!-- 主题切换 -->
      <div class="theme-toggle" @click="toggleDark()">
        <el-icon class="toggle-icon">
          <Moon v-if="!isDark" />
          <Sunny v-else />
        </el-icon>
      </div>

      <!-- 时间显示 -->
      <div class="time-display" :class="{ 'hide-mobile': isMobile }">
        <div class="time">{{ currentTime }}</div>
        <div class="date">{{ currentDate }}</div>
      </div>
      
      <!-- 用户菜单 -->
      <el-dropdown @command="handleCommand">
        <span class="user-info">
          <el-avatar :size="36" class="avatar">
            {{ userStore.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <div class="user-details" :class="{ 'hide-mobile': isMobile }">
            <span class="username">{{ userStore.username }}</span>
            <span class="user-role">{{ userStore.isAdmin ? '管理员' : '成员' }}</span>
          </div>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown">
            <el-dropdown-item command="password">
              <el-icon><Key /></el-icon>
              <span>修改密码</span>
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon><SwitchButton /></el-icon>
              <span class="danger">退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    
    <!-- 修改密码弹窗 -->
    <PasswordDialog v-model="passwordDialogVisible" />
  </div>
</template>

<script setup lang="ts">
import { Fold, Expand, ArrowDown, Key, SwitchButton, Moon, Sunny } from '@element-plus/icons-vue'
import { useDark, useToggle } from '@vueuse/core'
import PasswordDialog from './PasswordDialog.vue'

const isDark = useDark()
const toggleDark = useToggle(isDark)

const props = defineProps<{
  isCollapsed: boolean
  isMobile: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const userStore = useUserStore()
const router = useRouter()
const passwordDialogVisible = ref(false)

// 时间显示
const currentTime = ref('')
const currentDate = ref('')

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  currentDate.value = now.toLocaleDateString('zh-CN', { 
    month: 'short', 
    day: 'numeric',
    weekday: 'short'
  })
}

let timer: any = null

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const toggleCollapse = () => {
  emit('toggle')
}

const handleCommand = async (command: string) => {
  if (command === 'password') {
    passwordDialogVisible.value = true
  } else if (command === 'logout') {
    await userStore.logout()
    router.push('/login')
  }
}
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: $header-height;
  padding: 0 $spacing-xl;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  -webkit-backdrop-filter: $glass-blur;
  border-bottom: 1px solid $glass-border;
  position: relative;
  z-index: 20;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: $gradient-header;
    opacity: 0.8;
  }
}

.left {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
  
  .collapse-btn {
    font-size: 20px;
    cursor: pointer;
    color: $text-muted;
    transition: all $transition-base;
    padding: $spacing-sm;
    border-radius: $border-radius;
    
    &:hover {
      color: $primary;
      background: rgba($primary, 0.1);
    }
  }
  
  .title-container {
    display: flex;
    flex-direction: column;
    
    .title {
      font-family: $font-display;
      font-size: 19px;
      font-weight: 800;
      color: $text-primary;
      letter-spacing: 0.5px;
      background: linear-gradient(120deg, $text-primary 0%, $text-secondary 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
}

.right {
  display: flex;
  align-items: center;
  gap: $spacing-xl;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid $border-color;
  cursor: pointer;
  transition: all $transition-base;
  backdrop-filter: blur(4px);
  
  &:hover {
    background: $bg-white;
    border-color: $primary-light;
    transform: rotate(15deg) scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 240, 255, 0.2);
  }
  
  .toggle-icon {
    font-size: 18px;
    color: $text-secondary;
  }
}


// 时间显示
.time-display {
  text-align: right;
  font-family: $font-mono;
  padding: 6px $spacing-md;
  background: rgba($primary, 0.05);
  border: 1px solid rgba($primary, 0.08);
  border-radius: $border-radius;
  
  .time {
    font-size: 15px;
    font-weight: 700;
    color: $primary-dark;
  }
  
  .date {
    font-size: 11px;
    color: $text-muted;
    margin-top: 1px;
    font-weight: 500;
  }
}

// 用户信息
.user-info {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: all $transition-base;
  
  &:hover {
    border-color: $primary-light;
    box-shadow: $shadow-sm;
    background: $bg-white;
  }
  
  .avatar {
    background: $gradient-primary;
    color: white;
    font-weight: 800;
    font-size: 15px;
    box-shadow: 0 2px 8px rgba($primary, 0.2);
  }
  
  .user-details {
    display: flex;
    flex-direction: column;
    gap: 1px;
    
    .username {
      font-weight: 700;
      color: $text-primary;
      font-size: 13px;
    }
    
    .user-role {
      font-size: 11px;
      color: $primary-dark;
      font-weight: 600;
    }
  }
  
  .dropdown-icon {
    color: $text-muted;
    transition: transform $transition-base;
    font-size: 12px;
  }
  
  &:hover .dropdown-icon {
    transform: rotate(180deg);
    color: $primary;
  }
}

// 下拉菜单
:deep(.user-dropdown) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;
  padding: $spacing-xs;
  
  .el-dropdown-menu__item {
    color: $text-secondary;
    border-radius: $border-radius;
    padding: $spacing-sm $spacing-md;
    transition: all $transition-base;
    font-weight: 500;
    
    &:hover {
      background: rgba($primary, 0.08);
      color: $primary-dark;
    }
    
    .el-icon {
      margin-right: $spacing-sm;
      font-size: 16px;
    }
    
    .danger {
      color: $danger;
    }
  }
}

// 移动端适配
@media (max-width: $breakpoint-sm) {
  .header {
    height: $header-height-mobile;
    padding: 0 $spacing-mobile-md;
  }
  
  .left {
    gap: $spacing-sm;
    
    .title-container .title {
      font-size: 16px;
    }
  }
  
  .right {
    gap: $spacing-sm;
  }
  
  .user-info {
    padding: 4px 8px;
    
    .avatar {
      width: 30px !important;
      height: 30px !important;
      font-size: 13px;
    }
  }
}
</style>