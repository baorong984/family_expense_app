import ElementPlus, { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus'

export default defineNuxtPlugin((nuxtApp) => {
  // 自定义科技风格主题
  const theme = {
    // 主色
    '--el-color-primary': '#00f0ff',
    '--el-color-primary-light-3': '#00d4ff',
    '--el-color-primary-light-5': '#00a8cc',
    '--el-color-primary-light-7': '#007c99',
    '--el-color-primary-light-9': '#005066',
    '--el-color-primary-dark-2': '#00e6f5',
    
    // 成功色
    '--el-color-success': '#39ff14',
    '--el-color-success-light-3': '#00ff87',
    
    // 警告色
    '--el-color-warning': '#ff006e',
    '--el-color-warning-light-3': '#ff4d94',
    
    // 危险色
    '--el-color-danger': '#ff2a6d',
    
    // 信息色
    '--el-color-info': '#00d4ff',
    
    // 文字颜色
    '--el-text-color-primary': '#ffffff',
    '--el-text-color-regular': '#a0aec0',
    '--el-text-color-secondary': '#718096',
    '--el-text-color-placeholder': '#4a5568',
    
    // 边框颜色
    '--el-border-color': 'rgba(0, 240, 255, 0.2)',
    '--el-border-color-light': 'rgba(0, 240, 255, 0.15)',
    '--el-border-color-lighter': 'rgba(0, 240, 255, 0.1)',
    '--el-border-color-extra-light': 'rgba(0, 240, 255, 0.05)',
    '--el-border-color-dark': 'rgba(0, 240, 255, 0.3)',
    '--el-border-color-darker': 'rgba(0, 240, 255, 0.4)',
    
    // 填充颜色
    '--el-fill-color': 'rgba(0, 240, 255, 0.05)',
    '--el-fill-color-light': 'rgba(0, 240, 255, 0.03)',
    '--el-fill-color-lighter': 'rgba(0, 240, 255, 0.02)',
    '--el-fill-color-extra-light': 'rgba(0, 240, 255, 0.01)',
    '--el-fill-color-dark': 'rgba(0, 240, 255, 0.1)',
    '--el-fill-color-darker': 'rgba(0, 240, 255, 0.15)',
    '--el-fill-color-blank': 'transparent',
    
    // 背景颜色
    '--el-bg-color': 'rgba(21, 25, 50, 0.7)',
    '--el-bg-color-page': '#0a0e27',
    
    // 阴影
    '--el-box-shadow': '0 8px 32px rgba(0, 0, 0, 0.4)',
    '--el-box-shadow-light': '0 4px 16px rgba(0, 0, 0, 0.3)',
    '--el-box-shadow-lighter': '0 2px 8px rgba(0, 0, 0, 0.2)',
    '--el-box-shadow-dark': '0 12px 48px rgba(0, 0, 0, 0.5)',
    
    // 圆角
    '--el-border-radius-base': '12px',
    '--el-border-radius-small': '8px',
    '--el-border-radius-round': '20px',
    '--el-border-radius-circle': '100%',
    
    // 字体
    '--el-font-size-base': '14px',
    '--el-font-size-small': '12px',
    '--el-font-size-large': '16px',
    '--el-font-size-extra-large': '20px',
    
    // 过渡
    '--el-transition-duration': '0.3s',
  }
  
  // 应用主题
  if (process.client) {
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value)
    })
  }
  
  nuxtApp.vueApp.use(ElementPlus)

  // SSR ID 注入
  nuxtApp.vueApp.provide(ID_INJECTION_KEY, {
    prefix: Math.floor(Math.random() * 10000),
    current: 0,
  })

  // SSR ZIndex 注入
  nuxtApp.vueApp.provide(ZINDEX_INJECTION_KEY, { current: 0 })

  // 注册所有图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    nuxtApp.vueApp.component(key, component)
  }

  // 全局挂载 ElMessage, ElMessageBox, ElNotification
  nuxtApp.provide('ElMessage', ElMessage)
  nuxtApp.provide('ElMessageBox', ElMessageBox)
  nuxtApp.provide('ElNotification', ElNotification)
})

// 导出供全局使用
export { ElMessage, ElMessageBox, ElNotification }
