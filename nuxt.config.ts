// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  modules: [
    '@pinia/nuxt',
  ],
  
  plugins: [
    '@/plugins/element-plus',
  ],
  
  css: [
    'element-plus/dist/index.css',
    '@/assets/styles/global.scss',
  ],
  
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/styles/variables.scss" as *;`,
        },
      },
    },
  },
  
  // Element Plus 自动导入
  components: [
    {
      path: '~/components',
      extensions: ['.vue'],
    },
  ],
  
  imports: {
    dirs: ['stores', 'composables', 'utils'],
  },
  
  runtimeConfig: {
    // 服务端私有配置
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: process.env.DB_PORT || 3306,
    dbName: process.env.DB_NAME || 'family_expense',
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    scnetApiKey: process.env.SCNET_API_KEY || '',
    scnetApiUrl: process.env.SCNET_API_URL || 'https://api.scnet.cn/api/llm/v1',
    scnetModel: process.env.SCNET_MODEL || 'gpt-3.5-turbo',
    
    // 公共配置
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
      mode: process.env.NUXT_PUBLIC_MODE || '开发环境',
      projectName: process.env.NUXT_PUBLIC_PROJECT_NAME || 'family_expense_app',
    },
  },
  
  compatibilityDate: '2024-02-15',
  
  pinia: {
    storesDirs: ['./stores/**'],
  },

  // 开发服务器配置
  devServer: {
    host: '0.0.0.0',
    port: 3000,
  },

  // 配置页面过渡动画
  app: {
    head: {
      title: '家庭消费记账',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '家庭消费记账系统 - AI智能记账' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  
  // TypeScript 配置
  typescript: {
    strict: true,
    shim: false,
  },
})
