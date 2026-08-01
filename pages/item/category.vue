<template>
  <div class="category-manage-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>物品分类管理</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加分类
          </el-button>
        </div>
      </template>

      <el-tree
        :data="categoryTree"
        :props="{ label: 'name', children: 'children' }"
        node-key="id"
        default-expand-all
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <div class="node-content">
              <span class="node-icon">{{ data.icon }}</span>
              <span class="node-name">{{ data.name }}</span>
              <el-tag v-if="data.parent_id" size="small" type="info">
                子分类
              </el-tag>
            </div>
            <div class="node-actions">
              <el-button
                text
                size="small"
                @click.stop="showAddChildDialog(data)"
              >
                添加子分类
              </el-button>
              <el-button text size="small" @click.stop="showEditDialog(data)">
                编辑
              </el-button>
              <el-button
                text
                size="small"
                type="danger"
                @click.stop="handleDelete(data)"
              >
                删除
              </el-button>
            </div>
          </div>
        </template>
      </el-tree>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入分类名称"
            maxlength="50"
          />
        </el-form-item>

        <el-form-item label="分类图标" prop="icon">
          <div class="icon-selector">
            <div class="icon-preview" @click="showIconPicker">
              {{ form.icon || "📦" }}
            </div>
            <el-input
              v-model="form.icon"
              placeholder="输入emoji或点击选择"
              style="flex: 1"
            />
          </div>
        </el-form-item>

        <el-form-item label="父级分类" prop="parent_id">
          <el-tree-select
            v-model="form.parent_id"
            :data="parentCategories"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="选择父级分类（可选）"
            clearable
            check-strictly
          />
        </el-form-item>

        <el-form-item label="排序" prop="sort_order">
          <el-input-number
            v-model="form.sort_order"
            :min="0"
            :max="999"
            placeholder="排序值"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="iconPickerVisible"
      title="选择分类图标"
      width="500px"
      :close-on-click-modal="false"
    >
      <ItemEmojiPicker v-model="form.icon" />
      <template #footer>
        <el-button @click="iconPickerVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import { useItemStore, type ItemCategory } from "~/stores/item";

definePageMeta({
  layout: "default",
  middleware: "auth",
});

const itemStore = useItemStore();

const dialogVisible = ref(false);
const iconPickerVisible = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  id: null as number | null,
  name: "",
  icon: "",
  parent_id: null as number | null,
  sort_order: 0,
});

const rules: FormRules = {
  name: [
    { required: true, message: "请输入分类名称", trigger: "blur" },
    { max: 50, message: "分类名称不能超过50个字符", trigger: "blur" },
  ],
};

/**
 * 对话框标题
 */
const dialogTitle = computed(() => {
  if (form.id) return "编辑分类";
  if (form.parent_id) return "添加子分类";
  return "添加分类";
});

/**
 * 分类树数据
 */
const categoryTree = computed(() => itemStore.categoryTree);

/**
 * 父级分类选项（排除当前分类及其子分类）
 */
const parentCategories = computed(() => {
  if (!form.id) return itemStore.categoryTree;

  const filterTree = (categories: ItemCategory[]): ItemCategory[] => {
    return categories
      .filter((cat) => cat.id !== form.id)
      .map((cat) => ({
        ...cat,
        children: cat.children ? filterTree(cat.children) : undefined,
      }));
  };

  return filterTree(itemStore.categoryTree);
});

/**
 * 显示添加对话框
 */
const showAddDialog = () => {
  Object.assign(form, {
    id: null,
    name: "",
    icon: "",
    parent_id: null,
    sort_order: 0,
  });
  dialogVisible.value = true;
};

/**
 * 显示添加子分类对话框
 */
const showAddChildDialog = (parent: ItemCategory) => {
  Object.assign(form, {
    id: null,
    name: "",
    icon: "",
    parent_id: parent.id,
    sort_order: 0,
  });
  dialogVisible.value = true;
};

/**
 * 显示编辑对话框
 */
const showEditDialog = (category: ItemCategory) => {
  Object.assign(form, {
    id: category.id,
    name: category.name,
    icon: category.icon || "",
    parent_id: category.parent_id,
    sort_order: category.sort_order,
  });
  dialogVisible.value = true;
};

/**
 * 显示图标选择器
 */
const showIconPicker = () => {
  iconPickerVisible.value = true;
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const api = useApi();
      const data = {
        name: form.name,
        icon: form.icon || null,
        parent_id: form.parent_id,
        sort_order: form.sort_order,
      };

      if (form.id) {
        await api.put(`/api/item/category/${form.id}`, data);
        ElMessage.success("修改成功");
      } else {
        await api.post("/api/item/category", data);
        ElMessage.success("添加成功");
      }

      dialogVisible.value = false;
      await itemStore.fetchCategories();
    } catch (error: any) {
      ElMessage.error(error.message || "操作失败");
    } finally {
      submitting.value = false;
    }
  });
};

/**
 * 删除分类
 */
const handleDelete = async (category: ItemCategory) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类"${category.name}"吗？删除后无法恢复。`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    const api = useApi();
    await api.delete(`/api/item/category/${category.id}`);
    ElMessage.success("删除成功");
    await itemStore.fetchCategories();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除失败");
    }
  }
};

onMounted(() => {
  itemStore.fetchCategories();
});
</script>

<style scoped lang="scss">
.category-manage-page {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 8px;

    .node-content {
      display: flex;
      align-items: center;
      gap: 8px;

      .node-icon {
        font-size: 20px;
      }

      .node-name {
        font-size: 14px;
      }
    }

    .node-actions {
      display: flex;
      gap: 4px;
    }
  }

  .icon-selector {
    display: flex;
    align-items: center;
    gap: 12px;

    .icon-preview {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      background: #f5f7fa;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: #e4e7ed;
      }
    }
  }
}
</style>
