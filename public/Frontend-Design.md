# 前端页面设计文档

## 技术栈

- **框架**: Nuxt.js 3 + Vue 3
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **图表库**: ECharts
- **样式**: SCSS
- **图标**: Element Plus Icons / Iconify

---

## 整体布局设计

### 页面结构

```
┌──────────────────────────────────────────────────────────────┐
│                         顶部导航栏 (60px)                      │
│  [Logo] [用户信息] [通知] [退出]                                │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                  │
│            │                                                  │
│   侧边栏    │                  主内容区域                       │
│  (200px)   │               (自适应宽度)                        │
│            │                                                  │
│            │                                                  │
│            │                                                  │
├────────────┴─────────────────────────────────────────────────┤
│                         底部版权 (可选)                         │
└──────────────────────────────────────────────────────────────┘
```

### 响应式断点

| 设备类型 | 宽度范围 | 布局方式 |
|---------|---------|---------|
| 移动端 | < 768px | 单栏布局，侧边栏折叠 |
| 平板 | 768px - 1024px | 两栏布局，侧边栏收缩 |
| 桌面端 | > 1024px | 两栏布局，侧边栏固定200px |

### 全局样式变量

```scss
// 主题色
$primary-color: #409EFF;
$success-color: #67C23A;
$warning-color: #E6A23C;
$danger-color: #F56C6C;
$info-color: #909399;

// 背景色
$bg-color: #F5F7FA;
$bg-color-dark: #E4E7ED;
$bg-color-page: #F0F2F5;

// 文字颜色
$text-primary: #303133;
$text-regular: #606266;
$text-secondary: #909399;
$text-placeholder: #C0C4CC;

// 边框
$border-color: #DCDFE6;
$border-radius: 4px;
$border-radius-large: 8px;

// 阴影
$box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
$box-shadow-light: 0 2px 8px 0 rgba(0, 0, 0, 0.06);

// 间距
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
```

---

## 模块一：认证模块

### 1.1 登录页面

**路由**: `/login`

**页面布局**:
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    ┌─────────────────┐                       │
│                    │     Logo        │                       │
│                    │   家庭消费记账   │                       │
│                    └─────────────────┘                       │
│                    ┌─────────────────┐                       │
│                    │ 用户名输入框     │                       │
│                    └─────────────────┘                       │
│                    ┌─────────────────┐                       │
│                    │ 密码输入框       │                       │
│                    └─────────────────┘                       │
│                    ┌─────────────────┐                       │
│                    │    登录按钮     │                       │
│                    └─────────────────┘                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**组件结构**:
```vue
<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <img src="~/assets/logo.svg" class="logo" />
        <h1>家庭消费记账</h1>
      </div>
      
      <el-form ref="formRef" :model="form" :rules="rules">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
```

**交互说明**:
- 用户名/密码为空时，显示校验错误
- 登录成功后跳转到首页（记账页面）
- 登录失败显示错误提示（Toast）
- 支持回车键登录

**API调用**:
- `POST /api/auth/login`

---

### 1.2 修改密码弹窗

**触发位置**: 顶部导航栏用户下拉菜单

**组件结构**:
```vue
<template>
  <el-dialog
    v-model="visible"
    title="修改密码"
    width="400px"
  >
    <el-form ref="formRef" :model="form" :rules="rules">
      <el-form-item label="旧密码" prop="old_password">
        <el-input v-model="form.old_password" type="password" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="new_password">
        <el-input v-model="form.new_password" type="password" show-password />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirm_password">
        <el-input v-model="form.confirm_password" type="password" show-password />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>
```

**API调用**:
- `PUT /api/auth/password`

---

## 模块二：记账模块

### 2.1 记账页面

**路由**: `/expense/create`

**页面布局**:
```
┌─────────────────────────────────────────────────────────────┐
│  记账                                          [历史记录]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  输入方式选择                                         │   │
│  │  [📝 文字]  [🎤 语音]  [📷 图片]                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  输入区域                                             │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │                                             │    │   │
│  │  │  请输入消费信息...                          │    │   │
│  │  │                                             │    │   │
│  │  │                                             │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                     [识别] [清空]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AI识别结果                                          │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  金额: ¥ 30.00                                       │   │
│  │  日期: 2025-01-15  时间: 12:30                       │   │
│  │  成员: [张三 ▼]                                      │   │
│  │  备注: 今天中午吃了30块火锅，和老婆一起              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  分类选择                                             │   │
│  │  AI推荐:                                              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │   │
│  │  │ 🍲 火锅  │  │ 🍱 外卖  │  │ 🍽️ 正餐  │             │   │
│  │  │ 90%     │  │  70%    │  │  60%    │             │   │
│  │  └─────────┘  └─────────┘  └─────────┘             │   │
│  │                                                      │   │
│  │  全部分类: [餐饮 ▼] → [火锅 ▼]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              [取消]  [保存记录]             │
└─────────────────────────────────────────────────────────────┘
```

