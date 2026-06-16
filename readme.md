# 💰 家庭财务管家 (Family Expense App)

[![Vue](https://img.shields.io/badge/Vue.js-3.4-4FC08D?logo=vuedotjs)](https://vuejs.org/)
[![Nuxt](https://img.shields.io/badge/Nuxt.js-3.10-00DC82?logo=nuxtdotjs)](https://nuxt.com/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.5-409EFF?logo=element)](https://element-plus.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.4-119EFF?logo=capacitor)](https://capacitorjs.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)

一个现代化的家庭消费记账 Web/App 应用。支持多用户共享账本，通过 AI 技术（智能识别、OCR）极大增强用户体验，实现消费明细录入、分类汇总、数据分析、预算管理、人情往来、车辆管理等核心功能。

---

## ✨ 核心特性

- **🤖 智能记账 (AI-Powered)** 
  - 支持文字、语音、图片（内置 OCR）多模态输入，AI 自动识别消费金额与信息。
  - AI 根据消费描述自动推荐最佳分类，实现“零思考”记账。
- **📊 深度数据洞察** 
  - AI 分析消费趋势，提供节省建议和异常开销检测。
  - ECharts 渲染的精美可视化图表（趋势图、分布饼图等）。
- **🎯 预算管理** 
  - 设定每月总预算与各子分类预算，实时监控超支情况（配合进度条预警）。
- **🤝 人情与车辆管理** 
  - **人情往来**：管理出礼收礼记录，自动关联消费账目，精准统计“人情债”。
  - **车辆管理**：管理家庭车辆，记录加油、充电、保养，自动同步为“交通”消费记录。
- **📱 全平台支持 (Cross-Platform)** 
  - **Web 端**：响应式设计，完美适配桌面与平板。
  - **移动端**：支持 PWA（Progressive Web App）安装至桌面。
  - **原生 App**：基于 Capacitor 封装，支持直接编译为 Android / iOS 原生应用。

---

## 🏗️ 系统架构与技术栈

| 层级 | 技术选型 | 说明 |
| --- | --- | --- |
| **前端框架** | Vue 3 + Nuxt 3 | 支持现代组合式 API 开发与极速构建 |
| **UI 组件** | Element Plus | 企业级桌面/移动端 UI 库 |
| **状态管理** | Pinia | 状态管理（结合 persistedstate 实现持久化） |
| **跨端与 PWA** | Capacitor + Vite PWA | 支持安装为本地 Web 应用及打包 Android/iOS |
| **可视化与识别** | ECharts + Tesseract.js | 消费数据图表分析与图片 OCR 识别 |
| **后端 API** | Nuxt Server Routes (Nitro) | 内置的轻量级后端服务 |
| **数据库** | MySQL 8.0+ | 关系型数据库存储（使用 mysql2 驱动） |
| **AI 引擎** | OpenAI API / SCNet | 兼容 GPT 标准接口的大模型接入 |

---

## 🚀 快速开始

### 1. 环境准备

- Node.js >= 18.x
- MySQL >= 8.0
- pnpm >= 8.x (强烈推荐)
- *(可选)* Android Studio / Xcode (用于原生 App 打包)

### 2. 安装与配置

```bash
# 克隆项目
git clone <repository-url>
cd family_expense_app

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.development
```

编辑 `.env.development`：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=family_expense

# 认证与AI配置
JWT_SECRET=your_jwt_secret
SCNET_API_KEY=your_api_key
```

### 3. 初始化数据库

请依次将 SQL 导入 MySQL：

```bash
mysql -u root -p < database/init.sql
mysql -u root -p family_expense < database/add_vehicle_tables.sql
mysql -u root -p family_expense < database/add_gifting_tables.sql
mysql -u root -p family_expense < database/add_fuel_expense_link.sql
```

### 4. 运行与打包

```bash
# 启动开发服务器 (http://localhost:3000)
pnpm dev

# 构建生产环境 Web 静态资源
pnpm build
pnpm preview

# 同步构建移动端原生应用 (需要全局安装 Capacitor)
npx cap sync android
npx cap open android
```

> **默认管理员账号**：  
> 用户名：`admin` | 密码：`admin123`

---

## 💡 特色功能：自动化联动逻辑

为了减少重复录入，系统在底层实现了智能联动：

1. **加油充电自动记账**：创建车辆“加油/充电”记录时，系统会自动在主账本创建一笔分类为“交通”的消费记录。修改或删除时同步生效。
2. **人情往来自动记账**：在日常记账时，若选择“出礼”分类，系统将在“人情往来”模块自动生成对应的人情记录，且两者双向绑定，同步更新。

| 触发操作 | 是否自动创建【消费记录】 | 是否自动创建【人情记录】 |
| --- | :---: | :---: |
| 录入**消费记录** (当分类为"出礼") | - | ✅ 是 |
| 录入**人情记录** (收/出礼) | ❌ 否 | - |
| 录入**加油/充电记录** | ✅ 是 | ❌ 否 |

---

## 📁 核心目录结构

```text
family_expense_app/
├── pages/              # Nuxt 路由页面 (预算/分类/人情/统计等)
├── components/         # 页面公共组件与业务组件
├── composables/        # 组合式函数 (useApi, useAI 等)
├── stores/             # Pinia 状态管理
├── server/             # Nuxt 服务端 API (后端逻辑)
│   ├── api/            # RESTful API 路由
│   └── utils/          # 数据库连接、Auth 等工具函数
├── database/           # 数据库初始化 SQL 脚本
├── android/            # Capacitor Android 原生工程目录
└── nuxt.config.ts      # Nuxt 与相关模块配置文件
```

---

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。
