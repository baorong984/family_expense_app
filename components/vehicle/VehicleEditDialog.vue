<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="(val: boolean) => emit('update:modelValue', val)"
    :title="vehicle ? '编辑车辆' : '添加车辆'"
    width="560px"
    :close-on-click-modal="false"
    :fullscreen="isMobile"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      :label-position="isMobile ? 'top' : 'right'"
      class="vehicle-form"
    >
      <el-form-item label="车牌号" prop="plate_number">
        <el-input
          v-model="formData.plate_number"
          placeholder="请输入车牌号，如：京A12345"
          maxlength="20"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="品牌型号" prop="brand_model">
        <el-input
          v-model="formData.brand_model"
          placeholder="请输入品牌型号，如：比亚迪秦PLUS"
          maxlength="100"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="车辆类型" prop="vehicle_type">
        <el-select
          v-model="formData.vehicle_type"
          placeholder="请选择车辆类型"
          style="width: 100%"
        >
          <el-option
            v-for="item in VEHICLE_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="基准里程" prop="base_mileage">
        <el-input-number
          v-model="formData.base_mileage"
          :min="0"
          :max="9999999.99"
          :precision="2"
          :step="100"
          controls-position="right"
          style="width: 100%"
          placeholder="请输入基准里程数（公里）"
        />
        <div class="form-tip">记录录入后会根据当前里程自动更新此值</div>
      </el-form-item>

      <el-form-item v-if="vehicle" label="状态" prop="is_active">
        <el-switch
          v-model="formData.is_active"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="停用"
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
          {{ vehicle ? "更新" : "创建" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import type { Vehicle, VehicleForm } from "~/types";
import { VEHICLE_TYPE_OPTIONS } from "~/types";

const props = defineProps<{
  modelValue: boolean;
  vehicle?: Vehicle | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

/** 判断是否为移动端 */
const isMobile = inject<Ref<boolean>>("isMobile", ref(false));

/** 表单引用 */
const formRef = ref<FormInstance>();

/** 提交加载状态 */
const submitLoading = ref(false);

/** 表单数据 */
const formData = reactive<VehicleForm>({
  plate_number: "",
  brand_model: "",
  vehicle_type: "fuel",
  base_mileage: 0,
  is_active: 1,
});

/** 表单验证规则 */
const formRules: FormRules<VehicleForm> = {
  plate_number: [
    { required: true, message: "请输入车牌号", trigger: "blur" },
    { min: 1, max: 20, message: "车牌号长度在1-20个字符之间", trigger: "blur" },
  ],
  brand_model: [
    { required: true, message: "请输入品牌型号", trigger: "blur" },
    {
      min: 1,
      max: 100,
      message: "品牌型号长度在1-100个字符之间",
      trigger: "blur",
    },
  ],
  vehicle_type: [
    { required: true, message: "请选择车辆类型", trigger: "change" },
  ],
  base_mileage: [
    { required: true, message: "请输入基准里程数", trigger: "blur" },
    {
      type: "number",
      min: 0,
      message: "基准里程数不能为负数",
      trigger: "blur",
    },
  ],
};

/** 重置表单 */
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  Object.assign(formData, {
    plate_number: "",
    brand_model: "",
    vehicle_type: "fuel",
    base_mileage: 0,
    is_active: 1,
  });
};

/** 监听车辆变化，填充表单 */
watch(
  () => props.vehicle,
  (newVehicle) => {
    if (newVehicle) {
      Object.assign(formData, {
        id: newVehicle.id,
        plate_number: newVehicle.plate_number,
        brand_model: newVehicle.brand_model,
        vehicle_type: newVehicle.vehicle_type,
        base_mileage: newVehicle.base_mileage || 0,
        is_active: newVehicle.is_active,
      });
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

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
    const vehicleStore = useVehicleStore();

    if (props.vehicle?.id) {
      /** 更新车辆 */
      await vehicleStore.updateVehicle(props.vehicle.id, formData);
      ElMessage.success("更新成功");
    } else {
      /** 创建车辆 */
      await vehicleStore.createVehicle(formData);
      ElMessage.success("创建成功");
    }

    emit("success");
    emit("update:modelValue", false);
  } catch (error: any) {
    console.error("保存车辆失败:", error);
    ElMessage.error(error.message || "保存失败");
  } finally {
    submitLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.vehicle-form {
  .form-tip {
    font-size: 12px;
    color: $text-secondary;
    margin-top: $spacing-sm;
    line-height: 1.5;
    padding: $spacing-sm;
    background: $bg-light;
    border-radius: $border-radius;
  }

  :deep(.el-input-number) {
    .el-input__inner {
      text-align: left;
    }
  }

  :deep(.el-switch) {
    margin-top: $spacing-xs;
  }

  :deep(.el-form-item__label) {
    color: $text-primary;
    font-weight: 500;
  }
}

:deep(.el-dialog) {
  background: #FFFFFF;
  border-radius: $border-radius-xl;
  box-shadow: $shadow-lg;

  .el-dialog__header {
    background: #FFFFFF;
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
    background: #FFFFFF;
    padding: $spacing-xl;
    color: $text-primary;
  }

  .el-dialog__footer {
    background: #FFFFFF;
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
