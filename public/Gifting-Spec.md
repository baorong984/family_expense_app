# 人情模块需求文档

## 概述

人情模块是家庭消费记账系统的扩展功能，用于记录和管理家庭成员的人情往来（出礼、收礼等）。该模块与现有的消费记录系统深度集成，提供完整的人情管理功能。

## 业务背景

在日常生活中，家庭成员会参与各种人情往来，如：
- **出礼**：婚礼、生日、丧礼、满月宴等场合的礼金或实物礼物
- **收礼**：收到他人的礼金或礼物
- **人情管理**：记录人情往来的详情，便于后续回礼或统计

当前系统的消费记录功能可以记录出礼支出，但无法：
1. 区分消费记录是人情支出还是普通消费
2. 记录收礼信息
3. 追踪人情往来的关联关系
4. 统计人情支出和收入

因此需要一个人情模块来专门管理这部分数据。

## 核心功能

### 1. 人情分类识别
在现有的分类体系中，新增"人情"大类，包含以下子分类：
- **出礼**
  - 婚礼
  - 生日
  - 丧礼
  - 满月
  - 乔迁
  - 其他出礼
- **收礼**
  - 婚礼
  - 生日
  - 丧礼
  - 满月
  - 乔迁
  - 其他收礼

### 2. 自动归档机制
当用户在记账时选择"人情"分类下的"出礼"子分类时：
- 自动将该消费记录标记为人情出礼记录
- 在人情模块中自动创建对应的人情记录
- 允许用户补充人情记录的详细信息（类型、关联人等）

### 3. 人情记录管理

#### 3.1 出礼记录
记录所有的人情出礼信息，包括：
- **基本信息**
  - 金额
  - 出礼日期
  - 出礼时间（可选）
  - 出礼类型（现金/实物）
  - 关联人（礼金收礼人或礼物接收方）
  - 事由（婚礼、生日、丧礼等）
  - 备注
  - 创建时间
  - 修改时间
  - 创建者
- **状态信息**
  - 是否已回礼（标记是否已收到对方的人情往来）
  - 回礼记录（关联到收礼记录）

#### 3.2 收礼记录
记录所有的人情收礼信息，包括：
- **基本信息**
  - 金额（如果是现金）
  - 收礼日期
  - 收礼时间（可选）
  - 收礼类型（现金/实物）
  - 关联人（礼金赠送人或礼物赠送方）
  - 事由（婚礼、生日、丧礼等）
  - 备注
  - 创建时间
  - 修改时间
  - 创建者
- **关联信息**
  - 对应的出礼记录（如果是回礼）

#### 3.3 人情记录列表
展示所有的人情记录（出礼+收礼），支持：
- 筛选：按日期范围、类型、关联人筛选
- 排序：按日期、金额排序
- 统计：汇总出礼总额、收礼总额、净支出
- 导出：导出为人情记录Excel

### 4. 人情统计分析
提供人情往来的统计和分析功能：
- **收支统计**
  - 出礼总额
  - 收礼总额
  - 净支出（出礼-收礼）
  - 出礼次数
  - 收礼次数
- **趋势分析**
  - 按月查看人情支出趋势
  - 按事由类型统计（婚礼、生日等）
  - 按关联人统计
- **关联关系**
  - 展示与某个人的所有人情往来
  - 计算与某个人的净人情往来

### 5. 人情提醒功能
基于人情记录提供智能提醒：
- **回礼提醒**
  - 当收到别人的礼金/礼物时，提醒后续需要回礼
  - 可设置回礼期限提醒
- **重要日期提醒**
  - 提醒重要的人情日期（如好友婚礼、生日等）
  - 支持手动添加人情事件提醒

## 数据模型设计

### 1. 数据库表结构