**组件结构**:
```vue
<template>
  <div class="expense-create-page">
    <div class="page-header">
      <h2>记账</h2>
      <el-button @click="goToHistory">历史记录</el-button>
    </div>
    
    <!-- 输入方式选择 -->
    <el-card class="input-mode-card">
      <el-radio-group v-model="inputMode" @change="handleModeChange">
        <el-radio-button value="text">
          <el-icon><Edit /></el-icon> 文字
        </el-radio-button>
        <el-radio-button value="voice">
          <el-icon><Microphone /></el-icon> 语音
        </el-radio-button>
        <el-radio-button value="image">
          <el-icon><Picture /></el-icon> 图片
        </el-radio-button>
      </el-radio-group>
    </el-card>
    
    <!-- 文字输入区域 -->
    <el-card v-if="inputMode === 'text'" class="input-card">
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="4"
        placeholder="请输入消费信息，如：今天中午吃了30块火锅，和老婆一起"
      />
      <div class="input-actions">
        <el-button @click="clearInput">清空</el-button>
        <el-button type="primary" @click="recognizeText" :loading="recognizing">
          AI识别
        </el-button>
      </div>
    </el-card>
    
    <!-- 语音输入区域 -->
    <el-card v-if="inputMode === 'voice'" class="input-card voice-card">
      <div class="voice-area">
        <el-button
          :type="isListening ? 'danger' : 'primary'"
          size="large"
          circle
          @click="toggleListening"
        >
          <el-icon size="32"><Microphone /></el-icon>
        </el-button>
        <p>{{ isListening ? '正在录音...' : '点击开始录音' }}</p>
        <div v-if="transcript" class="transcript">
          {{ transcript }}
        </div>
      </div>
    </el-card>
    
    <!-- 图片输入区域 -->
    <el-card v-if="inputMode === 'image'" class="input-card image-card">
      <el-upload
        drag
        :auto-upload="false"
        :on-change="handleImageChange"
        accept="image/*"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          拖拽图片到此处，或<em>点击上传</em>
        </div>
      </el-upload>
      <div v-if="previewImage" class="image-preview">
        <img :src="previewImage" />
        <el-button type="primary" @click="recognizeImage" :loading="recognizing">
          识别图片
        </el-button>
      </div>
    </el-card>
    
    <!-- AI识别结果 -->
    <el-card v-if="recognizeResult" class="result-card">
      <template #header>
        <span>AI识别结果</span>
        <el-tag :type="recognizeResult.confidence >= 0.8 ? 'success' : 'warning'">
          置信度: {{ (recognizeResult.confidence * 100).toFixed(0) }}%
        </el-tag>
      </template>
      
      <el-form :model="expenseForm" label-width="80px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="金额">
              <el-input-number
                v-model="expenseForm.amount"
                :precision="2"
                :min="0"
                :step="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成员">
              <el-select v-model="expenseForm.member_id" placeholder="选择成员">
                <el-option
                  v-for="member in members"
                  :key="member.id"
                  :label="member.name"
                  :value="member.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="日期">
              <el-date-picker
                v-model="expenseForm.expense_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="时间">
              <el-time-picker
                v-model="expenseForm.expense_time"
                placeholder="选择时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="备注">
          <el-input v-model="expenseForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 分类选择 -->
    <el-card v-if="recognizeResult" class="category-card">
      <template #header>分类选择</template>
      
      <!-- AI推荐分类 -->
      <div v-if="recommendations.length" class="ai-recommend">
        <span class="label">AI推荐:</span>
        <div class="recommend-list">
          <div
            v-for="rec in recommendations"
            :key="rec.category + rec.subcategory"
            class="recommend-item"
            :class="{ active: selectedCategory === rec }"
            @click="selectRecommend(rec)"
          >
            <span class="name">{{ rec.subcategory }}</span>
            <el-progress
              :percentage="rec.confidence * 100"
              :show-text="false"
              :stroke-width="4"
            />
            <span class="confidence">{{ (rec.confidence * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
      
      <!-- 手动选择分类 -->
      <div class="manual-select">
        <span class="label">全部分类:</span>
        <el-cascader
          v-model="expenseForm.category_id"
          :options="categoryTree"
          :props="{ value: 'id', label: 'name', children: 'children' }"
          placeholder="选择分类"
          clearable
          filterable
          @change="handleCategoryChange"
        />
      </div>
    </el-card>
    
    <!-- 操作按钮 -->
    <div class="page-actions">
      <el-button @click="resetForm">取消</el-button>
      <el-button type="primary" @click="saveExpense" :loading="saving">
        保存记录
      </el-button>
    </div>
  </div>
</template>
```

