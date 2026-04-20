<template>
  <div class="statistics-page">
    <div class="page-header">
      <h2>统计分析</h2>
      <div class="header-actions">
        <el-button @click="exportExcel">
          <el-icon><Download /></el-icon> 导出Excel
        </el-button>
      </div>
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
          <div class="insight-actions">
            <el-button link type="primary" @click="showHistoryDialog = true">
              <el-icon><Clock /></el-icon> 历史分析
            </el-button>
            <el-button link type="primary" @click="runAnalysis">
              <el-icon><Refresh /></el-icon> 重新分析
            </el-button>
          </div>
        </div>
      </template>

      <!-- 基础分析数据 -->
      <div class="insight-section" v-if="analysis">
        <h4>
          <el-icon><DataAnalysis /></el-icon> 消费概览
        </h4>
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="stat-box">
              <div class="stat-label">总消费</div>
              <div class="stat-value expense">
                ¥{{ Number(analysis.total_spent).toFixed(2) }}
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-box">
              <div class="stat-label">预算</div>
              <div class="stat-value">
                ¥{{ Number(analysis.budget_total).toFixed(2) }}
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-box">
              <div class="stat-label">预算使用率</div>
              <div
                class="stat-value"
                :class="analysis.budget_usage_rate > 80 ? 'warning' : ''"
              >
                {{ Number(analysis.budget_usage_rate).toFixed(1) }}%
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-box">
              <div class="stat-label">消费笔数</div>
              <div class="stat-value">{{ totalTransactionCount }}笔</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 同比分析 -->
      <div class="insight-section" v-if="analysis?.year_over_year?.has_data">
        <h4>
          <el-icon><TrendCharts /></el-icon> 同比分析
        </h4>
        <p>
          本月消费
          <strong
            >¥{{
              Number(analysis.year_over_year.current_month).toFixed(2)
            }}</strong
          >， 较去年同期
          <span
            :class="
              analysis.year_over_year.change > 0 ? 'increase' : 'decrease'
            "
          >
            {{ analysis.year_over_year.change > 0 ? "增加" : "减少" }}
            ¥{{
              Math.abs(Number(analysis.year_over_year.change)).toFixed(2)
            }}
            ({{
              (Number(analysis.year_over_year.change_rate) * 100).toFixed(1)
            }}%)
          </span>
        </p>
      </div>

      <!-- 分类明细 -->
      <div class="insight-section" v-if="analysis?.category_breakdown?.length">
        <h4>
          <el-icon><PieChart /></el-icon> 分类明细
        </h4>
        <el-table :data="analysis.category_breakdown" size="small" stripe>
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">
              <span class="amount">¥{{ Number(row.amount).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="transaction_count"
            label="笔数"
            width="80"
            align="center"
          />
          <el-table-column label="占比" width="100" align="center">
            <template #default="{ row }">
              <el-progress
                :percentage="Number(row.percentage)"
                :stroke-width="8"
                :show-text="false"
              />
              <span class="percentage"
                >{{ Number(row.percentage).toFixed(1) }}%</span
              >
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 异常检测 -->
      <div class="insight-section" v-if="analysis?.anomalies?.length">
        <h4>
          <el-icon><WarningFilled /></el-icon> 异常检测
        </h4>
        <div class="anomaly-list">
          <div
            v-for="(anomaly, index) in analysis.anomalies"
            :key="index"
            class="anomaly-item"
          >
            <div class="anomaly-header">
              <el-tag
                :type="anomaly.type === '大额消费' ? 'danger' : 'warning'"
                size="small"
              >
                {{ anomaly.type }}
              </el-tag>
              <span class="anomaly-category">{{ anomaly.category }}</span>
              <span class="anomaly-amount"
                >¥{{ Number(anomaly.amount).toFixed(2) }}</span
              >
            </div>
            <div class="anomaly-desc">{{ anomaly.description }}</div>
            <div class="anomaly-date" v-if="anomaly.date">
              {{ formatDate(anomaly.date, "YYYY年M月D日") }}
            </div>
          </div>
        </div>
      </div>

      <!-- 节省建议 -->
      <div class="insight-section" v-if="analysis?.saving_suggestions?.length">
        <h4>
          <el-icon><Opportunity /></el-icon> 节省建议
        </h4>
        <div class="suggestion-list">
          <div
            v-for="(suggestion, index) in analysis.saving_suggestions"
            :key="index"
            class="suggestion-item"
          >
            <div class="suggestion-header">
              <span class="suggestion-category">{{ suggestion.category }}</span>
              <el-tag type="success" size="small">
                可节省
                {{
                  typeof suggestion.potential_saving === "number"
                    ? `¥${suggestion.potential_saving}`
                    : suggestion.potential_saving
                }}
              </el-tag>
            </div>
            <div class="suggestion-content">{{ suggestion.suggestion }}</div>
          </div>
        </div>
      </div>

      <!-- 趋势预测 -->
      <div class="insight-section" v-if="analysis?.trend_prediction">
        <h4>
          <el-icon><DataLine /></el-icon> 趋势预测
        </h4>
        <div class="prediction-content">
          <template
            v-if="
              analysis.trend_prediction.has_enough_data &&
              analysis.trend_prediction.predicted_amount
            "
          >
            <p>
              预计下月消费
              <strong
                >¥{{
                  Number(analysis.trend_prediction.predicted_amount).toFixed(2)
                }}</strong
              >， 趋势:
              <el-tag
                :type="
                  analysis.trend_prediction.trend === '上升'
                    ? 'danger'
                    : analysis.trend_prediction.trend === '下降'
                      ? 'success'
                      : 'info'
                "
                size="small"
              >
                {{ analysis.trend_prediction.trend }}
              </el-tag>
            </p>
            <p v-if="analysis.trend_prediction.confidence" class="confidence">
              置信度:
              {{
                (Number(analysis.trend_prediction.confidence) * 100).toFixed(0)
              }}%
            </p>
          </template>
          <template v-else>
            <p class="no-data-hint">
              {{
                analysis.trend_prediction.reason || "数据不足，无法进行趋势预测"
              }}
            </p>
          </template>
        </div>
      </div>

      <!-- 无数据提示 -->
      <el-empty
        v-if="!analysis"
        description="暂无分析数据，点击上方按钮开始分析"
      />
    </el-card>

    <!-- 历史分析记录弹窗 -->
    <el-dialog
      v-model="showHistoryDialog"
      title="历史分析记录"
      width="800px"
      :close-on-click-modal="false"
      modal-class="history-dialog"
    >
      <el-table :data="historyRecords" v-loading="loadingHistory" stripe>
        <el-table-column label="分析时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at, "YYYY年M月D日 HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column label="日期范围" width="200">
          <template #default="{ row }">
            {{ formatDateRange(row.start_date, row.end_date) }}
          </template>
        </el-table-column>
        <el-table-column label="总消费" width="120" align="right">
          <template #default="{ row }">
            ¥{{
              Number(
                row.analysis_data?.total_spent ||
                  row.analysis_data?.analysis?.total_expense ||
                  0,
              ).toFixed(2)
            }}
          </template>
        </el-table-column>
        <el-table-column label="消费笔数" width="100" align="center">
          <template #default="{ row }">
            {{ getHistoryTransactionCount(row.analysis_data) }}笔
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewHistoryDetail(row)"
              >查看</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="historyPage"
          v-model:page-size="historyPageSize"
          :total="historyTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="fetchHistoryRecords"
        />
      </div>
    </el-dialog>

    <!-- 历史分析详情弹窗 -->
    <el-dialog
      v-model="showDetailDialog"
      title="分析详情"
      width="900px"
      :close-on-click-modal="false"
      modal-class="detail-dialog"
    >
      <div class="detail-content" v-if="currentDetail">
        <div class="detail-header">
          <span
            >分析时间:
            {{
              formatDateTime(currentDetail.created_at, "YYYY年M月D日 HH:mm")
            }}</span
          >
          <span
            >日期范围:
            {{
              formatDateRange(currentDetail.start_date, currentDetail.end_date)
            }}</span
          >
        </div>

        <!-- 基础分析数据 -->
        <div class="insight-section" v-if="currentDetail.analysis_data">
          <h4>
            <el-icon><DataAnalysis /></el-icon> 消费概览
          </h4>
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="stat-box">
                <div class="stat-label">总消费</div>
                <div class="stat-value expense">
                  ¥{{
                    Number(currentDetail.analysis_data.total_spent).toFixed(2)
                  }}
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-box">
                <div class="stat-label">预算</div>
                <div class="stat-value">
                  ¥{{
                    Number(currentDetail.analysis_data.budget_total).toFixed(2)
                  }}
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-box">
                <div class="stat-label">预算使用率</div>
                <div class="stat-value">
                  {{
                    Number(
                      currentDetail.analysis_data.budget_usage_rate,
                    ).toFixed(1)
                  }}%
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-box">
                <div class="stat-label">消费笔数</div>
                <div class="stat-value">
                  {{ getDetailTransactionCount(currentDetail.analysis_data) }}笔
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 异常检测 -->
        <div
          class="insight-section"
          v-if="currentDetail.analysis_data?.anomalies?.length"
        >
          <h4>
            <el-icon><WarningFilled /></el-icon> 异常检测
          </h4>
          <div class="anomaly-list">
            <div
              v-for="(anomaly, index) in currentDetail.analysis_data.anomalies"
              :key="index"
              class="anomaly-item"
            >
              <div class="anomaly-header">
                <el-tag
                  :type="anomaly.type === '大额消费' ? 'danger' : 'warning'"
                  size="small"
                >
                  {{ anomaly.type }}
                </el-tag>
                <span class="anomaly-category">{{ anomaly.category }}</span>
                <span class="anomaly-amount"
                  >¥{{ Number(anomaly.amount).toFixed(2) }}</span
                >
              </div>
              <div class="anomaly-desc">{{ anomaly.description }}</div>
            </div>
          </div>
        </div>

        <!-- 分类明细 -->
        <div
          class="insight-section"
          v-if="currentDetail.analysis_data?.category_breakdown?.length"
        >
          <h4>
            <el-icon><PieChart /></el-icon> 分类明细
          </h4>
          <el-table
            :data="currentDetail.analysis_data.category_breakdown"
            size="small"
            stripe
          >
            <el-table-column prop="category" label="分类" width="120" />
            <el-table-column label="金额" width="120" align="right">
              <template #default="{ row }">
                <span class="amount">¥{{ Number(row.amount).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="transaction_count"
              label="笔数"
              width="80"
              align="center"
            />
            <el-table-column label="占比" width="100" align="center">
              <template #default="{ row }">
                <el-progress
                  :percentage="Number(row.percentage)"
                  :stroke-width="8"
                  :show-text="false"
                />
                <span class="percentage"
                  >{{ Number(row.percentage).toFixed(1) }}%</span
                >
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 节省建议 -->
        <div
          class="insight-section"
          v-if="currentDetail.analysis_data?.saving_suggestions?.length"
        >
          <h4>
            <el-icon><Opportunity /></el-icon> 节省建议
          </h4>
          <div class="suggestion-list">
            <div
              v-for="(suggestion, index) in currentDetail.analysis_data
                .saving_suggestions"
              :key="index"
              class="suggestion-item"
            >
              <div class="suggestion-header">
                <span class="suggestion-category">{{
                  suggestion.category
                }}</span>
                <el-tag type="success" size="small">
                  可节省
                  {{
                    typeof suggestion.potential_saving === "number"
                      ? `¥${suggestion.potential_saving}`
                      : suggestion.potential_saving
                  }}
                </el-tag>
              </div>
              <div class="suggestion-content">{{ suggestion.suggestion }}</div>
            </div>
          </div>
        </div>

        <!-- 趋势预测 -->
        <div
          class="insight-section"
          v-if="currentDetail.analysis_data?.trend_prediction"
        >
          <h4>
            <el-icon><DataLine /></el-icon> 趋势预测
          </h4>
          <div class="prediction-content">
            <template
              v-if="
                currentDetail.analysis_data.trend_prediction.has_enough_data &&
                currentDetail.analysis_data.trend_prediction.predicted_amount
              "
            >
              <p>
                预计下月消费
                <strong
                  >¥{{
                    Number(
                      currentDetail.analysis_data.trend_prediction
                        .predicted_amount,
                    ).toFixed(2)
                  }}</strong
                >， 趋势:
                <el-tag
                  :type="
                    currentDetail.analysis_data.trend_prediction.trend ===
                    '上升'
                      ? 'danger'
                      : currentDetail.analysis_data.trend_prediction.trend ===
                          '下降'
                        ? 'success'
                        : 'info'
                  "
                  size="small"
                >
                  {{ currentDetail.analysis_data.trend_prediction.trend }}
                </el-tag>
              </p>
              <p
                v-if="currentDetail.analysis_data.trend_prediction.confidence"
                class="confidence"
              >
                置信度:
                {{
                  (
                    Number(
                      currentDetail.analysis_data.trend_prediction.confidence,
                    ) * 100
                  ).toFixed(0)
                }}%
              </p>
            </template>
            <template v-else>
              <p class="no-data-hint">
                {{
                  currentDetail.analysis_data.trend_prediction.reason ||
                  "数据不足，无法进行趋势预测"
                }}
              </p>
            </template>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import {
  Download,
  Refresh,
  TrendCharts,
  WarningFilled,
  Opportunity,
  DataLine,
  DataAnalysis,
  PieChart,
  Clock,
} from "@element-plus/icons-vue";
import * as echarts from "echarts";
import type { AnalysisResult, TrendData, AIAnalysisRecord } from "~/types";
import {
  getMonthRange,
  getCurrentMonth,
  getPreviousMonth,
  getNextMonth,
  formatDateTime,
  formatDateRange,
  formatDate,
} from "~/utils/format";

definePageMeta({
  middleware: ["auth"],
});

const api = useApi();

const quickSelect = ref<"thisMonth" | "lastMonth" | "custom">("thisMonth");
const currentYear = ref(2024);
const currentMonth = ref(1);
const customDateRange = ref<[string, string] | null>(null);

const currentMonthLabel = computed(
  () => `${currentYear.value}年${currentMonth.value}月`,
);

const dateRange = computed(() => {
  if (quickSelect.value === "custom" && customDateRange.value) {
    return { start: customDateRange.value[0], end: customDateRange.value[1] };
  }
  const range = getMonthRange(currentYear.value, currentMonth.value);
  return range;
});

const trendChartRef = ref<HTMLElement>();
const categoryChartRef = ref<HTMLElement>();
const memberChartRef = ref<HTMLElement>();

let trendChart: echarts.ECharts | null = null;
let categoryChart: echarts.ECharts | null = null;
let memberChart: echarts.ECharts | null = null;

const analyzing = ref(false);
const analysis = ref<AnalysisResult | null>(null);

const showHistoryDialog = ref(false);
const showDetailDialog = ref(false);
const loadingHistory = ref(false);
const historyRecords = ref<AIAnalysisRecord[]>([]);
const historyPage = ref(1);
const historyPageSize = ref(10);
const historyTotal = ref(0);
const currentDetail = ref<AIAnalysisRecord | null>(null);

const totalTransactionCount = computed(() => {
  if (!analysis.value?.category_breakdown) return 0;
  return analysis.value.category_breakdown.reduce(
    (sum, item) => sum + item.transaction_count,
    0,
  );
});

const getDetailTransactionCount = (data: any) => {
  if (!data?.category_breakdown) return 0;
  return data.category_breakdown.reduce(
    (sum: number, item: any) => sum + item.transaction_count,
    0,
  );
};

/**
 * 获取历史记录的消费笔数（兼容新旧数据结构）
 */
const getHistoryTransactionCount = (data: any) => {
  if (!data) return 0;
  if (data.category_breakdown) {
    return data.category_breakdown.reduce(
      (sum: number, item: any) => sum + (item.transaction_count || 0),
      0,
    );
  }
  return data.analysis?.expense_count || 0;
};

onMounted(async () => {
  const { year, month } = getCurrentMonth();
  currentYear.value = year;
  currentMonth.value = month;

  initCharts();
  await fetchData();
});

const initCharts = () => {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value);
  }
  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value);
  }
  if (memberChartRef.value) {
    memberChart = echarts.init(memberChartRef.value);
  }

  window.addEventListener("resize", () => {
    trendChart?.resize();
    categoryChart?.resize();
    memberChart?.resize();
  });
};

