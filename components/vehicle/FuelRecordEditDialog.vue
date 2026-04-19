<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="handleDialogClose"
    @open="handleDialogOpen"
    :title="record ? '编辑记录' : '新增记录'"
    width="600px"
    :close-on-click-modal="false"
    :fullscreen="isMobile"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      :label-position="isMobile ? 'top' : 'right'"
      class="fuel-record-form"
    >
      <el-form-item label="所属车辆" prop="vehicle_id">
        <el-select
          v-model="formData.vehicle_id"
          placeholder="请选择车辆"
          style="width: 100%"
          filterable
          @change="handleVehicleChange"
        >
          <el-option
            v-for="item in vehicleStore.activeVehicles"
            :key="item.id"
            :label="`${item.plate_number} - ${item.brand_model}`"
            :value="item.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="记录类型" prop="record_type">
        <el-radio-group
          v-model="formData.record_type"
          :disabled="!!formData.vehicle_id"
        >
          <el-radio value="fuel">
            <span class="radio-label fuel">⛽ 加油</span>
          </el-radio>
          <el-radio value="charge">
            <span class="radio-label charge">🔌 充电</span>
          </el-radio>
        </el-radio-group>
        <div v-if="formData.vehicle_id" class="type-hint">
          根据所选车辆自动匹配
        </div>
      </el-form-item>

      <el-form-item label="日期" prop="record_date">
        <el-date-picker
          v-model="formData.record_date"
          type="date"
          placeholder="选择日期"
          style="width: 100%"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="时间" prop="record_time">
        <el-time-picker
          v-model="formData.record_time"
          placeholder="选择时间（可选）"
          style="width: 100%"
          format="HH:mm"
          value-format="HH:mm:ss"
        />
      </el-form-item>

      <el-form-item label="金额(元)" prop="amount">
        <el-input-number
          v-model="formData.amount"
          :min="0.01"
          :max="99999.99"
          :precision="2"
          :step="10"
          controls-position="right"
          style="width: 100%"
          placeholder="请输入金额"
        />
      </el-form-item>

      <el-form-item label="当前里程(km)" prop="current_mileage">
        <el-input-number
          v-model="formData.current_mileage"
          :min="minMileage"
          :max="9999999.99"
          :precision="2"
          :step="100"
          controls-position="right"
          style="width: 100%"
          placeholder="请输入当前里程数"
        />

        <!-- 自动计算提示信息 -->
        <div v-if="calculatedInfo.lastMileage !== null" class="calc-info">
          <div class="calc-row">
            <span class="calc-label">上次里程:</span>
            <span class="calc-value"
              >{{ formatNumber(calculatedInfo.lastMileage) }} km</span
            >
          </div>
          <div
            class="calc-row"
            v-if="
              calculatedInfo.mileageDiff !== null &&
              calculatedInfo.mileageDiff > 0
            "
          >
            <span class="calc-label">本次行驶:</span>
            <span class="calc-value highlight-positive"
              >+{{ formatNumber(calculatedInfo.mileageDiff) }} km</span
            >
          </div>
          <div
            class="calc-row"
            v-if="
              calculatedInfo.costPerKm !== null && calculatedInfo.costPerKm > 0
            "
          >
            <span class="calc-label">每公里成本:</span>
            <span class="calc-value highlight-cost"
              >¥{{ calculatedInfo.costPerKm.toFixed(4) }}/km</span
            >
          </div>
        </div>
        <div v-else class="form-tip">
          首次记录时，系统将使用车辆的初始里程作为基准
        </div>
      </el-form-item>

      <el-form-item label="备注" prop="remarks">
        <el-input
          v-model="formData.remarks"
          type="textarea"
          :rows="3"
          placeholder="可选，添加备注信息"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          @click="handleSubmit"
        >
          {{ record ? "更新" : "保存" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import type { VehicleFuelRecord, VehicleFuelRecordForm } from "~/types";
import { formatNumber } from "~/utils/format";

const props = defineProps<{
  modelValue: boolean;
  record?: VehicleFuelRecord | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

/** 判断是否为移动端 */
const isMobile = inject<Ref<boolean>>("isMobile", ref(false));

/** 车辆Store */
const vehicleStore = useVehicleStore();

/** 表单引用 */
const formRef = ref<FormInstance>();

/** 提交加载状态 */
const submitLoading = ref(false);

/** 表单数据 */
const formData = reactive<VehicleFuelRecordForm>({
  vehicle_id: null,
  record_type: "fuel",
  record_date: "",
  record_time: null,
  amount: 0,
  current_mileage: 0,
  remarks: null,
});

/** 表单验证规则 */
const formRules: FormRules<VehicleFuelRecordForm> = {
  vehicle_id: [
    {
      required: true,
      message: "请选择车辆",
      trigger: "change",
      type: "number" as const,
    },
  ],
  record_type: [
    { required: true, message: "请选择记录类型", trigger: "change" },
  ],
  record_date: [{ required: true, message: "请选择日期", trigger: "change" }],
  amount: [
    { required: true, message: "请输入金额", trigger: "blur" },
    { type: "number", min: 0.01, message: "金额必须大于0", trigger: "blur" },
  ],
  current_mileage: [
    { required: true, message: "请输入当前里程数", trigger: "blur" },
    { type: "number", min: 0, message: "里程数不能为负数", trigger: "blur" },
  ],
};

/** 获取上次里程数（用于限制最小输入值） */
const lastMileage = computed((): number => {
  if (!formData.vehicle_id) return 0;

  /** 查找该车辆上一次的记录 */
  const vehicleRecords = vehicleStore.fuelRecords
    .filter((r) => r.vehicle_id === formData.vehicle_id)
    .sort((a, b) => {
      if (a.record_date !== b.record_date) {
        return b.record_date.localeCompare(a.record_date);
      }
      return (b.record_time || "").localeCompare(a.record_time || "");
    });

  /** 排除当前编辑的记录 */
  const lastRecord = vehicleRecords.find((r) => r.id !== props.record?.id);

  if (lastRecord) {
    return lastRecord.current_mileage;
  }

  /** 没有历史记录，使用车辆基准里程 */
  const vehicle = vehicleStore.getVehicleById(formData.vehicle_id);
  return vehicle?.base_mileage || 0;
});

/** 当前里程数的最小允许值（必须大于上次） */
const minMileage = computed(() => {
  const min = lastMileage.value;
  /** 编辑模式：允许等于当前值 */
  if (props.record?.id) {
    return min;
  }
  /** 新增模式：必须大于上次 */
  return Math.max(min + 0.01, 0);
});

/** 计算提示信息 */
const calculatedInfo = computed(() => {
  if (!formData.vehicle_id || !formData.current_mileage) {
    return {
      lastMileage: null as number | null,
      mileageDiff: null as number | null,
      costPerKm: null as number | null,
    };
  }

  const last = lastMileage.value;

  return {
    lastMileage: last,
    mileageDiff: formData.current_mileage - last,
    costPerKm:
      formData.amount > 0 && formData.current_mileage - last > 0
        ? formData.amount / (formData.current_mileage - last)
        : null,
  };
});

/** 根据车辆ID获取对应的记录类型 */
const getRecordTypeByVehicle = (vehicleId: number | null): string => {
  if (!vehicleId) return "fuel";

  const vehicle = vehicleStore.getVehicleById(vehicleId);
  if (!vehicle) return "fuel";

  /** 燃油车 -> 加油, 纯电动 -> 充电 */
  if (vehicle.vehicle_type === "fuel") {
    return "fuel";
  }
  return "charge";
};

/** 处理车辆选择变化 */
const handleVehicleChange = (vehicleId: number) => {
  if (vehicleId) {
    formData.record_type = getRecordTypeByVehicle(vehicleId);
    /** 选择车辆后，自动设置默认里程数 */
    const min = lastMileage.value;
    if (formData.current_mileage <= min) {
      formData.current_mileage = min + 100;
    }
  }
};

/** 弹窗打开时处理 */
const handleDialogOpen = () => {
  if (props.record) {
    /** 编辑模式：填充数据 */
    Object.assign(formData, {
      id: props.record.id,
      vehicle_id: props.record.vehicle_id,
      record_type: props.record.record_type,
      record_date: props.record.record_date,
      record_time: props.record.record_time || null,
      amount: props.record.amount,
      current_mileage: props.record.current_mileage,
      remarks: props.record.remarks,
    });
  } else {
    /** 新增模式：完全重置表单 */
    resetForm();
  }
};

/** 弹窗关闭时处理 */
const handleDialogClose = (val: boolean) => {
  emit("update:modelValue", val);
};

/** 重置表单为默认值（当前日期时间） */
const resetForm = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");

  Object.assign(formData, {
    id: undefined,
    vehicle_id: null,
    record_type: "fuel",
    record_date: `${year}-${month}-${day}`,
    record_time: `${hour}:00:00`,
    amount: 0,
    current_mileage: 0,
    remarks: null,
  });

  nextTick(() => {
    if (formRef.value) {
      formRef.value.resetFields();
    }
  });
};

/** 取消操作 */
const handleCancel = () => {
  emit("update:modelValue", false);
};

/** 提交表单 */
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    submitLoading.value = true;

    if (props.record?.id) {
      /** 更新记录 */
      await vehicleStore.updateFuelRecord(props.record.id, formData);
      ElMessage.success("更新成功");
    } else {
      /** 创建记录 */
      await vehicleStore.createFuelRecord(formData);
      ElMessage.success("保存成功");
    }

    emit("success");
    emit("update:modelValue", false);
  } catch (error: any) {
    console.error("保存记录失败:", error);
    ElMessage.error(error.message || "保存失败");
  } finally {
    submitLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.fuel-record-form {
  .radio-label {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: $border-radius;
    transition: all $transition-fast;

    &.fuel {
      color: #e54a5a;
      background: rgba(255, 107, 107, 0.08);
    }

    &.charge {
      color: #2e9a8f;
      background: rgba(78, 205, 196, 0.08);
    }
  }

  .calc-info {
    margin-top: $spacing-sm;
    padding: $spacing-md;
    background: #ffffff;
    border: 1px solid $border-color;
    border-radius: $border-radius-lg;
    font-size: 13px;
    box-shadow: $shadow-sm;

    .calc-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-sm 0;

      &:not(:last-child) {
        border-bottom: 1px dashed $border-color;
      }
    }

    .calc-label {
      color: $text-secondary;
      font-weight: 500;
    }

    .calc-value {
      color: $text-primary;
      font-weight: 700;
      font-family: $font-mono;
    }

    .highlight-positive {
      color: #2e9a8f;
      background: linear-gradient(
        135deg,
        rgba(78, 205, 196, 0.15) 0%,
        rgba(69, 183, 209, 0.15) 100%
      );
      padding: 2px 8px;
      border-radius: 4px;
    }

    .highlight-cost {
      color: $accent;
      background: rgba(255, 107, 157, 0.1);
      padding: 2px 8px;
      border-radius: 4px;
    }
  }

  .form-tip {
    font-size: 12px;
    color: $text-secondary;
    margin-top: $spacing-sm;
    line-height: 1.5;
    padding: $spacing-sm;
    background: $bg-light;
    border-radius: $border-radius;
  }

  .type-hint {
    font-size: 12px;
    color: $text-secondary;
    margin-top: $spacing-xs;
    line-height: 1.4;
  }

  :deep(.el-input-number) {
    .el-input__inner {
      text-align: left;
    }
  }

  :deep(.el-form-item__label) {
    color: $text-primary;
    font-weight: 500;
  }

  :deep(.el-radio__label) {
    color: $text-primary;
  }
}

:deep(.el-dialog) {
  background: #ffffff;
  border-radius: $border-radius-xl;
  box-shadow: $shadow-lg;

  .el-dialog__header {
    background: #ffffff;
    border-bottom: 1px solid $border-color;
    padding: $spacing-lg $spacing-xl;
    border-radius: $border-radius-xl $border-radius-xl 0 0;

    .el-dialog__title {
      color: $text-primary;
      font-weight: 700;
      font-size: 18px;
    }

    .el-dialog__headerbtn {
      top: 18px;
      right: 20px;

      .el-dialog__close {
        color: $text-secondary;
        font-size: 18px;
        font-weight: 600;

        &:hover {
          color: $primary;
        }
      }
    }
  }

  .el-dialog__body {
    background: #ffffff;
    padding: $spacing-xl;
    color: $text-primary;
  }

  .el-dialog__footer {
    background: #ffffff;
    border-top: 1px solid $border-color;
    padding: $spacing-md $spacing-xl;
    border-radius: 0 0 $border-radius-xl $border-radius-xl;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
}
</style>
