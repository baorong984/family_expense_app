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
        value-format="YYYY-MM"
        @change="fetchBudgetData"
      />
      <span class="month-label">{{ monthLabel }}</span>
    </el-card>
    
    <!-- 总预算设置 -->
    <el-card class="total-budget-card">
      <template #header>总预算设置</template>
      <div class="budget-input">
        <span class="currency">¥</span>
        <el-input-number
          v-model="budgetForm.total_budget"
          :precision="2"
          :min="0"
          :step="100"
          size="large"
        />
      </div>
    </el-card>
    
    <!-- 分类预算分配 -->
    <el-card class="category-budget-card">
      <template #header>分类预算分配</template>
      
      <div
        v-for="category in categoryStore.parentCategories"
        :key="category.id"
        class="category-budget-item"
      >
        <div class="category-info">
          <span class="name">{{ category.name }}</span>
          <el-input-number
            v-model="getCategoryBudget(category.id).budget_amount"
            :precision="2"
            :min="0"
            size="small"
            style="width: 150px"
          />
        </div>
        <div class="budget-progress" v-if="categoryProgress.length > 0">
          <el-progress
            :percentage="getCategoryProgress(category.id)"
            :status="getProgressStatus(category.id)"
          />
          <span class="spent">
            {{ getCategoryProgress(category.id) >= 100 ? '已超支' : `已用 ${getCategoryProgress(category.id)}%` }}
          </span>
        </div>
      </div>
      
      <div class="budget-summary">
        <span>总计: ¥{{ Number(totalCategoryBudget).toFixed(2) }}</span>
        <span v-if="remainingBudget >= 0" class="remaining">
          (剩余 ¥{{ Number(remainingBudget).toFixed(2) }})
        </span>
        <span v-else class="exceeded">
          (超出 ¥{{ Math.abs(Number(remainingBudget)).toFixed(2) }})
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
      <el-button type="primary" :loading="saving" @click="saveBudget">
        保存设置
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import type { CategoryBudget, BudgetProgress } from '~/types'
import { getCurrentMonth } from '~/utils/format'

definePageMeta({
  middleware: ['auth'],
})

const categoryStore = useCategoryStore()
const api = useApi()

// 时间选择
const selectedMonth = ref('')
const currentYear = computed(() => {
  if (!selectedMonth.value) return 2024
  return parseInt(selectedMonth.value.split('-')[0])
})
const currentMonthNum = computed(() => {
  if (!selectedMonth.value) return 1
  return parseInt(selectedMonth.value.split('-')[1])
})
const monthLabel = computed(() => {
  if (!selectedMonth.value) return ''
  const [year, month] = selectedMonth.value.split('-')
  return `${year}年${month}月`
})

// 表单
const budgetForm = reactive({
  total_budget: 0,
  category_budgets: [] as CategoryBudget[],
})

// 预算执行进度
const categoryProgress = ref<BudgetProgress[]>([])

// 状态
const saving = ref(false)

// 图表引用
const budgetChartRef = ref<HTMLElement>()
let budgetChart: echarts.ECharts | null = null

// 计算属性
const totalCategoryBudget = computed(() => {
  return budgetForm.category_budgets.reduce((sum, item) => sum + item.budget_amount, 0)
})

const remainingBudget = computed(() => {
  return budgetForm.total_budget - totalCategoryBudget.value
})

// 初始化
onMounted(async () => {
  // 设置当前月份
  const { year, month } = getCurrentMonth()
  selectedMonth.value = `${year}-${month.toString().padStart(2, '0')}`
  
  // 初始化分类预算
  await categoryStore.fetchCategories()
  initCategoryBudgets()
  
  // 初始化图表
  initChart()
  
  // 获取预算数据
  await fetchBudgetData()
})

// 初始化分类预算
const initCategoryBudgets = () => {
  budgetForm.category_budgets = categoryStore.parentCategories.map(cat => ({
    category_id: cat.id,
    category_name: cat.name,
    budget_amount: 0,
  }))
}

// 获取分类预算
const getCategoryBudget = (categoryId: number) => {
  const budget = budgetForm.category_budgets.find(b => b.category_id === categoryId)
  return budget || { category_id: categoryId, category_name: '', budget_amount: 0 }
}

// 获取分类进度
const getCategoryProgress = (categoryId: number) => {
  const progress = categoryProgress.value.find(p => p.category_id === categoryId)
  return progress ? Math.round(progress.percentage) : 0
}

