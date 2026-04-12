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
          v-model="customDateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          @change="handleCustomDateChange"
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
        <div class="insight-header">
          <span>AI分析洞察</span>
          <el-button link type="primary" @click="runAnalysis">
            <el-icon><Refresh /></el-icon> 重新分析
          </el-button>
        </div>
      </template>
      
      <!-- 同比分析 -->
      <div class="insight-section" v-if="analysis?.monthOverMonth">
        <h4><el-icon><TrendCharts /></el-icon> 同比分析</h4>
        <p>
          本月消费 <strong>¥{{ Number(analysis.monthOverMonth.currentMonth).toFixed(2) }}</strong>，
          较上月
          <span :class="analysis.monthOverMonth.change > 0 ? 'increase' : 'decrease'">
            {{ analysis.monthOverMonth.change > 0 ? '增加' : '减少' }}
            ¥{{ Math.abs(Number(analysis.monthOverMonth.change)).toFixed(2) }}
            ({{ (Number(analysis.monthOverMonth.changeRate) * 100).toFixed(1) }}%)
          </span>
        </p>
      </div>
      
      <!-- 异常检测 -->
      <div class="insight-section" v-if="analysis?.anomalies?.length">
        <h4><el-icon><WarningFilled /></el-icon> 异常检测</h4>
        <ul>
          <li v-for="(anomaly, index) in analysis.anomalies" :key="index">
            <el-tag type="danger" size="small">{{ anomaly.type }}</el-tag>
            {{ anomaly.message }}
          </li>
        </ul>
      </div>
      
      <!-- 节省建议 -->
      <div class="insight-section" v-if="analysis?.suggestions?.length">
        <h4><el-icon><Opportunity /></el-icon> 节省建议</h4>
        <ul>
          <li v-for="(suggestion, index) in analysis.suggestions" :key="index">
            {{ suggestion }}
          </li>
        </ul>
      </div>
      
      <!-- 趋势预测 -->
      <div class="insight-section" v-if="analysis?.prediction">
        <h4><el-icon><DataLine /></el-icon> 趋势预测</h4>
        <p>
          预计下月消费 <strong>¥{{ Number(analysis.prediction.nextMonth).toFixed(2) }}</strong>，
          趋势:
          <el-tag :type="analysis.prediction.trend === '上升' ? 'danger' : 'success'" size="small">
            {{ analysis.prediction.trend }}
          </el-tag>
        </p>
      </div>
      
      <!-- 无数据提示 -->
      <el-empty v-if="!analysis" description="暂无分析数据，点击上方按钮开始分析" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Download, Refresh, TrendCharts, WarningFilled, Opportunity, DataLine } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { AnalysisResult, TrendData } from '~/types'
import { getMonthRange, getCurrentMonth, getPreviousMonth, getNextMonth, formatDate } from '~/utils/format'

definePageMeta({
  middleware: ['auth'],
})

const api = useApi()

// 时间选择
const quickSelect = ref<'thisMonth' | 'lastMonth' | 'custom'>('thisMonth')
const currentYear = ref(2024)
const currentMonth = ref(1)
const customDateRange = ref<[string, string] | null>(null)

const currentMonthLabel = computed(() => `${currentYear.value}年${currentMonth.value}月`)

// 日期范围
const dateRange = computed(() => {
  if (quickSelect.value === 'custom' && customDateRange.value) {
    return { start: customDateRange.value[0], end: customDateRange.value[1] }
  }
  const range = getMonthRange(currentYear.value, currentMonth.value)
  return range
})

// 图表引用
const trendChartRef = ref<HTMLElement>()
const categoryChartRef = ref<HTMLElement>()
const memberChartRef = ref<HTMLElement>()

let trendChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null
let memberChart: echarts.ECharts | null = null

// 数据
const analyzing = ref(false)
const analysis = ref<AnalysisResult | null>(null)

// 初始化
onMounted(async () => {
  // 设置当前月份
  const { year, month } = getCurrentMonth()
  currentYear.value = year
  currentMonth.value = month
  
  // 初始化图表
  initCharts()
  
  // 获取数据
  await fetchData()
})

// 初始化图表
const initCharts = () => {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value)
  }
  if (memberChartRef.value) {
    memberChart = echarts.init(memberChartRef.value)
  }
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    trendChart?.resize()
    categoryChart?.resize()
    memberChart?.resize()
  })
}

// 获取数据
const fetchData = async () => {
  await Promise.all([
    fetchTrendData(),
    fetchCategoryData(),
    fetchMemberData(),
  ])
}

// 获取趋势数据
const fetchTrendData = async () => {
  try {
    const res = await api.get('/api/statistics/trend', {
      params: {
        start_date: dateRange.value.start,
        end_date: dateRange.value.end,
        granularity: 'day',
      },
    })

    if (res.success) {
      updateTrendChart(res.data.trend_data)
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
  }
}

// 更新趋势图表
const updateTrendChart = (data: TrendData[]) => {
  if (!trendChart) return

  const chartData = data.map(d => ({
    date: d.date,
    value: Number(d.amount) || 0,
  }))

  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const item = params[0]
        return `${item.axisValue}<br/>消费: ¥${Number(item.value).toFixed(2)}`
      },
    },
    xAxis: {
      type: 'category',
      data: chartData.map(d => d.date.substring(5)),
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
      },
    },
    series: [{
      name: '消费金额',
      type: 'line',
      smooth: true,
      data: chartData.map(d => d.value),
      areaStyle: {
        opacity: 0.3,
      },
      itemStyle: {
        color: '#409EFF',
      },
    }],
  })
}

