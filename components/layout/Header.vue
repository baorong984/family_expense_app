<template>
  <div class="header">
    <!-- 科技感装饰线 -->
    <div class="header-decoration">
      <div class="line line-1"></div>
      <div class="line line-2"></div>
      <div class="line line-3"></div>
    </div>
    
    <div class="left">
      <el-icon class="collapse-btn" @click="toggleCollapse">
        <Fold v-if="!isCollapsed" />
        <Expand v-else />
      </el-icon>
      <div class="title-container">
        <span class="title">家庭消费记账</span>
        <span class="subtitle">SYSTEM</span>
      </div>
    </div>
    
    <div class="right">
      <!-- 时间显示 -->
      <div class="time-display">
        <div class="time">{{ currentTime }}</div>
        <div class="date">{{ currentDate }}</div>
      </div>
      
      <!-- 用户菜单 -->
      <el-dropdown @command="handleCommand">
        <span class="user-info">
          <el-avatar :size="40" class="avatar">
            {{ userStore.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <div class="user-details">
            <span class="username">{{ userStore.username }}</span>
            <span class="user-role">{{ userStore.isAdmin ? 'ADMIN' : 'MEMBER' }}</span>
          </div>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown">
            <el-dropdown-item command="password">
              <el-icon class="menu-icon"><Key /></el-icon>
              <span class="menu-text">修改密码</span>
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon class="menu-icon danger"><SwitchButton /></el-icon>
              <span class="menu-text danger">退出登录</span>
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
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  -webkit-backdrop-filter: $glass-blur;
  border-bottom: 1px solid $border-color;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: $gradient-primary;
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
  }
}

// 科技感装饰线
.header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  
  .line {
    position: absolute;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(0, 240, 255, 0.3), 
      transparent);
    height: 1px;
  }
  
  .line-1 {
    top: 20%;
    left: -100%;
    width: 200px;
    animation: scanLine 8s linear infinite;
  }
  
  .line-2 {
    top: 60%;
    left: -100%;
    width: 150px;
    animation: scanLine 12s linear infinite;
    animation-delay: 2s;
  }
  
  .line-3 {
    top: 80%;
    left: -100%;
    width: 180px;
    animation: scanLine 10s linear infinite;
    animation-delay: 4s;
  }
}

@keyframes scanLine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.left {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
  position: relative;
  z-index: 1;
  
  .collapse-btn {
    font-size: 24px;
    cursor: pointer;
    color: $text-secondary;
    transition: all $transition-base;
    
    &:hover {
      color: $neon-blue;
      box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
    }
  }
  
  .title-container {
    display: flex;
    flex-direction: column;
    
    .title {
      font-family: $font-display;
      font-size: 20px;
      font-weight: 700;
      color: $text-neon;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    
    .subtitle {
      font-family: $font-mono;
      font-size: 10px;
      color: $text-muted;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
  }
}

.right {
  display: flex;
  align-items: center;
  gap: $spacing-xl;
  position: relative;
  z-index: 1;
}

// 时间显示
.time-display {
  text-align: right;
  font-family: $font-mono;
  
  .time {
    font-size: 18px;
    font-weight: 700;
    color: $text-neon;
    text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
  }
  
  .date {
    font-size: 11px;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
}

// 用户信息
.user-info {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: rgba(0, 240, 255, 0.05);
  border: 1px solid $border-color;
  border-radius: $border-radius;
  cursor: pointer;
  transition: all $transition-base;
  
  &:hover {
    border-color: $neon-blue;
    box-shadow: $shadow-neon;
    background: rgba(0, 240, 255, 0.1);
  }
  
  .avatar {
    background: $gradient-primary;
    color: $bg-deep;
    font-weight: 700;
    font-size: 18px;
    box-shadow: $shadow-neon;
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
      font-family: $font-mono;
      font-size: 10px;
      color: $neon-cyan;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  }
  
  .dropdown-icon {
    color: $text-secondary;
    transition: transform $transition-base;
  }
  
  &:hover .dropdown-icon {
    transform: rotate(180deg);
    color: $neon-blue;
  }
}

// 下拉菜单
:deep(.user-dropdown) {
  background: $bg-card;
  backdrop-filter: $glass-blur;
  border: 1px solid $border-color;
  box-shadow: $shadow-card;
  
  .el-dropdown-menu__item {
    color: $text-secondary;
    transition: all $transition-base;
    
    &:hover {
      background: rgba(0, 240, 255, 0.1);
      color: $text-neon;
      
      .menu-icon {
        color: $neon-blue;
      }
    }
    
    .menu-icon {
      font-size: 18px;
      color: $text-secondary;
      margin-right: $spacing-md;
      
      &.danger {
        color: $neon-pink;
      }
    }
    
    .menu-text {
      font-weight: 500;
      
      &.danger {
        color: $neon-pink;
      }
    }
  }
}
</style>
