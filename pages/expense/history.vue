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
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
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
            @change="fetchData"
          />
        </el-form-item>
        <el-form-item label="成员">
          <el-select
            v-model="filters.member_id"
            placeholder="全部成员"
            clearable
            style="width: 120px"
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
            @keyup.enter="fetchData"
          />
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
            <span class="value"
              >¥{{ Number(summary.total_amount || 0).toFixed(2) }}</span
            >
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">记录数</span>
            <span class="value">{{ Number(summary.total_count || 0) }}条</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">平均</span>
            <span class="value"
              >¥{{ Number(summary.avg_amount || 0).toFixed(2) }}</span
            >
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">最高</span>
            <span class="value"
              >¥{{ Number(summary.max_amount || 0).toFixed(2) }}</span
            >
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 记录列表 -->
    <el-card class="list-card">
      <el-table :data="expenseList" stripe v-loading="loading">
        <el-table-column label="消费日期" width="120" align="center">
          <template #default="{ row }">
            <span class="date">{{ row.expense_date ? formatDate(row.expense_date) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="消费时间" width="100" align="center">
          <template #default="{ row }">
            <span class="time">{{ row.expense_time || '-' }}</span>
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
            <el-button link type="primary" @click="editExpense(row)"
              >编辑</el-button
            >
            <el-button link type="danger" @click="deleteExpense(row)"
              >删除</el-button
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
import { Plus } from "@element-plus/icons-vue";
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
const api = useApi();

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

  // 设置默认日期范围为当月
  const { year, month } = getCurrentMonth();
  const range = getMonthRange(year, month);
  dateRange.value = [range.start, range.end];
  filters.start_date = range.start;
  filters.end_date = range.end;

  await fetchData();
});

// 处理日期变化
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

// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    // 获取消费记录列表
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

    // 获取统计摘要
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

// 重置筛选条件
const resetFilters = () => {
  const { year, month } = getCurrentMonth();
  const range = getMonthRange(year, month);
  dateRange.value = [range.start, range.end];
  filters.start_date = range.start;
  filters.end_date = range.end;
  filters.category_id = null;
  filters.member_id = null;
  filters.keyword = "";
  pagination.page = 1;
  fetchData();
};

// 编辑消费记录
const editExpense = (expense: Expense) => {
  currentExpense.value = { ...expense };
  editDialogVisible.value = true;
};

// 删除消费记录
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

// 跳转到记账页
const goToCreate = () => {
  router.push("/expense/create");
};
</script>

<style lang="scss" scoped>
.expense-history-page {
  .filter-card {
    margin-bottom: $spacing-md;

    .filter-form {
      display: flex;
      flex-wrap: wrap;
    }
  }

  .summary-card {
    margin-bottom: $spacing-md;
  }

  .list-card {
    .pagination {
      display: flex;
      justify-content: flex-end;
      margin-top: $spacing-md;
    }
  }
}

.stat-item {
  text-align: center;
  padding: $spacing-sm;

  .label {
    display: block;
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: $spacing-xs;
  }

  .value {
    display: block;
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
  }
}

.amount {
  color: $danger-color;
  font-weight: 600;
}

.date {
  font-size: 13px;
  color: $text-primary;
  font-family: "Consolas", "Monaco", monospace;
  font-weight: 500;
}

.time {
  font-size: 13px;
  color: $text-secondary;
  font-family: "Consolas", "Monaco", monospace;
}

.datetime-small {
  font-size: 12px;
  color: $text-secondary;
  font-family: "Consolas", "Monaco", monospace;
}

.text-placeholder {
  color: $text-muted;
}

.description {
  color: $text-primary;
}

@media (max-width: $breakpoint-sm) {
  .filter-form {
    :deep(.el-form-item) {
      width: 100%;
      margin-right: 0;
    }
  }

  .stat-item .value {
    font-size: 16px;
  }
}
</style>