const fetchData = async () => {
  await Promise.all([fetchTrendData(), fetchCategoryData(), fetchMemberData()]);
};

const fetchTrendData = async () => {
  try {
    const res = await api.get("/api/statistics/trend", {
      params: {
        start_date: dateRange.value.start,
        end_date: dateRange.value.end,
        granularity: "day",
      },
    });

    if (res.success) {
      updateTrendChart(res.data.trend_data);
    }
  } catch (error) {
    console.error("获取趋势数据失败:", error);
  }
};

const updateTrendChart = (data: TrendData[]) => {
  if (!trendChart) return;

  const chartData = data.map((d) => ({
    date: d.date,
    value: Number(d.amount) || 0,
  }));

  trendChart.setOption({
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const item = params[0];
        return `${item.axisValue}<br/>消费: ¥${Number(item.value).toFixed(2)}`;
      },
    },
    xAxis: {
      type: "category",
      data: chartData.map((d) => d.date.substring(5)),
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: "¥{value}",
      },
    },
    series: [
      {
        name: "消费金额",
        type: "line",
        smooth: true,
        data: chartData.map((d) => d.value),
        areaStyle: {
          opacity: 0.3,
        },
        itemStyle: {
          color: "#409EFF",
        },
      },
    ],
  });
};

const fetchCategoryData = async () => {
  try {
    const res = await api.get("/api/statistics/category", {
      params: {
        start_date: dateRange.value.start,
        end_date: dateRange.value.end,
      },
    });

    if (res.success) {
      updateCategoryChart(res.data.categories);
    }
  } catch (error) {
    console.error("获取分类数据失败:", error);
  }
};

