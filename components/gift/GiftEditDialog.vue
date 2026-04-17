<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEdit ? '编辑人情记录' : '新增人情记录'"
    width="600px"
    :close-on-click-modal="false"
    class="gift-edit-dialog"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="edit-form"
    >
      <el-form-item label="类型" prop="gift_type">
        <el-radio-group v-model="form.gift_type">
          <el-radio value="outgoing">出礼</el-radio>
          <el-radio value="incoming">收礼</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="支付类型" prop="payment_type">
        <el-radio-group v-model="form.payment_type">
          <el-radio value="cash">现金</el-radio>
          <el-radio value="item">实物</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="form.payment_type === 'cash'"
        label="金额"
        prop="amount"
      >
        <el-input-number
          v-model="form.amount"
          :precision="2"
          :min="0"
          :step="100"
          style="width: 100%"
        >
          <template #prefix>¥</template>
        </el-input-number>
      </el-form-item>

      <el-form-item
        v-if="form.payment_type === 'item'"
        label="实物名称"
        prop="item_name"
      >
        <el-input
          v-model="form.item_name"
          placeholder="如：茶具、花篮"
        />
      </el-form-item>

      <el-form-item
        v-if="form.payment_type === 'item'"
        label="实物价值"
        prop="item_value"
      >
        <el-input-number
          v-model="form.item_value"
          :precision="2"
          :min="0"
          :step="100"
          style="width: 100%"
        >
          <template #prefix>¥</template>
        </el-input-number>
      </el-form-item>

      <el-form-item label="关联人" prop="related_person">
        <el-input
          v-model="form.related_person"
          placeholder="请输入关联人姓名"
        />
      </el-form-item>

      <el-form-item label="事由" prop="occasion">
        <el-select
          v-model="form.occasion"
          placeholder="请选择事由"
          style="width: 100%"
        >
          <el-option
            v-for="item in occasionOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="日期" prop="expense_date">
            <el-date-picker
              v-model="form.expense_date"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="时间">
            <el-select
              v-model="form.expense_time"
              placeholder="选择小时"
              style="width: 100%"
            >
              <el-option
                v-for="h in hourOptions"
                :key="h.value"
                :label="h.label"
                :value="h.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item v-if="form.gift_type === 'outgoing'" label="回礼状态">
        <el-switch
          v-model="isReturned"
          active-text="已回礼"
          inactive-text="未回礼"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.remarks"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
          resize="none"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="$emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import type { Gift, GiftForm } from "~/types";

const props = defineProps<{
  modelValue: boolean;
  gift: Gift | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [];
}>();

const giftStore = useGiftStore();
const categoryStore = useCategoryStore();
const api = useApi();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive<GiftForm>({
  gift_type: 'outgoing',
  payment_type: 'cash',
  amount: undefined,
  item_name: '',
  item_value: undefined,
  related_person: '',
  occasion: '',
  expense_date: '',
  expense_time: undefined,
  is_returned: 0,
  remarks: '',
});

const isReturned = ref(false);

/** 事由选项（根据gift_type动态获取对应的分类） */
const occasionOptions = computed(() => {
  const options: { label: string; value: string }[] = [];
  const categoryName = form.gift_type === 'outgoing' ? '出礼' : '收礼';
  categoryStore.tree.forEach(cat => {
    if (cat.name === categoryName) {
      cat.children?.forEach(sub => {
        options.push({
          label: sub.name,
          value: sub.name
        });
      });
    }
  });
  return options;
});