#### gifts - 人情记录表
```sql
CREATE TABLE `gifts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `expense_id` INT(11) DEFAULT NULL COMMENT '关联的消费记录ID（出礼记录）',
  `gift_type` ENUM('outgoing', 'incoming') NOT NULL COMMENT '类型：outgoing=出礼，incoming=收礼',
  `payment_type` ENUM('cash', 'item') NOT NULL COMMENT '支付类型：cash=现金，item=实物',
  `amount` DECIMAL(10,2) DEFAULT NULL COMMENT '金额（现金类型必填）',
  `item_name` VARCHAR(200) DEFAULT NULL COMMENT '实物名称（实物类型必填）',
  `item_value` DECIMAL(10,2) DEFAULT NULL COMMENT '实物价值（可选）',
  `related_person` VARCHAR(100) NOT NULL COMMENT '关联人姓名',
  `occasion` VARCHAR(50) NOT NULL COMMENT '事由（婚礼、生日、丧礼、满月、乔迁等）',
  `expense_date` DATE NOT NULL COMMENT '人情日期',
  `expense_time` TIME DEFAULT NULL COMMENT '人情时间',
  `remarks` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `is_returned` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已回礼（出礼记录专用）',
  `return_gift_id` INT(11) DEFAULT NULL COMMENT '关联的回礼记录ID',
  `created_by` INT(11) NOT NULL COMMENT '创建者',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_id` (`expense_id`),
  KEY `idx_gift_type` (`gift_type`),
  KEY `idx_expense_date` (`expense_date`),
  KEY `idx_related_person` (`related_person`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_gift_expense` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_gift_return` FOREIGN KEY (`return_gift_id`) REFERENCES `gifts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_gift_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='人情记录表';
```

#### gift_reminders - 人情提醒表
```sql
CREATE TABLE `gift_reminders` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `reminder_type` ENUM('return_gift', 'occasion') NOT NULL COMMENT '提醒类型：return_gift=回礼提醒，occasion=事由提醒',
  `gift_id` INT(11) DEFAULT NULL COMMENT '关联的人情记录ID（回礼提醒）',
  `reminder_date` DATE NOT NULL COMMENT '提醒日期',
  `reminder_message` VARCHAR(500) NOT NULL COMMENT '提醒内容',
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已完成',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `created_by` INT(11) NOT NULL COMMENT '创建者',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reminder_type` (`reminder_type`),
  KEY `idx_reminder_date` (`reminder_date`),
  KEY `idx_gift_id` (`gift_id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_reminder_gift` FOREIGN KEY (`gift_id`) REFERENCES `gifts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reminder_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='人情提醒表';
```

### 2. 分类数据更新

在现有的 `categories` 表中添加人情分类：

```sql
-- 添加人情大类
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('人情', NULL, 1, 9);

-- 假设人情大类的ID为9，添加出礼子分类
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('婚礼', 9, 1, 1),
('生日', 9, 1, 2),
('丧礼', 9, 1, 3),
('满月', 9, 1, 4),
('乔迁', 9, 1, 5),
('其他出礼', 9, 1, 6);

-- 添加收礼子分类（作为独立的大类或子分类）
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('收礼', NULL, 1, 10);

-- 收礼子分类
INSERT INTO `categories` (`name`, `parent_id`, `is_system`, `sort_order`) VALUES
('婚礼', 10, 1, 1),
('生日', 10, 1, 2),
('丧礼', 10, 1, 3),
('满月', 10, 1, 4),
('乔迁', 10, 1, 5),
('其他收礼', 10, 1, 6);
```

### 3. 数据关系图

```
expenses (消费记录表)
  └─ 1:1 → gifts (人情记录表) - 出礼记录

gifts (人情记录表)
  ├─ N:1 → expenses (消费记录表) - 关联的出礼消费
  ├─ N:1 → users (用户表) - 创建者
  └─ 1:1 → gifts (人情记录表) - 回礼关联（自关联）

gift_reminders (人情提醒表)
  ├─ N:1 → gifts (人情记录表) - 关联的人情记录
  └─ N:1 → users (用户表) - 创建者
```

## API接口设计

### 1. 人情记录相关接口

#### 1.1 获取人情记录列表
**接口地址**: `GET /api/gift`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| page_size | number | 否 | 每页数量，默认20 |
| gift_type | string | 否 | 类型（outgoing=出礼，incoming=收礼） |
| start_date | string | 否 | 开始日期（YYYY-MM-DD） |
| end_date | string | 否 | 结束日期（YYYY-MM-DD） |
| related_person | string | 否 | 关联人姓名（模糊搜索） |
| occasion | string | 否 | 事由 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "gift_type": "outgoing",
        "payment_type": "cash",
        "amount": 500.00,
        "related_person": "张三",
        "occasion": "婚礼",
        "expense_date": "2025-01-15",
        "expense_time": "12:00:00",
        "remarks": "张三结婚",
        "is_returned": 0,
        "return_gift_id": null,
        "expense_id": 100,
        "created_at": "2025-01-15T12:00:00.000Z",
        "updated_at": "2025-01-15T12:00:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "page_size": 20
  },
  "message": "获取成功",
  "code": 200
}
```

#### 1.2 创建人情记录
**接口地址**: `POST /api/gift`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "gift_type": "outgoing",
  "payment_type": "cash",
  "amount": 500.00,
  "related_person": "张三",
  "occasion": "婚礼",
  "expense_date": "2025-01-15",
  "expense_time": "12:00:00",
  "remarks": "张三结婚"
}
```