const updateCategoryChart = (data: any[]) => {
  if (!categoryChart) return;

  const chartData = data.map((d) => ({
    name: d.category_name,
    value: Number(d.total_amount) || 0,
  }));

  categoryChart.setOption({
    tooltip: {
      trigger: "item",
      formatter: "{b}: ¥{c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        center: ["40%", "50%"],
        label: {
          show: true,
          formatter: "{b}\n{d}%",
        },
        emphasis: {
          label: {
            show: true,
            formatter: "{b}\n¥{c}\n{d}%",
            fontSize: 14,
            fontWeight: "bold",
          },
        },
        data: chartData,
      },
    ],
  });
};

const fetchMemberData = async () => {
  try {
    const res = await api.get("/api/statistics/member", {
      params: {
        start_date: dateRange.value.start,
        end_date: dateRange.value.end,
      },
    });

    if (res.success) {
      updateMemberChart(res.data.members);
    }
  } catch (error) {
    console.error("获取成员数据失败:", error);
  }
};

const updateMemberChart = (data: any[]) => {
  if (!memberChart) return;

  const chartData = data.map((d) => ({
    name: d.member_name,
    value: Number(d.total_amount) || 0,
    itemStyle: {
      color: d.member_color || "#4ECDC4",
    },
  }));

  memberChart.setOption({
    tooltip: {
      trigger: "item",
      formatter: "{b}: ¥{c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        center: ["40%", "50%"],
        label: {
          show: true,
          formatter: "{b}\n{d}%",
        },
        emphasis: {
          label: {
            show: true,
            formatter: "{b}\n¥{c}\n{d}%",
            fontSize: 14,
            fontWeight: "bold",
          },
        },
        data: chartData,
      },
    ],
  });
};

