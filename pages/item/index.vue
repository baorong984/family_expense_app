<template>
  <div class="item-list-page">
    <el-card class="stats-card">
      <template #header>
        <div class="card-header">
          <span>资产总览</span>
          <el-button type="primary" @click="goToCreate">
            <el-icon><Plus /></el-icon>
            添加物品
          </el-button>
        </div>
      </template>

      <div class="stats-grid" v-if="itemStore.stats">
        <div class="stat-item">
          <div class="stat-value">{{ itemStore.stats.total_items }}</div>
          <div class="stat-label">物品总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            {{ formatMoney(itemStore.stats.total_value) }}
          </div>
          <div class="stat-label">资产总值</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ itemStore.stats.in_use_count }}</div>
          <div class="stat-label">使用中</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            {{ formatCpd(itemStore.stats.avg_cpd) }}
          </div>
          <div class="stat-label">平均日均成本</div>
        </div>
      </div>
    </el-card>

    <el-card class="filter-card">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            placeholder="全部状态"
            clearable
            @change="handleFilter"
          >
            <el-option label="想买" value="wish" />
            <el-option label="购入" value="purchased" />
            <el-option label="使用中" value="in_use" />
            <el-option label="维修" value="repair" />
            <el-option label="闲置" value="idle" />
            <el-option label="退役" value="retired" />
          </el-select>
        </el-form-item>

        <el-form-item label="分类">
          <el-tree-select
            v-model="filters.category_id"
            :data="itemStore.categoryTree"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="全部分类"
            clearable
            check-strictly
            @change="handleFilter"
          />
        </el-form-item>

        <el-form-item label="搜索">
          <el-input
            v-model="filters.search"
            placeholder="搜索物品名称/品牌/型号"
            clearable
            @keyup.enter="handleFilter"
            @clear="handleFilter"
          >
            <template #append>
              <el-button :icon="Search" @click="handleFilter" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="排序">
          <el-select v-model="sortBy" @change="handleFilter">
            <el-option label="创建时间" value="created_at" />
            <el-option label="购买日期" value="purchase_date" />
            <el-option label="购买金额" value="purchase_amount" />
            <el-option label="物品名称" value="name" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-card" v-loading="itemStore.loading">
      <div class="item-grid" v-if="itemStore.items.length > 0">
        <div
          v-for="item in itemStore.items"
          :key="item.id"
          class="item-card"
          @click="goToDetail(item.id)"
        >
          <div class="item-header">
            <div class="emoji-icon">
              {{ item.emoji || recommend_emoji(item.name) }}
            </div>
            <div class="item-basic">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-category" v-if="item.category_name">
                <el-icon><Folder /></el-icon>
                {{ item.category_name }}
              </div>
            </div>
            <el-tag
              :color="itemStore.statusColor(item.status)"
              size="small"
              effect="dark"
              class="status-tag"
            >
              {{ itemStore.statusText(item.status) }}
            </el-tag>
          </div>

          <div class="item-details">
            <div class="detail-row" v-if="item.purchase_amount">
              <span class="detail-label">购入金额</span>
              <span class="detail-value price">{{
                formatMoney(item.purchase_amount)
              }}</span>
            </div>
            <div class="detail-row" v-if="item.usage_days">
              <span class="detail-label">使用天数</span>
              <span class="detail-value">{{ item.usage_days }} 天</span>
            </div>
            <div class="detail-row" v-if="item.cpd">
              <span class="detail-label">日均成本</span>
              <span class="detail-value cpd"
                >{{ item.cpd.toFixed(2) }} 元/天</span
              >
            </div>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无物品记录">
        <el-button type="primary" @click="goToCreate">添加第一个物品</el-button>
      </el-empty>

      <div
        class="pagination-wrapper"
        v-if="itemStore.pagination.total_pages > 1"
      >
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="itemStore.pagination.page_size"
          :total="itemStore.pagination.total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Plus, Search, Picture, Folder } from "@element-plus/icons-vue";
import { useItemStore } from "~/stores/item";
import { recommend_emoji } from "~/utils/emoji";

definePageMeta({
  layout: "default",
  middleware: "auth",
});

const router = useRouter();
const itemStore = useItemStore();

const filters = reactive({
  status: "",
  category_id: null as number | null,
  search: "",
});

const sortBy = ref("created_at");
const currentPage = ref(1);

/**
 * 格式化金额
 */
const formatMoney = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "¥0.00";
  return `¥${amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * 格式化CPD（日均成本）
 */
const formatCpd = (cpd: number | null | undefined): string => {
  if (cpd === null || cpd === undefined || isNaN(Number(cpd))) return "0.00";
  return Number(cpd).toFixed(2);
};

/**
 * 获取物品列表
 */
const fetchItems = async () => {
  try {
    await itemStore.fetchItems({
      ...filters,
      page: currentPage.value,
      sort_by: sortBy.value,
      sort_order: "DESC",
    });
  } catch (error: any) {
    ElMessage.error(error.message || "获取物品列表失败");
  }
};

/**
 * 获取统计数据
 */
const fetchStats = async () => {
  try {
    await itemStore.fetchStats();
  } catch (error) {
    console.error("获取统计数据失败:", error);
  }
};

/**
 * 筛选处理
 */
const handleFilter = () => {
  currentPage.value = 1;
  fetchItems();
};

/**
 * 分页处理
 */
const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchItems();
};

/**
 * 跳转到详情页
 */
const goToDetail = (id: number) => {
  router.push(`/item/${id}`);
};

/**
 * 跳转到创建页
 */
const goToCreate = () => {
  router.push("/item/create");
};

onMounted(async () => {
  await itemStore.fetchCategories();
  await Promise.all([fetchItems(), fetchStats()]);
});
</script>

<style scoped lang="scss">
.item-list-page {
  padding: 20px;

  .stats-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;

      .stat-item {
        text-align: center;
        padding: $spacing-lg $spacing-md;
        background: var(--bg-card);
        border-radius: 8px;

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: $primary;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 5px;
        }
      }
    }
  }

  .filter-card {
    margin-bottom: 20px;

    .filter-form {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;

      .el-form-item {
        margin-bottom: 0;
      }

      .el-select,
      .el-tree-select {
        width: 180px;
      }
    }
  }

  .list-card {
    .item-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;

      .item-card {
        border: 1px solid #ebeef5;
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.3s;
        background: white;

        &:hover {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .item-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;

          .emoji-icon {
            font-size: 40px;
            line-height: 1;
            flex-shrink: 0;
          }

          .item-basic {
            flex: 1;
            min-width: 0;

            .item-name {
              font-size: 16px;
              font-weight: 500;
              margin-bottom: 4px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .item-category {
              font-size: 12px;
              color: #909399;
              display: flex;
              align-items: center;
              gap: 4px;
            }
          }

          .status-tag {
            flex-shrink: 0;
          }
        }

        .item-details {
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            font-size: 13px;

            &:not(:last-child) {
              border-bottom: 1px dashed #f0f0f0;
            }

            .detail-label {
              color: #909399;
            }

            .detail-value {
              font-weight: 500;
              color: #606266;

              &.price {
                color: #f56c6c;
                font-size: 15px;
              }

              &.cpd {
                color: #e6a23c;
              }
            }
          }
        }
      }
    }

    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }
}

@media (max-width: 768px) {
  .item-list-page {
    .stats-card .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .list-card .item-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
