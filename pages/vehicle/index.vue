<template>
  <div class="vehicle-page" :class="{ 'is-mobile': isMobile }">
    <div class="page-header">
      <h2>车辆管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        <span v-if="!isMobile">添加车辆</span>
      </el-button>
    </div>

    <!-- 统计摘要 -->
    <el-card class="summary-card">
      <el-row :gutter="isMobile ? 8 : 16">
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">车辆总数</span>
            <span class="value">{{ vehicleStore.vehicles.length }}</span>
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">燃油车</span>
            <span class="value fuel">
              {{
                vehicleStore.vehicles.filter((v) => v.vehicle_type === "fuel")
                  .length
              }}
            </span>
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">纯电动</span>
            <span class="value electric">
              {{
                vehicleStore.vehicles.filter(
                  (v) => v.vehicle_type === "electric",
                ).length
              }}
            </span>
          </div>
        </el-col>
        <el-col :span="isMobile ? 12 : 6">
          <div class="stat-item">
            <span class="label">已停用</span>
            <span class="value disabled">{{
              vehicleStore.vehicles.filter((v) => v.is_active !== 1).length
            }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 桌面端：表格列表 -->
    <el-card v-if="!isMobile" class="list-card">
      <el-table
        :data="vehicleStore.vehicles"
        stripe
        v-loading="vehicleStore.loading"
      >
        <el-table-column
          prop="plate_number"
          label="车牌号"
          width="150"
          align="center"
        >
          <template #default="{ row }">
            <span class="plate-number">{{ row.plate_number }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="brand_model" label="品牌型号" min-width="200" />
        <el-table-column label="车辆类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getVehicleTypeTagType(row.vehicle_type)"
              size="small"
            >
              {{ getVehicleTypeLabel(row.vehicle_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="initial_mileage"
          label="初始里程(km)"
          width="130"
          align="right"
        >
          <template #default="{ row }">
            {{ formatNumber(row.initial_mileage) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="current_mileage"
          label="当前里程(km)"
          width="130"
          align="right"
        >
          <template #default="{ row }">
            <span class="current-mileage">{{
              formatNumber(row.current_mileage || 0)
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.is_active === 1 ? 'success' : 'info'"
              size="small"
            >
              {{ row.is_active === 1 ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="created_at"
          label="创建时间"
          width="160"
          align="center"
        >
          <template #default="{ row }">
            <span class="datetime-small">{{
              formatDateTime(row.created_at)
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editVehicle(row)"
              >编辑</el-button
            >
            <el-button link type="danger" @click="deleteVehicle(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div
        v-if="vehicleStore.vehicles.length === 0 && !vehicleStore.loading"
        class="empty-tip"
      >
        暂无车辆信息，请点击右上角"添加车辆"按钮添加
      </div>
    </el-card>

    <!-- 移动端：卡片列表 -->
    <div v-if="isMobile" class="mobile-list" v-loading="vehicleStore.loading">
      <div
        v-for="item in vehicleStore.vehicles"
        :key="item.id"
        class="mobile-vehicle-card"
      >
        <div class="card-top">
          <div class="card-left">
            <div class="card-plate">{{ item.plate_number }}</div>
            <div class="card-model">{{ item.brand_model }}</div>
          </div>
          <div class="card-right">
            <el-tag
              :type="getVehicleTypeTagType(item.vehicle_type)"
              size="small"
            >
              {{ getVehicleTypeLabel(item.vehicle_type) }}
            </el-tag>
            <el-tag
              :type="item.is_active === 1 ? 'success' : 'info'"
              size="small"
              style="margin-left: 4px"
            >
              {{ item.is_active === 1 ? "启用" : "停用" }}
            </el-tag>
          </div>
        </div>
        <div class="card-info">
          <span class="info-label">初始里程:</span>
          <span class="info-value"
            >{{ formatNumber(item.initial_mileage) }} km</span
          >
        </div>
        <div class="card-info">
          <span class="info-label">当前里程:</span>
          <span class="info-value current-mileage"
            >{{ formatNumber(item.current_mileage || 0) }} km</span
          >
        </div>
        <div class="card-actions">
          <el-button
            link
            type="primary"
            size="small"
            @click="editVehicle(item)"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            size="small"
            @click="deleteVehicle(item)"
          >
            删除
          </el-button>
        </div>
      </div>

      <div
        v-if="!vehicleStore.loading && vehicleStore.vehicles.length === 0"
        class="mobile-empty"
      >
        暂无车辆信息
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <VehicleEditDialog
      v-model="editDialogVisible"
      :vehicle="currentVehicle"
      @success="handleVehicleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import type { Vehicle, VehicleForm } from "~/types";
import { VEHICLE_TYPE_OPTIONS } from "~/types";
import { formatDate, formatDateTime, formatNumber } from "~/utils/format";
import VehicleEditDialog from "~/components/vehicle/VehicleEditDialog.vue";

definePageMeta({
  middleware: ["auth"],
});

const vehicleStore = useVehicleStore();

/** 判断是否为移动端 */
const isMobile = inject<Ref<boolean>>("isMobile", ref(false));

// 编辑弹窗
const editDialogVisible = ref(false);
const currentVehicle = ref<Vehicle | null>(null);

// 初始化
onMounted(async () => {
  await vehicleStore.fetchVehicles();
});

/** 获取车辆类型标签文本 */
const getVehicleTypeLabel = (type: string) => {
  const option = VEHICLE_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

/** 获取车辆类型标签颜色 */
const getVehicleTypeTagType = (
  type: string,
): "success" | "warning" | "danger" | "info" | "primary" | "default" => {
  const typeMap: Record<
    string,
    "success" | "warning" | "danger" | "info" | "primary" | "default"
  > = {
    fuel: "danger",
    electric: "success",
  };
  return typeMap[type] || "info";
};

/** 打开新增弹窗 */
const openCreateDialog = () => {
  currentVehicle.value = null;
  editDialogVisible.value = true;
};

/** 编辑车辆 */
const editVehicle = (vehicle: Vehicle) => {
  currentVehicle.value = { ...vehicle };
  editDialogVisible.value = true;
};

/** 保存成功后处理 */
const handleVehicleSaved = async () => {
  await vehicleStore.fetchVehicles();
};

/** 删除车辆 */
const deleteVehicle = async (vehicle: Vehicle) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除车辆 "${vehicle.plate_number}" 吗？`,
      "提示",
      { type: "warning" },
    );

    await vehicleStore.deleteVehicle(vehicle.id);
    ElMessage.success("删除成功");
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除失败");
    }
  }
};
</script>

<style lang="scss" scoped>
.vehicle-page {
  .plate-number {
    font-size: 16px;
    font-weight: 700;
    color: $text-primary;
    font-family: $font-mono;
  }

  .fuel {
    color: $danger;
  }

  .electric {
    color: $success;
  }

  .disabled {
    color: $text-muted;
  }

  .current-mileage {
    color: $primary;
    font-weight: 600;
  }

  .datetime-small {
    font-size: 12px;
    color: $text-muted;
    font-family: $font-mono;
    font-weight: 500;
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

    .empty-tip {
      text-align: center;
      padding: $spacing-xl;
      color: $text-muted;
      font-size: 14px;
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

  .summary-card {
    box-shadow: $shadow-md;

    :deep(.el-card__body) {
      padding: $spacing-sm;
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

.mobile-vehicle-card {
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

  .card-plate {
    font-size: 18px;
    font-weight: 700;
    color: $text-primary;
    font-family: $font-mono;
    margin-bottom: $spacing-xs;
  }

  .card-model {
    font-size: 13px;
    color: $text-secondary;
  }

  .card-right {
    margin-left: $spacing-sm;
  }

  .card-info {
    display: flex;
    gap: $spacing-xs;
    font-size: 13px;
    margin-bottom: $spacing-sm;
    padding: $spacing-xs 0;
    border-top: 1px solid $border-light;
  }

  .info-label {
    color: $text-muted;
  }

  .info-value {
    color: $text-primary;
    font-weight: 500;
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
