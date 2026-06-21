<template>
  <div class="expense-history-page" :class="{ 'is-mobile': isMobile }">
    <div class="page-header">
      <h2>消费记录</h2>
      <div class="header-actions">
        <el-input
          v-model="smartSearchQuery"
          placeholder="智能搜索，如'上个月吃的火锅'"
          clearable
          style="width: 280px"
          @keyup.enter="handleSmartSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" :loading="smartSearchLoading" @click="handleSmartSearch">
          搜索
        </el-button>
        <el-button type="primary" @click="goToCreate">
          <el-icon><Plus /></el-icon>
          <span v-if="!isMobile">新增记账</span>
        </el-button>
      </div>
    </div>
    
    <!-- 智能搜索结果提示 -->
    <el-alert
      v-if="smartSearchResult"
      :title="smartSearchResult.answer"
      type="success"
      :closable="true"
      @close="clearSmartSearch"
      class="smart-search-alert"
    />

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <div
        v-if="isMobile"
        class="mobile-filter-header"
        @click="filterExpanded = !filterExpanded"
      >
        <span class="filter-title">
          <el-icon><Filter /></el-icon>
          筛选条件
        </span>
        <el-icon class="filter-arrow" :class="{ expanded: filterExpanded }">
          <ArrowDown />
        </el-icon>
      </div>
      <div
        :class="{
          'filter-body': isMobile,
          'filter-collapsed': isMobile && !filterExpanded,
        }"
      >
        <el-form :inline="!isMobile" :model="filters" class="filter-form">
          <el-form-item label="日期范围">
            <el-date-picker
              v-if="!isMobile"
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              @change="handleDateChange"
            />
            <el-date-picker
              v-else
              v-model="startDateTemp"
              type="date"
              placeholder="开始日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              @change="handleStartDateChange"
            />
          </el-form-item>
          <el-form-item v-if="isMobile" label="结束日期">
            <el-date-picker
              v-model="endDateTemp"
              type="date"
              placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              @change="handleEndDateChange"
            />
          </el-form-item>
          <el-form-item label="分类">
            <el-cascader
              v-model="filters.category_id"
              :options="categoryCascaderData"
              :props="{
                checkStrictly: true,
                value: 'id',
                label: 'name',
                emitPath: false,
              }"
              placeholder="全部分类"
              clearable
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="成员">
            <el-select
              v-model="filters.member_id"
              placeholder="全部成员"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="member in memberStore.members"
                :key="member.id"
                :label="member.name"
                :value="member.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input
              v-model="filters.keyword"
              placeholder="搜索备注..."
              clearable
              style="width: 100%"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item v-if="isMobile">
            <el-button type="primary" @click="handleQuery" style="width: 100%">
              查询
            </el-button>
          </el-form-item>
          <el-form-item v-if="isMobile">
            <el-button @click="resetFilters" style="width: 100%">
              重置
            </el-button>
          </el-form-item>
          <div v-if="!isMobile" class="filter-actions">
            <el-button type="primary" @click="handleQuery">
              查询
            </el-button>
            <el-button @click="resetFilters">
              重置
            </el-button>
          </div>
        </el-form>
      </div>
    </el-card>

    <!-- 统计摘要 -->
    <el-card class="summary-card">
      <el-skeleton animated :loading="loading" style="width: 100%">
        <template #template>
          <el-row :gutter="16">
            <el-col :span="4"><el-skeleton-item variant="rect" style="height: 90px; border-radius: 12px;" /></el-col>
            <el-col :span="4"><el-skeleton-item variant="rect" style="height: 90px; border-radius: 12px;" /></el-col>
            <el-col :span="4"><el-skeleton-item variant="rect" style="height: 90px; border-radius: 12px;" /></el-col>
            <el-col :span="4"><el-skeleton-item variant="rect" style="height: 90px; border-radius: 12px;" /></el-col>
            <el-col :span="8"><el-skeleton-item variant="rect" style="height: 90px; border-radius: 12px;" /></el-col>
          </el-row>
        </template>
        <template #default>
          <el-row :gutter="isMobile ? 8 : 16">
            <el-col :span="isMobile ? 12 : 4">
              <div class="stat-item">
                <span class="label">总支出</span>
                <span class="value accent">
                  ¥{{ Number(summary.total_amount || 0).toFixed(2) }}
                </span>
              </div>
            </el-col>
            <el-col :span="isMobile ? 12 : 4">
              <div class="stat-item">
                <span class="label">记录数</span>
                <span class="value">{{ Number(summary.total_count || 0) }}条</span>
              </div>
            </el-col>
            <el-col :span="isMobile ? 12 : 4">
              <div class="stat-item">
                <span class="label">平均</span>
                <span class="value">
                  ¥{{ Number(summary.avg_amount || 0).toFixed(2) }}
                </span>
              </div>
            </el-col>
            <el-col :span="isMobile ? 12 : 4">
              <div class="stat-item">
                <span class="label">最高</span>
                <span class="value">
                  ¥{{ Number(summary.max_amount || 0).toFixed(2) }}
                </span>
              </div>
            </el-col>
            <el-col :span="isMobile ? 24 : 8">
              <div class="chart-container" ref="chartRef"></div>
            </el-col>
          </el-row>
        </template>
      </el-skeleton>
    </el-card>

    <!-- 桌面端：表格列表 -->
    <el-card v-if="!isMobile" class="list-card">
      <el-skeleton animated :loading="loading" :rows="10">
        <template #default>
          <el-table :data="expenseList" stripe>
            <el-table-column label="消费日期" width="120" align="center">
              <template #default="{ row }">
                <span class="date">{{
                  row.expense_date ? formatDate(row.expense_date) : "-"
                }}</span>
              </template>
            </el-table-column>
            <el-table-column label="消费时间" width="100" align="center">
              <template #default="{ row }">
                <span class="time">{{ row.expense_time || "-" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="分类" width="120">
              <template #default="{ row }">
                <el-tag type="primary" size="small">{{ row.category_name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="member_name" label="成员" width="100">
              <template #default="{ row }">
                <div v-if="row.member_name" class="member-tag" :style="{ backgroundColor: row.member_color || '#4ECDC4' }">
                  {{ row.member_name }}
                </div>
                <span v-else class="text-placeholder">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="100" align="right">
              <template #default="{ row }">
                <span class="amount">¥{{ Number(row.amount).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="description"
              label="备注"
              min-width="150"
              show-overflow-tooltip
            >
          <template #default="{ row }">
            <span class="description">{{ row.description || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160" align="center">
          <template #default="{ row }">
            <span class="datetime-small">{{
              row.created_at ? formatDateTimeStandard(row.created_at) : "-"
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="修改时间" width="160" align="center">
          <template #default="{ row }">
            <span class="datetime-small">{{
              row.updated_at ? formatDateTimeStandard(row.updated_at) : "-"
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canEdit(row)"
              link
              type="primary"
              @click="editExpense(row)"
              >编辑</el-button
            >
            <el-button
              v-if="canDelete(row)"
              link
              type="danger"
              @click="deleteExpense(row)"
              >删除</el-button
            >
            <span v-if="!canEdit(row) && !canDelete(row)" class="text-muted"
              >-</span
            >
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
        </template>
      </el-skeleton>
    </el-card>

    <!-- 移动端：卡片列表 -->
    <div v-if="isMobile" class="mobile-list" v-loading="loading">
      <div
        v-for="item in expenseList"
        :key="item.id"
        class="mobile-expense-card"
      >
        <div class="card-top">
          <div class="card-left">
            <div class="card-amount">¥{{ Number(item.amount).toFixed(2) }}</div>
            <div class="card-meta">
              <el-tag type="primary" size="small">{{
                item.category_name
              }}</el-tag>
              <div v-if="item.member_name" class="member-tag" :style="{ backgroundColor: item.member_color || '#4ECDC4' }">
                {{ item.member_name }}
              </div>
            </div>
          </div>
          <div class="card-right">
            <div class="card-date">
              {{ item.expense_date ? formatDate(item.expense_date) : "-" }}
            </div>
            <div class="card-time">{{ item.expense_time || "-" }}</div>
          </div>
        </div>
        <div v-if="item.description" class="card-desc">
          {{ item.description }}
        </div>
        <div class="card-actions">
          <el-button
            v-if="canEdit(item)"
            link
            type="primary"
            size="small"
            @click="editExpense(item)"
          >
            编辑
          </el-button>
          <el-button
            v-if="canDelete(item)"
            link
            type="danger"
            size="small"
            @click="deleteExpense(item)"
          >
            删除
          </el-button>
        </div>
      </div>

      <div v-if="!loading && expenseList.length === 0" class="mobile-empty">
        暂无消费记录
      </div>

      <div class="mobile-pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="prev, pager, next"
          small
          @change="fetchData"
        />
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <ExpenseEditDialog
      v-model="editDialogVisible"
      :expense="currentExpense"
      @success="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Filter, ArrowDown, Search } from "@element-plus/icons-vue";
import type { Expense, StatisticsSummary } from "~/types";
import { categoryTreeToCascaderData } from "~/utils/tree";
import {
  getMonthRange,
  getCurrentMonth,
  formatDateTime as formatDateTimeStandard,
  formatDate,
} from "~/utils/format";
import * as echarts from 'echarts';

definePageMeta({
  middleware: ["auth"],
});

const router = useRouter();
const categoryStore = useCategoryStore();
const memberStore = useMemberStore();
const userStore = useUserStore();
const api = useApi();

/** 判断是否为移动端 */
const isMobile = inject<Ref<boolean>>("isMobile", ref(false));

/** 移动端筛选区是否展开 */
const filterExpanded = ref(false);

/** 移动端开始日期临时变量 */
const startDateTemp = ref("");

/** 移动端结束日期临时变量 */
const endDateTemp = ref("");

/** 判断当前用户是否可以编辑该记录 */
const canEdit = (row: Expense): boolean => {
  if (userStore.isAdmin) return true;
  return row.created_by === userStore.user?.id;
};

/** 判断当前用户是否可以删除该记录（仅管理员） */
const canDelete = (row: Expense): boolean => {
  return userStore.isAdmin;
};

// 筛选条件
const dateRange = ref<[string, string] | null>(null);
const filters = reactive({
  start_date: "",
  end_date: "",
  category_id: null as number | null,
  member_id: null as number | null,
  keyword: "",
});

// 智能搜索
const smartSearchQuery = ref("");
const smartSearchLoading = ref(false);
const smartSearchResult = ref<any>(null);

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

// 数据
const loading = ref(false);
const expenseList = ref<Expense[]>([]);
const summary = ref<StatisticsSummary>({
  total_amount: 0,
  total_count: 0,
  avg_amount: 0,
  max_amount: 0,
  min_amount: 0,
  category_summary: [],
  member_summary: [],
});

// 编辑弹窗
const editDialogVisible = ref(false);
const currentExpense = ref<Expense | null>(null);

// 图表实例
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const renderChart = () => {
  if (!chartRef.value || !summary.value.trend_data || summary.value.trend_data.length === 0) {
    if (chartInstance) chartInstance.clear();
    return;
  }
  
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }
  
  const option = {
    grid: { top: 10, right: 10, bottom: 20, left: 10, containLabel: false },
    xAxis: { 
      type: 'category', 
      data: summary.value.trend_data.map(d => d.date.substring(5)), 
      show: false 
    },
    yAxis: { type: 'value', show: false, min: 'dataMin' },
    series: [{
      data: summary.value.trend_data.map(d => d.amount),
      type: 'line',
      smooth: true,
      lineStyle: { color: '#00a8cc', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(0, 168, 204, 0.4)' },
          { offset: 1, color: 'rgba(0, 168, 204, 0.0)' }
        ])
      },
      itemStyle: { opacity: 0 }
    }],
    tooltip: { 
      trigger: 'axis', 
      formatter: '{b}日: ¥{c}',
      backgroundColor: 'rgba(21, 25, 50, 0.9)',
      textStyle: { color: '#fff' },
      borderColor: 'rgba(0, 240, 255, 0.3)'
    }
  };
  chartInstance.setOption(option);
};

watch(() => summary.value.trend_data, () => {
  nextTick(() => {
    if (!loading.value) {
      renderChart();
    }
  });
});

watch(loading, (newVal) => {
  if (!newVal) {
    nextTick(() => {
      renderChart();
    });
  }
});

// 分类级联数据
const categoryCascaderData = computed(() => {
  return categoryTreeToCascaderData(categoryStore.tree);
});

// 初始化
onMounted(async () => {
  window.addEventListener('resize', () => chartInstance?.resize());

  await Promise.all([
    categoryStore.fetchCategories(),
    memberStore.fetchMembers(),
  ]);

  const { year, month } = getCurrentMonth();
  const range = getMonthRange(year, month);
  dateRange.value = [range.start, range.end];
  filters.start_date = range.start;
  filters.end_date = range.end;
  startDateTemp.value = range.start;
  endDateTemp.value = range.end;

  await fetchData();
});

onUnmounted(() => {
  window.removeEventListener('resize', () => chartInstance?.resize());
  chartInstance?.dispose();
});

/** 处理桌面端日期范围变化（仅更新筛选条件，不触发请求） */
const handleDateChange = (val: [string, string] | null) => {
  if (val) {
    filters.start_date = val[0];
    filters.end_date = val[1];
  } else {
    filters.start_date = "";
    filters.end_date = "";
  }
};

/** 处理移动端开始日期变化（仅更新筛选条件，不触发请求） */
const handleStartDateChange = (val: string) => {
  filters.start_date = val;
  if (!filters.end_date || filters.end_date < val) {
    endDateTemp.value = val;
    filters.end_date = val;
  }
};

/** 处理移动端结束日期变化（仅更新筛选条件，不触发请求） */
const handleEndDateChange = (val: string) => {
  filters.end_date = val;
};

/** 获取数据 */
const fetchData = async () => {
  loading.value = true;
  try {
    const [listRes, summaryRes] = await Promise.all([
      api.get("/api/expense", {
        params: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          ...filters,
        },
      }),
      api.get("/api/statistics/summary", {
        params: {
          start_date: filters.start_date,
          end_date: filters.end_date,
          category_id: filters.category_id,
          member_id: filters.member_id,
          keyword: filters.keyword,
        },
      }),
    ]);

    if (listRes.success) {
      expenseList.value = listRes.data.list;
      pagination.total = listRes.data.total;
    }

    if (summaryRes.success) {
      summary.value = summaryRes.data;
    }
  } finally {
    loading.value = false;
  }
};

/** 点击查询按钮（重置页码为第一页后请求） */
const handleQuery = () => {
  pagination.page = 1;
  fetchData();
};

/** 重置筛选条件 */
const resetFilters = () => {
  const { year, month } = getCurrentMonth();
  const range = getMonthRange(year, month);
  dateRange.value = [range.start, range.end];
  filters.start_date = range.start;
  filters.end_date = range.end;
  startDateTemp.value = range.start;
  endDateTemp.value = range.end;
  filters.category_id = null;
  filters.member_id = null;
  filters.keyword = "";
  pagination.page = 1;
  fetchData();
};

/** 编辑消费记录 */
const editExpense = (expense: Expense) => {
  currentExpense.value = { ...expense };
  editDialogVisible.value = true;
};

/** 删除消费记录 */
const deleteExpense = async (expense: Expense) => {
  try {
    await ElMessageBox.confirm("确定要删除这条记录吗？", "提示", {
      type: "warning",
    });

    const res = await api.delete(`/api/expense/${expense.id}`);

    if (res.success) {
      ElMessage.success("删除成功");
      fetchData();
    } else {
      ElMessage.error(res.message || "删除失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除失败");
    }
  }
};

/** 跳转到记账页 */
const goToCreate = () => {
  router.push("/expense/create");
};

/** 智能搜索 */
const handleSmartSearch = async () => {
  if (!smartSearchQuery.value.trim()) {
    ElMessage.warning("请输入搜索内容");
    return;
  }
  
  smartSearchLoading.value = true;
  try {
    const res = await api.post("/api/ai/search", {
      query_text: smartSearchQuery.value,
      limit: 100
    });
    
    if (res.success && res.data) {
      smartSearchResult.value = res.data;
      
      if (res.data.results && res.data.results.length > 0) {
        expenseList.value = res.data.results.map((item: any) => ({
          id: item.id,
          amount: item.amount,
          expense_date: item.date,
          expense_time: null,
          category_id: null,
          category_name: item.category,
          member_id: null,
          member_name: item.member,
          member_color: null,
          description: item.description,
          created_at: null,
          updated_at: null,
          created_by: null
        }));
        pagination.total = res.data.summary.total_count;
        summary.value = {
          total_amount: res.data.summary.total_amount,
          total_count: res.data.summary.total_count,
          avg_amount: res.data.summary.avg_amount,
          max_amount: 0,
          min_amount: 0,
          category_summary: [],
          member_summary: []
        };
      } else {
        ElMessage.info("没有找到符合条件的记录");
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message || "搜索失败");
  } finally {
    smartSearchLoading.value = false;
  }
};

/** 清除智能搜索结果 */
const clearSmartSearch = () => {
  smartSearchResult.value = null;
  smartSearchQuery.value = "";
  fetchData();
};
</script>

<style lang="scss" scoped>
.expense-history-page {
  // 成员标签样式
  .member-tag {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    color: white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  .smart-search-alert {
    margin-bottom: $spacing-md;
    border: 1px solid rgba($primary, 0.2);
    box-shadow: 0 4px 12px rgba($primary, 0.05);
  }

  .filter-card {
    margin-bottom: $spacing-lg;
    background: $glass-bg;
    border: 1px solid $glass-border;
    box-shadow: $glass-shadow;
    transition: all $transition-base;

    &:hover {
      box-shadow: $glass-shadow-hover;
      transform: translateY(-2px);
      border-color: rgba($primary, 0.2);
    }

    :deep(.el-card__body) {
      padding: $spacing-lg;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(248, 250, 252, 0.3) 100%);
    }

    .filter-form {
      :deep(.el-form-item) {
        margin-bottom: $spacing-md;
        margin-right: $spacing-md;
        display: inline-flex;
        align-items: center;
        vertical-align: top;

        &:last-child {
          margin-right: 0;
        }

        &:last-of-type {
          margin-bottom: 0;
        }
      }

      :deep(.el-form-item__label) {
        font-weight: 600;
        color: $text-secondary;
        min-width: 70px;
        text-align: right;
        padding-right: $spacing-md;
        line-height: 32px;
      }

      :deep(.el-form-item__content) {
        min-width: 180px;
        flex: 1;
      }

      :deep(.el-input__wrapper),
      :deep(.el-select__wrapper),
      :deep(.el-cascader__wrapper),
      :deep(.el-textarea__inner) {
        transition: all $transition-base;
      }

      :deep(.el-input__wrapper):hover,
      :deep(.el-select__wrapper):hover,
      :deep(.el-cascader__wrapper):hover {
        border-color: $primary-light;
      }

      :deep(.el-button) {
        font-weight: 600;
        min-height: 34px;
      }

      .filter-actions {
        display: flex;
        gap: $spacing-sm;
        justify-content: flex-end;
        align-items: center;
        margin-top: $spacing-sm;
        padding-top: $spacing-sm;
        border-top: 1px solid $border-light;
        width: 100%;
      }
    }
  }

  .summary-card {
    margin-bottom: $spacing-lg;
    background: $glass-bg;
    border: 1px solid $glass-border;
    box-shadow: $glass-shadow;
    transition: all $transition-base;

    &:hover {
      box-shadow: $glass-shadow-hover;
      transform: translateY(-2px);
      border-color: rgba($primary, 0.2);
    }

    :deep(.el-card__body) {
      background: linear-gradient(135deg, rgba($primary, 0.04) 0%, rgba($secondary, 0.04) 100%);
    }
  }

  .list-card {
    background: $glass-bg;
    border: 1px solid $glass-border;
    box-shadow: $glass-shadow;
    transition: all $transition-base;

    &:hover {
      box-shadow: $glass-shadow-hover;
    }

    .pagination {
      display: flex;
      justify-content: flex-end;
      margin-top: $spacing-lg;
    }
  }
}

  .stat-item {
    text-align: center;
    padding: $spacing-lg $spacing-md;
    background: var(--bg-card);
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  transition: all $transition-base;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: $gradient-primary;
    opacity: 0;
    transition: opacity $transition-base;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-lg;
    border-color: rgba($primary, 0.3);
    background: white;

    &::before {
      opacity: 1;
    }
  }

  .label {
    display: block;
    font-size: 11px;
    color: $text-muted;
    margin-bottom: $spacing-sm;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .value {
    display: block;
    font-size: 26px;
    font-weight: 800;
    color: $text-primary;
    font-family: $font-mono;
    letter-spacing: -0.5px;

    &.accent {
      background: $gradient-accent;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
}

.amount {
  color: $accent;
  font-weight: 700;
  font-size: 16px;
  font-family: $font-mono;
}

.date {
  font-size: 13px;
  color: $text-primary;
  font-family: $font-mono;
  font-weight: 600;
}

.time {
  font-size: 12px;
  color: $text-secondary;
  font-family: $font-mono;
  font-weight: 500;
}

.datetime-small {
  font-size: 11px;
  color: $text-muted;
  font-family: $font-mono;
  font-weight: 500;
}

.text-placeholder {
  color: $text-light;
}

.text-muted {
  color: $text-muted;
  font-size: 13px;
}

.description {
  color: $text-primary;
  font-weight: 600;
}

// ==================== 桌面端响应式优化 ====================
@media (min-width: $breakpoint-lg) {
  .expense-history-page {
    .filter-card {
      .filter-form {
        :deep(.el-form-item__label) {
          min-width: 80px;
        }

        :deep(.el-form-item__content) {
          min-width: 200px;
        }
      }
    }
  }
}

// ==================== 移动端样式 ====================
.is-mobile {
  .page-header {
    h2 {
      font-size: 18px;
    }
  }

  .filter-card {
    box-shadow: $shadow-md;

    :deep(.el-card__body) {
      padding: 0;
      background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
    }
  }

  .mobile-filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-md $spacing-mobile-md;
    cursor: pointer;
    background: rgba($primary, 0.05);
    border-bottom: 1px solid $border-color;

    .filter-title {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      font-size: 14px;
      font-weight: 700;
      color: $text-primary;
    }

    .filter-arrow {
      transition: transform $transition-base;
      color: $text-muted;

      &.expanded {
        transform: rotate(180deg);
      }
    }
  }

  .filter-body {
    overflow: hidden;
    transition:
      max-height 0.3s ease,
      padding 0.3s ease;
    max-height: 500px;
    padding: 0 $spacing-mobile-md $spacing-mobile-md;

    &.filter-collapsed {
      max-height: 0;
      padding-top: 0;
      padding-bottom: 0;
    }
  }

  .filter-form {
    :deep(.el-form-item) {
      width: 100%;
      margin-right: 0;
      margin-bottom: $spacing-sm;

      &:has(.el-button) {
        margin-top: $spacing-sm;
      }
    }

    :deep(.el-form-item__label) {
      font-size: 13px;
    }

    :deep(.el-button) {
      font-weight: 600;
      width: 100%;
    }
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
      font-size: 10px;
    }

    .value {
      font-size: 19px;
      font-weight: 800;

      &.accent {
        font-size: 20px;
        background: $gradient-accent;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }
  }

  .summary-card {
    box-shadow: $shadow-md;

    :deep(.el-card__body) {
      padding: $spacing-sm $spacing-md;
      background: linear-gradient(135deg, rgba($primary, 0.04) 0%, rgba($secondary, 0.04) 100%);
    }
  }

  .list-card {
    box-shadow: $shadow-md;
  }
}

// 移动端卡片列表
.mobile-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.mobile-expense-card {
  background: white;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  padding: $spacing-md $spacing-mobile-md;
  transition: all $transition-base;
  box-shadow: $shadow-card;

  &:active {
    transform: scale(0.98);
    box-shadow: $shadow-sm;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .card-left {
    flex: 1;
    min-width: 0;
  }

  .card-amount {
    font-size: 22px;
    font-weight: 800;
    color: $accent;
    margin-bottom: $spacing-xs;
    font-family: $font-mono;
    background: $gradient-accent;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .card-meta {
    display: flex;
    gap: $spacing-xs;
    flex-wrap: wrap;
  }

  .card-right {
    text-align: right;
    flex-shrink: 0;
    margin-left: $spacing-sm;
  }

  .card-date {
    font-size: 13px;
    color: $text-primary;
    font-weight: 700;
    font-family: $font-mono;
  }

  .card-time {
    font-size: 11px;
    color: $text-secondary;
    font-family: $font-mono;
    font-weight: 500;
    margin-top: 1px;
  }

  .card-desc {
    margin-top: $spacing-sm;
    padding-top: $spacing-sm;
    border-top: 1px solid $border-light;
    font-size: 13px;
    color: $text-primary;
    font-weight: 600;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
    margin-top: $spacing-sm;
    padding-top: $spacing-xs;
  }
}

.mobile-empty {
  text-align: center;
  padding: $spacing-2xl $spacing-md;
  color: $text-muted;
  font-size: 14px;
}

.mobile-pagination {
  display: flex;
  justify-content: center;
  margin-top: $spacing-md;
  padding-bottom: $spacing-sm;
}
</style>
