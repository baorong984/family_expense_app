// https://nuxt.com/docs/api/configuration/nuxt-config
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

// 优先加载本地未脱敏的私有环境配置（若存在则自动覆盖模板配置）
const isProd = process.argv.some(arg => arg.includes('.env.production')) ||
  (!process.argv.some(arg => arg.includes('.env.development')) && process.env.NODE_ENV === 'production')
const envMode = isProd ? 'production' : 'development'
const localEnvFiles = [
  path.resolve(process.cwd(), `.env.${envMode}.local`),
  path.resolve(process.cwd(), '.env.local'),
]
for (const envFile of localEnvFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, override: true, quiet: true })
  }
}

export default defineNuxtConfig({
  devtools: { enabled: true },
  
  ssr: false,  // 禁用 SSR 避免水合不匹配
  
  experimental: {
    appManifest: false,
  },
  
  modules: [
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
    '@element-plus/nuxt',
    'nuxt-security'
  ],
  
  security: {
    headers: {
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
      xFrameOptions: 'SAMEORIGIN',
    },
    rateLimiter: {
      tokensPerInterval: 150,
      interval: 'hour',
      fireAndForget: true,
    }
  },
  
  routeRules: {
    '/api/auth/login': {
      security: {
        rateLimiter: {
          tokensPerInterval: 5,
          interval: 'minute'
        }
      }
    },
    '/api/ai/**': {
      security: {
        rateLimiter: {
          tokensPerInterval: 15,
          interval: 'minute'
        }
      }
    }
  },
  
  plugins: [
    '@/plugins/element-plus',
  ],
  
  css: [
    'element-plus/theme-chalk/dark/css-vars.css',
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

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '家庭财务管家',
      short_name: '记账本',
      description: '家庭财务管家 - 智能家庭消费记账系统',
      theme_color: '#00f0ff',
      background_color: '#0a0e27',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },

  // 开发服务器配置
  devServer: {
    host: '0.0.0.0',
    port: 3000,
  },

  // 配置页面过渡动画
  app: {
    head: {
      title: '家庭财务管家',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '家庭财务管家 - 智能家庭消费记账系统，支持AI智能记账、预算管理、人情往来、车辆管理等功能' },
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
