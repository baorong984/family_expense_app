import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus'

export default defineNuxtPlugin((nuxtApp) => {

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
