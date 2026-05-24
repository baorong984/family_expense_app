<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
    
    <!-- 登录卡片 -->
    <div class="login-card">
      <div class="login-header">
        <div class="logo-container">
          <span class="logo-icon">🌿</span>
        </div>
        <h1 class="title">家庭财务管家</h1>
        <p class="description">AI智能记账 · 轻松管理家庭财务</p>
      </div>
      
      <el-form ref="formRef" :model="form" :rules="rules" class="login-form" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
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
            placeholder="请输入密码"
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
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            native-type="submit"
            @click="handleLogin"
          >
            登录
          </el-button>
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
    ElMessage.success('登录成功')
    
    // 跳转到目标页面或首页
    const redirect = route.query.redirect as string || '/expense/create'
    router.push(redirect)
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #F0FDF4 0%, #E0F2FE 50%, #F5F3FF 100%);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: radial-gradient(rgba(16, 185, 129, 0.12) 1.5px, transparent 1.5px);
    background-size: 32px 32px;
    pointer-events: none;
    z-index: 0;
  }
}

// 背景装饰 (Vibrant Glowing Spheres)
.background-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  
  .circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.65;
  }
  
  .circle-1 {
    width: 450px;
    height: 450px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(14, 165, 233, 0.1) 70%);
    top: -100px;
    right: -100px;
    animation: float1 18s ease-in-out infinite;
  }
  
  .circle-2 {
    width: 380px;
    height: 380px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(236, 72, 153, 0.08) 70%);
    bottom: -80px;
    left: -80px;
    animation: float2 22s ease-in-out infinite;
  }
  
  .circle-3 {
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, rgba(99, 102, 241, 0.05) 70%);
    top: 45%;
    left: 15%;
    animation: float3 16s ease-in-out infinite;
  }
}

@keyframes float1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-40px, 30px) scale(1.1); }
}

@keyframes float2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -40px) scale(1.05); }
}

@keyframes float3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, -30px) scale(1.15); }
}

// 登录卡片 (Layered Glassmorphism)
.login-card {
  width: 440px;
  padding: $spacing-2xl;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: $border-radius-xl;
  box-shadow: 
    0 10px 30px rgba(15, 23, 42, 0.04),
    0 20px 50px rgba(15, 23, 42, 0.06),
    inset 0 1px 1px rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
  animation: cardAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: $gradient-header;
    border-radius: $border-radius-xl $border-radius-xl 0 0;
  }
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Logo
.login-header {
  text-align: center;
  margin-bottom: $spacing-2xl;
  
  .logo-container {
    margin-bottom: $spacing-md;
    
    .logo-icon {
      font-size: 52px;
      display: inline-block;
      animation: bounce 2.5s ease-in-out infinite;
    }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0) rotate(0); }
    50% { transform: translateY(-8px) rotate(4deg); }
  }
  
  .title {
    font-family: $font-display;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #0F172A 0%, #334155 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 $spacing-xs 0;
  }
  
  .description {
    font-size: 14px;
    color: $text-secondary;
    font-weight: 500;
  }
}

// 表单
.login-form {
  .el-form-item {
    margin-bottom: $spacing-lg;
  }
  
  :deep(.el-input__wrapper) {
    padding: 12px 16px;
    border-radius: $border-radius;
    background: rgba(248, 250, 252, 0.7);
    border: 1px solid rgba(15, 23, 42, 0.08);
    backdrop-filter: blur(4px);
    
    &:hover {
      border-color: $primary-light;
      background: white;
    }
    
    &.is-focus {
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
      background: white;
    }
  }
  
  :deep(.el-input__prefix) {
    .el-icon {
      color: $text-muted;
      font-size: 19px;
    }
  }
  
  .login-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 700;
    margin-top: $spacing-md;
    border-radius: $border-radius;
    background: $gradient-primary;
    border: none;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
    transition: all $transition-base;
    color: white;
    
    &:hover {
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

@media (max-width: $breakpoint-sm) {
  .login-card {
    width: 92%;
    padding: $spacing-xl;
  }
}
</style>