const prevMonth = () => {
  const prev = getPreviousMonth(currentYear.value, currentMonth.value);
  currentYear.value = prev.year;
  currentMonth.value = prev.month;
  quickSelect.value = "custom";
  fetchData();
};

const nextMonth = () => {
  const next = getNextMonth(currentYear.value, currentMonth.value);
  currentYear.value = next.year;
  currentMonth.value = next.month;
  quickSelect.value = "custom";
  fetchData();
};

const handleQuickSelect = (val: "thisMonth" | "lastMonth" | "custom") => {
  if (val === "thisMonth") {
    const { year, month } = getCurrentMonth();
    currentYear.value = year;
    currentMonth.value = month;
  } else if (val === "lastMonth") {
    const { year, month } = getCurrentMonth();
    const prev = getPreviousMonth(year, month);
    currentYear.value = prev.year;
    currentMonth.value = prev.month;
  }
  fetchData();
};

const handleCustomDateChange = () => {
  if (customDateRange.value) {
    fetchData();
  }
};

const runAnalysis = async () => {
  analyzing.value = true;
  try {
    const startDate = new Date(dateRange.value.start);
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;

    const budgetRes = await api.get("/api/budget", {
      params: {
        year,
        month,
      },
    });

    const budget = budgetRes.success
      ? {
          total: Number(budgetRes.data.total_budget) || 0,
          categories: Object.fromEntries(
            budgetRes.data.category_budgets.map((b: any) => [
              b.category_name,
              Number(b.budget_amount) || 0,
            ]),
          ),
        }
      : { total: 0, categories: {} };

    const expenseRes = await api.get("/api/expense", {
      params: {
        start_date: dateRange.value.start,
        end_date: dateRange.value.end,
        pageSize: 10000,
      },
    });

    const expenses = expenseRes.success ? expenseRes.data.list : [];

    const res = await api.post("/api/statistics/analysis", {
      start_date: dateRange.value.start,
      end_date: dateRange.value.end,
      budget,
      data: expenses,
    });

    if (res.success) {
      analysis.value = res.data;

      await api.post("/api/ai/analysis/save", {
        start_date: dateRange.value.start,
        end_date: dateRange.value.end,
        analysis_data: res.data,
      });

      ElMessage.success("分析完成并已保存");
    } else {
      ElMessage.error(res.message || "AI分析失败");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "AI分析失败");
  } finally {
    analyzing.value = false;
  }
};

