# API接口文档

## API基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **字符编码**: `UTF-8`
- **认证方式**: JWT Token (Bearer Token)

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "code": 200
}
```

### 错误响应
```json
{
  "success": false,
  "data": null,
  "message": "错误信息",
  "code": 400
}
```

### 错误码说明
| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token无效或过期） |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户名已存在） |
| 422 | 数据验证失败 |
| 500 | 服务器内部错误 |

---

## 1. 认证相关接口

### 1.1 用户登录

**接口地址**: `POST /api/auth/login`

**请求参数**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**参数说明**:
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "is_admin": 1
    }
  },
  "message": "登录成功",
  "code": 200
}
```

---

### 1.2 用户退出

**接口地址**: `POST /api/auth/logout`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": null,
  "message": "退出成功",
  "code": 200
}
```

---

### 1.3 获取当前用户信息

**接口地址**: `GET /api/auth/me`

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
    "username": "admin",
    "email": "admin@example.com",
    "is_admin": 1,
    "status": 1,
    "created_at": "2025-01-01T00:00:00.000Z"
  },
  "message": "获取成功",
  "code": 200
}
```

---

### 1.4 修改密码

**接口地址**: `PUT /api/auth/password`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "old_password": "admin123",
  "new_password": "newpassword123"
}
```

**参数说明**:
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| old_password | string | 是 | 旧密码 |
| new_password | string | 是 | 新密码（最少8个字符，必须包含字母和数字） |

**响应示例**:
```json
{
  "success": true,
  "data": null,
  "message": "密码修改成功",
  "code": 200
}
```

---

## 2. 消费记录相关接口

### 2.1 获取消费记录列表

**接口地址**: `GET /api/expense`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| page_size | number | 否 | 每页数量，默认20 |
| start_date | string | 否 | 开始日期（YYYY-MM-DD） |
| end_date | string | 否 | 结束日期（YYYY-MM-DD） |
| category_id | number | 否 | 分类ID |
| member_id | number | 否 | 成员ID |
| keyword | string | 否 | 搜索关键词 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "amount": 30.00,
        "expense_date": "2025-01-15",
        "expense_time": "12:30:00",
        "category_id": 1,
        "category_name": "火锅",
        "member_id": 1,
        "member_name": "张三",
        "description": "今天中午吃了30块火锅，和老婆一起",
        "remarks": null,
        "created_at": "2025-01-15T12:30:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 20
  },
  "message": "获取成功",
  "code": 200
}
```

---

### 2.2 创建消费记录

**接口地址**: `POST /api/expense`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "amount": 30.00,
  "expense_date": "2025-01-15",
  "expense_time": "12:30:00",
  "category_id": 1,
  "member_id": 1,
  "description": "今天中午吃了30块火锅，和老婆一起",
  "remarks": ""
}
```

**参数说明**:
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| amount | number | 是 | 消费金额 |
| expense_date | string | 是 | 消费日期（YYYY-MM-DD） |
| expense_time | string | 否 | 消费时间（HH:mm:ss） |
| category_id | number | 是 | 分类ID |
| member_id | number | 否 | 成员ID |
| description | string | 否 | 消费描述 |
| remarks | string | 否 | 备注 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "amount": 30.00,
    "expense_date": "2025-01-15",
    "expense_time": "12:30:00",
    "category_id": 1,
    "member_id": 1,
    "description": "今天中午吃了30块火锅，和老婆一起",
    "remarks": "",
    "created_at": "2025-01-15T12:30:00.000Z"
  },
  "message": "创建成功",
  "code": 200
}
```

---

### 2.3 获取单条消费记录

