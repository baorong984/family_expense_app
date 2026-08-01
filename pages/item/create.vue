<template>
  <div class="item-form-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-button link @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <span class="title">{{ isEdit ? "编辑物品" : "添加物品" }}</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="item-form"
        v-loading="loading"
      >
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="物品图标" prop="emoji">
          <div class="emoji-selector">
            <div class="emoji-preview" @click="showEmojiPicker">
              {{ form.emoji || "📦" }}
            </div>
            <el-button size="small" @click="showEmojiPicker">
              {{ form.emoji ? "更换" : "选择" }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="物品名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入物品名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="物品分类" prop="category_id">
          <el-tree-select
            v-model="form.category_id"
            :data="itemStore.categoryTree"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="选择分类"
            clearable
            check-strictly
            filterable
          />
        </el-form-item>

        <el-form-item label="物品状态" prop="status">
          <el-select v-model="form.status" placeholder="选择状态">
            <el-option label="想买" value="wish" />
            <el-option label="购入" value="purchased" />
            <el-option label="使用中" value="in_use" />
            <el-option label="维修" value="repair" />
            <el-option label="闲置" value="idle" />
            <el-option label="退役" value="retired" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">购买信息</el-divider>

        <el-form-item label="购买日期" prop="purchase_date">
          <el-date-picker
            v-model="form.purchase_date"
            type="date"
            placeholder="选择购买日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="购买金额" prop="purchase_amount">
          <el-input-number
            v-model="form.purchase_amount"
            :precision="2"
            :min="0"
            placeholder="请输入购买金额"
          />
        </el-form-item>

        <el-form-item label="购买渠道" prop="purchase_channel">
          <el-input
            v-model="form.purchase_channel"
            placeholder="如：京东、淘宝、线下门店等"
            maxlength="100"
          />
        </el-form-item>

        <el-form-item label="开始使用" prop="start_use_date">
          <el-date-picker
            v-model="form.start_use_date"
            type="date"
            placeholder="选择开始使用日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-divider content-position="left">物品详情</el-divider>

        <el-form-item label="品牌" prop="brand">
          <el-input
            v-model="form.brand"
            placeholder="品牌名称"
            maxlength="50"
          />
        </el-form-item>

        <el-form-item label="型号" prop="model">
          <el-input v-model="form.model" placeholder="型号" maxlength="100" />
        </el-form-item>

        <el-form-item label="序列号" prop="serial_number">
          <el-input
            v-model="form.serial_number"
            placeholder="序列号/SN码"
            maxlength="100"
          />
        </el-form-item>

        <el-form-item label="存放位置" prop="storage_location">
          <el-input
            v-model="form.storage_location"
            placeholder="如：卧室、书房等"
            maxlength="100"
          />
        </el-form-item>

        <el-form-item label="预期寿命" prop="expected_lifespan">
          <el-input-number
            v-model="form.expected_lifespan"
            :min="1"
            :max="600"
            placeholder="预期使用寿命"
          />
          <span class="form-tip">月</span>
        </el-form-item>

        <el-form-item label="保修截止" prop="warranty_end_date">
          <el-date-picker
            v-model="form.warranty_end_date"
            type="date"
            placeholder="选择保修截止日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-divider content-position="left" v-if="form.status === 'retired'"
          >退役信息</el-divider
        >

        <template v-if="form.status === 'retired'">
          <el-form-item label="退役日期" prop="end_use_date">
            <el-date-picker
              v-model="form.end_use_date"
              type="date"
              placeholder="选择退役日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <el-form-item label="退役方式" prop="retire_type">
            <el-select v-model="form.retire_type" placeholder="选择退役方式">
              <el-option label="出售" value="sold" />
              <el-option label="赠送" value="gifted" />
              <el-option label="丢弃" value="discarded" />
              <el-option label="丢失" value="lost" />
            </el-select>
          </el-form-item>

          <el-form-item label="退役原因" prop="retire_reason">
            <el-input
              v-model="form.retire_reason"
              type="textarea"
              :rows="2"
              placeholder="退役原因"
            />
          </el-form-item>

          <el-form-item
            label="出售金额"
            prop="retire_amount"
            v-if="form.retire_type === 'sold'"
          >
            <el-input-number
              v-model="form.retire_amount"
              :precision="2"
              :min="0"
              placeholder="出售金额"
            />
          </el-form-item>
        </template>

        <el-divider content-position="left">其他信息</el-divider>

        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="3"
            placeholder="备注信息"
          />
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签后按回车添加"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? "保存修改" : "创建物品" }}
          </el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-dialog
      v-model="emojiPickerVisible"
      title="选择物品图标"
      width="500px"
      :close-on-click-modal="false"
    >
      <ItemEmojiPicker v-model="form.emoji" />
      <template #footer>
        <el-button @click="emojiPickerVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import { useItemStore, type ItemStatus } from "~/stores/item";

definePageMeta({
  layout: "default",
  middleware: "auth",
});

const route = useRoute();
const router = useRouter();
const itemStore = useItemStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const submitting = ref(false);
const emojiPickerVisible = ref(false);

/**
 * 判断是否为编辑模式
 * 支持两种方式：
 * 1. 路由参数：/item/:id/edit
 * 2. Query参数：/item/create?id=xxx
 */
const isEdit = computed(() => {
  const paramsId = route.params.id;
  const queryId = route.query.id;
  return !!(paramsId || queryId);
});

/**
 * 获取物品ID
 */
const itemId = computed(() => {
  const paramsId = route.params.id;
  const queryId = route.query.id;
  return paramsId
    ? parseInt(paramsId as string)
    : queryId
      ? parseInt(queryId as string)
      : null;
});

const form = reactive({
  name: "",
  category_id: null as number | null,
  status: "purchased" as ItemStatus,
  purchase_date: "",
  purchase_amount: null as number | null,
  purchase_channel: "",
  brand: "",
  model: "",
  serial_number: "",
  storage_location: "",
  expected_lifespan: null as number | null,
  warranty_end_date: "",
  start_use_date: "",
  end_use_date: "",
  retire_reason: "",
  retire_type: "" as "sold" | "gifted" | "discarded" | "lost" | "",
  retire_amount: null as number | null,
  emoji: null as string | null,
  notes: "",
  tags: [] as string[],
});

const rules: FormRules = {
  name: [
    { required: true, message: "请输入物品名称", trigger: "blur" },
    { max: 100, message: "物品名称不能超过100个字符", trigger: "blur" },
  ],
};

/**
 * 获取物品详情（编辑模式）
 */
const fetchItem = async () => {
  if (!isEdit.value || !itemId.value) return;

  loading.value = true;

  try {
    const item = await itemStore.fetchItem(itemId.value);
    if (item) {
      Object.assign(form, {
        name: item.name,
        category_id: item.category_id,
        status: item.status,
        purchase_date: item.purchase_date || "",
        purchase_amount: item.purchase_amount,
        purchase_channel: item.purchase_channel || "",
        brand: item.brand || "",
        model: item.model || "",
        serial_number: item.serial_number || "",
        storage_location: item.storage_location || "",
        expected_lifespan: item.expected_lifespan,
        warranty_end_date: item.warranty_end_date || "",
        start_use_date: item.start_use_date || "",
        end_use_date: item.end_use_date || "",
        retire_reason: item.retire_reason || "",
        retire_type: item.retire_type || "",
        retire_amount: item.retire_amount,
        emoji: item.emoji || null,
        notes: item.notes || "",
        tags: item.tags || [],
      });
    }
  } catch (error: any) {
    ElMessage.error(error.message || "获取物品详情失败");
    goBack();
  } finally {
    loading.value = false;
  }
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
      const data = { ...form };

      // 确保tags是字符串数组
      if (data.tags && Array.isArray(data.tags)) {
        data.tags = data.tags.map((tag) => String(tag));
      } else if (data.tags) {
        data.tags = [String(data.tags)];
      } else {
        data.tags = [];
      }

      if (isEdit.value && itemId.value) {
        await itemStore.updateItem(itemId.value, data);
        ElMessage.success("修改成功");
      } else {
        await itemStore.createItem(data);
        ElMessage.success("创建成功");
      }

      router.push("/item");
    } catch (error: any) {
      ElMessage.error(
        error.message || (isEdit.value ? "修改失败" : "创建失败"),
      );
    } finally {
      submitting.value = false;
    }
  });
};

/**
 * 返回列表
 */
const goBack = () => {
  router.push("/item");
};

/**
 * 显示emoji选择器
 */
const showEmojiPicker = () => {
  emojiPickerVisible.value = true;
};

onMounted(async () => {
  await itemStore.fetchCategories();
  await fetchItem();
});
</script>

<style scoped lang="scss">
.item-form-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;

  .card-header {
    display: flex;
    align-items: center;
    gap: 15px;

    .title {
      font-size: 18px;
      font-weight: 500;
    }
  }

  .item-form {
    .form-tip {
      margin-left: 10px;
      color: #909399;
    }

    .emoji-selector {
      display: flex;
      align-items: center;
      gap: 12px;

      .emoji-preview {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        }
      }
    }
  }
}
</style>