const exportExcel = async () => {
  try {
    const params = new URLSearchParams({
      start_date: dateRange.value.start,
      end_date: dateRange.value.end,
    });

    window.open(`/api/statistics/export?${params.toString()}`, "_blank");
  } catch (error: any) {
    ElMessage.error(error.message || "导出失败");
  }
};

const fetchHistoryRecords = async () => {
  loadingHistory.value = true;
  try {
    const res = await api.get("/api/ai/analysis/list", {
      params: {
        page: historyPage.value,
        page_size: historyPageSize.value,
      },
    });

    if (res.success) {
      historyRecords.value = res.data.list;
      historyTotal.value = res.data.total;
    }
  } catch (error: any) {
    ElMessage.error(error.message || "获取历史记录失败");
  } finally {
    loadingHistory.value = false;
  }
};

const viewHistoryDetail = (record: AIAnalysisRecord) => {
  currentDetail.value = record;
  showDetailDialog.value = true;
};

watch(showHistoryDialog, (val) => {
  if (val) {
    fetchHistoryRecords();
  }
});
</script>

<style lang="scss" scoped>
.statistics-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-md;
    border-bottom: 1px solid $border-color;

    h2 {
      font-family: $font-display;
      font-size: 24px;
      font-weight: 700;
      color: $text-primary;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: $spacing-sm;
    }
  }

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
    margin-bottom: $spacing-md;

    .el-icon {
      font-size: 16px;
      color: $primary;
    }
  }

  p {
    color: $text-secondary;
    line-height: 1.6;
  }
}