**接口地址**: `GET /api/expense/:id`

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
    "amount": 30.00,
    "expense_date": "2025-01-15",
    "expense_time": "12:30:00",
    "category_id": 1,
    "category_name": "火锅",
    "member_id": 1,
    "member_name": "张三",
    "description": "今天中午吃了30块火锅，和老婆一起",
    "remarks": "",
    "created_by": 1,
    "created_at": "2025-01-15T12:30:00.000Z",
    "updated_at": "2025-01-15T12:30:00.000Z"
  },
  "message": "获取成功",
  "code": 200
}
```

---

### 2.4 更新消费记录

**接口地址**: `PUT /api/expense/:id`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "amount": 35.00,
  "expense_date": "2025-01-15",
  "expense_time": "13:00:00",
  "category_id": 1,
  "member_id": 1,
  "description": "今天中午吃了35块火锅，和老婆一起",
  "remarks": "修改了金额"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "amount": 35.00,
    "expense_date": "2025-01-15",
    "expense_time": "13:00:00",
    "category_id": 1,
    "member_id": 1,
    "description": "今天中午吃了35块火锅，和老婆一起",
    "remarks": "修改了金额",
    "updated_at": "2025-01-15T13:00:00.000Z"
  },
  "message": "更新成功",
  "code": 200
}
```

---

### 2.5 删除消费记录

**接口地址**: `DELETE /api/expense/:id`

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

---

## 3. 统计分析相关接口

### 3.1 获取消费汇总数据

**接口地址**: `GET /api/statistics/summary`

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
    "total_amount": 5000.00,
    "total_count": 100,
    "avg_amount": 50.00,
    "max_amount": 500.00,
    "min_amount": 5.00,
    "category_summary": [
      {
        "category_id": 1,
        "category_name": "餐饮",
        "amount": 2000.00,
        "count": 40,
        "percentage": 40.00
      },
      {
        "category_id": 2,
        "category_name": "交通",
        "amount": 1000.00,
        "count": 30,
        "percentage": 20.00
      }
    ],
    "member_summary": [
      {
        "member_id": 1,
        "member_name": "张三",
        "amount": 3000.00,
        "count": 60,
        "percentage": 60.00
      },
      {
        "member_id": 2,
        "member_name": "李四",
        "amount": 2000.00,
        "count": 40,
        "percentage": 40.00
      }
    ]
  },
  "message": "获取成功",
  "code": 200
}
```

---

### 3.2 获取消费趋势数据

**接口地址**: `GET /api/statistics/trend`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| start_date | string | 是 | 开始日期（YYYY-MM-DD） |
| end_date | string | 是 | 结束日期（YYYY-MM-DD） |
| granularity | string | 否 | 粒度（day/week/month），默认day |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "trend_data": [
      {
        "date": "2025-01-01",
        "amount": 150.00,
        "count": 3
      },
      {
        "date": "2025-01-02",
        "amount": 200.00,
        "count": 5
      }
    ],
    "total_amount": 5000.00,
    "total_count": 100
  },
  "message": "获取成功",
  "code": 200
}
```

---

### 3.3 获取分类统计数据

**接口地址**: `GET /api/statistics/category`

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
    "categories": [
      {
        "category_id": 1,
        "category_name": "餐饮",
        "total_amount": 2000.00,
        "count": 40,
        "percentage": 40.00,
        "subcategories": [
          {
            "subcategory_id": 11,
            "subcategory_name": "火锅",
            "amount": 1000.00,
            "count": 20
          },
          {
            "subcategory_id": 12,
            "subcategory_name": "外卖",
            "amount": 500.00,
            "count": 10
          }
        ]
      }
    ]
  },
  "message": "获取成功",
  "code": 200
}
```

---

### 3.4 获取成员统计数据

**接口地址**: `GET /api/statistics/member`

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
    "members": [
      {
        "member_id": 1,
        "member_name": "张三",
        "total_amount": 3000.00,
        "count": 60,
        "percentage": 60.00,
        "category_breakdown": [
          {
            "category_name": "餐饮",
            "amount": 1500.00,
            "percentage": 50.00
          },
          {
            "category_name": "交通",
            "amount": 1000.00,
            "percentage": 33.33
          }
        ]
      }
    ]
  },
  "message": "获取成功",
  "code": 200
}
```

---

### 3.5 获取AI分析结果