**参数说明**:
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| gift_type | string | 是 | 类型（outgoing=出礼，incoming=收礼） |
| payment_type | string | 是 | 支付类型（cash=现金，item=实物） |
| amount | number | 否 | 金额（现金类型必填） |
| item_name | string | 否 | 实物名称（实物类型必填） |
| item_value | number | 否 | 实物价值（可选） |
| related_person | string | 是 | 关联人姓名 |
| occasion | string | 是 | 事由 |
| expense_date | string | 是 | 人情日期（YYYY-MM-DD） |
| expense_time | string | 否 | 人情时间（HH:mm:ss） |
| remarks | string | 否 | 备注 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "gift_type": "outgoing",
    "payment_type": "cash",
    "amount": 500.00,
    "related_person": "张三",
    "occasion": "婚礼",
    "expense_date": "2025-01-15",
    "expense_time": "12:00:00",
    "remarks": "张三结婚",
    "is_returned": 0,
    "created_at": "2025-01-15T12:00:00.000Z"
  },
  "message": "创建成功",
  "code": 200
}
```

#### 1.3 获取单条人情记录
**接口地址**: `GET /api/gift/:id`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "gift_type": "outgoing",
    "payment_type": "cash",
    "amount": 500.00,
    "related_person": "张三",
    "occasion": "婚礼",
    "expense_date": "2025-01-15",
    "expense_time": "12:00:00",
    "remarks": "张三结婚",
    "is_returned": 0,
    "return_gift_id": null,
    "expense_id": 100,
    "created_by": 1,
    "created_at": "2025-01-15T12:00:00.000Z",
    "updated_at": "2025-01-15T12:00:00.000Z"
  },
  "message": "获取成功",
  "code": 200
}
```

#### 1.4 更新人情记录
**接口地址**: `PUT /api/gift/:id`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "amount": 600.00,
  "related_person": "张三",
  "occasion": "婚礼",
  "expense_date": "2025-01-15",
  "remarks": "张三结婚，追加礼金"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "gift_type": "outgoing",
    "payment_type": "cash",
    "amount": 600.00,
    "related_person": "张三",
    "occasion": "婚礼",
    "expense_date": "2025-01-15",
    "remarks": "张三结婚，追加礼金",
    "updated_at": "2025-01-15T13:00:00.000Z"
  },
  "message": "更新成功",
  "code": 200
}
```

#### 1.5 删除人情记录
**接口地址**: `DELETE /api/gift/:id`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": null,
  "message": "删除成功",
  "code": 200
}
```

