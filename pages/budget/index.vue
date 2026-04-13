<template>
  <div class="budget-page">
    <div class="page-header">
      <h2>预算管理</h2>
    </div>

    <div class="budget-layout">
      <!-- 左侧：预算设置 -->
      <div class="budget-left">
        <!-- 月份选择 + 总预算 -->
        <el-card class="setting-card">
          <div class="setting-row month-row">
            <span class="setting-label">月份</span>
            <el-date-picker
              v-model="selectedMonth"
              type="month"
              placeholder="选择月份"
              value-format="YYYY-MM"
              style="width: 180px"
              @change="fetchBudgetData"
            />
            <span class="month-label">{{ monthLabel }}</span>
          </div>

          <el-divider />

          <div class="setting-row budget-row">
            <span class="setting-label">总预算</span>
            <span class="currency">¥</span>
            <el-input-number
              v-model="budgetForm.total_budget"
              :precision="2"
              :min="0"
              :step="100"
              size="large"
              style="width: 200px"
            />
          </div>

          <el-divider />

          <div class="budget-summary-row">
            <span class="summary-item">
              分类合计: ¥{{ Number(totalCategoryBudget).toFixed(2) }}
            </span>
            <span v-if="remainingBudget >= 0" class="summary-item remaining">
              剩余: ¥{{ Number(remainingBudget).toFixed(2) }}
            </span>
            <span v-else class="summary-item exceeded">
              超出: ¥{{ Math.abs(Number(remainingBudget)).toFixed(2) }}
            </span>
          </div>
        </el-card>

        <!-- 分类预算分配 -->
        <el-card class="category-card">
          <template #header>
            <span class="card-title">分类预算分配</span>
          </template>
          <div class="category-list">
            <div
              v-for="category in categoryStore.parentCategories"
              :key="category.id"
              class="category-item"
            >
              <span class="category-name">{{ category.name }}</span>
              <el-input-number
                v-model="getCategoryBudget(category.id).budget_amount"
                :precision="2"
                :min="0"
                size="small"
                style="width: 140px"
              />
              <div class="category-progress" v-if="categoryProgress.length > 0">
                <el-progress
                  :percentage="getCategoryProgress(category.id)"
                  :status="getProgressStatus(category.id)"
                  :stroke-width="6"
                  style="width: 100px"
                />
                <span class="progress-text">
                  {{ getCategoryProgress(category.id) >= 100 ? '超支' : `${getCategoryProgress(category.id)}%` }}
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧：预算执行情况 -->
      <div class="budget-right">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">预算执行情况</span>
          </template>
          <div ref="budgetChartRef" class="chart"></div>
        </el-card>
      </div>
    </div>

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
import { ElMessage } from "element-plus";
import * as echarts from "echarts";
import type { CategoryBudget, BudgetProgress } from "~/types";
import { getCurrentMonth } from "~/utils/format";

definePageMeta({
  middleware: ["auth"],
});

const categoryStore = useCategoryStore();
const api = useApi();

/** 当前选择的月份 */
const selectedMonth = ref("");
const currentYear = computed(() => {
  if (!selectedMonth.value) return 2024;
  return parseInt(selectedMonth.value.split("-")[0]);
});
const currentMonthNum = computed(() => {
  if (!selectedMonth.value) return 1;
  return parseInt(selectedMonth.value.split("-")[1]);
});
const monthLabel = computed(() => {
  if (!selectedMonth.value) return "";
  const [year, month] = selectedMonth.value.split("-");
  return `${year}年${month}月`;
});

/** 预算表单数据 */
const budgetForm = reactive({
  total_budget: 0,
  category_budgets: [] as CategoryBudget[],
});

/** 分类预算执行进度 */
const categoryProgress = ref<BudgetProgress[]>([]);

/** 保存状态 */
const saving = ref(false);

/** 图表引用 */
const budgetChartRef = ref<HTMLElement>();
let budgetChart: echarts.ECharts | null = null;

/** 分类预算合计 */
const totalCategoryBudget = computed(() => {
  return budgetForm.category_budgets.reduce(
    (sum, item) => sum + item.budget_amount,
    0,
  );
});

/** 剩余预算 */
const remainingBudget = computed(() => {
  return budgetForm.total_budget - totalCategoryBudget.value;
});

/** 初始化页面 */
onMounted(async () => {
  const { year, month } = getCurrentMonth();
  selectedMonth.value = `${year}-${month.toString().padStart(2, "0")}`;

  await categoryStore.fetchCategories();
  initCategoryBudgets();
  initChart();
  await fetchBudgetData();
});

/** 初始化分类预算列表 */
const initCategoryBudgets = () => {
  budgetForm.category_budgets = categoryStore.parentCategories.map((cat) => ({
    category_id: cat.id,
    category_name: cat.name,
    budget_amount: 0,
  }));
};

/** 获取指定分类的预算配置 */
const getCategoryBudget = (categoryId: number) => {
  const budget = budgetForm.category_budgets.find(
    (b) => b.category_id === categoryId,
  );
  return budget || { category_id: categoryId, category_name: "", budget_amount: 0 };
};

/** 获取指定分类的执行进度百分比 */
const getCategoryProgress = (categoryId: number) => {
  const progress = categoryProgress.value.find(
    (p) => p.category_id === categoryId,
  );
  return progress ? Math.round(progress.percentage) : 0;
};

