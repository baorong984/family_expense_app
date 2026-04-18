<template>
  <div class="fuel-page" :class="{ 'is-mobile': isMobile }">
    <div class="page-header">
      <h2>加油/充电记录</h2>
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
            <span class="label">总花费</span>
            <span class="value expense"
              >¥{{ vehicleStore.totalAmount.toFixed(2) }}</span
            >
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">加油金额</span>
            <span class="value fuel"
              >¥{{ vehicleStore.totalFuelAmount.toFixed(2) }}</span
            >
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">充电金额</span>
            <span class="value charge"
              >¥{{ vehicleStore.totalChargeAmount.toFixed(2) }}</span
            >
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">记录数</span>
            <span class="value">{{ vehicleStore.pagination.total }}条</span>
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
          <el-form-item label="车辆">
            <el-select
              v-model="filters.vehicle_id"
              placeholder="全部车辆"
              clearable
              style="width: 100%"
            >
              <el-option label="全部车辆" value="" />
              <el-option
                v-for="item in vehicleStore.vehicles"
                :key="item.id"
                :label="`${item.plate_number} - ${item.brand_model}`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select
              v-model="filters.record_type"
              placeholder="全部"
              clearable
              style="width: 100%"
            >
              <el-option label="全部" value="" />
              <el-option label="加油" value="fuel" />
              <el-option label="充电" value="charge" />
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
            <el-button type="primary" @click="handleQuery"> 查询 </el-button>
            <el-button @click="resetFilters"> 重置 </el-button>
          </div>
        </el-form>
      </div>
    </el-card>

    <!-- 桌面端：表格列表 -->
    <el-card v-if="!isMobile" class="list-card">
      <el-table
        :data="vehicleStore.fuelRecords"
        stripe
        v-loading="vehicleStore.loading"
      >
        <el-table-column
          prop="record_date"
          label="日期"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <span class="date">{{ formatDate(row.record_date) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="车辆" width="180">
          <template #default="{ row }">
            <span>{{ row.plate_number || "-" }}</span>
            <span class="vehicle-model">{{ row.brand_model || "" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.record_type === 'fuel' ? 'danger' : 'success'"
              size="small"
            >
              {{ row.record_type === "fuel" ? "加油" : "充电" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="amount"
          label="金额(元)"
          width="110"
          align="right"
        >
          <template #default="{ row }">
            <span class="amount">¥{{ row.amount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="current_mileage"
          label="当前里程(km)"
          width="130"
          align="right"
        >
          <template #default="{ row }">
            {{ formatNumber(row.current_mileage) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="mileage_diff"
          label="行驶里程(km)"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <span
              v-if="row.mileage_diff !== null && row.mileage_diff > 0"
              class="mileage-diff"
            >
              +{{ formatNumber(row.mileage_diff) }}
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="cost_per_km"
          label="每公里成本"
          width="110"
          align="right"
        >
          <template #default="{ row }">
            <span
              v-if="row.cost_per_km !== null && row.cost_per_km > 0"
              class="cost-per-km"
            >
              ¥{{ row.cost_per_km?.toFixed(4) }}
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="remarks"
          label="备注"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editRecord(row)"
              >编辑</el-button
            >
            <el-button link type="danger" @click="deleteRecord(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="vehicleStore.pagination.page"
          v-model:page-size="vehicleStore.pagination.pageSize"
          :total="vehicleStore.pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @change="fetchData"
        />
      </div>
    </el-card>

    <!-- 移动端：卡片列表 -->
    <div v-if="isMobile" class="mobile-list" v-loading="vehicleStore.loading">
      <div
        v-for="item in vehicleStore.fuelRecords"
        :key="item.id"
        class="mobile-fuel-card"
      >
        <div class="card-top">
          <div class="card-left">
            <div class="card-type">
              <el-tag
                :type="item.record_type === 'fuel' ? 'danger' : 'success'"
                size="small"
              >
                {{ item.record_type === "fuel" ? "加油" : "充电" }}
              </el-tag>
            </div>
            <div class="card-amount">¥{{ item.amount?.toFixed(2) }}</div>
          </div>
          <div class="card-right">
            <div class="card-date">{{ formatDate(item.record_date) }}</div>
            <div class="card-vehicle">
              {{ item.plate_number || "-" }}
            </div>
          </div>
        </div>
        <div class="card-info">
          <div class="info-row">
            <span class="info-label">里程:</span>
            <span class="info-value"
              >{{ formatNumber(item.current_mileage) }} km</span
            >
            <span
              v-if="item.mileage_diff !== null && item.mileage_diff > 0"
              class="info-highlight"
            >
              (+{{ formatNumber(item.mileage_diff) }})
            </span>
          </div>
          <div
            v-if="item.cost_per_km !== null && item.cost_per_km > 0"
            class="info-row"
          >
            <span class="info-label">成本:</span>
            <span class="info-value cost"
              >¥{{ item.cost_per_km?.toFixed(4) }}/km</span
            >
          </div>
        </div>
        <div v-if="item.remarks" class="card-desc">
          {{ item.remarks }}
        </div>
        <div class="card-actions">
          <el-button link type="primary" size="small" @click="editRecord(item)">
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            size="small"
            @click="deleteRecord(item)"
          >
            删除
          </el-button>
        </div>
      </div>

      <div
        v-if="!vehicleStore.loading && vehicleStore.fuelRecords.length === 0"
        class="mobile-empty"
      >
        暂无加油/充电记录
      </div>

      <div class="mobile-pagination">
        <el-pagination
          v-model:current-page="vehicleStore.pagination.page"
          v-model:page-size="vehicleStore.pagination.pageSize"
          :total="vehicleStore.pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="prev, pager, next"
          small
          @change="fetchData"
        />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <FuelRecordEditDialog
      v-model="editDialogVisible"
      :record="currentRecord"
      @success="handleRecordSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Filter, ArrowDown } from "@element-plus/icons-vue";
import type { VehicleFuelRecord, VehicleFuelRecordFilters } from "~/types";
import { formatDate, formatDateTime, formatNumber } from "~/utils/format";
import { getMonthRange, getCurrentMonth } from "~/utils/format";
import FuelRecordEditDialog from "~/components/vehicle/FuelRecordEditDialog.vue";

definePageMeta({
  middleware: ["auth"],
});

const vehicleStore = useVehicleStore();

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
const filters = reactive<VehicleFuelRecordFilters>({
  vehicle_id: undefined,
  record_type: undefined,
  start_date: "",
  end_date: "",
});

// 编辑弹窗
const editDialogVisible = ref(false);
const currentRecord = ref<VehicleFuelRecord | null>(null);

// 初始化
onMounted(async () => {
  const { year, month } = getCurrentMonth();
  const range = getMonthRange(year, month);
  dateRange.value = [range.start, range.end];
  filters.start_date = range.start;
  filters.end_date = range.end;
  startDateTemp.value = range.start;
  endDateTemp.value = range.end;

  await Promise.all([vehicleStore.fetchVehicles(), fetchData()]);
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
};

/** 处理移动端开始日期变化 */
const handleStartDateChange = (val: string) => {
  filters.start_date = val;
  if (!filters.end_date || filters.end_date < val) {
    endDateTemp.value = val;
    filters.end_date = val;
  }
};

/** 处理移动端结束日期变化 */
const handleEndDateChange = (val: string) => {
  filters.end_date = val;
};

/** 处理查询按钮点击 */
const handleQuery = async () => {
  vehicleStore.pagination.page = 1;
  await fetchData();
};

/** 获取数据 */
const fetchData = async () => {
  await vehicleStore.fetchFuelRecords(
    filters,
    vehicleStore.pagination.page,
    vehicleStore.pagination.pageSize,
  );
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
  filters.vehicle_id = undefined;
  filters.record_type = undefined;
  vehicleStore.pagination.page = 1;
  fetchData();
};

/** 打开新增弹窗 */
const openCreateDialog = () => {
  currentRecord.value = null;
  editDialogVisible.value = true;
};

/** 编辑记录 */
const editRecord = (record: VehicleFuelRecord) => {
  currentRecord.value = { ...record };
  editDialogVisible.value = true;
};

/** 保存成功后处理 */
const handleRecordSaved = async () => {
  await fetchData();
};

/** 删除记录 */
const deleteRecord = async (record: VehicleFuelRecord) => {
  try {
    await ElMessageBox.confirm("确定要删除这条记录吗？", "提示", {
      type: "warning",
    });

    await vehicleStore.deleteFuelRecord(record.id);
    ElMessage.success("删除成功");
    await fetchData();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除失败");
    }
  }
};
</script>

<style lang="scss" scoped>
.fuel-page {
  .amount {
    color: $accent;
    font-weight: 700;
    font-size: 14px;
    font-family: $font-mono;
  }

  .expense {
    color: $danger;
  }

  .fuel {
    color: #e6a23c;
  }

  .charge {
    color: $success;
  }

  .date {
    font-size: 13px;
    color: $text-primary;
    font-family: $font-mono;
    font-weight: 600;
  }

  .vehicle-model {
    display: block;
    font-size: 12px;
    color: $text-secondary;
    margin-top: 2px;
  }

  .mileage-diff {
    color: $success;
    font-weight: 600;
    font-family: $font-mono;
  }

  .cost-per-km {
    color: $accent;
    font-weight: 600;
    font-family: $font-mono;
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
      background: linear-gradient(180deg, #ffffff 0%, #f8fbfc 100%);
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
      background: linear-gradient(
        135deg,
        rgba(78, 205, 196, 0.03) 0%,
        rgba(69, 183, 209, 0.03) 100%
      );
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
    content: "";
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
      background: linear-gradient(180deg, #ffffff 0%, #f8fbfc 100%);
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
}

.mobile-list {
  padding: 0 $spacing-mobile-md;
}

.mobile-fuel-card {
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  padding: $spacing-md;
  margin-bottom: $spacing-sm;
  box-shadow: $shadow-sm;
  transition: all $transition-base;

  &:active {
    transform: scale(0.98);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-sm;
  }

  .card-left {
    flex: 1;
  }

  .card-type {
    margin-bottom: $spacing-xs;
  }

  .card-amount {
    font-size: 20px;
    font-weight: 700;
    color: $accent;
    font-family: $font-mono;
  }

  .card-right {
    text-align: right;
    margin-left: $spacing-sm;
  }

  .card-date {
    font-size: 14px;
    color: $text-primary;
    font-family: $font-mono;
    font-weight: 600;
    margin-bottom: $spacing-xs;
  }

  .card-vehicle {
    font-size: 12px;
    color: $text-secondary;
  }

  .card-info {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    margin-bottom: $spacing-sm;
    padding: $spacing-xs 0;
    border-top: 1px solid $border-light;
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: 13px;
  }

  .info-label {
    color: $text-muted;
  }

  .info-value {
    color: $text-primary;
    font-weight: 500;
  }

  .info-value.cost {
    color: $accent;
    font-weight: 600;
    font-family: $font-mono;
  }

  .info-highlight {
    color: $success;
    font-weight: 600;
    font-family: $font-mono;
    font-size: 12px;
  }

  .card-desc {
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: $spacing-sm;
    padding: $spacing-xs;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 4px;
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
  }
}

.mobile-empty {
  text-align: center;
  padding: $spacing-xl;
  color: $text-muted;
  font-size: 14px;
}
</style>
