<template>
  <div class="item-detail-page" v-loading="itemStore.loading">
    <el-card v-if="item">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button link @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <span class="item-title">{{ item.name }}</span>
            <el-tag
              :color="itemStore.statusColor(item.status)"
              effect="dark"
              size="small"
            >
              {{ itemStore.statusText(item.status) }}
            </el-tag>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleStatusChange" trigger="click">
              <el-button>
                变更状态 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="status in availableStatuses"
                    :key="status.value"
                    :command="status.value"
                    :disabled="status.disabled"
                  >
                    <el-tag
                      :color="itemStore.statusColor(status.value)"
                      size="small"
                      effect="dark"
                    >
                      {{ status.label }}
                    </el-tag>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="primary" @click="goToEdit">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" @click="handleDelete">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
      </template>

      <div class="detail-content">
        <div class="main-info">
          <div class="cpd-card">
            <div class="cpd-header">
              <div class="emoji-icon">
                {{ item.emoji || recommend_emoji(item.name) }}
              </div>
              <div class="cpd-title">日均成本 (CPD)</div>
            </div>
            <div class="cpd-value" v-if="item.cpd">
              <span class="amount">{{ item.cpd.toFixed(2) }}</span>
              <span class="unit">元/天</span>
            </div>
            <div class="cpd-value" v-else>
              <span class="amount">--</span>
            </div>
            <div class="usage-info" v-if="item.usage_days">
              已陪伴你 <span class="days">{{ item.usage_days }}</span> 天
            </div>
            <div class="usage-info" v-else>暂无使用记录</div>
          </div>
        </div>

        <el-divider />

        <div class="info-section">
          <h3>基本信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="物品名称">{{
              item.name
            }}</el-descriptions-item>
            <el-descriptions-item label="分类">
              {{ item.category_name || "未分类" }}
            </el-descriptions-item>
            <el-descriptions-item label="品牌">{{
              item.brand || "-"
            }}</el-descriptions-item>
            <el-descriptions-item label="型号">{{
              item.model || "-"
            }}</el-descriptions-item>
            <el-descriptions-item label="序列号">{{
              item.serial_number || "-"
            }}</el-descriptions-item>
            <el-descriptions-item label="存放位置">{{
              item.storage_location || "-"
            }}</el-descriptions-item>
            <el-descriptions-item label="预期寿命">
              {{
                item.expected_lifespan ? `${item.expected_lifespan} 个月` : "-"
              }}
            </el-descriptions-item>
            <el-descriptions-item label="保修截止">
              {{ item.warranty_end_date || "-" }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="info-section">
          <h3>购买信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="购买日期">
              {{ item.purchase_date || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="购买金额">
              <span v-if="item.purchase_amount" class="money">
                {{ formatMoney(item.purchase_amount) }}
              </span>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="购买渠道">{{
              item.purchase_channel || "-"
            }}</el-descriptions-item>
            <el-descriptions-item label="开始使用">
              {{ item.start_use_date || "-" }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="info-section" v-if="item.status === 'retired'">
          <h3>退役信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="退役日期">{{
              item.end_use_date || "-"
            }}</el-descriptions-item>
            <el-descriptions-item label="退役方式">{{
              getRetireTypeText(item.retire_type)
            }}</el-descriptions-item>
            <el-descriptions-item label="退役原因" :span="2">{{
              item.retire_reason || "-"
            }}</el-descriptions-item>
            <el-descriptions-item
              label="出售金额"
              v-if="item.retire_type === 'sold'"
            >
              {{ item.retire_amount ? formatMoney(item.retire_amount) : "-" }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="info-section" v-if="item.notes">
          <h3>备注</h3>
          <div class="notes-content">{{ item.notes }}</div>
        </div>

        <div class="info-section" v-if="item.tags && item.tags.length > 0">
          <h3>标签</h3>
          <div class="tags-list">
            <el-tag v-for="tag in item.tags" :key="tag" type="info">{{
              tag
            }}</el-tag>
          </div>
        </div>

        <div class="info-section">
          <div class="section-header">
            <h3>时间轴</h3>
            <el-button type="primary" size="small" @click="showAddEventDialog">
              <el-icon><Plus /></el-icon>
              添加事件
            </el-button>
          </div>
          <el-timeline v-if="item.events && item.events.length > 0">
            <el-timeline-item
              v-for="event in item.events"
              :key="event.id"
              :timestamp="event.event_date"
              placement="top"
              :type="getEventColor(event.event_type)"
            >
              <el-card>
                <div class="event-content">
                  <div class="event-title">
                    {{ event.title || getEventTypeName(event.event_type) }}
                  </div>
                  <div class="event-description" v-if="event.description">
                    {{ event.description }}
                  </div>
                  <div class="event-amount" v-if="event.amount">
                    金额: {{ formatMoney(event.amount) }}
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无事件记录" />
        </div>
      </div>
    </el-card>

    <el-dialog v-model="eventDialogVisible" title="添加事件" width="500px">
      <el-form :model="eventForm" label-width="80px">
        <el-form-item label="事件类型" required>
          <el-select v-model="eventForm.event_type" placeholder="选择事件类型">
            <el-option label="维修" value="repair" />
            <el-option label="配件" value="accessory" />
            <el-option label="闲置" value="idle" />
            <el-option label="退役" value="retire" />
            <el-option label="备注" value="note" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件日期" required>
          <el-date-picker
            v-model="eventForm.event_date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="eventForm.title" placeholder="事件标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="eventForm.description"
            type="textarea"
            :rows="3"
            placeholder="事件描述"
          />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number
            v-model="eventForm.amount"
            :precision="2"
            :min="0"
            placeholder="相关金额"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="eventDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleAddEvent"
          :loading="eventLoading"
          >确定</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Edit,
  Delete,
  Picture,
  Plus,
  ArrowDown,
} from "@element-plus/icons-vue";
import {
  useItemStore,
  type Item,
  type ItemEvent,
  type ItemStatus,
} from "~/stores/item";
import { recommend_emoji } from "~/utils/emoji";

definePageMeta({
  layout: "default",
  middleware: "auth",
});

const route = useRoute();
const router = useRouter();
const itemStore = useItemStore();

const item = ref<Item | null>(null);
const loading = ref(true);
const currentImage = ref("");

const eventDialogVisible = ref(false);
const eventLoading = ref(false);
const eventForm = ref({
  event_type: "note" as ItemEvent["event_type"],
  event_date: "",
  title: "",
  description: "",
  amount: null as number | null,
});

/**
 * 可用的状态列表
 */
const availableStatuses = computed(() => {
  if (!item.value) return [];

  const allStatuses = [
    { value: "wish", label: "想买" },
    { value: "purchased", label: "购入" },
    { value: "in_use", label: "使用中" },
    { value: "repair", label: "维修" },
    { value: "idle", label: "闲置" },
    { value: "retired", label: "退役" },
  ];

  const validTransitions: Record<string, string[]> = {
    wish: ["purchased"],
    purchased: ["in_use", "idle", "retired"],
    in_use: ["repair", "idle", "retired"],
    repair: ["in_use", "idle", "retired"],
    idle: ["in_use", "repair", "retired"],
    retired: [],
  };

  const currentStatus = item.value.status;
  const validNextStatuses = validTransitions[currentStatus] || [];

  return allStatuses.map((status) => ({
    ...status,
    disabled:
      status.value === currentStatus ||
      !validNextStatuses.includes(status.value),
  }));
});

/**
 * 格式化金额
 */
const formatMoney = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "¥0.00";
  return `¥${amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * 获取退役方式文本
 */
const getRetireTypeText = (type: string | null): string => {
  const texts: Record<string, string> = {
    sold: "出售",
    gifted: "赠送",
    discarded: "丢弃",
    lost: "丢失",
  };
  return type ? texts[type] || type : "-";
};

/**
 * 获取事件类型名称
 */
const getEventTypeName = (type: string): string => {
  const names: Record<string, string> = {
    purchase: "购入",
    start_use: "开始使用",
    repair: "维修",
    accessory: "配件",
    idle: "闲置",
    retire: "退役",
    note: "备注",
  };
  return names[type] || type;
};

/**
 * 获取事件颜色
 */
const getEventColor = (type: string): string => {
  const colors: Record<string, string> = {
    purchase: "primary",
    start_use: "success",
    repair: "warning",
    accessory: "info",
    idle: "danger",
    retire: "info",
    note: "",
  };
  return colors[type] || "";
};

/**
 * 获取物品详情
 */
const fetchItem = async () => {
  const itemId = parseInt(route.params.id as string);
  if (!itemId) {
    ElMessage.error("物品ID无效");
    goBack();
    return;
  }

  loading.value = true;
  try {
    item.value = await itemStore.fetchItem(itemId);
    if (item.value?.images && item.value.images.length > 0) {
      currentImage.value = item.value.images[0];
    }
  } catch (error: any) {
    ElMessage.error(error.message || "获取物品详情失败");
    goBack();
  } finally {
    loading.value = false;
  }
};

/**
 * 返回列表
 */
const goBack = () => {
  router.push("/item");
};

/**
 * 跳转到编辑页
 */
const goToEdit = () => {
  router.push(`/item/create?id=${route.params.id}`);
};

/**
 * 删除物品
 */
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个物品吗？删除后无法恢复。",
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    await itemStore.deleteItem(parseInt(route.params.id as string));
    ElMessage.success("删除成功");
    goBack();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除失败");
    }
  }
};

/**
 * 变更物品状态
 */
const handleStatusChange = async (status: ItemStatus) => {
  if (!item.value) return;

  try {
    await ElMessageBox.confirm(
      `确定要将物品状态变更为"${itemStore.statusText(status)}"吗？`,
      "状态变更确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info",
      },
    );

    const api = useApi();
    await api.put(`/api/item/${item.value.id}/status`, { status });
    ElMessage.success("状态变更成功");
    await fetchItem();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "状态变更失败");
    }
  }
};

/**
 * 显示添加事件弹窗
 */
const showAddEventDialog = () => {
  eventForm.value = {
    event_type: "note",
    event_date: new Date().toISOString().split("T")[0],
    title: "",
    description: "",
    amount: null,
  };
  eventDialogVisible.value = true;
};

/**
 * 添加事件
 */
const handleAddEvent = async () => {
  if (!eventForm.value.event_type || !eventForm.value.event_date) {
    ElMessage.warning("请填写必填项");
    return;
  }

  eventLoading.value = true;
  try {
    await itemStore.addItemEvent(
      parseInt(route.params.id as string),
      eventForm.value,
    );
    ElMessage.success("事件添加成功");
    eventDialogVisible.value = false;
    await fetchItem();
  } catch (error: any) {
    ElMessage.error(error.message || "添加事件失败");
  } finally {
    eventLoading.value = false;
  }
};

onMounted(() => {
  fetchItem();
});
</script>

<style scoped lang="scss">
.item-detail-page {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      gap: 15px;

      .item-title {
        font-size: 18px;
        font-weight: 500;
      }
    }

    .header-right {
      display: flex;
      gap: 10px;
    }
  }

  .detail-content {
    .main-info {
      display: flex;
      justify-content: center;

      .cpd-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 24px;
        color: white;
        text-align: center;
        max-width: 400px;
        width: 100%;

        .cpd-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;

          .emoji-icon {
            font-size: 48px;
            line-height: 1;
          }

          .cpd-title {
            font-size: 16px;
            opacity: 0.9;
          }
        }

        .cpd-value {
          .amount {
            font-size: 42px;
            font-weight: bold;
          }

          .unit {
            font-size: 14px;
            margin-left: 5px;
          }
        }

        .usage-info {
          margin-top: 16px;
          font-size: 14px;
          opacity: 0.9;

          .days {
            font-size: 18px;
            font-weight: bold;
          }
        }
      }
    }

    .info-section {
      margin-top: 20px;

      h3 {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #ebeef5;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #ebeef5;

        h3 {
          margin: 0;
          padding: 0;
          border: none;
        }
      }

      .money {
        color: #f56c6c;
        font-weight: 500;
      }

      .notes-content {
        padding: 15px;
        background: #f5f7fa;
        border-radius: 4px;
        line-height: 1.6;
      }

      .tags-list {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .event-content {
        .event-title {
          font-weight: 500;
          margin-bottom: 5px;
        }

        .event-description {
          font-size: 14px;
          color: #606266;
          margin-bottom: 5px;
        }

        .event-amount {
          font-size: 14px;
          color: #f56c6c;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .item-detail-page {
    .detail-content .main-info {
      grid-template-columns: 1fr;
    }
  }
}
</style>

<style lang="scss">
/**
 * 修复 el-descriptions 白色背景白色字体问题
 */
.item-detail-page {
  .el-descriptions {
    .el-descriptions__body {
      .el-descriptions__table {
        .el-descriptions__cell {
          color: #606266;
          background-color: #fff;
        }

        .el-descriptions__label {
          color: #909399;
          background-color: #fafafa;
        }
      }
    }
  }
}
</style>
