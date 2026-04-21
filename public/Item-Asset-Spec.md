# 物品资产管理模块设计文档

## 1. 功能概述

### 1.1 背景

参考「归否」App的设计理念，为家庭记账应用增加物品资产管理功能。通过记录物品的全生命周期，计算日均成本（CPD），帮助用户量化物品价值，建立与物品的情感链接，同时更好地掌控家庭资产。

### 1.2 核心理念

> "每件物品都有属于自己的生命故事"

- **物品的"人生档案"**：从购买日期起，为每件物品建立"成长记录"
- **每日价值计算**：通过总金额与使用天数，感受每一天物品带来的实际价值
- **全生命周期管理**：记录每一件物品从"购入"到"退役"的旅程

### 1.3 目标用户

- 希望了解物品真实价值的用户
- 想要控制消费欲望的用户
- 需要管理家庭资产的用户
- 喜欢记录生活点滴的用户

---

## 2. 功能设计

### 2.1 物品状态流转

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  想买    │ -> │  购入    │ -> │  使用中  │ -> │  闲置    │ -> │  退役    │
│ (wish)   │    │(purchased)│   │(in_use) │    │(idle)   │    │(retired)│
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                    │                              │
                    │         ┌─────────┐         │
                    └──────-> │  维修    │ <───────┘
                              │(repair) │
                              └─────────┘
```

### 2.2 状态说明

| 状态   | 英文标识  | 说明                         |
| ------ | --------- | ---------------------------- |
| 想买   | wish      | 心愿清单，记录想要购买的物品 |
| 购入   | purchased | 已购买但尚未开始使用         |
| 使用中 | in_use    | 正在使用的物品               |
| 维修   | repair    | 物品正在维修中               |
| 闲置   | idle      | 不再使用但保留的物品         |
| 退役   | retired   | 已出售、赠送或丢弃的物品     |

### 2.3 核心功能模块

#### 2.3.1 物品录入

**基础信息**

- 物品名称
- 物品分类（电子产品、家电、服饰、书籍、收藏品等）
- 购买日期
- 购买金额
- 购买渠道
- 物品图片（支持多图）
- 备注/标签

**扩展信息**

- 品牌
- 型号
- 序列号
- 保修期限
- 预期使用寿命
- 存放位置

#### 2.3.2 日均成本计算（CPD）

```
日均成本 = 购买金额 / 使用天数

使用天数 = 当前日期 - 开始使用日期 + 1
```

**展示形式**

- 实时日均成本
- 日均成本趋势图
- 与同类物品对比
- "回本"预测（当日均成本低于某阈值时提示）

#### 2.3.3 物品时间轴

记录物品的重要事件：

| 事件类型 | 说明                   |
| -------- | ---------------------- |
| 购入     | 记录购买信息           |
| 开始使用 | 开始计算使用天数       |
| 维修     | 记录维修费用和原因     |
| 配件     | 添加配件或升级         |
| 闲置     | 标记为闲置状态         |
| 退役     | 记录退役原因和处理方式 |

#### 2.3.4 资产统计

**总览**

- 物品总数
- 资产总价值
- 平均使用天数
- 总日均成本

**分类统计**

- 按分类查看资产占比
- 各分类日均成本对比
- 高价值物品排行
- 低使用率物品提醒

**折旧分析**

- 物品折旧曲线
- 残值估算
- 折旧率统计

---

## 3. 数据库设计

### 3.1 物品表 (items)

```sql
CREATE TABLE items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  name VARCHAR(100) NOT NULL COMMENT '物品名称',
  category_id INT COMMENT '物品分类ID',
  status ENUM('wish', 'purchased', 'in_use', 'repair', 'idle', 'retired') DEFAULT 'purchased' COMMENT '物品状态',

  -- 购买信息
  purchase_date DATE COMMENT '购买日期',
  purchase_amount DECIMAL(10, 2) COMMENT '购买金额',
  purchase_channel VARCHAR(100) COMMENT '购买渠道',

  -- 物品信息
  brand VARCHAR(50) COMMENT '品牌',
  model VARCHAR(100) COMMENT '型号',
  serial_number VARCHAR(100) COMMENT '序列号',
  warranty_end_date DATE COMMENT '保修截止日期',
  expected_lifespan INT COMMENT '预期使用寿命(月)',
  storage_location VARCHAR(100) COMMENT '存放位置',

  -- 使用信息
  start_use_date DATE COMMENT '开始使用日期',
  end_use_date DATE COMMENT '退役日期',

  -- 退役信息
  retire_reason VARCHAR(255) COMMENT '退役原因',
  retire_type ENUM('sold', 'gifted', 'discarded', 'lost') COMMENT '退役方式',
  retire_amount DECIMAL(10, 2) COMMENT '出售金额',

  -- 其他
  images JSON COMMENT '图片URL数组',
  tags JSON COMMENT '标签数组',
  notes TEXT COMMENT '备注',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_category_id (category_id),
  INDEX idx_purchase_date (purchase_date)
) COMMENT '物品表';
```

### 3.2 物品事件表 (item_events)

```sql
CREATE TABLE item_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL COMMENT '物品ID',
  event_type ENUM('purchase', 'start_use', 'repair', 'accessory', 'idle', 'retire', 'note') NOT NULL COMMENT '事件类型',
  event_date DATE NOT NULL COMMENT '事件日期',
  title VARCHAR(100) COMMENT '事件标题',
  description TEXT COMMENT '事件描述',
  amount DECIMAL(10, 2) COMMENT '相关金额(维修费/配件费等)',
  images JSON COMMENT '图片URL数组',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_item_id (item_id),
  INDEX idx_event_date (event_date)
) COMMENT '物品事件表';
```

### 3.3 物品分类表 (item_categories)

```sql
CREATE TABLE item_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '分类名称',
  icon VARCHAR(50) COMMENT '图标',
  parent_id INT COMMENT '父分类ID',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_parent_id (parent_id)
) COMMENT '物品分类表';
```

### 3.4 预设分类数据

```sql
INSERT INTO item_categories (name, icon, parent_id, sort_order) VALUES
-- 一级分类
('电子产品', 'Monitor', NULL, 1),
('家电', 'House', NULL, 2),
('服饰', 'Shirt', NULL, 3),
('书籍', 'Notebook', NULL, 4),
('收藏品', 'Trophy', NULL, 5),
('运动户外', 'Basketball', NULL, 6),
('乐器', 'Headset', NULL, 7),
('家具', 'Grid', NULL, 8),
('其他', 'More', NULL, 99);