**交互说明**:
1. 默认文字输入模式，支持语音/图片切换
2. 输入内容后点击"AI识别"，调用识别接口
3. 识别结果展示，置信度低于80%标黄提示
4. AI推荐分类卡片式展示，支持点击选择
5. 支持手动修改任何字段
6. 保存成功后跳转历史记录页

**API调用**:
- `POST /api/ai/recognize` - 智能识别
- `POST /api/ai/classify` - AI分类推荐
- `POST /api/ai/image-recognize` - 图片识别
- `GET /api/category` - 获取分类列表
- `GET /api/member` - 获取成员列表
- `POST /api/expense` - 保存消费记录

---

### 2.2 历史记录页面

**路由**: `/expense/history`

**页面布局**:
```
┌─────────────────────────────────────────────────────────────┐
│  消费记录                                      [+ 新增记账]  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  筛选条件                                             │   │
│  │  日期范围: [2025-01-01] 至 [2025-01-31]              │   │
│  │  分类: [全部 ▼]  成员: [全部 ▼]  关键词: [搜索...]   │   │
│  │                                          [查询] [重置]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  统计摘要                                             │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │ 总支出   │ │ 记录数   │ │ 平均    │ │ 最高    │   │   │
│  │  │ ¥5,000  │ │ 100条   │ │ ¥50     │ │ ¥500    │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  记录列表                                             │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  日期       时间     分类      成员   金额    操作   │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  01-15     12:30   餐饮/火锅  张三   ¥30    [编辑][删除]│
│  │  01-15     18:00   交通/打车  张三   ¥25    [编辑][删除]│
│  │  01-16     09:00   购物/超市  李四   ¥156   [编辑][删除]│
│  │  ─────────────────────────────────────────────────  │   │
│  │                    [上一页] 1/5 [下一页]             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**组件结构**:
```vue
<template>
  <div class="expense-history-page">
    <div class="page-header">
      <h2>消费记录</h2>
      <el-button type="primary" @click="goToCreate">
        <el-icon><Plus /></el-icon> 新增记账
      </el-button>
    </div>
    
    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-cascader
            v-model="filters.category_id"
            :options="categoryTree"
            :props="{ checkStrictly: true }"
            placeholder="全部分类"
            clearable
          />
        </el-form-item>
        <el-form-item label="成员">
          <el-select v-model="filters.member_id" placeholder="全部成员" clearable>
            <el-option
              v-for="member in members"
              :key="member.id"
              :label="member.name"
              :value="member.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="搜索备注..." clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 统计摘要 -->
    <el-card class="summary-card">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">总支出</span>
            <span class="value">¥{{ summary.total_amount.toFixed(2) }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">记录数</span>
            <span class="value">{{ summary.total_count }}条</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">平均</span>
            <span class="value">¥{{ summary.avg_amount.toFixed(2) }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">最高</span>
            <span class="value">¥{{ summary.max_amount.toFixed(2) }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 记录列表 -->
    <el-card class="list-card">
      <el-table :data="expenseList" stripe>
        <el-table-column prop="expense_date" label="日期" width="120" />
        <el-table-column prop="expense_time" label="时间" width="100" />
        <el-table-column label="分类" width="150">
          <template #default="{ row }">
            <el-tag>{{ row.category_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="member_name" label="成员" width="100" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editExpense(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteExpense(row)">删除</el-button>
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
    
    <!-- 编辑弹窗 -->
    <ExpenseEditDialog
      v-model="editDialogVisible"
      :expense="currentExpense"
      @success="fetchData"
    />
  </div>
</template>
```

**API调用**:
- `GET /api/expense` - 获取消费记录列表
- `GET /api/statistics/summary` - 获取统计摘要
- `PUT /api/expense/:id` - 更新消费记录
- `DELETE /api/expense/:id` - 删除消费记录

---

## 模块三：统计模块

### 3.1 统计分析页面

**路由**: `/statistics`

**页面布局**:
```
┌─────────────────────────────────────────────────────────────┐
│  统计分析                              [导出Excel]          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  时间范围: [2025-01] ◀ ▶     [本月] [上月] [自定义]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  消费趋势                                             │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │           📈 折线图                          │    │   │
│  │  │                                              │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  分类分布 (饼图)      │  │  成员占比 (饼图)      │        │
│  │  ┌────────────────┐  │  │  ┌────────────────┐  │        │
│  │  │                │  │  │  │                │  │        │
│  │  │      🥧        │  │  │  │      🥧        │  │        │
│  │  │                │  │  │  │                │  │        │
│  │  └────────────────┘  │  │  └────────────────┘  │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AI分析洞察                                           │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  📊 同比分析                                          │   │
│  │  本月消费 ¥5,000，较上月增加 ¥500 (+11.1%)           │   │
│  │                                                       │   │
│  │  ⚠️ 异常检测                                          │   │
│  │  • 餐饮支出超出预算 ¥500                              │   │
│  │                                                       │   │
│  │  💡 节省建议                                          │   │
│  │  • 本月餐饮支出比上月增加20%，建议减少外卖频率        │   │
│  │                                                       │   │
│  │  📈 趋势预测                                          │   │
│  │  预计下月消费 ¥5,200，趋势: 上升                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**组件结构**:
```vue
<template>
  <div class="statistics-page">
    <div class="page-header">
      <h2>统计分析</h2>
      <el-button @click="exportExcel">
        <el-icon><Download /></el-icon> 导出Excel
      </el-button>
    </div>
    
    <!-- 时间选择器 -->
    <el-card class="time-selector-card">
      <div class="time-selector">
        <el-button-group>
          <el-button @click="prevMonth">&lt;</el-button>
          <el-button disabled>{{ currentMonthLabel }}</el-button>
          <el-button @click="nextMonth">&gt;</el-button>
        </el-button-group>
        <el-radio-group v-model="quickSelect" @change="handleQuickSelect">
          <el-radio-button value="thisMonth">本月</el-radio-button>
          <el-radio-button value="lastMonth">上月</el-radio-button>
          <el-radio-button value="custom">自定义</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-if="quickSelect === 'custom'"
          v-model="dateRange"
          type="daterange"
        />
      </div>
    </el-card>
    
    <!-- 消费趋势图 -->
    <el-card class="chart-card">
      <template #header>消费趋势</template>
      <div ref="trendChartRef" class="chart" style="height: 300px"></div>
    </el-card>
    
    <!-- 分类和成员分布 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>分类分布</template>
          <div ref="categoryChartRef" class="chart" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>成员占比</template>
          <div ref="memberChartRef" class="chart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- AI分析洞察 -->
    <el-card class="insight-card" v-loading="analyzing">
      <template #header>
        <span>AI分析洞察</span>
        <el-button link type="primary" @click="runAnalysis">
          <el-icon><Refresh /></el-icon> 重新分析
        </el-button>
      </template>
      
      <!-- 同比分析 -->
      <div class="insight-section">
        <h4><el-icon><TrendCharts /></el-icon> 同比分析</h4>
        <p v-if="analysis.monthOverMonth">
          本月消费 <strong>¥{{ analysis.monthOverMonth.currentMonth }}</strong>，
          较上月
          <span :class="analysis.monthOverMonth.change > 0 ? 'increase' : 'decrease'">
            {{ analysis.monthOverMonth.change > 0 ? '增加' : '减少' }}
            ¥{{ Math.abs(analysis.monthOverMonth.change) }}
            ({{ (analysis.monthOverMonth.changeRate * 100).toFixed(1) }}%)
          </span>
        </p>
      </div>
      
      <!-- 异常检测 -->
      <div class="insight-section" v-if="analysis.anomalies?.length">
        <h4><el-icon><WarningFilled /></el-icon> 异常检测</h4>
        <ul>
          <li v-for="(anomaly, index) in analysis.anomalies" :key="index">
            <el-tag type="danger">{{ anomaly.type }}</el-tag>
            {{ anomaly.message }}
          </li>
        </ul>
      </div>
      
      <!-- 节省建议 -->
      <div class="insight-section" v-if="analysis.suggestions?.length">
        <h4><el-icon><Opportunity /></el-icon> 节省建议</h4>
        <ul>
          <li v-for="(suggestion, index) in analysis.suggestions" :key="index">
            {{ suggestion }}
          </li>
        </ul>
      </div>
      
      <!-- 趋势预测 -->
      <div class="insight-section" v-if="analysis.prediction">
        <h4><el-icon><DataLine /></el-icon> 趋势预测</h4>
        <p>
          预计下月消费 <strong>¥{{ analysis.prediction.nextMonth }}</strong>，
          趋势: 
          <el-tag :type="analysis.prediction.trend === '上升' ? 'danger' : 'success'">
            {{ analysis.prediction.trend }}
          </el-tag>
        </p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'

// 图表初始化逻辑...
</script>
```

**交互说明**:
1. 默认显示本月数据
2. 支持月份切换和自定义日期范围
3. 图表支持悬浮显示详情
4. AI分析需要手动触发（首次进入自动触发）
5. 支持导出Excel

**API调用**:
- `GET /api/statistics/trend` - 获取趋势数据
- `GET /api/statistics/category` - 获取分类统计
- `GET /api/statistics/member` - 获取成员统计
- `POST /api/statistics/analysis` - 获取AI分析
- `GET /api/statistics/export` - 导出Excel

---

## 模块四：预算管理模块

### 4.1 预算设置页面

**路由**: `/budget`

**页面布局**:
```
┌─────────────────────────────────────────────────────────────┐
│  预算管理                                                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  月份选择: [2025-01 ▼]                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  总预算设置                                           │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │  ¥  [5000.00                        ]       │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  分类预算分配                                         │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  餐饮    ¥ [2000.00]  ████████████░░░░  已用 80%    │   │
│  │  交通    ¥ [1000.00]  ████████░░░░░░░░  已用 60%    │   │
│  │  购物    ¥ [1000.00]  ██████░░░░░░░░░░  已用 40%    │   │
│  │  娱乐    ¥ [ 500.00]  ████░░░░░░░░░░░░  已用 30%    │   │
│  │  其他    ¥ [ 500.00]  ██░░░░░░░░░░░░░░  已用 20%    │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  总计: ¥5000.00  (剩余 ¥1500.00)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  预算执行情况                                         │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │           📊 环形图                          │    │   │
│  │  │        总进度 70%                            │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                          [重置] [保存设置]   │
└─────────────────────────────────────────────────────────────┘
```

**组件结构**:
```vue
<template>
  <div class="budget-page">
    <div class="page-header">
      <h2>预算管理</h2>
    </div>
    
    <!-- 月份选择 -->
    <el-card class="month-selector-card">
      <el-date-picker
        v-model="selectedMonth"
        type="month"
        placeholder="选择月份"
        @change="fetchBudgetData"
      />
    </el-card>
    
    <!-- 总预算设置 -->
    <el-card class="total-budget-card">
      <template #header>总预算设置</template>
      <el-input-number
        v-model="budgetForm.total_budget"
        :precision="2"
        :min="0"
        :step="100"
        size="large"
        style="width: 300px"
      >
        <template #prefix>¥</template>
      </el-input-number>
    </el-card>
    
    <!-- 分类预算分配 -->
    <el-card class="category-budget-card">
      <template #header>分类预算分配</template>
      
      <div
        v-for="category in budgetForm.category_budgets"
        :key="category.category_id"
        class="category-budget-item"
      >
        <div class="category-info">
          <span class="name">{{ category.category_name }}</span>
          <el-input-number
            v-model="category.budget_amount"
            :precision="2"
            :min="0"
            size="small"
            style="width: 150px"
          />
        </div>
        <div class="budget-progress">
          <el-progress
            :percentage="getProgress(category)"
            :status="getProgressStatus(category)"
          />
          <span class="spent">已用 {{ getProgress(category) }}%</span>
        </div>
      </div>
      
      <div class="budget-summary">
        <span>总计: ¥{{ totalCategoryBudget.toFixed(2) }}</span>
        <span v-if="remainingBudget >= 0" class="remaining">
          (剩余 ¥{{ remainingBudget.toFixed(2) }})
        </span>
        <span v-else class="exceeded">
          (超出 ¥{{ Math.abs(remainingBudget).toFixed(2) }})
        </span>
      </div>
    </el-card>
    
    <!-- 预算执行情况图表 -->
    <el-card class="budget-chart-card">
      <template #header>预算执行情况</template>
      <div ref="budgetChartRef" class="chart" style="height: 300px"></div>
    </el-card>
    
    <!-- 操作按钮 -->
    <div class="page-actions">
      <el-button @click="resetForm">重置</el-button>
      <el-button type="primary" @click="saveBudget" :loading="saving">
        保存设置
      </el-button>
    </div>
  </div>
</template>
```

**交互说明**:
1. 选择月份后自动加载该月预算数据
2. 分类预算总和不能超过总预算
3. 进度条实时显示执行情况
4. 超支分类显示红色警告

**API调用**:
- `GET /api/budget` - 获取预算设置
- `POST /api/budget` - 保存预算
- `GET /api/budget/progress` - 获取执行情况

---

## 模块五：分类管理模块

### 5.1 分类管理页面

**路由**: `/category`

**页面布局**:
```
┌─────────────────────────────────────────────────────────────┐
│  分类管理                                      [+ 新增分类]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  系统预设分类                                         │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  🍜 餐饮                                              │   │
│  │     ├── 火锅      [系统]                              │   │
│  │     ├── 烧烤      [系统]                              │   │
│  │     └── 外卖      [系统]                              │   │
│  │  🚗 交通                                              │   │
│  │     ├── 打车      [系统]                              │   │
│  │     └── 地铁      [系统]                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  自定义分类                                           │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  🍎 水果                                              │   │
│  │     └── 苹果      [编辑] [删除]                       │   │
│  │  🎁 礼品                                              │   │
│  │     ├── 生日礼物  [编辑] [删除]                       │   │
│  │     └── 节日礼物  [编辑] [删除]                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**组件结构**:
```vue
<template>
  <div class="category-page">
    <div class="page-header">
      <h2>分类管理</h2>
      <el-button type="primary" @click="openAddDialog()">
        <el-icon><Plus /></el-icon> 新增分类
      </el-button>
    </div>
    
    <!-- 系统预设分类 -->
    <el-card class="category-card">
      <template #header>系统预设分类</template>
      <el-tree
        :data="systemCategories"
        :props="{ label: 'name', children: 'children' }"
        default-expand-all
      >
        <template #default="{ node, data }">
          <span class="category-node">
            <span>{{ data.name }}</span>
            <el-tag v-if="data.is_system" size="small" type="info">系统</el-tag>
          </span>
        </template>
      </el-tree>
    </el-card>
    
    <!-- 自定义分类 -->
    <el-card class="category-card">
      <template #header>
        <span>自定义分类</span>
        <el-button link type="primary" @click="openAddDialog()">
          添加
        </el-button>
      </template>
      <el-tree
        :data="customCategories"
        :props="{ label: 'name', children: 'children' }"
        default-expand-all
      >
        <template #default="{ node, data }">
          <span class="category-node">
            <span>{{ data.name }}</span>
            <span class="actions">
              <el-button link type="primary" @click="openEditDialog(data)">
                编辑
              </el-button>
              <el-button link type="danger" @click="deleteCategory(data)">
                删除
              </el-button>
            </span>
          </span>
        </template>
      </el-tree>
    </el-card>
    
    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="400px"
    >
      <el-form ref="formRef" :model="categoryForm" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="父级分类" prop="parent_id">
          <el-cascader
            v-model="categoryForm.parent_id"
            :options="allCategories"
            :props="{ checkStrictly: true, value: 'id', label: 'name' }"
            placeholder="选择父级分类（可选）"
            clearable
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="categoryForm.sort_order" :min="0" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCategory">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
```

**API调用**:
- `GET /api/category` - 获取分类列表
- `POST /api/category` - 创建分类
- `PUT /api/category/:id` - 更新分类
- `DELETE /api/category/:id` - 删除分类

---

## 模块六：成员管理模块

### 6.1 成员管理页面

**路由**: `/member`

**页面布局**:
```
┌─────────────────────────────────────────────────────────────┐
│  成员管理                                      [+ 添加成员]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐               │ │
│  │  │  👤     │  │  👤     │  │  👤     │               │ │
│  │  │  张三   │  │  李四   │  │  王五   │               │ │
│  │  │         │  │         │  │         │               │ │
│  │  │ 消费: 30 │  │ 消费: 20 │  │ 消费: 50 │               │ │
│  │  │[编辑][删除]│[编辑][删除]│[编辑][删除]│               │ │
│  │  └─────────┘  └─────────┘  └─────────┘               │ │
│  │                                                       │ │
│  │  ┌─────────┐                                         │ │
│  │  │   +     │                                         │ │
│  │  │ 添加成员 │                                         │ │
│  │  └─────────┘                                         │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**组件结构**:
```vue
<template>
  <div class="member-page">
    <div class="page-header">
      <h2>成员管理</h2>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon> 添加成员
      </el-button>
    </div>
    
    <!-- 成员列表 -->
    <div class="member-grid">
      <el-card
        v-for="member in members"
        :key="member.id"
        class="member-card"
      >
        <div class="avatar">
          <el-avatar :size="80" :src="member.avatar">
            {{ member.name.charAt(0) }}
          </el-avatar>
        </div>
        <div class="info">
          <h3>{{ member.name }}</h3>
          <p class="stats">
            消费记录: {{ member.expense_count || 0 }} 条
          </p>
        </div>
        <div class="actions">
          <el-button link type="primary" @click="openEditDialog(member)">
            编辑
          </el-button>
          <el-button link type="danger" @click="deleteMember(member)">
            删除
          </el-button>
        </div>
      </el-card>
      
      <!-- 添加成员卡片 -->
      <el-card class="member-card add-card" @click="openAddDialog">
        <div class="add-content">
          <el-icon :size="48"><Plus /></el-icon>
          <span>添加成员</span>
        </div>
      </el-card>
    </div>
    
    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑成员' : '添加成员'"
      width="400px"
    >
      <el-form ref="formRef" :model="memberForm" :rules="rules" label-width="80px">
        <el-form-item label="成员姓名" prop="name">
          <el-input v-model="memberForm.name" placeholder="请输入成员姓名" />
        </el-form-item>
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :http-request="uploadAvatar"
          >
            <img v-if="memberForm.avatar" :src="memberForm.avatar" class="avatar-preview" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMember">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
```

**API调用**:
- `GET /api/member` - 获取成员列表
- `POST /api/member` - 添加成员
- `PUT /api/member/:id` - 更新成员
- `DELETE /api/member/:id` - 删除成员

---

## 公共组件

### 1. 侧边导航组件

**组件路径**: `components/layout/Sidebar.vue`

```vue
<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="isCollapse"
    router
  >
    <el-menu-item index="/expense/create">
      <el-icon><Edit /></el-icon>
      <span>记账</span>
    </el-menu-item>
    
    <el-menu-item index="/expense/history">
      <el-icon><List /></el-icon>
      <span>消费记录</span>
    </el-menu-item>
    
    <el-menu-item index="/statistics">
      <el-icon><DataAnalysis /></el-icon>
      <span>统计分析</span>
    </el-menu-item>
    
    <el-menu-item index="/budget">
      <el-icon><Wallet /></el-icon>
      <span>预算管理</span>
    </el-menu-item>
    
    <el-menu-item index="/category">
      <el-icon><Grid /></el-icon>
      <span>分类管理</span>
    </el-menu-item>
    
    <el-menu-item index="/member">
      <el-icon><User /></el-icon>
      <span>成员管理</span>
    </el-menu-item>
  </el-menu>
</template>
```

### 2. 顶部导航组件

**组件路径**: `components/layout/Header.vue`

```vue
<template>
  <div class="header">
    <div class="left">
      <el-icon class="collapse-btn" @click="toggleSidebar">
        <Fold v-if="!isCollapse" />
        <Expand v-else />
      </el-icon>
      <span class="title">家庭消费记账</span>
    </div>
    
    <div class="right">
      <el-dropdown @command="handleCommand">
        <span class="user-info">
          <el-avatar :size="32">{{ user.username?.charAt(0) }}</el-avatar>
          <span class="username">{{ user.username }}</span>
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="password">修改密码</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>
```

### 3. 消费记录编辑弹窗

**组件路径**: `components/expense/ExpenseEditDialog.vue`

```vue
<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="编辑消费记录"
    width="500px"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="金额" prop="amount">
        <el-input-number v-model="form.amount" :precision="2" :min="0" />
      </el-form-item>
      <el-form-item label="日期" prop="expense_date">
        <el-date-picker v-model="form.expense_date" type="date" />
      </el-form-item>
      <el-form-item label="时间">
        <el-time-picker v-model="form.expense_time" />
      </el-form-item>
      <el-form-item label="分类" prop="category_id">
        <el-cascader v-model="form.category_id" :options="categories" />
      </el-form-item>
      <el-form-item label="成员">
        <el-select v-model="form.member_id">
          <el-option v-for="m in members" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.description" type="textarea" />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
```

---

## 状态管理 (Pinia Stores)

### 1. 用户状态

**路径**: `stores/user.ts`

```typescript
export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    user: null as User | null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.is_admin === 1
  },
  
  actions: {
    async login(username: string, password: string) {
      const res = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      this.token = res.data.token
      this.user = res.data.user
    },
    
    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' })
      this.token = ''
      this.user = null
    },
    
    async fetchUser() {
      const res = await $fetch('/api/auth/me')
      this.user = res.data
    }
  },
  
  persist: true
})
```

### 2. 分类状态

**路径**: `stores/category.ts`

```typescript
export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [] as Category[],
    tree: [] as CategoryTree[]
  }),
  
  getters: {
    systemCategories: (state) => state.categories.filter(c => c.is_system),
    customCategories: (state) => state.categories.filter(c => !c.is_system)
  },
  
  actions: {
    async fetchCategories() {
      const res = await $fetch('/api/category')
      this.categories = res.data.categories
      this.tree = buildTree(this.categories)
    }
  }
})
```

### 3. 成员状态

**路径**: `stores/member.ts`

```typescript
export const useMemberStore = defineStore('member', {
  state: () => ({
    members: [] as Member[]
  }),
  
  actions: {
    async fetchMembers() {
      const res = await $fetch('/api/member')
      this.members = res.data.members
    }
  }
})
```

---

## 路由配置

**路径**: `pages/` (Nuxt.js 自动路由)

```
pages/
├── login.vue                 # 登录页
├── index.vue                 # 首页（重定向到记账页）
├── expense/
│   ├── create.vue           # 记账页面
│   └── history.vue          # 历史记录页面
├── statistics/
│   └── index.vue            # 统计分析页面
├── budget/
│   └── index.vue            # 预算管理页面
├── category/
│   └── index.vue            # 分类管理页面
└── member/
    └── index.vue            # 成员管理页面
```

---

## 工具函数

### 1. 金额格式化

**路径**: `utils/format.ts`

```typescript
export function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
```

### 2. 日期格式化

```typescript
export function formatDate(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD')
}

export function formatDateTime(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export function formatMonth(date: Date | string): string {
  return dayjs(date).format('YYYY-MM')
}
```

### 3. 构建树结构

```typescript
export function buildTree<T extends { id: number; parent_id: number | null }>(
  items: T[]
): (T & { children?: T[] })[] {
  const map = new Map<number, T & { children?: T[] }>()
  const roots: (T & { children?: T[] })[] = []
  
  items.forEach(item => {
    map.set(item.id, { ...item, children: [] })
  })
  
  items.forEach(item => {
    const node = map.get(item.id)!
    if (item.parent_id === null) {
      roots.push(node)
    } else {
      const parent = map.get(item.parent_id)
      parent?.children?.push(node)
    }
  })
  
  return roots
}
```

---

## 图表配置 (ECharts)

### 1. 消费趋势折线图

```typescript
const trendChartOption = {
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: [] // 日期数组
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '¥{value}'
    }
  },
  series: [{
    name: '消费金额',
    type: 'line',
    smooth: true,
    data: [], // 金额数组
    areaStyle: {
      opacity: 0.3
    }
  }]
}
```

### 2. 分类分布饼图

```typescript
const categoryChartOption = {
  tooltip: {
    trigger: 'item',
    formatter: '{b}: ¥{c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    right: 10
  },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    label: {
      show: true,
      formatter: '{b}\n{d}%'
    },
    data: [] // { name, value } 数组
  }]
}
```

---

## 权限控制

### 路由守卫

**路径**: `middleware/auth.ts`

```typescript
export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()
  
  if (!userStore.isLoggedIn && to.path !== '/login') {
    return navigateTo('/login')
  }
  
  if (userStore.isLoggedIn && to.path === '/login') {
    return navigateTo('/')
  }
})
```

---

## 项目文件结构

```
AI-消费汇总平台/
├── pages/                      # 页面组件
│   ├── login.vue
│   ├── index.vue
│   ├── expense/
│   ├── statistics/
│   ├── budget/
│   ├── category/
│   └── member/
├── components/                 # 公共组件
│   ├── layout/
│   │   ├── Header.vue
│   │   ├── Sidebar.vue
│   │   └── MainLayout.vue
│   ├── expense/
│   │   └── ExpenseEditDialog.vue
│   └── common/
├── stores/                     # Pinia 状态
│   ├── user.ts
│   ├── category.ts
│   └── member.ts
├── composables/                # 组合式函数
│   ├── useAI.ts
│   ├── useSpeechRecognition.ts
│   └── useExpense.ts
├── utils/                      # 工具函数
│   ├── format.ts
│   └── tree.ts
├── assets/                     # 静态资源
│   ├── styles/
│   │   ├── variables.scss
│   │   └── global.scss
│   └── logo.svg
├── server/                     # 服务端
│   ├── api/
│   └── services/
├── nuxt.config.ts
└── package.json
```

---

## 待确认事项

1. **主题风格**: 是否需要深色模式支持
2. **图表样式**: ECharts 主题配色方案
3. **移动端适配**: 是否需要独立的移动端布局
4. **国际化**: 是否需要多语言支持
5. **动画效果**: 页面切换动画方案