.insight-card {
  .insight-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .insight-actions {
      display: flex;
      gap: $spacing-sm;
    }
  }
}

.stat-box {
  text-align: center;
  padding: $spacing-md;
  background: $bg-light;
  border-radius: $border-radius;

  .stat-label {
    font-size: 12px;
    color: $text-muted;
    margin-bottom: $spacing-xs;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: $text-primary;
    font-family: $font-mono;

    &.expense {
      color: $accent;
    }

    &.warning {
      color: $warning;
    }
  }
}

.anomaly-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.anomaly-item {
  padding: $spacing-md;
  background: $bg-light;
  border-radius: $border-radius;
  border-left: 3px solid $warning;

  .anomaly-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-xs;

    .anomaly-category {
      font-weight: 600;
      color: $text-primary;
    }

    .anomaly-amount {
      margin-left: auto;
      font-weight: 700;
      color: $accent;
      font-family: $font-mono;
    }
  }

  .anomaly-desc {
    font-size: 13px;
    color: $text-secondary;
    line-height: 1.5;
  }

  .anomaly-date {
    font-size: 12px;
    color: $text-muted;
    margin-top: $spacing-xs;
  }
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.suggestion-item {
  padding: $spacing-md;
  background: rgba(78, 205, 196, 0.05);
  border-radius: $border-radius;
  border-left: 3px solid $primary;

  .suggestion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-xs;

    .suggestion-category {
      font-weight: 600;
      color: $text-primary;
    }
  }

  .suggestion-content {
    font-size: 13px;
    color: $text-secondary;
    line-height: 1.6;
  }
}

