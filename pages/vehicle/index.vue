<template>
  <div class="vehicle-page" :class="{ 'is-mobile': isMobile }">
    <div class="page-header">
      <h2>车辆管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        <span v-if="!isMobile">添加车辆</span>
      </el-button>
    </div>

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

    <div class="vehicle-grid" v-loading="vehicleStore.loading">
      <el-card
        v-for="item in vehicleStore.vehicles"
        :key="item.id"
        class="vehicle-card"
        :class="{ 'is-disabled': item.is_active !== 1 }"
      >
        <div class="card-icon">
          <el-avatar
            :size="64"
            :style="{
              backgroundColor: item.vehicle_type === 'fuel' ? '#F56C6C' : '#67C23A'
            }"
          >
            <el-icon :size="32">
              <component :is="item.vehicle_type === 'fuel' ? 'Van' : 'Promotion'" />
            </el-icon>
          </el-avatar>
        </div>
        <div class="card-info">
          <h3 class="plate-number">{{ item.plate_number }}</h3>
          <p class="brand-model">{{ item.brand_model }}</p>
          <div class="card-tags">
            <el-tag
              :type="getVehicleTypeTagType(item.vehicle_type)"
              size="small"
            >
              {{ getVehicleTypeLabel(item.vehicle_type) }}
            </el-tag>
            <el-tag
              :type="item.is_active === 1 ? 'success' : 'info'"
              size="small"
            >
              {{ item.is_active === 1 ? "启用" : "停用" }}
            </el-tag>
          </div>
          <div class="mileage-info">
            <span class="label">基准里程:</span>
            <span class="value">{{ formatNumber(item.base_mileage || 0) }} km</span>
          </div>
        </div>
        <div class="card-actions">
          <el-button link type="primary" @click="editVehicle(item)">
            编辑
          </el-button>
          <el-button link type="danger" @click="deleteVehicle(item)">
            删除
          </el-button>
        </div>
      </el-card>

      <el-card class="vehicle-card add-card" @click="openCreateDialog">
        <div class="add-content">
          <el-icon :size="48"><Plus /></el-icon>
          <span>添加车辆</span>
        </div>
      </el-card>
    </div>

    <div
      v-if="!vehicleStore.loading && vehicleStore.vehicles.length === 0"
      class="empty-tip"
    >
      暂无车辆信息，请点击"添加车辆"按钮添加
    </div>

    <VehicleEditDialog
      v-model="editDialogVisible"
      :vehicle="currentVehicle"
      @success="handleVehicleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Van, Promotion } from "@element-plus/icons-vue";
import type { Vehicle } from "~/types";
import { VEHICLE_TYPE_OPTIONS } from "~/types";
import { formatNumber } from "~/utils/format";
import VehicleEditDialog from "~/components/vehicle/VehicleEditDialog.vue";

definePageMeta({
  middleware: ["auth"],
});

const vehicleStore = useVehicleStore();

const isMobile = inject<Ref<boolean>>("isMobile", ref(false));

const editDialogVisible = ref(false);
const currentVehicle = ref<Vehicle | null>(null);

onMounted(async () => {
  await vehicleStore.fetchVehicles();
});

/**
 * 获取车辆类型标签文本
 * @param type - 车辆类型
 * @returns 标签文本
 */
const getVehicleTypeLabel = (type: string) => {
  const option = VEHICLE_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

/**
 * 获取车辆类型标签颜色
 * @param type - 车辆类型
 * @returns 标签颜色类型
 */
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

/**
 * 打开新增弹窗
 */
const openCreateDialog = () => {
  currentVehicle.value = null;
  editDialogVisible.value = true;
};

/**
 * 编辑车辆
 * @param vehicle - 车辆信息
 */
const editVehicle = (vehicle: Vehicle) => {
  currentVehicle.value = { ...vehicle };
  editDialogVisible.value = true;
};

/**
 * 保存成功后处理
 */
const handleVehicleSaved = async () => {
  await vehicleStore.fetchVehicles();
};

/**
 * 删除车辆
 * @param vehicle - 车辆信息
 */
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
  max-width: 1200px;
  margin: 0 auto;

  .fuel {
    color: $danger;
  }

  .electric {
    color: $success;
  }

  .disabled {
    color: $text-muted;
  }

  .summary-card {
    margin-bottom: $spacing-lg;
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

  .empty-tip {
    text-align: center;
    padding: $spacing-xl;
    color: $text-muted;
    font-size: 14px;
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

.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $spacing-lg;
}

.vehicle-card {
  text-align: center;
  transition: all $transition-base;
  cursor: default;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-lg;
  }

  &.is-disabled {
    opacity: 0.6;

    .plate-number,
    .brand-model {
      color: $text-muted;
    }
  }

  .card-icon {
    margin-bottom: $spacing-md;
  }

  .card-info {
    .plate-number {
      font-size: 20px;
      font-weight: 700;
      color: $text-primary;
      font-family: $font-mono;
      margin-bottom: $spacing-xs;
    }

    .brand-model {
      font-size: 14px;
      color: $text-secondary;
      margin-bottom: $spacing-sm;
    }

    .card-tags {
      display: flex;
      justify-content: center;
      gap: $spacing-xs;
      margin-bottom: $spacing-sm;
    }

    .mileage-info {
      display: flex;
      justify-content: center;
      gap: $spacing-xs;
      font-size: 13px;
      padding-top: $spacing-sm;
      border-top: 1px solid $border-light;

      .label {
        color: $text-muted;
      }

      .value {
        color: $primary;
        font-weight: 600;
        font-family: $font-mono;
      }
    }
  }

  .card-actions {
    margin-top: $spacing-md;
    display: flex;
    justify-content: center;
    gap: $spacing-md;
  }

  &.add-card {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 220px;

    &:hover {
      border-color: $primary;

      .add-content {
        color: $primary;
      }
    }

    .add-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: $text-muted;
      transition: color $transition-base;

      .el-icon {
        margin-bottom: $spacing-sm;
      }

      span {
        font-size: 14px;
      }
    }
  }
}

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

  .vehicle-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: $spacing-md;
    padding: 0 $spacing-mobile-md;
  }

  .vehicle-card {
    .card-icon {
      :deep(.el-avatar) {
        --el-avatar-size: 48px;
      }

      :deep(.el-icon) {
        font-size: 24px;
      }
    }

    .card-info {
      .plate-number {
        font-size: 16px;
      }

      .brand-model {
        font-size: 12px;
      }

      .mileage-info {
        font-size: 12px;
      }
    }

    &.add-card {
      min-height: 160px;

      .add-content {
        .el-icon {
          font-size: 32px;
        }

        span {
          font-size: 12px;
        }
      }
    }
  }
}

@media (max-width: $breakpoint-sm) {
  .vehicle-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
