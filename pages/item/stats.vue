<template>
  <div class="stats-page">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="overview-card">
          <template #header>
            <div class="card-header">
              <span>资产总览</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value">{{ overview.total_items }}</div>
                <div class="stat-label">物品总数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value">
                  {{ formatMoney(overview.total_value) }}
                </div>
                <div class="stat-label">资产总价值</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value">{{ overview.avg_usage_days }}</div>
                <div class="stat-label">平均使用天数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value">
                  {{ formatMoney(overview.avg_cpd) }}
                </div>
                <div class="stat-label">平均日均成本</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>分类资产占比</span>
            </div>
          </template>
          <div ref="categoryChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>CPD排行榜</span>
            </div>
          </template>
          <div class="cpd-ranking">
            <div
              v-for="(item, index) in cpdRanking"
              :key="item.id"
              class="ranking-item"
            >
              <div class="ranking-index">{{ index + 1 }}</div>
              <div class="ranking-info">
                <div class="ranking-name">{{ item.name }}</div>
                <div class="ranking-category">{{ item.category_name }}</div>
              </div>
              <div class="ranking-cpd">{{ formatMoney(item.cpd) }}/天</div>
            </div>
            <el-empty v-if="cpdRanking.length === 0" description="暂无数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>CPD趋势图</span>
            </div>
          </template>
          <div ref="trendChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>低使用率提醒</span>
              <el-tag type="warning" size="small"
                >{{ lowUsageItems.length }} 件</el-tag
              >
            </div>
          </template>
          <div class="low-usage-list">
            <div
              v-for="item in lowUsageItems"
              :key="item.id"
              class="low-usage-item"
              @click="goToDetail(item.id)"
            >
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-meta">
                  <span>购入金额: {{ formatMoney(item.purchase_amount) }}</span>
                  <span>使用天数: {{ item.usage_days }} 天</span>
                </div>
              </div>
              <div class="item-cpd">{{ formatMoney(item.cpd) }}/天</div>
            </div>
            <el-empty
              v-if="lowUsageItems.length === 0"
              description="暂无低使用率物品"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import * as echarts from "echarts";

definePageMeta({
  layout: "default",
  middleware: "auth",
});

const router = useRouter();

const overview = ref({
  total_items: 0,
  total_value: 0,
  avg_usage_days: 0,
  avg_cpd: 0,
});

const categoryStats = ref<any[]>([]);
const cpdRanking = ref<any[]>([]);
const lowUsageItems = ref<any[]>([]);
const trendData = ref<any[]>([]);

const categoryChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();
let categoryChart: echarts.ECharts | null = null;
let trendChart: echarts.ECharts | null = null;

/**
 * 格式化金额
 */
const formatMoney = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "¥0.00";
  return `¥${amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * 获取资产总览
 */
const fetchOverview = async () => {
  try {
    const api = useApi();
    const response = await api.get("/api/item/stats/overview");
    if (response.success && response.data.overview) {
      overview.value = response.data.overview;
    }
  } catch (error: any) {
    console.error("获取资产总览失败:", error);
  }
};

/**
 * 获取分类统计
 */
const fetchCategoryStats = async () => {
  try {
    const api = useApi();
    const response = await api.get("/api/item/stats/category");
    if (response.success && response.data) {
      categoryStats.value = response.data;
      await nextTick();
      renderCategoryChart();
    }
  } catch (error: any) {
    console.error("获取分类统计失败:", error);
  }
};

/**
 * 获取CPD排行榜
 */
const fetchCpdRanking = async () => {
  try {
    const api = useApi();
    const response = await api.get("/api/item/stats/cpd-ranking");
    if (response.success && response.data) {
      cpdRanking.value = response.data.slice(0, 10);
    }
  } catch (error: any) {
    console.error("获取CPD排行榜失败:", error);
  }
};

/**
 * 获取低使用率物品
 */
const fetchLowUsageItems = async () => {
  try {
    const api = useApi();
    const response = await api.get("/api/item/stats/low-usage");
    if (response.success && response.data) {
      lowUsageItems.value = response.data;
    }
  } catch (error: any) {
    console.error("获取低使用率物品失败:", error);
  }
};

/**
 * 获取趋势数据
 */
const fetchTrendData = async () => {
  try {
    const api = useApi();
    const response = await api.get("/api/item/stats/trend");
    if (response.success && response.data) {
      trendData.value = response.data;
      await nextTick();
      renderTrendChart();
    }
  } catch (error: any) {
    console.error("获取趋势数据失败:", error);
  }
};

/**
 * 渲染分类图表
 */
const renderCategoryChart = () => {
  if (!categoryChartRef.value) return;

  if (!categoryChart) {
    categoryChart = echarts.init(categoryChartRef.value);
  }

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
    },
    series: [
      {
        name: "资产占比",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: categoryStats.value
          .filter((item) => item.total_value > 0)
          .map((item) => ({
            value: item.total_value,
            name: item.category_name,
          })),
      },
    ],
  };

  categoryChart.setOption(option);
};

/**
 * 渲染趋势图表
 */
const renderTrendChart = () => {
  if (!trendChartRef.value) return;

  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value);
  }

  const option = {
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      type: "category",
      data: trendData.value.map((item) => item.date),
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: "¥{value}",
      },
    },
    series: [
      {
        name: "日均成本",
        type: "line",
        smooth: true,
        data: trendData.value.map((item) => item.avg_cpd),
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(64, 158, 255, 0.5)" },
            { offset: 1, color: "rgba(64, 158, 255, 0.1)" },
          ]),
        },
      },
    ],
  };

  trendChart.setOption(option);
};

/**
 * 跳转到详情页
 */
const goToDetail = (id: number) => {
  router.push(`/item/${id}`);
};

onMounted(() => {
  fetchOverview();
  fetchCategoryStats();
  fetchCpdRanking();
  fetchLowUsageItems();
  fetchTrendData();

  window.addEventListener("resize", () => {
    categoryChart?.resize();
    trendChart?.resize();
  });
});
</script>

<style scoped lang="scss">
.stats-page {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }

  .overview-card {
    .stat-item {
      text-align: center;
      padding: 20px 0;

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #409eff;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }
  }

  .cpd-ranking {
    max-height: 300px;
    overflow-y: auto;

    .ranking-item {
      display: flex;
      align-items: center;
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .ranking-index {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f7fa;
        border-radius: 50%;
        margin-right: 12px;
        font-weight: bold;
        color: #606266;
      }

      .ranking-info {
        flex: 1;

        .ranking-name {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .ranking-category {
          font-size: 12px;
          color: #909399;
        }
      }

      .ranking-cpd {
        font-size: 14px;
        font-weight: bold;
        color: #409eff;
      }
    }
  }

  .low-usage-list {
    max-height: 300px;
    overflow-y: auto;

    .low-usage-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background 0.3s;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: #f5f7fa;
      }

      .item-info {
        flex: 1;

        .item-name {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .item-meta {
          font-size: 12px;
          color: #909399;

          span {
            margin-right: 12px;
          }
        }
      }

      .item-cpd {
        font-size: 14px;
        font-weight: bold;
        color: #e6a23c;
      }
    }
  }
}
</style>
