<template>
  <div
    class="sidebar ac-sidebar"
    :class="{ collapsed: isCollapsed, 'is-mobile': isMobile }"
  >
    <!-- Logo 区域 -->
    <div class="sidebar-logo ac-sidebar-logo">
      <transition name="logo-fade" mode="out-in">
        <div v-if="!isCollapsed" class="logo-text">
          <span class="logo-icon">📱</span>
          <span class="logo-name">Nook Apps</span>
        </div>
        <div v-else class="logo-icon-only">🍃</div>
      </transition>
    </div>

    <!-- 菜单 -->
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapsed && !isMobile"
      router
      class="sidebar-menu ac-sidebar-menu"
    >
      <el-menu-item index="/expense/create" @click="handleSelect">
        <el-icon><Edit /></el-icon>
        <template #title>
          <span>快速记账</span>
        </template>
      </el-menu-item>

      <el-menu-item index="/expense/history" @click="handleSelect">
        <el-icon><List /></el-icon>
        <template #title>
          <span>账册明细</span>
        </template>
      </el-menu-item>

      <el-menu-item index="/statistics" @click="handleSelect">
        <el-icon><DataAnalysis /></el-icon>
        <template #title>
          <span>生活统计</span>
        </template>
      </el-menu-item>

      <!-- 物品资产 -->
      <div class="menu-divider ac-divider"></div>

      <el-sub-menu index="item">
        <template #title>
          <el-icon><Box /></el-icon>
          <span>岛屿物资</span>
        </template>
        <el-menu-item index="/item" @click="handleSelect">
          <el-icon><List /></el-icon>
          <template #title>
            <span>物品图鉴</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/item/category" @click="handleSelect">
          <el-icon><Grid /></el-icon>
          <template #title>
            <span>分类分类</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/item/stats" @click="handleSelect">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>
            <span>物资分析</span>
          </template>
        </el-menu-item>
      </el-sub-menu>

      <!-- 人情管理 -->
      <div class="menu-divider ac-divider"></div>

      <el-menu-item index="/gift" @click="handleSelect">
        <el-icon><Present /></el-icon>
        <template #title>
          <span>居民礼尚</span>
        </template>
      </el-menu-item>

      <el-menu-item index="/gift/statistics" @click="handleSelect">
        <el-icon><Document /></el-icon>
        <template #title>
          <span>礼尚统计</span>
        </template>
      </el-menu-item>

      <!-- 车辆管理 -->
      <div class="menu-divider ac-divider"></div>

      <el-menu-item index="/vehicle/fuel" @click="handleSelect">
        <el-icon><Van /></el-icon>
        <template #title>
          <span>载具加油/充电</span>
        </template>
      </el-menu-item>

      <el-menu-item index="/vehicle" @click="handleSelect">
        <el-icon><Setting /></el-icon>
        <template #title>
          <span>载具管理</span>
        </template>
      </el-menu-item>

      <!-- 管理员菜单 -->
      <template v-if="userStore.isAdmin">
        <div class="menu-divider ac-divider"></div>

        <el-menu-item index="/budget" @click="handleSelect">
          <el-icon><Wallet /></el-icon>
          <template #title>
            <span>预算规划</span>
          </template>
        </el-menu-item>

        <el-menu-item index="/category" @click="handleSelect">
          <el-icon><Grid /></el-icon>
          <template #title>
            <span>科目配置</span>
          </template>
        </el-menu-item>

        <el-menu-item index="/member" @click="handleSelect">
          <el-icon><User /></el-icon>
          <template #title>
            <span>居民管理</span>
          </template>
        </el-menu-item>
      </template>
    </el-menu>

    <!-- 底部状态 -->
    <div v-if="!isCollapsed && !isMobile" class="sidebar-footer ac-sidebar-footer">
      <div class="tip-card ac-tip-card">
        <span class="tip-icon">🍃</span>
        <span class="tip-text">狸克 AI 助手在线</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Edit,
  List,
  DataAnalysis,
  Wallet,
  Grid,
  User,
  Present,
  Document,
  Van,
  Setting,
  Box,
} from "@element-plus/icons-vue";

const props = defineProps<{
  isCollapsed: boolean;
  isMobile?: boolean;
}>();

const emit = defineEmits<{
  select: [];
}>();

const route = useRoute();
const userStore = useUserStore();

