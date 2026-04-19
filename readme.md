# 家庭财务管家

一个现代化的家庭消费记账Web应用，支持多用户共享账本，通过AI技术增强用户体验，实现消费明细录入、分类汇总、数据分析、预算管理、人情往来、车辆管理等核心功能。

## 功能特性

### 核心功能

- **智能记账** - 支持文字、语音、图片多模态输入，AI自动识别消费信息
- **智能分类** - AI根据消费描述自动推荐分类，减少手动操作
- **数据洞察** - AI分析消费趋势，提供节省建议和异常检测
- **预算管理** - 设置每月预算，实时监控预算执行情况
- **人情往来** - 管理出礼收礼记录，统计人情账目
- **车辆管理** - 管理家庭车辆，记录加油充电，自动同步消费记录
- **成员管理** - 家庭成员管理，支持成员消费统计
- **移动适配** - 响应式设计，完美支持移动端和桌面端

### 功能模块

```
家庭财务管家
├── 认证模块 - 用户登录、修改密码、退出登录
├── 记账模块 - 消费录入、AI智能识别、历史记录管理
├── 统计模块 - 消费趋势图表、分类分布分析、成员占比分析
├── 预算模块 - 总预算设置、分类预算分配、预算执行监控
├── 人情模块 - 人情记录管理、人情统计分析
├── 车辆模块 - 车辆管理、加油充电记录、里程统计
└── 成员模块 - 成员管理、成员消费统计
```

## 技术栈

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

## 快速开始

### 环境要求

- Node.js >= 18.x
- MySQL >= 8.0
- pnpm >= 8.x (推荐)

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd family_expense_app
```

2. **安装依赖**

```bash
pnpm install
```

3. **配置环境变量**

复制环境变量示例文件并修改：

```bash
cp .env.example .env.development
```

编辑 `.env.development` 文件，配置数据库连接和AI API：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=family_expense

# JWT配置
JWT_SECRET=your_jwt_secret

# AI配置
AI_API_KEY=your_api_key
AI_BASE_URL=https://api.example.com/v1
AI_MODEL=gpt-4
```

4. **初始化数据库**

```bash
# 登录MySQL执行初始化脚本
mysql -u root -p < database/init.sql

# 添加车辆管理模块表
mysql -u root -p family_expense < database/add_vehicle_tables.sql

# 添加人情管理模块表
mysql -u root -p family_expense < database/add_gifting_tables.sql

# 添加加油充电记录关联消费记录字段
mysql -u root -p family_expense < database/add_fuel_expense_link.sql
```

5. **启动开发服务器**

```bash
pnpm dev
```

6. **访问应用**

打开浏览器访问 `http://localhost:3000`

默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

## 项目结构

```
family_expense_app/
├── pages/                      # 页面组件（Nuxt自动路由）
│   ├── login.vue              # 登录页
│   ├── index.vue              # 首页
│   ├── expense/               # 记账模块
│   ├── statistics/            # 统计分析
│   ├── budget/                # 预算管理
│   ├── category/              # 分类管理
│   ├── member/                # 成员管理
│   ├── gift/                  # 人情管理
│   └── vehicle/               # 车辆管理
├── components/                # 公共组件
│   ├── layout/                # 布局组件
│   ├── expense/               # 消费相关组件
│   ├── gift/                  # 人情相关组件
│   └── vehicle/               # 车辆相关组件
├── composables/               # 组合式函数
├── stores/                    # Pinia状态管理
├── server/                    # 服务端
│   ├── api/                   # API路由
│   └── utils/                 # 服务端工具
├── database/                  # 数据库脚本
├── assets/styles/             # 全局样式
├── types/                     # TypeScript类型
├── utils/                     # 工具函数
├── middleware/                # 中间件
├── plugins/                   # 插件
└── layouts/                   # 布局文件
```

## API接口

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **认证方式**: JWT Token (Bearer Token)

### 主要接口