**接口地址**: `POST /api/statistics/analysis`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "budget": {
    "total": 5000,
    "categories": {
      "1": 2000,
      "2": 1000
    }
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "monthOverMonth": {
      "currentMonth": 5000,
      "lastMonth": 4500,
      "change": 500,
      "changeRate": 0.111
    },
    "anomalies": [
      {
        "type": "超支",
        "category": "餐饮",
        "amount": 2000,
        "budget": 1500,
        "message": "餐饮支出超出预算500元"
      }
    ],
    "suggestions": [
      "本月餐饮支出比上月增加20%，建议减少外卖频率，多在家做饭",
      "交通支出稳定，继续保持"
    ],
    "prediction": {
      "nextMonth": 5200,
      "trend": "上升"
    }
  },
  "message": "获取成功",
  "code": 200
}
```

---

### 3.6 导出Excel

**接口地址**: `GET /api/statistics/export`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| start_date | string | 是 | 开始日期（YYYY-MM-DD） |
| end_date | string | 是 | 结束日期（YYYY-MM-DD） |
| category_id | number | 否 | 分类ID |
| member_id | number | 否 | 成员ID |

**响应**:
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="消费记录_20250101_20250131.xlsx"`

---

## 4. 预算管理相关接口

### 4.1 获取预算设置

**接口地址**: `GET /api/budget`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| year | number | 是 | 年份 |
| month | number | 是 | 月份（1-12） |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total_budget": 5000.00,
    "category_budgets": [
      {
        "category_id": 1,
        "category_name": "餐饮",
        "budget_amount": 2000.00
      },
      {
        "category_id": 2,
        "category_name": "交通",
        "budget_amount": 1000.00
      }
    ]
  },
  "message": "获取成功",
  "code": 200
}
```

---

### 4.2 设置预算

**接口地址**: `POST /api/budget`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "year": 2025,
  "month": 1,
  "total_budget": 5000.00,
  "category_budgets": [
    {
      "category_id": 1,
      "budget_amount": 2000.00
    },
    {
      "category_id": 2,
      "budget_amount": 1000.00
    }
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "year": 2025,
    "month": 1,
    "total_budget": 5000.00,
    "created_at": "2025-01-01T00:00:00.000Z"
  },
  "message": "设置成功",
  "code": 200
}
```

---

### 4.3 获取预算执行情况

**接口地址**: `GET /api/budget/progress`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| year | number | 是 | 年份 |
| month | number | 是 | 月份（1-12） |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total_budget": 5000.00,
    "total_spent": 4500.00,
    "total_remaining": 500.00,
    "progress_percentage": 90.00,
    "category_progress": [
      {
        "category_id": 1,
        "category_name": "餐饮",
        "budget": 2000.00,
        "spent": 2100.00,
        "remaining": -100.00,
        "percentage": 105.00,
        "is_over_budget": true
      },
      {
        "category_id": 2,
        "category_name": "交通",
        "budget": 1000.00,
        "spent": 800.00,
        "remaining": 200.00,
        "percentage": 80.00,
        "is_over_budget": false
      }
    ]
  },
  "message": "获取成功",
  "code": 200
}
```

---

## 5. 分类管理相关接口

### 5.1 获取分类列表

**接口地址**: `GET /api/category`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| parent_id | number | 否 | 父分类ID（NULL为大类） |
| is_system | number | 否 | 是否系统预设（0=否，1=是） |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "餐饮",
        "parent_id": null,
        "is_system": 1,
        "sort_order": 1,
        "children": [
          {
            "id": 11,
            "name": "火锅",
            "parent_id": 1,
            "is_system": 1,
            "sort_order": 1
          },
          {
            "id": 12,
            "name": "外卖",
            "parent_id": 1,
            "is_system": 1,
            "sort_order": 2
          }
        ]
      }
    ]
  },
  "message": "获取成功",
  "code": 200
}
```

---

### 5.2 创建分类

**接口地址**: `POST /api/category`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "name": "水果",
  "parent_id": 1,
  "sort_order": 8
}
```

**参数说明**:
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 分类名称 |
| parent_id | number | 否 | 父分类ID（NULL为大类） |
| sort_order | number | 否 | 排序顺序 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 18,
    "name": "水果",
    "parent_id": 1,
    "is_system": 0,
    "sort_order": 8,
    "created_at": "2025-01-15T00:00:00.000Z"
  },
  "message": "创建成功",
  "code": 200
}
```

---

### 5.3 更新分类

