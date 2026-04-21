<template>
  <div class="category-page">
    <div class="page-header">
      <h2>分类管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="openAddDialog()">
          <el-icon><Plus /></el-icon> 新增分类
        </el-button>
        <el-button
          v-if="!isEditingOrder"
          type="default"
          @click="startEditOrder"
        >
          编辑顺序
        </el-button>
        <el-button v-else type="success" @click="saveOrder">
          保存顺序
        </el-button>
      </div>
    </div>

    <el-card class="category-card">
      <template #header>
        <div class="card-header">
          <span>分类列表</span>
          <span v-if="isEditingOrder" class="edit-tip">
            点击上下箭头调整分类顺序
          </span>
        </div>
      </template>

      <el-tree
        :key="treeKey"
        :data="displayTreeData"
        :props="treeProps"
        node-key="id"
        default-expand-all
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <div class="custom-tree-node">
            <span class="node-label">
              {{ data.name }}
              <el-tag v-if="data.is_system" size="small" type="info"
                >系统</el-tag
              >
            </span>
            <span class="node-actions">
              <template v-if="isEditingOrder">
                <el-button
                  link
                  type="primary"
                  size="small"
                  :disabled="!canMoveUp(data)"
                  @click.stop="moveUp(data)"
                >
                  <el-icon><ArrowUp /></el-icon>
                </el-button>
                <el-button
                  link
                  type="primary"
                  size="small"
                  :disabled="!canMoveDown(data)"
                  @click.stop="moveDown(data)"
                >
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
              </template>
              <template v-else>
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click.stop="openAddChildDialog(data)"
                >
                  添加子分类
                </el-button>
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click.stop="openEditDialog(data)"
                >
                  编辑
                </el-button>
                <el-button
                  link
                  type="danger"
                  size="small"
                  :disabled="!!data.is_system"
                  @click.stop="deleteCategory(data)"
                >
                  删除
                </el-button>
              </template>
            </span>
          </div>
        </template>
      </el-tree>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="categoryForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="categoryForm.name"
            placeholder="请输入分类名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="父级分类" v-if="!isEdit">
          <el-tree-select
            v-model="categoryForm.parent_id"
            :data="parentTreeData"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="选择父级分类（不选则为一级分类）"
            clearable
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitCategory">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, ArrowUp, ArrowDown } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import type { Category } from "~/types";

definePageMeta({
  middleware: ["auth"],
});

interface CategoryWithSort extends Category {
  sort_order: number;
}

const api = useApi();
const saving = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const isEditingOrder = ref(false);
const formRef = ref<FormInstance>();
const categoryList = ref<Category[]>([]);
const localCategoryList = ref<CategoryWithSort[]>([]);
const treeKey = ref(0);

const categoryForm = reactive({
  id: null as number | null,
  name: "",
  parent_id: null as number | null,
});

const rules: FormRules = {
  name: [
    { required: true, message: "请输入分类名称", trigger: "blur" },
    { max: 50, message: "分类名称不能超过50个字符", trigger: "blur" },
  ],
};

const treeProps = {
  children: "children",
  label: "name",
};

const dialogTitle = computed(() => {
  if (isEdit.value) return "编辑分类";
  return categoryForm.parent_id ? "新增子分类" : "新增一级分类";
});

/**
 * 深拷贝分类列表
 */
const deepCopyCategories = (list: Category[]): CategoryWithSort[] => {
  return list.map((item) => ({
    ...item,
    sort_order: item.sort_order || 0,
    children: item.children ? deepCopyCategories(item.children) : [],
  }));
};

/**
 * 对树形数据进行排序
 */
const sortTreeData = (list: CategoryWithSort[]): CategoryWithSort[] => {
  if (!list || list.length === 0) return [];

  const sorted = [...list].sort((a, b) => a.sort_order - b.sort_order);

  sorted.forEach((item) => {
    if (item.children && item.children.length > 0) {
      item.children = sortTreeData(item.children);
    }
  });

  return sorted;
};

const displayTreeData = computed(() => {
  const source = isEditingOrder.value ? localCategoryList.value : categoryList.value;
  return sortTreeData(deepCopyCategories(source));
});

const parentTreeData = computed(() => {
  return displayTreeData.value.map((item) => ({
    ...item,
    children: undefined,
  }));
});

/**
 * 获取同级分类列表（按sort_order排序）
 */
const getSiblings = (category: CategoryWithSort): CategoryWithSort[] => {
  if (category.parent_id === null) {
    return [...localCategoryList.value]
      .filter((c) => c.parent_id === null)
      .sort((a, b) => a.sort_order - b.sort_order);
  } else {
    const parent = findCategoryById(localCategoryList.value, category.parent_id);
    const children = parent?.children || [];
    return [...children].sort((a, b) => a.sort_order - b.sort_order);
  }
};

/**
 * 查找分类
 */
const findCategoryById = (list: CategoryWithSort[], id: number): CategoryWithSort | null => {
  for (const item of list) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findCategoryById(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

/**
 * 判断是否可以上移
 */
const canMoveUp = (category: CategoryWithSort): boolean => {
  const siblings = getSiblings(category);
  const currentIndex = siblings.findIndex((s) => s.id === category.id);
  return currentIndex > 0;
};

/**
 * 判断是否可以下移
 */
const canMoveDown = (category: CategoryWithSort): boolean => {
  const siblings = getSiblings(category);
  const currentIndex = siblings.findIndex((s) => s.id === category.id);
  return currentIndex < siblings.length - 1;
};

/**
 * 更新本地分类排序
 */
const updateLocalSortOrder = (
  categoryId: number,
  newSortOrder: number,
) => {
  const updateCategory = (list: CategoryWithSort[]): boolean => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === categoryId) {
        list[i].sort_order = newSortOrder;
        return true;
      }
      if (list[i].children && updateCategory(list[i].children)) {
        return true;
      }
    }
    return false;
  };
  updateCategory(localCategoryList.value);
};

