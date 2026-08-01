<template>
  <div class="login-container ac-login-container">
    <!-- 背景装饰叶子浮动 -->
    <div class="background-decoration">
      <div class="leaf leaf-1">🍃</div>
      <div class="leaf leaf-2">🍃</div>
      <div class="leaf leaf-3">🍃</div>
    </div>
    
    <!-- 动森风格登录卡片 -->
    <div class="login-card ac-login-card">
      <div class="login-header">
        <div class="logo-container">
          <span class="logo-icon">🍃</span>
        </div>
        
        <!-- 动森对话框标语 -->
        <div class="ac-speech-bubble welcome-bubble">
          <span>欢迎来到 狸克岛屿记账服务台！请验证您的居民凭证。</span>
        </div>
      </div>
      
      <el-form ref="formRef" :model="form" :rules="rules" class="login-form ac-login-form" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入居民姓名 / 用户名"
            size="large"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入登岛密码"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <button
            type="submit"
            :disabled="loading"
            class="ac-btn ac-btn--yellow ac-login-btn"
            @click="handleLogin"
          >
            <span>🏝️ 登岛登录 (Check-in)</span>
          </button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

definePageMeta({
  layout: false,
  middleware: ['auth'],
})

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
}

const handleLogin = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  
  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    ElMessage.success('登岛验证成功！欢迎回来。')
    
    // 跳转到目标页面或首页
    const redirect = route.query.redirect as string || '/expense/create'
    router.push(redirect)
  } catch (error: any) {
    ElMessage.error(error.message || '登岛验证失败')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container.ac-login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--ac-bg-page, #F6F5E8);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(rgba(89, 201, 144, 0.15) 2.5px, transparent 2.5px),
      radial-gradient(rgba(255, 224, 102, 0.15) 2.5px, transparent 2.5px);
    background-size: 40px 40px;
    background-position: 0 0, 20px 20px;
    pointer-events: none;
    z-index: 0;
  }
}

// 浮动叶子动画
.background-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  
  .leaf {
    position: absolute;
    font-size: 36px;
    opacity: 0.7;
  }
  
  .leaf-1 {
    top: 10%;
    right: 15%;
    animation: floatLeaf 8s ease-in-out infinite;
  }
  
  .leaf-2 {
    bottom: 12%;
    left: 10%;
    animation: floatLeaf 10s ease-in-out infinite 2s;
  }
  
  .leaf-3 {
    top: 50%;
    left: 80%;
    animation: floatLeaf 7s ease-in-out infinite 4s;
  }
}

@keyframes floatLeaf {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(15deg); }
}

// 动森纸张登录卡片
.login-card.ac-login-card {
  width: 440px;
  padding: $spacing-2xl;
  background: var(--ac-bg-bar, #FAF8ED);
  border: 3.5px solid var(--ac-border-wood, #7B5E43);
  border-radius: 32px;
  box-shadow: 0 12px 0 var(--ac-shadow);
  position: relative;
  z-index: 1;
  animation: cardAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  &::before {
    content: '';
    position: absolute;
    top: -3.5px;
    left: 20px;
    right: 20px;
    height: 6px;
    background: #59C990;
    border-radius: 4px 4px 0 0;
  }
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// Logo & 对话气泡
.login-header {
  text-align: center;
  margin-bottom: $spacing-xl;
  
  .logo-container {
    margin-bottom: 12px;
    
    .logo-icon {
      font-size: 54px;
      display: inline-block;
      animation: leafSpin 4s ease-in-out infinite;
    }
  }
  
  @keyframes leafSpin {
    0%, 100% { transform: rotate(-8deg); }
    50% { transform: rotate(8deg); }
  }

  .welcome-bubble {
    font-size: 14px;
    margin-top: 10px;
    text-align: center;
    background: var(--ac-bg-card, #FFFFFF);
    border: 2.5px solid var(--ac-border-wood, #7B5E43);
    color: var(--ac-text-primary, #5D4037);

    &::after {
      border-color: var(--ac-bg-card, #FFFFFF) transparent transparent transparent;
    }
  }
}

// 表单
.login-form.ac-login-form {
  .el-form-item {
    margin-bottom: $spacing-lg;
  }
  
  :deep(.el-input__wrapper) {
    padding: 10px 16px;
    border-radius: 18px;
    background: var(--ac-input-bg, #FFFFFF) !important;
    border: 2px solid var(--ac-border, #E8DFCC) !important;
    box-shadow: 0 3px 0 var(--ac-shadow) !important;
    
    &:hover {
      border-color: #59C990 !important;
    }
    
    &.is-focus {
      border-color: #59C990 !important;
      box-shadow: 0 0 0 3px rgba(89, 201, 144, 0.2) !important;
    }
  }
  
  :deep(.el-input__prefix) {
    .el-icon {
      color: var(--ac-text-secondary, #7B5E43);
      font-size: 19px;
    }
  }
  
  .ac-login-btn {
    width: 100%;
    height: 50px;
    font-size: 16px;
    margin-top: $spacing-md;
  }
}

@media (max-width: $breakpoint-sm) {
  .login-card.ac-login-card {
    width: 92%;
    padding: $spacing-lg;
  }
}
</style>