const activeMenu = computed(() => {
  return route.path;
});

const handleSelect = () => {
  emit("select");
};
</script>

<style lang="scss" scoped>
.sidebar.ac-sidebar {
  width: $sidebar-width;
  height: calc(100% - #{$spacing-xl});
  background: var(--ac-bg-bar, #FAF8ED);
  border: 3px solid var(--ac-border, #E8DFCC);
  border-radius: 26px;
  box-shadow: 0 6px 0 var(--ac-shadow);
  margin: $spacing-md 0 $spacing-md $spacing-md;
  transition: width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), all 0.25s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 10;

  &.collapsed {
    width: $sidebar-collapsed-width;

    .sidebar-logo {
      padding: $spacing-md $spacing-sm;
    }

    .sidebar-menu {
      :deep(.el-menu-item) {
        margin: 6px 8px;
        padding: 0 !important;
        justify-content: center;
      }
    }

    .menu-divider {
      margin: $spacing-md $spacing-md;
    }
  }

  &.is-mobile {
    width: 100%;
    height: 100%;
    margin: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
    background: var(--ac-bg-bar, #FAF8ED);
  }
}

// Logo
.sidebar-logo.ac-sidebar-logo {
  padding: $spacing-md $spacing-lg;
  border-bottom: 2px dashed var(--ac-border, #E8DFCC);
  background: var(--ac-bg-page, #F6F5E8);
  transition: padding $transition-base;
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  white-space: nowrap;

  .logo-icon {
    font-size: 22px;
  }

  .logo-name {
    font-family: $font-display;
    font-size: 18px;
    font-weight: 800;
    color: var(--ac-text-primary, #5D4037);
    letter-spacing: 0.5px;
  }
}

.logo-icon-only {
  display: flex;
  justify-content: center;
  font-size: 22px;
}

// 菜单
.sidebar-menu.ac-sidebar-menu {
  flex: 1;
  border-right: none;
  background: transparent;
  padding: $spacing-sm 0;
  overflow-y: auto;
  overflow-x: hidden;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    color: var(--ac-text-primary, #5D4037);
    border-radius: 18px;
    margin: 6px 14px;
    height: 46px;
    transition: all $transition-base;
    font-weight: 700;
    font-family: $font-display;
    border: 2px solid transparent;

    .el-icon {
      font-size: 18px;
      color: var(--ac-text-secondary, #7B5E43);
      transition: transform $transition-base;
    }

    &:hover {
      color: #59C990;
      background: rgba(89, 201, 144, 0.15);
      border-color: #59C990;
      transform: translateY(-2px);
      
      .el-icon {
        transform: scale(1.15) rotate(-6deg);
        color: #59C990;
      }
    }
  }

  :deep(.el-menu-item.is-active) {
    color: #FFFFFF !important;
    background: #59C990 !important;
    border: 2px solid #3B9264 !important;
    box-shadow: 0 4px 0 #3B9264 !important;

    .el-icon {
      color: #FFFFFF !important;
    }

    span {
      color: #FFFFFF !important;
    }
  }

  :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: #59C990;
    background: rgba(89, 201, 144, 0.15);
    border-color: #59C990;
  }

  :deep(.el-menu--collapse) {
    width: 100%;

    .el-menu-item {
      padding: 0 !important;
      text-align: center;
    }
  }
}

.menu-divider.ac-divider {
  height: 2px;
  background: var(--ac-border, #E8DFCC);
  border-radius: 2px;
  margin: 10px 20px;
}

// 底部
.sidebar-footer.ac-sidebar-footer {
  padding: $spacing-md;
  border-top: 2px dashed var(--ac-border, #E8DFCC);
  background: var(--ac-bg-page, #F6F5E8);

  .tip-card.ac-tip-card {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: 10px 14px;
    background: var(--ac-bg-card, #FFFFFF);
    border-radius: 18px;
    border: 2px solid #59C990;
    box-shadow: 0 3px 0 rgba(89, 201, 144, 0.3);

    .tip-icon {
      font-size: 18px;
    }

    .tip-text {
      font-family: $font-display;
      font-size: 13px;
      color: #59C990;
      font-weight: 800;
    }
  }
}

// Logo 过渡动画
.logo-fade-enter-active,
.logo-fade-leave-active {
  transition: all $transition-base;
}

.logo-fade-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.logo-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
