<template>
  <div class="expense-history-page" :class="{ 'is-mobile': isMobile }">
    <div class="page-header">
      <h2>消费记录</h2>
      <el-button type="primary" @click="goToCreate">
        <el-icon><Plus /></el-icon>
        <span v-if="!isMobile">新增记账</span>
      </el-button>
    </div>

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
              @change="fetchData"
            />
          </el-form-item>
          <el-form-item label="成员">
            <el-select
              v-model="filters.member_id"
              placeholder="全部成员"
              clearable
              style="width: 100%"
              @change="fetchData"
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
              @keyup.enter="fetchData"
            />
          </el-form-item>
          <el-form-item v-if="isMobile">
            <el-button type="primary" @click="fetchData" style="width: 100%">
              查询
            </el-button>
          </el-form-item>
          <el-form-item v-if="isMobile">
            <el-button @click="resetFilters" style="width: 100%">
              重置
            </el-button>
          </el-form-item>
          <div v-if="!isMobile" class="filter-actions">
            <el-button type="primary" @click="fetchData">
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
      <el-row :gutter="isMobile ? 8 : 16">
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">总支出</span>
            <span class="value accent">
              ¥{{ Number(summary.total_amount || 0).toFixed(2) }}
            </span>
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">记录数</span>
            <span class="value">{{ Number(summary.total_count || 0) }}条</span>
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">平均</span>
            <span class="value">
              ¥{{ Number(summary.avg_amount || 0).toFixed(2) }}
            </span>
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">最高</span>
            <span class="value">
              ¥{{ Number(summary.max_amount || 0).toFixed(2) }}
            </span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 桌面端：表格列表 -->
    <el-card v-if="!isMobile" class="list-card">
      <el-table :data="expenseList" stripe v-loading="loading">
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
        <el-table-column prop="member_name" label="成员" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.member_name" type="info" size="small">{{
              row.member_name
            }}</el-tag>
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
              <el-tag v-if="item.member_name" type="info" size="small">
                {{ item.member_name }}
              </el-tag>
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
import { Plus, Filter, ArrowDown } from "@element-plus/icons-vue";
import type { Expense, StatisticsSummary } from "~/types";
import { categoryTreeToCascaderData } from "~/utils/tree";
import {
  getMonthRange,
  getCurrentMonth,
  formatDateTime as formatDateTimeStandard,
  formatDate,
} from "~/utils/format";

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

// 分类级联数据
const categoryCascaderData = computed(() => {
  return categoryTreeToCascaderData(categoryStore.tree);
});

// 初始化
onMounted(async () => {
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

/** 处理桌面端日期范围变化 */
const handleDateChange = (val: [string, string] | null) => {
  if (val) {
    filters.start_date = val[0];
    filters.end_date = val[1];
  } else {
    filters.start_date = "";
    filters.end_date = "";
  }
  fetchData();
};

/** 处理移动端开始日期变化 */
const handleStartDateChange = (val: string) => {
  filters.start_date = val;
  if (!filters.end_date || filters.end_date < val) {
    endDateTemp.value = val;
    filters.end_date = val;
  }
  fetchData();
};

/** 处理移动端结束日期变化 */
const handleEndDateChange = (val: string) => {
  filters.end_date = val;
  fetchData();
};

/** 获取数据 */
const fetchData = async () => {
  loading.value = true;
  try {
    const listRes = await api.get("/api/expense", {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters,
      },
    });

    if (listRes.success) {
      expenseList.value = listRes.data.list;
      pagination.total = listRes.data.total;
    }

    if (filters.start_date && filters.end_date) {
      const summaryRes = await api.get("/api/statistics/summary", {
        params: {
          start_date: filters.start_date,
          end_date: filters.end_date,
        },
      });

      if (summaryRes.success) {
        summary.value = summaryRes.data;
      }
    }
  } finally {
    loading.value = false;
  }
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
</script>

<style lang="scss" scoped>
.expense-history-page {
  .filter-card {
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
        font-weight: 500;
        color: $text-primary;
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
        border-color: $primary;
      }

      :deep(.el-button) {
        font-weight: 500;
        min-height: 32px;
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

  .list-card {
    box-shadow: $shadow-md;
    transition: all $transition-base;

    &:hover {
      box-shadow: $shadow-lg;
    }

    .pagination {
      display: flex;
      justify-content: flex-end;
      margin-top: $spacing-md;
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
  font-size: 13px;
  color: $text-secondary;
  font-family: $font-mono;
  font-weight: 500;
}

.datetime-small {
  font-size: 12px;
  color: $text-muted;
  font-family: $font-mono;
  font-weight: 500;
}

.text-placeholder {
  color: $text-muted;
}

.text-muted {
  color: $text-muted;
  font-size: 13px;
}

.description {
  color: $text-primary;
  font-weight: 500;
}

// ==================== 移动端样式 ====================

// 桌面端响应式优化
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
      background: linear-gradient(180deg, #FFFFFF 0%, #F8FBFC 100%);
    }
  }

  .mobile-filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-md $spacing-mobile-md;
    cursor: pointer;
    background: rgba(78, 205, 196, 0.05);
    border-bottom: 1px solid $border-color;

    .filter-title {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      font-size: 14px;
      font-weight: 600;
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
      font-weight: 500;
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
      font-size: 11px;
    }

    .value {
      font-size: 18px;
      font-weight: 700;

      &.accent {
        font-size: 19px;
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
      background: linear-gradient(135deg, rgba(78, 205, 196, 0.03) 0%, rgba(69, 183, 209, 0.03) 100%);
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
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: $border-radius;
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
    font-size: 24px;
    font-weight: 700;
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
    font-size: 14px;
    color: $text-primary;
    font-weight: 600;
    font-family: $font-mono;
  }

  .card-time {
    font-size: 13px;
    color: $text-secondary;
    font-family: $font-mono;
    font-weight: 500;
    margin-top: 2px;
  }

  .card-desc {
    margin-top: $spacing-sm;
    padding-top: $spacing-sm;
    border-top: 1px solid $border-light;
    font-size: 13px;
    color: $text-primary;
    font-weight: 500;
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