// 获取分类数据
const fetchCategoryData = async () => {
  try {
    const res = await api.get('/api/statistics/category', {
      params: {
        start_date: dateRange.value.start,
        end_date: dateRange.value.end,
      },
    })

    if (res.success) {
      updateCategoryChart(res.data.categories)
    }
  } catch (error) {
    console.error('获取分类数据失败:', error)
  }
}

// 更新分类图表
const updateCategoryChart = (data: any[]) => {
  if (!categoryChart) return

  const chartData = data.map(d => ({
    name: d.category_name,
    value: Number(d.total_amount) || 0,
  }))

  categoryChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      label: {
        show: true,
        formatter: '{b}\n{d}%',
      },
      emphasis: {
        label: {
          show: true,
          formatter: '{b}\n¥{c}\n{d}%',
          fontSize: 14,
          fontWeight: 'bold',
        },
      },
      data: chartData,
    }],
  })
}

// 获取成员数据
const fetchMemberData = async () => {
  try {
    const res = await api.get('/api/statistics/member', {
      params: {
        start_date: dateRange.value.start,
        end_date: dateRange.value.end,
      },
    })

    if (res.success) {
      updateMemberChart(res.data.members)
    }
  } catch (error) {
    console.error('获取成员数据失败:', error)
  }
}

// 更新成员图表
const updateMemberChart = (data: any[]) => {
  if (!memberChart) return

  const chartData = data.map(d => ({
    name: d.member_name,
    value: Number(d.total_amount) || 0,
  }))

  memberChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      label: {
        show: true,
        formatter: '{b}\n{d}%',
      },
      emphasis: {
        label: {
          show: true,
          formatter: '{b}\n¥{c}\n{d}%',
          fontSize: 14,
          fontWeight: 'bold',
        },
      },
      data: chartData,
    }],
  })
}

// 切换月份
const prevMonth = () => {
  const prev = getPreviousMonth(currentYear.value, currentMonth.value)
  currentYear.value = prev.year
  currentMonth.value = prev.month
  quickSelect.value = 'custom'
  fetchData()
}

const nextMonth = () => {
  const next = getNextMonth(currentYear.value, currentMonth.value)
  currentYear.value = next.year
  currentMonth.value = next.month
  quickSelect.value = 'custom'
  fetchData()
}

// 快速选择
const handleQuickSelect = (val: 'thisMonth' | 'lastMonth' | 'custom') => {
  if (val === 'thisMonth') {
    const { year, month } = getCurrentMonth()
    currentYear.value = year
    currentMonth.value = month
  } else if (val === 'lastMonth') {
    const { year, month } = getCurrentMonth()
    const prev = getPreviousMonth(year, month)
    currentYear.value = prev.year
    currentMonth.value = prev.month
  }
  fetchData()
}

// 自定义日期变化
const handleCustomDateChange = () => {
  if (customDateRange.value) {
    fetchData()
  }
}

// 运行AI分析
const runAnalysis = async () => {
  analyzing.value = true
  try {
    // 获取预算数据
    const budgetRes = await api.get('/api/budget', {
      params: {
        year: currentYear.value,
        month: currentMonth.value,
      },
    })

    const budget = budgetRes.success ? {
      total: budgetRes.data.total_budget,
      categories: Object.fromEntries(
        budgetRes.data.category_budgets.map((b: any) => [b.category_name, b.budget_amount])
      ),
    } : { total: 0, categories: {} }

    // 获取消费数据
    const expenseRes = await api.get('/api/expense', {
      params: {
        start_date: dateRange.value.start,
        end_date: dateRange.value.end,
        pageSize: 10000,
      },
    })

    const expenses = expenseRes.success ? expenseRes.data.list : []

    // 调用AI分析
    const res = await api.post('/api/statistics/analysis', {
      start_date: dateRange.value.start,
      end_date: dateRange.value.end,
      budget,
      data: expenses,
    })

    if (res.success) {
      analysis.value = res.data
    } else {
      ElMessage.error(res.message || 'AI分析失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'AI分析失败')
  } finally {
    analyzing.value = false
  }
}

// 导出Excel
const exportExcel = async () => {
  try {
    const params = new URLSearchParams({
      start_date: dateRange.value.start,
      end_date: dateRange.value.end,
    })
    
    window.open(`/api/statistics/export?${params.toString()}`, '_blank')
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败')
  }
}
</script>

<style lang="scss" scoped>
.statistics-page {
  .time-selector-card {
    margin-bottom: $spacing-md;
    
    .time-selector {
      display: flex;
      align-items: center;
      gap: $spacing-lg;
      flex-wrap: wrap;
    }
  }
  
  .chart-card {
    margin-bottom: $spacing-md;
    
    .chart {
      width: 100%;
    }
  }
  
  .insight-card {
    .insight-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}

.insight-section {
  margin-bottom: $spacing-lg;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h4 {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: $spacing-sm;
    
    .el-icon {
      font-size: 16px;
    }
  }
  
  p {
    color: $text-secondary;
    line-height: 1.6;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      padding: $spacing-xs 0;
      color: $text-secondary;
      display: flex;
      align-items: center;
      gap: $spacing-sm;
    }
  }
}

.increase {
  color: $accent;
}

.decrease {
  color: $success;
}

@media (max-width: $breakpoint-sm) {
  .time-selector {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