| 模块 | 方法 | 路径 | 说明 |
| ---- | ---- | ---- | ---- |
| 认证 | POST | /api/auth/login | 用户登录 |
| 认证 | GET | /api/auth/me | 获取当前用户信息 |
| 消费 | GET | /api/expense | 获取消费记录列表 |
| 消费 | POST | /api/expense | 创建消费记录 |
| 统计 | GET | /api/statistics/summary | 获取消费汇总数据 |
| 预算 | GET | /api/budget | 获取预算设置 |
| 分类 | GET | /api/category | 获取分类列表 |
| 成员 | GET | /api/member | 获取成员列表 |
| 人情 | GET | /api/gift | 获取人情记录列表 |
| 人情 | GET | /api/gift/statistics | 获取人情统计数据 |
| 车辆 | GET | /api/vehicle | 获取车辆列表 |
| 加油充电 | GET | /api/vehicle/fuel | 获取加油充电记录 |

## 数据库设计

### 核心表

| 表名 | 说明 |
| ---- | ---- |
| users | 用户表 |
| members | 成员表 |
| categories | 分类表 |
| expenses | 消费记录表 |
| budgets | 预算表 |
| gifts | 人情记录表 |
| vehicles | 车辆表 |
| vehicle_fuel_records | 加油充电记录表 |

### 系统预设分类

| 大类 | 子分类 |
| ---- | ------ |
| 餐饮 | 火锅、烧烤、外卖、正餐、零食、饮料、其他餐饮 |
| 交通 | 打车、地铁、公交、加油、停车、其他交通 |
| 购物 | 超市、网购、服装、电子产品、家居用品、其他购物 |
| 娱乐 | 电影、KTV、游戏、旅游、其他娱乐 |
| 医疗 | 看病、买药、体检、其他医疗 |
| 教育 | 培训、书籍、课程、其他教育 |
| 居住 | 房租、水电、物业、其他居住 |
| 出礼 | 婚礼、生日、丧礼、满月、乔迁、其他出礼 |
| 收礼 | 婚礼、生日、丧礼、满月、乔迁、其他收礼 |
| 其他 | 其他消费 |

## 特色功能

### 加油充电自动记账

当创建或更新加油/充电记录时，系统会自动在消费记录中创建或更新对应的记录：
- 分类自动选择"交通"
- 描述格式：`加油 - 车牌号 (品牌型号)` 或 `充电 - 车牌号 (品牌型号)`
- **同步创建**：新增加油充电记录时，自动创建消费记录
- **同步更新**：更新加油充电记录时，自动更新关联的消费记录
- **同步删除**：删除加油充电记录时，自动删除关联的消费记录

### 人情往来自动记账

当选择"出礼"分类创建消费记录时，系统会自动创建人情记录：
- **自动关联**：消费记录与人情记录双向关联（expense_id / gift_id）
- **同步创建**：新增出礼消费记录时，自动创建人情记录
- **同步更新**：更新出礼人情记录时，自动更新关联的消费记录
- **同步删除**：删除人情记录时，自动删除关联的消费记录

### 人情统计

- 支持现金和实物两种支付类型
- 自动统计出礼/收礼总额（现金 + 实物价值）
- 按事由和关联人进行明细统计
- 计算净支出金额

### ⚠️ 注意事项：创建逻辑说明

| 操作 | 是否创建消费记录 | 是否创建人情记录 | 是否创建加油充电记录 |
|------|:----------------:|:----------------:|:--------------------:|
| 消费记录创建（选择出礼分类） | - | ✅ 是 | ❌ 否 |
| 人情记录创建（出礼类型） | ❌ 否 | - | - |
| 人情记录创建（收礼类型） | ❌ 否 | - | - |
| 加油充电记录创建 | ✅ 是 | ❌ 否 | - |

**重要说明**：
- 消费记录创建时，只有选择"出礼"分类才会自动创建人情记录
- 人情记录创建时，**不会**自动创建消费记录（与加油充电模块逻辑不同）
- 加油充电记录创建时，会自动创建消费记录（分类为"交通"）

## 移动端适配

- 响应式布局，自动适配不同设备
- 底部导航栏，移动端专属交互
- 触摸优化的按钮和表单
- 支持 iOS 安全区域

## 开发指南

### 命名规范

- 函数名称通过下划线进行拼接：`get_user_info`
- 字段命名通过下划线拼接，首个字段为数据类型：`num_img_type`、`str_user_name`

### 代码风格

- 使用 ESLint + Prettier 进行代码格式化
- 函数需要添加注释说明

### 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

## 许可证

MIT License

---

> 维护者：开发团队