// 获取进度状态
const getProgressStatus = (categoryId: number) => {
  const percentage = getCategoryProgress(categoryId)
  if (percentage >= 100) return 'exception'
  if (percentage >= 80) return 'warning'
  return 'success'
}

// 初始化图表
const initChart = () => {
  if (budgetChartRef.value) {
    budgetChart = echarts.init(budgetChartRef.value)
    
    window.addEventListener('resize', () => {
      budgetChart?.resize()
    })
  }
}

// 获取预算数据
const fetchBudgetData = async () => {
  if (!selectedMonth.value) return

  try {
    // 获取预算设置
    const budgetRes = await api.get('/api/budget', {
      params: {
        year: currentYear.value,
        month: currentMonthNum.value,
      },
    })

    if (budgetRes.success) {
      budgetForm.total_budget = budgetRes.data.total_budget

      // 更新分类预算
      budgetRes.data.category_budgets.forEach((saved: any) => {
        const budget = budgetForm.category_budgets.find(b => b.category_id === saved.category_id)
        if (budget) {
          budget.budget_amount = saved.budget_amount
        }
      })
    }

    // 获取执行进度
    const progressRes = await api.get('/api/budget/progress', {
      params: {
        year: currentYear.value,
        month: currentMonthNum.value,
      },
    })

    if (progressRes.success) {
      categoryProgress.value = progressRes.data.category_progress
      updateChart(progressRes.data)
    }
  } catch (error) {
    console.error('获取预算数据失败:', error)
  }
}

// 更新图表
const updateChart = (data: any) => {
  if (!budgetChart) return
  
  budgetChart.setOption({
    tooltip: {
      trigger: 'item',
    },
    series: [{
      type: 'pie',
      radius: ['50%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: true,
        position: 'center',
        formatter: () => {
          const percent = data.total_budget > 0 
            ? Math.round(data.total_spent / data.total_budget * 100) 
            : 0
          return `${percent}%\n已使用`
        },
        fontSize: 20,
        fontWeight: 'bold',
      },
      data: [
        {
          value: data.total_spent,
          name: '已支出',
          itemStyle: { color: '#409EFF' },
        },
        {
          value: Math.max(0, data.total_remaining),
          name: '剩余',
          itemStyle: { color: '#E4E7ED' },
        },
      ],
    }],
  })
}

// 保存预算
const saveBudget = async () => {
  if (remainingBudget.value < 0) {
    ElMessage.warning('分类预算总和不能超过总预算')
    return
  }
  
  saving.value = true
  try {
    const res = await api.post('/api/budget', {
      year: currentYear.value,
      month: currentMonthNum.value,
      total_budget: budgetForm.total_budget,
      category_budgets: budgetForm.category_budgets.filter(b => b.budget_amount > 0),
    })

    if (res.success) {
      ElMessage.success('保存成功')
      await fetchBudgetData()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 重置表单
const resetForm = () => {
  budgetForm.total_budget = 0
  initCategoryBudgets()
}
</script>

<style lang="scss" scoped>
.budget-page {
  max-width: 800px;
  margin: 0 auto;
}

.month-selector-card {
  margin-bottom: $spacing-md;
  
  .month-label {
    margin-left: $spacing-md;
    font-size: 16px;
    font-weight: 500;
  }
}

.total-budget-card {
  margin-bottom: $spacing-md;
  
  .budget-input {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    
    .currency {
      font-size: 24px;
      font-weight: 600;
      color: $text-primary;
    }
  }
}

.category-budget-card {
  margin-bottom: $spacing-md;
}

.category-budget-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md 0;
  border-bottom: 1px solid $border-color;
  
  &:last-child {
    border-bottom: none;
  }
  
  .category-info {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    width: 300px;
    
    .name {
      width: 80px;
      font-weight: 500;
    }
  }
  
  .budget-progress {
    flex: 1;
    margin-left: $spacing-lg;
    display: flex;
    align-items: center;
    gap: $spacing-md;
    
    .el-progress {
      flex: 1;
    }
    
    .spent {
      width: 80px;
      text-align: right;
      font-size: 12px;
      color: $text-secondary;
    }
  }
}

.budget-summary {
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
  font-size: 14px;
  color: $text-secondary;
  
  .remaining {
    color: $success-color;
  }
  
  .exceeded {
    color: $danger-color;
  }
}

.budget-chart-card {
  margin-bottom: $spacing-md;
  
  .chart {
    width: 100%;
  }
}
</style>
