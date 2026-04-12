# 家庭消费记账系统 - 项目总览文档

> 本文档整合了产品规格、API接口、数据库设计、前端设计、AI集成方案及系统提示词，作为项目开发的完整参考文档。

---

## 目录

1. [项目概述](#1-项目概述)
2. [核心功能](#2-核心功能)
3. [技术架构](#3-技术架构)
4. [数据库设计](#4-数据库设计)
5. [API接口规范](#5-api接口规范)
6. [前端设计](#6-前端设计)
7. [AI功能集成](#7-ai功能集成)
8. [安全与权限](#8-安全与权限)
9. [环境配置](#9-环境配置)
10. [系统提示词](#10-系统提示词)

---

## 1. 项目概述

### 1.1 产品定位

一个面向家庭的消费记账Web应用，支持多用户共享账本，通过AI技术增强用户体验，实现消费明细录入、分类汇总、数据分析、预算管理等核心功能。

### 1.2 目标用户

- 家庭用户，需要记录和管理家庭消费
- 多人共享账本，支持家庭成员协作
- 需要数据分析和预算管理的用户

### 1.3 核心价值

| 价值点   | 说明                                               |
| -------- | -------------------------------------------------- |
| 智能录入 | 支持文字、语音、图片多模态输入，AI自动识别消费信息 |
| 智能分类 | AI根据消费描述自动推荐分类，减少手动操作           |
| 数据洞察 | AI分析消费趋势，提供节省建议和异常检测             |
| 协作共享 | 家庭成员共享账本，共同管理家庭财务                 |

---

## 2. 核心功能

### 2.1 功能模块总览

```
家庭消费记账系统
├── 认证模块
│   ├── 用户登录
│   ├── 修改密码
│   └── 退出登录
├── 记账模块
│   ├── 消费录入（文字/语音/图片）
│   ├── AI智能识别
│   ├── AI自动分类
│   └── 历史记录管理
├── 统计模块
│   ├── 消费趋势图表
│   ├── 分类分布分析
│   ├── 成员占比分析
│   └── AI消费洞察
├── 预算模块
│   ├── 总预算设置
│   ├── 分类预算分配
│   └── 预算执行监控
├── 分类模块
│   ├── 系统预设分类
│   └── 自定义分类
└── 成员模块
    ├── 成员管理
    └── 成员消费统计
```

### 2.2 功能详情

#### 消费明细录入

- 支持多模态输入：文字、语音、图片
- 支持完整描述和关键词输入
- AI自动识别和分类
- 支持编辑和删除消费记录

#### 数据分析

- 按时间维度查看消费趋势
- 按类别维度查看消费分布
- 按成员维度查看消费占比
- 支持可视化图表展示
- 支持导出Excel

#### 预算管理

- 设置每月预算
- 查看预算执行情况
- 超支提醒

### 2.3 用户流程

#### 记账流程

1. 用户登录系统
2. 进入记账页面
3. 选择输入方式（文字/语音/图片）
4. 输入消费信息
5. AI自动识别消费信息（金额、类别、时间等）
6. AI自动分类，返回多个可能的分类
7. 用户确认或修改分类
8. 保存消费记录

#### 统计分析流程

1. 用户进入统计页面
2. 选择统计维度（时间/类别/成员）
3. 查看可视化图表
4. 查看AI分析结果（同比分析、异常检测、节省建议、趋势预测）
5. 导出数据（可选）

---

## 3. 技术架构

### 3.1 技术栈

| 层级     | 技术选型           | 说明               |
| -------- | ------------------ | ------------------ |
| 前端框架 | Vue 3 + Nuxt.js 3  | 全栈开发框架       |
| UI组件库 | Element Plus       | 企业级UI组件       |
| 状态管理 | Pinia              | Vue 3 官方状态管理 |
| 图表库   | ECharts            | 数据可视化         |
| 样式     | SCSS               | CSS预处理          |
| 数据库   | MySQL              | 关系型数据库       |
| AI平台   | SCNet (兼容OpenAI) | 大模型API          |
| 认证     | JWT Token          | 无状态认证         |
| OCR      | Tesseract.js       | 图片文字识别       |
| 语音     | Web Speech API     | 浏览器原生语音识别 |

### 3.2 项目结构

```
family_expense_app/
├── pages/                      # 页面组件（Nuxt自动路由）
│   ├── login.vue              # 登录页
│   ├── index.vue              # 首页
│   ├── expense/               # 记账模块
│   │   ├── create.vue         # 记账页面
│   │   └── history.vue        # 历史记录
│   ├── statistics/index.vue   # 统计分析
│   ├── budget/index.vue       # 预算管理
│   ├── category/index.vue     # 分类管理
│   └── member/index.vue       # 成员管理
├── components/                # 公共组件
│   ├── layout/                # 布局组件
│   │   ├── Header.vue
│   │   ├── Sidebar.vue
│   │   └── MainLayout.vue
│   └── expense/
│       └── ExpenseEditDialog.vue
├── composables/               # 组合式函数
│   ├── useAI.ts              # AI功能
│   ├── useApi.ts             # API调用
│   └── useSpeechRecognition.ts
├── stores/                    # Pinia状态管理
│   ├── user.ts
│   ├── category.ts
│   └── member.ts
├── server/                    # 服务端
│   ├── api/                  # API路由
│   │   ├── auth/             # 认证接口
│   │   ├── expense/          # 消费接口
│   │   ├── statistics/       # 统计接口
│   │   ├── budget/           # 预算接口
│   │   ├── category/         # 分类接口
│   │   ├── member/           # 成员接口
│   │   └── ai/               # AI接口
│   └── utils/                # 服务端工具
│       ├── ai.ts
│       ├── auth.ts
│       ├── db.ts
│       └── response.ts
├── database/                  # 数据库脚本
│   └── init.sql
├── assets/styles/            # 全局样式
│   ├── variables.scss
│   └── global.scss
├── types/                    # TypeScript类型
│   └── index.ts
├── utils/                    # 工具函数
│   ├── format.ts
│   └── tree.ts
├── middleware/               # 中间件
│   └── auth.ts
├── plugins/                  # 插件
│   └── element-plus.ts
├── nuxt.config.ts           # Nuxt配置
├── package.json
└── .env.example             # 环境变量示例
```

### 3.3 响应式断点

| 设备类型 | 宽度范围       | 布局方式                  |
| -------- | -------------- | ------------------------- |
| 移动端   | < 768px        | 单栏布局，侧边栏折叠      |
| 平板     | 768px - 1024px | 两栏布局，侧边栏收缩      |
| 桌面端   | > 1024px       | 两栏布局，侧边栏固定200px |

---

## 4. 数据库设计

### 4.1 数据库信息

- **数据库类型**: MySQL
- **数据库名称**: family_expense
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci

### 4.2 ER图关系

```
users (用户表)
  ├─ 1:N → members (成员表)
  ├─ 1:N → expenses (消费记录表)
  └─ 1:N → budgets (预算表)

members (成员表)
  └─ 1:N → expenses (消费记录表)

categories (分类表)
  ├─ 1:N → categories (自关联，实现层级)
  └─ 1:N → expenses (消费记录表)

expenses (消费记录表)
  ├─ N:1 → categories
  ├─ N:1 → members
  └─ N:1 → users

budgets (预算表)
  ├─ N:1 → categories
  └─ N:1 → users
```

### 4.3 表结构设计

#### 4.3.1 users - 用户表

| 字段名     | 类型         | 说明                     |
| ---------- | ------------ | ------------------------ |
| id         | INT(11)      | 用户ID（主键，自增）     |
| username   | VARCHAR(50)  | 用户名（唯一）           |
| password   | VARCHAR(255) | 密码（bcrypt加密）       |
| email      | VARCHAR(100) | 邮箱                     |
| is_admin   | TINYINT(1)   | 是否管理员（0=否，1=是） |
| status     | TINYINT(1)   | 状态（0=禁用，1=启用）   |
| created_at | DATETIME     | 创建时间                 |
| updated_at | DATETIME     | 更新时间                 |

#### 4.3.2 members - 成员表

| 字段名     | 类型         | 说明                    |
| ---------- | ------------ | ----------------------- |
| id         | INT(11)      | 成员ID（主键）          |
| name       | VARCHAR(50)  | 成员姓名                |
| avatar     | VARCHAR(255) | 头像URL                 |
| created_by | INT(11)      | 创建者（外键→users.id） |
| created_at | DATETIME     | 创建时间                |
| updated_at | DATETIME     | 更新时间                |

#### 4.3.3 categories - 分类表

| 字段名     | 类型        | 说明                       |
| ---------- | ----------- | -------------------------- |
| id         | INT(11)     | 分类ID（主键）             |
| name       | VARCHAR(50) | 分类名称                   |
| parent_id  | INT(11)     | 父分类ID（NULL为大类）     |
| is_system  | TINYINT(1)  | 是否系统预设（0=否，1=是） |
| sort_order | INT(11)     | 排序顺序                   |
| created_at | DATETIME    | 创建时间                   |
| updated_at | DATETIME    | 更新时间                   |

#### 4.3.4 expenses - 消费记录表

| 字段名       | 类型          | 说明                         |
| ------------ | ------------- | ---------------------------- |
| id           | INT(11)       | 消费ID（主键）               |
| amount       | DECIMAL(10,2) | 消费金额                     |
| expense_date | DATE          | 消费日期                     |
| expense_time | TIME          | 消费时间                     |
| category_id  | INT(11)       | 分类ID（外键→categories.id） |
| member_id    | INT(11)       | 成员ID（外键→members.id）    |
| description  | VARCHAR(500)  | 消费描述                     |
| remarks      | VARCHAR(200)  | 备注                         |
| created_by   | INT(11)       | 创建者（外键→users.id）      |
| created_at   | DATETIME      | 创建时间                     |
| updated_at   | DATETIME      | 更新时间                     |

#### 4.3.5 budgets - 预算表

| 字段名       | 类型          | 说明                    |
| ------------ | ------------- | ----------------------- |
| id           | INT(11)       | 预算ID（主键）          |
| year         | INT(4)        | 年份                    |
| month        | INT(2)        | 月份（1-12）            |
| total_amount | DECIMAL(10,2) | 预算金额                |
| category_id  | INT(11)       | 分类ID（NULL为总预算）  |
| created_by   | INT(11)       | 创建者（外键→users.id） |
| created_at   | DATETIME      | 创建时间                |
| updated_at   | DATETIME      | 更新时间                |

### 4.4 系统预设分类

| 大类 | 子分类                                         |
| ---- | ---------------------------------------------- |
| 餐饮 | 火锅、烧烤、外卖、正餐、零食、饮料、其他餐饮   |
| 交通 | 打车、地铁、公交、加油、停车、其他交通         |
| 购物 | 超市、网购、服装、电子产品、家居用品、其他购物 |
| 娱乐 | 电影、KTV、游戏、旅游、其他娱乐                |
| 医疗 | 看病、买药、体检、其他医疗                     |
| 教育 | 培训、书籍、课程、其他教育                     |
| 居住 | 房租、水电、物业、其他居住                     |
| 其他 | 其他消费                                       |

---

## 5. API接口规范

### 5.1 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **认证方式**: JWT Token (Bearer Token)

### 5.2 统一响应格式

**成功响应**:

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "code": 200
}
```

**错误响应**:

```json
{
  "success": false,
  "data": null,
  "message": "错误信息",
  "code": 400
}
```

### 5.3 错误码说明

| 错误码 | 说明                      |
| ------ | ------------------------- |
| 200    | 成功                      |
| 400    | 请求参数错误              |
| 401    | 未授权（Token无效或过期） |
| 403    | 禁止访问                  |
| 404    | 资源不存在                |
| 409    | 资源冲突                  |
| 422    | 数据验证失败              |
| 500    | 服务器内部错误            |

### 5.4 API路由列表

#### 认证接口

| 方法 | 路径               | 说明             |
| ---- | ------------------ | ---------------- |
| POST | /api/auth/login    | 用户登录         |
| POST | /api/auth/logout   | 用户退出         |
| GET  | /api/auth/me       | 获取当前用户信息 |
| PUT  | /api/auth/password | 修改密码         |

#### 消费记录接口

| 方法   | 路径             | 说明                               |
| ------ | ---------------- | ---------------------------------- |
| GET    | /api/expense     | 获取消费记录列表（支持分页和筛选） |
| POST   | /api/expense     | 创建消费记录                       |
| GET    | /api/expense/:id | 获取单条消费记录                   |
| PUT    | /api/expense/:id | 更新消费记录                       |
| DELETE | /api/expense/:id | 删除消费记录                       |

#### 统计分析接口

| 方法 | 路径                     | 说明             |
| ---- | ------------------------ | ---------------- |
| GET  | /api/statistics/summary  | 获取消费汇总数据 |
| GET  | /api/statistics/trend    | 获取消费趋势数据 |
| GET  | /api/statistics/category | 获取分类统计数据 |
| GET  | /api/statistics/member   | 获取成员统计数据 |
| POST | /api/statistics/analysis | 获取AI分析结果   |

#### 预算管理接口

| 方法 | 路径                 | 说明             |
| ---- | -------------------- | ---------------- |
| GET  | /api/budget          | 获取预算设置     |
| POST | /api/budget          | 设置预算         |
| GET  | /api/budget/progress | 获取预算执行情况 |

#### 分类管理接口

| 方法   | 路径              | 说明         |
| ------ | ----------------- | ------------ |
| GET    | /api/category     | 获取分类列表 |
| POST   | /api/category     | 创建分类     |
| PUT    | /api/category/:id | 更新分类     |
| DELETE | /api/category/:id | 删除分类     |

#### 成员管理接口

| 方法   | 路径            | 说明         |
| ------ | --------------- | ------------ |
| GET    | /api/member     | 获取成员列表 |
| POST   | /api/member     | 添加成员     |
| PUT    | /api/member/:id | 更新成员     |
| DELETE | /api/member/:id | 删除成员     |

#### AI功能接口

| 方法 | 路径                    | 说明             |
| ---- | ----------------------- | ---------------- |
| POST | /api/ai/recognize       | 智能识别消费信息 |
| POST | /api/ai/classify        | AI自动分类       |
| POST | /api/ai/image-recognize | 图片识别         |

---

## 6. 前端设计

### 6.1 页面布局结构

```
┌──────────────────────────────────────────────────────────────┐
│                         顶部导航栏 (60px)                      │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                  │
│   侧边栏    │                  主内容区域                       │
│  (200px)   │               (自适应宽度)                        │
│            │                                                  │
└────────────┴─────────────────────────────────────────────────┘
```

### 6.2 全局样式变量

```scss
// 主题色
$primary-color: #409eff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;

// 背景色
$bg-color: #f5f7fa;
$bg-color-page: #f0f2f5;

// 文字颜色
$text-primary: #303133;
$text-regular: #606266;
$text-secondary: #909399;

// 边框
$border-color: #dcdfe6;
$border-radius: 4px;

// 阴影
$box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
```

### 6.3 页面模块

#### 6.3.1 登录页面 (`/login`)

- 居中卡片式登录表单
- 用户名/密码输入框
- 登录按钮，支持回车键登录

#### 6.3.2 记账页面 (`/expense/create`)

- 输入方式选择：文字/语音/图片
- 文字输入区域（textarea）
- 语音录制按钮（Web Speech API）
- 图片上传区域（拖拽/点击上传）
- AI识别结果展示
- 分类选择（AI推荐 + 手动选择）
- 保存/取消按钮

#### 6.3.3 历史记录页面 (`/expense/history`)

- 筛选条件：日期范围、分类、成员、关键词
- 统计摘要卡片：总支出、记录数、平均、最高
- 记录列表表格：支持分页
- 编辑/删除操作

#### 6.3.4 统计分析页面 (`/statistics`)

- 时间选择器：本月/上月/自定义
- 消费趋势折线图（ECharts）
- 分类分布饼图
- 成员占比饼图
- AI分析洞察卡片：同比分析、异常检测、节省建议、趋势预测

#### 6.3.5 预算管理页面 (`/budget`)

- 月份选择器
- 总预算设置
- 分类预算分配（带进度条）
- 预算执行情况图表

#### 6.3.6 分类管理页面 (`/category`)

- 系统预设分类树（只读）
- 自定义分类树（可编辑删除）
- 新增/编辑分类弹窗

#### 6.3.7 成员管理页面 (`/member`)

- 成员卡片网格布局
- 添加成员按钮
- 编辑/删除成员弹窗

### 6.4 图表配置示例

#### 消费趋势折线图

```typescript
const trendChartOption = {
  tooltip: { trigger: "axis" },
  xAxis: { type: "category", data: [] },
  yAxis: { type: "value", axisLabel: { formatter: "¥{value}" } },
  series: [
    {
      name: "消费金额",
      type: "line",
      smooth: true,
      data: [],
      areaStyle: { opacity: 0.3 },
    },
  ],
};
```

#### 分类分布饼图

```typescript
const categoryChartOption = {
  tooltip: { trigger: "item", formatter: "{b}: ¥{c} ({d}%)" },
  legend: { orient: "vertical", right: 10 },
  series: [
    {
      type: "pie",
      radius: ["40%", "70%"],
      label: { show: true, formatter: "{b}\n{d}%" },
      data: [],
    },
  ],
};
```

---

## 7. AI功能集成

### 7.1 SCNet平台配置

| 配置项   | 值                              |
| -------- | ------------------------------- |
| API端点  | https://api.scnet.cn/api/llm/v1 |
| 认证方式 | Bearer Token (API Key)          |
| 接口规范 | 兼容OpenAI接口规范              |
| 推荐模型 | DeepSeek-R1-Distill-Qwen-7B     |

### 7.2 AI功能说明

#### 7.2.1 智能识别功能

**用途**: 解析用户自然语言输入，提取消费信息

**输入**: 用户消费描述文本

**输出**:

```json
{
  "amount": 30,
  "category": "餐饮",
  "subcategory": "火锅",
  "date": "2025-01-15",
  "time": "12:30",
  "members": ["用户本人", "妻子"],
  "description": "今天中午吃了30块火锅，和老婆一起",
  "confidence": 0.95
}
```

#### 7.2.2 AI自动分类功能

**用途**: 根据消费描述推荐分类

**输出**:

```json
{
  "recommendations": [
    { "category": "餐饮", "subcategory": "火锅", "confidence": 0.9 },
    { "category": "餐饮", "subcategory": "外卖", "confidence": 0.7 }
  ]
}
```

#### 7.2.3 消费分析功能

**用途**: 分析消费数据，提供洞察和建议

**输出**:

```json
{
  "monthOverMonth": {
    "currentMonth": 5000,
    "lastMonth": 4500,
    "change": 500,
    "changeRate": 0.111
  },
  "anomalies": [
    { "type": "超支", "category": "餐饮", "message": "餐饮支出超出预算500元" }
  ],
  "suggestions": ["本月餐饮支出比上月增加20%，建议减少外卖频率，多在家做饭"],
  "prediction": { "nextMonth": 5200, "trend": "上升" }
}
```

### 7.3 多模态输入支持

| 输入方式 | 技术方案       | 说明                  |
| -------- | -------------- | --------------------- |
| 文字     | SCNet LLM API  | 直接调用智能识别      |
| 语音     | Web Speech API | 浏览器原生语音转文字  |
| 图片     | Tesseract.js   | OCR识别后调用智能识别 |

### 7.4 服务端实现示例

```typescript
// server/utils/ai.ts
import OpenAI from "openai";

export class AIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.SCNET_API_KEY,
      baseURL: process.env.SCNET_API_URL,
    });
  }

  async recognizeExpense(text: string) {
    const response = await this.client.chat.completions.create({
      model: process.env.SCNET_MODEL || "gpt-3.5-turbo",
      messages: [
        { role: "system", content: RECOGNIZE_SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });
    return JSON.parse(response.choices[0].message.content || "{}");
  }
}
```

---

## 8. 安全与权限

### 8.1 认证机制

| 项目        | 配置                                |
| ----------- | ----------------------------------- |
| 认证方式    | JWT Token                           |
| Token存储   | localStorage                        |
| Token有效期 | 7天                                 |
| Token传递   | Authorization Header (Bearer Token) |

### 8.2 密码安全

- 使用bcrypt加密存储
- 密码要求：最少8个字符，必须包含字母和数字
- 不记录明文密码

### 8.3 安全防护

| 威胁     | 防护措施                               |
| -------- | -------------------------------------- |
| XSS      | 前端输出HTML转义，Element Plus自带防护 |
| CSRF     | JWT Token认证天然防御                  |
| SQL注入  | 参数化查询，ORM工具                    |
| 暴力破解 | 限制请求频率（可选）                   |

### 8.4 数据权限

- **数据隔离**: 不做隔离，所有家庭成员可查看所有消费数据
- **操作权限**: 所有登录成员可添加、编辑、删除消费记录

### 8.5 成员管理

- 第一个注册用户为管理员
- 管理员可以添加新成员
- 新成员由管理员设置用户名和初始密码
- 成员可以修改自己的密码

---

## 9. 环境配置

### 9.1 环境变量

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=family_expense
DB_USER=root
DB_PASSWORD=your_password

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# SCNet AI配置
SCNET_API_KEY=your_scnet_api_key
SCNET_API_URL=https://api.scnet.cn/api/llm/v1
SCNET_MODEL=DeepSeek-R1-Distill-Qwen-7B

# 应用配置
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 9.2 依赖安装

```bash
npm install openai
npm install tesseract.js
npm install bcrypt
```

---

## 10. 系统提示词

### 10.1 AI角色定义

```
你是一个专业的家庭消费记账AI助手，精通消费分析和财务管理。你的职责是帮助用户高效记录消费、智能分类、分析消费趋势，并提供节省建议。
```

### 10.2 智能识别提示词

```
你是一个专业的消费信息提取助手。你的任务是从用户的消费描述中提取关键信息。

提取规则：
1. 金额：识别数字金额，支持"30块"、"30元"、"30"等格式
2. 日期：识别时间表达，如"今天"、"昨天"、"1月15日"等，转换为YYYY-MM-DD格式
3. 时间：识别时间表达，如"中午"、"12:30"等，转换为HH:MM格式
4. 类别：根据消费内容推断消费大类
5. 子类别：根据消费内容推断具体子类别
6. 成员：识别消费参与人员
7. 描述：保留原始描述或生成简洁描述

输出格式：JSON
置信度：基于提取的准确性，返回0-1之间的数值
```

### 10.3 自动分类提示词

```
你是一个专业的消费分类助手。你的任务是根据消费描述推荐合适的分类。

分类原则：
1. 根据消费内容的主关键词判断分类
2. 考虑消费金额对分类的影响
3. 参考常见的消费分类模式
4. 考虑消费场景（堂食、外卖、打包等）

输出格式：JSON
推荐数量：2-3个最可能的分类
排序方式：按置信度从高到低
```

### 10.4 消费分析提示词

```
你是一个专业的消费分析助手。你的任务是分析用户的消费数据，提供洞察和建议。

分析任务：
1. 同比分析：对比本月和上月的消费变化
2. 异常检测：识别超出平均值30%的消费、超出预算的消费
3. 节省建议：基于消费习惯生成具体可操作的建议
4. 趋势预测：基于历史数据预测下月消费

分析原则：
- 基于数据说话，避免主观臆断
- 建议要具体可操作，避免空泛
- 关注用户的财务健康
```

### 10.5 用户欢迎语

```
欢迎使用家庭消费记账系统！👋

我是您的AI记账助手，可以帮您：
✨ 智能识别消费信息（支持文字、语音、图片）
🎯 自动推荐消费分类
📊 分析消费趋势，提供节省建议

快速开始：
- 点击"记账"开始记录消费
- 点击"统计"查看消费分析
- 点击"预算"设置预算目标
```

---

## 附录

### A. 应用场景示例

#### 场景1：日常消费记录

用户在超市购物后，打开记账页面，通过语音输入"今天中午吃了30块火锅，和老婆一起"，AI自动识别出金额30、类别餐饮、备注"和老婆一起"，并推荐多个分类"餐饮 > 火锅"、"餐饮 > 外卖"，用户选择"餐饮 > 火锅"并保存。

#### 场景2：月度消费分析

用户每月月底进入统计页面，选择本月数据，查看本月消费趋势图表，发现餐饮支出较高，AI分析结果提示"本月餐饮支出比上月增加20%，建议减少外卖频率，多在家做饭"。

#### 场景3：预算管理

用户月初进入预算设置页面，设置本月总预算5000元，其中餐饮2000元、交通1000元、购物1000元、其他1000元。月中查看预算执行情况，发现餐饮已超支，系统提醒"餐饮预算已超支200元，请注意控制"。

### B. 待确认事项

1. 数据库表结构细节优化
2. 主题风格是否需要深色模式
3. 移动端是否需要独立布局
4. 国际化是否需要多语言支持

---

> 文档版本：v1.0  
> 最后更新：2025-01-15  
> 维护者：开发团队
