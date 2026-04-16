<template>
  <div class="gift-statistics-page" :class="{ 'is-mobile': isMobile }">
    <div class="page-header">
      <h2>人情统计</h2>
    </div>

    <!-- 时间选择器 -->
    <el-card class="time-selector-card">
      <div class="time-selector">
        <el-button-group>
          <el-button @click="prevMonth">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <el-button disabled>{{ currentMonthLabel }}</el-button>
          <el-button @click="nextMonth">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
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
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
        />
      </div>
    </el-card>

    <!-- 统计摘要 -->
    <el-card class="summary-card">
      <el-row :gutter="isMobile ? 8 : 16">
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">出礼总额</span>
            <span class="value expense">
              ¥{{ Number(statistics?.outgoing?.total_amount || 0).toFixed(2) }}
            </span>
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">收礼总额</span>
            <span class="value income">
              ¥{{ Number(statistics?.incoming?.total_amount || 0).toFixed(2) }}
            </span>
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">净支出</span>
            <span
              class="value"
              :class="Number(statistics?.net_outgoing || 0) > 0 ? 'expense' : 'income'"
            >
              ¥{{ Math.abs(Number(statistics?.net_outgoing || 0)).toFixed(2) }}
            </span>
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">记录数</span>
            <span class="value">
              {{ (statistics?.outgoing?.total_count || 0) + (statistics?.incoming?.total_count || 0) }}条
            </span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 事由分布 -->
    <el-card class="chart-card">
      <template #header>事由分布</template>
      <div ref="occasionChartRef" class="chart" style="height: 300px"></div>
    </el-card>

    <!-- 关联人明细 -->
    <el-card class="list-card">
      <template #header>关联人明细</template>
      <el-table :data="statistics?.person_breakdown || []" stripe>
        <el-table-column prop="related_person" label="关联人" width="120" />
        <el-table-column label="出礼金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ Number(row.outgoing_amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收礼金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount income">¥{{ Number(row.incoming_amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="净支出" width="120" align="right">
          <template #default="{ row }">
            <span
              class="amount"
              :class="Number(row.net_amount || 0) > 0 ? 'expense' : 'income'"
            >
              ¥{{ Math.abs(Number(row.net_amount || 0)).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="出礼次数" width="100" align="center">
          <template #default="{ row }">
            {{ row.outgoing_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="收礼次数" width="100" align="center">
          <template #default="{ row }">
            {{ row.incoming_count || 0 }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import { getMonthRange, getCurrentMonth, formatDate } from "~/utils/format";

definePageMeta({
  middleware: ["auth"],
});

const giftStore = useGiftStore();

/** 判断是否为移动端 */
const isMobile = inject<Ref<boolean>>("isMobile", ref(false));

// 时间选择
const quickSelect = ref("thisMonth");
const dateRange = ref<[string, string] | null>(null);
const currentMonthLabel = ref("");

// 统计数据
const statistics = ref(giftStore.statistics);

// 图表
const occasionChartRef = ref<HTMLElement>();
let occasionChart: echarts.ECharts | null = null;

// 初始化
onMounted(async () => {
  await initMonth();
  await fetchStatistics();
  initChart();
});

onUnmounted(() => {
  if (occasionChart) {
    occasionChart.dispose();
  }
});

/** 初始化月份 */
const initMonth = () => {
  const { year, month } = getCurrentMonth();
  currentMonthLabel.value = `${year}年${month}月`;
  const range = getMonthRange(year, month);
  dateRange.value = [range.start, range.end];
};

/** 快速选择 */
const handleQuickSelect = async (value: string) => {
  if (value === "thisMonth") {
    initMonth();
  } else if (value === "lastMonth") {
    const { year, month } = getCurrentMonth();
    const lastMonth = month === 1 ? 12 : month - 1;
    const lastYear = month === 1 ? year - 1 : year;
    currentMonthLabel.value = `${lastYear}年${lastMonth}月`;
    const range = getMonthRange(lastYear, lastMonth);
    dateRange.value = [range.start, range.end];
  }
  await fetchStatistics();
};

/** 日期范围变化 */
const handleDateChange = async () => {
  if (dateRange.value) {
    quickSelect.value = "custom";
    await fetchStatistics();
  }
};

/** 上个月 */
const prevMonth = async () => {
  if (!dateRange.value) return;

  const startDate = new Date(dateRange.value[0]);
  const endDate = new Date(dateRange.value[1]);

  startDate.setMonth(startDate.getMonth() - 1);
  endDate.setMonth(endDate.getMonth() - 1);

  dateRange.value = [
    formatDate(startDate),
    formatDate(endDate)
  ];

  currentMonthLabel.value = `${startDate.getFullYear()}年${startDate.getMonth() + 1}月`;
  quickSelect.value = "custom";
  await fetchStatistics();
};

/** 下个月 */
const nextMonth = async () => {
  if (!dateRange.value) return;

  const startDate = new Date(dateRange.value[0]);
  const endDate = new Date(dateRange.value[1]);

  startDate.setMonth(startDate.getMonth() + 1);
  endDate.setMonth(endDate.getMonth() + 1);

  dateRange.value = [
    formatDate(startDate),
    formatDate(endDate)
  ];

  currentMonthLabel.value = `${startDate.getFullYear()}年${startDate.getMonth() + 1}月`;
  quickSelect.value = "custom";
  await fetchStatistics();
};

/** 获取统计数据 */
const fetchStatistics = async () => {
  if (!dateRange.value) return;

  await giftStore.fetchStatistics(dateRange.value[0], dateRange.value[1]);
  statistics.value = giftStore.statistics;

  // 更新图表
  if (statistics.value) {
    updateChart();
  }
};

/** 初始化图表 */
const initChart = () => {
  if (!occasionChartRef.value) return;

  occasionChart = echarts.init(occasionChartRef.value);
  updateChart();

  window.addEventListener("resize", () => {
    occasionChart?.resize();
  });
};

/** 更新图表 */
const updateChart = () => {
  if (!occasionChart || !statistics.value) return;

  const occasions = statistics.value.occasion_breakdown.map(item => item.occasion);
  const outgoingData = statistics.value.occasion_breakdown.map(item => item.outgoing_amount);
  const incomingData = statistics.value.occasion_breakdown.map(item => item.incoming_amount);

  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },
    legend: {
      data: ["出礼", "收礼"]
    },
    xAxis: {
      type: "category",
      data: occasions
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: "¥{value}"
      }
    },
    series: [
      {
        name: "出礼",
        type: "bar",
        data: outgoingData,
        itemStyle: {
          color: "#F56C6C"
        }
      },
      {
        name: "收礼",
        type: "bar",
        data: incomingData,
        itemStyle: {
          color: "#67C23A"
        }
      }
    ]
  };

  occasionChart.setOption(option);
};
</script>

<style lang="scss" scoped>
.gift-statistics-page {
  .amount {
    font-weight: 600;
    font-family: $font-mono;
  }

  .expense {
    color: $danger;
  }

  .income {
    color: $success;
  }

  .time-selector-card {
    margin-bottom: $spacing-md;
    box-shadow: $shadow-md;
    transition: all $transition-base;

    &:hover {
      box-shadow: $shadow-lg;
      transform: translateY(-2px);
    }

    :deep(.el-card__body) {
      padding: $spacing-lg;
      background: linear-gradient(180deg, #FFFFFF 0%, #F8FBFC 100%);
    }
  }

  .time-selector {
    display: flex;
    gap: $spacing-md;
    align-items: center;
    flex-wrap: wrap;
  }

  .summary-card {
    margin-bottom: $spacing-md;
    box-shadow: $shadow-md;
    transition: all $transition-base;

    &:hover {
      box-shadow: $shadow-lg;
      transform: translateY(-2px);
    }

    :deep(.el-card__body) {
      background: linear-gradient(135deg, rgba(78, 205, 196, 0.03) 0%, rgba(69, 183, 209, 0.03) 100%);
    }
  }

  .chart-card {
    margin-bottom: $spacing-md;
    box-shadow: $shadow-md;
    transition: all $transition-base;

    &:hover {
      box-shadow: $shadow-lg;
    }
  }

  .list-card {
    box-shadow: $shadow-md;
    transition: all $transition-base;

    &:hover {
      box-shadow: $shadow-lg;
    }
  }
}

.stat-item {
  text-align: center;
  padding: $spacing-lg $spacing-md;
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  transition: all $transition-base;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: $gradient-primary;
    opacity: 0;
    transition: opacity $transition-base;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-lg;
    border-color: rgba(78, 205, 196, 0.3);

    &::before {
      opacity: 1;
    }
  }

  .label {
    display: block;
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: $spacing-sm;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: $text-primary;
    font-family: $font-mono;
  }
}

// ==================== 移动端样式 ====================

.is-mobile {
  .page-header {
    h2 {
      font-size: 18px;
    }
  }

  .time-selector-card {
    box-shadow: $shadow-md;

    :deep(.el-card__body) {
      padding: $spacing-md;
      background: linear-gradient(180deg, #FFFFFF 0%, #F8FBFC 100%);
    }
  }

  .time-selector {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-sm;
  }

  .stat-item {
    padding: $spacing-sm;
    background: $bg-white;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    transition: all $transition-base;

    &:active {
      transform: scale(0.98);
    }

    .label {
      font-size: 11px;
    }

    .value {
      font-size: 18px;
      font-weight: 700;
    }
  }

  .summary-card {
    box-shadow: $shadow-md;

    :deep(.el-card__body) {
      padding: $spacing-sm $spacing-md;
      background: linear-gradient(135deg, rgba(78, 205, 196, 0.03) 0%, rgba(69, 183, 209, 0.03) 100%);
    }
  }

  .chart-card {
    box-shadow: $shadow-md;
  }
}
</style>