-- 电子产品子分类
INSERT INTO item_categories (name, icon, parent_id, sort_order) VALUES
('手机', 'Iphone', 1, 1),
('电脑', 'Monitor', 1, 2),
('平板', 'Grid', 1, 3),
('相机', 'Camera', 1, 4),
('耳机', 'Headset', 1, 5),
('手表', 'Clock', 1, 6),
('游戏机', 'Gamepad', 1, 7);
```

---

## 4. API 设计

### 4.1 物品管理

| 方法   | 路径                  | 说明         |
| ------ | --------------------- | ------------ |
| GET    | /api/items            | 获取物品列表 |
| GET    | /api/items/:id        | 获取物品详情 |
| POST   | /api/items            | 创建物品     |
| PUT    | /api/items/:id        | 更新物品     |
| DELETE | /api/items/:id        | 删除物品     |
| PUT    | /api/items/:id/status | 更新物品状态 |

### 4.2 物品事件

| 方法   | 路径                           | 说明             |
| ------ | ------------------------------ | ---------------- |
| GET    | /api/items/:id/events          | 获取物品事件列表 |
| POST   | /api/items/:id/events          | 添加物品事件     |
| PUT    | /api/items/:id/events/:eventId | 更新事件         |
| DELETE | /api/items/:id/events/:eventId | 删除事件         |

### 4.3 统计分析

| 方法 | 路径                         | 说明         |
| ---- | ---------------------------- | ------------ |
| GET  | /api/items/stats/overview    | 获取资产总览 |
| GET  | /api/items/stats/category    | 按分类统计   |
| GET  | /api/items/stats/cpd-ranking | CPD排行榜    |
| GET  | /api/items/stats/low-usage   | 低使用率物品 |

---

## 5. 页面设计

### 5.1 页面结构

```
物品资产
├── 物品列表页
│   ├── 筛选（状态、分类）
│   ├── 排序（CPD、金额、使用天数）
│   └── 物品卡片列表
├── 物品详情页
│   ├── 基础信息
│   ├── CPD展示
│   ├── 时间轴
│   └── 操作按钮
├── 添加/编辑物品页
│   ├── 基础信息表单
│   ├── 图片上传
│   └── 扩展信息
└── 统计分析页
    ├── 资产总览
    ├── 分类占比
    └── 趋势图表
```

### 5.2 物品卡片设计

```
┌────────────────────────────────────────┐
│ ┌──────┐                               │
│ │ 图片 │  iPhone 15 Pro Max            │
│ │      │  电子产品 > 手机               │
│ └──────┘  使用中 · 已陪伴 365 天        │
│                                        │
│  购入金额: ¥9,999                       │
│  日均成本: ¥27.39/天                    │
│                                        │
│  [查看详情]                             │
└────────────────────────────────────────┘
```

### 5.3 时间轴设计

```
○ 购入
│  2024-01-01 · ¥9,999 · Apple Store
│
● 开始使用
│  2024-01-02
│
○ 更换电池
│  2024-12-01 · ¥688
│
○ 至今
   已使用 365 天
```

---

## 6. 与记账模块联动

### 6.1 消费记录关联

- 记账时可选择关联物品
- 维修费用自动记录到物品事件
- 配件购买自动关联

### 6.2 数据互通

- 物品分类与消费分类可映射
- 购买物品时自动创建消费记录
- 资产统计与消费统计联动展示

---

## 7. 实现计划

### Phase 1: 基础功能 (v1.3)

- [ ] 数据库表创建
- [ ] 物品 CRUD API
- [ ] 物品列表页
- [ ] 物品详情页
- [ ] CPD 计算

### Phase 2: 增强功能 (v1.4)

- [ ] 物品事件时间轴
- [ ] 图片上传
- [ ] 状态流转
- [ ] 分类管理

### Phase 3: 统计分析 (v1.5)

- [ ] 资产总览
- [ ] 分类统计
- [ ] 趋势图表
- [ ] 低使用率提醒

### Phase 4: 高级功能 (v1.6)

- [ ] 与记账模块联动
- [ ] AI 物品识别
- [ ] 数据导出
- [ ] 保修到期提醒

---

## 8. 参考设计

本功能设计参考了「归否」App 的核心理念：

- 物品全生命周期管理
- 日均成本计算（CPD）
- 多维资产透视
- 情感化设计

官网：https://guiwuplus.uri1.cc/

---

## 更新记录

| 版本 | 日期       | 说明         |
| ---- | ---------- | ------------ |
| v1.0 | 2026-04-20 | 初版设计文档 |
