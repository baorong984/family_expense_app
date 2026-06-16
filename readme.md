# 家庭财务管家 (Family Expense Manager)

AI 智能记账 · 轻松管理家庭财务

## 功能特性

- **智能记账**：支持 AI 自动识别消费类型和金额
- **预算管理**：设置月度预算，实时追踪支出
- **人情往来**：记录和管理家庭社交支出
- **车辆管理**：记录加油、保养等车辆相关费用
- **统计分析**：多维度数据可视化报表
- **成员管理**：家庭成员独立记账，专属颜色标识
- **分类管理**：自定义收支类别
- **多端支持**：Web 浏览器 + Android App

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + Nuxt 3 |
| UI 组件 | Element Plus |
| 状态管理 | Pinia |
| 样式 | SCSS (Sass) |
| 移动端 | Capacitor 6 (Android) |
| 后端 | Nitro (Nuxt 内置) |
| 数据库 | MySQL 8.0 |
| 认证 | JWT |
| AI | SCNet API (MiniMax-M2.5) |

## 项目结构

```
family_expense_app/
├── assets/              # 静态资源
│   └── styles/          # 全局样式（SCSS）
├── components/          # Vue 组件
├── composables/         # 组合式函数（useApi 等）
├── database/            # 数据库脚本与文档
├── pages/               # 页面路由
├── server/              # 后端服务
│   ├── api/             # API 路由
│   ├── middleware/      # 中间件（CORS 等）
│   └── utils/           # 工具函数
├── stores/              # Pinia 状态管理
├── android/             # Android 原生项目（Capacitor 生成）
├── capacitor.config.ts  # Capacitor 配置
├── nuxt.config.ts       # Nuxt 配置
└── .env.*               # 环境变量配置
```

## 快速开始

### 环境要求

- Node.js >= 18
- MySQL >= 8.0
- Java 17+（构建 Android APK 需要）

### 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量（复制并修改）
cp .env.development.example .env.development

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000`，默认账号：**admin / admin123**

### 构建 Web 生产版本

```bash
# 构建服务端（用于部署到服务器，同时支持 Web 和 App）
npm run build:prod

# 或生成静态文件（仅用于 SSG 模式）
npm run generate:prod
```

### 构建 Android App

```bash
# 1. 生成静态文件
npm run generate:prod

# 2. 同步到 Android 项目
npx cap sync android

# 3. 构建 Debug APK
cd android && ./gradlew assembleDebug

# APK 输出路径：android/app/build/outputs/apk/debug/app-debug.apk
```

> **生产模式说明**：当前使用 Capacitor Server 模式，App 直接从远程服务器加载页面。APK 本身作为 WebView 容器，无需包含完整前端代码。

## 生产环境部署

### 服务器要求

- 云服务器（如阿里云 ECS Ubuntu 22.04）
- 开放安全组端口：TCP 3000
- 已安装 Node.js 18+ 和 MySQL 8.0+

### 部署步骤

```bash
# 1. 上传项目代码到服务器
scp -r ./project user@139.196.175.70:/opt/family-expense-app/

# 2. SSH 登录服务器
ssh root@139.196.175.70

# 3. 安装依赖并构建
cd /opt/family-expense-app
npm install --production
npm run build:prod

# 4. 初始化数据库（首次部署）
mysql -u root -p < database/init.sql

# 5. 使用 PM2 启动服务
npm install -g pm2
pm2 start .output/server/index.mjs --name family-expense --env production
pm2 save
pm2 startup
```

### 环境变量配置

生产环境配置文件 `.env.production`：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=family_expense
DB_USER=your_prod_user
DB_PASSWORD=your_password

# API 地址（App 和 Web 共用）
NUXT_PUBLIC_API_BASE_URL=http://139.196.175.70:3000

# JWT 密钥（生产环境请修改！）
JWT_SECRET=your-production-jwt-secret-key
```

## 常见问题

### Q: App 登录提示 "Failed to fetch" / "网络连接失败"

**原因及解决方案**：
1. 确认服务器 `http://139.196.175.70:3000` 可从手机浏览器访问
2. 确认云服务器安全组已开放 3000 端口
3. 确认 PM2 服务正在运行：`pm2 status`
4. 当前使用 Server 模式，确保 `capacitor.config.ts` 中 `server.url` 配置正确

### Q: Sass 构建警告

项目已将 `darken()` 迁移至 `color.adjust()`，如仍有旧代码请检查 `assets/styles/global.scss`。

### Q: Android 构建失败 Namespace 错误

卸载废弃的 `@capacitor/http` 插件：
```bash
npm uninstall @capacitor/http
npx cap sync android
```

## 更新日志

详见 [log.md](./log.md)

## 数据库变更

详见 [database/README.md](./database/README.md)