.prediction-content {
  .confidence {
    font-size: 12px;
    color: $text-muted;
    margin-top: $spacing-xs;
  }

  .no-data-hint {
    color: $text-muted;
    font-style: italic;
  }
}

.percentage {
  font-size: 12px;
  color: $text-secondary;
}

.amount {
  font-family: $font-mono;
  font-weight: 600;
  color: $accent;
}

.increase {
  color: $accent;
  font-weight: 600;
}

.decrease {
  color: $success;
  font-weight: 600;
}

.pagination-wrapper {
  margin-top: $spacing-md;
  display: flex;
  justify-content: flex-end;
}

.detail-content {
  .detail-header {
    display: flex;
    gap: $spacing-xl;
    padding: $spacing-md;
    background: #f5f7fa;
    border-radius: $border-radius;
    margin-bottom: $spacing-lg;
    font-size: 13px;
    color: #606266;
  }

  .insight-section {
    h4 {
      color: #303133;
    }

    .stat-box {
      background: #f5f7fa;

      .stat-label {
        color: #909399;
      }

      .stat-value {
        color: #303133;
      }
    }

    .anomaly-item {
      background: #fafafa;
      border-left-color: #e6a23c;

      .anomaly-category {
        color: #303133;
      }

      .anomaly-desc {
        color: #606266;
      }
    }

    .suggestion-item {
      background: #f0f9eb;
      border-left-color: #67c23a;

      .suggestion-category {
        color: #303133;
      }

      .suggestion-content {
        color: #606266;
      }
    }
  }
}

@media (max-width: $breakpoint-sm) {
  .time-selector {
    flex-direction: column;
    align-items: flex-start;
  }

  .stat-box {
    .stat-value {
      font-size: 16px;
    }
  }
}
</style>

<style lang="scss">
.history-dialog,
.detail-dialog {
  .el-dialog {
    --el-dialog-bg-color: #ffffff !important;
    background: #ffffff !important;
  }

  .el-dialog__header {
    background-color: #ffffff !important;
    border-bottom: 1px solid #e4e7ed;
  }

  .el-dialog__title {
    color: #1a1a1a !important;
    font-weight: 600;
  }

  .el-dialog__headerbtn .el-dialog__close {
    color: #606266 !important;
  }

  .el-dialog__body {
    background-color: #ffffff !important;
    color: #1a1a1a !important;
    padding: 20px;
  }

  .el-table {
    --el-table-bg-color: #ffffff;
    --el-table-tr-bg-color: #ffffff;
    --el-table-header-bg-color: #f5f5f5;
    --el-table-row-hover-bg-color: #f0f0f0;
    --el-table-text-color: #1a1a1a;
    --el-table-header-text-color: #1a1a1a;
    background-color: #ffffff !important;
    color: #1a1a1a !important;

    th.el-table__cell {
      background-color: #f5f5f5 !important;
      color: #1a1a1a !important;
      font-weight: 600;
    }

    td.el-table__cell {
      color: #333333 !important;
    }

    .el-table__body tr:hover > td.el-table__cell {
      background-color: #f0f0f0 !important;
    }

    .el-table__row--striped td.el-table__cell {
      background-color: #fafafa !important;
    }

    .el-table__empty-text {
      color: #333333 !important;
    }
  }

  .el-button.is-link {
    color: #409eff !important;
  }

  .el-tag {
    --el-tag-bg-color: #f4f4f5;
    --el-tag-text-color: #1a1a1a;
  }

  .el-pagination {
    --el-pagination-bg-color: #ffffff;
    --el-pagination-text-color: #333333;
    --el-pagination-button-bg-color: #f4f4f5;
    --el-pagination-hover-color: #409eff;

    .el-pagination__total {
      color: #333333 !important;
    }

    .el-pagination__jump {
      color: #333333 !important;
    }

    button {
      background-color: #f4f4f5 !important;
      color: #333333 !important;
    }

    .el-pager li {
      background-color: #f4f4f5 !important;
      color: #333333 !important;

      &.is-active {
        color: #ffffff !important;
        background-color: #409eff !important;
      }
    }
  }
}
</style>