/** 获取进度条状态 */
const getProgressStatus = (categoryId: number) => {
  const percentage = getCategoryProgress(categoryId);
  if (percentage >= 100) return "exception";
  if (percentage >= 80) return "warning";
  return "success";
};

/** 初始化图表实例 */
const initChart = () => {
  if (budgetChartRef.value) {
    budgetChart = echarts.init(budgetChartRef.value);
    window.addEventListener("resize", () => {
      budgetChart?.resize();
    });
  }
};

/** 获取预算数据 */
const fetchBudgetData = async () => {
  if (!selectedMonth.value) return;

  try {
    const budgetRes = await api.get("/api/budget", {
      params: {
        year: currentYear.value,
        month: currentMonthNum.value,
      },
    });

    if (budgetRes.success) {
      budgetForm.total_budget = budgetRes.data.total_budget;
      budgetRes.data.category_budgets.forEach((saved: any) => {
        const budget = budgetForm.category_budgets.find(
          (b) => b.category_id === saved.category_id,
        );
        if (budget) {
          budget.budget_amount = saved.budget_amount;
        }
      });
    }

    const progressRes = await api.get("/api/budget/progress", {
      params: {
        year: currentYear.value,
        month: currentMonthNum.value,
      },
    });

    if (progressRes.success) {
      categoryProgress.value = progressRes.data.category_progress;
      updateChart(progressRes.data);
    }
  } catch (error) {
    console.error("获取预算数据失败:", error);
  }
};

/** 更新图表数据 */
const updateChart = (data: any) => {
  if (!budgetChart) return;

  budgetChart.setOption({
    tooltip: {
      trigger: "item",
    },
    series: [
      {
        type: "pie",
        radius: ["50%", "70%"],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: "center",
          formatter: () => {
            const percent =
              data.total_budget > 0
                ? Math.round((data.total_spent / data.total_budget) * 100)
                : 0;
            return `${percent}%\n已使用`;
          },
          fontSize: 20,
          fontWeight: "bold",
        },
        data: [
          {
            value: data.total_spent,
            name: "已支出",
            itemStyle: { color: "#409EFF" },
          },
          {
            value: Math.max(0, data.total_remaining),
            name: "剩余",
            itemStyle: { color: "#E4E7ED" },
          },
        ],
      },
    ],
  });
};

/** 保存预算设置 */
const saveBudget = async () => {
  if (remainingBudget.value < 0) {
    ElMessage.warning("分类预算总和不能超过总预算");
    return;
  }

  saving.value = true;
  try {
    const res = await api.post("/api/budget", {
      year: currentYear.value,
      month: currentMonthNum.value,
      total_budget: budgetForm.total_budget,
      category_budgets: budgetForm.category_budgets.filter(
        (b) => b.budget_amount > 0,
      ),
    });

    if (res.success) {
      ElMessage.success("保存成功");
      await fetchBudgetData();
    } else {
      ElMessage.error(res.message || "保存失败");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "保存失败");
  } finally {
    saving.value = false;
  }
};

/** 重置表单 */
const resetForm = () => {
  budgetForm.total_budget = 0;
  initCategoryBudgets();
};
</script>

<style lang="scss" scoped>
.budget-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.budget-layout {
  display: flex;
  gap: $spacing-lg;
  flex: 1;
  min-height: 0;
}

.budget-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  min-width: 0;
}

.budget-right {
  width: 380px;
  flex-shrink: 0;
}

.setting-card {
  .setting-row {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  .setting-label {
    font-weight: 600;
    color: $text-primary;
    font-size: 14px;
    min-width: 56px;
  }

  .month-label {
    font-size: 15px;
    font-weight: 500;
    color: $text-secondary;
  }

  .currency {
    font-size: 22px;
    font-weight: 600;
    color: $text-primary;
  }

  .budget-summary-row {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
    font-size: 13px;
    color: $text-secondary;

    .remaining {
      color: $success;
      font-weight: 500;
    }

    .exceeded {
      color: $accent;
      font-weight: 500;
    }
  }

  :deep(.el-divider) {
    margin: $spacing-md 0;
  }
}

.category-card {
  flex: 1;
  min-height: 0;

  :deep(.el-card__body) {
    padding: $spacing-md $spacing-lg;
    overflow-y: auto;
    max-height: calc(100vh - 420px);
  }

  .card-title {
    font-weight: 600;
    color: $text-primary;
  }
}

.category-list {
  display: flex;
  flex-direction: column;
}

.category-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm 0;
  border-bottom: 1px solid $border-light;

  &:last-child {
    border-bottom: none;
  }

  .category-name {
    width: 60px;
    font-weight: 500;
    color: $text-primary;
    font-size: 14px;
    flex-shrink: 0;
  }

  .category-progress {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-left: auto;

    .progress-text {
      font-size: 12px;
      color: $text-secondary;
      min-width: 36px;
      text-align: right;
    }
  }
}

.chart-card {
  height: 100%;

  .card-title {
    font-weight: 600;
    color: $text-primary;
  }

  .chart {
    width: 100%;
    height: calc(100vh - 280px);
    min-height: 300px;
  }
}

.page-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  padding-top: $spacing-md;
  flex-shrink: 0;
}

@media (max-width: $breakpoint-md) {
  .budget-layout {
    flex-direction: column;
  }

  .budget-right {
    width: 100%;
  }

  .chart-card .chart {
    height: 300px;
  }
}
</style>