**接口地址**: `PUT /api/category/:id`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "name": "新鲜水果",
  "sort_order": 9
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 18,
    "name": "新鲜水果",
    "parent_id": 1,
    "is_system": 0,
    "sort_order": 9,
    "updated_at": "2025-01-15T12:00:00.000Z"
  },
  "message": "更新成功",
  "code": 200
}
```

---

### 5.4 删除分类

**接口地址**: `DELETE /api/category/:id`

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

---

## 6. 成员管理相关接口

### 6.1 获取成员列表

**接口地址**: `GET /api/member`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": 1,
        "name": "张三",
        "avatar": "https://example.com/avatar1.jpg",
        "created_at": "2025-01-01T00:00:00.000Z"
      },
      {
        "id": 2,
        "name": "李四",
        "avatar": "https://example.com/avatar2.jpg",
        "created_at": "2025-01-01T00:00:00.000Z"
      }
    ]
  },
  "message": "获取成功",
  "code": 200
}
```

---

### 6.2 添加成员

**接口地址**: `POST /api/member`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "name": "王五",
  "avatar": "https://example.com/avatar3.jpg"
}
```

**参数说明**:
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 成员姓名 |
| avatar | string | 否 | 头像URL |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "王五",
    "avatar": "https://example.com/avatar3.jpg",
    "created_at": "2025-01-15T00:00:00.000Z"
  },
  "message": "添加成功",
  "code": 200
}
```

---

### 6.3 更新成员

**接口地址**: `PUT /api/member/:id`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "name": "王五（修改）",
  "avatar": "https://example.com/avatar3_new.jpg"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "王五（修改）",
    "avatar": "https://example.com/avatar3_new.jpg",
    "updated_at": "2025-01-15T12:00:00.000Z"
  },
  "message": "更新成功",
  "code": 200
}
```

---

### 6.4 删除成员

**接口地址**: `DELETE /api/member/:id`

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

---

## 7. AI功能相关接口

### 7.1 智能识别消费信息

**接口地址**: `POST /api/ai/recognize`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "text": "今天中午吃了30块火锅，和老婆一起"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "amount": 30,
    "category": "餐饮",
    "subcategory": "火锅",
    "date": "2025-01-15",
    "time": "12:30",
    "members": ["用户本人", "妻子"],
    "description": "今天中午吃了30块火锅，和老婆一起",
    "confidence": 0.95
  },
  "message": "识别成功",
  "code": 200
}
```

---

### 7.2 AI自动分类

**接口地址**: `POST /api/ai/classify`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "description": "今天中午吃了30块火锅",
  "amount": 30
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "category": "餐饮",
        "subcategory": "火锅",
        "confidence": 0.9
      },
      {
        "category": "餐饮",
        "subcategory": "外卖",
        "confidence": 0.7
      }
    ]
  },
  "message": "分类成功",
  "code": 200
}
```

---

### 7.3 图片识别

**接口地址**: `POST /api/ai/image-recognize`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求参数**:
- file: 图片文件（FormData）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "ocr_text": "海底捞火锅\n日期：2025-01-15\n金额：30.00元",
    "extracted_info": {
      "amount": 30,
      "merchant": "海底捞火锅",
      "date": "2025-01-15",
      "items": ["火锅套餐"],
      "description": "海底捞火锅消费凭证"
    }
  },
  "message": "识别成功",
  "code": 200
}
```

---

## 附录

### 分页参数说明

所有列表接口支持分页，默认参数：
- page: 1（页码）
- page_size: 20（每页数量）

### 时间格式说明

- 日期格式：YYYY-MM-DD（如：2025-01-15）
- 时间格式：HH:mm:ss（如：12:30:00）
- DateTime格式：ISO 8601（如：2025-01-15T12:30:00.000Z）

### 金额格式说明

- 类型：number
- 精度：小数点后2位
- 示例：30.00

### 认证说明

- 除登录接口外，所有接口都需要认证
- Token放在请求头的Authorization字段中
- 格式：Bearer {token}

### 错误处理

所有错误响应都包含以下字段：
- success: false
- data: null
- message: 错误信息
- code: 错误码

### 版本控制

当前API版本：v1
Base URL：http://localhost:3000/api