#### 1.6 标记回礼状态
**接口地址**: `PUT /api/gift/:id/return`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "is_returned": true,
  "return_gift_id": 2
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "is_returned": 1,
    "return_gift_id": 2,
    "updated_at": "2025-01-15T14:00:00.000Z"
  },
  "message": "更新成功",
  "code": 200
}
```

### 2. 人情统计相关接口

#### 2.1 获取人情统计数据
**接口地址**: `GET /api/gift/statistics`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| start_date | string | 是 | 开始日期（YYYY-MM-DD） |
| end_date | string | 是 | 结束日期（YYYY-MM-DD） |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "outgoing": {
      "total_amount": 5000.00,
      "total_count": 10,
      "cash_amount": 4000.00,
      "item_count": 6
    },
    "incoming": {
      "total_amount": 3000.00,
      "total_count": 8,
      "cash_amount": 2500.00,
      "item_count": 3
    },
    "net_outgoing": 2000.00,
    "occasion_breakdown": [
      {
        "occasion": "婚礼",
        "outgoing_amount": 3000.00,
        "outgoing_count": 5,
        "incoming_amount": 1500.00,
        "incoming_count": 3
      },
      {
        "occasion": "生日",
        "outgoing_amount": 2000.00,
        "outgoing_count": 5,
        "incoming_amount": 1500.00,
        "incoming_count": 5
      }
    ],
    "person_breakdown": [
      {
        "related_person": "张三",
        "outgoing_amount": 1000.00,
        "outgoing_count": 2,
        "incoming_amount": 500.00,
        "incoming_count": 1,
        "net_amount": 500.00
      }
    ]
  },
  "message": "获取成功",
  "code": 200
}
```

#### 2.2 导出人情记录
**接口地址**: `GET /api/gift/export`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| start_date | string | 是 | 开始日期（YYYY-MM-DD） |
| end_date | string | 是 | 结束日期（YYYY-MM-DD） |
| gift_type | string | 否 | 类型（outgoing=出礼，incoming=收礼） |

**响应**:
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="人情记录_20250101_20250131.xlsx"`

### 3. 人情提醒相关接口

#### 3.1 获取人情提醒列表
**接口地址**: `GET /api/gift/reminder`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| is_completed | boolean | 否 | 是否已完成 |
| reminder_type | string | 否 | 提醒类型（return_gift=回礼提醒，occasion=事由提醒） |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "reminder_type": "return_gift",
        "gift_id": 1,
        "reminder_date": "2025-02-15",
        "reminder_message": "张三结婚回礼提醒",
        "is_completed": 0,
        "completed_at": null,
        "created_at": "2025-01-15T12:00:00.000Z"
      }
    ]
  },
  "message": "获取成功",
  "code": 200
}
```

#### 3.2 创建人情提醒
**接口地址**: `POST /api/gift/reminder`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "reminder_type": "return_gift",
  "gift_id": 1,
  "reminder_date": "2025-02-15",
  "reminder_message": "张三结婚回礼提醒"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "reminder_type": "return_gift",
    "gift_id": 1,
    "reminder_date": "2025-02-15",
    "reminder_message": "张三结婚回礼提醒",
    "is_completed": 0,
    "created_at": "2025-01-15T12:00:00.000Z"
  },
  "message": "创建成功",
  "code": 200
}
```

#### 3.3 标记提醒完成
**接口地址**: `PUT /api/gift/reminder/:id/complete`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "is_completed": 1,
    "completed_at": "2025-02-15T10:00:00.000Z"
  },
  "message": "标记成功",
  "code": 200
}
```

### 4. 自动归档接口

#### 4.1 记账时自动创建人情记录
**触发时机**：当用户在记账时选择"人情"分类下的"出礼"子分类

**接口地址**: `POST /api/expense` (现有接口扩展)

**处理逻辑**：
1. 保存消费记录
2. 检查分类是否属于"人情-出礼"
3. 如果是，自动创建人情记录
4. 返回消费记录和人情记录

**响应示例**:
```json
{
  "success": true,
  "data": {
    "expense": {
      "id": 100,
      "amount": 500.00,
      "expense_date": "2025-01-15",
      "category_id": 11,
      "category_name": "婚礼",
      "description": "张三结婚",
      "created_at": "2025-01-15T12:00:00.000Z"
    },
    "gift": {
      "id": 1,
      "gift_type": "outgoing",
      "payment_type": "cash",
      "amount": 500.00,
      "related_person": "",
      "occasion": "婚礼",
      "expense_date": "2025-01-15",
      "expense_id": 100,
      "created_at": "2025-01-15T12:00:00.000Z"
    }
  },
  "message": "创建成功",
  "code": 200
}
```

