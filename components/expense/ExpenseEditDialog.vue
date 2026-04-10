<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="编辑消费记录"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="金额" prop="amount">
        <el-input-number v-model="form.amount" :precision="2" :min="0" style="width: 100%" />
      </el-form-item>
      <el-form-item label="日期" prop="expense_date">
        <el-date-picker
          v-model="form.expense_date"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="时间">
        <el-time-picker
          v-model="form.expense_time"
          placeholder="选择时间"
          value-format="HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="分类" prop="category_id">
        <el-cascader
          v-model="form.category_id"
          :options="categoryCascaderData"
          :props="{ value: 'id', label: 'name', children: 'children', emitPath: false }"
          placeholder="选择分类"
          clearable
          filterable
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="成员">
        <el-select v-model="form.member_id" placeholder="选择成员" clearable style="width: 100%">
          <el-option
            v-for="member in memberStore.members"
            :key="member.id"
            :label="member.name"
            :value="member.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.description" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Expense } from '~/types'
import { categoryTreeToCascaderData } from '~/utils/tree'
import { formatDate } from '~/utils/format'

const props = defineProps<{
  modelValue: boolean
  expense: Expense | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const categoryStore = useCategoryStore()
const memberStore = useMemberStore()
const api = useApi()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  amount: 0,
  expense_date: '',
  expense_time: null as string | null,
  category_id: null as number | null,
  member_id: null as number | null,
  description: '',
})

const rules: FormRules = {
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
  ],
  expense_date: [
    { required: true, message: '请选择日期', trigger: 'change' },
  ],
  category_id: [
    { required: true, message: '请选择分类', trigger: 'change' },
  ],
}

const categoryCascaderData = computed(() => {
  return categoryTreeToCascaderData(categoryStore.tree)
})

// 监听expense变化，填充表单
watch(() => props.expense, (val) => {
  if (val) {
    form.amount = val.amount
    form.expense_date = formatDate(val.expense_date)
    form.expense_time = val.expense_time
    form.category_id = val.category_id
    form.member_id = val.member_id
    form.description = val.description || ''
  }
}, { immediate: true })

// 初始化分类和成员
onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategories(),
    memberStore.fetchMembers(),
  ])
})

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  if (!props.expense) return

  loading.value = true
  try {
    const res = await api.put(`/api/expense/${props.expense.id}`, form)

    if (res.success) {
      ElMessage.success('保存成功')
      emit('update:modelValue', false)
      emit('success')
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    loading.value = false
  }
}
</script>
