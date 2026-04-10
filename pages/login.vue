<template>
  <div class="login-container">
    <!-- 背景动画 -->
    <div class="background-animation">
      <div class="grid"></div>
      <div class="particles"></div>
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
      <div class="glow-orb orb-3"></div>
    </div>
    
    <!-- 登录卡片 -->
    <div class="login-card glass-card">
      <div class="login-header">
        <div class="logo-container">
          <div class="logo-ring"></div>
          <el-icon :size="64" color="#00f0ff" class="logo-icon"><Wallet /></el-icon>
        </div>
        <h1 class="title">EXPENSE</h1>
        <h2 class="subtitle">家庭消费记账系统</h2>
        <p class="description">AI智能记账 · 轻松管理家庭消费</p>
      </div>
      
      <el-form ref="formRef" :model="form" :rules="rules" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon class="input-icon"><User /></el-icon>
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
              <el-icon class="input-icon"><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            <span class="btn-text">登录系统</span>
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 底部装饰 -->
      <div class="footer-decoration">
        <div class="scan-line"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Wallet, User, Lock } from '@element-plus/icons-vue'
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
  background: $bg-deep;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: $gradient-mesh;
    pointer-events: none;
    z-index: 1;
  }
}

// 背景动画
.background-animation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  
  .grid {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px);
    background-size: 60px 60px;
    animation: gridMove 30s linear infinite;
  }
  
  @keyframes gridMove {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(60px, 60px);
    }
  }
  
  .particles {
    position: absolute;
    width: 100%;
    height: 100%;
    
    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 4px;
      height: 4px;
      background: $neon-blue;
      border-radius: 50%;
      box-shadow: 0 0 10px $neon-blue;
      animation: particleFloat 10s infinite;
    }
    
    &::before {
      top: 20%;
      left: 20%;
      animation-delay: 0s;
    }
    
    &::after {
      top: 60%;
      right: 30%;
      animation-delay: 5s;
      background: $neon-pink;
      box-shadow: 0 0 10px $neon-pink;
    }
  }
  
  @keyframes particleFloat {
    0%, 100% {
      transform: translate(0, 0);
      opacity: 0.3;
    }
    50% {
      transform: translate(100px, 100px);
      opacity: 1;
    }
  }
  
  .glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    animation: orbPulse 8s infinite;
  }
  
  .orb-1 {
    width: 400px;
    height: 400px;
    background: rgba(0, 240, 255, 0.3);
    top: -200px;
    left: -200px;
  }
  
  .orb-2 {
    width: 300px;
    height: 300px;
    background: rgba(255, 0, 110, 0.2);
    bottom: -150px;
    right: -150px;
    animation-delay: 2s;
  }
  
  .orb-3 {
    width: 350px;
    height: 350px;
    background: rgba(57, 255, 20, 0.2);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation-delay: 4s;
  }
  
  @keyframes orbPulse {
    0%, 100% {
      opacity: 0.5;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.2);
    }
  }
}

// 登录卡片
.login-card {
  width: 480px;
  padding: $spacing-2xl;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  -webkit-backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-xl;
  box-shadow: $shadow-card;
  position: relative;
  z-index: 2;
  animation: cardAppear 0.8s ease-out;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: $gradient-primary;
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 1px;
    background: linear-gradient(90deg, transparent, $neon-blue, transparent);
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

// Logo
.login-header {
  text-align: center;
  margin-bottom: $spacing-2xl;
  
  .logo-container {
    position: relative;
    display: inline-block;
    margin-bottom: $spacing-lg;
    
    .logo-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100px;
      height: 100px;
      border: 2px solid $neon-blue;
      border-radius: 50%;
      animation: ringRotate 10s linear infinite;
    }
    
    @keyframes ringRotate {
      from {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      to {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }
    
    .logo-icon {
      position: relative;
      z-index: 1;
      animation: logoPulse 2s infinite;
    }
    
    @keyframes logoPulse {
      0%, 100% {
        filter: drop-shadow(0 0 20px rgba(0, 240, 255, 0.5));
      }
      50% {
        filter: drop-shadow(0 0 40px rgba(0, 240, 255, 0.8));
      }
    }
  }
  
  .title {
    font-family: $font-display;
    font-size: 32px;
    font-weight: 900;
    color: $text-neon;
    letter-spacing: 8px;
    margin: 0 0 $spacing-sm 0;
    text-shadow: 0 0 30px rgba(0, 240, 255, 0.5);
  }
  
  .subtitle {
    font-family: $font-display;
    font-size: 14px;
    font-weight: 500;
    color: $text-secondary;
    letter-spacing: 4px;
    margin: 0 0 $spacing-md 0;
    text-transform: uppercase;
  }
  
  .description {
    font-size: 14px;
    color: $text-muted;
    letter-spacing: 1px;
  }
}

// 表单
.login-form {
  .el-form-item {
    margin-bottom: $spacing-xl;
    
    :deep(.el-form-item__error) {
      color: $neon-pink;
    }
  }
  
  :deep(.el-input__wrapper) {
    padding: $spacing-md $spacing-lg;
    font-size: 16px;
  }
  
  .input-icon {
    font-size: 20px;
    color: $text-secondary;
  }
  
  .login-btn {
    width: 100%;
    height: 50px;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    background: $gradient-primary;
    border: none;
    box-shadow: $shadow-neon;
    
    &:hover {
      background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
      box-shadow: 0 0 40px rgba(0, 240, 255, 0.6);
      transform: translateY(-2px);
    }
    
    .btn-text {
      position: relative;
      
      &::after {
        content: '→';
        margin-left: $spacing-sm;
        opacity: 0;
        transition: all $transition-base;
      }
    }
    
    &:hover .btn-text::after {
      opacity: 1;
      margin-left: $spacing-md;
    }
  }
}

// 底部装饰
.footer-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  overflow: hidden;
  
  .scan-line {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100px;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      $neon-blue, 
      transparent);
    animation: scanMove 3s linear infinite;
  }
  
  @keyframes scanMove {
    from {
      left: -100%;
    }
    to {
      left: 100%;
    }
  }
}

@media (max-width: $breakpoint-sm) {
  .login-card {
    width: 90%;
    padding: $spacing-xl;
    
    .title {
      font-size: 24px;
      letter-spacing: 4px;
    }
  }
}
</style>