## 前端页面设计

### 1. 人情记录页面

**路由**: `/gift`

**页面布局**:
```
┌─────────────────────────────────────────────────────────────┐
│  人情管理                                    [+ 新增记录]    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  统计摘要                                             │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │ 出礼总额 │ │ 收礼总额 │ │ 净支出   │ │ 记录数   │   │   │
│  │  │ ¥5,000  │ │ ¥3,000  │ │ ¥2,000  │ │ 18条    │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  筛选条件                                             │   │
│  │  类型: [全部 ▼]  日期范围: [2025-01-01] 至 [2025-01-31]│
│  │  关联人: [搜索...]  事由: [全部 ▼]                   │
│  │                                          [查询] [重置]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  人情记录列表                                         │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  日期    类型  关联人  事由  金额/实物  状态  操作   │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  01-15  出礼  张三    婚礼  ¥500      -    [编辑]  │   │
│  │  01-20  收礼  李四    生日  ¥300      -    [编辑]  │   │
│  │  01-25  出礼  王五    满月  礼品(¥200) -   [编辑]  │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                    [上一页] 1/2 [下一页]             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**组件结构**:
```vue
<template>
  <div class="gift-page">
    <div class="page-header">
      <h2>人情管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon> 新增记录
      </el-button>
    </div>

    <!-- 统计摘要 -->
    <el-card class="summary-card">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">出礼总额</span>
            <span class="value expense">¥{{ statistics.outgoing.total_amount.toFixed(2) }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">收礼总额</span>
            <span class="value income">¥{{ statistics.incoming.total_amount.toFixed(2) }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">净支出</span>
            <span class="value" :class="statistics.net_outgoing > 0 ? 'expense' : 'income'">
              ¥{{ Math.abs(statistics.net_outgoing).toFixed(2) }}
            </span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">记录数</span>
            <span class="value">{{ statistics.outgoing.total_count + statistics.incoming.total_count }}条</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="类型">
          <el-select v-model="filters.gift_type" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="出礼" value="outgoing" />
            <el-option label="收礼" value="incoming" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="关联人">
          <el-input v-model="filters.related_person" placeholder="搜索..." clearable />
        </el-form-item>
        <el-form-item label="事由">
          <el-select v-model="filters.occasion" placeholder="全部" clearable>
            <el-option label="婚礼" value="婚礼" />
            <el-option label="生日" value="生日" />
            <el-option label="丧礼" value="丧礼" />
            <el-option label="满月" value="满月" />
            <el-option label="乔迁" value="乔迁" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 人情记录列表 -->
    <el-card class="list-card">
      <el-table :data="giftList" stripe>
        <el-table-column prop="expense_date" label="日期" width="120" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.gift_type === 'outgoing' ? 'danger' : 'success'">
              {{ row.gift_type === 'outgoing' ? '出礼' : '收礼' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="related_person" label="关联人" width="120" />
        <el-table-column prop="occasion" label="事由" width="100" />
        <el-table-column label="金额/实物" width="150">
          <template #default="{ row }">
            <span v-if="row.payment_type === 'cash'">¥{{ row.amount.toFixed(2) }}</span>
            <span v-else>{{ row.item_name }} (¥{{ row.item_value?.toFixed(2) || 0 }})</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.gift_type === 'outgoing'" :type="row.is_returned ? 'success' : 'info'">
              {{ row.is_returned ? '已回礼' : '未回礼' }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editGift(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteGift(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @change="fetchData"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <GiftEditDialog
      v-model="editDialogVisible"
      :gift="currentGift"
      @success="fetchData"
    />
  </div>
</template>
```

### 2. 人情记录编辑弹窗

**组件结构**:
```vue
<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑人情记录' : '新增人情记录'"
    width="600px"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="类型" prop="gift_type">
        <el-radio-group v-model="form.gift_type">
          <el-radio value="outgoing">出礼</el-radio>
          <el-radio value="incoming">收礼</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="支付类型" prop="payment_type">
        <el-radio-group v-model="form.payment_type">
          <el-radio value="cash">现金</el-radio>
          <el-radio value="item">实物</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="form.payment_type === 'cash'" label="金额" prop="amount">
        <el-input-number
          v-model="form.amount"
          :precision="2"
          :min="0"
          :step="100"
          style="width: 100%"
        >
          <template #prefix>¥</template>
        </el-input-number>
      </el-form-item>

      <el-form-item v-if="form.payment_type === 'item'" label="实物名称" prop="item_name">
        <el-input v-model="form.item_name" placeholder="如：茶具、花篮" />
      </el-form-item>

      <el-form-item v-if="form.payment_type === 'item'" label="实物价值" prop="item_value">
        <el-input-number
          v-model="form.item_value"
          :precision="2"
          :min="0"
          :step="100"
          style="width: 100%"
        >
          <template #prefix>¥</template>
        </el-input-number>
      </el-form-item>

      <el-form-item label="关联人" prop="related_person">
        <el-input v-model="form.related_person" placeholder="请输入关联人姓名" />
      </el-form-item>

      <el-form-item label="事由" prop="occasion">
        <el-select v-model="form.occasion" placeholder="请选择事由" style="width: 100%">
          <el-option label="婚礼" value="婚礼" />
          <el-option label="生日" value="生日" />
          <el-option label="丧礼" value="丧礼" />
          <el-option label="满月" value="满月" />
          <el-option label="乔迁" value="乔迁" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="日期" prop="expense_date">
            <el-date-picker
              v-model="form.expense_date"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="时间" prop="expense_time">
            <el-time-picker
              v-model="form.expense_time"
              placeholder="选择时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item v-if="form.gift_type === 'outgoing'" label="回礼状态">
        <el-switch
          v-model="form.is_returned"
          active-text="已回礼"
          inactive-text="未回礼"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.remarks" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>
```

### 3. 人情统计页面

**路由**: `/gift/statistics`

**页面布局**:
```
┌─────────────────────────────────────────────────────────────┐
│  人情统计                                  [导出Excel]      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  时间范围: [2025-01] ◀ ▶     [本月] [上月] [自定义]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  出礼 vs 收礼        │  │  事由分布             │        │
│  │  ┌────────────────┐  │  │  ┌────────────────┐  │        │
│  │  │                │  │  │  │                │  │        │
│  │  │      🥧        │  │  │  │      🥧        │  │        │
│  │  │                │  │  │  │                │  │        │
│  │  └────────────────┘  │  │  └────────────────┘  │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  关联人明细                                           │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  关联人    出礼总额  收礼总额  净支出  记录数  操作  │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  张三      ¥1,000   ¥500      ¥500    3    [查看]  │   │
│  │  李四      ¥800     ¥1,200    -¥400   5    [查看]  │   │
│  │  王五      ¥500     ¥0        ¥500    2    [查看]  │   │
│  │  ─────────────────────────────────────────────────  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 4. 人情提醒页面

**路由**: `/gift/reminder`

**页面布局**:
```
┌─────────────────────────────────────────────────────────────┐
│  人情提醒                                    [+ 新增提醒]    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  提醒列表                                             │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  提醒日期    类型    内容                  状态  操作 │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  02-15      回礼    张三结婚回礼提醒        未完成 [完成]│
│  │  03-20      事由    李四生日                未完成 [完成]│
│  │  02-01      回礼    王五满月回礼提醒        已完成 -    │   │
│  │  ─────────────────────────────────────────────────  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 用户流程

### 1. 记账时自动归档人情记录

**流程**:
1. 用户进入记账页面
2. 选择输入方式（文字/语音/图片）
3. 输入消费信息
4. AI自动识别消费信息
5. 用户选择分类为"人情 > 婚礼"
6. 保存消费记录
7. 系统自动创建人情记录（出礼类型）
8. 提示用户："已自动创建人情记录，是否补充详细信息？"
9. 用户点击"补充"，弹出人情记录编辑弹窗
10. 用户补充关联人、事由等信息
11. 保存人情记录

### 2. 手动添加人情记录

**流程**:
1. 用户进入人情管理页面
2. 点击"新增记录"
3. 选择类型（出礼/收礼）
4. 填写详细信息（金额/实物、关联人、事由等）
5. 保存人情记录
6. 如果是出礼记录，可选择是否需要创建回礼提醒

### 3. 查看人情统计

**流程**:
1. 用户进入人情统计页面
2. 选择时间范围
3. 查看出礼vs收礼的对比图表
4. 查看事由分布
5. 查看关联人明细
6. 点击某个关联人，查看与该人的所有人情往来

### 4. 管理人情提醒

**流程**:
1. 用户进入人情提醒页面
2. 查看待完成的提醒列表
3. 点击"完成"标记提醒已完成
4. 点击"新增提醒"手动添加提醒

## 与现有系统集成

### 1. 与消费记录系统集成

**集成点**:
- 记账页面：选择"人情"分类时，自动创建人情记录
- 消费记录列表：显示是否为人情记录的标记
- 消费统计：可以筛选人情记录

**实现方式**:
- 在 `expenses` 表中添加 `is_gift` 字段（标记是否为人情记录）
- 在 `expenses` 表中添加 `gift_id` 字段（关联人情记录）
- 在创建消费记录时，检查分类是否为人情分类
- 如果是人情分类，自动创建人情记录并关联

### 2. 与分类系统集成

**集成点**:
- 分类管理：添加"人情"大类和子分类
- 记账页面：选择分类时，区分人情分类和普通分类

**实现方式**:
- 在 `categories` 表中添加人情分类
- 在分类管理页面显示人情分类
- 在记账页面选择分类时，根据分类ID判断是否为人情分类

### 3. 与统计系统集成

**集成点**:
- 统计页面：可以筛选人情记录
- 统计分析：人情记录单独统计

**实现方式**:
- 在统计接口中添加 `include_gift` 参数
- 在统计分析页面添加人情记录筛选选项

## 数据验证规则

### 人情记录验证
- **类型**：必须为 "outgoing" 或 "incoming"
- **支付类型**：必须为 "cash" 或 "item"
- **金额**：现金类型必填，必须为正数，最多支持小数点后两位
- **实物名称**：实物类型必填，最多200个字符
- **实物价值**：实物类型可选，必须为正数
- **关联人**：必填，最多100个字符
- **事由**：必填，最多50个字符
- **日期**：必填，必须是有效日期格式（YYYY-MM-DD）
- **备注**：最多500个字符

### 人情提醒验证
- **提醒类型**：必须为 "return_gift" 或 "occasion"
- **提醒日期**：必填，必须是有效日期格式（YYYY-MM-DD）
- **提醒内容**：必填，最多500个字符

## 错误处理

### 常见错误类型

#### 1. 自动归档失败
```
错误码：500
错误信息：自动创建人情记录失败
处理方案：提示用户手动添加人情记录
```

#### 2. 关联数据不存在
```
错误码：404
错误信息：关联的消费记录不存在
处理方案：检查关联数据，或删除人情记录
```

#### 3. 数据验证失败
```
错误码：422
错误信息：关联人姓名不能为空
处理方案：提示用户补充必填信息
```

## 待确认事项

1. **人情分类设计**：是否需要将"出礼"和"收礼"作为独立的大类？
2. **回礼提醒**：是否需要自动创建回礼提醒？提醒时间如何计算？
3. **实物估值**：实物礼物的价值是否需要记录？如何估值？
4. **数据隔离**：人情记录是否需要按用户隔离？还是所有家庭成员共享？
5. **预算管理**：人情支出是否需要纳入预算管理？

## 后续优化方向

1. **智能推荐**：基于人情记录，智能推荐回礼金额
2. **人情网络**：可视化展示人情往来关系
3. **人情分析**：AI分析人情往来的趋势和规律
4. **人情日历**：在日历视图中展示人情事件
5. **人情模板**：预设人情场景模板，快速创建记录