const rules: FormRules = {
  gift_type: [{ required: true, message: "请选择类型", trigger: "change" }],
  payment_type: [{ required: true, message: "请选择支付类型", trigger: "change" }],
  amount: [
    {
      validator: (rule, value, callback) => {
        if (form.payment_type === 'cash' && (!value || value <= 0)) {
          callback(new Error('请输入有效金额'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  item_name: [
    {
      validator: (rule, value, callback) => {
        if (form.payment_type === 'item' && !value?.trim()) {
          callback(new Error('请输入实物名称'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  related_person: [{ required: true, message: "请输入关联人姓名", trigger: "blur" }],
  occasion: [{ required: true, message: "请选择事由", trigger: "change" }],
  expense_date: [
    { required: true, message: "请选择日期", trigger: "change" },
  ],
};

/** 生成小时选项 0-23 */
const hourOptions = Array.from({ length: 24 }, (_, i) => {
  const str_h = i.toString().padStart(2, "0");
  return {
    value: `${str_h}:00:00`,
    label: `${str_h}:00`,
  };
});

const isEdit = computed(() => !!props.gift?.id);

/** 监听gift变化，填充表单 */
watch(
  () => props.gift,
  (val) => {
    if (val) {
      form.gift_type = val.gift_type;
      form.payment_type = val.payment_type;
      form.amount = val.amount !== null ? Number(val.amount) : undefined;
      form.item_name = val.item_name || '';
      form.item_value = val.item_value !== null ? Number(val.item_value) : undefined;
      form.related_person = val.related_person;
      form.occasion = val.occasion;
      form.expense_date = val.expense_date;
      form.expense_time = val.expense_time || undefined;
      form.is_returned = val.is_returned;
      form.remarks = val.remarks || '';
      isReturned.value = val.is_returned === 1;
    }
  },
  { immediate: true },
);

/** 监听支付类型变化，清空相关字段 */
watch(
  () => form.payment_type,
  (val) => {
    if (val === 'cash') {
      form.item_name = '';
      form.item_value = undefined;
    } else {
      form.amount = undefined;
    }
  }
);

/** 监听类型变化，重置回礼状态 */
watch(
  () => form.gift_type,
  (val) => {
    if (val === 'incoming') {
      isReturned.value = false;
      form.is_returned = 0;
    }
  }
);

/** 监听回礼状态变化 */
watch(
  () => isReturned.value,
  (val) => {
    form.is_returned = val ? 1 : 0;
  }
);

/** 重置表单 */
const resetForm = () => {
  form.gift_type = 'outgoing';
  form.payment_type = 'cash';
  form.amount = undefined;
  form.item_name = '';
  form.item_value = undefined;
  form.related_person = '';
  form.occasion = '';
  form.expense_date = '';
  form.expense_time = undefined;
  form.is_returned = 0;
  form.remarks = '';
  isReturned.value = false;
  formRef.value?.clearValidate();
};

/** 提交表单 */
const handleSubmit = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  loading.value = true;
  try {
    let res;
    if (isEdit.value && props.gift?.id) {
      res = await giftStore.updateGift(props.gift.id, form);
    } else {
      res = await giftStore.createGift(form);
    }

    ElMessage.success(isEdit.value ? "更新成功" : "创建成功");
    emit("update:modelValue", false);
    emit("success");
  } catch (error: any) {
    ElMessage.error(error.message || "保存失败");
  } finally {
    loading.value = false;
  }
};

/** 监听对话框关闭，重置表单 */
watch(
  () => props.modelValue,
  (val) => {
    if (!val) {
      resetForm();
    }
  }
);
</script>

<style lang="scss" scoped>
.edit-form {
  padding: $spacing-sm $spacing-md 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
}
</style>

<style lang="scss">
.gift-edit-dialog {
  .el-dialog {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }

  .el-dialog__header {
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    margin-right: 0;
    background: #ffffff;

    .el-dialog__title {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
    }

    .el-dialog__headerbtn {
      top: 20px;
      right: 20px;

      .el-dialog__close {
        color: #6b7280;
        font-size: 18px;

        &:hover {
          color: #1f2937;
        }
      }
    }
  }

  .el-dialog__body {
    padding: 24px;
    background: #ffffff;
  }

  .el-dialog__footer {
    padding: 16px 24px 20px;
    border-top: 1px solid #e5e7eb;
    background: #ffffff;
  }

  .el-form-item__label {
    color: #374151;
    font-weight: 500;
    font-size: 14px;
  }

  .el-input__wrapper {
    background: #ffffff;
    border: 1px solid #d1d5db;
    box-shadow: none;

    &:hover {
      border-color: #9ca3af;
    }

    &.is-focus {
      border-color: #4ecdc4;
      box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.15);
    }
  }

  .el-input__inner {
    color: #1f2937;
    font-size: 14px;
  }

  .el-input-number {
    .el-input__wrapper {
      background: #ffffff;
      border: 1px solid #d1d5db;
    }
  }

  .el-textarea__inner {
    background: #ffffff;
    border: 1px solid #d1d5db;
    color: #1f2937;
    font-size: 14px;

    &:hover {
      border-color: #9ca3af;
    }

    &:focus {
      border-color: #4ecdc4;
      box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.15);
    }
  }

  .el-select .el-input__wrapper {
    background: #ffffff;
    border: 1px solid #d1d5db;
  }

  .el-date-editor .el-input__wrapper {
    background: #ffffff;
    border: 1px solid #d1d5db;
  }
}
</style>