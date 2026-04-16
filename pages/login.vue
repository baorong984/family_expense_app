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
        <h1 class="title">家庭消费记账</h1>
        <p class="description">AI智能记账 · 轻松管理家庭消费</p>
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
  background: linear-gradient(135deg, #F0F5F7 0%, #E8F4F8 50%, #F5F9FA 100%);
  position: relative;
  overflow: hidden;
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
  
  .circle {
    position: absolute;
    border-radius: 50%;
  }
  
  .circle-1 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(78, 205, 196, 0.15) 0%, transparent 70%);
    top: -100px;
    right: -100px;
    animation: float1 20s ease-in-out infinite;
  }
  
  .circle-2 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(69, 183, 209, 0.12) 0%, transparent 70%);
    bottom: -50px;
    left: -50px;
    animation: float2 25s ease-in-out infinite;
  }
  
  .circle-3 {
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255, 107, 157, 0.1) 0%, transparent 70%);
    top: 50%;
    left: 20%;
    animation: float3 18s ease-in-out infinite;
  }
}

@keyframes float1 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-30px, 20px); }
}

@keyframes float2 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, -30px); }
}

@keyframes float3 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-20px, -20px); }
}

// 登录卡片
.login-card {
  width: 420px;
  padding: $spacing-2xl;
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: $border-radius-xl;
  box-shadow: 
    0 4px 6px rgba(45, 55, 72, 0.04),
    0 10px 40px rgba(45, 55, 72, 0.08);
  position: relative;
  z-index: 1;
  animation: cardAppear 0.5s ease-out;
  
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
    transform: translateY(20px);
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
    margin-bottom: $spacing-lg;
    
    .logo-icon {
      font-size: 48px;
      display: inline-block;
      animation: bounce 2s ease-in-out infinite;
    }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  
  .title {
    font-family: $font-display;
    font-size: 24px;
    font-weight: 700;
    color: $text-primary;
    margin: 0 0 $spacing-sm 0;
  }
  
  .description {
    font-size: 14px;
    color: $text-muted;
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
  }
  
  :deep(.el-input__prefix) {
    .el-icon {
      color: $text-muted;
      font-size: 18px;
    }
  }
  
  .login-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    margin-top: $spacing-md;
    border-radius: $border-radius;
    background: $gradient-primary;
    border: none;
    box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
    
    &:hover {
      box-shadow: 0 6px 20px rgba(78, 205, 196, 0.4);
      transform: translateY(-2px);
    }
  }
}

@media (max-width: $breakpoint-sm) {
  .login-card {
    width: 90%;
    padding: $spacing-xl;
  }
}
</style>