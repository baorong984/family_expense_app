<template>
  <div class="header ac-header">
    <div class="left">
      <el-icon class="collapse-btn ac-collapse" @click="toggleCollapse">
        <Fold v-if="!isCollapsed" />
        <Expand v-else />
      </el-icon>
      <div class="title-container">
        <div class="ac-logo-badge">
          <span class="ac-leaf-icon">🍃</span>
          <span class="title">岛屿生活记账</span>
          <span class="ac-subtitle">Nook Ledger</span>
        </div>
      </div>
    </div>
    
    <div class="right">
      <!-- 铃钱标识 -->
      <div class="ac-bell-badge hide-mobile">
        <span class="bell-icon">🔔</span>
        <span>Bell Ledger</span>
      </div>

      <!-- 主题切换 -->
      <div class="theme-toggle ac-theme-btn" @click="toggleDark()" title="切换昼夜模式">
        <span class="toggle-emoji">{{ isDark ? '🌙' : '☀️' }}</span>
      </div>

      <!-- 时间显示 -->
      <div class="time-display ac-time-box" :class="{ 'hide-mobile': isMobile }">
        <div class="time">{{ currentTime }}</div>
        <div class="date">📅 {{ currentDate }}</div>
      </div>
      
      <!-- 用户菜单 -->
      <el-dropdown @command="handleCommand">
        <span class="user-info ac-user-card">
          <el-avatar :size="36" class="avatar ac-avatar">
            {{ userStore.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <div class="user-details" :class="{ 'hide-mobile': isMobile }">
            <span class="username">{{ userStore.username }}</span>
            <span class="user-role">🏝️ {{ userStore.isAdmin ? '岛长' : '居民' }}</span>
          </div>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown ac-dropdown">
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
.header.ac-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: $header-height;
  padding: 0 $spacing-xl;
  background: var(--ac-bg-bar, #FAF8ED);
  border-bottom: 3px solid var(--ac-border, #E8DFCC);
  position: relative;
  z-index: 20;
  box-shadow: 0 4px 0 var(--ac-shadow);
  transition: background $transition-base, border-color $transition-base;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    right: 0;
    height: 3px;
    background: #59C990;
    opacity: 0.8;
  }
}

.left {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  
  .ac-collapse {
    font-size: 22px;
    cursor: pointer;
    color: var(--ac-text-primary, #7B5E43);
    transition: all $transition-base;
    padding: 8px;
    border-radius: 14px;
    background: var(--ac-bg-card, #FFF9E6);
    border: 2px solid var(--ac-border, #E8DFCC);
    
    &:hover {
      color: #3B9264;
      background: rgba(89, 201, 144, 0.15);
      border-color: #59C990;
      transform: scale(1.08) rotate(-4deg);
    }
  }
  
  .title-container {
    display: flex;
    align-items: center;

    .ac-logo-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--ac-bg-card, #FFFFFF);
      border: 2.5px solid #59C990;
      border-radius: 20px;
      padding: 4px 14px;
      box-shadow: 0 3px 0 var(--ac-shadow);

      .ac-leaf-icon {
        font-size: 20px;
        animation: leafBounce 3s infinite ease-in-out;
      }

      .title {
        font-family: $font-display;
        font-size: 17px;
        font-weight: 800;
        color: var(--ac-text-primary, #5D4037);
        letter-spacing: 0.5px;
      }

      .ac-subtitle {
        font-size: 11px;
        font-weight: 700;
        background: #FFE066;
        color: #5D4037;
        padding: 2px 8px;
        border-radius: 10px;
        border: 1px solid #F8C843;
      }
    }
  }
}

@keyframes leafBounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(10deg); }
}

.right {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.ac-theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--ac-bg-card, #FFF9D2);
  border: 2px solid #F8C843;
  cursor: pointer;
  transition: all $transition-base;
  box-shadow: 0 3px 0 rgba(248, 200, 67, 0.4);
  
  &:hover {
    transform: scale(1.1) rotate(15deg);
  }

  .toggle-emoji {
    font-size: 18px;
  }
}

// 时间显示
.ac-time-box {
  text-align: right;
  font-family: $font-display;
  padding: 4px 14px;
  background: var(--ac-bg-card, #FFFFFF);
  border: 2px solid var(--ac-border, #E8DFCC);
  border-radius: 16px;
  box-shadow: 0 3px 0 var(--ac-shadow);
  
  .time {
    font-size: 14px;
    font-weight: 800;
    color: #59C990;
  }
  
  .date {
    font-size: 11px;
    color: var(--ac-text-secondary, #7B5E43);
    font-weight: 600;
  }
}

// 用户信息
.ac-user-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: 4px 14px;
  background: var(--ac-bg-card, #FFFFFF);
  border: 2.5px solid var(--ac-border, #E8DFCC);
  border-radius: 20px;
  cursor: pointer;
  transition: all $transition-base;
  box-shadow: 0 3px 0 var(--ac-shadow);
  
  &:hover {
    border-color: #59C990;
    transform: translateY(-2px);
    box-shadow: 0 5px 0 rgba(89, 201, 144, 0.25);
  }
  
  .ac-avatar {
    background: #59C990;
    color: white;
    font-weight: 800;
    font-size: 16px;
    border: 2px solid #3B9264;
  }
  
  .user-details {
    display: flex;
    flex-direction: column;
    
    .username {
      font-weight: 800;
      color: var(--ac-text-primary, #5D4037);
      font-size: 13px;
      font-family: $font-display;
    }
    
    .user-role {
      font-size: 11px;
      color: #59C990;
      font-weight: 700;
    }
  }
  
  .dropdown-icon {
    color: var(--ac-text-secondary, #7B5E43);
    transition: transform $transition-base;
    font-size: 12px;
  }
  
  &:hover .dropdown-icon {
    transform: rotate(180deg);
    color: #59C990;
  }
}

// 下拉菜单
:deep(.ac-dropdown) {
  background: var(--ac-bg-bar, #FAF8ED) !important;
  border: 2.5px solid var(--ac-border-wood, #7B5E43) !important;
  border-radius: 20px;
  box-shadow: 0 8px 0 var(--ac-shadow);
  padding: 6px;
  
  .el-dropdown-menu__item {
    color: var(--ac-text-primary, #5D4037) !important;
    border-radius: 14px;
    padding: 8px 16px;
    transition: all $transition-base;
    font-weight: 700;
    font-family: $font-display;
    
    &:hover {
      background: #59C990 !important;
      color: #FFFFFF !important;
    }
    
    .el-icon {
      margin-right: 8px;
      font-size: 16px;
    }
    
    .danger {
      color: #FF7675;
    }
  }
}

// 移动端适配
@media (max-width: $breakpoint-sm) {
  .header.ac-header {
    height: $header-height-mobile;
    padding: 0 $spacing-mobile-md;
  }
  
  .left {
    gap: $spacing-sm;
    
    .ac-logo-badge {
      padding: 2px 8px;
      .title {
        font-size: 14px;
      }
      .ac-subtitle {
        display: none;
      }
    }
  }
  
  .right {
    gap: $spacing-xs;
  }
  
  .ac-user-card {
    padding: 2px 6px;
    
    .ac-avatar {
      width: 30px !important;
      height: 30px !important;
      font-size: 12px;
    }
  }
}
</style>