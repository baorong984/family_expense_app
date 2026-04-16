<template>
  <div class="gift-page" :class="{ 'is-mobile': isMobile }">
    <div class="page-header">
      <h2>人情管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        <span v-if="!isMobile">新增记录</span>
      </el-button>
    </div>

    <!-- 统计摘要 -->
    <el-card class="summary-card">
      <el-row :gutter="isMobile ? 8 : 16">
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">出礼总额</span>
            <span class="value expense">
              ¥{{ Number(giftStore.statistics?.outgoing?.total_amount || 0).toFixed(2) }}
            </span>
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">收礼总额</span>
            <span class="value income">
              ¥{{ Number(giftStore.statistics?.incoming?.total_amount || 0).toFixed(2) }}
            </span>
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">净支出</span>
            <span
              class="value"
              :class="Number(giftStore.statistics?.net_outgoing || 0) > 0 ? 'expense' : 'income'"
            >
              ¥{{ Math.abs(Number(giftStore.statistics?.net_outgoing || 0)).toFixed(2) }}
            </span>
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">记录数</span>
            <span class="value">
              {{ giftStore.pagination.total }}条
            </span>
          </div>
        </el-col>
      </el-row>
    </el-card>

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
          <el-form-item label="类型">
            <el-select
              v-model="filters.gift_type"
              placeholder="全部"
              clearable
              style="width: 100%"
              @change="fetchData"
            >
              <el-option label="全部" value="" />
              <el-option label="出礼" value="outgoing" />
              <el-option label="收礼" value="incoming" />
            </el-select>
          </el-form-item>
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
          <el-form-item label="关联人">
            <el-input
              v-model="filters.related_person"
              placeholder="搜索..."
              clearable
              style="width: 100%"
              @keyup.enter="fetchData"
            />
          </el-form-item>
          <el-form-item label="事由">
            <el-select
              v-model="filters.occasion"
              placeholder="全部"
              clearable
              style="width: 100%"
              @change="fetchData"
            >
              <el-option label="婚礼" value="婚礼" />
              <el-option label="生日" value="生日" />
              <el-option label="丧礼" value="丧礼" />
              <el-option label="满月" value="满月" />
              <el-option label="乔迁" value="乔迁" />
              <el-option label="其他" value="其他" />
            </el-select>
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

    <!-- 桌面端：表格列表 -->
    <el-card v-if="!isMobile" class="list-card">
      <el-table :data="giftStore.gifts" stripe v-loading="giftStore.loading">
        <el-table-column prop="expense_date" label="日期" width="120" align="center">
          <template #default="{ row }">
            <span class="date">{{ formatDate(row.expense_date) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.gift_type === 'outgoing' ? 'danger' : 'success'" size="small">
              {{ row.gift_type === 'outgoing' ? '出礼' : '收礼' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="related_person" label="关联人" width="120" />
        <el-table-column prop="occasion" label="事由" width="100" />
        <el-table-column label="金额/实物" width="150">
          <template #default="{ row }">
            <span v-if="row.payment_type === 'cash'" class="amount">
              ¥{{ row.amount?.toFixed(2) }}
            </span>
            <span v-else class="item">
              {{ row.item_name }}
              <span v-if="row.item_value" class="item-value">
                (¥{{ row.item_value.toFixed(2) }})
              </span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.gift_type === 'outgoing'" :type="row.is_returned ? 'success' : 'info'" size="small">
              {{ row.is_returned ? '已回礼' : '未回礼' }}
            </el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="160" align="center">
          <template #default="{ row }">
            <span class="datetime-small">{{ formatDateTime(row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editGift(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteGift(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="giftStore.pagination.page"
          v-model:page-size="giftStore.pagination.pageSize"
          :total="giftStore.pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @change="fetchData"
        />
      </div>
    </el-card>

    <!-- 移动端：卡片列表 -->
    <div v-if="isMobile" class="mobile-list" v-loading="giftStore.loading">
      <div
        v-for="item in giftStore.gifts"
        :key="item.id"
        class="mobile-gift-card"
      >
        <div class="card-top">
          <div class="card-left">
            <div class="card-amount">
              <el-tag :type="item.gift_type === 'outgoing' ? 'danger' : 'success'" size="small">
                {{ item.gift_type === 'outgoing' ? '出礼' : '收礼' }}
              </el-tag>
            </div>
            <div class="card-amount-item">
              <span v-if="item.payment_type === 'cash'" class="amount-mobile">
                ¥{{ item.amount?.toFixed(2) }}
              </span>
              <span v-else class="item-mobile">
                {{ item.item_name }}
              </span>
            </div>
          </div>
          <div class="card-right">
            <div class="card-date">{{ formatDate(item.expense_date) }}</div>
            <div v-if="item.gift_type === 'outgoing'" class="card-status">
              {{ item.is_returned ? '已回礼' : '未回礼' }}
            </div>
          </div>
        </div>
        <div class="card-info">
          <span class="info-label">关联人:</span>
          <span class="info-value">{{ item.related_person }}</span>
          <span class="info-label">事由:</span>
          <span class="info-value">{{ item.occasion }}</span>
        </div>
        <div v-if="item.remarks" class="card-desc">
          {{ item.remarks }}
        </div>
        <div class="card-actions">
          <el-button link type="primary" size="small" @click="editGift(item)">
            编辑
          </el-button>
          <el-button link type="danger" size="small" @click="deleteGift(item)">
            删除
          </el-button>
        </div>
      </div>

      <div v-if="!giftStore.loading && giftStore.gifts.length === 0" class="mobile-empty">
        暂无人情记录
      </div>

      <div class="mobile-pagination">
        <el-pagination
          v-model:current-page="giftStore.pagination.page"
          v-model:page-size="giftStore.pagination.pageSize"
          :total="giftStore.pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="prev, pager, next"
          small
          @change="fetchData"
        />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <GiftEditDialog
      v-model="editDialogVisible"
      :gift="currentGift"
      @success="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Filter, ArrowDown } from "@element-plus/icons-vue";
import type { Gift } from "~/types";
import { formatDate, formatDateTime } from "~/utils/format";
import { getMonthRange, getCurrentMonth } from "~/utils/format";

definePageMeta({
  middleware: ["auth"],
});

const giftStore = useGiftStore();

/** 判断是否为移动端 */
const isMobile = inject<Ref<boolean>>("isMobile", ref(false));

/** 移动端筛选区是否展开 */
const filterExpanded = ref(false);

/** 移动端开始日期临时变量 */
const startDateTemp = ref("");

/** 移动端结束日期临时变量 */
const endDateTemp = ref("");

// 筛选条件
const dateRange = ref<[string, string] | null>(null);
const filters = reactive({
  gift_type: "" as string,
  start_date: "",
  end_date: "",
  related_person: "",
  occasion: "",
});

// 编辑弹窗
const editDialogVisible = ref(false);
const currentGift = ref<Gift | null>(null);

// 初始化
onMounted(async () => {
  const { year, month } = getCurrentMonth();
  const range = getMonthRange(year, month);
  dateRange.value = [range.start, range.end];
  filters.start_date = range.start;
  filters.end_date = range.end;
  startDateTemp.value = range.start;
  endDateTemp.value = range.end;

  await fetchData();
  await fetchStatistics();
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
  fetchStatistics();
};

/** 处理移动端开始日期变化 */
const handleStartDateChange = (val: string) => {
  filters.start_date = val;
  if (!filters.end_date || filters.end_date < val) {
    endDateTemp.value = val;
    filters.end_date = val;
  }
  fetchData();
  fetchStatistics();
};

/** 处理移动端结束日期变化 */
const handleEndDateChange = (val: string) => {
  filters.end_date = val;
  fetchData();
  fetchStatistics();
};

/** 获取数据 */

const fetchData = async () => {

  await giftStore.fetchGifts(

    filters,

    giftStore.pagination.page,

    giftStore.pagination.pageSize

  );

};



/** 获取统计数据 */

const fetchStatistics = async () => {

  if (filters.start_date && filters.end_date) {

    await giftStore.fetchStatistics(filters.start_date, filters.end_date);

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
  filters.gift_type = "";
  filters.related_person = "";
  filters.occasion = "";
  giftStore.pagination.page = 1;
  fetchData();
  fetchStatistics();
};

/** 打开新增弹窗 */
const openCreateDialog = () => {
  currentGift.value = null;
  editDialogVisible.value = true;
};

/** 编辑人情记录 */
const editGift = (gift: Gift) => {
  currentGift.value = { ...gift };
  editDialogVisible.value = true;
};

/** 删除人情记录 */
const deleteGift = async (gift: Gift) => {
  try {
    await ElMessageBox.confirm("确定要删除这条人情记录吗？", "提示", {
      type: "warning",
    });

    await giftStore.deleteGift(gift.id);
    ElMessage.success("删除成功");
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除失败");
    }
  }
};
</script>

<style lang="scss" scoped>
.gift-page {
  .amount {
    color: $accent;
    font-weight: 700;
    font-size: 14px;
    font-family: $font-mono;
  }

  .expense {
    color: $danger;
  }

  .income {
    color: $success;
  }

  .item {
    color: $text-primary;
    font-size: 14px;
  }

  .item-value {
    color: $text-secondary;
    font-size: 12px;
  }

  .date {
    font-size: 13px;
    color: $text-primary;
    font-family: $font-mono;
    font-weight: 600;
  }

  .datetime-small {
    font-size: 12px;
    color: $text-muted;
    font-family: $font-mono;
    font-weight: 500;
  }

  .text-muted {
    color: $text-muted;
  }

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
    }
  }

  .summary-card {
    box-shadow: $shadow-md;

    :deep(.el-card__body) {
      padding: $spacing-sm $spacing-md;
      background: linear-gradient(135deg, rgba(78, 205, 196, 0.03) 0%, rgba(69, 183, 209, 0.03) 100%);
    }
  }
}

// 移动端卡片列表
.mobile-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.mobile-gift-card {
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
    margin-bottom: $spacing-xs;
  }

  .card-amount-item {
    font-size: 20px;
    font-weight: 700;
  }

  .amount-mobile {
    color: $accent;
    font-family: $font-mono;
  }

  .item-mobile {
    color: $text-primary;
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

  .card-status {
    font-size: 13px;
    color: $text-secondary;
    margin-top: 2px;
  }

  .card-info {
    margin-top: $spacing-sm;
    padding-top: $spacing-sm;
    border-top: 1px solid $border-light;
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    font-size: 13px;
  }

  .info-label {
    color: $text-secondary;
    font-weight: 500;
  }

  .info-value {
    color: $text-primary;
    font-weight: 600;
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