/**
 * 上移分类（本地操作）
 */
const moveUp = (category: CategoryWithSort) => {
  const siblings = getSiblings(category);
  const currentIndex = siblings.findIndex((s) => s.id === category.id);

  if (currentIndex <= 0) return;

  const prevCategory = siblings[currentIndex - 1];

  updateLocalSortOrder(category.id, prevCategory.sort_order);
  updateLocalSortOrder(prevCategory.id, category.sort_order);

  treeKey.value++;
};

/**
 * 下移分类（本地操作）
 */
const moveDown = (category: CategoryWithSort) => {
  const siblings = getSiblings(category);
  const currentIndex = siblings.findIndex((s) => s.id === category.id);

  if (currentIndex >= siblings.length - 1) return;

  const nextCategory = siblings[currentIndex + 1];

  updateLocalSortOrder(category.id, nextCategory.sort_order);
  updateLocalSortOrder(nextCategory.id, category.sort_order);

  treeKey.value++;
};

/**
 * 收集所有分类的排序信息
 */
const collectSortItems = (list: CategoryWithSort[], parentId: number | null = null) => {
  const items: { id: number; parent_id: number | null; sort_order: number }[] = [];
  
  list.forEach((item, index) => {
    items.push({
      id: item.id,
      parent_id: parentId,
      sort_order: index,
    });
    
    if (item.children && item.children.length > 0) {
      items.push(...collectSortItems(item.children, item.id));
    }
  });
  
  return items;
};

/**
 * 开始编辑顺序
 */
const startEditOrder = () => {
  isEditingOrder.value = true;
  localCategoryList.value = deepCopyCategories(categoryList.value);
};

/**
 * 保存顺序
 */
const saveOrder = async () => {
  const sortItems = collectSortItems(localCategoryList.value);

  try {
    await api.post("/api/category/sort", { items: sortItems });
    ElMessage.success("顺序保存成功");
    isEditingOrder.value = false;
    await fetchCategories();
  } catch (error: any) {
    ElMessage.error(error.message || "保存失败");
  }
};

/**
 * 获取分类列表
 */
const fetchCategories = async () => {
  try {
    const res = await api.get("/api/category");
    if (res.success) {
      categoryList.value = res.data.categories || [];
      localCategoryList.value = deepCopyCategories(categoryList.value);
    }
  } catch (error: any) {
    ElMessage.error(error.message || "获取分类失败");
  }
};

/**
 * 打开新增一级分类弹窗
 */
const openAddDialog = () => {
  isEdit.value = false;
  categoryForm.id = null;
  categoryForm.name = "";
  categoryForm.parent_id = null;
  dialogVisible.value = true;
};

/**
 * 打开新增子分类弹窗
 */
const openAddChildDialog = (parent: Category) => {
  isEdit.value = false;
  categoryForm.id = null;
  categoryForm.name = "";
  categoryForm.parent_id = parent.id;
  dialogVisible.value = true;
};

/**
 * 打开编辑弹窗
 */
const openEditDialog = (category: Category) => {
  isEdit.value = true;
  categoryForm.id = category.id;
  categoryForm.name = category.name;
  categoryForm.parent_id = category.parent_id;
  dialogVisible.value = true;
};

/**
 * 提交分类
 */
const submitCategory = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  saving.value = true;
  try {
    if (isEdit.value && categoryForm.id) {
      await api.put(`/api/category/${categoryForm.id}`, {
        name: categoryForm.name,
      });
      ElMessage.success("修改成功");
    } else {
      const siblings = categoryForm.parent_id
        ? getSiblings({ id: 0, parent_id: categoryForm.parent_id } as CategoryWithSort)
        : localCategoryList.value.filter((c) => c.parent_id === null);
      await api.post("/api/category", {
        name: categoryForm.name,
        parent_id: categoryForm.parent_id,
        sort_order: siblings.length,
      });
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    await fetchCategories();
  } catch (error: any) {
    ElMessage.error(error.message || "操作失败");
  } finally {
    saving.value = false;
  }
};

/**
 * 删除分类
 */
const deleteCategory = async (category: Category) => {
  if (category.is_system) {
    ElMessage.warning("系统分类不能删除");
    return;
  }

  try {
    await ElMessageBox.confirm(
      "确定要删除该分类吗？如果有子分类或关联的消费记录，将无法删除。",
      "提示",
      { type: "warning" },
    );

    await api.delete(`/api/category/${category.id}`);
    ElMessage.success("删除成功");
    await fetchCategories();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除失败");
    }
  }
};

onMounted(() => {
  fetchCategories();
});
</script>

<style lang="scss" scoped>
.category-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 10px;
  }
}

.category-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .edit-tip {
      font-size: 12px;
      color: $primary;
    }
  }
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;

  .node-label {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .node-actions {
    display: none;
    align-items: center;
  }
}

.custom-tree-node:hover .node-actions {
  display: flex;
  gap: 4px;
}

:deep(.el-tree-node__content) {
  height: 36px;
}
</style>
