<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="编辑消费记录"
    width="560px"
    :close-on-click-modal="false"
    class="expense-edit-dialog"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      class="edit-form"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="金额" prop="amount">
            <el-input-number
              v-model="form.amount"
              :precision="2"
              :min="0"
              :step="1"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="成员">
            <el-select
              v-model="form.member_id"
              placeholder="选择成员"
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
        </el-col>
      </el-row>

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

      <el-form-item label="分类" prop="category_id">
        <el-cascader
          v-model="form.category_id"
          :options="categoryCascaderData"
          :props="{
            value: 'id',
            label: 'name',
            children: 'children',
            emitPath: false,
          }"
          placeholder="选择分类"
          clearable
          filterable
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.description"
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
import type { Expense } from "~/types";
import { categoryTreeToCascaderData } from "~/utils/tree";
import { formatDate } from "~/utils/format";

const props = defineProps<{
  modelValue: boolean;
  expense: Expense | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [];
}>();

const categoryStore = useCategoryStore();
const memberStore = useMemberStore();
const api = useApi();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  amount: 0,
  expense_date: "",
  expense_time: "00:00:00" as string | null,
  category_id: null as number | null,
  member_id: null as number | null,
  description: "",
});

const rules: FormRules = {
  amount: [{ required: true, message: "请输入金额", trigger: "blur" }],
  expense_date: [
    { required: true, message: "请选择日期", trigger: "change" },
  ],
  category_id: [
    { required: true, message: "请选择分类", trigger: "change" },
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

const categoryCascaderData = computed(() => {
  return categoryTreeToCascaderData(categoryStore.tree);
});

/** 监听expense变化，填充表单 */
watch(
  () => props.expense,
  (val) => {
    if (val) {
      form.amount = val.amount;
      form.expense_date = formatDate(val.expense_date);
      form.expense_time = val.expense_time || "00:00:00";
      form.category_id = val.category_id;
      form.member_id = val.member_id;
      form.description = val.description || "";
    }
  },
  { immediate: true },
);

/** 初始化分类和成员数据 */
onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategories(),
    memberStore.fetchMembers(),
  ]);
});

/** 提交编辑表单 */
const handleSubmit = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  if (!props.expense) return;

  loading.value = true;
  try {
    const res = await api.put(`/api/expense/${props.expense.id}`, form);

    if (res.success) {
      ElMessage.success("保存成功");
      emit("update:modelValue", false);
      emit("success");
    } else {
      ElMessage.error(res.message || "保存失败");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "保存失败");
  } finally {
    loading.value = false;
  }
};
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
.expense-edit-dialog {
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

  .el-cascader .el-input__wrapper {
    background: #ffffff;
    border: 1px solid #d1d5db;
  }

  .el-date-editor .el-input__wrapper {
    background: #ffffff;
    border: 1px solid #d1d5db;
  }
}
</style>
