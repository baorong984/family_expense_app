<template>
  <div
    class="sidebar"
    :class="{ collapsed: isCollapsed, 'is-mobile': isMobile }"
  >
    <!-- Logo 区域 -->
    <div class="sidebar-logo">
      <transition name="logo-fade" mode="out-in">
        <div v-if="!isCollapsed" class="logo-text">
          <span class="logo-icon">🌿</span>
          <span class="logo-name">记账本</span>
        </div>
        <div v-else class="logo-icon-only">🌿</div>
      </transition>
    </div>

    <!-- 菜单 -->
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapsed && !isMobile"
      router
      class="sidebar-menu"
    >
      <el-menu-item index="/expense/create" @click="handleSelect">
        <el-icon><Edit /></el-icon>
        <template #title>
          <span>记账</span>
        </template>
      </el-menu-item>

      <el-menu-item index="/expense/history" @click="handleSelect">
        <el-icon><List /></el-icon>
        <template #title>
          <span>消费记录</span>
        </template>
      </el-menu-item>

      <el-menu-item index="/statistics" @click="handleSelect">
        <el-icon><DataAnalysis /></el-icon>
        <template #title>
          <span>统计分析</span>
        </template>
      </el-menu-item>

      <!-- 物品资产 -->
      <div class="menu-divider"></div>

      <el-sub-menu index="item">
        <template #title>
          <el-icon><Box /></el-icon>
          <span>物品资产</span>
        </template>
        <el-menu-item index="/item" @click="handleSelect">
          <el-icon><List /></el-icon>
          <template #title>
            <span>物品列表</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/item/category" @click="handleSelect">
          <el-icon><Grid /></el-icon>
          <template #title>
            <span>分类管理</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/item/stats" @click="handleSelect">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>
            <span>统计分析</span>
          </template>
        </el-menu-item>
      </el-sub-menu>

      <!-- 人情管理 -->
      <div class="menu-divider"></div>

      <el-menu-item index="/gift" @click="handleSelect">
        <el-icon><Present /></el-icon>
        <template #title>
          <span>人情记录</span>
        </template>
      </el-menu-item>

      <el-menu-item index="/gift/statistics" @click="handleSelect">
        <el-icon><Document /></el-icon>
        <template #title>
          <span>人情统计</span>
        </template>
      </el-menu-item>

      <!-- 车辆管理 -->
      <div class="menu-divider"></div>

      <el-menu-item index="/vehicle/fuel" @click="handleSelect">
        <el-icon><Van /></el-icon>
        <template #title>
          <span>加油/充电记录</span>
        </template>
      </el-menu-item>

      <el-menu-item index="/vehicle" @click="handleSelect">
        <el-icon><Setting /></el-icon>
        <template #title>
          <span>车辆管理</span>
        </template>
      </el-menu-item>

      <!-- 管理员菜单 -->
      <template v-if="userStore.isAdmin">
        <div class="menu-divider"></div>

        <el-menu-item index="/budget" @click="handleSelect">
          <el-icon><Wallet /></el-icon>
          <template #title>
            <span>预算管理</span>
          </template>
        </el-menu-item>

        <el-menu-item index="/category" @click="handleSelect">
          <el-icon><Grid /></el-icon>
          <template #title>
            <span>分类管理</span>
          </template>
        </el-menu-item>

        <el-menu-item index="/member" @click="handleSelect">
          <el-icon><User /></el-icon>
          <template #title>
            <span>成员管理</span>
          </template>
        </el-menu-item>
      </template>
    </el-menu>

    <!-- 底部状态 -->
    <div v-if="!isCollapsed && !isMobile" class="sidebar-footer">
      <div class="tip-card">
        <span class="tip-icon">💡</span>
        <span class="tip-text">AI 智能记账</span>
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
.sidebar {
  width: $sidebar-width;
  height: calc(100% - #{$spacing-xl});
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  -webkit-backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  box-shadow: $glass-shadow;
  margin: $spacing-md 0 $spacing-md $spacing-md;
  transition: width $transition-base, all $transition-base;
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
    background: $bg-white;
  }
}

// Logo
.sidebar-logo {
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
  background: linear-gradient(180deg, rgba($bg-light, 0.4) 0%, rgba($bg-white, 0) 100%);
  transition: padding $transition-base;
  min-height: 72px;
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
    font-size: 24px;
    animation: bounce 3s ease-in-out infinite;
  }

  .logo-name {
    font-family: $font-display;
    font-size: 19px;
    font-weight: 800;
    background: $gradient-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.5px;
  }
}

.logo-icon-only {
  display: flex;
  justify-content: center;
  font-size: 24px;
}

// 菜单
.sidebar-menu {
  flex: 1;
  border-right: none;
  background: transparent;
  padding: $spacing-md 0;
  overflow-y: auto;
  overflow-x: hidden;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    color: $text-secondary;
    border-radius: $border-radius;
    margin: 6px 14px;
    height: 46px;
    transition: all $transition-base;
    font-weight: 500;

    .el-icon {
      font-size: 18px;
      transition: transform $transition-base;
    }

    &:hover {
      color: $primary-dark;
      background: rgba($primary, 0.08);
      
      .el-icon {
        transform: scale(1.1);
      }
    }
  }

  :deep(.el-menu-item.is-active) {
    color: white;
    background: $gradient-primary;
    box-shadow: 0 4px 12px rgba(78, 205, 196, 0.25);

    .el-icon {
      color: white;
      background: $gradient-primary;
      box-shadow: 0 4px 14px rgba($primary, 0.25);
      font-weight: 600;

      .el-icon {
        color: white;
        transform: scale(1.1);
      }
    }
  }

    // 移动端样式
    .is-mobile & {
      margin: 4px 16px;
      height: 48px;
    }
  }

  :deep(.el-menu--collapse) {
    width: 100%;

    .el-menu-item {
      padding: 0 !important;
      text-align: center;
    }
  }
}

.menu-divider {
  height: 1px;
  background: $border-color;
  margin: $spacing-md $spacing-xl;
  transition: margin $transition-base;

  .is-mobile & {
    margin: $spacing-sm $spacing-mobile-lg;
  }
}

// 底部
.sidebar-footer {
  padding: $spacing-md;
  border-top: 1px solid $border-color;

  .tip-card {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md;
    background: linear-gradient(
      135deg,
      rgba($primary, 0.08) 0%,
      rgba($secondary, 0.08) 100*1%
    );
    border-radius: $border-radius;
    border: 1px solid rgba($primary, 0.1);

    .tip-icon {
      font-size: 16px;
    }

    .tip-text {
      font-size: 12px;
      color: $primary-dark;
      font-weight: 600;
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
