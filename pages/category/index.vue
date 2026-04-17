<template>
  <div class="category-page">
    <div class="page-header">
      <h2>分类管理</h2>
      <el-button type="primary" @click="openAddDialog()">
        <el-icon><Plus /></el-icon> 新增分类
      </el-button>
    </div>

    <!-- 所有分类 -->
    <el-card class="category-card">
      <template #header>
        <div class="card-header">
          <span>分类列表</span>
          <span class="tip">支持编辑、删除、排序</span>
        </div>
      </template>

      <el-table :data="categoryList" stripe row-key="id">
        <el-table-column prop="name" label="分类名称" min-width="150">
          <template #default="{ row }">
            <span>{{ row.name }}</span>
            <el-tag v-if="row.is_system" size="small" type="info" style="margin-left: 8px">系统</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="100" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.sort_order"
              :min="0"
              :max="99"
              size="small"
              controls-position="right"
              @change="updateSortOrder(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button
              link
              type="danger"
              :disabled="row.is_system"
              @click="deleteCategory(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="categoryForm" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sort_order" :min="0" :max="99" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitCategory">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Category } from '~/types'

definePageMeta({
  middleware: ['auth'],
})

const categoryStore = useCategoryStore()
const api = useApi()

// 分类列表（一级分类）
const categoryList = computed(() => {
  return categoryStore.tree || []
})

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const categoryForm = reactive({
  id: null as number | null,
  name: '',
  sort_order: 0,
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 50, message: '分类名称不能超过50个字符', trigger: 'blur' },
  ],
}

// 初始化
onMounted(async () => {
  await categoryStore.fetchCategories()
})

// 更新排序
const updateSortOrder = async (category: Category) => {
  try {
    await categoryStore.updateCategory(category.id, {
      name: category.name,
      sort_order: category.sort_order,
    })
    ElMessage.success('排序已更新')
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  }
}

// 打开新增弹窗
const openAddDialog = () => {
  isEdit.value = false
  categoryForm.id = null
  categoryForm.name = ''
  categoryForm.sort_order = categoryList.value.length + 1
  dialogVisible.value = true
}

// 打开编辑弹窗
const openEditDialog = (category: Category) => {
  isEdit.value = true
  categoryForm.id = category.id
  categoryForm.name = category.name
  categoryForm.sort_order = category.sort_order
  dialogVisible.value = true
}

// 提交分类
const submitCategory = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  saving.value = true
  try {
    if (isEdit.value && categoryForm.id) {
      await categoryStore.updateCategory(categoryForm.id, {
        name: categoryForm.name,
        sort_order: categoryForm.sort_order,
      })
    } else {
      await categoryStore.createCategory({
        name: categoryForm.name,
        sort_order: categoryForm.sort_order,
      })
    }
    ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
    dialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    saving.value = false
  }
}

// 删除分类
const deleteCategory = async (category: Category) => {
  // 禁止删除系统分类
  if (category.is_system) {
    ElMessage.warning('系统分类不能删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要删除该分类吗？',
      '提示',
      { type: 'warning' }
    )

    await categoryStore.deleteCategory(category.id)
    ElMessage.success('删除成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}
</script>

<style lang="scss" scoped>
.category-page {
  max-width: 800px;
  margin: 0 auto;
}

.category-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .tip {
      font-size: 12px;
      color: $text-secondary;
    }
  }
}
</style>
