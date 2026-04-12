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
import { Fold, Expand, ArrowDown, Key, SwitchButton } from '@element-plus/icons-vue'
import PasswordDialog from './PasswordDialog.vue'

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

onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)
})

onUnmounted(() => {
  clearInterval(updateTime)
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
  background: $bg-white;
  border-bottom: 1px solid $border-color;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
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
      background: rgba(78, 205, 196, 0.1);
    }
  }
  
  .title-container {
    display: flex;
    flex-direction: column;
    
    .title {
      font-family: $font-display;
      font-size: 18px;
      font-weight: 700;
      color: $text-primary;
      letter-spacing: 0.5px;
    }
  }
}

.right {
  display: flex;
  align-items: center;
  gap: $spacing-xl;
}

// 时间显示
.time-display {
  text-align: right;
  font-family: $font-mono;
  padding: $spacing-sm $spacing-md;
  background: $bg-light;
  border-radius: $border-radius;
  
  .time {
    font-size: 16px;
    font-weight: 600;
    color: $primary;
  }
  
  .date {
    font-size: 11px;
    color: $text-muted;
    margin-top: 2px;
  }
}

// 用户信息
.user-info {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: $bg-light;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  cursor: pointer;
  transition: all $transition-base;
  
  &:hover {
    border-color: $primary;
    box-shadow: $shadow-sm;
    background: $bg-white;
  }
  
  .avatar {
    background: $gradient-primary;
    color: white;
    font-weight: 700;
    font-size: 16px;
  }
  
  .user-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    
    .username {
      font-weight: 600;
      color: $text-primary;
      font-size: 14px;
    }
    
    .user-role {
      font-size: 11px;
      color: $primary;
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
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  box-shadow: $shadow-lg;
  padding: $spacing-xs;
  
  .el-dropdown-menu__item {
    color: $text-secondary;
    border-radius: $border-radius;
    padding: $spacing-sm $spacing-md;
    transition: all $transition-base;
    
    &:hover {
      background: $bg-light;
      color: $text-primary;
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
    padding: $spacing-xs $spacing-sm;
    
    .avatar {
      :deep(.el-avatar) {
        width: 32px !important;
        height: 32px !important;
      }
    }
  }
}
</style>